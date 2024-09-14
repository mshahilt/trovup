const express = require('express');
const router = express.Router();
const passport = require('passport');
const googleAuthController = require('../controllers/googleAuthController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware');

router.get('/', 
    userAuthMiddleware.isLoggedOut,
    passport.authenticate('google', { 
        scope: ['email', 'profile'],
        prompt: 'select_account'
    })
);

router.get('/callback', 
    passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
    (req, res) => {
        res.redirect('/auth/google/protected');
    }
);

router.get('/protected', 
    userAuthMiddleware.isLoggedIn,
    googleAuthController.callBackSuccess
);

router.get('/failure', googleAuthController.callBackFailure);

module.exports = router;
