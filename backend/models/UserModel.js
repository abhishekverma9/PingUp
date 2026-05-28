import { pool } from "../config/db.js";
import { generateObjectId } from "../utils/generateId.js";

const User = {
  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  },

  findByEmail: async (email) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0] || null;
  },

  findByUsername: async (username, excludeId = null) => {
    let query = "SELECT * FROM users WHERE username = ?";
    const params = [username];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  },

  create: async (userData) => {
    const id = generateObjectId();
    const { name, email, password, providers = "email", username = "" } = userData;
    // Note: Provide a fallback username or generate one if your registration flow doesn't ask for it initially
    const generatedUsername = username || email.split("@")[0] + Math.floor(Math.random() * 1000);

    await pool.query(
      `INSERT INTO users (id, name, username, email, password, providers) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, generatedUsername, email, password, providers]
    );
    return id;
  },

  updateProfile: async (id, data) => {
    const { name, username, bio, location, profile_pic, cover_pic } = data;
    await pool.query(
      `UPDATE users 
       SET name = ?, username = ?, bio = ?, location = ?, profile_pic = ?, cover_pic = ? 
       WHERE id = ?`,
      [name, username, bio, location, profile_pic, cover_pic, id]
    );
  },
  // 1. Find a user explicitly by their Google ID
  findByGoogleId: async (googleId) => {
    const [rows] = await pool.query(`SELECT * FROM users WHERE google_id = ?`, [googleId]);
    return rows[0] || null;
  },

  // 2. Link Google account to an existing email user or update existing fields
  updateGoogleProvider: async (userId, googleId, providersString) => {
    // Ensures 'google' is added to the SET column without removing 'email' if it's there
    await pool.query(
      `UPDATE users SET google_id = ?, providers = ? WHERE id = ?`,
      [googleId, providersString, userId]
    );
  },
  updatePassword: async (id, hashedPassword, addEmailProvider) => {
    let query = "UPDATE users SET password = ?";
    if (addEmailProvider) {
      // Appends 'email' to the providers SET if it's not already there
      query += ", providers = CONCAT_WS(',', NULLIF(providers, ''), 'email')";
    }
    query += " WHERE id = ?";
    await pool.query(query, [hashedPassword, id]);
  },
  setResetToken: async (userId, hashedToken, expireTime) => {
    await pool.query(
      `UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?`,
      [hashedToken, expireTime, userId]
    );
  },

  // 2. Find a user by checking if the token matches AND hasn't expired yet
  findByValidResetToken: async (hashedToken) => {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expire > NOW()`,
      [hashedToken]
    );
    return rows[0] || null;
  },

  // 3. Update the password and wipe the tokens clean
  updatePasswordAndClearToken: async (userId, hashedPassword) => {
    await pool.query(
      `UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?`,
      [hashedPassword, userId]
    );
  },

  // 4. Clear the token if the email fails to send
  clearResetToken: async (userId) => {
    await pool.query(
      `UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?`,
      [userId]
    );
  },
  getAllExcept: async (userId) => {
    const [rows] = await pool.query(
      "SELECT id, name, username, profile_pic, bio FROM users WHERE id != ?",
      [userId]
    );
    return rows;
  },

  // --- STATS & RELATIONS (Replacing MongoDB arrays) ---
  getProfileStats: async (userId) => {
    // Run multiple count queries in parallel
    const [[postCount]] = await pool.query("SELECT COUNT(*) as c FROM posts WHERE user_id = ?", [userId]);
    const [[followerCount]] = await pool.query("SELECT COUNT(*) as c FROM follows WHERE followed_id = ? AND status = 'accepted'", [userId]);
    const [[followingCount]] = await pool.query("SELECT COUNT(*) as c FROM follows WHERE follower_id = ? AND status = 'accepted'", [userId]);
    const [[pendingCount]] = await pool.query("SELECT COUNT(*) as c FROM follows WHERE followed_id = ? AND status = 'pending'", [userId]);

    return {
      postsCount: postCount.c,
      followersCount: followerCount.c,
      followingCount: followingCount.c,
      pendingCount: pendingCount.c,
    };
  },

  getFollowStatus: async (followerId, followedId) => {
    const [rows] = await pool.query(
      "SELECT status FROM follows WHERE follower_id = ? AND followed_id = ?",
      [followerId, followedId]
    );
    if (!rows[0]) return { isFollowing: false, isPending: false };
    return {
      isFollowing: rows[0].status === "accepted",
      isPending: rows[0].status === "pending",
    };
  },

  // --- SESSION MANAGEMENT (Replacing refreshTokens array) ---
  addSession: async (userId, sessionData) => {
    const id = generateObjectId();
    const { token, userAgent, ip, deviceName, location } = sessionData;
    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token, user_agent, ip, device_name, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, token, userAgent, ip, deviceName, location]
    );
  },

  removeSessionByDevice: async (userId, userAgent, ip) => {
    await pool.query(
      "DELETE FROM refresh_tokens WHERE user_id = ? AND user_agent = ? AND ip = ?",
      [userId, userAgent, ip]
    );
  },

  getSessionByToken: async (token) => {
    const [rows] = await pool.query("SELECT * FROM refresh_tokens WHERE token = ?", [token]);
    return rows[0] || null;
  },

  updateSessionToken: async (oldToken, newToken) => {
    await pool.query(
      "UPDATE refresh_tokens SET token = ?, created_at = CURRENT_TIMESTAMP WHERE token = ?",
      [newToken, oldToken]
    );
  },

  removeSessionByToken: async (token) => {
    await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [token]);
  },

  removeSessionById: async (sessionId, userId) => {
    await pool.query("DELETE FROM refresh_tokens WHERE id = ? AND user_id = ?", [sessionId, userId]);
  },

  removeAllSessions: async (userId) => {
    await pool.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
  },

  getUserSessions: async (userId) => {
    const [rows] = await pool.query(
      "SELECT id, user_agent, ip, device_name, location, created_at, token FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }
};

export default User;