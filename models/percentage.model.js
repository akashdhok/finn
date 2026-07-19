import mongoose from "mongoose";

const percentageSchema = new mongoose.Schema({
  referralPercentage: {
    type: Number,
    default: 0,
  },
  roiPercentage: {
    type: Number,
    default: 0,
  },
  roiOnRoi: {
   level1:{
     type: Number,
    default: 0,
   },
   level2:{
     type: Number,
    default: 0,
   },
   level3:{
     type: Number,
    default: 0,
   },
   level4:{
     type: Number,
    default: 0,
   },
   level5:{
     type: Number,
    default: 0,
   },
  },
}, { timestamps: true });

const PercentageModel = mongoose.model("Percentage", percentageSchema);

export default PercentageModel;