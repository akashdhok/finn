export const checkWorkingCap = (user) => {
  const investment = Number(user.myInvestment || 0);

  const maxCap = investment * 3;

  const earned = Number(user.workingIncome || 0);

  const remainingCap = Math.max(0, maxCap - earned);

  return {
    maxCap,
    earned,
    remainingCap,
    isCapReached: remainingCap <= 0,
  };
};