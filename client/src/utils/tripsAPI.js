// tripServer.js - client-side interface to our server
// for retrieval of User info, Stations, and Trips.
import axios from "axios";
// import {debug} from "../debug";

function getStations(cb) {
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
}

// getTrips() uses volumeId from one of the volumes found by
// getBooks(). as such, volumeId does not need validation.
function getTrips() {
  axios.post("/api/trips", {
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
  }).then( () => {

  })
}

export default {getStations, getTrips};