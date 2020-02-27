// tripServer.js - client-side interface to our server
// for retrieval of User info, Stations, and Trips.
import axios   from "axios";
let tArr = [];

export default  {
  
  getKey : (cb) => {
    axios.get("/api/mapkey").then( (res) => {
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
  getTrips : (stations,searchOptions,cb) => {
    let queryObj = {
      startStation : stations.list[stations.startIndex].stationId,
      endStation   : stations.list[stations.endIndex].stationId,
      useStartTime : false
      // startTime    : Date.now() - (364*24*60*60),
      // startTol     : 7*24*3600
    };
    tArr = [];
    axios.post("/api/trips", queryObj).then( (res) => {

      res.data.forEach( (t) => tArr.push({startTime: (t.startTime + 364*24*60*60), tripDuration: t.tripDuration}));
      queryObj = {
        ...queryObj,
        startStation : stations.list[stations.endIndex].stationId,
        endStation   : stations.list[stations.startIndex].stationId,
        // startTime    : queryObj.startTime - 364*24*60*60
      };

      axios.post("/api/trips", queryObj).then( (res) => {
        res.data.forEach( (t) => tArr.push({startTime: (t.startTime + 2*364*24*60*60), tripDuration: t.tripDuration}));
        cb(tArr);
      });
    });
  }

}