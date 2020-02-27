const mongoose = require("mongoose");
const Float = require('mongoose-float').loadType(mongoose,8);
 
//*******************************
//***   Database Connection   ***
//*******************************

// set the db name here
const dbName = "bikerides_db";

mongoose.connect(
  process.env.MONGODB_URI ? process.env.MONGODB_URI : ("mongodb://localhost/"+dbName), 
  {useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex': true}
);

// Get the connection
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