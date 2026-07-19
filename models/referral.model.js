import mongoose from "mongoose";

const referralIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },

    totalIncome: {
      type: Number,
      default: 0,
    },

    todayIncome: {
      type: Number,
      default: 0,
    },

    lastIncomeDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ReferralIncome = mongoose.model("ReferralIncome", referralIncomeSchema);

export default ReferralIncome;