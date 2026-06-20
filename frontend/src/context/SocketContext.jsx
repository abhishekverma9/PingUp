import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

const SocketContextProvider = ({ children }) => {
    const { profileData, backendUrl } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [incomingCall, setIncomingCall] = useState(null);
    const [outgoingCall, setOutgoingCall] = useState(null);
    const user = profileData;

    useEffect(() => {
        if (user?.userId) {
            const newSocket = io(backendUrl, {
                query: { userId: user.userId },
            }); 
            setSocket(newSocket);

            // ===========================
            // 🌐 Server → Client listeners
            // ===========================
            newSocket.on("getOnlineUsers", (users) => setOnlineUsers(users)); 
            newSocket.on("receiveMessage", (message) => console.log("💬 New message:", message));
            
            newSocket.on("userTyping", ({ chatId, userId, isTyping }) => {
                setTypingUsers((prev) => ({
                    ...prev,
                    [chatId]: isTyping ? userId : null,
                }));
            }); 
            newSocket.on("messageDelivered", ({ messageId }) => console.log("📬 Message delivered:", messageId));
            newSocket.on("messagesSeen", ({ chatId, messageIds, userId }) => console.log("👁️ Messages seen:", { chatId, messageIds, userId }));

            // ===========================
            // 🎤 Incoming Audio/Video Calls
            // =========================== 
            newSocket.on("incomingCall", ({ from, signalData, callType }) => {
                setIncomingCall({ type: callType, from, signalData });
            }); 
            newSocket.on("callAccepted", (signalData) => {
                console.log("✅ Call accepted");
                // Complete WebRTC handshake here in your component
            }); 
            newSocket.on("callEnded", ({ userId }) => {
                console.log("❌ Call ended by:", userId);
                setIncomingCall(null);
                setOutgoingCall(null);
            }); 
            
            // Cleanup
            return () => newSocket.disconnect();
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setOnlineUsers([]);
                setTypingUsers({});
                setIncomingCall(null);
                setOutgoingCall(null);
            }
        }
    }, [user, backendUrl]);

    // ===========================
    // ✍️ Helper functions
    // ===========================
    const sendMessage = (receiverId, message) => socket?.emit("sendMessage", { receiverId, message });
    const emitTyping = (chatId, isTyping) => socket?.emit("typing", { chatId, userId: user.userId, isTyping });
    const markAsDelivered = (messageId) => socket?.emit("messageDelivered", { messageId });
    const markAsSeen = (chatId, messageIds) => socket?.emit("messageSeen", { chatId, messageIds, userId: user.userId });

    // ===========================
    // 🎧 Audio/Video Call Helpers
    // ===========================
    const startCall = (callType, receiverId, signalData) => {
        socket?.emit("callUser", { userToCall: receiverId, signalData, from: user.userId, callType });
    };

    const answerCall = (callerId, signalData) => {
        socket?.emit("answerCall", { to: callerId, signal: signalData });
        // DO NOT setIncomingCall(null) here, otherwise the call UI will unmount!
    };

    const endCall = (userId) => {
        socket?.emit("endCall", { userId });
        setIncomingCall(null);
        setOutgoingCall(null);
    };

    const value = {
        socket,
        onlineUsers,
        typingUsers,
        incomingCall,
        setIncomingCall,
        outgoingCall,
        setOutgoingCall,
        sendMessage,
        emitTyping,
        markAsDelivered,
        markAsSeen,
        startCall,
        answerCall,
        endCall,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContextProvider;