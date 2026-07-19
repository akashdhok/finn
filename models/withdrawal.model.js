import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userWalletAddress: {
      type: String,
      required: true,
    },
    tokenAmount: {
      type: Number,
      required: true,
    },
    usdtAmount: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
    netAmountSent: {
      type: Number,
      required: true,
    },
    usdtTxHash: {
      type: String,
      default: null,
    },
    tokenTxHash: {
      type: String,
      default: null,
    },
    feeAmount: {
      type: Number,
      required: true,
    },
    transactionHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "success", "failed"],
      default: "pending",
      required: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;