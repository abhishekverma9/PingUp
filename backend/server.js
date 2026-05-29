// ========================
// 📦 Imports & Config
// ========================
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import connRouter from "./routes/connectionRoutes.js";
import storyRouter from "./routes/storyRoutes.js";

import { connectDB } from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import { cleanupExpiredStories } from "./config/utils.js";
import messageRouter from "./routes/messageRoutes.js";
import { typingIndicator } from "./controllers/chatController.js";
import commentRouter from "./routes/commentRoutes.js";
 
import Message from "./models/MessageModel.js"; 
import Chat from "./models/ChatModel.js";
import notificationRouter from "./routes/notificationRoutes.js";
import globalErrorHandler from "./middleware/errorMiddleware.js";


// ========================
// 🚀 App & Server Setup
// ========================
const app = express();
const port = process.env.PORT || 3000;

// Wrap express in an HTTP server (required for Socket.IO)
const server = http.createServer(app);

// ========================
// ⚡ Initialize Socket.IO
// ========================
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", 
    methods: ["GET", "POST"]
  }
});

// ========================
// 👥 Online Users Tracker
// ========================
export const onlineUsers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("🟢 User connected:", userId);
  
  if (userId) {
    if (!onlineUsers[userId]) onlineUsers[userId] = [];
    onlineUsers[userId].push(socket.id);
    socket.join(userId);
  }

  io.emit("getOnlineUsers", Object.keys(onlineUsers));

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`📥 User ${userId} joined chat room ${chatId}`);
  });
  
  typingIndicator(socket, io);

  socket.on("sendMessage", ({ receiverId, message }) => {
    if (onlineUsers[receiverId]) {
      onlineUsers[receiverId].forEach(sockId => {
        io.to(sockId).emit("receiveMessage", message);
      });
    }
  });

  // ✅ UPDATED: Message delivered
  socket.on("messageDelivered", async ({ messageId, chatId, userId }) => {
    try {
      // Use our new MySQL method
      await Message.updateStatus(messageId, "delivered");
      
      const chat = await Chat.findById(chatId);
      if (chat) {
        // Since IDs are now native strings, use standard '===' instead of '.equals()'
        const receiverId = chat.user1 === userId ? chat.user2 : chat.user1;
        
        onlineUsers[receiverId]?.forEach(sockId => {
          io.to(sockId).emit("messageDelivered", { chatId, messageId });
        });
      }
    } catch (err) {
      console.error("Error marking message as delivered:", err);
    }
  });

  // ✅ UPDATED: Message seen
  socket.on("messageSeen", async ({ chatId, messageIds, userId }) => {
    try {
      // Use our new MySQL method to handle the read_by junction table and status
      await Message.markAsRead(messageIds, userId);
      
      const chat = await Chat.findById(chatId);
      if (chat) {
        // String comparison instead of .equals()
        const receiverId = chat.user1 === userId ? chat.user2 : chat.user1;
        
        const receiverSockets = onlineUsers[receiverId] || [];
        receiverSockets.forEach(sockId => {
          io.to(sockId).emit("messagesSeen", { chatId, messageIds, userId });
        });
      }
    } catch (err) {
      console.error("Error marking messages as seen:", err);
    }
  });
  // ========================
  // 🎤 Audio / Video Call
  // ========================
  socket.on("callUser", ({ userToCall, signalData, from, callType }) => {
    const targetSockets = onlineUsers[userToCall] || [];
    targetSockets.forEach(sockId => {
      io.to(sockId).emit("incomingCall", { signalData, from, callType });
    });
  });

  socket.on("answerCall", ({ to, signal }) => {
    const targetSockets = onlineUsers[to] || [];
    targetSockets.forEach(sockId => {
      io.to(sockId).emit("callAccepted", signal);
    });
  });

  socket.on("iceCandidate", ({ candidate, to }) => {
    const targetSockets = onlineUsers[to] || [];
    targetSockets.forEach(sockId => {
      io.to(sockId).emit("iceCandidate", candidate);
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", userId);
    if (userId && onlineUsers[userId]) {
      onlineUsers[userId] = onlineUsers[userId].filter(id => id !== socket.id);
      if (onlineUsers[userId].length === 0) delete onlineUsers[userId];
    }
    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

// ========================
// 🧰 Middleware Setup
// ========================
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'] 
  })
);

// ========================
// 🗄️ Connect Databases & Cloudinary
// ========================
connectDB();
connectCloudinary();

// ========================
// 🛣️ API Routes
// ========================
app.get("/", (req, res) => {
  res.send("✅ Server is running smoothly!");
});
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/conn", connRouter);
app.use("/api/story", storyRouter);
app.use('/api/message', messageRouter);
app.use('/api/comment', commentRouter);
app.use("/api/notifications", notificationRouter);

// ========================
// 🛑 Global Error Handler
// ========================
app.use(globalErrorHandler);


// ========================
// 🕒 Background Tasks
// ========================
setInterval(cleanupExpiredStories, 60 * 1000); 

// ========================
// 🚀 Start Server
// ========================
server.listen(port, () => {
  console.log(`🔥 Server running on port ${port}`);
});