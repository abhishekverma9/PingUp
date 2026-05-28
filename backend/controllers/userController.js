import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { v2 as cloudinary } from "cloudinary";
import { createAccessToken, createRefreshToken, getRefreshCookieOptions } from "../utils/jwt.js";
import { getDeviceNameFromUA, getLocationLabel } from "../config/utils.js";
import catchAsync from "../utils/catchAsync.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = catchAsync(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: "ID Token is required" });
  }
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findByGoogleId(googleId);
  if (!user) {
    user = await User.findByEmail(email);
    if (user) {
      let currentProviders = user.providers || "email";
      if (!currentProviders.includes("google")) {
        currentProviders = currentProviders === "email" ? "email,google" : "google";
      }
      await User.updateGoogleProvider(user.id, googleId, currentProviders);
    } else {
      const baseUsername = email.split('@')[0];
      const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      const newUserId = await User.create({
        name,
        email,
        username,
        password: "",
        providers: "google",
        profile_pic: picture
      });
      user = { id: newUserId };
    }
  }
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || "unknown";
  const deviceName = getDeviceNameFromUA(userAgent);
  const location = getLocationLabel(ip);

  await User.removeSessionByDevice(user.id, userAgent, ip);
  await User.addSession(user.id, {
    token: refreshToken,
    userAgent,
    ip,
    deviceName,
    location,
  });
  res.cookie("rt", refreshToken, getRefreshCookieOptions());
  return res.status(200).json({ success: true, accessToken });
});
const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (!user) {
    return res.json({ success: false, message: "User doesn't exist" });
  }

  // In MySQL, SET types are returned as strings (e.g., "google,email")
  if (!user.providers.includes("email")) {
    return res.json({
      success: false,
      message: "You signed up with Google. Please set a password first.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.json({ success: false, message: "Invalid Credentials" });
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || "unknown";
  const deviceName = getDeviceNameFromUA(userAgent);
  const location = getLocationLabel(ip);

  // ✅ One session per device (Remove old, add new)
  await User.removeSessionByDevice(user.id, userAgent, ip);
  await User.addSession(user.id, {
    token: refreshToken,
    userAgent,
    ip,
    deviceName,
    location,
  });

  res.cookie("rt", refreshToken, getRefreshCookieOptions());
  return res.json({ success: true, accessToken });
});

const registerUser = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const exists = await User.findByEmail(email);
  if (exists) {
    return res.json({ success: false, message: "User already exists" });
  }

  if (!validator.isEmail(email)) {
    return res.json({ success: false, message: "Please enter a valid email" });
  }
  if (password.length < 8) {
    return res.json({ success: false, message: "Please enter a strong password" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUserId = await User.create({
    name,
    email,
    password: hashedPassword,
    providers: "email",
  });

  const accessToken = createAccessToken(newUserId);
  const refreshToken = createRefreshToken(newUserId);

  const userAgent = req.headers["user-agent"] || "unknown";
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || "unknown";

  await User.addSession(newUserId, {
    token: refreshToken,
    userAgent,
    ip,
    deviceName: getDeviceNameFromUA(userAgent),
    location: getLocationLabel(ip),
  });

  res.cookie("rt", refreshToken, getRefreshCookieOptions());
  res.json({ success: true, accessToken });

});

const getProfileData = catchAsync(async (req, res, next) => {
  const { userId } = req;
  if (!userId) return res.json({ success: false, message: "User ID is required" });

  const user = await User.findById(userId);
  if (!user) return res.json({ success: false, message: "User not found" });

  const stats = await User.getProfileStats(userId);

  const profileData = {
    userId: user.id,
    name: user.name,
    username: user.username,
    profile: user.profile_pic,
    cover: user.cover_pic,
    bio: user.bio,
    location: user.location,
    startDate: user.created_at,
    hasPassword: !!user.password,
    ...stats // Expands postsCount, followersCount, etc.
  };

  res.json({ success: true, profileData });
});

const getFriendProfileData = catchAsync(async (req, res, next) => {
  const { friendId } = req.params;
  const { userId } = req;

  if (!friendId) return res.json({ success: false, message: "User ID is required" });

  const user = await User.findById(friendId);
  if (!user) return res.json({ success: false, message: "User not found" });

  const stats = await User.getProfileStats(friendId);
  const followStatus = await User.getFollowStatus(userId, friendId);

  const profileData = {
    name: user.name,
    username: user.username,
    profile: user.profile_pic,
    cover: user.cover_pic,
    bio: user.bio,
    location: user.location,
    startDate: user.created_at,
    ...stats,
    isFollowing: followStatus.isFollowing,
    isPending: followStatus.isPending,
  };

  res.json({ success: true, profileData });
});

const updateProfileData = catchAsync(async (req, res, next) => {
  const { userId } = req;
  let { name, username, bio, location } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.json({ success: false, message: "User not found" });

  if (username && username.trim()) {
    const usernameTrimmed = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(usernameTrimmed)) {
      return res.json({
        success: false,
        message: "Username must be 3-20 characters long and contain only letters, numbers, or underscores",
      });
    }

    const existingUser = await User.findByUsername(usernameTrimmed, userId);
    if (existingUser) {
      return res.json({ success: false, message: "Username already taken" });
    }
    username = usernameTrimmed;
  } else {
    username = user.username;
  }

  let profilePic = user.profile_pic;
  let coverPic = user.cover_pic;

  if (req.files?.profile?.[0]) {
    const uploadRes = await cloudinary.uploader.upload(req.files.profile[0].path, { folder: "profile_pics" });
    profilePic = uploadRes.secure_url;
  }
  if (req.files?.cover?.[0]) {
    const uploadRes = await cloudinary.uploader.upload(req.files.cover[0].path, { folder: "cover_pics" });
    coverPic = uploadRes.secure_url;
  }

  await User.updateProfile(userId, { name, username, bio, location, profile_pic: profilePic, cover_pic: coverPic });

  res.json({ success: true, message: "Profile updated successfully" });
});

const allUsers = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const users = await User.getAllExcept(userId);
  res.json({ success: true, users });
});

const refreshAccessToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.rt;
  if (!token) return res.status(200).json({ success: false, message: "No refresh token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }

  const session = await User.getSessionByToken(token);
  if (!session || session.user_id !== decoded.id) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }

  const newAccessToken = createAccessToken(decoded.id);
  const newRefreshToken = createRefreshToken(decoded.id);

  await User.updateSessionToken(token, newRefreshToken);

  res.cookie("rt", newRefreshToken, getRefreshCookieOptions());
  return res.json({ success: true, accessToken: newAccessToken });
});

const logoutUser = catchAsync(async (req, res, next) => {
  const token = req.cookies?.rt;
  if (token) {
    await User.removeSessionByToken(token);
  }
  res.clearCookie("rt", { path: "/api/user" });
  return res.json({ success: true, message: "Logged out" });
});

const logoutAllDevices = catchAsync(async (req, res, next) => {
  const { userId } = req;
  await User.removeAllSessions(userId);
  res.clearCookie("rt", { path: "/api/user" });
  return res.json({ success: true, message: "Logged out from all devices" });
});

const getSessions = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const currentToken = req.cookies?.rt || null;
  const rawSessions = await User.getUserSessions(userId);

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    userAgent: s.user_agent,
    ip: s.ip,
    deviceName: s.device_name,
    location: s.location,
    createdAt: s.created_at,
    isCurrent: currentToken && s.token === currentToken,
  }));

  res.json({ success: true, sessions });
});

const revokeSession = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const { sessionId } = req.params;
  await User.removeSessionById(sessionId, userId);
  return res.json({ success: true, message: "Session revoked" });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.json({ success: false, message: "New password must be at least 8 characters long" });
  }

  const user = await User.findById(userId);
  if (!user) return res.json({ success: false, message: "User not found" });

  const isFirstTime = !user.password;

  if (isFirstTime) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    const addEmailProvider = !user.providers.includes("email");

    await User.updatePassword(userId, hashed, addEmailProvider);
    return res.json({
      success: true,
      message: "Password set successfully for the first time.",
      firstTime: true,
    });
  }

  if (!oldPassword) {
    return res.json({ success: false, message: "Old password is required" });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.json({ success: false, message: "Old password is incorrect" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  await User.updatePassword(userId, hashed, false);

  // 🔐 Invalidate all sessions after password change
  await User.removeAllSessions(userId);
  res.clearCookie("rt", { path: "/api/user" });

  return res.json({
    success: true,
    message: "Password updated successfully. Please log in again.",
    firstTime: false,
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // 1. Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'There is no user with that email address.' });
  }

  // 2. Generate random reset token (This goes to the user's email)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 3. Hash the token to save in DB
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // 4. Expiration time (15 mins from now)
  const expireTime = new Date(Date.now() + 15 * 60 * 1000);

  // 5. Save to DB using our new model method
  await User.setResetToken(user.id, hashedToken, expireTime);

  // 6. Send the email
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 1. Keep the plain text version as a fallback for strict email clients
  const textMessage = `Forgot your password? Click here to reset it:\n\n${resetURL}\n\nIf you didn't request this, please ignore this email.`;

  // 2. Create a beautiful HTML version with a button
  const htmlMessage = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
        
        <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 700;">Reset your password</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 20px;">
          We received a request to reset the password for your PingUp account. If you made this request, click the button below to choose a new password:
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetURL}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetURL}" style="color: #4f46e5; text-decoration: underline; word-break: break-all; margin-top: 5px; display: inline-block;">
            ${resetURL}
          </a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
        
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"PingUp Support" <support@pingup.com>',
      to: user.email,
      subject: 'Password Reset Request - PingUp',
      text: textMessage,
      html: htmlMessage,
    });

    res.status(200).json({ success: true, message: 'Token sent to email!' });
  } catch (error) {
    await User.clearResetToken(user.id);
    return res.status(500).json({ success: false, message: 'Error sending email. Please try again later.' });
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;

  // 1. Hash the token from the URL to compare with the database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 2. Find user using our new model method (which automatically checks expiration!)
  const user = await User.findByValidResetToken(hashedToken);

  if (!user) {
    return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
  }

  // 3. Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Update password and clear token in DB
  await User.updatePasswordAndClearToken(user.id, hashedPassword);

  // 5. Send success response
  res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export { loginUser, registerUser, getProfileData, updateProfileData, getFriendProfileData, allUsers, refreshAccessToken, logoutUser, logoutAllDevices, getSessions, updatePassword, revokeSession, forgotPassword, resetPassword,googleLogin };