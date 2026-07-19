import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    investmentAmount: {
      type: Number,
      required: true,
    },
    investmentDate: {
      type: Date,
      default: Date.now,
    },
    txResponse: {
      type: String,

    },
    paymentMethod: String,
    status: String,
    remark: String,
    txHash:String
  },
  { timestamps: true }
);

const Investment = mongoose.model("Investment", investmentSchema);

export default Investment;
