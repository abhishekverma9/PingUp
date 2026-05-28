import Follow from "../models/FollowModel.js";
import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js";
import catchAsync from "../utils/catchAsync.js";

// 1️⃣ Discover People
const discoverPeople = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const { users, total } = await Follow.getDiscoverUsers(userId, limit, skip, search);

    // Map `isFollowing` (always false in discover feed) and boolean fix for `isPending`
    const paginatedUsers = users.map(u => ({
      ...u,
      isFollowing: false,
      isPending: !!u.isPending
    }));

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      results: paginatedUsers.length,
      data: paginatedUsers
    });
});

// 2️⃣ Send Follow Request
const sendFollowRequest = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const { friendId } = req.body;

    if (!friendId) return res.json({ success: false, message: "Friend ID is required" });
    if (userId === friendId) return res.json({ success: false, message: "You cannot follow yourself" });

    const targetUser = await User.findById(friendId);
    if (!targetUser) return res.json({ success: false, message: "Target user not found" });

    const relationship = await Follow.getRelationship(userId, friendId);

    if (relationship === "accepted") return res.json({ success: false, message: "Already your friend" });
    if (relationship === "pending") return res.json({ success: false, message: "Follow request already sent" });

    // Send the request
    await Follow.createRequest(userId, friendId);
    if (friendId !== userId) {
      await Notification.create(
        friendId,
        userId,
        "follow"
      );
    }
    res.json({ success: true, message: `Follow request sent to ${targetUser.username}` });
});

// 3️⃣ Handle Follow Request
const handleFollowRequest = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const { requesterId, action } = req.body;

    if (!requesterId || !["accept", "reject"].includes(action)) {
      return res.json({ success: false, message: "Invalid request" });
    }

    const relationship = await Follow.getRelationship(requesterId, userId);

    if (relationship !== "pending") {
      return res.json({ success: false, message: "No pending follow request from this user" });
    }

    if (action === "accept") {
      await Follow.acceptRequest(requesterId, userId);
      await Notification.create(
        requesterId, 
        userId, 
        "follow_accept" 
      );
    } else {
      await Follow.removeRelationship(requesterId, userId);
    } 
    res.json({ success: true, message: `Follow request ${action}ed successfully` });
});

// 4️⃣ Get All Requests
const getUserConnections = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const search = req.query.search || "";

    const data = await Follow.getUserConnections(userId, search);

    res.json({ success: true, data });
});

// 5️⃣ Unfollow User
const unfollowUser = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const { friendId } = req.body;

    if (!friendId) return res.json({ success: false, message: "Friend ID is required" });
    if (userId === friendId) return res.json({ success: false, message: "You cannot unfollow yourself" });

    const targetUser = await User.findById(friendId);
    if (!targetUser) return res.json({ success: false, message: "User not found" });

    const relationship = await Follow.getRelationship(userId, friendId);

    if (relationship !== "accepted") {
      return res.json({ success: false, message: "You are not following this user" });
    }

    // Delete the connection
    await Follow.removeRelationship(userId, friendId);

    res.json({ success: true, message: `You have unfollowed ${targetUser.username}` });
});

// 6️⃣ Cancel Pending Follow Request
const cancelFollowRequest = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const { friendId } = req.body;

    if (!friendId) return res.json({ success: false, message: "Friend ID is required" });
    if (userId === friendId) return res.json({ success: false, message: "Cannot cancel request to yourself" });

    const targetUser = await User.findById(friendId);
    if (!targetUser) return res.json({ success: false, message: "Target user not found" });

    const relationship = await Follow.getRelationship(userId, friendId);

    if (relationship !== "pending") {
      return res.json({ success: false, message: "No pending request to cancel" });
    }

    // Remove the pending request
    await Follow.removeRelationship(userId, friendId);

    res.json({ success: true, message: `Follow request to ${targetUser.username} cancelled` });
});

// 7️⃣ Get Friend Connections
const getFriendConnections = catchAsync(async (req, res, next) => {
    const { userId } = req; // logged-in user
    const { friendId } = req.params; // target user

    if (!friendId) {
      return res.json({ success: false, message: "Friend ID is required" });
    }

    const data = await Follow.getFriendConnections(userId, friendId);

    res.json({ success: true, data });
});

export {
  discoverPeople,
  sendFollowRequest,
  handleFollowRequest,
  getUserConnections,
  unfollowUser,
  cancelFollowRequest,
  getFriendConnections
};