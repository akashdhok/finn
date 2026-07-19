export const generateReferralCode = () => {
  const namePart = "NEXA";
  const randomDigits = Math.floor(1000 + Math.random() * 9000); 
  return `${namePart}${randomDigits}`;
};

export const randomUsername = () => {
  const characters = "0123456789";
  let result = "";
  const length = 4;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `NEXA${result}`;
};
