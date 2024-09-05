const storeUserSession = (req, user) => {
    req.session.user = {
        user: user._id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        is_verify: user.is_verify
    };
};

module.exports = { storeUserSession };
