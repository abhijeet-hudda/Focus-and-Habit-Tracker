import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityName: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    category:{
      type: String,
      required: true,
      enum: ["Work", "Study", "Exercise", "Break", "Other"],
    },
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
