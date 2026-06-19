import React, { useContext, useEffect, useRef, useCallback, useState } from "react";
import { FiImage, FiLoader } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StoryFeature from "./StoryFeature"; // Adjust path if necessary
import PostCard from "../components/PostCard"; // 👇 Import your new reusable component!
import PostCardSkeleton from "./PostCardSkeleton";

const Feed = () => {
  const { posts, profileData, isPostsLoading, fetchFeedPosts, feedCursor, hasMorePosts } = useContext(AuthContext);
  const navigate = useNavigate();
  const observer = useRef();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const lastPostElementRef = useCallback(node => {
    if (isPostsLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(async entries => {
      if (entries[0].isIntersecting && hasMorePosts) {
        setIsLoadingMore(true);
        await fetchFeedPosts(feedCursor);
        setIsLoadingMore(false);
      }
    }, { threshold: 1.0 });
    if (node) observer.current.observe(node);
  }, [isPostsLoading, isLoadingMore, hasMorePosts, feedCursor, fetchFeedPosts]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 w-full max-w-2xl mx-auto p-4 sm:p-6 font-sans h-screen overflow-y-scroll transition-colors duration-200">
      {/* Stories Section */}
      <StoryFeature />
      
      {/* Posts Feed */}
      {isPostsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return (
                <div ref={lastPostElementRef} key={post._id}>
                  <PostCard post={post} user={profileData} />
                </div>
              );
            } else {
              return <PostCard key={post._id} post={post} user={profileData} />;
            }
          })}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <FiLoader className="text-2xl text-blue-500 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center py-20 px-4 mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300">
          <div className="relative mb-8 group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 blur-2xl opacity-20 dark:opacity-30 rounded-full group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-full shadow-inner border border-white/50 dark:border-gray-600">
              <FiImage className="text-6xl text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500 ease-out" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-sans tracking-tight">No Posts Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8 text-base leading-relaxed">
            Your feed is quiet right now. Be the first to share a moment, a thought, or start a new conversation!
          </p>
          
          <button 
            onClick={() => navigate('/create-post')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></div>
            <FiImage className="relative z-10 text-xl group-hover:text-white transition-colors duration-300 group-hover:rotate-12" /> 
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">Create First Post</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Feed;