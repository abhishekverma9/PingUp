import React, { useContext, useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import StoryViewerContainer from "../components/StoryViewerContainer"; 
import ConnectionsListModal from "../components/ConnectionsListModal";
// 👇 NEW: Import your shared PostCard component
import PostCard from "../components/PostCard";

// --- Components ---
const ProfileHeader = ({ friendProfile, friendId, hasStory, onProfilePicClick, onFollowersClick, onFollowingClick }) => {
  const { dateFormat, sendFollowRequest, cancelFollowRequest, unfollowUser } = useContext(AuthContext)
  const [followState, setFollowState] = useState("follow")
  
  useEffect(() => {
    if (friendProfile.isFollowing) setFollowState("following");
    else if (friendProfile.isPending) setFollowState("pending");
    else setFollowState("follow");
  }, [friendProfile.isFollowing, friendProfile.isPending]);
  
  const handleFollowToggle = async () => {
    try {
      if (followState === "follow") {
        await sendFollowRequest(friendId);
        setFollowState("pending");
      } else if (followState === "pending") {
        await cancelFollowRequest(friendId);
        setFollowState("follow");
      } else if (followState === "following") {
        await unfollowUser(friendId);
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
      return "flex items-center gap-2 rounded-full py-1 px-4 md:px-6 md:py-2 text-sm font-semibold transition bg-blue-500 text-white hover:bg-blue-600";
    if (followState === "pending")
      return "flex items-center gap-2 rounded-full py-1 px-4 md:px-6 md:py-2 text-sm font-semibold transition bg-yellow-200 text-white hover:bg-yellow-300";
    if (followState === "following")
      return "flex items-center gap-2 rounded-full py-1 px-4 md:px-6 md:py-2 text-sm font-semibold transition bg-gray-200 text-gray-700 hover:bg-gray-300";
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-2 transition-colors duration-200">
      <div className="relative">
        <img
          src={friendProfile.cover}
          alt="Cover"
          className="w-full h-24 sm:h-48 md:h-64 object-cover rounded-t-lg"
        />
        
        <div 
          className={`absolute -bottom-10 left-8 rounded-full p-[3px] transition-transform duration-200 z-10 w-[72px] h-[72px] md:w-[136px] md:h-[136px] ${
            hasStory 
              ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 cursor-pointer hover:scale-105" 
              : "bg-transparent"
          }`}
          onClick={onProfilePicClick}
        >
          <img
            src={friendProfile.profile}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 bg-white"
          />
        </div>
      </div>

      <div className="pt-6 px-8 pb-4">
        <div className="flex justify-end">
          <button onClick={handleFollowToggle} className={getButtonClass()}>
            {getButtonText()}
          </button>
        </div>

        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {friendProfile.name}
          </h1>
          <FiCheckCircle className="text-blue-500 ml-1" />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">@{friendProfile.username}</p>

        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {friendProfile.bio}
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FiMapPin />
            <span>{friendProfile.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiCalendar />
            <span>Joined {dateFormat(friendProfile.startDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-1 md:mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-bold text-gray-800 dark:text-gray-100">{friendProfile.postsCount}</span>{" "}
            Posts
          </p>
          <p className="cursor-pointer hover:underline" onClick={onFollowersClick}>
            <span className="font-bold text-gray-800 dark:text-gray-100">{friendProfile.followersCount}</span>{" "}
            Followers
          </p>
          <p className="cursor-pointer hover:underline" onClick={onFollowingClick}>
            <span className="font-bold text-gray-800 dark:text-gray-100">{friendProfile.followingCount}</span>{" "}
            Following
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const FriendProfilePage = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [modalType, setModalType] = useState(null);
  const [friendConnections, setFriendConnections] = useState({ followers: [], following: [] });
  
  // 👇 ADDED 'profileData' to the destructured context to pass to the PostCard
  const { getFriendProfileData, friendProfile, token, getPostsByFriend, postsByFriend, stories, fetchFriendConnections, profileData } = useContext(AuthContext)
  const { friendId } = useParams();
  
  const [viewingStory, setViewingStory] = useState(null);

  useEffect(() => {
    if (token) {
        getFriendProfileData(friendId)
        getPostsByFriend(friendId)
        fetchFriendConnections(friendId).then(data => {
            if (data) setFriendConnections(data);
        });
    }
  }, [token, friendId]) 

  const activeStoryGroup = stories.find(
    (group) => (group.user.id || group.user._id) === friendId
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 lg:w-[70vw] w-[100vw] h-screen overflow-y-scroll font-sans p-4 sm:p-8 transition-colors duration-200 relative">
      <div className="max-w-3xl mx-auto">
        <ProfileHeader 
          friendId={friendId} 
          friendProfile={friendProfile} 
          hasStory={!!activeStoryGroup} 
          onProfilePicClick={() => activeStoryGroup && setViewingStory(activeStoryGroup)} 
          onFollowersClick={() => setModalType("followers")}
          onFollowingClick={() => setModalType("following")}
        />
        
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-2 transition-colors duration-200">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {["posts", "media", "likes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center py-3 font-semibold transition-colors ${activeTab === tab
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Posts Feed */}
        <div className="space-y-4">
          {activeTab === "posts" &&
            (postsByFriend.length !== 0 ? postsByFriend.map((post) => (
              // 👇 Pass the shared PostCard with user={profileData}
              <PostCard key={post._id || post.id} post={post} user={profileData} />
            )) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-300 rounded-lg shadow-md transition-colors duration-200">
                No Posts.
              </div>
            ))
          }
          {activeTab === "media" && (
            postsByFriend.some(post => post.mediaUrl) ? (
              postsByFriend
                .filter(post => post.mediaUrl)
                .map(post => (
                  <PostCard key={post._id || post.id} post={post} user={profileData} />
                ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-300 rounded-lg shadow-md transition-colors duration-200">
                Media content goes here.
              </div>
            )
          )}
          {activeTab === "likes" && (
            postsByFriend.some(post => post.likes && post.likes.length > 0) ? (
              postsByFriend
                .filter(post => post.likes && post.likes.length > 0)
                .map(post => (
                  <PostCard key={post._id || post.id} post={post} user={profileData} />
                ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-300 rounded-lg shadow-md transition-colors duration-200">
                Liked content goes here.
              </div>
            )
          )}
        </div>
      </div>

      {/* Story Viewer Modal Overlay */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <StoryViewerContainer 
            storiesData={[viewingStory]} 
            onClose={() => setViewingStory(null)} 
          />
        </div>
      )}

      {/* Connections Modal Overlay */}
      {modalType === "followers" && (
        <ConnectionsListModal 
          title="Followers" 
          users={friendConnections.followers} 
          onClose={() => setModalType(null)} 
        />
      )}
      {modalType === "following" && (
        <ConnectionsListModal 
          title="Following" 
          users={friendConnections.following} 
          onClose={() => setModalType(null)} 
        />
      )}
    </div>
  );
};

export default FriendProfilePage;