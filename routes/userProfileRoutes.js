const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController')
const { isLoggedIn, otpConfirm } = require('../middleware/userAuth');

router.get('/',isLoggedIn,userProfileController.user_profileGET)
router.post('/profile-edit',isLoggedIn,userProfileController.user_profileEditPOST)
router.post('/change-password',isLoggedIn,userProfileController.user_password_change);
router.post('/forgot-password',isLoggedIn,userProfileController.forgot_password)

router.post('/forgetPassVerifyOtp',isLoggedIn,userProfileController.verifyOtpPOST);

router.get('/forgetPassVerifyOtp',isLoggedIn,userProfileController.forgetPassVerifyOtpGET);

router.get('/changePassword',isLoggedIn,userProfileController.changePasswordGET)
router.post('/changePassword',isLoggedIn,userProfileController.changePasswordPOST)

router.get('/addresses',isLoggedIn,userProfileController.addressBookGET);

router.get('/edit-address/:id',isLoggedIn,userProfileController.addressEditGET)

router.post('/edit-address/:id',isLoggedIn,userProfileController.addressEditPOST);
router.post('/delete-address/:id',isLoggedIn,userProfileController.deleteAddressPOST )
module.exports = router;
