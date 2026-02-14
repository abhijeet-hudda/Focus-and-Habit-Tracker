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
  const { category } = req.query;

  // Build the query object
  const query = { user: req.user._id };
  
  // If a category is provided (and not "All"), filter by it
  if (category && category !== "All") {
    query.category = category;
  }

  const activities = await Activity.find(query).sort({ createdAt: -1 });

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
  // Use local system time for date math, but convert to UTC for MongoDB queries
  const now = new Date();
  // Local start of today
  const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  // Convert to UTC
  const todayUTC = new Date(localToday.getTime() - localToday.getTimezoneOffset() * 60000);
  const sevenDaysAgoLocal = new Date(localToday);
  sevenDaysAgoLocal.setDate(localToday.getDate() - 6);
  const sevenDaysAgoUTC = new Date(sevenDaysAgoLocal.getTime() - sevenDaysAgoLocal.getTimezoneOffset() * 60000);

  // Build array of last 7 dates (YYYY-MM-DD), oldest to newest, today is rightmost, using local time
  const last7Dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(localToday);
    d.setDate(localToday.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    last7Dates.push(`${yyyy}-${mm}-${dd}`);
  }

  // Aggregate by date and category
  const analytics = await Activity.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: sevenDaysAgoUTC, $lte: todayUTC },
      },
    },
    {
      $addFields: {
        // Convert createdAt to local date string for grouping
        dateString: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $add: ["$createdAt", { $multiply: [60000, new Date().getTimezoneOffset() * -1] }]
            }
          }
        }
      },
    },
    {
      $group: {
        _id: { date: "$dateString", category: "$category" },
        totalDuration: { $sum: "$duration" },
      },
    },
    {
      $sort: { "_id.date": 1 },
    },
  ]);

  // Build result for all 7 days
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = last7Dates.map(date => {
    const d = new Date(date);
    const dayLabel = dayNames[d.getDay()];
    console.log(date , dayLabel)

    const dayData = analytics.filter(item => item._id.date === date);
    const categories = {};
    let totalDayMinutes = 0;
    dayData.forEach(item => {
      categories[item._id.category] = item.totalDuration;
      totalDayMinutes += item.totalDuration;
    });
    return {
      date,
      dayLabel,
      categories,
      totalDayMinutes,
    };
  });

  console.log(analytics)

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
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
