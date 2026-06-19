import rateLimit from "express-rate-limit";

// Limit login requests
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: { success: false, message: "Too many login attempts, please try again after 15 minutes" },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Limit registration requests
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 register requests per hour
  message: { success: false, message: "Too many accounts created from this IP, please try again after an hour" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit post creations
export const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 post creations per hour
  message: { success: false, message: "You have reached the limit of 10 posts per hour. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
