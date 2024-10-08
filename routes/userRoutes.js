const express = require('express');
const userController = require('../controllers/userController');
const { isLoggedIn, isLoggedOut, otpConfirm, isBlockForHome } = require('../middleware/userAuth');
const router = express.Router();


router.get('/register', isLoggedOut, userController.registerUserGet);
router.post('/register', isLoggedOut, userController.registerUser);

router.get('/',isBlockForHome, userController.getHomePagePOST);


router.get('/login', isLoggedOut, userController.loginUserGet);
router.post('/login', isLoggedOut, userController.loginUser);


router.get('/products', userController.productPageGET);
router.get('/product/:id', userController.viewProductGET);

router.get('/search',userController.searchPageGET);

router.post('/verifyOTP',userController.verifyOTP);
router.get('/verifyOTP',userController.getVerifyOTP)

router.post('/resendOTP',userController.resendOTP)

router.post('/otpLogin',userController.resendOTP)

router.get('/getReferralCode',userController.getReferralCode)

router.post('/logout',userController.logout)


module.exports = router;
