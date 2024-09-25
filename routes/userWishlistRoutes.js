const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const router = express.Router();
const { isLoggedIn } = require('../middleware/userAuth');

// GET the wishlist page
router.get('/', isLoggedIn, wishlistController.wishlistGET);

// POST request to add a product to the wishlist
router.post('/add/:id', isLoggedIn, wishlistController.postWishlist);

router.post('/delete-item', isLoggedIn, wishlistController.deleteWishlist);

module.exports = router;
