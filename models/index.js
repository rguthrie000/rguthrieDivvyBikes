const mongoose = require("mongoose");
const Float = require('mongoose-float').loadType(mongoose,8);
require("dotenv").config();
const debug = require("../debug");

//*******************************
//***   Database Connection   ***
//*******************************

// set the db name here
const dbName = "bikerides_db";

// Connect to database
let URI = '';
// 1. if heroku's MONGODB_URI exists, use it. (points to MongoDB Atlas)
if (process.env.MONGODB_URI) {
    URI = process.env.MONGODB_URI; 
} else {
  // 2. Ok, not heroku. if useAtlas is defined in file .env, use MongoDB Atlas:  
  if (process.env.useAtlas) { 
    URI = 'mongodb+srv://guthrie01:'+ process.env.passwordMongodb + 
          '@cluster0-ow4jw.mongodb.net/' + dbName + "?retryWrites=true&w=majority";
  } else {
      // 3. otherwise use the local MongoDB installation:
      URI = "mongodb://localhost/" + dbName;
  }    
}
mongoose.connect(URI,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
  .then ( ()    => {if (debug) console.log(`.models/index.js: MongoDB connected using URI ${URI}`);})
  .catch( (err) => {if (debug) console.log(`.models/index.js: MongoDB connection error using URI ${URI}: ${err}`);});

// Get the connection 'handle'
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//*****************************
//***   Model Definitions   ***
//*****************************

const TripSchema = new mongoose.Schema({
  startTime     : {type: Number}, // 1514761920 - 1577833020
  tripDuration  : {type: Number},
  startStation  : {type: Number, min:      0, max:   700},
  endStation    : {type: Number, min:      0, max:   700},
  genderMale    : {type: Boolean},
  birthYear     : {type: Number, min:   1900, max:  2017}
});

const StationSchema = new mongoose.Schema({
  stationId     : {type: Number, min:      0, max:   700},
  stationName   : {type: String},
  docks         : {type: Number, min:      0, max:  1000},
  stationLat    : {type: Float , min:  -90.0, max:  90.0},
  stationLon    : {type: Float , min: -180.0, max: 180.0}
});

const UserSchema = new mongoose.Schema({
  userName      : {type: String, unique: true},
  password      : {type: String, minlength: 8},
  genderMale    : {type: Boolean},
  birthYear     : {type: Number, min:   1920, max:  2017}
});

//**************************
//***   Model Creation   ***
//**************************

const Trips    = mongoose.model("Trips"    ,    TripSchema );
const Stations = mongoose.model("Stations" , StationSchema );
const Users    = mongoose.model("Users"    ,    UserSchema );

// And let the models be known!
exports.Trips    = Trips;
exports.Stations = Stations;
exports.Users    = Users;