// server.js - Bike Planner server-side entry point and initialization file.
//
// This version of server.js is (nearly) generic for a server-client
// Web App with User Authentication via passport/express-session, 
// and a mySQL database behind the sequelize ORM.

//@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@
//@*@*@                                     @*@*@
//@*@*@      mySQL SETUP IS REQUIRED!       @*@*@
//@*@*@                                     @*@*@
//@*@*@  1. The repo has not given you a    @*@*@
//@*@*@     file with a mySQL password.     @*@*@
//@*@*@     In your repo directory, create  @*@*@
//@*@*@     file '.env' with:               @*@*@
//@*@*@     password=<your password>        @*@*@
//@*@*@                                     @*@*@
//@*@*@     Make sure your repo manager     @*@*@
//@*@*@     is ignoring file '.env'!        @*@*@
//@*@*@                                     @*@*@
//@*@*@  2. The username is 'root' in file  @*@*@
//@*@*@     './config/config.json'. Change  @*@*@
//@*@*@     to your username if different.  @*@*@
//@*@*@                                     @*@*@
//@*@*@  3. If you are using the app        @*@*@
//@*@*@     locally, you must first create  @*@*@
//@*@*@     mySQL database 'barbuddy_db'.   @*@*@
//@*@*@     No tables are needed.           @*@*@
//@*@*@                                     @*@*@
//@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@*@

//********************
//*   Dependencies   *
//********************
const debug = require("./debug");

// Requiring necessary npm packages
const path         = require('path');
const express      = require('express');
const session      = require('express-session');
const passport     = require('./config/passport.js');
const {checkModel} = require('./config/checkModel.js');
require("dotenv").config();

//***************
//*   Startup   *
//***************

// Look for environment variables to have been established by
// dotenv.config()
if (!process.env.password || !process.env.secret) {
  console.log("Env variables aren't established. Check file './.env'.\n");
  return(1);
}

// Configure Express
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// When deployed, identify home for client assets
// (during development, server and client are on the
// same machine; the react client app will load the
// client side)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("./client/build"));
}
// Session specification - session is established on valid login
app.use(
  session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

// API routes
require("./routes/api-routes.js")(app);
// For any other route request, send the main page.
app.get("*", (req, res) => {
  res.sendFile(path.dirname("client/build/index.html"));
});

const PORT = process.env.PORT ? process.env.PORT : 3001;

// load and run index.js in the ./models directory
const db = require('./models');

checkModel();

// Be the Server
app.listen(PORT, () => {
  if (debug) {console.log(`Serving PORT ${PORT}`);}
});


