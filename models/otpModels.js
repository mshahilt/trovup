const mongoose = require('mongoose');

// Define the schema for OTP
const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 180,
    },
});

// Create the OTP model
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
