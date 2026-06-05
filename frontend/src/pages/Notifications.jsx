import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiHeart, FiMessageCircle, FiUserPlus, FiCheck } from "react-icons/fi";
import {useNavigate} from 'react-router-dom'

const Notifications = () => {
    const { token, timeAgo, handleFollowAction, connections, api } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async (isInitial = false) => {
            try {
                if (isInitial) setLoading(true);

                const { data } = await api.get(`/api/notifications/get`);
                if (data.success) {
                    setNotifications(data.notifications);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                if (isInitial) setLoading(false);
            }
        };
        if (token) {
            fetchNotifications(true);
            const intervalId = setInterval(() => {
                fetchNotifications(false);
            }, 30000);
            return () => clearInterval(intervalId);
        }
    }, [token, api]);

    const isPending = (senderId) => {
        if (!connections?.pending) return false;
        return connections.pending.some(user => user._id === senderId);
    };
    const isAccepted = (senderId) => {
        if (!connections?.followers) return false;
        return connections.followers.some(user => user._id === senderId);
    };
    const newestFollowNotifs = {};
    notifications.forEach(n => {
        if (n.type === 'follow' && !newestFollowNotifs[n.sender._id]) {
            // Stores the ID of only the most recent follow request per user 
            newestFollowNotifs[n.sender._id] = n._id;
        }
    });
    const handleNotificationClick = (notif) => { 
        switch (notif.type) {
            case 'like_post':
            case 'like_comment':
            case 'comment':  
            case 'reply':
                navigate(`/post/${notif.post}`);
                break;

            case 'follow_accept':  
                break;

            case 'like_story':
            case 'comment_story':
                // Because the story viewer is likely a modal triggered by state in another component,
                // you have two options here:
                // Option 1: Route them to the user's profile where they can click the avatar to see the story.
                navigate(`/friendprofile/${notif.sender._id}`);
                // Option 2 (Advanced): Fire a global Context function like `openStoryViewer(notif.post_id)`
                break;

            case 'follow':
                // Do nothing! Let them use the Confirm/Delete buttons right there.
                break;

            default:
                break;
        }
    };
    useEffect(() => {
        console.log("Notifications:", notifications);
    }, [notifications]);
    return (
        <div className="w-full lg:max-w-2xl lg:ml-20 mx-auto lg:mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden min-h-[30vh] transition-colors duration-200">
            <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-lg text-gray-800 dark:text-gray-100">
                Notifications
            </header>

            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                {loading ? (
                    <div className="p-6 text-center text-gray-400">Loading...</div>
                ) : notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div key={notif._id} onClick={() => !isPending(notif.sender._id) && handleNotificationClick(notif)} className={`flex items-start px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>

                            {/* --- 1. Notification Icon (Left Side) --- */}
                            <div className="mt-1 mr-4 shrink-0">
                                {['like_post', 'like_comment', 'like_story'].includes(notif.type) && (
                                    <div className="p-2 bg-red-100 text-red-500 rounded-full"><FiHeart size={16} className="fill-current" /></div>
                                )}
                                {['comment', 'reply', 'comment_story'].includes(notif.type) && (
                                    <div className="p-2 bg-blue-100 text-blue-500 rounded-full"><FiMessageCircle size={16} /></div>
                                )}
                                {notif.type === 'follow' && (
                                    <div className="p-2 bg-purple-100 text-purple-500 rounded-full"><FiUserPlus size={16} /></div>
                                )}
                                {['follow_accept', 'follow_reject'].includes(notif.type) && (
                                    <div className="p-2 bg-green-100 text-green-500 rounded-full"><FiCheck size={16} /></div>
                                )}
                            </div>

                            {/* --- 2. Content (Middle) --- */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">

                                    {/* Left Side: Avatar and Text */}
                                    <div className="flex items-start space-x-3">
                                        <img src={notif.sender.profile}
                                            alt={notif.sender.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                                        />
                                        <div>
                                            <p className="text-sm text-gray-800 dark:text-gray-100">
                                                <span className="font-bold mr-1">{notif.sender.name}</span>
                                                {notif.type === 'like_post' && "liked your post."}
                                                {notif.type === 'like_comment' && "liked your comment."}
                                                {notif.type === 'comment' && "commented on your post."}
                                                {notif.type === 'reply' && "replied to your comment."}
                                                {notif.type === 'follow' && "requested to follow you."}
                                                {notif.type === 'follow_accept' && "accepted your follow request."}
                                                {notif.type === 'follow_reject' && "rejected your follow request."}
                                                {notif.type === 'like_story' && "liked your story.❤️"}
                                                {notif.type === 'comment_story' && "commented on your story.💬"}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{notif.sender.username}</p>
                                        </div>
                                    </div>

                                    {/* Right Side: Timestamp & Post Image */}
                                    {/* 👇 This is the fix: A dedicated right-aligned container */}
                                    <div className="flex flex-col items-end shrink-0 ml-4">
                                        <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                                            {timeAgo(notif.createdAt)}
                                        </span>
                                        {typeof notif.post === 'object' && notif.post?.mediaUrl && (
                                            <img src={notif.post.mediaUrl} alt="post" className="w-10 h-10 rounded object-cover mt-2" />
                                        )}
                                    </div>

                                </div>
                                {/* --- 3. Action Buttons (Only for Follow Requests) --- */}
                                {notif.type === 'follow' && (
                                    <div className="mt-3 ml-12 animate-in fade-in slide-in-from-top-1">
                                        {/* 👇 FIX: Check if it's pending AND if it is the newest request */}
                                        {isPending(notif.sender._id) && newestFollowNotifs[notif.sender._id] === notif._id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {e.stopPropagation();handleFollowAction(notif.sender._id, 'accept')}}
                                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={(e) => {e.stopPropagation();handleFollowAction(notif.sender._id, 'reject')}}
                                                    className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : isAccepted(notif.sender._id) ? (
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                                                Request Accepted
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                                                {/* Changed text slightly so old requests make more sense */}
                                                Previous Request
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                            <FiHeart className="text-gray-400" size={24} />
                        </div>
                        <p>No notifications yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;