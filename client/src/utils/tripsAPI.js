// tripsAPI.js - client-side interface to our server
// for use of the Users, Stations, and Trips collections.
//
// All of the queries use callback functions to indicate
// completion and pass back any results.
//
import axios    from "axios";
import timeSvcs from "./timeSvcs";

export default  {
  
  // API Key function *********************************************************

  // fetch the Google Maps API key
  getKey : (cb) => {
    axios.get("/api/getkey").then( (res) => {
      cb(res.data);
    });  
  },

  // DB functions *************************************************************

  // fetch db status
  getDBready : (cb) => {
    axios.get("/api/dbready").then( (res) => {
      cb(res.data);
    }
  )},

  // fetch the stations list
  getStations : (cb) => {
  axios.get('/api/stations').then( (res) => { 
      let stationArr = [];
      // create an array of objects where each object is a station.
      res.data.forEach( (s) => {
        stationArr.push({
          stationId   : s.stationId,
          stationName : s.stationName,
          docks       : s.docks,        // future use
          stationLat  : s.stationLat,
          stationLon  : s.stationLon
        });
      })
      // return the array
      cb(stationArr);
   })
   .catch( (err) => console.log(err));
  },

  // getTrips() specifies and requests a Trips query, then implements
  // weekday/weekend filtering on the results.
  //
  // server expects (req.body):         source in input arguments:
  //   startStation                       startId
  //   endStation                         endId
  //   useGender, and if 1:               searchOptions.useGender
  //     genderMale                       user.genderMale
  //   useBirthYear, and if 1:            searchOptions.useAge
  //     birthYear                        user.birthYear
  //     ageTol                           searchOptions.ageTol
  //
  // used to further filter the response:
  //   useTime                            searchOptions.useTime
  //
  getTrips : (startId,endId,searchOptions,user,cb) => {
    let queryObj = {
      startStation : startId,
      endStation   : endId,
      useGender    : searchOptions.useGender,
      genderMale   : (user.gender === 'male' ? 1 : 0),
      useBirthYear : searchOptions.useAge,
      birthYear    : user.birthYear,
      ageTol       : searchOptions.ageTol 
    };
    // we want trips from start-to-dest, and dest-to-start, 
    // but not start-to-start, and not dest-to-dest.

    // tArr will accumulate results from both queries
    let tArr = [];

    // begin with start to dest
    axios.post("/api/trips", queryObj).then( (res) => {

      res.data.forEach( (t) => tArr.push({startTime: t.startTime, tripDuration: t.tripDuration}));

      // then add trips from dest to start
      queryObj = {
        ...queryObj,
        startStation : endId,
        endStation   : startId
      };
      axios.post("/api/trips", queryObj).then( (res) => {
        res.data.forEach( (t) => tArr.push({startTime: t.startTime, tripDuration: t.tripDuration}));
        // ok, that's the lot...filter for time of week?
        const ALL_DAYS = 0;
        // const WEEKDAYS = 1; // these are not explicitly referenced
        // const WEEKENDS = 2;
        if (searchOptions.useTime !== ALL_DAYS) {
          tArr = timeSvcs.filterTimeOfWeek(tArr,searchOptions.useTime);
        }
        // return the array via callback
        cb(tArr);
      });
    });
  },

  // Authentification functions ***********************************************

  // see if a session exists
  checkLogin: (cb) => {
    axios.get("/api/checkUser").then ( (res) => {
      cb(res.data);
    })
  },

  // try a login
  postLogin : (userObj,cb) => {
    let postObj = {
      userName: userObj.userName,
      password: userObj.password
    };
    axios.post("/api/login",postObj).then( (res) => {
      cb(res.data);
    });
  },

  // try a signup
  postSignup : (userObj,cb) => {
    axios.post("/api/signup",userObj).then( (res) => {
      cb(res.data);
    });
  },

  // log the user out
  getLogout : (cb) => {
    axios.get("/api/logout").then( (res) => {
      cb(res.data);
    });
  },

  // delete the user
  getDelete : (userName,cb) => {
    axios.get(`/api/userdelete/${userName}`).then( (res) => {
      cb(res.data);
    });
  }

  // user edits of userName, password or profile information -- 
  // since only gender and birthYear are saved, and delete is supported
  // with a dedicated button, user edits are supported by delete, then
  // signup with changed values.

}