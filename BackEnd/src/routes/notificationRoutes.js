import express from "express";
import { getUnseenNotifications, markNotificationsAsSeen ,getAllNotifications} from "../controllers/notificationController.js";
import authenticateUser from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get("/",authenticateUser, getUnseenNotifications);
router.get("/all",authenticateUser, getAllNotifications);
router.post("/mark-seen", authenticateUser,markNotificationsAsSeen);

export default router;
