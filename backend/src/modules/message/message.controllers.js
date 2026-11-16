import { sendMessageService,fetchMessageService,editMessageService,deleteMessageService,markMessageSeenService,markChatAsSeenService,starMessageService,unstarMessageService,fetchStarredMessagesService,forwardMessageService,searchMessagesService } from "./message.services.js";

export const sendMessage=async(req,res,next)=>{
    try{
        const message=await sendMessageService(req.userId,req.body);
        res.status(201).json({success:true,message});

    } 
    catch(error){
        next(error);
    }
};

export const getMessages=async(req,res,next)=>{
    try{
        const {cursor,limit=20}=req.query;
        const messages=await fetchMessageService(
            req.userId,
            req.params.chatId,
            cursor,
            parseInt(limit)
        );
        res.status(200).json({
            success:true,
            ...messages
        });
    }
    catch(error){
        next(error);
    }
};

export const editMessage=async(req,res,next)=>{
    try{
        const message=await editMessageService(req.params.id,req.userId,req.body.content);
        res.status(200).json({success:true,message});

    } catch(error){
        next(error);
    }
};
export const deleteMessage=async(req,res,next)=>{
    try{
        const type = req.body.type || "everyone";
        const message=await deleteMessageService(req.params.id,req.userId,type);
        const { io } = await import('../../sockets/socket.js');
        if (io) {
            if (type === 'everyone') {
                io.to(message.chatId.toString()).emit("MessageDeleted", { messageId: req.params.id, type: "everyone" });
            } else {
                io.to(req.userId.toString()).emit("MessageDeleted", { messageId: req.params.id, type: "self", userId: req.userId });
            }
        }
        res.status(200).json({success:true,message});

    } catch(error){
        next(error);
    }
};

export const markSeenController=async(req,res,next)=>{
    try{
        const message=await markMessageSeenService(req.params.id,req.userId);
        res.status(200).json({success:true,message});
    } catch(error){
        next(error);
    }
};

export const markChatAsSeenController=async(req,res,next)=>{
    try{
        const result=await markChatAsSeenService(req.params.chatId,req.userId);
        const { io } = await import('../../sockets/socket.js');
        if (io) {
            io.to(req.params.chatId).emit("MessagesSeen", { chatId: req.params.chatId, userId: req.userId });
        }
        res.status(200).json(result);
    } catch(error){
        next(error);
    }
};

export const starMessage=async(req,res,next)=>{
    try{
        const message=await starMessageService(req.userId,req.params.id);
        res.status(200).json({success:true,message});
    } catch(error){
        next(error);
    }
};

export const unstarMessage=async(req,res,next)=>{
    try{
        const message=await unstarMessageService(req.userId,req.params.id);
        res.status(200).json({success:true,message});
    } catch(error){
        next(error);
    }
};

export const getStarredMessages=async(req,res,next)=>{
    try{
        const messages=await fetchStarredMessagesService(req.userId,req.params.chatId);
        res.status(200).json({success:true,messages});
    } catch(error){
        next(error);
    }
};

export const forwardMessage=async(req,res,next)=>{
    try{
        const targetChatIds=req.body.chatIds||req.body.chatId;
        if(!targetChatIds){
            return res.status(400).json({success:false,message:"Target chatId(s) required"});
        }
        const messages=await forwardMessageService(req.userId,req.params.id,targetChatIds);
        res.status(200).json({success:true,messages});
    } catch(error){
        next(error);
    }
};

export const searchMessages=async(req,res,next)=>{
    try{
        const messages=await searchMessagesService(req.userId,req.params.chatId,req.query.query);
        res.status(200).json({success:true,messages});
    } catch(error){
        next(error);
    }
};