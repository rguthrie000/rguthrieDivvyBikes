// api-routes.js - route service for the Bike Planner.
// Supports:
//
//   1. User Profile & Authentication: (signup with birthYear and gender,
//      login - session start / logout - end session). Uses the 'Users'
//      collection.
//
//   2. Delivers the Google Maps API key
//
//   3. Delivers the list of Stations so the client can relate stations to the
//      map and make trips queries using start and end station numbers. Uses
//      the 'Stations' collection.
//
//   4. Delivers trip startTimes and tripDurations for a selected station start
//      and end pair. The Query can be further restricted by time range, gender,
//      and birthyear range. Uses the 'Trips' collection.

//* Dependencies ***************************************
const db        = require("../models/index");
const {dbReady} = require("../models/checkModel.js");
const debug     = require("../debug");
require("dotenv").config();

// currentUserName tracks login.  if null, no logged-in user, so neither gender
// nor age are available for query filtering.
let currentUserName = "";

// Routes
module.exports = function(app) {
  //* Authentication ***********************************

  // Using a simple password scheme without encryption - no real PPI here
  // *ICEBOX* future - integrate OAuth.

  // checkUser is performed by client to see if there's an existing session.
  app.get("/api/checkUser", (req, res) => {
    if (debug) {
      console.log(`check user requested`);
    }
    if (req.user) {
      currentUserName = req.user.userName;
      db.Users.findOne({ userName: currentUserName }).exec((err, data) => {
        res.send({
          result: "loggedIn",
          userName: currentUserName,
          genderMale: data.genderMale,
          birthYear: data.birthYear
        });
      });
    } else {
      res.send({
        result: "no user",
        userName: "",
        genderMale: "",
        birthYear: ""
      });
    }
  });

  // login
  app.post("/api/login", (req, res) => {
    let respObj = {};
    db.Users.findOne({ userName: req.body.userName }).exec((err, data) => {
      // indicate if the name isn't found
      if (!data) {
        respObj = {
          result: "not found",
          userName: "",
          genderMale: "",
          birthYear: ""
        };
      } else {
        // found the name -- password match?
        if (data.password !== req.body.password) {
          respObj = {
            result: "incorrect password",
            userName: "",
            genderMale: "",
            birthYear: ""
          };
        } else {
          // matched name and password - establish login with currentUserName
          // and return profile information
          currentUserName = req.body.userName;
          respObj = {
            result: "loggedIn",
            userName: currentUserName,
            genderMale: data.genderMale,
            birthYear: data.birthYear
          };
          if (debug) {
            console.log(`login: ${JSON.stringify(respObj)}`);
          }
        }
      }
      res.send(respObj);
    });
  });

  // Route for registering a new user.
  app.post("/api/signup", (req, res) => {
    if (debug) {
      console.log(`signup requested: ${JSON.stringify(req.body)}`);
    }
    let respObj = {
      result: "db failure",
      userName: "",
      genderMale: "",
      birthYear: ""
    };
    db.Users.create({
      userName: req.body.userName,
      password: req.body.password,
      genderMale: req.body.genderMale ? 1 : 0,
      birthYear: req.body.birthYear
    })
      .then(result => {
        // see ./client/src/App.js - on the client side, when a new login is
        // submitted, login is tried first. a userName+password match is a 
        // login; userName match with password mismatch is caught as 'incorrect
        // password'.
        // on userName no-match, the client checks for a compliant profile and
        // submits the record through this signup route. so the mongoose schema
        // requirement for unique userName (see ./models/index.js) will be met,
        // and this create() will only have no result if there is a db 
        // connection error.
        if (result) {
          currentUserName = req.body.userName;
          respObj = {
            result: "loggedIn",
            userName: currentUserName,
            genderMale: req.body.genderMale,
            birthYear: req.body.birthYear
          };
        }
        res.send(respObj);
      })
      // in this case, there was a db error response
      .catch(err => {
        if (debug) {
          console.log("err: ", err);
        }
        res.send(respObj);
      });
  });

  // Route for logging user out
  app.get("/api/logout", function(req, res) {
    if (debug) {
      console.log(`logout requested`);
    }
    currentUserName = "";
    res.send("logged out");
  });

  // Delete User
  app.get("/api/userdelete/:userName", (req, res) => {
    let user = req.params.userName;
    db.Users.deleteOne({ userName: user }).exec((err, data) => {
      if (err) {
        if (debug) {
          console.log(err);
        }
        res.send("delete failed");
      } else {
        // per mongoose documentation...
        if (data.deletedCount === 1) {
          if (debug) {
            console.log(`delete requested: ${user} DELETED`);
          }
          res.send("deleted");
        } else {
          if (debug) {
            console.log(`delete failed for ${user}`);
            console.log(`delete: db response ${JSON.stringify(data)}`);
          }
          res.send("delete failed");
        }
      }
    });
  });

  //* api routes ***********************************

  // /api/getkey is used by the client before React is instantiated to
  // make sure the first Google Map query has a valid key.
  app.get("/api/getkey", (req, res) => {
    if (debug) {
      console.log("geokey requested");
    }
    res.send(process.env.REACT_APP_GEOKEY);
  });

  // /api/dbready is used by the client to gate queries based on
  // database availability
  app.get("/api/dbready", (req, res) => {
    let dbReadyState = dbReady();
    if (debug) {
      console.log("dbReady requested");
    }
    res.send(dbReadyState);
  });

  // /api/stations provides the table of Divvy stations to the client
  app.get("/api/stations", (req, res) => {
    if (debug) {
      console.log("stations requested");
    }
    // find all stations.
    db.Stations.find({}).exec((err, dataArr) => {
      if (err) {
        if (debug) {
          console.log(err);
        }
        res.json(err);
      } else {
        // send all stations to the client
        res.send(dataArr);
      }
    });
  });

  // /api/trips is the Trips Query, which supports station, gender, and age
  // filtering options
  //
  // expected elements in req.body      input arguments
  //   startStation                       startId
  //   endStation                         endId
  //   useGender, and if 1:               searchOptions.useProfile
  //     genderMale                       user.genderMale
  //   useBirthYear, and if 1:            searchOptions.useProfile
  //     birthYear                        user.birthYear
  //     ageTol                           searchOptions.ageTol
  app.post("/api/trips", (req, res) => {
    // build the query filter on start, end, and any restrictions for gender
    // and age. this object is built property by property.
    let queryObj = {};
    // startStation and endStation are always used
    queryObj.startStation = req.body.startStation;
    queryObj.endStation = req.body.endStation;
    // gender is an option.
    if (req.body.useGender) {
      queryObj.genderMale = req.body.genderMale;
    }
    // as is age
    if (req.body.useBirthYear) {
      let bYrLo = parseInt(req.body.birthYear) - parseInt(req.body.ageTol);
      let bYrHi = parseInt(req.body.birthYear) + parseInt(req.body.ageTol);
      queryObj.birthYear = { $gte: bYrLo, $lte: bYrHi };
    }
    if (debug) {
      console.log(`trips requested, ${JSON.stringify(queryObj)}`);
    }
    db.Trips.find(queryObj)
      .select({ startTime: 1, tripDuration: 1 })
      .exec((err, dataArr) => {
        if (err) {
          if (debug) {
            console.log(err);
          }
          res.json(err);
        } else {
          // because of the 'select' filter, the response form is:
          //   [{startTime: <startTime>, tripDuration: <tripDuration>}, ..., ]
          res.send(dataArr);
        }
      });
  });
};