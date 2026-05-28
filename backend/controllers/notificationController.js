import Notification from "../models/NotificationModel.js";
import catchAsync from "../utils/catchAsync.js";

export const getNotifications = catchAsync(async (req, res, next) => {
        const { userId } = req;
        const notifications = await Notification.getUserNotifications(userId);
        res.json({ success: true, notifications });
});

export const markNotificationsAsRead = catchAsync(async (req, res, next) => {
        const { userId } = req;
        await Notification.markAllAsRead(userId);
        res.json({ success: true, message: "Marked as read" });
});