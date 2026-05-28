import { pool } from "../config/db.js";

const Follow = {
  // 1. Discover People
  getDiscoverUsers: async (userId, limit, offset, search = "") => {
    // Selects users that the current user is NOT following (excluding self).
    // Uses a LEFT JOIN to check if there is already a 'pending' request sent to them.
    const searchQuery = search ? `%${search}%` : "%";
    const query = `
      SELECT 
        u.id AS _id, u.name, u.username, u.profile_pic AS profile, u.bio, u.location,
        IF(f.status = 'pending', true, false) AS isPending
      FROM users u
      LEFT JOIN follows f 
        ON u.id = f.followed_id AND f.follower_id = ?
      WHERE u.id != ? 
        AND (u.name LIKE ? OR u.username LIKE ?)
        AND u.id NOT IN (
          SELECT followed_id FROM follows WHERE follower_id = ? AND status = 'accepted'
        )
      ORDER BY RAND()
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [userId, userId, searchQuery, searchQuery, userId, limit, offset]);
    
    // Total count for pagination
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM users u
      WHERE u.id != ? 
        AND (u.name LIKE ? OR u.username LIKE ?)
        AND u.id NOT IN (
          SELECT followed_id FROM follows WHERE follower_id = ? AND status = 'accepted'
        )
    `, [userId, searchQuery, searchQuery, userId]);

    return { users: rows, total: countRows[0].total };
  },

  // 2. Check relationship status
  getRelationship: async (followerId, followedId) => {
    const [rows] = await pool.query(
      "SELECT status FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );
    return rows[0] ? rows[0].status : null; // Returns 'pending', 'accepted', or null
  },

  // 3. Send Request
  createRequest: async (followerId, followedId) => {
    await pool.query(
      "INSERT INTO follows (follower_id, followed_id, status) VALUES (?, ?, 'pending')",
      [followerId, followedId]
    );
  },

  // 4. Handle Request (Accept/Reject)
  acceptRequest: async (followerId, followedId) => {
    await pool.query(
      "UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );
  },

  removeRelationship: async (followerId, followedId) => {
    await pool.query(
      "DELETE FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );
  },

  // 5. Get Connections (Followers, Following, Pending)
  getUserConnections: async (userId, search = "") => {
    const searchQuery = search ? `%${search}%` : "%";
    
    // Following
    const [following] = await pool.query(`
      SELECT u.id AS _id, u.name, u.username, u.profile_pic AS profile, true AS isFollowing, false AS isPending
      FROM users u
      JOIN follows f ON u.id = f.followed_id
      WHERE f.follower_id = ? AND f.status = 'accepted'
      AND (u.name LIKE ? OR u.username LIKE ?)
    `, [userId, searchQuery, searchQuery]);

    // Followers (Checks if you follow them back using a subquery)
    const [followers] = await pool.query(`
      SELECT 
        u.id AS _id, u.name, u.username, u.profile_pic AS profile,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'accepted') AS isFollowing,
        false AS isPending
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.followed_id = ? AND f.status = 'accepted'
      AND (u.name LIKE ? OR u.username LIKE ?)
    `, [userId, userId, searchQuery, searchQuery]);

    // Pending (People who sent YOU a request. Checks if you follow them)
    const [pending] = await pool.query(`
      SELECT 
        u.id AS _id, u.name, u.username, u.profile_pic AS profile,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'accepted') AS isFollowing,
        true AS isPending
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.followed_id = ? AND f.status = 'pending'
      AND (u.name LIKE ? OR u.username LIKE ?)
    `, [userId, userId, searchQuery, searchQuery]);

    // Format boolean values (MySQL returns 1/0 for EXISTS, we map to true/false)
    return {
      following: following.map(u => ({ ...u, isFollowing: !!u.isFollowing, isPending: !!u.isPending })),
      followers: followers.map(u => ({ ...u, isFollowing: !!u.isFollowing, isPending: !!u.isPending })),
      pending: pending.map(u => ({ ...u, isFollowing: !!u.isFollowing, isPending: !!u.isPending })),
    };
  },

  // 6. Get Friend Connections (Evaluated from logged-in user's perspective)
  getFriendConnections: async (loggedUserId, targetUserId) => {
    // Following of the target user
    const [following] = await pool.query(`
      SELECT 
        u.id AS _id, u.name, u.username, u.profile_pic AS profile,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'accepted') AS isFollowing,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'pending') AS isPending
      FROM users u
      JOIN follows f ON u.id = f.followed_id
      WHERE f.follower_id = ? AND f.status = 'accepted'
    `, [loggedUserId, loggedUserId, targetUserId]);

    // Followers of the target user
    const [followers] = await pool.query(`
      SELECT 
        u.id AS _id, u.name, u.username, u.profile_pic AS profile,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'accepted') AS isFollowing,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = u.id AND status = 'pending') AS isPending
      FROM users u
      JOIN follows f ON u.id = f.follower_id
      WHERE f.followed_id = ? AND f.status = 'accepted'
    `, [loggedUserId, loggedUserId, targetUserId]);

    return {
      following: following.map(u => ({ ...u, isFollowing: !!u.isFollowing, isPending: !!u.isPending })),
      followers: followers.map(u => ({ ...u, isFollowing: !!u.isFollowing, isPending: !!u.isPending })),
    };
  }
};

export default Follow;