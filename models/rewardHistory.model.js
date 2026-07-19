import mongoose from "mongoose";

const rewardHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rank: String,

    powerLegBusiness: Number,

    weakerBusiness: Number,

    instantReward: Number,

    dailyReward: Number,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RewardHistory", rewardHistorySchema);