import React, { useContext } from "react";
import { FiImage } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StoryFeature from "./StoryFeature"; // Adjust path if necessary
import PostCard from "../components/PostCard"; // 👇 Import your new reusable component!

const Feed = () => {
  const { posts, profileData } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 w-full max-w-2xl mx-auto p-4 sm:p-6 font-sans h-screen overflow-y-scroll transition-colors duration-200">
      {/* Stories Section */}
      <StoryFeature />
      
      {/* Posts Feed */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            // 👇 Use the new component here
            <PostCard key={post._id} post={post} user={profileData} /> 
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center">
          <hr className="w-full h-[1px] opacity-80 bg-black dark:bg-white border-none" />
          <div className="font-semibold text-center mt-4 text-gray-800 dark:text-gray-200">No Posts yet</div>
          <div className="flex justify-center items-center mt-4 gap-4">
            <div className="text-3xl">👉</div>
            <button onClick={() => navigate('/create-post')}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition"
            >
              <FiImage /> Create Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;