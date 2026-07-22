// routes/user.routes.js

import express from "express";
import {
  userRegister,
  userLogin,
  getUserProfile,
  updateProfile,
  addWalletAddress,
  myWalletAddress,
  getMyReferrals,
  getMyDownline,
  helpAndSupport,
  getAllHelpAndSupportHistory,
  changePassword,
  investment,
  myInvestment,
  testInvestment,
  getUserDashboardStats,
  forgetPassword
} from "../controller/user.controller.js";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import {  sendOtpForWithdrwal, withdrawalHistory, withdrawalRequest } from "../controller/withdrawal.controller.js";
import upload from "../middleware/upload.js";
import { getUserROIHistory } from "../services/dailyRoi.js";
import { getUserReferralHistory } from "../services/directReferralIncome.js";
import { getMyROIOnROI } from "../services/roiOnroi.js";
import { getAdminPercentage, getUsdtRate } from "../controller/admin.controller.js";
import { adminWalletAddress } from "../controller/admin.controller.js";
import { getMyLeadershipBonus } from "../services/leadership.js";
import { getMyRewardHistory } from "../services/reward.js";
import { getBlockchainDashboard, getBlockchainPublicStats, getNetworkStats, getRecentIncomeHistories, getSystemRecentIncomeHistory } from "../controller/ledger.controller.js";
const router = express.Router();


router.post("/register", userRegister);
router.post("/login", userLogin);

router.get("/profile", isAuthenticated, getUserProfile);
router.put("/update-profile", isAuthenticated, upload.single("profilePhoto"), updateProfile);
router.get("/dashboard" , isAuthenticated , getUserDashboardStats)
router.post("/forgot-password" , forgetPassword)
router.post("/add-walletAddress", isAuthenticated, addWalletAddress);
router.get("/get-walletAddress", isAuthenticated, myWalletAddress);
router.get("/get-admin-wallet-address" , isAuthenticated , adminWalletAddress)

router.get("/my-referrals", isAuthenticated, getMyReferrals);
router.get("/my-downline", isAuthenticated, getMyDownline);

router.post("/investment" , isAuthenticated , testInvestment)
router.get("/my-investment" , isAuthenticated , myInvestment)

router.get("/send-otp", isAuthenticated, sendOtpForWithdrwal);
router.route("/payout-request").post(isAuthenticated, withdrawalRequest);
router.get("/withdrawals-history", isAuthenticated, withdrawalHistory);
 

router.route("/support/create").post(isAuthenticated, helpAndSupport);
router.route("/support/messages").get(isAuthenticated, getAllHelpAndSupportHistory);


router.post("/change-password" , isAuthenticated , changePassword)

router.get("/get-roi-history" , isAuthenticated , getUserROIHistory)
router.get("/get-referral-history" , isAuthenticated , getUserReferralHistory)
router.get("/get-roi-on-roi-history" , isAuthenticated , getMyROIOnROI)
router.get(
  "/my-leadership-bonus",
  isAuthenticated,
  getMyLeadershipBonus
);

router.get(
  "/my-reward-history",
  isAuthenticated,
  getMyRewardHistory
);

router.get("/get-token-percentage" , isAuthenticated , getAdminPercentage)
router.get("/get-rate",isAuthenticated, getUsdtRate);

router.get(
  "/recent-income-history",
  isAuthenticated,
  getRecentIncomeHistories
);

//
router.get("/network/stats", getNetworkStats);
router.get("/blockchain-dash/:hash", getBlockchainDashboard);
router.get("/public-blockchain-dash", getBlockchainPublicStats);


router.get(
  "/system/recent-income-history",
  getSystemRecentIncomeHistory
);
export default router;