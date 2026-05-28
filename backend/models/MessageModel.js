import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Message = {
  create: async (data) => {
    const id = generateObjectId();
    const { chatId, senderId, content, mediaUrl, mediaType, status = "sent" } = data;

    await pool.query(
      `INSERT INTO messages (id, chat_id, sender_id, content, media_url, media_type, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, chatId, senderId, content || "", mediaUrl || "", mediaType || "", status]
    );

    // Add sender to read_by automatically
    await pool.query("INSERT INTO message_read_by (message_id, user_id) VALUES (?, ?)", [id, senderId]);

    return id;
  },

  findByIdPopulated: async (messageId) => {
    const query = `
      SELECT 
        m.id AS _id, m.chat_id AS chat, m.content, m.media_url AS mediaUrl, 
        m.media_type AS mediaType, m.status, m.created_at AS createdAt,
        JSON_OBJECT('_id', u.id, 'name', u.name, 'username', u.username, 'profile', u.profile_pic) AS sender,
        (SELECT JSON_ARRAYAGG(user_id) FROM message_read_by WHERE message_id = m.id) AS readBy
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `;
    const [rows] = await pool.query(query, [messageId]);
    if(!rows[0]) return null;

    return {
        ...rows[0],
        sender: typeof rows[0].sender === "string" ? JSON.parse(rows[0].sender) : rows[0].sender,
        readBy: (typeof rows[0].readBy === "string" ? JSON.parse(rows[0].readBy) : rows[0].readBy) || []
    };
  },

  getMessagesByChat: async (chatId, limit, offset) => {
    const query = `
      SELECT 
        m.id AS _id, m.chat_id AS chat, m.content, m.media_url AS mediaUrl, 
        m.media_type AS mediaType, m.status, m.created_at AS createdAt,
        JSON_OBJECT('_id', u.id, 'name', u.name, 'username', u.username, 'profile', u.profile_pic) AS sender,
        (SELECT JSON_ARRAYAGG(user_id) FROM message_read_by WHERE message_id = m.id) AS readBy
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [chatId, limit, offset]);

    return rows.map(row => ({
      ...row,
      sender: typeof row.sender === "string" ? JSON.parse(row.sender) : row.sender,
      readBy: (typeof row.readBy === "string" ? JSON.parse(row.readBy) : row.readBy) || []
    }));
  },

  updateStatus: async (messageId, status) => {
    await pool.query("UPDATE messages SET status = ? WHERE id = ?", [status, messageId]);
  },

  getUnreadMessageIds: async (chatId, userId) => {
    // Finds messages in this chat that the user HAS NOT read
    const query = `
      SELECT id 
      FROM messages 
      WHERE chat_id = ? 
      AND id NOT IN (SELECT message_id FROM message_read_by WHERE user_id = ?)
    `;
    const [rows] = await pool.query(query, [chatId, userId]);
    return rows.map(row => row.id);
  },

  markAsRead: async (messageIds, userId) => {
    if (!messageIds || messageIds.length === 0) return;
    
    // Insert into read_by junction table
    const values = messageIds.map(id => [id, userId]);
    await pool.query("INSERT IGNORE INTO message_read_by (message_id, user_id) VALUES ?", [values]);
    
    // Update status to 'seen'
    const placeholders = messageIds.map(() => "?").join(",");
    await pool.query(`UPDATE messages SET status = 'seen' WHERE id IN (${placeholders})`, messageIds);
  },

  delete: async (messageId) => {
    const [rows] = await pool.query("SELECT chat_id, sender_id FROM messages WHERE id = ?", [messageId]);
    if(!rows[0]) return null;
    
    await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);
    return rows[0];
  }
};

export default Message;