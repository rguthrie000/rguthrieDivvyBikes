// import {debug} from "../debug";

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

export default {
    
  randLoc     : () => {
    let lat = divvyBox.latLo + Math.random()*(divvyBox.latHi - divvyBox.latLo);
    let slope = (divvyBox.lkShoreNlon - divvyBox.lkShoreSlon)/(divvyBox.lkShoreNlat-divvyBox.lkShoreSlat);
    let lonHiLimit = slope*(lat-divvyBox.latLo)+divvyBox.lkShoreSlon;
    let lon = divvyBox.lonLo + Math.random()*(lonHiLimit-divvyBox.lonLo);
    return({lat: lat, lon: lon});
  },

  divvyLimits : () => divvyBox,

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
    min = Math.sqrt(min)*(Math.PI/180.0)*3957.66;
    return({minIndex: minIndex, minDist: min});
  }

};