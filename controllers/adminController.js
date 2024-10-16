const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Category = require("../models/catogeryModel");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const flash = require("connect-flash");
const Products = require("../models/productModel");
const Orders = require("../models/orderModel");
const Coupon = require("../models/coupenModel");
const Offer = require("../models/offerModal");
const Order = require("../models/orderModel");
const restoreStock = require('../utility/restoreStock');
const refundToWallet = require('../utility/refundToWallet');
const ExcelJS = require('exceljs');

// Get All Users (Admin only)
exports.adminLoginGET = async (req, res) => {
  res.render("admin/login", {
    layout: "layouts/loginAndSignupLayout",
  });
};
exports.adminLoginPOST = async (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    try {
      // Check if email is valid
      if (!validateEmail(email)) {
        req.flash("error", "Invalid email format");
        return res.redirect("/admin/login");
      }

      // Find admin by email
      const admin = await User.findOne({ email, isAdmin: true });

      if (!admin) {
        req.flash("error", "Admin not found");
        return res.redirect("/admin/login");
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        req.flash("error", "Incorrect password or email");
        return res.redirect("/admin/login");
      }

      // Create session for admin
      req.session.admin = {
        id: admin._id,
        email: admin.email,
      };

      req.flash("success", "Logged in successfully");
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error(error);
      req.flash("error", "Internal server error");
      return res.redirect("/admin/login");
    }
  } else {
    req.flash("error", "Email and password are required");
    return res.redirect("/admin/login");
  }
};

// Function to validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const moment = require("moment");

// Get Admin Dashboard
exports.adminDashboardGET = async (req, res) => {
  try {
    const { sortStats, startDate, endDate, page = 1, limit = 6 } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
    } else if (sortStats) {
      const timeFrames = {
        week: moment().subtract(1, "week").toDate(),
        month: moment().subtract(1, "month").toDate(),
        year: moment().subtract(1, "year").toDate(),
        day: moment().subtract(1, "day").toDate(),
      };
      query.createdAt = { $gte: timeFrames[sortStats.toLowerCase()] || timeFrames["day"] };
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    const [totalOrdersCount, ordersForStats] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("user", "username")
        .populate("items.product", "name category brand"),
    ]);

    const totalSales = ordersForStats.reduce((sum, order) => sum + (order.payableAmount + order.deliveryCharge), 0);
    const totalDiscount = ordersForStats.reduce((sum, order) => sum + (order.discountAmount || 0), 0);

    const [totalUsers, totalProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalOrdersCount / limitInt);

    const [topProducts, topCategories, topBrands] = await Promise.all([
      getTopSellingProducts(),
      getTopSellingCategories(),
      getTopSellingBrands(),
    ]);

    res.render("admin/dashboard", {
      layout: "layouts/adminLayout",
      orders: ordersForStats.slice(skip, skip + limitInt),
      totalOrders: totalOrdersCount,
      totalSales,
      totalDiscount,
      totalUsers,
      totalProducts,
      currentPage: pageInt,
      totalPages,
      limit: limitInt,
      topProducts,
      topCategories,
      topBrands,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to get top-selling products
async function getTopSellingProducts() {
  return Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);
}

async function getTopSellingCategories() {
  return Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.category_id",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);
}

async function getTopSellingBrands() {
  return Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.brand_id",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);
}

// Fetch chart data
exports.getChartData = async (req, res) => {
  try {
    const { chart } = req.query;

    let query = {};
    let groupBy = { $dayOfWeek: "$createdAt" }; 
    switch (chart) {
      case "month":
        query.createdAt = { $gte: moment().subtract(1, "month").toDate() };
        groupBy = { $dayOfMonth: "$createdAt" }; 
        break;
      case "year":
        query.createdAt = { $gte: moment().subtract(1, "year").toDate() };
        groupBy = { $month: "$createdAt" }; 
        break;
      case "week":
      default:
        query.createdAt = { $gte: moment().subtract(1, "week").toDate() };
        groupBy = { $dayOfWeek: "$createdAt" };
        break;
    }

    const chartData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data: chartData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.render("admin/users", {
      users,
      title: "Users",
      layout: "layouts/adminLayout",
    });
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
      req.flash(
        "success",
        `User ${user.isBlock ? "blocked" : "unblocked"} successfully!`
      );
    } else {
      req.flash("error", "User not found!");
    }
    res.redirect("/admin/user"); // Redirect back to the user list page
  } catch (err) {
    req.flash("error", "Something went wrong!");
    res.redirect("/admin/user");
  }
};

// Admin categories GET
exports.adminCategoriesGET = async (req, res) => {
  const categories = await Category.find(); // Fetch categories from the database
  res.render("admin/catogories", {
    categories,
    title: "Categories",
    layout: "layouts/adminLayout",
  });
};
exports.adminAddcategoryPOST = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      req.flash("error", "Category name is required");
      return res.redirect("/admin/categories");
    }

    // Create a case-insensitive regex pattern for the category name
    const regexPattern = new RegExp(`^${categoryName.trim()}$`, "i");

    // Check if the category already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      category_name: { $regex: regexPattern },
    });
    if (existingCategory) {
      req.flash("error", "Category name already exists");
      return res.redirect("/admin/categories");
    }

    // Create a new category
    const newCategory = new Category({
      category_name: categoryName.trim(), // Store the category name as entered
    });

    await newCategory.save();

    req.flash("success", "Category added successfully");
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error adding category:", error);
    req.flash("error", "Server error. Please try again later.");
    res.redirect("/admin/categories");
  }
};

exports.edit_categoryGET = async (req, res) => {
  try {
    const categoryId = req.params.id; // Assuming the category ID is passed as a URL parameter named 'id'
    const category = await Category.findById(categoryId);

    if (!category) {
 
      return res.redirect("/admin/category-list"); // Redirect if the category is not found
    }

    res.render("admin/edit_categories", {
      // Updated to use the correct view path
      layout: "layouts/adminLayout", // Updated to use the correct layout path
      category,
    });
  } catch (error) {
    console.log(
      "An error occurred while loading the edit category page:",
      error
    );
    res.redirect("/admin/category-list"); // Redirect to a safe page on error
  }
};
exports.edit_categoryPOST = async (req, res) => {
  try {
    const { categoryId, new_category_name } = req.body;

    const categoryExists = await Category.findOne({
      category_name: { $regex: new RegExp(`^${new_category_name}$`, "i") }, 
      _id: { $ne: categoryId }
    });

    if (categoryExists) {

      req.flash("error", "A category with the same name already exists.");
      return res.redirect(`/admin/categories`); 
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId, 
      { category_name: new_category_name }
    );

    if (!updatedCategory) {
      req.flash("error", "Category not found.");
      return res.redirect("/admin/categories");
    }

    req.flash("success", "Category updated successfully.");
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("An error occurred while posting edit category:", error);
    req.flash("error", "An error occurred while updating the category.");
    res.redirect("/admin/categories"); // Redirect on error
  }
};

exports.delete_categoryPOST = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if (!category) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/categories");
    }

    if (category.isDeleted) {
      await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
      await Products.updateMany(
        { category_id: categoryId, isDelete: true },
        { isDelete: false }
      );
      req.flash("success", "Category restored successfully");
    } else {
      await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
      await Products.updateMany(
        { category_id: categoryId },
        { isDelete: true }
      );
      req.flash("success", "Category deleted successfully");
    }

    res.redirect("/admin/categories");
  } catch (error) {
    console.log("An error occurred while toggling the category status:", error);
    req.flash("error", "An error occurred while toggling the category status");
    res.redirect("/admin/categories");
  }
};

// Admin Products GET
exports.adminProductsGET = async (req, res) => {
  try {
    // Populate category_id and brand_id with the actual data
    const products = await Product.find()
      .populate("category_id", "category_name")
      .populate("brand_id", "brand_name");

    res.render("admin/products", {
      products,
      title: "Product",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.error("Error on viewing product:", error);
    req.flash("error", "Server error. Please try again later.");
    res.redirect("/admin/products");
  }
};

// admin add product GET
exports.add_productGET = async (req, res) => {
  try {
    const products = await Product.find();
    const categories = await Category.find();
    const brands = await Brand.find();
    res.render("admin/add_new_product", {
      products,
      categories,
      brands,
      title: "Product",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.error("Error on viewing product:", error);
    req.flash("error", "Server error. Please try again later.");
    res.redirect("/admin/add_new_product");
  }
};
exports.submit_productPOST = async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      product_highlights,
      category_id,
      brand_id,
      variant_count,
    } = req.body;

    const images = req.files;

    const variantDetails = [];


    for (let i = 0; i < variant_count; i++) {

      const price = req.body.price[i];
      const storage_size = req.body.storage_size[i];
      const stock = req.body.stock[i];
      const color = req.body.color[i];

      if (price !== undefined) {
        const numericPrice = Number(
          price
            .split("")
            .filter((val) => !isNaN(val) && val !== " ")
            .join("")
        );

        const variantImages = [];

        if (images) {
          images.forEach((image) => {
            if (image.fieldname.startsWith(`variant_images_${i + 1}`)) {
              variantImages.push(image.path);
            }
          });
        }


        variantDetails.push({
          price: numericPrice,
          storage_size,
          stock: Number(stock),
          color,
          images: variantImages,
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
      variants: variantDetails,
    });

    await product.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error submitting product:", error);
    res.status(500).send("Error submitting product");
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
      color,
    } = req.body;


    const images = req.files;

    let errors = [];

    if (!product_name || product_name.trim().length < 3) {
      errors.push("Product name must be at least 3 characters long.");
    }
    if (!product_description) {
      errors.push("Product description is required.");
    }
    price.forEach((p) => {
      if (!p || isNaN(p) || p <= 0) { 
        errors.push("All prices are required.")
      }
    })
    if (!category_id) {
      errors.push("Category ID is required.");
    }
    if (!brand_id) {
      errors.push("Brand ID is required.");
    }

    // Validate variants
    if (!variant_count || isNaN(variant_count) || variant_count <= 0) {
      errors.push("You must provide a valid number of variants.");
    }

    if (errors.length > 0) {
      req.flash("error", errors);
      return res.redirect(`/admin/edit-product/${product_id}`);
    }
    const product = await Product.findById(product_id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const variantDetails = [];

    for (let i = 0; i < variant_count; i++) {
      const variantImages = [];

      if (images && images.length > 0) {
        images.forEach((image) => {
          if (image.fieldname.startsWith(`variant_images_${i + 1}`)) {
            variantImages.push(image.path);
          }
        });
      }

      if (
        variantImages.length === 0 &&
        product.variants[i] &&
        product.variants[i].images
      ) {
        variantImages.push(...product.variants[i].images);
      }

      if (price[i]) {
        variantDetails.push({
          _id: product.variants[i]?._id,
          price: Number(price[i].replace(/,/g, "")),
          storage_size: storage_size[i],
          stock: Number(stock[i]),
          color: color[i],
          images: variantImages,
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
        variants: variantDetails,
      },
      { new: true }
    );

    return res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error updating product" });
  }
};

exports.edit_productGET = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Products.findById(id)
      .populate("category_id", "category_name")
      .populate("brand_id", "brand_name");

    const categories = await Category.find();
    const brands = await Brand.find();
    if (!product) {
      return res.status(404).send("Product not found");
    }
    // res.json(product)
    res.render("admin/edit_product", {
      product,
      brands,
      categories,
      title: "Edit product",
      layout: "layouts/adminLayout",
    });
  } catch (err) {
    console.log("Error occurred while loading edit product page", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.delete_productPOST = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product and populate related category and brand
    const product = await Products.findById(productId)
      .populate("category_id")
      .populate("brand_id");

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/admin/products");
    }

    if (product.isDelete) {
      // Check the related category and brand status
      const category = await Category.findById(product.category_id._id);
      const brand = await Brand.findById(product.brand_id._id);

      // Ensure category and brand exist before checking isDeleted status
      if (!category || !brand) {
        req.flash("error", "Related category or brand not found");
        return res.redirect("/admin/products");
      }

      // If either category or brand is deleted, restrict restoration
      if (category.isDeleted || brand.isDeleted) {
        req.flash(
          "error",
          "Cannot restore product because related category or brand is deleted"
        );
        return res.redirect("/admin/products");
      }

      // Restore the product
      await Products.findByIdAndUpdate(productId, { isDelete: false });
      req.flash("success", "Product restored successfully");
    } else {
      // Soft delete the product
      await Products.findByIdAndUpdate(productId, { isDelete: true });
      req.flash("success", "Product deleted successfully");
    }

    res.redirect("/admin/products");
  } catch (error) {
    console.log("An error occurred while toggling the product status:", error);
    req.flash("error", "An error occurred while toggling the product status");
    res.redirect("/admin/products");
  }
};

// Admin add brand GET
exports.adminBrandGET = async (req, res) => {
  try {
    // Fetch all categories that are not deleted
    const categories = await Category.find({ isDeleted: false });

    // Fetch brands and populate the categories field
    const brands = await Brand.find().populate({
      path: "categories",
      match: { isDeleted: false }, // Only include categories that are not deleted
    });

    // Render the template with the fetched data
    res.render("admin/brands", {
      brands,
      categories,
      title: "Product",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.error("Error on viewing brands:", error);
    req.flash("error", "Server error. Please try again later.");
    res.redirect("/admin/brands");
  }
};

exports.adminAddBrandPOST = async (req, res) => {
  const { categories, brandName } = req.body;

  try {
    // Check if both categories and brandName are provided
    if (!categories || !brandName) {
      req.flash("error", "Both category and brand name are required");
      return res.redirect("/admin/brand");
    }

    // Check if the brand already exists
    const existingBrand = await Brand.findOne({ brand_name: brandName });
    if (existingBrand) {
      req.flash("error", "Brand name already exists");
      return res.redirect("/admin/brand");
    }

    // Create a new brand instance
    const newBrand = new Brand({
      brand_name: brandName,
      categories: categories,
    });

    // Save the brand to the database
    await newBrand.save();

    // Flash a success message and redirect to the brand page
    req.flash("success", "Brand added successfully");
    res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error adding brand:", error);
    req.flash("error", "Server error. Please try again later.");
    res.redirect("/admin/brands");
  }
};

exports.edit_brandGET = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).populate(
      "categories",
      "category_name"
    );
    const categories = await Category.find();
    res.render("admin/edit_brand", {
      brand,
      categories,
      title: "Edit Brand",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.log(
      "An error occurred while rendering the edit brand page:",
      error
    );
    res.status(500).send("Internal Server Error");
  }
};
exports.edit_brandPOST = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_name, categories } = req.body;

    const brandExists = await Brand.findOne({ 
      brand_name: brand_name, 
      _id: { $ne: id } 
    });

    if (brandExists) {
      req.flash("error", "A brand with the same name already exists.");
      return res.redirect(`/admin/brands}`); 
    }

    await Brand.findByIdAndUpdate(id, {
      brand_name,
      categories,
    });

    req.flash("success", "Brand updated successfully");
    res.redirect("/admin/brands");
  } catch (error) {
    console.log("An error occurred while updating the brand:", error);
    req.flash("error", "An error occurred while updating the brand");
    res.redirect("/admin/brands");
  }
};

exports.delete_brandPOST = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findById(brandId);

    if (!brand) {
      req.flash("error", "Brand not found");
      return res.redirect("/admin/brands");
    }

    if (brand.isDeleted) {
      // Restore the brand and related products
      await Brand.findByIdAndUpdate(brandId, { isDeleted: false });
      await Products.updateMany(
        { brand_id: brandId, isDelete: true },
        { isDelete: false }
      );
      req.flash("success", "Brand restored successfully");
    } else {
      // Soft delete the brand and related products
      await Brand.findByIdAndUpdate(brandId, { isDeleted: true });
      await Products.updateMany({ brand_id: brandId }, { isDelete: true });
      req.flash("success", "Brand deleted successfully");
    }

    // Redirect to the brands list
    res.redirect("/admin/brands");
  } catch (error) {
    console.log("An error occurred while toggling the brand status:", error);
    req.flash("error", "An error occurred while toggling the brand status");
    res.redirect("/admin/brands");
  }
};

// Delete User (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
};
exports.orderGET = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 5;

    const skip = (page - 1) * limit;

    const totalOrders = await Orders.countDocuments();
    const orders = await Orders.find({})
      .populate("items.product")
      .populate("user")
      .populate("address")
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit);

    const order_history = orders.map((order) => {
      order.items = order.items.map((item) => {
        const product = item.product;
        const specificVariant = product.variants.find(
          (variant) => variant._id.toString() === item.variantId.toString()
        );

        return {
          ...item,
          product: {
            ...product._doc,
            variants: specificVariant,
          },
        };
      });
      return order;
    });

    const totalPages = Math.ceil(totalOrders / limit);
    res.render("admin/orders", {
      order_history,
      title: "Order Management",
      layout: "layouts/adminLayout",
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log("Error occurred while loading admin orders page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.update_order_statusPOST = async (req, res) => {
  try {

    const { itemId, status } = req.body;

    const order = await Orders.findOne({ "items._id": itemId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    if (item.orderStatus === "Delivered" && status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot cancel an item that has already been delivered." });
    }

    if (status === "Cancelled") {
      const stockRestored = await restoreStock(item);
      if (!stockRestored) {
        return res.status(500).json({ success: false, message: "Failed to restore stock." });
      }

      if(order.paymentStatus === "Paid") {
        const amount = item.price - item.discount;
        const refundSuccessful = await refundToWallet(order.user, amount, status);
        if (!refundSuccessful) {
          return res.status(500).json({ success: false, message: "Failed to refund to wallet." });
        } 
      }
    }

    if(status === "Delivered"){
      order.paymentStatus = 'Paid';
    }

    item.orderStatus = status;
    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated successfully." });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};



exports.couponGET = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("admin/coupons", {
      coupons,
      title: "Coupon Management",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.log("Error occurred while loading coupon page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.add_couponPOST = async (req, res) => {
  try {
    const {
      couponCode,
      discount,
      startDate,
      expiryDate,
      minimumAmount,
      maximumAmount,
      description,
    } = req.body; // Add maximumAmount

    const existingCoupon = await Coupon.findOne({
      coupon_code: { $regex: new RegExp(`^${couponCode}$`, "i") },
    });

    if (existingCoupon) {
      return res
        .status(400)
        .json({ message: "Coupon with this code already exists." });
    }

    const newCoupon = new Coupon({
      coupon_code: couponCode,
      discount,
      start_date: new Date(startDate),
      expiry_date: new Date(expiryDate),
      minimum_purchase_amount: minimumAmount,
      maximum_coupon_amount: maximumAmount,
      coupon_description: description,
    });

    await newCoupon.save();

    res.status(201).json({ message: "Coupon added successfully!" });
  } catch (err) {
    console.error("Error adding coupon:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
exports.edit_couponPOST = async (req, res) => {
  try {
    const { id } = req.params; // Get coupon ID from the request parameters
    const {
      couponCode,
      discount,
      startDate,
      expiryDate,
      minimumAmount,
      maximumAmount,
      coupon_description,
    } = req.body;

    // Find the coupon by ID
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    // Update the coupon details
    existingCoupon.coupon_code = couponCode;
    existingCoupon.discount = discount;
    existingCoupon.start_date = new Date(startDate);
    existingCoupon.expiry_date = new Date(expiryDate);
    existingCoupon.minimum_purchase_amount = minimumAmount;
    existingCoupon.maximum_coupon_amount = maximumAmount;
    existingCoupon.coupon_description = coupon_description;

    // Save the updated coupon
    await existingCoupon.save();

    res.status(200).json({ message: "Coupon updated successfully!" });
  } catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.delete_couponPOST = async (req, res) => {
  try {
    const couponId = req.params.id;
    await Coupon.findByIdAndDelete(couponId);
    res.status(200).json({ message: "Coupon deleted successfully!" });
  }catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}
exports.offerAdminGET = async (req, res) => {
  try {
    const offerData = await Offer.find();
    const productData = await Product.aggregate([
      {
        $unwind: "$variants",
      },
      {
        $lookup: {
          from: "offers",
          localField: "variants.offer",
          foreignField: "_id",
          as: "variants.offer",
        },
      },
      {
        $unwind: {
          path: "$variants.offer",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    //   res.json({productData});

    const categoryData = await Category.find().populate("offer");
    const referralData = [""];
    offerData ? offerData : [];
    productData ? productData : [];
    categoryData ? categoryData : [];
    res.render("admin/offers", {
      offerData,
      productData,
      referralData,
      categoryData,
      title: "Offer Management",
      layout: "layouts/adminLayout",
    });
  } catch (error) {
    console.log("Error occurred while loading offer page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.addOfferPOST = async (req, res) => {
  try {
    const { offerName, offerPercentage, offerStartDate, offerEndDate } =
      req.body;
    const newOffer = new Offer({
      offer_name: offerName,
      offer_percentage: offerPercentage,
      offer_start_date: new Date(offerStartDate),
      offer_end_date: new Date(offerEndDate),
    });

    await newOffer.save();
    req.flash("success", "new offer added successfully");
    res.redirect("/admin/offers");
  } catch (error) {
    console.log("Error occurred while adding offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.updateOfferPOST = async (req, res) => {
  try {
    const { productId, offerId, variantId } = req.body;

    const productData = await Product.findOne({
      _id: productId,
      "variants._id": variantId,
    });

    const offerData = await Offer.findOne({ _id: offerId });

    if (!productData || !offerData) {
      return res.status(404).json({ error: "Product or offer not found" });
    }

    const variant = productData.variants.id(variantId);

    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }
    const discountPrice =
      variant.price - (variant.price * offerData.offer_percentage) / 100;

    variant.discount_price = discountPrice;
    variant.offer = offerId;

    await productData.save();

    res.json({
      success: true,
      message: "Offer added successfully to the variant",
    });
  } catch (error) {
    console.log("Error occurred while updating offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.updateCategoryOfferPOST = async (req, res) => {
  try {
    const { categoryId, offerId } = req.body;

    const categoryOffer = await Offer.findById(offerId);
    if (!categoryOffer) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No category offer found with the provided ID.",
        });
    }

    const products = await Products.find({ category_id: categoryId }).populate(
      "variants.offer"
    );

    if (products.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No products found in this category.",
        });
    }

    // Apply offer to products
    for (let product of products) {
      let hasChanges = false;

      for (let variant of product.variants) {
        let bestOffer = null;

        if (categoryOffer && !categoryOffer.is_delete) {
          bestOffer = {
            percentage: categoryOffer.offer_percentage,
            type: "category",
          };
        }

        // Check product-specific offer
        if (variant.offer) {
          const productOffer = variant.offer;
          if (
            !productOffer.is_delete &&
            productOffer.offer_percentage >
              (bestOffer ? bestOffer.percentage : 0)
          ) {
            bestOffer = {
              percentage: productOffer.offer_percentage,
              type: "product",
            };
          }
        }

        if (bestOffer) {
          const discountPrice =
            variant.price - (variant.price * bestOffer.percentage) / 100;
          if (
            variant.discount_price !== discountPrice ||
            variant.offer !==
              (bestOffer.type === "category"
                ? categoryOffer._id
                : variant.offer)
          ) {
            variant.discount_price = discountPrice;
            variant.offer =
              bestOffer.type === "category" ? categoryOffer._id : variant.offer;
            hasChanges = true;
          }
        } else {
          variant.offer = null;
          variant.discount_price = 0;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await product.save();
      }
    }

    // After updating the products, update the category to save the offerId
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    category.offer = offerId; // Save the offerId in the category
    await category.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Offers updated successfully and saved to category.",
        products,
      });
  } catch (error) {
    console.error("Error updating offers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating offers." });
  }
};

exports.deleteOfferPOST = async (req, res) => {
  try {
    const offerId = req.params.id;
    await Offer.findByIdAndDelete(offerId)
    res.status(200).json({ message: "Coupon deleted successfully!" });
  }catch(error){
    console.error("Error occurred while accepting the return request", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
exports.accept_return_requestPOST = async (req, res) => {
  try {
    const { itemId, orderId } = req.body;

    const order = await Orders.findOne({ orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    let wallet = await Wallet.findOne({ user: order.user });
    if (!wallet) {
      wallet = new Wallet({
        user: order.user,
        balance: 0,
        wallet_history: []
      });
    }

    const item = order.items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in the order" });
    }

    if (!item.isReturnRequested) {
      return res.status(400).json({
        success: false,
        message: "Return request has not been made for this item",
      });
    }

    item.isAdminAcceptedReturn = "Accepted";

    const refundAmount = (item.price - item.discount )* item.quantity;
    wallet.balance += refundAmount;

    wallet.wallet_history.push({
      date: new Date(),
      amount: refundAmount,
      description: `Refund for returned item on an item on ${orderId}`,
      transactionType: 'credited'
    });


    await order.save();
    await wallet.save();

    return res.status(200).json({
      success: true,
      message: "Return request accepted and funds added to the wallet",
      order,
      wallet,
    });
  } catch (error) {
    console.error("Error occurred while accepting the return request", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.decline_return_requestPOST = async (req, res) => {
  const { itemId, orderId } = req.body;

  const order = await Orders.findOne({ orderId });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const item = order.items.find((item) => item._id.toString() === itemId);

  if (!item) {
    return res
      .status(404)
      .json({ success: false, message: "Item not found in the order" });
  }
  if (!item.isReturnRequested) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Return request has not been made for this item",
      });
  }

  item.isAdminAcceptedReturn = "Rejected";

  await order.save();

  return res
    .status(200)
    .json({
      success: true,
      message: "Return request Rejected successfully",
      order,
    });
};

const PDFDocument = require('pdfkit');
const Wallet = require("../models/walletModel");

exports.downloadSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = moment(startDate).startOf("day").toDate();
      }
      if (endDate) {
        query.createdAt.$lte = moment(endDate).endOf("day").toDate();
      }
    }

    const orders = await Order.find(query)
      .populate("user", "username")
      .populate({
        path: "items.product",
        select: "product_name variants",
      })
      .exec();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found for the selected date range." });
    }

    let totalPayableAmount = 0;

    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(16).text("Sales Report", { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(12).text(`Report Generated On: ${moment().format("MMMM Do YYYY")}`, { align: 'left' });
    doc.text(`Report Date from: ${moment(startDate).format("MMMM Do YYYY")} to ${moment(endDate).format("MMMM Do YYYY")}`, { align: 'left' });
    doc.moveDown(1.5);
    const drawTableHeaders = (headers, y) => {
      doc.font('Helvetica-Bold').fontSize(11);
      let x = doc.page.margins.left;

      headers.forEach(header => {
        doc.text(header.text, x + 5, y + 5, { width: header.width, align: header.align || 'left' });
        doc.rect(x, y, header.width, 20).stroke();
        x += header.width;
      });
    };
    const drawTableRow = (row, y) => {
      doc.font('Helvetica').fontSize(10);
      let x = doc.page.margins.left;

      row.forEach(cell => {
        doc.text(cell.text, x + 5, y + 5, { width: cell.width, align: cell.align || 'left' });
        doc.rect(x, y, cell.width, 20).stroke(); 
        x += cell.width;
      });
    };
    const headers = [
      { text: "Order ID", width: 80 },
      { text: "Date", width: 70 },
      { text: "Delivery Charge", width: 100 },
      { text: "Total Amount", width: 100 },
      { text: "Status", width: 80 },
      { text: "User", width: 100 }
    ];
    drawTableHeaders(headers, doc.y);

    let y = doc.y + 20; 

    orders.forEach(order => {
      totalPayableAmount += (order.payableAmount || 0) + (order.deliveryCharge || 0);

      const orderRow = [
        { text: order.orderId, width: 80 },
        { text: new Date(order.placedAt).toLocaleDateString(), width: 70 },
        { text: `${order.deliveryCharge.toFixed(2)}`, width: 100 }, 
        { text: `${(order.totalAmount + order.deliveryCharge).toFixed(2)}`, width: 100 },
        { text: order.paymentStatus, width: 80 },
        { text: order.user ? order.user.username : "N/A", width: 100 }
      ];
      drawTableRow(orderRow, y);
      y += 20;

      const nestedHeaders = [
        { text: "Product", width: 120 },
        { text: "Variant", width: 80 },
        { text: "Quantity", width: 70 },
        { text: "Price", width: 80 },
        { text: "Discount", width: 80 },
        { text: "Net Price", width: 100 }
      ];
      drawTableHeaders(nestedHeaders, y);
      y += 20;

      order.items.forEach(item => {
        const netPrice = (item.price - item.discount) * item.quantity;
        const variant = item.product.variants.find(v => v._id.toString() === item.variantId);
        const color = variant ? variant.color : "N/A";

        const itemRow = [
          { text: item.product.product_name, width: 120 },
          { text: color, width: 80 },
          { text: item.quantity, width: 70 },
          { text: `${item.price.toFixed(2)}`, width: 80 },
          { text: `${item.discount.toFixed(2)}`, width: 80 },
          { text: `${netPrice.toFixed(2)}`, width: 100 }
        ];
        drawTableRow(itemRow, y);
        y += 20;
      });

      y += 20;

      if (y > doc.page.height - doc.page.margins.bottom - 100) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    });

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(14).text(`Total Payable Amount: ${totalPayableAmount.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ error: "An error occurred while generating the sales report" });
  }
};


exports.downloadSalesReportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Prepare the query to fetch orders
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        query.createdAt.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    const orders = await Order.find(query)
      .populate("user", "username")
      .populate({
        path: "items.product",
        select: "product_name variants",
      })
      .exec();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found for the selected date range." });
    }

    // Create a new Excel workbook and a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add title and header information
    worksheet.mergeCells('A1', 'F1');
    worksheet.getCell('A1').value = 'Sales Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.getCell('A3').value = `Report Generated On: ${moment().format("MMMM Do YYYY")}`;
    worksheet.getCell('A4').value = `Report Date from: ${moment(startDate).format("MMMM Do YYYY")} to ${moment(endDate).format("MMMM Do YYYY")}`;

    // Define headers for the sales report
    worksheet.addRow([]);
    worksheet.addRow(["Order ID", "Date", "Delivery Charge", "Total Amount", "Status", "User"]);

    let totalPayableAmount = 0;

    orders.forEach(order => {
      totalPayableAmount += (order.payableAmount || 0) + (order.deliveryCharge || 0);

      worksheet.addRow([
        order.orderId,
        moment(order.placedAt).format("YYYY-MM-DD"),
        order.deliveryCharge ? order.deliveryCharge.toFixed(2) : 0,
        (order.totalAmount + order.deliveryCharge).toFixed(2),
        order.paymentStatus,
        order.user ? order.user.username : "N/A"
      ]);

      // Add product details for each order item
      worksheet.addRow(['Product', 'Variant', 'Quantity', 'Price', 'Discount', 'Net Price']);

      order.items.forEach(item => {
        const variant = item.product.variants.find(v => v._id.toString() === item.variantId);
        const color = variant ? variant.color : "N/A";
        const netPrice = (item.price - item.discount) * item.quantity;

        worksheet.addRow([
          item.product.product_name,
          color,
          item.quantity,
          item.price.toFixed(2),
          item.discount.toFixed(2),
          netPrice.toFixed(2),
        ]);
      });

      worksheet.addRow([]); // Blank row between orders
    });

    worksheet.addRow([]);
    worksheet.addRow([`Total Payable Amount:`, '', '', '', '', totalPayableAmount.toFixed(2)]);
    worksheet.getRow(worksheet.lastRow.number).font = { bold: true };

    // Write the Excel file and send it as a response
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=sales_report_${startDate}_to_${endDate}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating sales report (Excel):", error);
    res.status(500).json({ error: "An error occurred while generating the sales report in Excel" });
  }
};