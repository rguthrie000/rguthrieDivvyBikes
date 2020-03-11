// tripServer.js - client-side interface to our server
// for retrieval of User info, Stations, and Trips.
import axios   from "axios";
// import {debug} from "../debug"
let tArr = [];

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
  // expected elements in req.body:
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
  getTrips : (startId,endId,searchOptions,cb) => {
    let queryObj = {
      startStation : startId,
      endStation   : endId
      // useStartTime : false
      // startTime    : Date.now() - (364*24*60*60),
      // startTol     : 7*24*3600
    };
    tArr = [];
    axios.post("/api/trips", queryObj).then( (res) => {

      res.data.forEach( (t) => tArr.push({startTime: t.startTime, tripDuration: t.tripDuration}));
      queryObj = {
        ...queryObj,
        startStation : endId,
        endStation   : startId
        // startTime    : queryObj.startTime - 364*24*60*60
      };

      axios.post("/api/trips", queryObj).then( (res) => {
        res.data.forEach( (t) => tArr.push({startTime: t.startTime, tripDuration: t.tripDuration}));
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