const Wallet = require("../models/walletModel");
const User = require("../models/userModel");

async function refundToWallet(userId, amount, reason) {
  try {
    
    if (!amount || amount <= 0) {
      console.error("Invalid refund amount:", amount);
      return false;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      return false;
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      console.error(`Wallet not found for userId: ${userId}`);
      return false;
    }


    wallet.balance += amount;

    wallet.wallet_history.push({
      date: new Date(),
      amount: amount,
      description: `amount credited due to ${reason} of a product` || 'Refund',
      transactionType: 'credited'
    });

    await wallet.save();

    return true;

  } catch (error) {
    console.error("Error in refundToWallet:", error);
    return false;
  }
}

module.exports = refundToWallet;
