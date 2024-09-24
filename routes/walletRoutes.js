const express = require('express');
const router = express.Router();
const walletController  = require('../controllers/userWalletController')
const { isLoggedIn, otpConfirm } = require('../middleware/userAuth');


router.get('/',isLoggedIn,walletController.walletGET);

router.post('/addFund',isLoggedIn,walletController.addFundPOST);
router.post('/verifyPayment', isLoggedIn, walletController.verifyPaymentPOST);

module.exports = router;
