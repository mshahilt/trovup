# Trovup
A full-featured E-commerce platform for tech gadgets built
with NodeJS as the backend, EJS as the templating engine, and MongoDB as the
database.
### Features includes:
In user side,
- Registration & verification
- Variants for products
- Product list with variants
- Cart
- Coupon
- Offer for specific products & categories
- Razorpay Integration
- Wishlist
- Wallet
- Order placement
- Repayment failed order
- Refferal bonus for new register
- Order history <br>

In admin side,

- Dashboard (Graph for sales with sorting)
- Category management
- Product management
- Brand management
- User management 
- Coupon management
- Offer management

### Tools and technologies used : 

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=for-the-badge&logo=bootstrap&logoColor=white)
![Chart.js](https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)

| Technology          | Description                                        |
|---------------------|----------------------------------------------------|
| Node JS, Express JS | For backend                                        |
| EJS                 | As view engine                                     |
| Mongoose            | Database library                                   |
| CSS and Bootstrap   | For styling                                        |
| Nodemailer          | For sending emails                                 |
| Bcrypt              | For password hashing                               |
| Multer              | For multiple file upload                           |
| JS-validation       | Form validation                                    |
| Razorpay            | For payment integration                            |
| Chart JS            | To make diagramatic <br>reports on admin dashboard |
| pdfkit              | Download pdf of sales report & invoice for orders  |

# Pages of my website:

## User side :
 
- ### **Homepage** <br>

   Home page is visible for every user entering into website. It contains the products and the features of the ecommerce platform/ when user signed in then it will be noted on navbar
   
   <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/home%20without%20login.png" width="500"> <br>
 
   **Navbar difference for logged in user and other users**
 
   <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/home%20with%20login.png" height="282">

 
 - ### **Register** <br>
 
   User can register by filling the validated form, and then have to verify registered by OTP which recieved on email.<br>
 
   <img src="https://github.com/mshahilt/utility/blob/main/register%20user.png" width="500"> <br>

- ### **Login** <br>
  
   User have to enter verified email and password to enter into shop. In case of forgot password, there is an option to set new password by matching OTP received to verified email. <br>
 
   <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/login%20user.png" width="500"> <br>
 
   **Forgot password** 
 
   <img width="500" src="https://github.com/mshahilt/utility/blob/main/forget%20password.png">

 - ### **Products** <br>
  
   It is the page that listing all products for user. User can click the button for view product, add to wishlist, or add to cart. <br>
 
   <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/products%20list%20page.png" width="500"> <br>


  - ### **Product details** <br>
  
    **view on single product**
    The page shows the detailed description of product with price and buttons for add to wishlist and add to cart.
  
    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/single%20product%20view.png" width="500"> <br>
 

     
  - ### **Cart** <br>

    User can add or remove products to cart for order placement and can change quantity of products according stocks available.

    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/cart.png" width="500"> <br>

  - ### **Wishlist** <br>
   
    User can add or remove products to wishlist for adding product to cart and can change quantity of products from cart according to stocks available.
    and can view by clicking the button 'Available coupons'.

    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/wishlist.png" width="500"> <br>
 
  - ### **Place order** <br>
   
    User can select or add address for delivery and choose payment method with applicable copons and then place the order. After successful order placement, An sweet alert is shown, if the payment fails then redirect to order details page of user to complete payment.
    
    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/place%20order.png" width="500"> <br>
    **Order success page**
   
     <img width="500" alt="ordr succs" src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/place%20order%20success.png">

    **Repayment order page**

    <img width="500" alt="ordr failed" src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/repayment.png">

  - ## **Order history** <br>
    User can see previous orders list and on clicking a particular order, the details of that order has shown like the image below. The cancellation of orders is based on order status and user can request return for delivered products, which admin can accept or decline later. <br>
    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/Order-History.png" width="500"> <br>
   

  - ## **Order Details** <br>
    User can see see the whole details of a perticular order, with options to cancel, return and option to download invoice for paid orders <br>

    <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/order%20details.png" width="500"> <br>



    
 ## Admin side :
 
  - ### **Login** <br>
  
     Admin can login by typing predefined email and password and enter to dashboard.

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20login.png" width="500"> <br>
      
  - ###  **Dashboard** <br>
  
     Dashboard includes counts of reports and diagramatic representaion of reports

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20dashboard.png" width="500"> <br>
     
  - ### **User management** <br>
  
     Admin can view user lists and block or unblock users

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20user.png" width="500"> <br>

  - ### **Category management** <br>
  
     Admin can view all categories, add new category, edit current categories, and remove unwanted categories.

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20categories.png" width="500"> <br>

  - ### **Brand management** <br>
  
     Admin can view all brand, add new brands, edit current brands and selling catogories, and remove unwanted brands 

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20brands.png" width="500"> <br>

  - ### **Product management** <br>
    
     Admin can view all products, add new items into categories, remove products and edit product details. There is an option in edit form to add multiple images of products and there is also a button for Add Variant for adding and 'X' for removing variants with multiple photos. <br>
   
     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20products.png" width="500"> <br>

    **Add product form**
 
     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20add%20new%20products.png" width="500"> <br>


    **Edit form for product**
 
     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20edit%20product.png" width="500"> <br>

 - ### **Order management** <br>
 
     Admin can view all orders and update order status and accept or decline return if any from this page.

     <img src="https://github.com/mshahilt/utility/blob/main/admin%20orders.png" width="500"> <br>

  - ### **Coupon management** <br>
  
     Admin can create discount coupons, remove old coupons or edit coupons from this page with start and expiry date

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20coupon.png" width="500"> <br>

- ### **Offer management** <br>

     Admin can add offer to product and cateogries simultaneously and remove offers accordingly.

     <img src="https://raw.githubusercontent.com/mshahilt/utility/refs/heads/main/admin%20offer.png" width="500"> <br>
