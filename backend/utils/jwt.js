import jwt from "jsonwebtoken";

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// common cookie options for refresh token
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true on production HTTPS
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site in production, 'lax' for development
  path: "/api/user", // cookie only sent to this path
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
export { createAccessToken, createRefreshToken, getRefreshCookieOptions };