import React, { useState, useEffect, useContext } from "react";
import StoryViewer from "./StoryViewer";
import { AuthContext } from "../context/AuthContext";

const StoryViewerContainer = ({ storiesData = [], onClose }) => {
  const { profileData, handleDeleteStory, markViewed, fetchViewers } =
    useContext(AuthContext);

  // Indexes for tracking current user and current story
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Viewers popup state
  const [viewersList, setViewersList] = useState([]);
  const [showViewers, setShowViewers] = useState(false);

  // Safely get current user and their stories
  const currentUser = storiesData[currentUserIndex] || { user: {}, stories: [] };
  const currentStories = currentUser.stories || [];
  const currentStory = currentStories[currentStoryIndex];

  // Move to next story
  const nextStory = () => {
    if (!currentStory) return;
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < storiesData.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose(); // All stories viewed
    }
  };

  // Move to previous story
  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      const prevUser = storiesData[currentUserIndex - 1] || { stories: [] };
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  // Open viewers popup
  const handleOpenViewers = async () => {
    if (!currentStory) return;
    const viewers = await fetchViewers(currentStory._id || currentStory.id);
    const filteredViewers = viewers.filter(
        (v) => (v._id || v.id) !== profileData.userId
    );
    setViewersList(filteredViewers);
    setShowViewers(true);
  };

  // Close viewers popup
  const handleCloseViewers = () => setShowViewers(false);

  // Auto-progress after 30s per story
  useEffect(() => {
    if (!currentStory) return;
    const storyOwnerId = currentUser.user._id || currentUser.user.id;
    if (storyOwnerId !== profileData.userId) {
        markViewed(currentStory._id || currentStory.id);
    }
    const timer = setTimeout(nextStory, 30000); // 30s per story
    return () => clearTimeout(timer);
  }, [currentStory]);

  if (!currentStory) return null;

  return (
    <StoryViewer
      story={currentStory}
      user={currentUser.user}
      totalStories={currentStories} // pass array, not number
      currentIndex={currentStoryIndex}
      onClose={onClose}
      onNext={nextStory}
      onPrev={prevStory}
      onDelete={() => handleDeleteStory(currentStory._id || currentStory.id)}
      onViewers={handleOpenViewers}
      loggedInUserId={profileData.userId}
      viewersList={viewersList}
      showViewers={showViewers}
      closeViewers={handleCloseViewers}
    />
  );
};

export default StoryViewerContainer;
