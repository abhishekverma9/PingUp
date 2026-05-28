import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { createNewChat, deleteMessage, getAllMsgByAuser, getMessages, markAsRead, sendMessage } from '../controllers/chatController.js';

const messageRouter = express.Router()

messageRouter.post("/send", authUser,upload.single("file"),sendMessage);
messageRouter.get("/:chatId",authUser, getMessages);
messageRouter.put("/read",authUser, markAsRead);
messageRouter.delete("/",authUser, deleteMessage);
messageRouter.get('/chats/:userId',authUser,getAllMsgByAuser)
messageRouter.post('/create/:user2',authUser,createNewChat)

export default messageRouter