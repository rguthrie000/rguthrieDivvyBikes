// tripsAnalysis.js - functions to produce charting data from trips query 
// results.
//
// output objects are formatted for use by the Victory objects used for
// charting.  See TripsChart.js and the victory.js online docs.

import timeSvcs from "./timeSvcs";
import {debug}  from "../debug";

export default {
    
  // default chart, which is a bar chart; provides trip counts (y axis) 
  // by duration bin (x axis), with statistical filtering
  tripsByDuration : (trips) => {
    let count = trips.length;
    let returnObj = {};

    // nothing to do if no trips
    if (count === 0) {
      returnObj = {
        trips          : 0,
        modeDuration   : '00:00', 
        nextBin        : '00:00',
        stdDevDuration : '00:00',
        labels         : [],
        binTrips       : []
      };
      return(returnObj);
    }

    // all the data and variables we'll use
    const CHART_BINS = 7; 
    let labels = [];
    let binTrips = [];
    let mean = 0;
    let stdDev = 0;
    let baseDuration = 0;
    let durationStep = 0;
    let maxBinCt = 0;
    let maxIndex = 0;

    // sorting will help with binning and rejection of outliers later.
    // ascending sort of objects using tripDuration property
    trips.sort( (a,b) => a.tripDuration - b.tripDuration);

    // basic statistics. remember, we already checked for no trips, so
    // divide-by-zero is only a concern for the stdDev calculation.
    mean = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
    stdDev = Math.sqrt(
      trips.reduce((acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1)
    );

    // Central Limit Theorem's 30 samples
    if (count > 30) {
      // filter outliers
      trips  = trips.filter( (t) => Math.abs(t.tripDuration-mean) <= 3.0*stdDev);
      // then re-count and take new stats
      count  = trips.length;
      mean   = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
      stdDev = Math.sqrt(
        trips.reduce((acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1));
    }

    if (debug) {console.log(`trips (after 3-sigma filter) ${count}: mean ${mean}, standard deviation ${stdDev}`);}
    
    // when there's only one, don't show a span of time in the chart.
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
      // each bin accumulates trip counts in a 1.0 stdDev span, with the center
      // bin spanning [-0.5,0.5) stdDev.
      baseDuration = mean - ((CHART_BINS-1)/2+0.5)*stdDev;
      // for close stations, the distribution may cause this calculation to go
      // into negative time. force the base time to be at least 00:00.
      baseDuration = baseDuration < 0? 0 : baseDuration;
      durationStep = stdDev;
      let t = 0;
      for (let b = 0; b < CHART_BINS; b++) {
        // label the bin for use by Victory
        labels.push(timeSvcs.makeMinutesAndSeconds(baseDuration+b*durationStep));
        // count the trips in this bin 
        let countInBin = 0;
        while ((t < count) && (trips[t].tripDuration < (baseDuration + (b+1)*durationStep))) {
          countInBin++;
          t++;
        }
        // track the bin with the highest count
        if (countInBin > maxBinCt) {
          maxBinCt = countInBin;
          maxIndex = b;
        }
        // and save the bin for use by Victory
        binTrips.push({ 
          bin  : b+1, 
          trips: countInBin
        });
      }
      if (debug) {console.log(`${JSON.stringify(binTrips)}`,labels);}
    }  
    // summarize
    returnObj = {
      trips          : count,
      modeDuration   : timeSvcs.makeMinutesAndSeconds(baseDuration+maxIndex*durationStep), 
      nextBin        : timeSvcs.makeMinutesAndSeconds(baseDuration+(maxIndex+1)*durationStep),
      stdDevDuration : timeSvcs.makeMinutesAndSeconds(stdDev),
      labels         : labels,
      binTrips       : binTrips
    };
    // and provide
    return(returnObj);
  },

  // alternate charts; a line chart for trips by hour of the day, and a scatter chart
  // for average duration by hour of the day
  durationsByHourOfDay : (trips) => {
    // only 24 hours in a day
    let labels = [
       '0', '1', '2', '3', '4', '5', '6', '7', '8', '9','10','11',
      '12','13','14','15','16','17','18','19','20','21','22','23'
    ];
    let pointsDur = [];
    let pointsCt = [];
    // hrArr's objects use 'c' for count and 'a' for accumulator
    let hrArr = [
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},
      {c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0},{c:0,a:0}
    ];

    // use each trip's hour of the day (derived from its startTime) as an index 
    // into hrArr to update the corresponding accumulator object
    let hr = 0;
    trips.forEach( (trip) => {
      hr = timeSvcs.getHourOfDay(trip.startTime);
      hrArr[hr].c++;                      // bump the count
      hrArr[hr].a += trip.tripDuration;   // and aggregate the time
    });

    // now walk through the hours of the day to form the output arrays
    for (let i = 0; i < 24; i++) {
      // it's ok for the durations array to have 'missing' hours due to
      // zero count, because the stored objects have the 'x' property 
      if (hrArr[i].c) {
        // replace accumulated time with average time
        hrArr[i].a = (hrArr[i].a / hrArr[i].c);
        // and add to the hours list
        pointsDur.push({ 
          x : i, 
          y : hrArr[i].a
        });
      }
      // and capture the count
      pointsCt.push({ 
        x : i, 
        y : hrArr[i].c
      });
      if (debug) {console.log(`durationsByHourOfDay: x ${i}, count ${hrArr[i].c}, avg ${hrArr[i].a}`);}
    }
    // summarize
    let returnObj = {
      labels    : labels,
      pointsDur : pointsDur,
      pointsCt  : pointsCt
    }
    // and provide
    return(returnObj);
  }

};