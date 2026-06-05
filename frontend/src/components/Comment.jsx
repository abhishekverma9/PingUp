import React, { useContext, useEffect, useState } from 'react';
import { FiHeart, FiCornerUpLeft, FiMoreHorizontal, FiX, FiTrash2 } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Comment = ({ postId, comment, timeAgo, postComment, deleteComment, isPosting, likeComment, loggedInUserId }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const hasReplyText = replyText.trim().length > 0;
  const isLiked = comment.likes?.includes(loggedInUserId);
  // --- HANDLERS ---
  const handleCancel = () => {
    setIsReplying(false);
    setReplyText('');
  };
  const handleSubmit = () => {
    if (!hasReplyText) return;
    postComment(postId, replyText, comment._id);
    setIsReplying(false);
    setReplyText('');
  };
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(comment._id, postId); // Call the function passed from parent
    }
    setShowMenu(false); // Close menu
  };
  return (
    <div className="flex space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group relative mb-1">
      {/* Avatar */}
      <img src={comment.user.profile}
        alt={comment.user.name}
        className="w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 object-cover shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
      />
      <div className="flex-1 min-w-0">
        {/* Header: Name & More Icon */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px] truncate">{comment.user.name}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs truncate">@{comment.user.username}</span>
          </div>

          {/* --- MENU SECTION --- */}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all"
            >
              <FiMoreHorizontal size={18} />
            </button>

            {/* --- POPUP MENU --- */}
            {showMenu && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                {/* The Dropdown */}
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 rounded-t-lg rounded-b-lg"
                  >
                    <FiTrash2 size={16} />
                    <span>Delete</span>
                  </button>
                  {/* You can add more options here (e.g., Report, Edit) */}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Comment Text */}
        <p className="mt-0.5 text-gray-700 dark:text-gray-200 text-[15px] leading-relaxed break-words">{comment.text}</p>
        {/* Footer: Date & Reply Button */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1.5">
          <span className="font-medium text-gray-400">{timeAgo(comment.createdAt)}</span>
          <button onClick={() => setIsReplying(!isReplying)} className={`flex items-center space-x-1 font-semibold transition-colors ${isReplying ? 'text-indigo-600' : 'hover:text-indigo-500'}`}>
            <span>Reply</span>
          </button>
        </div>
        {/* --- REPLY INPUT SECTION --- */}
        {isReplying && (
          <div className="flex items-start space-x-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex-1 relative">
              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${comment.user.username}...`}
                className="w-full p-2 px-4 bg-gray-50 dark:bg-gray-800/80 dark:text-gray-100 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              {hasReplyText && (
               <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={handleCancel} className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={isPosting} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isPosting ? "bg-indigo-300 cursor-not-allowed text-white" : "text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20"}`}>
                    Reply
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Show Replies Link */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1">
            {/* Toggle Button */}
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="ml-1 text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center space-x-2 transition-colors focus:outline-none"
            >
              <div className="w-6 h-[1px] bg-gray-300"></div>
              <span>
                {showReplies
                  ? 'Hide replies'
                  : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                }
              </span>
            </button>

            {/* Replies List */}
            {showReplies && (
              <div className="mt-2 pl-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {comment.replies.map((reply) => {
                  const isReplyLiked = reply.likes?.includes(loggedInUserId);
                  return (
                    <div key={reply._id} className="flex space-x-3 group/reply relative">

                      {/* Thread Line */}
                      <div className="absolute -left-5 top-0 bottom-0 w-[2px] bg-gray-100 group-last/reply:h-4"></div>

                      {/* Avatar */}
                      <img src={reply.user.profile}
                        alt={reply.user.name}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-gray-100"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          {/* Left: Name + Username */}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">{reply.user.name}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-[10px]">@{reply.user.username}</span>
                          </div>
                          {/* Right: DELETE + LIKE */}
                          <div className="flex items-start space-x-2">
                            {/* DELETE BUTTON */}
                            <button onClick={() => deleteComment(reply._id, postId)}
                              className="text-gray-400 hover:text-red-600 transition p-1 mt-0.5 opacity-0 group-hover/reply:opacity-100"
                              title="Delete reply"
                            >
                              <FiTrash2 size={14} />
                            </button>
                            {/* LIKE GROUP (Vertical Column) */}
                            <div className="flex flex-col items-center">
                              {/* Heart */}
                              <button onClick={() => likeComment(reply._id, postId)}
                                className="group/like focus:outline-none p-1 transition"
                              >
                                <FiHeart
                                  size={15}
                                  className={`transition-colors ${isReplyLiked
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-400 group-hover/like:text-red-500"
                                    }`}
                                />
                              </button>
                              {/* Count (Below Heart) */}
                              <span className="text-[10px] font-medium text-gray-500 -mt-0.5">
                                {reply.likes?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reply Text */}
                        <p className="text-gray-800 dark:text-gray-200 text-sm -mt-2 leading-relaxed pr-10">
                          <span className='text-blue-700 dark:text-blue-400'>@{comment.user.username} </span>{reply.text}
                        </p>

                        {/* Footer: Date */}
                        <div className="">
                          <span className="text-gray-400 text-[10px]">{timeAgo(reply.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Like Button */}
      <div className="flex flex-col items-center space-y-0.5 ml-2 pt-1 flex-shrink-0">
        <button onClick={() => likeComment(comment._id, postId)} className="group p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <FiHeart size={16}
            className={`transition-colors ${isLiked
              ? "fill-red-500 text-red-500"   // <--- IF LIKED: Red Fill
              : "text-gray-400 group-hover/like:text-red-500" // <--- ELSE: Gray
              }`}
          />
        </button>
        <span className="text-[11px] font-bold text-gray-500">{comment.likes.length > 0 ? comment.likes.length : ""}</span>
      </div>
    </div>
  );
};
const CommentSection = ({ onClose, postId }) => {
  const [mainComment, setMainComment] = useState('');
  const { api, timeAgo, profileData,fetchFeedPosts} = useContext(AuthContext)
  const [comments, setComments] = useState([])
  const [isPosting, setIsPosting] = useState(false);
  const loggedInUserId = profileData.userId
  
  const fetchComments = async (postId) => {
    try {
      const { data } = await api.get(`/api/comment/get/${postId}`);
      if (data.success) {
        setComments(data.comments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }
  const deleteComment = async (commentId, postId) => {
    try {
      const { data } = await api.delete(`/api/comment/delete/${commentId}`);
      if (data.success) {
        // setComments(comments.filter(comment => comment.id !== commentId));
        fetchComments(postId);
        fetchFeedPosts(); // Refresh the feed to show the updated comment count
        toast.success("Comment deleted successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }
  const postComment = async (postId, text, parentCommentId) => {
    setIsPosting(true)
    try {
      const { data } = await api.post(`/api/comment/add`, { postId, text, parentCommentId });
      if (data.success) {
        toast.success(data.message)
        fetchComments(postId);
        fetchFeedPosts(); // Refresh the feed to show the updated comment count
        setMainComment("")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  }
  const likeComment = async (commentId, postId) => {
    try {
      const { data } = await api.post(`/api/comment/like/${commentId}`);
      if (data.success) {
        toast.success(data.message);
        fetchComments(postId);
        fetchFeedPosts(); // Refresh the feed to show the updated comment count
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }
  const hasText = mainComment.trim().length > 0;
  useEffect(() => {
    fetchComments(postId);
  }, [postId]);
  useEffect(() => {
    console.log("Comments updated:", comments);
  }, [comments]);
  return (
    <div className="w-full font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
        <h3 className="text-lg font-extrabold tracking-tight">Comments</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FiX size={20} />
        </button>
      </div>
      <div className="flex items-start space-x-3 mb-6">
        <img
          src={profileData?.profile || "https://placehold.co/40x40/E2E8F0/B0B6BF"}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-gray-800"
        />
        <div className="flex-1 relative">
          <textarea
            placeholder="Add a comment..."
            className="w-full p-3 px-4 bg-gray-50 dark:bg-gray-800/80 dark:text-gray-100 rounded-2xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all resize-none overflow-hidden min-h-[44px] text-[15px]"
            rows={1}
            value={mainComment}
            onChange={(e) => {
              setMainComment(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />

          {hasText && (
            <div className="flex justify-end space-x-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <button onClick={() => setMainComment('')}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button onClick={() => { postComment(postId, mainComment, null) }} disabled={isPosting}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${isPosting ? "bg-indigo-300 cursor-not-allowed text-white" : "text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20"}`}
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="md:space-y-5 space-y-3">
        {comments.map((comment) => (
          <Comment key={comment._id}
            postId={postId}
            comment={comment}
            timeAgo={timeAgo}
            deleteComment={deleteComment}
            postComment={postComment}
            isPosting={isPosting}
            setIsPosting={setIsPosting}
            likeComment={likeComment}
            loggedInUserId={loggedInUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;