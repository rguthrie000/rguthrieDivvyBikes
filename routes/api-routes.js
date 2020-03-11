// api-routes.js - route service for the Bike Planner.
// Supports:
//
//   1. User Profile & Authentication: (signup with birthYear and gender, 
//      login - session start / logout - end session). Uses the 'Users' model.
//
//   2. Delivers the Google Maps API key
//
//   3. Delivers the list of Stations so the client can relate stations to the 
//      map and make trips queries using start and end station numbers. Uses the
//      'Stations' model.
//
//   4. Delivers trip startTimes and durations for a selected station start and end
//      pair. The Query can be further restricted by time range, gender, and 
//      birthyear range. Uses the 'Trips' model.

//* Dependencies ***************************************
const db         = require("../models/index");
const debug      = require("../debug");
const {dbReady}  = require('../config/checkModel.js');
require("dotenv").config();

let currentUserName = '';

// Routes
module.exports = function(app) {

  //* Authentication ***********************************

  app.get("/api/checkUser", (req,res) => {
    if (debug) {console.log(`check user requested`)}
    if (req.user) {
      currentUserName = req.user.userName;
      db.Users.findOne({userName : currentUserName}).exec( (err,data) => {
        res.send({
          result     : 'loggedIn',
          userName   : currentUserName,
          genderMale : data.genderMale,
          birthYear  : data.birthYear
        });
      });
    } else {
      res.send({
        result     : 'no user',
        userName   : '',
        genderMale : '',
        birthYear  : ''
      });
    }
  });
  
  // Using the passport.authenticate middleware with our local strategy.
  app.post("/api/login", (req, res) => {
    let respObj = {};
    db.Users.findOne({userName : req.body.userName}).exec( (err, data) => {
      if (!data) {
        respObj = {
          result     : 'not found',
          userName   : '',
          genderMale : '',
          birthYear  : ''
        };
      } else {
        if (data.password !== req.body.password) {
          respObj = {
            result     : 'incorrect password',
            userName   : '',
            genderMale : '',
            birthYear  : ''
          };
        } else {
          currentUserName = req.body.userName;
          respObj = {
            result     : 'loggedIn',
            userName   : currentUserName,
            genderMale : data.genderMale,
            birthYear  : data.birthYear
          };
          if (debug) {console.log(`login: ${respObj.result}, ${respObj.userName}, ${respObj.genderMale}, ${respObj.birthYear}`);}
        }
      }
      res.send(respObj);      
    });
  });

  // Route for signing up a user.  
  app.post("/api/signup", (req, res) => {
    if (debug) {console.log(`signup requested: ${JSON.stringify(req.body)}`);}
    let respObj = {};
    db.Users.create({
      userName   : req.body.userName,
      password   : req.body.password,
      genderMale : (req.body.genderMale ? 1 : 0),
      birthYear  : req.body.birthYear
    })
    .then( (result) => {
      // rowsAffected is an array whose first element is the number of rows affected.
      // here we expect either creation of one row, or zero rows if the userName
      // is not unique. 
      console.log('insert: ',result);
      currentUserName = req.body.userName;
      if (!result) {
        respObj = {
          result     : 'already signed up',
          userName   : currentUserName,
          genderMale : req.body.genderMale,
          birthYear  : req.body.birthYear
        }
      } else {  
        respObj = {
          result     : 'loggedIn',
          userName   : currentUserName,
          genderMale : req.body.genderMale,
          birthYear  : req.body.birthYear
        };
      }
      res.send(respObj);           
    })
    .catch( (err) => {
      console.log('err: ',err);
      respObj = {
        result     : 'db create failed',
        userName   : '',
        genderMale : '',
        birthYear  : ''
      }
      res.send(respObj);           
    });
  });

  // Route for logging user out
  app.get("/api/logout", function(req, res) {
    if (debug) {console.log(`logout requested`);}  
    currentUserName = '';
    // if (req.user) {req.logout();}
    res.send('logged out');
  });

  // Delete User
  app.get("/api/userdelete/:userName", (req,res) => {
    let user = req.params.userName;
    db.Users.
      deleteOne({userName : user}).
      exec( (err, data) => {
        if (err) {
          if (debug) {console.log(`delete user requested: ${user}`);}  
          if (debug) {console.log(err);}
          res.send('delete failed');
        } else {
          if (data.n === 1 && data.ok === 1 && data.deletedCount === 1) {
            if (debug) {console.log(`delete requested: ${user} DELETED`);}  
            res.send('deleted');
          } else {
            if (debug) {console.log(`delete requested: ${user} failed - ${JSON.stringify(data)}`)}
            res.send('delete failed');
          }
        }
    });
  });

  //* api routes ***********************************

  app.get("/api/getkey", (req,res) => {
    if (debug) {console.log('geokey requested');}
    res.send(process.env.REACT_APP_GEOKEY);
  });

  app.get("/api/dbready", (req,res) => {
    let dbReadyState = dbReady();
    if (debug) {console.log('dbReady requested');}
    res.send(dbReadyState);
  });

  app.get("/api/stations", (req,res) => {
    if (debug) {console.log('stations requested');}
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
    // if (req.body.useStartTime) {
    //   // input units are seconds, DB has startTime in milliseconds
    //   let startLo = 1000*(req.body.startTime - req.body.startTol);
    //   // add 0.1 second to upper limit to include records whose
    //   // startTimes have been adjusted for uniqueness.
    //   let startHi = 1000*(req.body.startTime + req.body.startTol) + 100;
    //   queryObj.startTime = { $gte: startLo, $lte: startHi };
    // }
    // if (req.body.useGenderMale) {
    //   queryObj.genderMale = req.body.genderMale;
    // }
    // if (req.body.useBirthYear) {
    //   let bYrLo   = req.body.birthYear - req.body.ageTol;
    //   let bYrHi   = req.body.birthYear + req.body.ageTol;
    //   queryObj.birthYear = { $gte:   bYrLo, $lte:   bYrHi };
    // }
    if (debug) {console.log(`trips requested, ${JSON.stringify(queryObj)}`);}
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
        // dataArr.forEach( (trip, i, arr) => arr[i].startTime = Math.floor(0.001*trip.startTime) );
        res.send(dataArr);
      }
    });
  });

}