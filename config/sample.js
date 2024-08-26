const passport = require('passport');
const User = require("../models/userModel")
const process =require('dotenv').config()

const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

// let a = {
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
//     passReqToCallback   : true
//   }

  console.log(process)