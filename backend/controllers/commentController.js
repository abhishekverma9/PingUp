import Comment from "../models/CommentModel.js";
import Notification from "../models/NotificationModel.js";
import Post from "../models/PostModel.js"; // Ensure this imports your SQL Post model
import catchAsync from "../utils/catchAsync.js";

// --- HELPER: Tree Builder ---
// Converts flat database list into nested JSON tree for frontend
const buildCommentTree = (comments) => {
    const commentMap = {};
    const roots = [];

    // Initialize Map
    comments.forEach(comment => {
        commentMap[comment._id.toString()] = {
            ...comment,
            replies: []
        };
    });

    // Link Parents and Children
    comments.forEach(comment => {
        if (comment.parentId && commentMap[comment.parentId.toString()]) {
            commentMap[comment.parentId.toString()].replies.push(commentMap[comment._id.toString()]);
        } else {
            roots.push(commentMap[comment._id.toString()]);
        }
    });

    return roots;
};

// --- CONTROLLERS ---

const addComment = catchAsync(async (req, res, next) => {
        const { postId, text, parentCommentId } = req.body;
        const { userId } = req; // Secure ID from Auth Middleware

        if (!text || !postId) return res.status(400).json({ success: false, message: "Missing fields" });

        // 1. Verify Post Exists
        const postExists = await Post.findById(postId);
        if (!postExists) return res.status(404).json({ success: false, message: "Post not found" });

        // 2. Verify Parent (if Reply)
        if (parentCommentId) {
            const parent = await Comment.findById(parentCommentId);
            if (!parent) return res.status(404).json({ success: false, message: "Parent comment not found" });
            if (parent.post_id !== postId) {
                return res.status(400).json({ success: false, message: "Mismatch: Parent comment is on a different post" });
            }
        }

        // 3. Create the Comment (No need to $push arrays anymore!)
        const newCommentId = await Comment.create({
            postId,
            userId,
            text,
            parentId: parentCommentId
        });

        // 4. Fetch the populated comment to return
        const populatedComment = await Comment.getFormattedById(newCommentId);

        // Match the frontend's expectation of an empty replies array on a new comment
        populatedComment.replies = [];
        if (parentCommentId) {
            // It's a reply! Notify the person who wrote the parent comment.
            const parentComment = await Comment.findById(parentCommentId);
            if (parentComment) {
                let recipientId = parentComment.user_id || parentComment.user;
                
                if (typeof recipientId === 'string' && recipientId.startsWith('{')) {
                    recipientId = JSON.parse(recipientId)._id || JSON.parse(recipientId).id;
                } else if (typeof recipientId === 'object' && recipientId !== null) {
                    recipientId = recipientId._id || recipientId.id;
                }
                
                if (recipientId && recipientId !== userId) {
                    await Notification.create(recipientId, userId, "reply", postId);
                }
            }
        } else {
            // It's a top-level comment! Notify the post owner.
            const post = await Post.findById(postId);
            if (post) {
                let recipientId = post.user_id || post.user;
                
                if (typeof recipientId === 'string' && recipientId.startsWith('{')) {
                    recipientId = JSON.parse(recipientId)._id || JSON.parse(recipientId).id;
                } else if (typeof recipientId === 'object' && recipientId !== null) {
                    recipientId = recipientId._id || recipientId.id;
                }

                if (recipientId && recipientId !== userId) {
                    await Notification.create(recipientId, userId, "comment", postId);
                }
            }
        }
        res.status(201).json({ success: true, message: "Comment added", comment: populatedComment });
});

const getPostComments = catchAsync(async (req, res, next) => {
        const { postId } = req.params;

        // Fetch ALL comments for this post (flat list)
        const comments = await Comment.getByPostId(postId);

        // Convert to Tree
        const commentTree = buildCommentTree(comments);

        res.status(200).json({ success: true, comments: commentTree });
});

const deleteComment = catchAsync(async (req, res, next) => {
        const { commentId } = req.params;
        const { userId } = req;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

        // Check Ownership
        if (comment.user_id !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // The database handles cleaning up the nested replies and post references automatically!
        await Comment.delete(commentId);

        res.json({ success: true, message: "Comment and replies deleted" });
});
const likeComment = catchAsync(async (req, res, next) => {
        const { commentId } = req.params;
        const { userId } = req; // From auth middleware

        // 1. Verify comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.json({ success: false, message: "Comment not found" });
        }

        // 2. Toggle the like in the database
        const isLikedNow = await Comment.toggleLike(commentId, userId);

        if (!isLikedNow) {
            return res.json({ success: true, message: "🤍 Comment unliked" });
        } else {
            // 3. If Liked, send a notification (if it's not their own comment)
            if (comment.user_id !== userId) {
                // 👇 FIX: Use the comment object to get the recipient and post IDs
                await Notification.create(
                    comment.user_id, // Recipient (Author of the comment)
                    userId,          // Sender (Person liking the comment)
                    "like_comment",  // Type
                    comment.post_id  // Post ID
                );
            }

            return res.json({ success: true, message: "❤️ Comment liked" });
        }
});
export { addComment, getPostComments, deleteComment, likeComment };