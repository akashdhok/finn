import mongoose from "mongoose";

const leadershipBonusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  rank: {
    type: String,
    required: true,
  },

  dailyIncome: {
    type: Number,
    required: true,
  },

  totalPaid: {
    type: Number,
    default: 0,
  },

  nextPaymentDate: {
    type: Date,
    required: true,
  },

  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});


export default  mongoose.model("Leadership_bonus" , leadershipBonusSchema)