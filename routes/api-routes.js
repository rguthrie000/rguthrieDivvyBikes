// api-routes.js - route service for the Bike Planner.
// Supports:
//
//   1. User Profile & Authentication: (signup with birthYear and gender, 
//      login - session start / logout - end session). Uses the 'Users' model.
//
//   2. Delivers the list of Stations so the client can relate stations to the 
//      map and make trips queries using start and end station numbers. Uses the
//      'Stations' model.
//
//   3. Delivers trip startTimes and durations for a selected station start and end
//      pair. The Query can be further restricted by time range, gender, and 
//      birthyear range. Uses the 'Trips' model.

//* Dependencies ***************************************
const db         = require("../models/index");
const passport   = require("../config/passport");
const debug      = require("../debug");
const checkModel = require("../config/checkModel");

let currentUserName = '';

// Routes
module.exports = function(app) {

  //* Authentication ***********************************

  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log(`Login request: ${req.body.userName} ${req.body.password}`)
    if (req.user) {
      currentUserName = req.user;
    }
    res.json(req.user);
  });

  // Route for signing up a user. The user's password is hashed and stored securely. 
  // If the user is created successfully, proceed to the members page,
  // otherwise return an error.
  app.post("/api/signup", (req, res) => {
    console.log(`Signup request: ${req.body.userName} ${req.body.password}`);
    currentUserName = req.body.userName;
    db.Users.create({
      userName   : req.body.userName,
      password   : req.body.password,
      genderMale : req.body.genderMale,
      birthYear  : req.body.birthYear
    })
    .then((rowsAffected) => {
      // rowsAffected is an array whose first element is the number of rows affected.
      // here we expect either creation of one row, or zero rows if the userName
      // is not unique. 
      if (rowsAffected[0] == 0) {
        currentUserName = '';
        res.status(409);                      //  409 - Conflict
      } else {
        passport.authenticate("local");       // successful signup is also a successful login
        res.json(currentUserName);            // reply with userName
      }
    })
    .catch(function(err) {
      res.status(409).json(err);
    });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    currentUserName = '';
    req.logout();
    res.status(200);                          // 200 - ok
  });

  // Delete User
  app.get("/api/userdelete/:username", (req,res) => {
    if (debug) {console.log(`Request to delete user ${req.params.username}`);}  
    db.Users.
      deleteOne({userName : req.params.userName}).
      exec( (err, data) => {
        if (err) {
          if (debug) {console.log(err);}
          res.status(401);
        } else {
          res.status(200);
          req.logout();
        }
    });
  });

// Change password
  //app.put("/password", (req,res) => {
  //  if (currentUserName) {
  //    db.Users.updateOne()
  //  }
  //})

  //* api routes ***********************************

  app.get("/api/stations", (req,res) => {
    // return all stations. 
    db.Stations.find({}).
    exec( (err,dataArr) => {
      if (err) {
        if (debug) {console.log(err);}
        res.json(err);
      } else {
        // the response form is:
        res.send(dataArr);
      }
    });
  });

  app.post("/api/trips", (req, res) => {
    // expected elements in req.body:
    //
    //   startStation
    //   endStation
    //   useStartTime, and if 1:
    //     startTime
    //     startTol
    //   useGenderMale, and if 1:
    //     genderMale
    //   useBirthYear, and if 1:
    //     birthYear
    //     ageTol

    let queryObj = {};
    queryObj.startStation = req.body.startStation;
    queryObj.endStation = req.body.endStation;
    if (req.body.useStartTime) {
      // input units are seconds, DB has startTime in milliseconds
      let startLo = 1000*(req.body.startTime - req.body.startTol);
      // add 0.1 second to upper limit to include records whose
      // startTimes have been adjusted for uniqueness.
      let startHi = 1000*(req.body.startTime + req.body.startTol) + 100;
      queryObj.startTime = { $gte: startLo, $lte: startHi };
    }
    if (req.body.useGenderMale) {
      queryObj.genderMale = req.body.genderMale;
    }
    if (req.body.useBirthYear) {
      let bYrLo   = req.body.birthYear - req.body.ageTol;
      let bYrHi   = req.body.birthYear + req.body.ageTol;
      queryObj.birthYear = { $gte:   bYrLo, $lte:   bYrHi };
    }
    db.Trips.find(queryObj).
    select({ startTime: 1, tripDuration: 1 }).
    exec( (err, dataArr) => {
      if (err) {
        if (debug) {console.log(err);}
        res.json(err);
      } else {
        // because of the 'select' filter, the response form is:
        //   [{startTime: <startTime>, tripDuration: <tripDuration>}, ..., ]

        // but wait! before sending, need to convert DB startTimes to seconds
        dataArr.forEach( (trip, i, arr) => arr[i].startTime = Math.floor(0.001*trip.startTime) );
        res.send(dataArr);
      }
    });
  });

}