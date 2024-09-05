const express = require('express');
const userCartController = require('../controllers/userCartController');
const userOrderController = require('../controllers/userOrderController');
const router = express.Router();

router.post('/order_confirm',userOrderController.order_confirmPOST)
router.get('/order_history',userOrderController.order_historyGET)
module.exports = router;
