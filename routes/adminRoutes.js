const express = require('express');
const adminControllers = require('../controllers/adminController');
const { isAuthenticatedAdmin } = require('../middleware/adminAuth');
const router = express.Router();
const upload = require('../config/multer');

// Admin routes
router.get('/login', adminControllers.adminLoginGET);
router.post('/login', adminControllers.adminLoginPOST);

router.get('/dashboard', isAuthenticatedAdmin, adminControllers.adminDashboardGET);
router.get('/user', isAuthenticatedAdmin, adminControllers.getAllUsers);
router.delete('/user/:id', isAuthenticatedAdmin, adminControllers.deleteUser);
router.post('/user-block/:id', isAuthenticatedAdmin, adminControllers.blockPOST);

router.get('/categories', isAuthenticatedAdmin, adminControllers.adminCategoriesGET);
router.post('/add-category', isAuthenticatedAdmin, adminControllers.adminAddcategoryPOST);
router.get('/brands', isAuthenticatedAdmin, adminControllers.adminBrandGET);
router.post('/add-brand', isAuthenticatedAdmin, adminControllers.adminAddBrandPOST);

router.get('/products', isAuthenticatedAdmin, adminControllers.adminProductsGET);
router.get('/add-product', isAuthenticatedAdmin, adminControllers.add_productGET);
router.get('/edit-product/:id', isAuthenticatedAdmin, adminControllers.edit_productGET);

router.get('/edit-category/:id', isAuthenticatedAdmin, adminControllers.edit_categoryGET);
router.post('/edit_category/', isAuthenticatedAdmin, adminControllers.edit_categoryPOST);
router.post('/delete-category/:id', isAuthenticatedAdmin, adminControllers.delete_categoryPOST);

router.get('/edit-brand/:id', isAuthenticatedAdmin, adminControllers.edit_brandGET);
router.post('/delete-product/:id', isAuthenticatedAdmin, adminControllers.delete_productPOST);
router.post('/delete-brand/:id', isAuthenticatedAdmin, adminControllers.delete_brandPOST);

// Route for submitting the product with image uploads
router.post('/submit_product', isAuthenticatedAdmin, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), adminControllers.submit_productPOST);

module.exports = router;
