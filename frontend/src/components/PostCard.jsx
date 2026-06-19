import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHeart, FaComment, FaShareAlt } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import CommentSection from "./Comment"; // Adjust path if Comment.jsx is in a different folder
import { toast } from "react-toastify";
import { FiShare2, FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import ConnectionsListModal from "./ConnectionsListModal";

// --- Sub-component ---
const PostText = ({ text }) => {
  const navigate = useNavigate();
  const { api } = useContext(AuthContext);

  const handleMentionClick = async (username) => {
    try {
      const { data } = await api.get(`/api/user/username/${username}`);
      if (data.success) {
        navigate(`/friendprofile/${data.userId}`);
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleHashtagClick = (hashtag) => {
    navigate(`/discover?search=${encodeURIComponent(hashtag)}`);
  };

  const renderText = () => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} onClick={() => handleHashtagClick(part)} className="text-blue-500 font-medium cursor-pointer hover:underline">
            {part}
          </span>
        );
      } else if (part.startsWith("@")) {
        return (
          <span key={index} onClick={() => handleMentionClick(part.substring(1))} className="text-purple-500 font-semibold cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      return part;
    });
  };
  return <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{renderText()}</p>;
};

// --- Main Reusable Component ---
const PostCard = ({ post,user }) => {
  const { timeAgo, profileData, handlePostLike,api } = useContext(AuthContext);
  const [liked, setLiked] = useState(post.likes?.some((userId) => userId === user.userId));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const initialShares = Array.isArray(post.shares) ? post.shares.length : (post.shares || 0);
  const [sharesCount, setSharesCount] = useState(initialShares);
  const [showSharersModal, setShowSharersModal] = useState(false);
  const [sharersList, setSharersList] = useState([]);
  
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localCaption, setLocalCaption] = useState(post.caption || "");
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [isDeleted, setIsDeleted] = useState(false);

  // 👇 Check if the logged-in user is the OWNER of the post
  const isOwner = (post.user._id) === (user.userId);

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const { data } = await api.post("/api/post/delete-post", { postId: post._id || post.id });
      if (data.success) {
        toast.success(data.message);
        setIsDeleted(true);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  const handleEditSubmit = async () => {
    try {
      const { data } = await api.put("/api/post/edit-post", { postId: post._id || post.id, newCaption: editCaption });
      if (data.success) {
        toast.success(data.message);
        setLocalCaption(editCaption);
        setIsEditing(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit post");
    }
  };

  // --- SHARE LOGIC ---
  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    // 1. Tell backend to record the share
    try {
      // Assuming your route is POST /api/post/:postId/share
      const { data } = await api.post(`/api/post/${post._id}/share`);
      if (data.success && data.sharesCount !== undefined) {
        setSharesCount(data.sharesCount);
      }
    } catch (error) {
      console.error("Failed to record share in backend", error);
    }

    // 2. Native Share API (Mobile) or Clipboard Fallback (Desktop)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user.name}`,
          text: post.caption || "Check out this post!",
          url: postUrl,
        });
      } catch (error) {
        console.log("User canceled the native share.");
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link.");
      }
    }
  };

  // --- VIEW SHARERS LOGIC ---
  const handleViewShares = async () => {
    if (!isOwner) return;
    try {
      const { data } = await api.get(`/api/post/${post._id}/shares`);
      if (data.success) {
        setSharersList(data.sharers);
        setShowSharersModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch sharers");
    }
  };
  useEffect(() => {
    console.log("Post data updated:", post);
  }, [post]);
  useEffect(() => {
    console.log("User data updated:", user);
  }, [user]);

  if (isDeleted) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-5">

        {/* Post Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center">
            <img
              src={post.user?.profile}
              alt={post.user?.name}
              className="sm:h-12 sm:w-12 h-8 w-8 rounded-full object-cover"
            />
            <div className="ml-3">
              <div className="flex items-center gap-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">{post.user?.name}</h4>
                <FaCheckCircle className="text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.user?.username} · {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Options Menu */}
          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700 transition">
                <FiMoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-10 py-1">
                  <button 
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button 
                    onClick={handleDeletePost}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Body */}
        <div className="mb-1 sm:mb-4">
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-2">
              <textarea 
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                rows={3}
                placeholder="Write a caption..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditing(false); setEditCaption(localCaption); }} className="px-4 py-1.5 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition">Cancel</button>
                <button onClick={handleEditSubmit} className="px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 rounded-full shadow-lg shadow-purple-200 dark:shadow-none transition">Save</button>
              </div>
            </div>
          ) : (
            <PostText text={localCaption} />
          )}
        </div>

        {/* Media */}
        {post.mediaUrl && (
          post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              controls
              className="my-2 rounded-lg w-full object-contain"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post content"
              className="my-2 rounded-lg w-full object-cover"
            />
          )
        )}

        {/* Post Actions */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 space-x-6 mt-4">
          {/* Like Button */}
          <button
            onClick={() => handlePostLike(post._id, liked, setLiked, setLikesCount)}
            className={`flex items-center gap-2 transition-all duration-300 hover:scale-110 active:scale-95 ${liked ? "text-pink-500" : "hover:text-pink-500"}`}
          >
            <FaHeart className={liked ? "scale-110 drop-shadow-md" : ""} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 transition-all duration-300 hover:scale-110 active:scale-95 ${showComments ? "text-blue-500 drop-shadow-md" : "hover:text-blue-500"}`}
          >
            <FaComment />
            <span className="text-sm font-medium">{post.commentsCount || 0 || post.comments?.length}</span>
          </button>
          {/* Share Button */}
          <div className="flex items-center gap-1">
            <button onClick={handleShare} className="flex items-center gap-2 hover:text-green-500 transition-all duration-300 hover:scale-110 active:scale-95" title="Share Post">
              <FiShare2 />
            </button>

            {/* 👇 If owner, make the share count clickable! */}
            {isOwner && sharesCount > 0 ? (
              <span onClick={handleViewShares}
                className="cursor-pointer hover:underline hover:text-green-600 font-medium transition-colors ml-1"
                title="See who shared"
              >
                {sharesCount}
              </span>
            ) : (
              <span className="ml-1">{sharesCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* --- INLINE COMMENT SECTION --- */}
      {showComments && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            <CommentSection postId={post._id} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}
      {/* 👇 NEW: Sharers Modal Overlay */}
      {showSharersModal && (
        <ConnectionsListModal
          title="People who shared this"
          users={sharersList}
          onClose={() => setShowSharersModal(false)}
        />
      )}
    </div>
  );
};

export default PostCard;