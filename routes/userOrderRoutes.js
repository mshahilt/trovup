const express = require('express');
const userCartController = require('../controllers/userCartController');
const userOrderController = require('../controllers/userOrderController');
const { isLoggedIn } = require('../middleware/userAuth');
const router = express.Router();

router.post('/order_confirm',isLoggedIn,userOrderController.order_confirmPOST);
router.get('/order_history',isLoggedIn,userOrderController.order_historyGET);

router.get('/order-details/:id',isLoggedIn,userOrderController.order_detailsGET);

router.post('/create_razor_order',isLoggedIn,userOrderController.create_razor_orderPOST);
router.post('/verify_razorpay_payment',isLoggedIn,userOrderController.verify_razorpay_paymentPOST);

module.exports = router;
