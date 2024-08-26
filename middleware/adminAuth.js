
exports.isAuthenticatedAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next(); 
    } else {
        return next();
    }
};
