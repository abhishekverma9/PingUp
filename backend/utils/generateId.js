import crypto from "crypto";

// Generates a 24-character hex string exactly like a MongoDB ObjectId
export const generateObjectId = () => {
  return crypto.randomBytes(12).toString("hex");
};