import {sub} from "../config/redisPubSub.js";
import {io} from "../sockets/socket.js";
import { redis } from "../config/redis.js";

const CHANNEL="NOTIFICATION";
const SESSION_CHANNEL="SESSION_REVOCATION";
const AI_STREAM_CHANNEL="AI_STREAM";

export const initNotificationSubscriber=async()=>{
    //Subscribe to notification, session, and AI stream channels
    await sub.subscribe(CHANNEL, SESSION_CHANNEL, AI_STREAM_CHANNEL);
    //Listen for messages on the channels
    sub.on("message",async(channel,message)=>{
        if(channel === CHANNEL) {
            //convert string message to object
            const notification=JSON.parse(message);
            //Emit notification to the specific user room using socket.io
            io.to(notification.userId.toString()).emit("ReceiveNotification",notification);
        } else if(channel === SESSION_CHANNEL) {
            const { sessionId } = JSON.parse(message);
            const socketIds = await redis.smembers(`SessionSockets:${sessionId}`);
            for (const socketId of socketIds) {
                const socketObj = io.sockets?.sockets?.get(socketId);
                if (socketObj) {
                    socketObj.emit("SessionRevoked", { message: "Your session has been revoked." });
                    socketObj.disconnect(true);
                }
            }
        } else if(channel === AI_STREAM_CHANNEL) {
            try {
                const data = JSON.parse(message);
                // Emit the chunk to the chat room
                io.to(data.chatId).emit("ReceiveAIChunk", data);
            } catch (err) {
                console.error("Error processing AI stream message:", err);
            }
        }
    });
};