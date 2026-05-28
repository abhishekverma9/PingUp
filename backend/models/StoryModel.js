import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Story = {
  create: async (storyData) => {
    const id = generateObjectId();
    const { userId, mediaUrl, mediaType, cloudinaryId, caption, emojis, music, backgroundColor, imageSettings } = storyData;

    await pool.query(
      `INSERT INTO stories (id, user_id, media_url, media_type, media_cloudinary_id, caption, emojis, music, background_color,image_settings) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        mediaUrl,
        mediaType,
        cloudinaryId,
        caption ? JSON.stringify(caption) : null,
        emojis ? JSON.stringify(emojis) : JSON.stringify([]),
        music ? JSON.stringify(music) : null,
        backgroundColor,
        imageSettings ? JSON.stringify(imageSettings) : null
      ]
    );
    return id;
  },

  findById: async (storyId) => {
    const [rows] = await pool.query("SELECT * FROM stories WHERE id = ?", [storyId]);
    return rows[0] || null;
  },

  delete: async (storyId) => { 
    await pool.query("DELETE FROM story_comments WHERE story_id = ?", [storyId]);
    await pool.query("DELETE FROM story_likes WHERE story_id = ?", [storyId]); 
    await pool.query("DELETE FROM notifications WHERE post_id = ?", [storyId]); 
    await pool.query("DELETE FROM stories WHERE id = ?", [storyId]);
  },
  getExpired: async () => {
    const [rows] = await pool.query(`
      SELECT id AS _id, media_cloudinary_id AS mediaCloudinaryId, media_type AS mediaType 
      FROM stories 
      WHERE created_at < NOW() - INTERVAL 24 HOUR
    `);
    return rows;
  },
  getActiveStories: async (userId) => {
    // Fetches unexpired stories + their likes and comments
    const query = `
      SELECT 
        s.id AS _id, 
        s.media_url AS mediaUrl, 
        s.media_type AS mediaType, 
        s.caption, 
        s.emojis, 
        s.music, 
        s.background_color AS backgroundColor,
        s.image_settings AS imageSettings, 
        s.created_at AS createdAt,
        JSON_OBJECT(
          '_id', u.id, 
          'name', u.name, 
          'profile', u.profile_pic
        ) AS user,
        
        -- 👇 Subquery to grab all likes as an array of objects
        (
          SELECT IFNULL(JSON_ARRAYAGG(JSON_OBJECT('user', sl.user_id)), JSON_ARRAY())
          FROM story_likes sl 
          WHERE sl.story_id = s.id
        ) AS likes,

        -- 👇 Subquery to grab all comments as an array of objects
        (
          SELECT IFNULL(JSON_ARRAYAGG(
            JSON_OBJECT(
              '_id', sc.id, 
              'user', sc.user_id, 
              'text', sc.text, 
              'createdAt', sc.created_at
            )
          ), JSON_ARRAY())
          FROM story_comments sc 
          WHERE sc.story_id = s.id
        ) AS comments

      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.user_id = ? OR s.user_id IN (
          SELECT followed_id FROM follows WHERE follower_id = ? AND status = 'accepted'
      ))
      AND s.created_at > NOW() - INTERVAL 24 HOUR
      ORDER BY s.created_at DESC
    `;

    const [rows] = await pool.query(query, [userId, userId]);

    // MySQL returns all JSON fields as strings. We must parse them back into objects/arrays for React!
    return rows.map(row => ({
      ...row,
      user: typeof row.user === "string" ? JSON.parse(row.user) : row.user,
      likes: typeof row.likes === "string" ? JSON.parse(row.likes) : row.likes,
      comments: typeof row.comments === "string" ? JSON.parse(row.comments) : row.comments,
      // Also ensure your layout settings are parsed properly!
      caption: typeof row.caption === "string" ? JSON.parse(row.caption) : row.caption,
      emojis: typeof row.emojis === "string" ? JSON.parse(row.emojis) : row.emojis,
      music: typeof row.music === "string" ? JSON.parse(row.music) : row.music,
      imageSettings: typeof row.imageSettings === "string" ? JSON.parse(row.imageSettings) : row.imageSettings
    }));
  },
  // --- Viewers ---
  markViewed: async (storyId, userId) => {
    await pool.query(
      "INSERT IGNORE INTO story_viewers (story_id, user_id) VALUES (?, ?)",
      [storyId, userId]
    );
  },

  getViewers: async (storyId) => {
    const [rows] = await pool.query(`
      SELECT u.id AS _id, u.username, u.name, u.profile_pic AS profile
      FROM story_viewers v
      JOIN users u ON v.user_id = u.id
      WHERE v.story_id = ?
    `, [storyId]);
    return rows;
  },

  // --- Likes ---
  toggleLike: async (storyId, userId) => {
    const [[existing]] = await pool.query(
      "SELECT 1 FROM story_likes WHERE story_id = ? AND user_id = ?",
      [storyId, userId]
    );

    if (existing) {
      await pool.query("DELETE FROM story_likes WHERE story_id = ? AND user_id = ?", [storyId, userId]);
      return false; // Unliked
    } else {
      await pool.query("INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)", [storyId, userId]);
      return true; // Liked
    }
  },

  getLikes: async (storyId) => {
    const [rows] = await pool.query(`
      SELECT u.id AS _id, u.username, u.profile_pic AS profilePic
      FROM story_likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.story_id = ?
    `, [storyId]);
    // Format to match Mongoose populate output: { user: { _id, username, profilePic } }
    return rows.map(u => ({ user: u }));
  },

  // --- Comments ---
  addComment: async (storyId, userId, text) => {
    const id = generateObjectId();
    await pool.query(
      "INSERT INTO story_comments (id, story_id, user_id, text) VALUES (?, ?, ?, ?)",
      [id, storyId, userId, text]
    );

    const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM story_comments WHERE story_id = ?", [storyId]);
    return count;
  },

  getComments: async (storyId) => {
    const [rows] = await pool.query(`
      SELECT c.id AS _id, c.text, c.created_at AS createdAt,
             u.id AS user_id, u.username, u.profile_pic AS profilePic
      FROM story_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at ASC
    `, [storyId]);

    // Map to Mongoose populate structure
    return rows.map(row => ({
      _id: row._id,
      text: row.text,
      createdAt: row.createdAt,
      user: {
        _id: row.user_id,
        username: row.username,
        profilePic: row.profilePic
      }
    }));
  }
};

export default Story;