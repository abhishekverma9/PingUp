import React from "react";

const PostCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-4 animate-pulse">
      <div className="p-5">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-4/6 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Image/Media Skeleton */}
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="w-10 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSkeleton;
