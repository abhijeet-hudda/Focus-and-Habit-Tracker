import mongoose from "mongoose";
import { Activity } from "../models/activity.model.js";
import { ApiError } from "../utils/apiError.utils.js";
import { ApiResponse } from "../utils/apiResponse.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const createActivity = asyncHandler(async (req, res) => {
  const { activityName, duration, category } = req.body;

  if ([activityName, duration, category].some((field) => !field)) {
    throw new ApiError(400, "All fields are required");
  }
  if (duration <= 0) {
    throw new ApiError(400, "Duration must be greater than 0");
  }
  const activity = await Activity.create({
    user: req.user._id,
    activityName,
    duration,
    category,
  });
  return res
    .status(201)
    .json(new ApiResponse(
        201,
        activity,
        "Activity created successfully"
    ));
});

const getAllActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({
    user: req.user._id,
  }).sort({ createdAt: -1 }); // Newest first

  return res.status(200).json(
    new ApiResponse(200, activities, "History fetched successfully")
  );
});
const getActivitiesByRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and End date are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the full end day

  const activities = await Activity.find({
    user: req.user._id,
    createdAt: {
      $gte: start,
      $lte: end,
    },
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, activities, "Activities fetched for range")
  );
});

const deleteActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    throw new ApiError(400, "Invalid activity ID");
  }
  const activity = await Activity.findById(activityId);

  if (!activity) {
    throw new ApiError(404, "Activity not found");
  }
  if (activity.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this activity");
  }
  await activity.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Activity deleted successfully"));
});

const getActivitiesByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, "Date query parameter is required");
  }

  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const activities = await Activity.find({
    user: req.user._id,
    createdAt: {
      $gte: start,
      $lt: end,
    },
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(
        200,
        activities,
        "Activities fetched for selected date"
    ));
});

const getWeeklyAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const analytics = await Activity.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: "$createdAt" },
          category: "$category",
        },
        totalDuration: { $sum: "$duration" },
      },
    },
    {
      $sort: { "_id.day": 1 },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      analytics,
      "Weekly analytics fetched successfully"
    )
  );
});

export {
    createActivity,
    getAllActivities,
    getActivitiesByRange,
    deleteActivity,
    getActivitiesByDate,
    getWeeklyAnalytics
}
