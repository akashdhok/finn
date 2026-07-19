import mongoose from "mongoose";

const usdtTokenRateSchema = new mongoose.Schema(
  {
    rate: {
      type: Number,
    },
    usdt:{
        type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const UsdtTokenRate = mongoose.model("UsdtTokenRate", usdtTokenRateSchema);

export default UsdtTokenRate;