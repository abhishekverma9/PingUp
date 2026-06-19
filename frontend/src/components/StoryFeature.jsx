import React, { useContext, useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import StoryViewerContainer from "./StoryViewerContainer";
import CreateStoryComposer from "../pages/CreateStory";

const StoryFeature = () => {
  const { stories, token,profileData } = useContext(AuthContext);
  const [selectedStory, setSelectedStory] = useState(null);

  // Story thumbnail
  const StoryItem = ({ storyGroup, onClick }) => {
    const firstStory = storyGroup.stories[0]; // show first story as thumbnail
    return (
      <div onClick={onClick} className="flex flex-col items-center cursor-pointer group">
        <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] rounded-full">
          <img
            src={firstStory?.user?.profile || firstStory?.user?.profile_pic || firstStory?.user?.profilePic || "https://via.placeholder.com/150"}
            alt={storyGroup.user?.name || "User"}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-900 group-hover:scale-105 transition-transform"
          />
        </div>
        <p className="text-black dark:text-white font-semibold text-sm mt-1 truncate w-16 text-center">{storyGroup.user.name}</p>
      </div>
    );
  };
 
  // Create Story thumbnail
  const CreateStory = () => (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={() =>
        setSelectedStory({ id: "create", name: "Create Story", isUser: true })
      }
    >
      <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-gray-500 to-gray-700">
        <img
          src={profileData.profile}
          alt="Create Story"
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-900"
        />
        <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-gray-900">
          <FaPlus className="text-white text-xs" />
        </div>
      </div>
      <p className="text-sm font-semibold dark:text-white text-black mt-1">Create Story</p>
    </div>
  );

  useEffect(() => {
    if (token) console.log("Fetched stories:", stories);
    console.log(profileData)
  }, [stories, token]);

  return (
    <div className="flex flex-col text-white font-sans">
      {/* Story Bar */}
      <div className="flex gap-4 p-2 rounded-xl overflow-x-auto w-full max-w-md scrollbar-hide">
        <CreateStory />
        {stories.map((storyGroup, index) => (
          <StoryItem
            key={index}
            storyGroup={storyGroup}
            onClick={() => setSelectedStory(storyGroup)}
          />
        ))}
      </div>

      {/* Story Viewer or Create Story */}
      {selectedStory && (
        selectedStory.isUser ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative w-full max-w-[420px] h-[90vh] sm:h-[80vh] bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
              <CreateStoryComposer onClose={() => setSelectedStory(null)} />
            </div>
          </div>
        ) : (
          <StoryViewerContainer
            storiesData={[selectedStory]}
            onClose={() => setSelectedStory(null)}
          />
        )
      )}

    </div>
  );
};

export default StoryFeature;
