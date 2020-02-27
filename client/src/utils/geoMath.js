// import {debug} from "../debug";

const divvyBox = {
  latLo :  41.736646,
  latHi :  42.064854,
  lonLo : -87.774704,
  lonHi : -87.549386
};
const skewCoefficients = [
   65, 73,122, 97, 83,121, 65, 99, 65,116,104,100, 82,
  102, 78, 52, 97, 72, 52,122, 55, 53, 74,116,122, 75,
   73, 51, 85, 88, 68, 70, 90,120,109,119, 95, 86, 52
];

export default {
    
  randLat     : () => (divvyBox.latLo + Math.random()*(divvyBox.latHi - divvyBox.latLo)),

  randLon     : () => (divvyBox.lonLo + Math.random()*(divvyBox.lonHi - divvyBox.lonLo)),

  divvyLimits : () => divvyBox,

  centerSkew  : () => String.fromCharCode(...skewCoefficients),
 
  findClosestStation : (lat,lon,list) => {
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