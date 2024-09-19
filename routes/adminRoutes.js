const express = require('express');
const adminControllers = require('../controllers/adminController');
const { isAuthenticatedAdmin, redirectIfAuthenticatedAdmin } = require('../middleware/adminAuth');
const router = express.Router();
const upload = require('../config/multer');

// Authentication Routes
// ---------------------
router.get('/login', redirectIfAuthenticatedAdmin, adminControllers.adminLoginGET);
router.post('/login', redirectIfAuthenticatedAdmin, adminControllers.adminLoginPOST);

// Admin Dashboard
// ---------------
router.get('/dashboard', isAuthenticatedAdmin, adminControllers.adminDashboardGET); 

// User Management Routes
// ----------------------
router.get('/user', isAuthenticatedAdmin, adminControllers.getAllUsers);  
router.delete('/user/:id', isAuthenticatedAdmin, adminControllers.deleteUser);
router.post('/user-block/:id', isAuthenticatedAdmin, adminControllers.blockPOST);

// Category Management Routes
// --------------------------
router.get('/categories', isAuthenticatedAdmin, adminControllers.adminCategoriesGET);
router.post('/add-category', isAuthenticatedAdmin, adminControllers.adminAddcategoryPOST);
router.get('/edit-category/:id', isAuthenticatedAdmin, adminControllers.edit_categoryGET);
router.post('/edit_category/', isAuthenticatedAdmin, adminControllers.edit_categoryPOST);
router.post('/delete-category/:id', isAuthenticatedAdmin, adminControllers.delete_categoryPOST);

// Brand Management Routes
// -----------------------
router.get('/brands', isAuthenticatedAdmin, adminControllers.adminBrandGET);
router.post('/add-brand', isAuthenticatedAdmin, adminControllers.adminAddBrandPOST);
router.get('/edit-brand/:id', isAuthenticatedAdmin, adminControllers.edit_brandGET);
router.post('/delete-brand/:id', isAuthenticatedAdmin, adminControllers.delete_brandPOST);

// Product Management Routes
// -------------------------
router.get('/products', isAuthenticatedAdmin, adminControllers.adminProductsGET);
router.get('/add-product', isAuthenticatedAdmin, adminControllers.add_productGET);
router.get('/edit-product/:id', isAuthenticatedAdmin, adminControllers.edit_productGET);
router.post('/submit_product', isAuthenticatedAdmin, upload.any(), adminControllers.submit_productPOST);
router.post('/update_product/:id', isAuthenticatedAdmin, upload.any(), adminControllers.update_productPOST);
router.post('/delete-product/:id', isAuthenticatedAdmin, adminControllers.delete_productPOST);

// Order Management Routes
// -----------------------
router.get('/orders', isAuthenticatedAdmin, adminControllers.orderGET);
router.post('/update-order-status', isAuthenticatedAdmin, adminControllers.update_order_statusPOST);

// Coupon Management Routes
// -------------------------
router.get('/coupons', isAuthenticatedAdmin, adminControllers.couponGET);
router.post('/add-coupon', isAuthenticatedAdmin, adminControllers.add_couponPOST);

module.exports = router;

