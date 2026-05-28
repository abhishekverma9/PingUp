import Notification from "../models/NotificationModel.js";
import Post from "../models/PostModel.js";
import User from "../models/UserModel.js";
import { v2 as cloudinary } from "cloudinary";
import catchAsync from "../utils/catchAsync.js";

const createPost = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const { caption } = req.body;

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      const file = req.file;
      const isVideo = file.mimetype.startsWith("video");
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "post_media",
        resource_type: isVideo ? "video" : "image",
      });
      mediaUrl = uploadRes.secure_url;
      mediaType = isVideo ? "video" : "image";
    }

    const newPost = await Post.create({
      userId,
      caption,
      mediaUrl,
      mediaType,
    });

    res.json({ success: true, message: "Post created successfully", post: newPost });
});
const getSinglePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;

    const post = await Post.getByIdFull(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.json({ success: true, post });
});
const getFeedPosts = catchAsync(async (req, res, next) => {
    const { userId } = req; 
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const posts = await Post.getFeed(userId);

    // mysql2 usually parses JSON functions automatically, but as a fallback map:
    const formattedPosts = posts.map(p => ({
      ...p,
      user: typeof p.user === 'string' ? JSON.parse(p.user) : p.user,
      likes: typeof p.likes === 'string' ? JSON.parse(p.likes) : p.likes,
      comments: typeof p.comments === 'string' ? JSON.parse(p.comments) : p.comments,
      shares: typeof p.shares === 'string' ? JSON.parse(p.shares) : (p.shares || [])
    }));

    res.json({ success: true, data: formattedPosts });
});

const getAllPostsByMe = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const posts = await Post.getUserPosts(userId);
    const formattedPosts = posts.map(p => ({
      ...p,
      user: typeof p.user === 'string' ? JSON.parse(p.user) : p.user,
      likes: typeof p.likes === 'string' ? JSON.parse(p.likes) : p.likes,
      comments: typeof p.comments === 'string' ? JSON.parse(p.comments) : p.comments,
      shares: typeof p.shares === 'string' ? JSON.parse(p.shares) : (p.shares || [])
    }));
    res.json({ success: true, posts: formattedPosts });
});

const getAllPostsByfriend = catchAsync(async (req, res, next) => {
    const { friendId } = req.params;
    const user = await User.findById(friendId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const posts = await Post.getUserPosts(friendId);
    const formattedPosts = posts.map(p => ({
      ...p,
      user: typeof p.user === 'string' ? JSON.parse(p.user) : p.user,
      likes: typeof p.likes === 'string' ? JSON.parse(p.likes) : p.likes,
      comments: typeof p.comments === 'string' ? JSON.parse(p.comments) : p.comments,
      shares: typeof p.shares === 'string' ? JSON.parse(p.shares) : (p.shares || [])
    }));
    res.json({ success: true, posts: formattedPosts });
});

const deletePost = catchAsync(async (req, res, next) => {
    const { postId } = req.body;
    const { userId } = req;

    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    if (post.user !== userId) {
      return res.json({ success: false, message: "Not Allowed" });
    }

    await Post.delete(postId);

    res.json({ success: true, message: "Post deleted successfully" });
});

const likePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const isLikedNow = await Post.toggleLike(postId, userId);

    if (!isLikedNow) {
      return res.json({ success: true, message: "Post unliked" });
    } else {
      // 👇 BULLETPROOF RECIPIENT ID EXTRACTION
      let recipientId = post.user_id || post.user;

      // If it's a JSON string, parse it. If it's an object, extract the ID. Otherwise, it's already the ID string!
      if (typeof recipientId === 'string' && recipientId.startsWith('{')) {
        recipientId = JSON.parse(recipientId)._id || JSON.parse(recipientId).id;
      } else if (typeof recipientId === 'object' && recipientId !== null) {
        recipientId = recipientId._id || recipientId.id;
      }

      // Create notification safely
      if (recipientId && recipientId !== userId) {
        await Notification.create(
          recipientId,
          userId,
          "like_post",
          postId
        );
      }

      return res.json({ success: true, message: "Post liked" });
    }
});

// 👇 UPDATED: sharePost function
const sharePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req;

    // Ensure post exists
    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    // 1. Add share to database
    const sharesCount = await Post.share(postId, userId);

    // 2. Extract owner ID cleanly
    let ownerId = post.user_id || post.user;
    if (typeof ownerId === 'object' && ownerId !== null) ownerId = ownerId._id || ownerId.id;

    // 3. Send notification to the post owner (unless they shared their own post)
    if (ownerId && ownerId !== userId) {
        await Notification.create(ownerId, userId, "share_post", postId);
    }

    res.json({ success: true, message: "Post shared successfully", sharesCount });
});

// 👇 NEW: Function to see WHO shared the post
const getPostSharers = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req;

    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    // Extract owner ID cleanly
    let ownerId = post.user_id || post.user;
    if (typeof ownerId === 'object' && ownerId !== null) ownerId = ownerId._id || ownerId.id;

    // SECURITY CHECK: Only allow the post owner to see this list!
    if (ownerId !== userId) {
        return res.status(403).json({ success: false, message: "Only the post owner can see who shared this post." });
    }

    // Fetch the list of users
    const sharers = await Post.getSharers(postId);
    
    res.json({ success: true, sharers });
});
 
export { createPost, getFeedPosts, likePost, sharePost, getPostSharers, deletePost, getAllPostsByMe, getAllPostsByfriend,getSinglePost };