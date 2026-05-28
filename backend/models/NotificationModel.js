import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const Notification = {
  // Create a new notification
  create: async (recipientId, senderId, type, postId = null) => {
    // Prevent sending a notification to yourself
    if (recipientId === senderId) return null; 

    const id = generateObjectId();
    await pool.query(
      "INSERT INTO notifications (id, recipient_id, sender_id, type, post_id) VALUES (?, ?, ?, ?, ?)",
      [id, recipientId, senderId, type, postId]
    );
    return id;
  },

  // Fetch notifications for a user
  getUserNotifications: async (userId) => {
    const query = `
      SELECT 
        n.id AS _id, 
        n.type, 
        n.post_id AS post, 
        n.is_read AS isRead, 
        n.created_at AS createdAt,
        JSON_OBJECT('_id', u.id, 'name', u.name, 'username', u.username, 'profile', u.profile_pic) AS sender
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    const [rows] = await pool.query(query, [userId]);
    
    return rows.map(row => ({
      ...row,
      sender: typeof row.sender === "string" ? JSON.parse(row.sender) : row.sender
    }));
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE recipient_id = ?", [userId]);
  }
};

export default Notification;