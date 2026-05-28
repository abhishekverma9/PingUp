import React, { useState, useEffect, useContext, useRef } from "react";
import { FiPhone, FiVideo, FiInfo, FiSend, FiSmile, FiImage, FiMessageCircle } from "react-icons/fi";
import { IoIosArrowBack } from "react-icons/io";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import EmojiPicker from "../components/EmojiPicker";
import VideoCall from "../components/VideoCall";
import AudioCall from "../components/AudioCall";

const MessagesPage = () => {
  const { socket, onlineUsers } = useContext(SocketContext);
  const { profileData, backendUrl, token, users, api, connections } = useContext(AuthContext);
  const user = profileData;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [file, setFile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [newChatSearch, setNewChatSearch] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // show typing indicator
  const typingTimeoutRef = useRef(null); // debounce timeout
  const chatRef = useRef();

  const fetchChats = async () => {
    if (!user?.userId) return;
    try {
      const { data } = await api.get(`/api/message/chats/${user.userId}`);
      if (data.success) {
        setChats(data.chats);
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  };
  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const { data } = await api.get(`/api/message/${selectedChat._id}`);
      if (data.success) {
        setMessages(data.messages);

        // ✅ Emit "messageSeen" for all unread messages not sent by current user
        const unseen = data.messages
          .filter((m) => m.sender._id !== user.userId && !m.readBy?.includes(user.userId))
          .map((m) => m._id);

        if (unseen.length > 0) {
          socket.emit("messageSeen", {
            chatId: selectedChat._id,
            messageIds: unseen,
            userId: user.userId,
          });
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);
  useEffect(() => {
    fetchMessages();
    // 🔥 Mark unseen messages as seen when opening a chat
    if (socket && selectedChat && messages.length) {
      const unseen = messages
        .filter((m) => m.sender._id !== user.userId && m.status !== "seen")
        .map((m) => m._id);

      if (unseen.length) {
        socket.emit("messageSeen", {
          chatId: selectedChat._id,
          messageIds: unseen,
          userId: user.userId,
        });
      }
    }
  }, [selectedChat, messages]);


  // useEffect(() => {
  //   chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  // }, [messages]);
  // Auto-scroll only if user is near bottom

  // Scroll to bottom immediately (when chat opens)
  const scrollToBottom = () => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  // Auto-scroll on new message only if user is near bottom
  const handleAutoScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) {
      chatRef.current.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const prevMessagesLength = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    isInitialLoad.current = true;
    if (selectedChat) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current || messages.length - prevMessagesLength.current > 1) {
        setTimeout(scrollToBottom, 100);
        isInitialLoad.current = false;
      } else {
        handleAutoScroll();
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);
  useEffect(() => {
    if (!socket) return;

    // 🔥 FIXED: The payload IS the message itself, not an object containing { message }
    const handleReceive = (receivedMessage) => {
      // Use fallback checks just in case your backend uses chat, chatId, or chat_id
      const msgChatId = receivedMessage.chat || receivedMessage.chatId || receivedMessage.chat_id;

      if (selectedChat && msgChatId === selectedChat._id) {
        setMessages((prev) => {
          if (prev.find((m) => m?._id === receivedMessage?._id)) return prev;
          return [...prev, receivedMessage].filter(Boolean);
        });

        // 🔥 If I am the receiver, mark message as delivered
        // Added safe navigation (?) to prevent future crashes if sender isn't populated properly
        if (receivedMessage.sender?._id !== user.userId) {
          socket.emit("messageDelivered", {
            messageId: receivedMessage._id,
            chatId: selectedChat._id,
            userId: user.userId,
          });
        }
      }
    };

    // 🔥 When a message is marked as delivered
    const handleMessageDelivered = ({ chatId, messageId }) => {
      if (selectedChat && chatId === selectedChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, status: "delivered" } : msg
          )
        );
      }
    };

    // 🔥 When messages are marked as seen
    const handleMessagesSeen = ({ chatId, messageIds, userId }) => {
      if (selectedChat && chatId === selectedChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id)
              ? { ...msg, status: "seen", readBy: [...new Set([...(msg.readBy || []), userId])] }
              : msg
          )
        );
      }
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket, selectedChat?._id, user.userId]);
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleUserTyping = ({ chatId, senderId }) => {
      if (chatId === selectedChat._id && senderId !== user.userId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = ({ chatId, senderId }) => {
      if (chatId === selectedChat._id && senderId !== user.userId) {
        setIsTyping(false);
      }
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, selectedChat]);

  const handleResize = () => setIsMobile(window.innerWidth < 768);
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const handleAccountClick = (chat) => {
    setSelectedChat(chat);
    if (isMobile) setIsChatOpen(true);
    // Join chat room for typing & read events
    if (socket) socket.emit("joinChat", chat._id);
  };
  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false); // optional: close picker after selecting
  };
  const handleBack = () => setIsChatOpen(false);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !file) return;
    try {
      const formData = new FormData();
      formData.append("chatId", selectedChat._id);
      formData.append("content", messageText);
      if (file) {
        formData.append("file", file);
        const type = file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("video")
            ? "video"
            : "file";
        formData.append("mediaType", type);
      }
      const { data } = await api.post(`/api/message/send`, formData);
      if (data.success) {
        const newMsg = { ...data.message, status: "sent" };
        setMessages((prev) => [...prev, newMsg]);
        setMessageText("");
        setFile(null);
        setTimeout(scrollToBottom, 100);
        // fetchMessages();
        socket.emit("sendMessage", {
          receiverId:
            selectedChat.user1._id === user.userId
              ? selectedChat.user2._id
              : selectedChat.user1._id,
          message: data.message,
        });
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  };
  const handleStartNewChat = async (selectedUser) => {
    try {
      const selectedUserId = selectedUser._id || selectedUser.id;
      const { data } = await api.post(`/api/message/create/${selectedUserId}`, {});
      if (data.success) {
        setChats((prev) => [data.chat, ...prev]);
        setSelectedChat(data.chat);
        setShowNewChatModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  useEffect(() => {
    console.log("All Users:", users);
  }, [users]);
  return (
    <div className="lg:w-[80vw] w-[100vw] h-screen flex font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {(!isMobile || !isChatOpen) && (
        <div className="md:w-1/3 w-full border-r border-gray-100 dark:border-gray-800 flex flex-col relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-10">
          <h2 className="text-2xl font-extrabold p-6 border-b border-gray-100 dark:border-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">Messages</h2>
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
            />
          </div>
          <div className="flex-grow overflow-y-auto px-2 py-2">
            {chats.filter((chat) => {
              if (!chatSearch.trim()) return true;
              const otherUser = chat.user1._id === user.userId ? chat.user2 : chat.user1;
              const lowerSearch = chatSearch.toLowerCase();
              return otherUser.name?.toLowerCase().includes(lowerSearch) || otherUser.username?.toLowerCase().includes(lowerSearch);
            }).map((chat) => {
              const otherUser = chat.user1._id === user.userId ? chat.user2 : chat.user1;
              return (
                <div
                  key={chat._id}
                  onClick={() => handleAccountClick(chat)}
                  className={`flex items-center gap-4 p-4 my-1 rounded-2xl cursor-pointer transition-all duration-300 ${selectedChat?._id === chat._id ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-sm transform scale-[1.02]" : "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.01]"
                    }`}
                >
                  <div className="relative">
                    <img
                      src={otherUser.profile}
                      alt={otherUser.username}
                      className="w-14 h-14 rounded-full object-cover shadow-sm"
                    />
                    {onlineUsers.includes(otherUser._id) && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{otherUser.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{otherUser.username}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm truncate mt-0.5">
                      {chat.latestMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowNewChatModal(true)}
            className="absolute bottom-6 right-6 flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-3 rounded-full hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 transition-all duration-300 font-semibold shadow-md"
          >
            <FiMessageCircle className="w-5 h-5" /> New Chat
          </button>
          {showNewChatModal && (
            <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-gray-900 shadow-md rounded-lg p-4 z-10 overflow-y-auto transition-colors duration-200">
              <h3 className="text-lg font-bold mb-3 dark:text-gray-100">Start New Chat</h3>
              <input
                type="text"
                placeholder="Search following..."
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
              />
              {(() => {
                // 1. Save the filtered list to a variable first
                const filteredFollowing = (connections?.following || []).filter(u => {
                  if (newChatSearch.trim()) {
                    const lowerSearch = newChatSearch.toLowerCase();
                    if (!u.name?.toLowerCase().includes(lowerSearch) && !u.username?.toLowerCase().includes(lowerSearch)) {
                      return false;
                    }
                  }
                  const targetId = String(u._id || u.id);
                  // Remove yourself from the list
                  if (targetId === String(user.userId)) return false;
                  // Safely check both ID formats to remove existing chats
                  const alreadyChatting = chats.some(c => {
                    const u1Id = String(c.user1._id || c.user1.id);
                    const u2Id = String(c.user2._id || c.user2.id);
                    return u1Id === targetId || u2Id === targetId;
                  });
                  return !alreadyChatting;
                });

                // 2. Check if the list is empty and show the text!
                if (filteredFollowing.length === 0) {
                  return (
                    <div className="text-center p-6 text-gray-500 dark:text-gray-400 text-sm">
                      {newChatSearch.trim()
                        ? "No friends found matching that name."
                        : "You are already chatting with all your friends, or you aren't following anyone yet!"}
                    </div>
                  );
                }

                // 3. Otherwise, map over the users and show the rows
                return filteredFollowing.map(u => (
                  <div key={u._id || u.id} className="flex items-center gap-3 px-2 my-1 border border-gray-200 dark:border-gray-700 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleStartNewChat(u)} >
                    <img src={u.profile_pic || u.profile} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-gray-950 dark:text-gray-100 font-medium">{u.name}</p>
                      <p className="text-gray-600 dark:text-gray-400 font-normal text-sm">@{u.username}</p>
                    </div>
                  </div>
                ));
              })()}
              <button onClick={() => setShowNewChatModal(false)}
                className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {(!isMobile || isChatOpen) && (
        <div className={`w-2/3 flex flex-col ${isMobile ? "absolute w-full top-0 left-0 h-screen bg-white dark:bg-gray-900 z-10" : ""}`}>
          {selectedChat ? (
            <>
              <div className="p-4 px-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <button
                      onClick={handleBack}
                      className="text-gray-500 hover:text-gray-800 flex items-center"
                    >
                      <IoIosArrowBack className="w-6 h-6" />
                    </button>
                  )}
                  <div className="relative">
                    <img
                      src={
                        selectedChat.user1._id === user.userId
                          ? selectedChat.user2.profile
                          : selectedChat.user1.profile
                      }
                      alt="user"
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                    {onlineUsers.includes(
                      selectedChat.user1._id === user.userId
                        ? selectedChat.user2._id
                        : selectedChat.user1._id
                    ) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                      )}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-extrabold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                      {selectedChat.user1._id === user.userId
                        ? selectedChat.user2.name
                        : selectedChat.user1.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {onlineUsers.includes(
                        selectedChat.user1._id === user.userId
                          ? selectedChat.user2._id
                          : selectedChat.user1._id
                      )
                        ? <span className="text-green-500">Online</span>
                        : <span>Offline</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowAudioCall(true)}>
                    <FiPhone className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowVideoCall(true)}>
                    <FiVideo className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <FiInfo className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </div>
                </div>
              </div>
              <div ref={chatRef} className="flex-grow p-6 overflow-y-auto flex flex-col space-y-6 bg-[#f8fafc] dark:bg-[#111827] chat-background scroll-smooth transition-colors duration-200">
                {messages.map((msg, index) => {
                  const isSender = msg.sender._id === user.userId;
                  const messageDate = new Date(msg.createdAt);
                  const prevMessageDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
                  const showDate = !prevMessageDate || messageDate.toDateString() !== prevMessageDate.toDateString();

                  let dateString = "";
                  if (showDate) {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (messageDate.toDateString() === today.toDateString()) {
                      dateString = "Today";
                    } else if (messageDate.toDateString() === yesterday.toDateString()) {
                      dateString = "Yesterday";
                    } else {
                      dateString = messageDate.toLocaleDateString([], { month: "short", day: "numeric", year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
                    }
                  }

                  return (
                    <React.Fragment key={msg._id}>
                      {showDate && (
                        <div className="flex justify-center my-2">
                          <span className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-xs font-semibold py-1 px-3 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                            {dateString}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col animate-message-pop ${isSender ? "items-end" : "items-start"}`}>
                        <div className={`flex items-end gap-3`}>
                          {!isSender && (
                            <img
                              src={msg.sender.profile}
                              alt={msg.sender.username}
                              className="w-8 h-8 rounded-full object-cover shadow-sm mb-1"
                            />
                          )}
                          <div
                            className={`max-w-[85%] md:max-w-md p-4 shadow-sm ${isSender ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white" : "rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700"}`}
                          >
                            {msg.mediaUrl && msg.mediaType === "image" && (
                              <img
                                src={msg.mediaUrl}
                                alt="media"
                                className="rounded-xl mb-2 max-h-64 object-cover shadow-sm"
                              />
                            )}
                            <p className="text-[15px] leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                        {/* Timestamp outside the bubble */}
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${isSender ? "text-gray-500 text-right" : "text-gray-500 text-left"
                            }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}

                          {isSender && (
                            <span className="ml-1">
                              {msg.status === "seen" ? (
                                <span className="text-blue-500">✓✓</span>
                              ) : msg.status === "delivered" ? (
                                <span className="text-gray-500">✓✓</span>
                              ) : (
                                <span>✓</span>
                              )}
                            </span>
                          )}
                        </p>

                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="h-6 mb-2">
                  {isTyping && selectedChat && (
                    <div className="flex items-center gap-2">
                      {/* Show other user's avatar */}
                      <img
                        src={
                          selectedChat.user1._id === user.userId
                            ? selectedChat.user2.profile
                            : selectedChat.user1.profile
                        }
                        alt="user"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      {/* Typing animation */}
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-transparent flex flex-col gap-2 relative z-20">
                {/* File Preview */}
                {file && (
                  <div className="relative rounded-xl self-start ml-4 bg-white dark:bg-gray-800 p-2 shadow-md border border-gray-100 dark:border-gray-700">
                    {file.type.startsWith("image") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{file.name}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setFile(null)}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Floating Message Input */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 px-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 mx-2 mb-2 transition-all">
                  <div className="relative flex items-center">
                    <FiSmile
                      className="w-6 h-6 text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                    />
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <EmojiPicker onSelect={handleEmojiSelect} />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-grow bg-transparent text-gray-900 dark:text-gray-100 px-2 py-2 focus:outline-none placeholder-gray-400 font-medium"
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      if (socket && selectedChat) {
                        socket.emit("typing", { chatId: selectedChat._id, senderId: user.userId });
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                          socket.emit("stopTyping", { chatId: selectedChat._id, senderId: user.userId });
                        }, 2000);
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />

                  <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
                    <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <FiImage className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    </label>
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 p-2.5 rounded-full cursor-pointer transition-transform hover:scale-105 shadow-md flex items-center justify-center"
                      onClick={handleSendMessage}
                    >
                      <FiSend className="w-5 h-5 text-white transform -translate-x-[1px] translate-y-[1px]" />
                    </div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 text-xl">
              Select a chat to start messaging
            </div>
          )}
        </div>
      )}
      {showVideoCall && selectedChat && (
        <VideoCall
          currentUserId={user.userId}
          otherUserId={selectedChat.user1._id === user.userId ? selectedChat.user2._id : selectedChat.user1._id}
          onClose={() => setShowVideoCall(false)}
        />
      )}
      {showAudioCall && selectedChat && (
        <AudioCall
          currentUserId={user.userId}
          otherUserId={selectedChat.user1._id === user.userId ? selectedChat.user2._id : selectedChat.user1._id}
          onClose={() => setShowAudioCall(false)}
        />
      )}
    </div>
  );
};

export default MessagesPage;
