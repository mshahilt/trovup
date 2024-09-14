const express = require('express');
const userCartController = require('../controllers/userCartController');
const router = express.Router();
const { isLoggedIn } = require('../middleware/userAuth');


router.get('/',isLoggedIn,userCartController.addToCartGET)
router.post('/add/:id',isLoggedIn,userCartController.addToCartPost)
router.post('/updateCart/:id',isLoggedIn,userCartController.updateCartQuantity )

router.get('/checkout',isLoggedIn,userCartController.cartCheckout);

router.post('/place_order',isLoggedIn,userCartController.place_orderPOST);
router.post('/save_address',isLoggedIn, userCartController.save_addressPOST)

router.delete('/deleteCart/:id', isLoggedIn,userCartController.deleteCart);


module.exports = router;
