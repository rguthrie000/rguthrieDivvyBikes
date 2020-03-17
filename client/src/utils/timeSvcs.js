// timeSvcs.js - utilities for working with time in the Bike Planner
// 
// The Trips collection delivers trip startTime in UTC milliseconds since
// 1970 -- which is also the format provided by Javascript's 'new Date()'.
// The extraction/conversion utilities here use Javascript functions to
// convert one of these large natural numbers to a string which may be 
// parsed for day of the week, hour of the day, etc.

import {debug} from "../debug"


// 'Helper' functions ********************************************************
// these are CDT <--> CST transition times expressed in ms since
// 1970-01-01T00:00.000.  
// const DSTpast = [
//   1520755200000,  // '2018-03-11T08:00',
//   1541314800000,  // '2018-11-04T07:00',
//   1552204800000,  // '2019-03-10T08:00',
//   1572764400000,  // '2019-11-03T07:00'
// ];

// MAINTAIN THIS FUNCTION AS FURTHER CST <--> CDT 
// TRANSITIONS ARE NEEDED
// convertUTCtoCT() takes milliseconds since 1970 start in GMT and
// adjusts for Central Time, with consideration for Daylight Saving
// Time.
const DSTfuture = [
  1583654400000,  // '2020-03-08T08:00',
  1604214000000   // '2020-11-01T07:00',
];
function convertUTCtoCT(t) {
  if (t < DSTfuture[0]) {t -= 6*60*60000;} else
  if (t < DSTfuture[1]) {t -= 5*60*60000;} else
                        {t -= 6*60*60000;}
  return(t);
}

// isWeekday() takes a four-character 'day', presumably found as the first
// four characters of a string returned by Date() or new Date(); it returns
// whether or not the day string maps to a weekday.
function isWeekday(dayStr) {
  switch (dayStr) {
    case "Mon,":
    case "Tue,":
    case "Wed,":
    case "Thu,":
    case "Fri,": return(true);

    case "Sat,": 
    case "Sun,":
    default    : return(false);
  }
}

// Externally Available Services *********************************************

export default {

  // 'stringify' a number of seconds into minutes:seconds
  makeMinutesAndSeconds : (seconds) => {
    let sec = Math.floor(seconds % 60);
    let min = Math.floor(seconds / 60);
    sec = sec < 10? '0'+sec : sec;
    return(min + ':' + sec);
  },

  // convert the current time into a time string in Central Time
  // Output format example: 'Mon, 24 Feb 2020 14:37:02 CT'
  getTimeStr : () => {
    // present time in ms
    let t = Date.now();
    // convertUTCtoCT accounts for Saving Time
    t = convertUTCtoCT(t);
    // put this time into JS date format
    let d = new Date(t);
    // to be able to use the JS string conversion
    d = d.toUTCString();
    // finally, show the adjusted timezone 
    return(d.slice(0,25) + ' CT');
  },

  // map the time of day to a 'part of day'
  getTimeFlags : (tStr) => {
    // tStr.split(' '); will give an array like this:
    //  0   1   2   3      4     5 
    // Mon, 24 Feb 2020 14:37:02 CT
    let tArr = tStr.split(' ');
    let wkDay = isWeekday(tArr[0]);
    // further break up hr:min:sec...
    let todArr = tArr[4].split(':');
    let hr = todArr[0];
    // make all false;
    let isMorning   = false;
    let isAfternoon = false;
    let isEvening   = false;
    let isOvernight = false;
    // then allow one to be true
    if (hr <  6) {isOvernight = true;} else 
    if (hr < 12) {isMorning   = true;} else
    if (hr < 18) {isAfternoon = true;} else 
                 {isEvening   = true;}
    return({
      isWeekday   : wkDay, 
      isMorning   : isMorning,
      isAfternoon : isAfternoon,
      isEvening   : isEvening,
      isOvernight : isOvernight
    });
  },

  // scrub trips array of trips whose startTime doesn't match
  // timeOfWeek -- which is either WEEKDAYS or WEEKENDS.
  filterTimeOfWeek : (tArr,timeOfWeek) => {
    const WEEKDAYS = 1;
    // const ALL_DAYS = 0; // these are not explicitly referenced
    // const WEEKENDS = 2;
    return(tArr.filter( (trip) => {
      let findWeekday = (timeOfWeek === WEEKDAYS);
      // startTime --> central time, then to JS date object
      let d = new Date(convertUTCtoCT(trip.startTime));
      // then to UTC String
      let dStr = d.toUTCString();
      // dStr format:
      //  0   1   2   3      4      5 
      // Mon, 24 Feb 2020 14:37:02 GMT
      let dArr = dStr.split(' ');
      // finally, does the day fit the desired category?
      if (findWeekday === isWeekday(dArr[0])) {
        if (debug) {
          console.log(`filterTimeOfWeek: ${findWeekday?'weekday':'weekend'} to ${dStr} MATCH`);
        }
        // this return is for the filter function
        return(true);
      } else {
        if (debug) {
          console.log(`filterTimeOfWeek: ${findWeekday?'weekday':'weekend'} to ${dStr} NO MATCH`)
        }
        // again, this return is for the filter function
        return(false)
      }  
    }));
  },

  // getHourOfDay() assumes its argument 't' is a count of milliseconds since 
  // 1970-01-01T00:00.000 the return value is the hour of the day for this count,
  // in Central Time
  getHourOfDay : (t) => {
    let d = new Date(convertUTCtoCT(t));
    let dStr = d.toUTCString();
    // dStr format:
    //  0   1   2   3      4      5 
    // Mon, 24 Feb 2020 14:37:02 GMT
    let dArr = dStr.split(' ');
    let todArr = dArr[4].split(':');
    // the result is used as an array index -- insure it's a number
    return(parseInt(todArr[0]));
  }

}

