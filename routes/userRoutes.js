const express = require('express');
const userController = require('../controllers/userController');
const { isLoggedIn, isLoggedOut, otpConfirm } = require('../middleware/userAuth');
const router = express.Router();


router.get('/register', isLoggedOut, userController.registerUserGet);
router.post('/register', isLoggedOut, userController.registerUser);

router.get('/', userController.getHomePagePOST);


router.get('/login', isLoggedOut, userController.loginUserGet);
router.post('/login', isLoggedOut, userController.loginUser);

router.get('/profile/:id', isLoggedIn, userController.getUserProfile);


router.get('/products', userController.productPageGET);
router.get('/product/:id', userController.viewProductGET);



router.post('/verifyOTP', userController.verifyOTP);
router.get('/verifyOTP',userController.getVerifyOTP)

router.post('/resendOTP',userController.resendOTP)

router.post('/logout',userController.logout)
module.exports = router;
