import timeSvcs from "./timeSvcs";
import {debug}  from "../debug";

export default {
    
  tripsByDuration : (trips) => {
    const CHART_BINS = 7; 

    let count = trips.length;
    let labels = [];
    let binTrips = [];
    let mean = 0;
    let stdDev = 0;
    let baseDuration = 0;
    let durationStep = 0;
    let maxBinCt = 0;
    let maxIndex = 0;

    // sorting will help with rejection of outliers later
    trips.sort( (a,b) => a.tripDuration - b.tripDuration);
    mean = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
    stdDev = Math.sqrt(trips.reduce(
      (acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1));

    // Central Limit Theorem's 30 samples
    if (count > 30) {
      // filter outliers
      trips  = trips.filter( (t) => Math.abs(t.tripDuration-mean) <= 3.0*stdDev);
      // then re-count and take new stats
      count  = trips.length;
      mean   = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
      stdDev = Math.sqrt(trips.reduce(
        (acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1));
    }

    if (debug) {console.log(`trips (after 3-sigma filter) ${count}: mean ${mean}, standard deviation ${stdDev}`);}
    
    // when there's only one, there's no point showing a span of time in the chart.
    if (count === 1) {
      baseDuration = trips[0].tripDuration;
      maxBinCt = 0;
      maxIndex = 0;
      labels.push(timeSvcs.makeMinutesAndSeconds(baseDuration));
      binTrips.push({ 
        bin  : 1, 
        trips: 1
      });
      durationStep = 0;
    } else {
      baseDuration = mean - ((CHART_BINS-1)/4-0.25)*stdDev;
      baseDuration = baseDuration < 0? 0 : baseDuration;
      durationStep = 0.5*stdDev;
      let t = 0;
      for (let b = 0; b < CHART_BINS; b++) {
        labels.push(timeSvcs.makeMinutesAndSeconds(baseDuration+b*durationStep));
        let countInBin = 0;
        while ((t < count) && (trips[t].tripDuration < (baseDuration + (b+1)*durationStep))) {
          countInBin++;
          t++;
        }
        if (countInBin > maxBinCt) {
          maxBinCt = countInBin;
          maxIndex = b;
        }
        binTrips.push({ 
          bin  : b+1, 
          trips: countInBin
        });
      }
      if (debug) {console.log(`${JSON.stringify(binTrips)}`,labels);}
    }  
    let returnObj = {
      trips          : count,
      modeDuration   : timeSvcs.makeMinutesAndSeconds(baseDuration+maxIndex*durationStep), 
      nextBin        : timeSvcs.makeMinutesAndSeconds(baseDuration+(maxIndex+1)*durationStep),
      stdDevDuration : timeSvcs.makeMinutesAndSeconds(stdDev),
      labels         : labels,
      binTrips       : binTrips
    };
    return(returnObj);
  },

  durationsByHourOfDay : (trips) => {
    let labels = [
       '0', '1', '2', '3', '4', '5', '6', '7', '8', '9','10','11',
      '12','13','14','15','16','17','18','19','20','21','22','23'
    ];
    let pointsDur = [];
    let pointsCt = [];
    let hrArr = [
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0}
    ];
    let hr = 0;
    trips.forEach( (trip) => {
      hr = timeSvcs.getHourOfDay(trip.startTime);
      hrArr[hr].c++;
      hrArr[hr].a += trip.tripDuration;
    });
    for (let i = 0; i < 24; i++) {
      if (hrArr[i].c) {
        hrArr[i].a = (hrArr[i].a / hrArr[i].c);
        pointsDur.push({ 
          x : i, 
          y : hrArr[i].a
        });
      }
      pointsCt.push({ 
        x : i, 
        y : hrArr[i].c
      });
      if (debug) {console.log(`durationsByHourOfDay: x ${i}, count ${hrArr[i].c}, avg ${hrArr[i].a}`);}
    }
    let returnObj = {
      labels    : labels,
      pointsDur : pointsDur,
      pointsCt  : pointsCt
    }
    return(returnObj);
  }

};