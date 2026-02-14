import { Router } from "express";
import {
  createActivity,
  getAllActivities,
  getActivitiesByRange, // Import this
  deleteActivity,
  getWeeklyAnalytics,
} from "../controller/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/create-Activity", createActivity);
router.get("/", getAllActivities);
router.get("/range", getActivitiesByRange); // New Route
router.get("/weekly-analytics", getWeeklyAnalytics);
router.delete("/:activityId", deleteActivity);

export default router;