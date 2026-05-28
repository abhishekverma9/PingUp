import Story from "../models/StoryModel.js";
import geoip from 'geoip-lite';
import {UAParser} from 'ua-parser-js';
import { v2 as cloudinary } from "cloudinary";

/**
 * Clean up expired stories — delete Cloudinary media and remove from DB.
 * Should run every few minutes via cron or setInterval in your server.
 */
export const cleanupExpiredStories = async () => {
  try {
    // 1. Fetch expired stories using MySQL
    const expiredStories = await Story.getExpired();
    
    if (!expiredStories.length) return;
    
    console.log(`🧹 Found ${expiredStories.length} expired stories to delete...`);
    
    for (const story of expiredStories) {
      // 2. Delete from Cloudinary if media exists
      if (story.mediaCloudinaryId) {
        try {
          await cloudinary.uploader.destroy(story.mediaCloudinaryId, {
            resource_type: story.mediaType === "video" ? "video" : "image",
          });
          console.log(`🗑️ Deleted Cloudinary media: ${story.mediaCloudinaryId}`);
        } catch (cloudErr) {
          console.warn(`⚠️ Failed to delete Cloudinary media: ${story.mediaCloudinaryId}`, cloudErr.message);
        }
      }
      
      // 3. Delete from Database
      await Story.delete(story._id);
    }
    
    console.log("✅ Expired story cleanup complete.");
  } catch (err) {
    console.error("❌ Error during story cleanup:", err.message);
  }
};

const getDeviceNameFromUA = (userAgentString) => {
  if (!userAgentString || userAgentString === "unknown") return "Unknown Device";

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";
  
  // If it's a mobile device or tablet, it usually has a vendor/model (e.g., Apple iPhone)
  const deviceVendor = result.device.vendor;
  const deviceModel = result.device.model;

  if (deviceVendor && deviceModel) {
    return `${deviceVendor} ${deviceModel} (${browser})`; // e.g., "Apple iPhone (Safari)"
  }

  // If it's a desktop, vendor/model is usually empty, so we return Browser + OS
  return `${browser} on ${os}`; // e.g., "Chrome on Windows" or "Firefox on Mac OS"
};
const getLocationLabel = (ip = "") => {
  // Handle local development IPs
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip === "::ffff:127.0.0.1") {
    return "This device (Local)";
  }  
  // Clean IPv4 mapped to IPv6 (e.g. ::ffff:192.168.0.1)
  const cleanIp = ip.includes('::ffff:') ? ip.split(':').pop() : ip;
  
  // Lookup IP
  const geo = geoip.lookup(cleanIp); 
  if (geo) {
    if (geo.city) return `${geo.city}, ${geo.country}`;
    if (geo.region) return `${geo.region}, ${geo.country}`;
    return geo.country;
  } 
  return "Unknown location";
}; 
export { getDeviceNameFromUA, getLocationLabel };