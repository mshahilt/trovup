const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/catogeryModel');
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const flash = require('connect-flash');
const Products = require('../models/productModel');

// Get All Users (Admin only)
exports.adminLoginGET = async (req, res) => {
    res.render('admin/login',{
        layout:'layouts/loginAndSignupLayout'
    })
};

exports.adminLoginPOST = async (req, res) => {
    const { emailOrPhone, password } = req.body;

    if (emailOrPhone && password) {
        try {
            let admin;

            // Check if the input is an email or phone number
            if (validateEmail(emailOrPhone)) {
                admin = await User.findOne({ email: emailOrPhone, isAdmin: true });
            } else if (validatePhone(emailOrPhone)) {
                admin = await User.findOne({ phone_number: emailOrPhone, isAdmin: true });
            } else {
                req.flash('error', 'Invalid email or phone number');
                return res.redirect('/admin/login');
            }

            if (!admin) {
                req.flash('error', 'Admin not found');
                return res.redirect('/admin/login');
            }

            const isMatch = await bcrypt.compare(password, admin.password);

            if (!isMatch) {
                req.flash('error', 'Incorrect password or email');
                return res.redirect('/admin/login');
            }

            // Create session for admin
            req.session.admin = {
                id: admin._id,
                email: admin.email
            };

            req.flash('success', 'Logged in successfully');
            return res.redirect('/admin/dashboard');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Internal server error');
            return res.redirect('/admin/login');
        }
    } else {
        req.flash('error', 'Email or phone and password are required');
        return res.redirect('/admin/login');
    }
};


// functions to identify admins input is an email or not
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/; 
    return phoneRegex.test(phone);
}



exports.adminDashboardGET = async (req, res) => {
    try {
        res.render('admin/dashboard',{
            layout:'layouts/adminLayout'
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get All Users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false });
        res.render('admin/users', { users ,title:'Users',layout:'layouts/adminLayout'});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Block User POST

exports.blockPOST = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isBlock = !user.isBlock;
            await user.save();
            req.flash('success', `User ${user.isBlock ? 'blocked' : 'unblocked'} successfully!`);
        } else {
            req.flash('error', 'User not found!');
        }
        res.redirect('/admin/user'); // Redirect back to the user list page
    } catch (err) {
        req.flash('error', 'Something went wrong!');
        res.redirect('/admin/user');
    }
};

// Admin categories GET
exports.adminCategoriesGET = async(req,res) => {
    const categories = await Category.find(); // Fetch categories from the database
        res.render('admin/catogories', { categories , title:'Categories', layout:'layouts/adminLayout'});
}


exports.adminAddcategoryPOST = async (req, res) => {
    try {
        const { categoryName } = req.body; // Get the category name from the request body

        // Check if categoryName is provided
        if (!categoryName) {
            req.flash('error', 'Category name is required');
            return res.redirect('/admin/categories');
        }

        // Check if the category already exists
        const existingCategory = await Category.findOne({ category_name: categoryName });
        if (existingCategory) {
            req.flash('error', 'Category name already exists');
            return res.redirect('/admin/categories');
        }

        // Create a new category instance
        const newCategory = new Category({
            category_name: categoryName, // Assign the category name
        });

        // Save the category to the database
        await newCategory.save();

        // Flash a success message and redirect to the categories page
        req.flash('success', 'Category added successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error adding category:', error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/admin/categories');
    }
};

exports.edit_categoryGET = async (req, res) => {
    try {
        const categoryId = req.params.id; // Assuming the category ID is passed as a URL parameter named 'id'
        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
            return res.redirect('/admin/category-list'); // Redirect if the category is not found
        }

        res.render('admin/edit_categories', { // Updated to use the correct view path
            layout: 'layouts/adminLayout', // Updated to use the correct layout path
            category
        });
    } catch (error) {
        console.log('An error occurred while loading the edit category page:', error);
        res.redirect('/admin/category-list'); // Redirect to a safe page on error
    }
};

exports.edit_categoryPOST = async (req, res) => {
    try {
        const { categoryId, new_category_name } = req.body; // Assuming categoryId and new_category_name are sent in the request body
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId, // The ID of the category to update
            { category_name: new_category_name }) // The new data to update

        if (!updatedCategory) {
            console.log('Category not found');
            return res.redirect('/admin/categories');
        }

        res.redirect('/admin/categories'); 
    } catch (error) {
        console.log('An error occurred while posting edit category:', error);
        res.redirect('/admin/categories'); // Redirect on error
    }
};
exports.delete_categoryPOST = async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const category = await Category.findById(categoryId);

        if (!category) {
            console.log('Category not found');
            req.flash('error', 'Category not found');
            return res.redirect('/admin/categories');
        }

        if (category.isDeleted) {
            // Restore the category and related products
            await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
            await Products.updateMany({ category_id: categoryId, isDelete: true }, { isDelete: false });
            req.flash('success', 'Category restored successfully');
        } else {
            // Soft delete the category and related products
            await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
            await Products.updateMany({ category_id: categoryId }, { isDelete: true });
            req.flash('success', 'Category deleted successfully');
        }

        // Redirect to the categories list
        res.redirect('/admin/categories');
    } catch (error) {
        console.log('An error occurred while toggling the category status:', error);
        req.flash('error', 'An error occurred while toggling the category status');
        res.redirect('/admin/categories');
    }
};

// Admin Products GET
exports.adminProductsGET = async (req, res) => {
    try {
        // Populate category_id and brand_id with the actual data
        const products = await Product.find()
            .populate('category_id', 'category_name') // Fetch only the category_name field
            .populate('brand_id', 'brand_name'); // Fetch only the brand_name field

        console.log(products);

        res.render('admin/products', {
            products,
            title: 'Product',
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        console.error('Error on viewing product:', error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/admin/products');
    }
};


// admin add product GET
exports.add_productGET = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        const brands = await Brand.find();
        res.render('admin/add_new_product', { products, categories, brands, title: 'Product', layout: 'layouts/adminLayout' });
    } catch (error) {
        console.error('Error on viewing product:', error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/admin/add_new_product');
    }
}

exports.submit_productPOST = async (req, res) => {
    try {
        // Access form fields
        const {
            product_name,
            product_description,
            product_highlights,
            category_id,
            brand_id,
            price,
            color,
            stock,
            storage_size
        } = req.body;

        // Remove commas from the price string and convert it to a number
        const numericPrice = Number(price.replace(/,/g, ''));

        // Access uploaded images
        const images = req.files;
        const imagePaths = [];
        
        if (images.image1) imagePaths.push(images.image1[0].path);
        if (images.image2) imagePaths.push(images.image2[0].path);
        if (images.image3) imagePaths.push(images.image3[0].path);
        if (images.image4) imagePaths.push(images.image4[0].path);

        // Create new product with uploaded image paths and other details
        const product = new Product({
            product_name,
            product_description,
            product_highlights,
            category_id,
            brand_id,
            images: imagePaths,
            variants: [
                {
                    price: numericPrice,
                    storage_size,
                    stock: Number(stock),
                    color 
                }
            ]
        });

        await product.save();
        console.log(product)

        // Redirect or respond after saving
        res.redirect('/admin/products'); // Adjust to your success page
    } catch (error) {
        console.error(error);
        res.status(500).send('Error submitting product');
    }
};

exports.edit_productGET = async (req, res) => {
    try {
        const { id } = req.params;
        
    
        const product = await Products.findById(id)
                        .populate('category_id', 'category_name') 
                        .populate('brand_id', 'brand_name');   

        const categories = await Category.find();
        const brands = await Brand.find();
        console.log(product)

       
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin/edit_product', {product,brands,categories,title:'Edit product',layout:'layouts/adminLayout'})
    } catch (err) {
        console.log('Error occurred while loading edit product page', err);
        res.status(500).send('Internal Server Error');
    }
}

exports.delete_productPOST = async (req, res) => {
    try {
        const productId = req.params.id;

        // Find the product and populate related category and brand
        const product = await Products.findById(productId)
            .populate('category_id')
            .populate('brand_id');

        if (!product) {
            console.log('Product not found');
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        if (product.isDelete) {
            // Check the related category and brand status
            const category = await Category.findById(product.category_id._id);
            const brand = await Brand.findById(product.brand_id._id);

            // Ensure category and brand exist before checking isDeleted status
            if (!category || !brand) {
                req.flash('error', 'Related category or brand not found');
                return res.redirect('/admin/products');
            }

            // If either category or brand is deleted, restrict restoration
            if (category.isDeleted || brand.isDeleted) {
                req.flash('error', 'Cannot restore product because related category or brand is deleted');
                return res.redirect('/admin/products');
            }

            // Restore the product
            await Products.findByIdAndUpdate(productId, { isDelete: false });
            req.flash('success', 'Product restored successfully');
        } else {
            // Soft delete the product
            await Products.findByIdAndUpdate(productId, { isDelete: true });
            req.flash('success', 'Product deleted successfully');
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.log('An error occurred while toggling the product status:', error);
        req.flash('error', 'An error occurred while toggling the product status');
        res.redirect('/admin/products');
    }
};


// Admin add brand GET
exports.adminBrandGET = async (req, res) => {
    try {
        // Fetch all categories that are not deleted
        const categories = await Category.find({ isDeleted: false });

        // Fetch brands and populate the categories field
        const brands = await Brand.find()
            .populate({
                path: 'categories',
                match: { isDeleted: false }  // Only include categories that are not deleted
            });

        // Render the template with the fetched data
        res.render('admin/brands', { 
            brands, 
            categories, 
            title: 'Product', 
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        console.error('Error on viewing brands:', error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/admin/brands');
    }
};

exports.adminAddBrandPOST = async (req, res) => {
    const { categories, brandName } = req.body;

    try {
        // Check if both categories and brandName are provided
        if (!categories || !brandName) {
            req.flash('error', 'Both category and brand name are required');
            return res.redirect('/admin/brand');
        }

        // Check if the brand already exists
        const existingBrand = await Brand.findOne({ brand_name: brandName });
        if (existingBrand) {
            req.flash('error', 'Brand name already exists');
            return res.redirect('/admin/brand');
        }

        // Create a new brand instance
        const newBrand = new Brand({
            brand_name: brandName,
            categories: categories
        });

        // Save the brand to the database
        await newBrand.save();

        // Flash a success message and redirect to the brand page
        req.flash('success', 'Brand added successfully');
        res.redirect('/admin/brands');
    } catch (error) {
        console.error('Error adding brand:', error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/admin/brands');
    }
};

exports.edit_brandGET = async (req, res) => {
    try {
        const  {id}  = req.params;

        const brand = await Brand.findById(id).populate('categories', 'category_name');
        const categories = await Category.find();
        console.log(categories)
        res.render('admin/edit_brand', { brand, categories,title:'Edit Brand', layout:'layouts/adminLayout'});
    } catch (error) {
        console.log('An error occurred while rendering the edit brand page:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.delete_brandPOST = async (req, res) => {
    try {
        const brandId = req.params.id; 
        const brand = await Brand.findById(brandId);

        if (!brand) {
            console.log('Brand not found');
            req.flash('error', 'Brand not found');
            return res.redirect('/admin/brands');
        }

        if (brand.isDeleted) {
            // Restore the brand and related products
            await Brand.findByIdAndUpdate(brandId, { isDeleted: false });
            await Products.updateMany({ brand_id: brandId, isDelete: true }, { isDelete: false });
            req.flash('success', 'Brand restored successfully');
        } else {
            // Soft delete the brand and related products
            await Brand.findByIdAndUpdate(brandId, { isDeleted: true });
            await Products.updateMany({ brand_id: brandId }, { isDelete: true });
            req.flash('success', 'Brand deleted successfully');
        }

        // Redirect to the brands list
        res.redirect('/admin/brands');
    } catch (error) {
        console.log('An error occurred while toggling the brand status:', error);
        req.flash('error', 'An error occurred while toggling the brand status');
        res.redirect('/admin/brands');
    }
}

// Delete User (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(404).json({ error: 'User not found' });
    }
};
