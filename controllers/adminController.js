const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/catogeryModel');
const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const flash = require('connect-flash');
const Products = require('../models/productModel');
const Orders = require('../models/orderModel');
const Coupon = require('../models/coupenModel');

// Get All Users (Admin only)
exports.adminLoginGET = async (req, res) => {
    res.render('admin/login',{
        layout:'layouts/loginAndSignupLayout'
    })
};
exports.adminLoginPOST = async (req, res) => {
    const { email, password } = req.body;

    console.log('admin post');
    
    if (email && password) {
        try {
            // Check if email is valid
            if (!validateEmail(email)) {
                req.flash('error', 'Invalid email format');
                return res.redirect('/admin/login');
            }

            // Find admin by email
            const admin = await User.findOne({ email, isAdmin: true });
            
            if (!admin) {
                req.flash('error', 'Admin not found');
                return res.redirect('/admin/login');
            }

            // Compare password
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
        req.flash('error', 'Email and password are required');
        return res.redirect('/admin/login');
    }
};

// Function to validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
        const { categoryName } = req.body;

        if (!categoryName) {
            req.flash('error', 'Category name is required');
            return res.redirect('/admin/categories');
        }

        // Create a case-insensitive regex pattern for the category name
        const regexPattern = new RegExp(`^${categoryName.trim()}$`, 'i');

        // Check if the category already exists (case-insensitive)
        const existingCategory = await Category.findOne({ category_name: { $regex: regexPattern } });
        if (existingCategory) {
            req.flash('error', 'Category name already exists');
            return res.redirect('/admin/categories');
        }

        // Create a new category
        const newCategory = new Category({
            category_name: categoryName.trim(), // Store the category name as entered
        });

        await newCategory.save();

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
        const { categoryId, new_category_name } = req.body; 
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
            await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
            await Products.updateMany({ category_id: categoryId, isDelete: true }, { isDelete: false });
            req.flash('success', 'Category restored successfully');
        } else {
            await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
            await Products.updateMany({ category_id: categoryId }, { isDelete: true });
            req.flash('success', 'Category deleted successfully');
        }

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
            .populate('category_id', 'category_name')
            .populate('brand_id', 'brand_name'); 

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
        const {
            product_name,
            product_description,
            product_highlights,
            category_id,
            brand_id,
            variant_count
        } = req.body;

        const images = req.files;
        console.log('req.body',req.body)
        console.log('req.files:', images);

        const variantDetails = [];


        console.log('variant count from body:', variant_count);
        for (let i = 0; i < variant_count; i++) {
            console.log('Processing variant:', i);

            const price = req.body.price[i];
            const storage_size = req.body.storage_size[i]; 
            const stock = req.body.stock[i]; 
            const color = req.body.color[i]; 

     
            if (price !== undefined) {

                const numericPrice = Number(price.split('').filter(val => !isNaN(val) && val !== ' ').join(''));

                const variantImages = [];

                if (images) {
                    images.forEach(image => {
                        if (image.fieldname.startsWith(`variant_images_${i + 1}`)) {
                            variantImages.push(image.path);
                        }
                    });
                }

                console.log('Variant images:', variantImages);

                variantDetails.push({
                    price: numericPrice,
                    storage_size,
                    stock: Number(stock),
                    color,
                    images: variantImages
                });
            } else {
                console.error(`Price for variant ${i} is undefined.`);
            }
        }

        const product = new Product({
            product_name,
            product_description,
            product_highlights,
            category_id,
            brand_id,
            variants: variantDetails
        });

        await product.save();
        console.log('Product saved:', product);

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error submitting product:', error);
        res.status(500).send('Error submitting product');
    }
};
exports.update_productPOST = async (req, res) => {
    try {
        const { id: product_id } = req.params;
        const {
            product_name,
            product_description,
            product_highlights,
            category_id,
            brand_id,
            variant_count,
            price,
            storage_size,
            stock,
            color
        } = req.body;

        const images = req.files;
        console.log('req.body', req.body);
        console.log('req.files:', images);

        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variantDetails = [];
        console.log('Total variants:', variant_count);

        for (let i = 0; i < variant_count; i++) {
            const variantImages = [];

            if (images && images.length > 0) {
                images.forEach(image => {
                    if (image.fieldname.startsWith(`variant_images_${i + 1}`)) {
                        variantImages.push(image.path); 
                    }
                });
            }

            if (variantImages.length === 0 && product.variants[i] && product.variants[i].images) {
                variantImages.push(...product.variants[i].images);
            }

            console.log(`Variant ${i + 1} images:`, variantImages);

            if (price[i]) {
                variantDetails.push({
                    _id: product.variants[i]?._id,
                    price: Number(price[i].replace(/,/g, '')),
                    storage_size: storage_size[i],
                    stock: Number(stock[i]),
                    color: color[i],
                    images: variantImages 
                });
            } else {
                console.error(`Price for variant ${i + 1} is undefined.`);
            }
        }


        await Product.findByIdAndUpdate(
            product_id,
            {
                product_name,
                product_description,
                product_highlights,
                category_id,
                brand_id,
                variants: variantDetails 
            },
            { new: true } 
        );

        return res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, message: 'Error updating product' });
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
        // res.json(product)
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
exports.orderGET = async (req, res) => {
    try {
      // Get the current page from the query, default to 1 if not provided
      const page = parseInt(req.query.page) || 1;
  
      // Set the limit for how many orders per page
      const limit = 5;
  
      // Calculate the number of documents to skip based on the current page
      const skip = (page - 1) * limit;
  
      // Fetch the total number of orders (for pagination calculation)
      const totalOrders = await Orders.countDocuments();
  
      // Fetch paginated orders with necessary population and skip/limit
      const orders = await Orders.find({})
        .populate('items.product')
        .populate('user')
        .populate('address')
        .skip(skip)
        .limit(limit);
  
      // Process the order history (same as before)
      const order_history = orders.map(order => {
        // Map through each order's items to retrieve specific variant details
        order.items = order.items.map(item => {
          const product = item.product;
          const specificVariant = product.variants.find(
            variant => variant._id.toString() === item.variantId.toString()
          );
  
          return {
            ...item,
            product: {
              ...product._doc,
              variants: specificVariant, // Only include the specific variant
            },
          };
        });
        return order;
      });
  
      // Calculate the total number of pages
      const totalPages = Math.ceil(totalOrders / limit);
  
      // Render the admin orders page with pagination data
      res.render('admin/orders', {
        order_history,
        title: 'Order Management',
        layout: 'layouts/adminLayout',
        currentPage: page,
        totalPages: totalPages,  // Send totalPages for pagination
      });
    } catch (error) {
      console.log('Error occurred while loading admin orders page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  
exports.update_order_statusPOST = async (req, res) => {
    try {
      const { orderId, status } = req.body;
  
      if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required.' });
      }

      const order = await Orders.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }
  
      const previousStatus = order.orderStatus;
  
      order.orderStatus = status;

      await order.save();
  
      res.status(200).json({ 
        message: `Order status updated from ${previousStatus} to ${status}.`, 
        previousStatus, 
        updatedStatus: status 
      });
  
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

  exports.couponGET = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupons', {coupons , title: 'Coupon Management', layout: 'layouts/adminLayout' });
    }catch(error){
        console.log('Error occurred while loading coupon page:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.add_couponPOST = async (req, res) => {
    try {
        const { couponCode, discount, startDate, expiryDate, minimumAmount, maximumAmount, description } = req.body; // Add maximumAmount

        const existingCoupon = await Coupon.findOne({ 
            coupon_code: { $regex: new RegExp(`^${couponCode}$`, 'i') } 
        });
        
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon with this code already exists.' });
        }

        const newCoupon = new Coupon({
            coupon_code: couponCode,
            discount,
            start_date: new Date(startDate),
            expiry_date: new Date(expiryDate),
            minimum_purchase_amount: minimumAmount,
            maximum_coupon_amount: maximumAmount,
            coupon_description: description
        });

        await newCoupon.save();

        res.status(201).json({ message: 'Coupon added successfully!' });
    } catch (err) {
        console.error('Error adding coupon:', err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

exports.offerAdminGET = async (req, res) => {
    try {
        const offers = await Offers.find();
        res.render('admin/offers', {offers , title: 'Offer Management', layout: 'layouts/adminLayout' });
    }catch(error){
        console.log('Error occurred while loading offer page:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}