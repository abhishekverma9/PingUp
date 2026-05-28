import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Chat = {
  create: async (user1, user2) => {
    const id = generateObjectId();
    await pool.query("INSERT INTO chats (id, user1_id, user2_id) VALUES (?, ?, ?)", [id, user1, user2]);
    return id;
  },

  findById: async (chatId) => {
    const [rows] = await pool.query("SELECT id AS _id, user1_id AS user1, user2_id AS user2, latest_message_id AS latestMessage FROM chats WHERE id = ?", [chatId]);
    return rows[0] || null;
  },

  findChatBetweenUsers: async (user1, user2) => {
    const [rows] = await pool.query(
      "SELECT id AS _id FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
      [user1, user2, user2, user1]
    );
    return rows[0] || null;
  },

  updateLatestMessage: async (chatId, messageId) => {
    await pool.query("UPDATE chats SET latest_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [messageId, chatId]);
  },

  getUserChats: async (userId) => {
    const query = `
      SELECT 
        c.id AS _id,
        JSON_OBJECT('_id', u1.id, 'name', u1.name, 'username', u1.username, 'profile', u1.profile_pic) AS user1,
        JSON_OBJECT('_id', u2.id, 'name', u2.name, 'username', u2.username, 'profile', u2.profile_pic) AS user2,
        CASE WHEN c.latest_message_id IS NOT NULL THEN
          JSON_OBJECT(
            '_id', m.id, 
            'content', m.content, 
            'mediaUrl', m.media_url, 
            'mediaType', m.media_type, 
            'status', m.status, 
            'createdAt', m.created_at,
            'sender', JSON_OBJECT('_id', mu.id, 'name', mu.name, 'username', mu.username, 'profile', mu.profile_pic)
          )
        ELSE NULL END AS latestMessage
      FROM chats c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN messages m ON c.latest_message_id = m.id
      LEFT JOIN users mu ON m.sender_id = mu.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.updated_at DESC
    `;
    const [rows] = await pool.query(query, [userId, userId]);

    // Parse JSON strings to objects
    return rows.map(row => ({
      ...row,
      user1: typeof row.user1 === "string" ? JSON.parse(row.user1) : row.user1,
      user2: typeof row.user2 === "string" ? JSON.parse(row.user2) : row.user2,
      latestMessage: typeof row.latestMessage === "string" ? JSON.parse(row.latestMessage) : row.latestMessage,
    }));
  },
  
  getPopulatedChat: async (chatId) => {
      const query = `
        SELECT c.id AS _id,
          JSON_OBJECT('_id', u1.id, 'name', u1.name, 'username', u1.username, 'profile', u1.profile_pic) AS user1,
          JSON_OBJECT('_id', u2.id, 'name', u2.name, 'username', u2.username, 'profile', u2.profile_pic) AS user2
        FROM chats c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        WHERE c.id = ?
      `;
      const [rows] = await pool.query(query, [chatId]);
      if (!rows[0]) return null;
      return {
          ...rows[0],
          user1: typeof rows[0].user1 === "string" ? JSON.parse(rows[0].user1) : rows[0].user1,
          user2: typeof rows[0].user2 === "string" ? JSON.parse(rows[0].user2) : rows[0].user2,
      };
  }
};

export default Chat;