// geoMath.js provides location services for Divvy Bikes Planner
//
// import {debug} from "../debug";

// the first four value are the extrema of an enclosing box around
// the Divvy Stations.  the latter 'lkShore' group are the endpoints,
// North and South, of a northerly line roughly parallel to the 
// shore of Lake Michigan.  keeping to the West of this line allows
// most random locations to be assigned on land.
const divvyBox = {
  latLo       :  41.736646,
  latHi       :  42.064854,
  lonLo       : -87.774704,
  lonHi       : -87.549386,
  lkShoreNlat :  42.0650,
  lkShoreNlon : -87.6734,
  lkShoreSlat :  41.7365,
  lkShoreSlon : -87.5250
};
let slope = 
  (divvyBox.lkShoreNlon - divvyBox.lkShoreSlon) /
  (divvyBox.lkShoreNlat - divvyBox.lkShoreSlat);

export default {
    
  // return a random, on-land Chicago location
  randLoc     : () => {
    // lat is randomized over the latitude extents of the stations
    let lat = divvyBox.latLo + Math.random()*(divvyBox.latHi - divvyBox.latLo);
    // the new lat can be used with the slope to find an east-side lon limit
    let lonEastLimit = slope*(lat-divvyBox.latLo)+divvyBox.lkShoreSlon;
    let lon = divvyBox.lonLo + Math.random()*(lonEastLimit-divvyBox.lonLo);
    return({lat: lat, lon: lon});
  },

  // use the stations list to find the closest station to the provided
  // location, and the distance from the provided location to that station
  findClosestStation : (location,list) => {
    let dArr = list.map((s) => ((s.stationLat-location.lat)**2+(s.stationLon-location.lon)**2));
    let min = 1e6;
    let minIndex = -1;
    for (let i = 0; i < dArr.length; i++) {
      if (dArr[i] < min) {
        minIndex = i;
        min = dArr[i];
      }
    }
    // convert squared-degrees to miles. 
    // 3957.66 miles is the radius of the earth at the mid-latitude
    // of Chicago, and includes its sea-level elevation.
    min = Math.sqrt(min)*(Math.PI/180.0)*3957.66;
    return({minIndex: minIndex, minDist: min});
  }

};