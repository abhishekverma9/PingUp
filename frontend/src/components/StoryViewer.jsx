import React, { useEffect, useState, useRef, useContext } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiEye,
  FiTrash2,
  FiArrowLeft,
} from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { AuthContext } from "../context/AuthContext";

const StoryViewer = ({
  story,
  user,
  totalStories,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onDelete,
  onViewers,
  loggedInUserId,
  showViewers,
  viewersList,
  closeViewers,
}) => {
  const { handleLikeStory, handleStoryComment, timeAgo } = useContext(AuthContext);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(true);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto progress
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / (30 * 20)));
    }, 50);

    setShowUserInfo(true);
    const fadeTimeout = setTimeout(() => setShowUserInfo(false), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, [story]);

  // Tap navigation
  const handleTap = (e) => {
    const x = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    if (x < width / 2) onPrev?.();
    else onNext?.();
  };

  // Swipe navigation
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const distance = touchEndX.current - touchStartX.current;
    const threshold = 50;
    if (distance > threshold) onPrev?.();
    else if (distance < -threshold) onNext?.();
  };

  // Like state
  useEffect(() => {
    setLiked(story.likes?.some((obj) => obj.user === loggedInUserId) || false);
  }, [story, loggedInUserId]);

  const isOwnStory = story.user?._id === loggedInUserId;
  const canShowPrev = totalStories?.length > 1 && currentIndex > 0;
  const canShowNext =
    totalStories?.length > 1 && currentIndex < totalStories.length - 1;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center font-sans sm:p-4">
      <div
        className="relative w-full h-[100dvh] sm:max-w-[420px] sm:h-[85vh] bg-black sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress Bars */}
        <div className="absolute top-10 sm:top-3 left-2 right-2 flex space-x-1 z-40">
          {(totalStories || []).map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="bg-white h-1 transition-all"
                style={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                        ? `${progress}%`
                        : "0%",
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Header - user info + time */}
        {user && (
          <div className="absolute top-14 sm:top-6 left-14 sm:left-12 right-0 flex justify-between items-center px-4 z-50 pointer-events-none">
            <span className="text-gray-300 text-xs drop-shadow-md font-semibold">
              {timeAgo(story.createdAt)}
            </span>
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto">
              <img
                src={user.profile}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-white/80"
              />
              <span className="text-white font-bold text-sm truncate drop-shadow-md">
                {user.name}
              </span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="absolute top-14 sm:top-6 left-4 z-50">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-black/40 rounded-full hover:bg-black/60 transition backdrop-blur-sm"
          >
            <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Prev / Next Buttons */}
        {canShowPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-50"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
        )}
        {canShowNext && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-50"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Story Content */}
        <main className="relative w-full h-full flex items-center justify-center">
          <div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: story.backgroundColor || "#000" }}
          ></div>

          {story.mediaUrl && (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="absolute z-10 select-none object-contain"
              style={{
                width: "100%",
                height: "100%",
                // 👇 Apply the exact drag, zoom, and origin that was saved!
                left: story.imageSettings?.left || "0%",
                top: story.imageSettings?.top || "0%",
                transform: `scale(${story.imageSettings?.scale || 1})`,
                transformOrigin: `${story.imageSettings?.originX || "50%"} ${story.imageSettings?.originY || "50%"}`,
              }}
            />
          )}
          {/* 👇 UPDATED CAPTION BLOCK */}
          {story.caption && (
            <div
              // We added w-64, text-center, and the text sizing classes from your Composer textarea!
              className="absolute z-20 w-64 text-center text-2xl sm:text-3xl font-semibold leading-tight whitespace-pre-wrap"
              style={{
                left: story.caption.position.x,
                top: story.caption.position.y,
                fontFamily: story.caption.font.name,
                fontWeight: story.caption.font.weight,
                fontStyle: story.caption.font.style,
                color: story.caption.font.color,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {story.caption.content}
            </div>
          )}
          {/* 👇 UPDATED EMOJI BLOCK */}
          {story.emojis?.map((e, i) => (
            <div
              key={i}
              className="absolute select-none z-20"
              style={{
                left: e.position.x,
                top: e.position.y,
                fontSize: "2rem" // 👈 Changed from Tailwind text-2xl to match composer exactly
              }}
            >
              {e.emoji}
            </div>
          ))}

          {/* Music Info */}
          {story.music && (
            <div
              className="absolute z-20 cursor-default flex items-center space-x-3 bg-black/60 px-4 py-2 rounded-full"
              style={{
                left: story.music.position?.x ?? 12,
                top: story.music.position?.y ?? 12,
              }}
            >
              {story.music.albumCover && (
                <img
                  src={story.music.albumCover}
                  alt={story.music.title}
                  className="w-8 h-8 rounded"
                />
              )}
              <div className="flex flex-col max-w-[180px]">
                <span className="text-white text-sm font-semibold truncate">
                  {story.music.title}
                </span>
                <span className="text-gray-300 text-xs truncate">
                  {story.music.artist}
                </span>
              </div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 h-3 bg-green-600 animate-bounce"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {story.music?.preview && (
            <audio
              src={story.music.preview}
              autoPlay
              loop
              style={{ display: "none" }}
              onError={(e) => console.warn("Audio error", e)}
            />
          )}
        </main>

        {/* Bottom: Like + Comment */}
        {!isOwnStory ? (
          <div className="absolute bottom-6 sm:bottom-4 left-0 right-0 z-50 px-4 sm:px-4 flex items-center gap-3">
            <button
              onClick={() => handleLikeStory(story._id, liked, setLiked)}
              className="p-3 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 transition backdrop-blur-sm"
            >
              {liked ? (
                <AiFillHeart className="w-6 h-6 sm:w-6 sm:h-6 text-red-500" />
              ) : (
                <AiOutlineHeart className="w-6 h-6 sm:w-6 sm:h-6 text-white" />
              )}
            </button>

            <div className="flex flex-1 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 px-4 py-3 sm:py-2 bg-transparent text-white placeholder-gray-300 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={() => handleStoryComment(story._id, comment, setComment)}
              className="p-3 sm:p-2 transition bg-indigo-500 hover:bg-indigo-600 rounded-full text-white shadow-lg"
            >
              <FiSend className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        ) : (
          <div className="absolute bottom-6 sm:bottom-4 left-0 right-0 z-50 px-6 sm:px-6 flex items-center justify-between">
            <button
              onClick={onViewers}
              className="flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 transition text-gray-200 backdrop-blur-sm border border-white/10"
            >
              <FiEye className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onDelete}
              className="flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-red-600 transition text-red-400 hover:text-white backdrop-blur-sm border border-white/10"
            >
              <FiTrash2 className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Viewers Popup */}
        {showViewers && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-start pt-10 px-4">
            <div className="w-full max-w-[400px] bg-gray-900 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
                <h2 className="text-white font-semibold">Viewers</h2>
                <button
                  onClick={closeViewers}
                  className="text-white text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Viewers List with inline comments */}
              <ViewerList story={story} viewersList={viewersList} timeAgo={timeAgo} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 👇 Inline ViewerList Component (Updated for better UX)
const ViewerList = ({ story, viewersList, timeAgo }) => {
  // Helper to safely check if a viewer liked the story
  const hasLiked = (viewerId) => {
    if (!story.likes) return false;
    // Checks if the likes array contains the viewer's ID (handles both populated objects and raw strings)
    return story.likes.some((like) => like === viewerId || like.user === viewerId);
  };
  useEffect(() => {
    console.log("Viewers List:", viewersList);
  }, [viewersList]);
  useEffect(() => {
    console.log("Story:", story);
  }, [story]);
  return (
    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-800 pb-4">
      {viewersList.length > 0 ? (
        viewersList.map((v) => {
          const viewerId = v._id;
          const userComments = story.comments?.filter((c) => c.user === viewerId) || [];
          const userLiked = hasLiked(viewerId);
          return (
            <div key={viewerId} className="flex flex-col px-4 py-3 hover:bg-gray-800/30 transition">
              
              {/* Top Row: User Info & Like Status */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={v.profile}
                    alt={v.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-sm">{v.name}</span>
                    <span className="text-gray-400 text-xs">@{v.username}</span>
                  </div>
                </div>

                {/* Heart Icon if they liked it */}
                {userLiked && (
                  <div className="mt-1">
                    <AiFillHeart className="text-red-500 w-5 h-5 drop-shadow-md animate-in zoom-in" />
                  </div>
                )}
              </div>

              {/* Bottom Row: Inline Comments */}
              {userComments.length > 0 && (
                <div className="mt-2 pl-13 space-y-2">
                  {userComments.map((c) => (
                    <div 
                      key={c._id || c.id} 
                      className="bg-gray-800/60 rounded-lg p-2.5 ml-12 border border-gray-700/50"
                    >
                      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-snug">
                        {c.text}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-1 text-right">
                        {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })
      ) : (
        <div className="p-6 text-center text-gray-500 text-sm">
          No one has viewed this story yet.
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
