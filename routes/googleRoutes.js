// router/googleRoutes.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const googleAuthController = require('../controllers/googleAuthController');

// Initiate Google OAuth with account selection prompt
router.get('/', passport.authenticate('google', { 
    scope: ['email', 'profile'],
    prompt: 'select_account' // This forces Google to show the account selection screen
}));

router.get('/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
    (req, res) => {
        res.redirect('/auth/google/protected');
    }
);

router.get('/protected', googleAuthController.callBackSuccess);

// Failure Route
router.get('/failure', googleAuthController.callBackFailure);

module.exports = router;
