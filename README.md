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
 
   <img width="500" src="https://private-user-images.githubusercontent.com/145194767/376303465-384018f3-0f36-4217-a3ec-750214eed63b.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDY1LTM4NDAxOGYzLTBmMzYtNDIxNy1hM2VjLTc1MDIxNGVlZDYzYi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iYjJiYmY4MDA3Y2QwZjhhNWU0M2VkMGRlMTY3YzJhZjU1MmNiNThkZDA5ZTJjMzExNzdlM2VhZTljZjFlNTc0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.90OmaKWE4UU-Jlz28mXB6aBI_iAKHhh943Z54kE0xtU">

 - ### **Products** <br>
  
   It is the page that listing all products for user. User can click the button for view product, add to wishlist, or add to cart. <br>
 
   <img src="https://private-user-images.githubusercontent.com/145194767/376303559-0e88fb67-e389-4e59-b4b7-8123dd3ff713.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MTk4MzUsIm5iZiI6MTcyODkxOTUzNSwicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTU5LTBlODhmYjY3LWUzODktNGU1OS1iNGI3LTgxMjNkZDNmZjcxMy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTI1MzVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02N2ZlNmVjNzkzMDI4MGRkNTY3M2I1NWY4N2M4YjVjMTBlN2Q1NWM4YTRlYTI5MTFmNjQyOGQ2NGFlNGJjODAxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.yW_O8y_dXPXYGpDG-qmvnvkCzcTRv00HYGPCBX1C_ts" width="500"> <br>


  - ### **Product details** <br>
  
    **view on single product**
    The page shows the detailed description of product with price and buttons for add to wishlist and add to cart.
  
    <img src="https://private-user-images.githubusercontent.com/145194767/376303590-886b0216-c424-4135-9cef-6878b680424a.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTkwLTg4NmIwMjE2LWM0MjQtNDEzNS05Y2VmLTY4NzhiNjgwNDI0YS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00NmJlOTUyMWZmNjI5MjIwMzUyZjI4ODU0YTBhMDRiOTVjZDg0MzVkODUwZTEyOWEyMzk0MmRmOWZkZDgyZGM2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.3-YYwVqnI7WetBEWJELfTgVcZ80EbAX6IgcVJSafepc" width="500"> <br>
 

     
  - ### **Cart** <br>

    User can add or remove products to cart for order placement and can change quantity of products according stocks available.

    <img src="https://private-user-images.githubusercontent.com/145194767/376303457-bae8136a-8d30-4be9-a602-abfcab342183.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDU3LWJhZTgxMzZhLThkMzAtNGJlOS1hNjAyLWFiZmNhYjM0MjE4My5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03ODFmNDFiZWZhMmJiMWQ3NmUxNmI0NDg4YzYzMDMwOGM4NzZlY2IxN2VlNGY1NjlkNDcxNWFiMWJlN2RmYjA2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.BtCQyiLo4tjMs8828em8x7v9AMaHvJ0TEIUhHJpKMvk" width="500"> <br>

  - ### **Wishlist** <br>
   
    User can add or remove products to wishlist for adding product to cart and can change quantity of products from cart according to stocks available.
    and can view by clicking the button 'Available coupons'.

    <img src="https://private-user-images.githubusercontent.com/145194767/376303600-47a15a25-615d-4ce8-9441-92cd0609927e.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNjAwLTQ3YTE1YTI1LTYxNWQtNGNlOC05NDQxLTkyY2QwNjA5OTI3ZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02NzdjY2MyZDMwMGE1N2RiZGQxNmRjMjIwNWQxZTA1MTJjMmQzMmU3MTAzYTU2NDdjNzRiNGViNzc5ZTgzMGJjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Qn9U704CE3tcgz_D2zbFUFSAZHyScnkGoSYxaA0PPZg" width="500"> <br>
 
  - ### **Place order** <br>
   
    User can select or add address for delivery and choose payment method with applicable copons and then place the order. After successful order placement, An sweet alert is shown, if the payment fails then redirect to order details page of user to complete payment.
    
    <img src="https://private-user-images.githubusercontent.com/145194767/376303546-da4cb5e6-1961-4c20-afab-d550733c7619.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTQ2LWRhNGNiNWU2LTE5NjEtNGMyMC1hZmFiLWQ1NTA3MzNjNzYxOS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00M2Q4ODg3MjQzZGUwNjQyNjI2YmY5ZDA5MmQ4MTg5MjUzZjJiZjAxZmQ1OWU2Y2ExMzVmOWVjMzIyNGVlNTk0JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.W3LyD-dYJ95c78Fbbp_BE9lN8s6cSfclKsnL00fSTX4" width="500"> <br>
    **Order success page**
   
     <img width="500" alt="ordr succs" src="https://private-user-images.githubusercontent.com/145194767/376303540-abce1f3b-e99d-4cdc-a3c8-f5c3205ec5a3.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTQwLWFiY2UxZjNiLWU5OWQtNGNkYy1hM2M4LWY1YzMyMDVlYzVhMy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04ODg5MjE2OTYwMzRkNzYyNzM0ZGE4N2E5ZTcyMGZkZWFiY2ZlZTI3NDUxZDdmNWVlYmU3M2Q0NTkyM2FjMGNkJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.APpmDupQn0Mv6NZ-6wpwlEZKBP8D2rD_gia1BpdqIR4">

    **Repayment order page**

    <img width="500" alt="ordr failed" src="https://private-user-images.githubusercontent.com/145194767/376303579-eaecceb4-efad-40b8-901d-7126509ce5c7.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTc5LWVhZWNjZWI0LWVmYWQtNDBiOC05MDFkLTcxMjY1MDljZTVjNy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03NjBiYTM5NjE5ZTA5YWY4YTgxODQ3NWUwODgyYjMzODQ3MTI5ZWUxZjM0MjhlNGZmZjNmNjMyZjlhMTI0NWU5JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Gkt0gl0XHjAQgH7KlTRBZkKlohUAcpm4nLOK8KN02BA">

  - ## **Order history** <br>
    User can see previous orders list and on clicking a particular order, the details of that order has shown like the image below. The cancellation of orders is based on order status and user can request return for delivered products, which admin can accept or decline later. <br>
    <img src="https://private-user-images.githubusercontent.com/145194767/376303534-e05533df-330b-4be3-b467-16e9c3da027a.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTM0LWUwNTUzM2RmLTMzMGItNGJlMy1iNDY3LTE2ZTljM2RhMDI3YS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zMzM3ZmY2MTFmOTg3MmQ1NjcyNWEzMzczYWY0ZmEyY2RlZGI2MTI1NWY2Y2FkMTYyZDY3ZDMzZjI5MTdlZjQzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.1B2IVBCOiy_P7i_EsNnIh4MJvm17cd6ieOKbDPO3fU0" width="500"> <br>
   

  - ## **Order Details** <br>
    User can see see the whole details of a perticular order, with options to cancel, return and option to download invoice for paid orders <br>

    <img src="https://private-user-images.githubusercontent.com/145194767/376303528-559fc72b-95fb-4c6b-b9cb-36be7da7f4a3.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNTI4LTU1OWZjNzJiLTk1ZmItNGM2Yi1iOWNiLTM2YmU3ZGE3ZjRhMy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02MGUxZGE1MjQ3NDAyNTgwMTgzN2Q0MmNjNzg3NjkyYzlkY2E4MGZhODlhZmFlNGRmZmEwOGQ4MDk2MTY1MWZmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.OZPcgFb-1BduIdEveJVkAsY8dXyfQsdcv1QVlHoppPw" width="500"> <br>



    
 ## Admin side :
 
  - ### **Login** <br>
  
     Admin can login by typing predefined email and password and enter to dashboard.

     <img src="https://private-user-images.githubusercontent.com/145194767/376303421-851928ed-3820-4a0b-a5b4-6efe724bbdca.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDIxLTg1MTkyOGVkLTM4MjAtNGEwYi1hNWI0LTZlZmU3MjRiYmRjYS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zNjliYjIzZTlmMmE1YjRkM2RjMWZhZDM4MDA1YzdmMDRmNjc0NmQ4NjIwNDljYjhmYWM2ODA3ZWI2YWUxNmM2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.2d5rL6UlHvReBBhIhUBeTOpV3wF267FUkBEKB3lGmBg" width="500"> <br>
      
  - ###  **Dashboard** <br>
  
     Dashboard includes counts of reports and diagramatic representaion of reports

     <img src="https://private-user-images.githubusercontent.com/145194767/376303411-a9dc661b-86cb-4e67-b134-36b17383b5b9.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDExLWE5ZGM2NjFiLTg2Y2ItNGU2Ny1iMTM0LTM2YjE3MzgzYjViOS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MWM2ZmZmMjRiNjAwNTY4NGY2MTYwZDU4MWVkMGU1OGE3OTc5MDI2Njg5NTk2MmFlNmE3ZDM3YThkYTAxYjkzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.yK_l_NuUnlTVw3aBCriM7EN_7xaLXMUMqw2BFmypWLo" width="500"> <br>
     
  - ### **User management** <br>
  
     Admin can view user lists and block or unblock users

     <img src="https://private-user-images.githubusercontent.com/145194767/376303448-35a92770-efcb-457a-96f7-0aa970f07cb2.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDQ4LTM1YTkyNzcwLWVmY2ItNDU3YS05NmY3LTBhYTk3MGYwN2NiMi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1mY2UzMmFhMjgzZjY2Y2IwYTY0Zjc5MDQwMzEyMDEzMWE1NjRmNzA2YzUzZWVjNDQzZmNlYTM1YTdlNTk3ZjIzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.GvQRHjs8UaP0D1zWQtMxUB07V4hiDkQ1x-ufP3_kUwE" width="500"> <br>

  - ### **Category management** <br>
  
     Admin can view all categories, add new category, edit current categories, and remove unwanted categories.

     <img src="https://private-user-images.githubusercontent.com/145194767/376303399-8238c9b3-d981-45e0-af06-04358c987b86.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzMzk5LTgyMzhjOWIzLWQ5ODEtNDVlMC1hZjA2LTA0MzU4Yzk4N2I4Ni5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1jMTU4NmJkNGJmYTA4MTU1NTkyZTE0NDgwZGVhYTlkODQ2NzQ4NTk3NDllYjhlODFmMDM3OGY4Mzc5YTA1Nzc4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.EPHyKRWZLUcc0BEMnI1MvNwmYSd4NsXGhL_Oj3dY8SY" width="500"> <br>

  - ### **Brand management** <br>
  
     Admin can view all brand, add new brands, edit current brands and selling catogories, and remove unwanted brands 

     <img src="https://private-user-images.githubusercontent.com/145194767/376303394-3b778707-dc64-4e0c-92a4-85292859d175.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzMzk0LTNiNzc4NzA3LWRjNjQtNGUwYy05MmE0LTg1MjkyODU5ZDE3NS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04MjZjODFlM2I0YjljMzYwNTM1NmU2YzJkMjg1NzkzZmE1NzM3NmU2NjRlMGExOGFiMTBmZTQyNjk3NGM4MThhJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.MSmQBUVsxamwWxKKyf1gHv2bNzb0T4G3NZHUaTZXdtw" width="500"> <br>

  - ### **Product management** <br>
    
     Admin can view all products, add new items into categories, remove products and edit product details. There is an option in edit form to add multiple images of products and there is also a button for Add Variant for adding and 'X' for removing variants with multiple photos. <br>
   
     <img src="https://private-user-images.githubusercontent.com/145194767/376303439-dae3a5da-c7cc-49f7-ac15-37dcb952de51.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDM5LWRhZTNhNWRhLWM3Y2MtNDlmNy1hYzE1LTM3ZGNiOTUyZGU1MS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hNzQxYTRmZTI2Mzg2ZDQ1OGJhZDdjYTZhMGQ1ZmQ5MzNmMDBlZmYwNjE1NzdiMjY3ODY1ODE2YzZkOTQ0MDUyJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.RJXi1DVGzfeh4JNIfXrmC_2NOorauqLoxzVXPLU2biA" width="500"> <br>

    **Add product form**
 
     <img src="https://private-user-images.githubusercontent.com/145194767/376303383-65fb202f-7d3f-4e50-843e-7bdc9989dbe4.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzMzgzLTY1ZmIyMDJmLTdkM2YtNGU1MC04NDNlLTdiZGM5OTg5ZGJlNC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02N2Y0OGQ5MzBkYzExZWMxYTQxYWI2ZDY1MzhlNmUwMDMwZGNmNmZkMzk5YmRiNzFhNmE2NmI2MjhlZmFjYmE2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Dy-_73x4-u8F6kB8E1X7r8kKeYVvHLRhgHSDL1Q8FeI" width="500"> <br>


    **Edit form for product**
 
     <img src="https://private-user-images.githubusercontent.com/145194767/376313901-6a087910-e197-4ea3-ac1b-73c096b19840.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjE4NDMsIm5iZiI6MTcyODkyMTU0MywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzEzOTAxLTZhMDg3OTEwLWUxOTctNGVhMy1hYzFiLTczYzA5NmIxOTg0MC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTU5MDNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0yNWVjODZmNjQyMWJjOGM2YjljZDgwYWE2M2M1ZmZjNzkzOTJiYjFkMzBiZGMyMWJhNjUxYTVhOWFkZDg3MmMxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.zxyVoA2fQhqvcg7VdK7haVesj7HxmWeo1pAcyOVJ6Ls" width="500"> <br>

 - ### **Order management** <br>
 
     Admin can view all orders and update order status and accept or decline return if any from this page.

     <img src="https://private-user-images.githubusercontent.com/145194767/376303431-8e89e2bc-fc66-4c6c-96d3-67e14629b1eb.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDMxLThlODllMmJjLWZjNjYtNGM2Yy05NmQzLTY3ZTE0NjI5YjFlYi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03MDMxOTI5Mzg5YzI5YmU2ZTRkODBhMGNiZDg1ZWJlZjdiNDc0NGUyMzdjMTEzZGNkYzkzMmNiYWNkZTE4ZjNiJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.5UlJj1h854lpL89HNMxezcsmnZSX6rVqEFYZ_I6Xkp4" width="500"> <br>

  - ### **Coupon management** <br>
  
     Admin can create discount coupons, remove old coupons or edit coupons from this page with start and expiry date

     <img src="https://private-user-images.githubusercontent.com/145194767/376303406-fa0d1e9e-e15f-4fa7-8591-7c660d7c1f90.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDA2LWZhMGQxZTllLWUxNWYtNGZhNy04NTkxLTdjNjYwZDdjMWY5MC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT01ZjQyYWM0ODZkNzJmZWNlMmM4YzViNzljM2VhNmRkZDJjZTgwNDVmZjRhMmE0MGJjMDgwOWZhM2NjMTNmOTRhJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.4RAXKq9SgMwU6nbv2eEYYVexTFCppLFW8DuVyJgRHDY" width="500"> <br>

- ### **Offer management** <br>

     Admin can add offer to product and cateogries simultaneously and remove offers accordingly.

     <img src="https://private-user-images.githubusercontent.com/145194767/376303426-ea001836-c896-48f5-bb18-24cf6bb99472.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjg5MjAxOTcsIm5iZiI6MTcyODkxOTg5NywicGF0aCI6Ii8xNDUxOTQ3NjcvMzc2MzAzNDI2LWVhMDAxODM2LWM4OTYtNDhmNS1iYjE4LTI0Y2Y2YmI5OTQ3Mi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDE0JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAxNFQxNTMxMzdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03ODliMGRiMGQzNDVjNmQxMDY4MjcyYWMyYzg3MjkzMWQ2NmQzYzE3NjYyNzgzMzdlZDQ2ZTRkYzBiNTNiNWU3JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.LMlbjDdgAEgKV7UMyM8eOKc9zBciWtuJVrGZftse2sI" width="500"> <br>
