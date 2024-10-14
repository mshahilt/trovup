const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or another email service
    auth: {
        user: process.env.USER, // Your email address
        pass: process.env.APP_PASSWORD, // Your email password or app password
    },
});

// Function to send mail
const sendMail = (mailOptions) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return reject(err);
            }
            resolve(info);
        });
    });
};

module.exports = sendMail;
