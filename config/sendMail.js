require("dotenv").config();
const nodemailer = require("nodemailer");


// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  service:"Gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});

console.log(process.env.APP_PASSWORD);

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
