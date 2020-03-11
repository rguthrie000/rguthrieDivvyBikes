// tripServer.js - client-side interface to our server
// for retrieval of User info, Stations, and Trips.
import axios   from "axios";
// import {debug} from "../debug"

export default  {
  
  getKey : (cb) => {
    axios.get("/api/getkey").then( (res) => {
      cb(res.data);
    });  
  },

  getDBready : (cb) => {
    axios.get("/api/dbready").then( (res) => {
      cb(res.data);
    }
  )},

  getStations : (cb) => {
  axios.get('/api/stations').then( (res) => { 
      let stationArr = [];
      res.data.forEach( (s) => {
        stationArr.push({
          stationId   : s.stationId,
          stationName : s.stationName,
          docks       : s.docks, 
          stationLat  : s.stationLat,
          stationLon  : s.stationLon
        });
      })
      cb(stationArr);
   })
   .catch( (err) => console.log(err));
  },

  // getTrips() 
  // expected elements in req.body      input arguments
  //   startStation                       startId
  //   endStation                         endId
  //   useTime                            searchOptions.useTime
  //   useGender, and if 1:               searchOptions.useProfile
  //     genderMale                       user.genderMale
  //   useBirthYear, and if 1:            searchOptions.useProfile
  //     birthYear                        user.birthYear
  //     ageTol                           searchOptions.ageTol
  getTrips : (startId,endId,searchOptions,user,cb) => {
    let queryObj = {
      startStation : startId,
      endStation   : endId,
      useGender    : searchOptions.useProfile,
      genderMale   : (user.gender === 'male' ? 1 : 0),
      useBirthYear : searchOptions.useProfile,
      birthYear    : user.birthYear,
      ageTol       : searchOptions.ageTol 
    };

    let tArr = [];

    // we want trips from start to dest, and dest to start, 
    // but not start to start, and not dest to dest.

    // so begin with start to dest
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
        // if (searchOptions.useTime) {
        //  
        // }
        cb(tArr);
      });
    });
  },

  checkLogin: (cb) => {
    axios.get("/api/checkUser").then ( (res) => {
      cb(res.data);
    })
  },

  postLogin : (userObj,cb) => {
    let postObj = {
      userName: userObj.userName,
      password: userObj.password
    };
    axios.post("/api/login",postObj).then( (res) => {
      cb(res.data);
    });
  },

  postSignup : (userObj,cb) => {
    axios.post("/api/signup",userObj).then( (res) => {
      cb(res.data);
    });
  },

  getLogout : (cb) => {
    axios.get("/api/logout").then( (res) => {
      cb(res.data);
    });
  },

  getDelete : (userName,cb) => {
    axios.get(`/api/userdelete/${userName}`).then( (res) => {
      cb(res.data);
    });
  }

}