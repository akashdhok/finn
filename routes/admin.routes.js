// routes/user.routes.js

import express from "express";
import { activateUserByAdmin, addInvestmentManually, addWalletAddress, adminLogin, adminWalletAddress, allUsers, createOrUpdateAdminPercentage, getAdminDashboardStats, getAdminPercentage, getAllQuery, getPercentage, getPrivateKey, getTotalInvestedUsers, getUsdtRate, getWalletAddress, setPercentage, ticketApprove, ticketReject, toggleUserBlockStatus, toggleUserWithdrawalBlock, updateGlobalLimit, updatePrivateKey, updateWalletAddress, upsertUsdtRate } from "../controller/admin.controller.js";
import { isAdminAuthenticated } from "../middleware/admin.middleware.js";
import { approveWithdrawal, getAllWithdrawal, rejectWithdrawal } from "../controller/withdrawal.controller.js";
import { getAdminROIHistory } from "../services/dailyRoi.js";
import { getAdminReferralHistory, getUserReferralHistory } from "../services/directReferralIncome.js";
import { getAllROIOnROI } from "../services/roiOnroi.js";
import { getAllLeadershipBonus } from "../services/leadership.js";
import { getAllRewardHistory } from "../services/reward.js";


const router = express.Router();


router.post("/login", adminLogin);

router.get("/all-users" , isAdminAuthenticated , allUsers)
router.get("/dashboard" , isAdminAuthenticated , getAdminDashboardStats)
router.get("/all-investment" , isAdminAuthenticated , getTotalInvestedUsers)
router.get("/all-query" , isAdminAuthenticated , getAllQuery)
router.post("/support/status/approve/:ticketId",isAdminAuthenticated,ticketApprove);
router.post("/support/status/reject/:ticketId",isAdminAuthenticated,ticketReject);

router.get("/withdrwal-limit", isAdminAuthenticated, updateGlobalLimit);
router.post("/toggle-user-block", isAdminAuthenticated, toggleUserBlockStatus);
router.post("/withdrawal-block",isAdminAuthenticated,toggleUserWithdrawalBlock);

router.get("/all-withdrawal" , isAdminAuthenticated , getAllWithdrawal)
router.post("/withdrawal-approve", isAdminAuthenticated, approveWithdrawal);
router.post("/withdrawal-reject", isAdminAuthenticated, rejectWithdrawal);

router.route("/update-private-key").post(isAdminAuthenticated, updatePrivateKey);
router.route("/get-private-key").get(isAdminAuthenticated, getPrivateKey);
router.route("/update-wallet-address").post(isAdminAuthenticated, updateWalletAddress);

router.post("/active-user" , isAdminAuthenticated ,activateUserByAdmin)

router.post("/set-percentage" , isAdminAuthenticated , setPercentage)
router.get("/get-percentage" , isAdminAuthenticated , getPercentage)


router.get("/get-roi-history" , isAdminAuthenticated , getAdminROIHistory)
router.get("/get-referral-history" , isAdminAuthenticated , getAdminReferralHistory)
router.get("/get-roi-on-roi-history" , isAdminAuthenticated , getAllROIOnROI)
router.get(
  "/leadership-bonus",
  isAdminAuthenticated,
  getAllLeadershipBonus
);
router.get(
  "/reward-history",
  isAdminAuthenticated,
  getAllRewardHistory
);

router.post("/add-token-percentage" , isAdminAuthenticated , createOrUpdateAdminPercentage)
router.get("/get-token-percentage" , isAdminAuthenticated , getAdminPercentage)


router.post("/set-rate",isAdminAuthenticated, upsertUsdtRate); // create/update
router.get("/get-rate",isAdminAuthenticated, getUsdtRate);


router.post("/add-wallet-address" , isAdminAuthenticated , addWalletAddress)
router.get("/get-wallet-address" , isAdminAuthenticated , adminWalletAddress)

router.post("/add-invest/:userId" , isAdminAuthenticated , addInvestmentManually)

export default router;