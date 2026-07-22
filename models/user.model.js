import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  mobile: String,

  // ✅ FIXED (only once)
  loginBlocked: {
    type: Boolean,
    default: false
  },
  loginBlockedDate: {
    type: Date,
    default: null
  },
  blockchainHash:{
    type :String,
    default:null,
    unique :true
  },
referralIncome:{
  type :Number,
  default :0
},
roiOnroiIncome:{
  type :Number,
  default :0
},
  profilePhoto: String,
  showPassword: String,

  role: {
    type: String,
    default: "user"
  },
rewardRank: {
  type: String,
  enum: [
    "None",
    "Bronze Builder",
    "Silver Starter",
    "Gold Achiever",
    "Platinum Producer",
    "Diamond Director",
    "Elite Executive",
    "Master Mentor",
    "Legend Leader",
    "Champion Creator",
    "Crown Conqueror",
  ],
  default: "None",
},

// Total Instant Reward Income
rewardIncome: {
  type: Number,
  default: 0,
},

// Total Leadership Bonus Income
leadershipBonusIncome: {
  type: Number,
  default: 0,
},
workingIncome: {
  type: Number,
  default: 0,
},
  password: String,

  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  walletAddress: String,
  referralCode: String,

  investments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investment"
  }],

  myReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  withdrawalBlock: {
    type: Boolean,
    default: false
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  status: {
    type: Boolean,
    default: false
  },

  activeDate: Date,

  referralCount: {
    type: Number,
    default: 0
  },

  myInvestment: {
    type: Number,
    default: 0
  },

  todayInvestment: {
    type: Number,
    default: 0
  },

  dailyROI: {
    type: Number,
    default: 0
  },

  otp: {
    type: String,
    default: null
  },

  otpExpiresAt: Date,

  monthlyROI: {
    type: Number,
    default: 0
  },

  teamInvestment: {
    type: Number,
    default: 0
  },

  totalEarnings: {
    type: Number,
    default: 0
  },

  todayEarnings: {
    type: Number,
    default: 0
  },
  totalROI: {
  type: Number,
  default: 0,
},

  totalWithdrawals: {
    type: Number,
    default: 0
  },

  todayWithdrawals: {
    type: Number,
    default: 0
  }

}, { timestamps: true });
const User = mongoose.model('User', userSchema);

export default User;        
