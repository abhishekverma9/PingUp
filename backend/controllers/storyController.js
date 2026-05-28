import Notification from "../models/NotificationModel.js";
import Story from "../models/StoryModel.js";
import { v2 as cloudinary } from "cloudinary";
import catchAsync from "../utils/catchAsync.js";

// ✅ Create a new story
const createStory = catchAsync(async (req, res, next) => {
    const { userId } = req; 
    
    const caption = req.body.caption ? JSON.parse(req.body.caption) : null;
    const emojis = req.body.emojis ? JSON.parse(req.body.emojis) : [];
    let music = req.body.music ? JSON.parse(req.body.music) : null;
    const backgroundColor = req.body.backgroundColor || "#ffffff";
    const imageSettings = req.body.imageSettings ? JSON.parse(req.body.imageSettings) : null;

    if (!req.file && (!caption || !caption.content) && emojis.length === 0 && !music) {
      return res.status(400).json({
        success: false,
        message: "Story must have at least one element (media, text, emoji, or music)",
      });
    }

    if (music) {
      if (!music.preview) {
        return res.status(400).json({ success: false, message: "Selected track has no preview available." });
      }
      music = {
        id: music.id || null,
        title: music.title || "Unknown Track",
        artist: typeof music.artist === "object" ? music.artist.name : music.artist || "Unknown Artist",
        preview: music.preview,
        albumCover: music.albumCover || music.album?.cover_medium || music.album?.cover_small || "",
        position: music.position || { x: 100, y: 400 },
      };
    }

    let mediaUrl = "";
    let mediaType = "none";
    let cloudinaryId = "";

    if (req.file) {
      const file = req.file;
      const isVideo = file.mimetype.startsWith("video");

      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "stories",
        resource_type: isVideo ? "video" : "image",
        use_filename: true,
        overwrite: true,
      });

      mediaUrl = uploadRes.secure_url;
      mediaType = isVideo ? "video" : "image";
      cloudinaryId = uploadRes.public_id;
    }

    const newStoryId = await Story.create({
      userId,
      mediaUrl,
      mediaType,
      cloudinaryId,
      caption,
      emojis,
      music,
      backgroundColor,
      imageSettings,
    });

    res.json({ success: true, message: "Story created successfully 🎉", storyId: newStoryId });
});

// ✅ Delete a story (by owner)
const deleteStory = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const { userId } = req;

    const story = await Story.findById(storyId);
    if (!story) return res.json({ success: false, message: "Story not found" });

    if (story.user_id !== userId) {
      return res.json({ success: false, message: "Not authorized" });
    }

    if (story.media_cloudinary_id) {
      await cloudinary.uploader.destroy(story.media_cloudinary_id, { resource_type: story.media_type });
    }

    await Story.delete(storyId);
    res.json({ success: true, message: "Story deleted successfully" });
});

// ✅ Get stories of user and their following/friends
const getStories = catchAsync(async (req, res, next) => {
    const { userId } = req;
    
    // Fetch all active stories flat from DB
    const allStories = await Story.getActiveStories(userId);

    // Grouping logic (Identical to your Mongoose version)
    const groupedStories = allStories.reduce((acc, story) => {
      const storyUserId = story.user._id.toString();
      if (!acc[storyUserId]) acc[storyUserId] = { user: story.user, stories: [] };
      acc[storyUserId].stories.push(story);
      return acc;
    }, {});

    let storiesArray = Object.values(groupedStories);

    storiesArray.forEach((group) => {
      group.stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    storiesArray = storiesArray.sort((a, b) => {
      const latestA = new Date(a.stories[0].createdAt).getTime();
      const latestB = new Date(b.stories[0].createdAt).getTime();
      return latestB - latestA;
    });

    res.json({ success: true, allstories: storiesArray, loggedInUserId: userId });
});

// ✅ Mark story as viewed
const markStoryViewed = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const { userId } = req;

    await Story.markViewed(storyId, userId);
    res.json({ success: true, message: "Story marked as viewed" });
});

// ✅ Toggle Like/Dislike a Story
const toggleLikeStory = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const { userId } = req;

    const isLiked = await Story.toggleLike(storyId, userId);

    if (!isLiked) {
      return res.json({ success: true, message: "🤍 Story unliked" });
    } else {
      const story = await Story.findById(storyId);
      if (story && story.user_id !== userId) {
        await Notification.create(
          story.user_id,
          userId,  
          "like_story", 
          storyId 
        );
      }
      return res.json({ success: true, message: "❤️ Story liked" });
    }
});

// ✅ Get All Likes
const getStoryLikes = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const likes = await Story.getLikes(storyId);
    res.status(200).json({ likes });
});

// ✅ Add a Comment
const addComment = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const { text } = req.body;
    const { userId } = req;

    if (!text?.trim()) {
      return res.json({ message: "Comment text is required" });
    }

    const commentsCount = await Story.addComment(storyId, userId, text);
    const story = await Story.findById(storyId);
    if (story && story.user_id !== userId) {
      await Notification.create(
        story.user_id,   // Recipient (Story Owner)
        userId,          // Sender (Person commenting)
        "comment_story", // Notification Type
        storyId          // Reference ID
      );
    }
    res.json({ success: true, message: "Comment Sent", commentsCount });
});

// ✅ Get All Comments
const getComments = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const comments = await Story.getComments(storyId);
    res.status(200).json({ comments });
});

// ✅ Get All Viewers
const getViewers = catchAsync(async (req, res, next) => {
    const { storyId } = req.params;
    const viewers = await Story.getViewers(storyId);
    res.json({ success: true, viewers });
});

export { 
  createStory, 
  deleteStory, 
  getStories, 
  markStoryViewed, 
  toggleLikeStory, 
  getStoryLikes, 
  addComment, 
  getComments, 
  getViewers 
};