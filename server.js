// server.js - Divvy Bikes Planner: server-side entry point and initialization
// file.
//
// Two passwords/keys are needed for full functionality of this app:
//
//   REACT_APP_GEOKEY is the Google Maps API key
//   passwordMongodb is the MongoDB Atlas password
//
// On heroku, the first values is provided as a 'Config Var', and the
// second is provided by changing the MONGODB_URI environment variable to
// be the full DB access URL provided by MongoDB Atlas. (That URL embeds 
// passwordMongodb.)

//********************
//*   Dependencies   *
//********************

// master variable to control console logging.
const debug = require("./debug");

// Requiring necessary npm packages
const path         = require('path');
const express      = require('express');

// and other files (routes and models are associated below)
const {checkModel} = require('./models/checkModel.js');

// and environment variables
require("dotenv").config();

//***************
//*   Startup   *
//***************

// Configure Express
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// When deployed, identify home for client assets
// (during development, server and client are on the
// same machine; the react client app will load the
// client side)
// Session specification - session is established on valid login
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, './client/build')));
};

// API routes
require("./routes/api-routes.js")(app);
// For any other route request, send the main page.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname,'client/build/index.html'));
});

const PORT = process.env.PORT ? process.env.PORT : 3001;

// configure the db models and connect to the db --
// this 'require' will run the index.js file in the
// 'models' directory.
const db = require('./models');

// check the db; load collections as needed.
checkModel();

// Be the Server
app.listen(PORT, () => {
  if (debug) {console.log(`Serving PORT ${PORT}`);}
});