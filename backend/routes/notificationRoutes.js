import express from "express";
import { getNotifications, markNotificationsAsRead } from "../controllers/notificationController.js"; 
import authUser from '../middleware/auth.js'

const notificationRouter = express.Router();

notificationRouter.get("/get", authUser, getNotifications);
notificationRouter.put("/mark-read", authUser, markNotificationsAsRead);

export default notificationRouter;