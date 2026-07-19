import mongoose from "mongoose";

const adminPercentageSchema = new mongoose.Schema({
  tokenPercentage: {
    type: Number,
    required: true
  },
  usdtPercentage: {
    type: Number,
    required: true
  } 
},{ timestamps: true});

const adminPercentage =  mongoose.model('AdminPercentage', adminPercentageSchema);
export default adminPercentage;