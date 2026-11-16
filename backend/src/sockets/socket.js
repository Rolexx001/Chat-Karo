import { redis } from '../config/redis.js';

export let io;
const userSockets = new Map(); // userId string -> Set of socket.ids

export const initSocket = (serverIo) => {
    io = serverIo;
    io.on("connection", (socket) => {
        console.log("A user connected: ", socket.id);

        // Join user-specific room for re
        // al-time notification purposes
        socket.on("join", async (data) => {
            try {
                const userId = typeof data === 'object' ? data.userId : data;
                const token = typeof data === 'object' ? data.token : null;
                if (!userId) return;

                const uidStr = userId.toString();
                socket.userId = uidStr;
                socket.join(uidStr);
                console.log(`User ${uidStr} joined their room`);

                if (!userSockets.has(uidStr)) {
                    userSockets.set(uidStr, new Set());
                }
                const wasOffline = userSockets.get(uidStr).size === 0;
                userSockets.get(uidStr).add(socket.id);

                try {
                    await redis.sadd(`OnlineSockets:${uidStr}`, socket.id);
                } catch (rErr) {}

                if (token) {
                    const jwt = (await import('jsonwebtoken')).default;
                    try {
                        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                        if (decoded.userId === uidStr) {
                            socket.sessionId = decoded.sessionId;
                            try {
                                await redis.sadd(`SessionSockets:${decoded.sessionId}`, socket.id);
                                await redis.set(`SocketSession:${socket.id}`, decoded.sessionId);
                            } catch (rErr) {}
                        }
                    } catch (e) {
                        console.error("Socket token verification failed:", e.message);
                        if (e.name === 'TokenExpiredError') {
                            socket.emit("TokenExpired");
                        }
                    }
                }

                try {
                    const User = (await import('../models/user.model.js')).default;
                    if (wasOffline) {
                        await User.findByIdAndUpdate(uidStr, { isOnline: true });
                    }
                } catch (dbErr) {}

                // Send all currently online user IDs to the newly connected user
                const onlineUserIds = Array.from(userSockets.entries())
                    .filter(([id, set]) => set.size > 0 && id !== uidStr)
                    .map(([id]) => id);
                socket.emit("InitialPresence", { onlineUserIds });

                // Broadcast online presence to all other users immediately
                if (wasOffline) {
                    socket.broadcast.emit("UserPresence", { userId: uidStr, isOnline: true });
                }

                // Mark pending messages in user's chats as delivered
                try {
                    const { fetchUserChats } = await import('../modules/chat/chat.services.js');
                    const chats = await fetchUserChats(uidStr);
                    const Message = (await import('../models/message.model.js')).default;
                    const chatIds = chats.map(c => c._id);
                    const pendingMessages = await Message.find({
                        chatId: { $in: chatIds },
                        sender: { $ne: uidStr },
                        status: "sent",
                        isDeleted: false,
                    }).select('_id chatId sender');

                    if (pendingMessages.length > 0) {
                        await Message.updateMany(
                            { _id: { $in: pendingMessages.map(m => m._id) } },
                            { $set: { status: "delivered" } }
                        );

                        const chatsToNotify = new Set(pendingMessages.map(m => m.chatId.toString()));
                        chatsToNotify.forEach(cId => {
                            io.to(cId).emit("MessagesDelivered", { chatId: cId });
                        });
                    }
                } catch (delivErr) {
                    console.error("Error updating delivered messages on join:", delivErr);
                }
            }
            catch (err) {
                console.error("Error joining socket room: ", err);
            }
        });

        // Join chat room for real-time messaging
        socket.on("joinChat", (chatId) => {
            try {
                socket.join(chatId);
                console.log(`User joined chat ${chatId}`);
            } catch (err) {
                console.error("join chat socket error: ", err);
            }
        });

        socket.on("leaveChat", (chatId) => {
            try {
                socket.leave(chatId);
                console.log(`User left chat ${chatId}`);
            } catch (err) {
                console.error("leave chat socket error: ", err);
            }
        });
        // Handle sending messages
        socket.on("sendMessage", (message) => {
            try {
                // Emit the message to other participants in the chat room
                socket.to(message.chatId).emit("ReceiveMessage", message);
            } catch (err) {
                console.error("send message socket error: ", err);
            }
        });

        // Handle typing events
        socket.on("typing", ({ chatId }) => {
            try {
                socket.to(chatId).emit("Typing", {
                    userId: socket.userId,
                });

                if (!socket.typingTimeouts) {
                    socket.typingTimeouts = {};
                }

                if (socket.typingTimeouts[chatId]) {
                    clearTimeout(socket.typingTimeouts[chatId]);
                }

                socket.typingTimeouts[chatId] = setTimeout(() => {
                    try {
                        socket.to(chatId).emit("StopTyping", { userId: socket.userId });
                        delete socket.typingTimeouts[chatId];
                    } catch (err) {
                        console.error("Auto stop typing error:", err);
                    }
                }, 3000); // 3-second auto stop typing fallback

            } catch (error) {
                console.error("Typing socket error:", error);
            }
        });

        socket.on("stopTyping", ({ chatId }) => {
            try {
                socket.to(chatId).emit("StopTyping", { userId: socket.userId });
                if (socket.typingTimeouts && socket.typingTimeouts[chatId]) {
                    clearTimeout(socket.typingTimeouts[chatId]);
                    delete socket.typingTimeouts[chatId];
                }
            } catch (error) {
                console.error("Stop typing socket error:", error);
            }
        });

        socket.on("editMessage", (data) => {
            try {
                socket.to(data.chatId).emit("MessageEdited", data);
            } catch (error) {
                console.error("Edit message socket error:", error);
            }
        });

        socket.on("deleteMessage", (data) => {
            try {
                socket.to(data.chatId).emit("MessageDeleted", data);
            } catch (error) {
                console.error("Delete message socket error:", error);
            }
        });

        socket.on("markSeen", ({ chatId, messageId, userId }) => {
            try {
                socket.to(chatId).emit("MessageSeen", { messageId, userId });
            } catch (error) {
                console.error("Mark seen socket error:", error);
            }
        });

        socket.on("markChatSeen", async ({ chatId }) => {
            try {
                if (socket.userId && chatId) {
                    const { markChatAsSeenService } = await import("../modules/message/message.services.js");
                    await markChatAsSeenService(chatId, socket.userId);
                    socket.to(chatId).emit("MessagesSeen", { chatId, userId: socket.userId });
                }
            } catch (error) {
                console.error("Socket markChatSeen error:", error);
            }
        });

        socket.on("messageDelivered", async ({ messageId, chatId }) => {
            try {
                if (messageId) {
                    const Message = (await import('../models/message.model.js')).default;
                    await Message.findByIdAndUpdate(messageId, { status: "delivered" });
                    if (chatId) {
                        socket.to(chatId).emit("MessageDelivered", { messageId, chatId });
                    }
                }
            } catch (error) {
                console.error("Socket messageDelivered error:", error);
            }
        });

        // WebRTC Signaling Relays
        socket.on("callUser", async ({ targetUserId, signalData, type }) => {
            try {
                if (!socket.userId) return;

                // Check busy state
                const isBusy = await redis.get(`activeCall:${targetUserId}`);
                if (isBusy) {
                    socket.emit("callBusy", { targetUserId });
                    return;
                }

                // Check blocks
                const User = (await import('../models/user.model.js')).default;
                const isBlocked = await User.exists({ _id: targetUserId, blockedUser: socket.userId });
                const hasBlocked = await User.exists({ _id: socket.userId, blockedUser: targetUserId });
                if (isBlocked || hasBlocked) {
                    socket.emit("callError", { message: "Cannot place call: Block active" });
                    return;
                }

                // Create Call log
                const Call = (await import('../models/call.model.js')).default;
                const call = new Call({
                    caller: socket.userId,
                    receiver: targetUserId,
                    type: type || 'voice',
                    status: 'ongoing'
                });
                await call.save();

                // Set busy status in Redis
                await redis.set(`activeCall:${socket.userId}`, call._id.toString());
                await redis.set(`activeCall:${targetUserId}`, call._id.toString());

                // Check user online status
                const targetOnline = (await redis.scard(`OnlineSockets:${targetUserId}`)) > 0;
                if (targetOnline) {
                    io.to(targetUserId).emit("incomingCall", {
                        from: socket.userId,
                        signalData,
                        type: type || 'voice',
                        callId: call._id
                    });
                } else {
                    // Send push notification for missed call alert via BullMQ
                    const { notificationQueue } = await import('../jobs/notification.queue.js');
                    const callerUser = await User.findById(socket.userId).select('name');
                    await notificationQueue.add("push-notification", {
                        userId: targetUserId,
                        type: "CALL",
                        title: "Missed Call",
                        body: `Incoming ${type || 'voice'} call from ${callerUser?.name || 'Unknown User'}`,
                        data: { callId: call._id }
                    }, {
                        attempts: 3,
                        backoff: { type: "exponential", delay: 1000 }
                    });

                    // Update database
                    call.status = 'missed';
                    call.endedAt = new Date();
                    await call.save();

                    // Clear busy status
                    await redis.del(`activeCall:${socket.userId}`);
                    await redis.del(`activeCall:${targetUserId}`);

                    socket.emit("callUserOffline", { targetUserId, callId: call._id });
                }
            } catch (err) {
                console.error("Socket callUser error:", err);
                socket.emit("callError", { message: "Internal server error starting call" });
            }
        });

        socket.on("acceptCall", ({ callerId, signalData, callId }) => {
            try {
                io.to(callerId).emit("callAccepted", { signalData, callId });
            } catch (err) {
                console.error("Socket acceptCall error:", err);
            }
        });

        socket.on("rejectCall", async ({ callerId, callId }) => {
            try {
                const Call = (await import('../models/call.model.js')).default;
                await Call.findByIdAndUpdate(callId, { status: 'rejected', endedAt: new Date() });

                await redis.del(`activeCall:${socket.userId}`);
                await redis.del(`activeCall:${callerId}`);

                io.to(callerId).emit("callRejected", { callId });
            } catch (err) {
                console.error("Socket rejectCall error:", err);
            }
        });

        socket.on("iceCandidate", ({ targetUserId, candidate, callId }) => {
            try {
                io.to(targetUserId).emit("iceCandidate", { candidate, from: socket.userId, callId });
            } catch (err) {
                console.error("Socket iceCandidate error:", err);
            }
        });

        socket.on("endCall", async ({ targetUserId, callId, duration }) => {
            try {
                const Call = (await import('../models/call.model.js')).default;
                await Call.findByIdAndUpdate(callId, {
                    status: 'completed',
                    duration: duration || 0,
                    endedAt: new Date()
                });

                await redis.del(`activeCall:${socket.userId}`);
                await redis.del(`activeCall:${targetUserId}`);

                io.to(targetUserId).emit("callEnded", { callId });
            } catch (err) {
                console.error("Socket endCall error:", err);
            }
        });

        socket.on("disconnect", async () => {
            try {
                if (socket.typingTimeouts) {
                    Object.values(socket.typingTimeouts).forEach(clearTimeout);
                }
                if (socket.userId) {
                    const uidStr = socket.userId.toString();
                    if (userSockets.has(uidStr)) {
                        userSockets.get(uidStr).delete(socket.id);
                    }
                    const isStillOnline = (userSockets.get(uidStr)?.size || 0) > 0;

                    try {
                        await redis.srem(`OnlineSockets:${uidStr}`, socket.id);
                    } catch (rErr) {}

                    if (socket.sessionId) {
                        try {
                            await redis.srem(`SessionSockets:${socket.sessionId}`, socket.id);
                            await redis.del(`SocketSession:${socket.id}`);
                        } catch (rErr) {}
                    }

                    console.log(`Socket ${socket.id} disconnected for user ${uidStr}`);

                    // Clean up active call if any
                    try {
                        const activeCallId = await redis.get(`activeCall:${uidStr}`);
                        if (activeCallId) {
                            const Call = (await import('../models/call.model.js')).default;
                            const call = await Call.findById(activeCallId);
                            if (call && call.status === 'ongoing') {
                                call.status = 'completed';
                                call.endedAt = new Date();
                                const duration = Math.round((new Date() - call.startedAt) / 1000);
                                call.duration = duration > 0 ? duration : 0;
                                await call.save();
                                const otherParticipant = call.caller.toString() === uidStr ? call.receiver.toString() : call.caller.toString();
                                io.to(otherParticipant).emit("callEnded", { callId: activeCallId, reason: "peer_disconnected" });
                                await redis.del(`activeCall:${uidStr}`);
                                await redis.del(`activeCall:${otherParticipant}`);
                            }
                        }
                    } catch (callErr) {}

                    if (!isStillOnline) {
                        userSockets.delete(uidStr);
                        const lastSeen = new Date();
                        try {
                            const User = (await import('../models/user.model.js')).default;
                            await User.findByIdAndUpdate(uidStr, { isOnline: false, lastSeen });
                        } catch (dbErr) {}

                        // Broadcast offline presence to all connected users immediately
                        io.emit("UserPresence", { userId: uidStr, isOnline: false, lastSeen });
                    }
                }

            } catch (error) {
                console.error("Disconnect socket error:", error);
            }

        });

    });
};