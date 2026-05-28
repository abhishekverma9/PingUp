import Chat from "../models/ChatModel.js";
import Message from "../models/MessageModel.js";
import { io } from "../server.js";
import { v2 as cloudinary } from "cloudinary";
import catchAsync from "../utils/catchAsync.js";

const sendMessage = catchAsync(async (req, res, next) => {
        const { chatId, content, mediaType } = req.body;
        const { userId } = req;
        const senderId = userId;

        // ✅ Get file from multer
        let mediaUrl = "";
        if (req.file) {
            const upload = await cloudinary.uploader.upload(req.file.path, {
                folder: "chat_media",
                resource_type: "auto",
            });
            mediaUrl = upload.secure_url;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) return res.json({ success: false, message: "Chat not found" });

        // 1. Create message
        const messageId = await Message.create({
            chatId,
            senderId,
            content,
            mediaUrl,
            mediaType,
            status: "sent",
        });

        // 2. Update Chat's latest message
        await Chat.updateLatestMessage(chatId, messageId);

        // 3. Get fully populated message for frontend/socket
        const populatedMsg = await Message.findByIdPopulated(messageId);

        const receiverId = chat.user1 === senderId ? chat.user2 : chat.user1;

        // 4. Socket Emissions
        io.to(receiverId).emit("receiveMessage", populatedMsg);
        
        await Message.updateStatus(messageId, "delivered");
        io.to(senderId).emit("messageDelivered", { messageId: populatedMsg._id });

        res.json({ success: true, message: populatedMsg });
});

const getMessages = catchAsync(async (req, res, next) => {
        const { chatId } = req.params;
        const limit = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const messages = await Message.getMessagesByChat(chatId, limit, offset);
        
        // Reverse to match frontend expectations (oldest at top of view)
        res.json({ success: true, messages: messages.reverse(), page });
});

const getAllMsgByAuser = catchAsync(async (req, res, next) => {
        const { userId } = req.params;
        const chats = await Chat.getUserChats(userId);
        res.json({ success: true, chats });
});

const markAsRead = catchAsync(async (req, res, next) => {
        const { chatId } = req.body;
        const { userId } = req;

        // Find unread messages
        const messageIds = await Message.getUnreadMessageIds(chatId, userId);
        
        if (messageIds.length === 0) {
            return res.json({ success: false, message: "No messages to mark as read" });
        }

        // Update them as seen
        await Message.markAsRead(messageIds, userId);
        
        const chat = await Chat.findById(chatId);
        if (chat) {
            const receiverId = chat.user1 === userId ? chat.user2 : chat.user1;
            io.to(receiverId).emit("messagesSeen", { chatId, messageIds, userId });
        }

        res.json({ success: true, message: "Messages marked as read", messageIds });
});

const deleteMessage = catchAsync(async (req, res, next) => {
        const { messageId, userId } = req.body;
        
        const deletedMsgData = await Message.delete(messageId);
        
        if (!deletedMsgData) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        
        if (deletedMsgData.sender_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        io.to(deletedMsgData.chat_id).emit("messageDeleted", { messageId });
        res.json({ success: true, message: "Message deleted" });
});

const typingIndicator = (socket, io) => {
    socket.on("typing", ({ chatId, senderId }) => {
        socket.to(chatId).emit("userTyping", { chatId, senderId });
    });
    socket.on("stopTyping", ({ chatId, senderId }) => {
        socket.to(chatId).emit("userStoppedTyping", { chatId, senderId });
    });
};

const createNewChat = catchAsync(async (req, res, next) => {
        const { userId } = req;
        const { user2 } = req.params;
        const user1 = userId;

        if (!user2) return res.json({ success: false, message: "Receiver ID is required" });

        // Check if chat already exists
        let chatData = await Chat.findChatBetweenUsers(user1, user2);

        if (!chatData) {
            const newChatId = await Chat.create(user1, user2);
            chatData = { _id: newChatId };
        }

        // Fetch fully populated chat to return
        const chat = await Chat.getPopulatedChat(chatData._id);

        res.json({ success: true, chat });
});

export { typingIndicator, deleteMessage, markAsRead, getMessages, sendMessage, getAllMsgByAuser, createNewChat };