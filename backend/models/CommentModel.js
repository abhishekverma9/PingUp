import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Comment = {
  create: async (commentData) => {
    const id = generateObjectId();
    const { postId, userId, text, parentId } = commentData;

    await pool.query(
      `INSERT INTO comments (id, post_id, user_id, parent_id, text) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, postId, userId, parentId || null, text]
    );

    return id;
  },

  findById: async (commentId) => {
    const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [commentId]);
    return rows[0] || null;
  },

  // Gets all comments for a post, joining the user data 
  getByPostId: async (postId) => {
    const query = `
      SELECT 
        c.id AS _id, c.text, c.parent_id AS parentId, c.post_id AS post, c.created_at AS createdAt,
        JSON_OBJECT('_id', u.id, 'name', u.name, 'username', u.username, 'profile', u.profile_pic) AS user,
        (SELECT IFNULL(JSON_ARRAYAGG(user_id), JSON_ARRAY()) FROM comment_likes WHERE comment_id = c.id) AS likes
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;
    const [rows] = await pool.query(query, [postId]);

    return rows.map(row => ({
      ...row,
      user: typeof row.user === "string" ? JSON.parse(row.user) : row.user,
      likes: typeof row.likes === "string" ? JSON.parse(row.likes) : row.likes
    }));
  },

  // Gets a single formatted comment (used after creation to return to frontend)
  getFormattedById: async (commentId) => {
    const query = `
      SELECT 
        c.id AS _id, c.text, c.parent_id AS parentId, c.post_id AS post, c.created_at AS createdAt,
        JSON_OBJECT('_id', u.id, 'name', u.name, 'username', u.username, 'profile', u.profile_pic) AS user
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(query, [commentId]);
    if (!rows[0]) return null;

    return {
      ...rows[0],
      user: typeof rows[0].user === "string" ? JSON.parse(rows[0].user) : rows[0].user
    };
  },
  toggleLike: async (commentId, userId) => {
    const [[existing]] = await pool.query(
      "SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    if (existing) {
      await pool.query("DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, userId]);
      return false; // Returned false means "Unliked"
    } else {
      await pool.query("INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)", [commentId, userId]);
      return true; // Returned true means "Liked"
    }
  },
  createNotification: async (recipientId, senderId, postId) => {
    const id = generateObjectId();
    await pool.query(
      "INSERT INTO notifications (id, recipient_id, sender_id, type, post_id) VALUES (?, ?, ?, 'like', ?)",
      [id, recipientId, senderId, postId]
    );

    // Fetch the populated sender info to send instantly via Socket.io
    const [[sender]] = await pool.query(
      "SELECT id AS _id, name, username, profile_pic AS profile FROM users WHERE id = ?",
      [senderId]
    );

    return {
      _id: id,
      recipient: recipientId,
      sender: sender,
      type: "like",
      post: postId,
      createdAt: new Date()
    };
  },
  delete: async (commentId) => {
    // Because of ON DELETE CASCADE, this single query deletes this comment AND all nested replies automatically!
    await pool.query("DELETE FROM comments WHERE id = ?", [commentId]);
  }
};

export default Comment;