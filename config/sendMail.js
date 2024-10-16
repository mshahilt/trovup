const { name } = require('ejs');
require('dotenv').config();
const nodemailer = require('nodemailer');


const sendMail = (transporter, mailOptions) => {
  console.log(transporter, 'transporter')
  console.log(mailOptions, 'mail otptions')
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