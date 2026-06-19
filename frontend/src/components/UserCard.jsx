import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FiUser } from "react-icons/fi";
import StoryViewerContainer from "./StoryViewerContainer";

const UserCard = ({ user }) => {
  const navigate = useNavigate();
  const { sendFollowRequest, cancelFollowRequest, unfollowUser, stories } = useContext(AuthContext);
  const [viewingStory, setViewingStory] = useState(null);

  // Local state to track button status
  // Initialize based on backend flags
  const [followState, setFollowState] = useState("follow"); // "follow" | "pending" | "following"

  useEffect(() => {
    if (user.isFollowing) setFollowState("following");
    else if (user.isPending) setFollowState("pending");
    else setFollowState("follow");
  }, [user.isFollowing, user.isPending]);

  const handleFollowToggle = async () => {
    try {
      if (followState === "follow") {
        await sendFollowRequest(user._id);
        setFollowState("pending");
      } else if (followState === "pending") {
        await cancelFollowRequest(user._id);
        setFollowState("follow");
      } else if (followState === "following") {
        await unfollowUser(user._id);
        setFollowState("follow");
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
      return "font-semibold py-1.5 px-4 text-xs md:text-sm rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 min-w-[80px] shadow-lg shadow-purple-200 dark:shadow-none";
    if (followState === "pending")
      return "font-semibold py-1.5 px-4 text-xs md:text-sm rounded-full transition-all duration-300 shadow-sm bg-yellow-400 text-white hover:opacity-90 min-w-[80px]";
    if (followState === "following")
      return "font-semibold py-1.5 px-4 text-xs md:text-sm rounded-full transition-all duration-300 shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 min-w-[80px]";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md flex items-center justify-between transition-all duration-300 hover:scale-[1.01] border border-gray-100 dark:border-gray-700 group">
      <div 
        className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 cursor-pointer" 
        onClick={() => navigate(`/friendprofile/${user._id}`)}
      >
        <div 
          className={`rounded-full p-[2px] shrink-0 transition-transform duration-200 ${
              stories?.some(group => (group.user.id || group.user._id) === user._id)
                ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 hover:scale-105" 
                : "bg-transparent"
          }`}
          onClick={(e) => {
              const activeStoryGroup = stories?.find(group => (group.user.id || group.user._id) === user._id);
              if (activeStoryGroup) {
                  e.stopPropagation();
                  setViewingStory(activeStoryGroup);
              }
          }}
        >
          <img
            src={user.profile}
            alt={user.name}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 bg-white group-hover:ring-2 ring-transparent group-hover:ring-purple-200 dark:group-hover:ring-purple-900 transition-all"
          />
        </div>
        <div className="flex flex-col text-left overflow-hidden w-full">
          <p className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate w-full">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">@{user.username}</p>
          {user.bio && <p className="text-xs text-gray-400 dark:text-gray-500 truncate w-full mt-0.5 hidden sm:block">{user.bio}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <button onClick={handleFollowToggle} className={getButtonClass()}>
          {getButtonText()}
        </button>
      </div>

      {/* Story Viewer Modal Overlay */}
      {viewingStory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
              <StoryViewerContainer 
                  storiesData={[viewingStory]} 
                  onClose={() => setViewingStory(null)} 
              />
          </div>
      )}
    </div>
  );
};

export default UserCard;
