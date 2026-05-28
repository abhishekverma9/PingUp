import React, { useContext, useState } from "react";
import {
  FiCheckCircle,
  FiEdit,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import EditProfileModal from "../components/EditProfileModal";
import { AuthContext } from "../context/AuthContext";
import StoryViewerContainer from "../components/StoryViewerContainer";
import ConnectionsListModal from "../components/ConnectionsListModal";
// 👇 NEW: Import your shared PostCard component
import PostCard from "../components/PostCard"; 

// --- Components ---
const ProfileHeader = ({ user, onEdit, hasStory, onProfilePicClick, onFollowersClick, onFollowingClick }) => {
  const { dateFormat } = useContext(AuthContext)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-2 transition-colors duration-200">
      <div className="relative">
        <img
          src={user.cover}
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
            src={user.profile}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 bg-white"
          />
        </div>
      </div>

      <div className="pt-6 px-8 pb-4">
        <div className="flex justify-end">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-full py-1 px-2 md:px-4 md:py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiEdit />
            <span>Edit</span>
          </button>
        </div>

        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user.name}
          </h1>
          <FiCheckCircle className="text-blue-500 ml-1" />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>

        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          <p>{user.bio}</p>
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <FiMapPin />
            <span>{user.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiCalendar />
            <span>Joined {dateFormat(user.startDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-1 md:mt-4 text-sm">
          <p>
            <span className="font-bold text-gray-800 dark:text-gray-100">{user.postsCount}</span>{" "}
            Posts
          </p>
          <p className="cursor-pointer hover:underline" onClick={onFollowersClick}>
            <span className="font-bold text-gray-800 dark:text-gray-100">{user.followersCount}</span>{" "}
            Followers
          </p>
          <p className="cursor-pointer hover:underline" onClick={onFollowingClick}>
            <span className="font-bold text-gray-800 dark:text-gray-100">{user.followingCount}</span>{" "}
            Following
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState(null); 
  
  const { profileData, postsByMe, stories, connections } = useContext(AuthContext);
  
  const [viewingStory, setViewingStory] = useState(null);

  const profileId = profileData?.id || profileData?._id || profileData?.userId;
  const activeStoryGroup = stories.find(
    (group) => (group.user.id || group.user._id) === profileId
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 lg:w-[70vw] w-[100vw] h-screen overflow-y-scroll font-sans p-4 sm:p-8 transition-colors duration-200 relative">
      <div className="max-w-3xl mx-auto">
        <ProfileHeader 
          user={profileData} 
          onEdit={() => setIsEditing(true)} 
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
                className={`flex-1 text-center py-3 font-semibold ${activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
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
            (postsByMe.length !== 0 ? postsByMe.map((post) => (
              // 👇 Pass the shared PostCard with user={profileData}
              <PostCard key={post._id || post.id} post={post} user={profileData} />
            )) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-md transition-colors duration-200">
                No Posts.
              </div>
            ))
          }
          {activeTab === "media" && (
            postsByMe.some(post => post.mediaUrl) ? (
              postsByMe
                .filter(post => post.mediaUrl)
                .map(post => (
                  <PostCard key={post._id || post.id} post={post} user={profileData} />
                ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-md transition-colors duration-200">
                Media content goes here.
              </div>
            )
          )}
          {activeTab === "likes" && (
            postsByMe.some(post => post.likes && post.likes.length > 0) ? (
              postsByMe
                .filter(post => post.likes && post.likes.length > 0)
                .map(post => (
                  <PostCard key={post._id || post.id} post={post} user={profileData} />
                ))
            ) : (
              <div className="text-center p-8 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-md transition-colors duration-200">
                Liked content goes here.
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}

      {/* Story Viewer Modal overlay */}
      {viewingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <StoryViewerContainer 
            storiesData={[viewingStory]} 
            onClose={() => setViewingStory(null)} 
          />
        </div>
      )}

      {/* Connections Modal */}
      {modalType === "followers" && (
        <ConnectionsListModal 
          title="Followers" 
          users={connections?.followers || []} 
          onClose={() => setModalType(null)} 
        />
      )}
      {modalType === "following" && (
        <ConnectionsListModal 
          title="Following" 
          users={connections?.following || []} 
          onClose={() => setModalType(null)} 
        />
      )}
    </div>
  );
};

export default ProfilePage;