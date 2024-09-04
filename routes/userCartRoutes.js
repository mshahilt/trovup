const express = require('express');
const userCartController = require('../controllers/userCartController');
const router = express.Router();



router.get('/',userCartController.addToCartGET)
router.post('/add/:id',userCartController.addToCartPost)
router.post('/updateCart/:id',userCartController.updateCartQuantity )

router.get('/checkout',userCartController.cartCheckout);

router.post('/place_order',userCartController.place_orderPOST);
router.post('/save_address', userCartController.save_addressPOST)

module.exports = router;
