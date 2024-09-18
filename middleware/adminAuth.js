
exports.isAuthenticatedAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next(); 
    } else {
        res.redirect('/admin/login');
    }
};

exports.redirectIfAuthenticatedAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
};
