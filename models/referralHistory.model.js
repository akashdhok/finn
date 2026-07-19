import mongoose from "mongoose";

const referralHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    investment: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
    },

    level: {
      type: Number,
      default: 1, 
    },

    type: {
      type: String,
      default: "direct_referral",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ReferralHistory = mongoose.model("ReferralHistory", referralHistorySchema);

export default ReferralHistory;