const express = require('express');
const userCartController = require('../controllers/userCartController');
const router = express.Router();
const { isLoggedIn } = require('../middleware/userAuth');


router.get('/',isLoggedIn,userCartController.addToCartGET)
router.post('/add/:id',isLoggedIn,userCartController.addToCartPost)
router.post('/updateCart/:id',isLoggedIn,userCartController.updateCartQuantity )

router.get('/checkout',isLoggedIn,userCartController.cartCheckout);

router.post('/apply-coupon',isLoggedIn,userCartController.apply_couponPOST);
router.post('/apply_coupon_to_user',isLoggedIn, userCartController.apply_coupon_to_userPOST);
router.post('/remove_coupon_from_user',isLoggedIn, userCartController.remove_coupon_from_userPOST);

router.post('/place_order',isLoggedIn,userCartController.place_orderPOST);
router.post('/save_address',isLoggedIn, userCartController.save_addressPOST)

router.post('/deleteCart/:id', isLoggedIn,userCartController.deleteCart);


module.exports = router;
