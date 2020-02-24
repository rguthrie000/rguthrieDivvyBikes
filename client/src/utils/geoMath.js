// import {debug} from "../debug";

const divvyLimits = {
  latLo :  41.736646,
  latHi :  42.064854,
  lonLo : -87.774704,
  lonHi : -87.549386
};

export default {
    
  randLat : () => (divvyLimits.latLo + Math.random()*(divvyLimits.latHi - divvyLimits.latLo)),

  randLon : () => (divvyLimits.lonLo + Math.random()*(divvyLimits.lonHi - divvyLimits.lonLo)),

  findClosestStation(lat,lon,list) {
    let dArr = list.map((s) => ((s.stationLat-lat)**2+(s.stationLon-lon)**2));
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