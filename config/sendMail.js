require("dotenv").config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from.email || mailOptions.from,
      subject: mailOptions.subject,
      text: mailOptions.text, 
    };

    sgMail
      .send(msg)
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = sendMail;
