import {debug} from "../debug";

const divvyLimits = {
  latLo :  41.736646,
  latHi :  42.064854,
  lonLo : -87.774704,
  lonHi : -87.549386
};

export default {
    
  randLat : () => (divvyLimits.latLo + Math.random()*(divvyLimits.latHi - divvyLimits.latLo)),

  randLon : () => (divvyLimits.lonLo + Math.random()*(divvyLimits.lonHi - divvyLimits.lonLo))

};