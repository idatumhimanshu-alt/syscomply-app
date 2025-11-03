import Notification from "../models/Notification.js";

// Get Unseen Notifications for a User
export const getUnseenNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId, is_seen: false },
            order: [["created_at", "DESC"]],
        });

        if (notifications.length === 0) {
            return res.status(200).json({ message: "No unseen notifications found." });
        }

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching unseen notifications:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Mark Notifications as Seen
export const markNotificationsAsSeen = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedCount = await Notification.update(
            { is_seen: true }, 
            { where: { user_id: userId, is_seen: false } }
        );

        if (updatedCount[0] === 0) {
            return res.status(200).json({ message: "No unseen notifications to mark as seen." });
        }

        res.json({ message: "Notifications marked as seen." });
    } catch (error) {
        console.error("Error marking notifications as seen:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// Get All Notifications for a User
export const getAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({
            where: { user_id: userId },
            order: [["created_at", "DESC"]],
        });

        if (notifications.length === 0) {
            return res.status(200).json({ message: "No notifications available." });
        }

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching all notifications:", error);
        res.status(500).json({ error: "Server Error" });
    }
};
