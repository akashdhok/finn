import mongoose from "mongoose";

const roiHistorySchema = new mongoose.Schema(
  {
    // 👤 Jisko income mili
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 💰 Amount
    amount: {
      type: Number,
      required: true,
    },

    investment: {
      type: Number,
      default: 0,
    },

    // 🔁 Kis user se aaya (ROI on ROI ke liye)
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 📊 Level (ROI on ROI ke liye)
    level: {
      type: Number,
      default: 0,
    },

    // 🏷 Type
    type: {
      type: String,
      enum: ["daily_roi", "roi_on_roi"],
      default: "daily_roi",
    },

    // 📅 Custom date
    date: {
      type: Date,
      default: Date.now,
    },

    // 📝 Description (optional but useful)
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const ROIHistoryModel = mongoose.model("ROIHistory", roiHistorySchema);

export default ROIHistoryModel;