const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController')

router.get('/',userProfileController.user_profileGET)
router.post('/profile-edit',userProfileController.user_profileEditPOST)
router.post('/change-password',userProfileController.user_password_change);
module.exports = router;
