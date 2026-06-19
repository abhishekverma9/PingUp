import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Post = {
  // Base SQL block to mimic Mongoose's .populate('user') and arrays
  _baseSelectQuery: `
    SELECT 
      p.id AS _id,
      p.caption,
      p.media_url AS mediaUrl,
      p.media_type AS mediaType,
      p.created_at AS createdAt,
      JSON_OBJECT(
        '_id', u.id, 
        'name', u.name, 
        'username', u.username, 
        'profile', u.profile_pic
      ) AS user,
      (SELECT IFNULL(JSON_ARRAYAGG(user_id), JSON_ARRAY()) FROM post_likes WHERE post_id = p.id) AS likes,
      
      -- 👇 ADD THIS LINE to fetch an array of comment IDs
      (SELECT IFNULL(JSON_ARRAYAGG(id), JSON_ARRAY()) FROM comments WHERE post_id = p.id) AS comments,
      (SELECT IFNULL(JSON_ARRAYAGG(user_id), JSON_ARRAY()) FROM post_shares WHERE post_id = p.id) AS shares
    FROM posts p
    JOIN users u ON p.user_id = u.id
  `,

  create: async (postData) => {
    const id = generateObjectId();
    const { userId, caption, mediaUrl, mediaType } = postData;

    await pool.query(
      `INSERT INTO posts (id, user_id, caption, media_url, media_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, caption, mediaUrl, mediaType]
    );

    return { _id: id, user: userId, caption, mediaUrl, mediaType };
  },

  findById: async (postId) => {
    const [rows] = await pool.query(
      "SELECT id, user_id as user FROM posts WHERE id = ?",
      [postId]
    );
    return rows[0] || null;
  },
  // Fetch a single post with all its populated data
  getByIdFull: async (postId) => {
    const query = `
      SELECT 
        p.id AS _id, 
        p.caption, 
        p.media_url AS mediaUrl, 
        p.media_type AS mediaType, 
        p.created_at AS createdAt,
        JSON_OBJECT(
          '_id', u.id, 
          'name', u.name, 
          'username', u.username, 
          'profile', u.profile_pic
        ) AS user,
        (
          SELECT IFNULL(JSON_ARRAYAGG(user_id), JSON_ARRAY()) 
          FROM post_likes 
          WHERE post_id = p.id
        ) AS likes,
        (
          SELECT COUNT(*) 
          FROM comments 
          WHERE post_id = p.id
        ) AS commentsCount,
        (SELECT IFNULL(JSON_ARRAYAGG(user_id), JSON_ARRAY()) FROM post_shares WHERE post_id = p.id) AS shares
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    const [rows] = await pool.query(query, [postId]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      // Parse the JSON strings back into JavaScript objects/arrays
      user: typeof row.user === "string" ? JSON.parse(row.user) : row.user,
      likes: typeof row.likes === "string" ? JSON.parse(row.likes) : row.likes,
      shares: typeof row.shares === "string" ? JSON.parse(row.shares) : row.shares,
    };
  },
  delete: async (postId) => {
    await pool.query("DELETE FROM posts WHERE id = ?", [postId]);
    // Note: Due to ON DELETE CASCADE in your schema, this automatically deletes likes/comments.
  },

  updateCaption: async (postId, caption) => {
    await pool.query("UPDATE posts SET caption = ? WHERE id = ?", [caption, postId]);
  },

  getFeed: async (userId, limit = 10, cursor = null) => {
    // Fetches posts by the user AND anyone they are following (accepted status)
    let query = `
      ${Post._baseSelectQuery}
      WHERE (p.user_id = ? 
         OR p.user_id IN (
           SELECT followed_id FROM follows WHERE follower_id = ? AND status = 'accepted'
         ))
    `;
    
    const params = [userId, userId];
    
    if (cursor) {
      query += ` AND p.created_at < ?`;
      params.push(cursor);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  getUserPosts: async (userId, limit = 10, cursor = null) => {
    let query = `
      ${Post._baseSelectQuery}
      WHERE p.user_id = ?
    `;
    
    const params = [userId];
    
    if (cursor) {
      query += ` AND p.created_at < ?`;
      params.push(cursor);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Handles the like/unlike logic
  toggleLike: async (postId, userId) => {
    // 1. Check if like exists
    const [[existingLike]] = await pool.query(
      "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    let isLikedNow;

    if (existingLike) {
      // Unlike
      await pool.query("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
      isLikedNow = false;
    } else {
      // Like
      await pool.query("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      isLikedNow = true;
    }

    // Return the new total count
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?",
      [postId]
    );

    return { isLikedNow, likesCount: count };
  },
  // 👇 NEW: Method to add a share
  share: async (postId, userId) => {
    // INSERT IGNORE ensures a user can only be counted once for sharing a specific post
    await pool.query("INSERT IGNORE INTO post_shares (post_id, user_id) VALUES (?, ?)", [postId, userId]);

    // Return the updated total count
    const [[{ count }]] = await pool.query("SELECT COUNT(*) as count FROM post_shares WHERE post_id = ?", [postId]);
    return count;
  },

  // 👇 NEW: Method to get the actual user profiles of people who shared
  getSharers: async (postId) => {
    const query = `
        SELECT u.id AS _id, u.name, u.username, u.profile_pic AS profile
        FROM post_shares ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.post_id = ?
        ORDER BY ps.created_at DESC
    `;
    const [rows] = await pool.query(query, [postId]);
    return rows;
  }
};

export default Post;