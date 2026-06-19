import React, { useState, useContext, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const UserRow = ({ user, onCloseModal }) => {
  const navigate = useNavigate();
  const { sendFollowRequest, cancelFollowRequest, unfollowUser, profileData } = useContext(AuthContext);

  const [followState, setFollowState] = useState("follow");
  const userId = user._id;
  const isMe = profileData && (profileData.userId === userId);
  useEffect(() => {
    if (user.isFollowing) setFollowState("following");
    else if (user.isPending) setFollowState("pending");
    else setFollowState("follow");
  }, [user.isFollowing, user.isPending]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation(); // Prevent row click when clicking button
    try {
      if (followState === "follow") {
        const success = await sendFollowRequest(user._id);
        if (success) setFollowState("pending");
      } else if (followState === "pending") {
        const success = await cancelFollowRequest(user._id);
        if (success) setFollowState("follow");
      } else if (followState === "following") {
        const success = await unfollowUser(user._id);
        if (success) setFollowState("follow");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  const getButtonText = () => {
    if (followState === "follow") return "Follow";
    if (followState === "pending") return "Pending";
    if (followState === "following") return "Unfollow";
  };

  const getButtonClass = () => {
    if (followState === "follow")
      return "text-xs font-semibold py-1 px-3 rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-purple-200 dark:shadow-none";
    if (followState === "pending")
      return "text-xs font-semibold py-1 px-3 rounded-full transition-all duration-300 shadow-sm bg-yellow-400 text-white hover:opacity-90";
    if (followState === "following")
      return "text-xs font-semibold py-1 px-3 rounded-full transition-all duration-300 shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600";
  };

  const handleRowClick = () => {
    onCloseModal();
    if (isMe) {
      navigate('/profile');
    } else {
      navigate(`/friendprofile/${userId}`);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <img
          src={user.profile}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-600"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</span>
        </div>
      </div>
      {(profileData?._id !== user._id && profileData?.userId !== user._id) && (
        <button onClick={handleFollowToggle} className={getButtonClass()}>
          {getButtonText()}
        </button>
      )}
    </div>
  );
};

const ConnectionsListModal = ({ title, users, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 custom-scrollbar">
          {users && users.length > 0 ? (
            users.map((user) => (
              <UserRow key={user._id} user={user} onCloseModal={onClose} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No users to show.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConnectionsListModal;
