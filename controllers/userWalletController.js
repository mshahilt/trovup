const Wishlist = require("../models/wishlistModel");
const Wallet = require('../models/walletModel');
const User = require("../models/userModel");

const razorpay = require('../config/razorPay');
exports.walletGET = async (req, res) => {
    try {
        const userId = req.session.user.user;
 
        const isUserLoggedIn = req.session.user;
        let wallet = await Wallet.findOne({ user: userId }).sort({createdAt : -1})

        if (!wallet) {
            wallet = new Wallet({
                user: userId,
                balance: 0, 
                wallet_history: []
            });
            await wallet.save();
        }


        res.render("user/wallet", {
            title: "Wallet",
            wallet: wallet,
            isUserLoggedIn,
            layout: "layouts/homeLayout",
        });
    } catch (error) {
        console.error("Error fetching wallet:", error); 
        res.status(500).render("error", {
            title: "Error",
            message: "An error occurred while fetching your wallet. Please try again later."
        });
    }
};

// Add fund to wallet
exports.addFundPOST = async (req, res) => {
    try {
        const userId = req.session.user.user;
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount provided"
            });
        }

        const options = {
            amount: parseInt(amount) * 100, 
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`, 
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            id: order.id,
            currency: order.currency,
            amount: order.amount, 
        });
    } catch (error) {
        console.error("Error adding fund to wallet:", error);
        res.status(500).json({
            message: "An error occurred while adding funds to your wallet. Please try again later."
        });
    }
};

// Verify payment
exports.verifyPaymentPOST = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

    const crypto = require("crypto");

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest("hex");

    if (expectedSignature === razorpaySignature) {
        try {
            const userId = req.session.user.user;
            const wallet = await Wallet.findOne({ user: userId });

            if (wallet) {
                // Update wallet balance (convert amount from paise to rupees)
                wallet.balance += parseFloat(amount) / 100;
                wallet.wallet_history.push({
                    date: new Date(),
                    amount: parseFloat(amount) / 100, // Save in rupees
                    description: "Funds added to wallet",
                    transactionType: "credited",
                });

                await wallet.save();
            }

            return res.status(200).json({
                success:true,
                message: "Payment verified successfully",
            });
        } catch (error) {
            console.error("Error updating wallet:", error);
            return res.status(500).json({
                message: "An error occurred while processing your payment. Please try again later."
            });
        }
    } else {
        return res.status(400).json({
            message: "Payment verification failed. Please check your payment details."
        });
    }
};
