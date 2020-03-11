// timeSvcs - utilities for working with time in the Bike Planner
//
//
//
//
//

// const DSTpast = [
//   1520755200000,  // '2018-03-11T08:00',
//   1541314800000,  // '2018-11-04T07:00',
//   1552204800000,  // '2019-03-10T08:00',
//   1572764400000,  // '2019-11-03T07:00'
// ];
const DSTfuture = [
  1583654400000,  // '2020-03-08T08:00',
  1604214000000   // '2020-11-01T07:00',
];

module.exports = {

  makeMinutesAndSeconds : (seconds) => {
    let sec = Math.floor(seconds % 60);
    let min = Math.floor(seconds / 60);
    sec = sec < 10? '0'+sec : sec;
    return(min + ':' + sec);
  },

  getTimeStr : () => {
  let t = Date.now();
  if (t < DSTfuture[0]) {t -= 6*60*60000;} else
  if (t < DSTfuture[1]) {t -= 5*60*60000;}
  let d = new Date(t);
  d = d.toUTCString();
  return(d.slice(0,25) + ' CT');
},

getTimeFlags : (tStr) => {
//  0    1  2   3      4     5 
// Mon, 24 Feb 2020 14:37:02 CT
  let tArr = tStr.split(' ');
  let wkDay = false;
  switch (tArr[0])
  {
    case "Mon,":
    case "Tue,":
    case "Wed,":
    case "Thu,":
    case "Fri,": wkDay =  true; break;
    case "Sat,": 
    case "Sun,": wkDay = false; break;
    default: break;
  }
  let todArr = tArr[4].split(':');
  let hr = todArr[0];
  let isMorning   = false;
  let isAfternoon = false;
  let isEvening   = false;
  let isOvernight = false;
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

// makeLocalTime() uses the javascript Date and toUTCString() functions
// to provide elements of date and time, as listed here for var
// dateAndTime.
makeLocalTime : (UTC,tzDelta) => {
// var dateAndTime =
// {
//   year           : "",
//   month          : "",
//   monthName      : "",
//   monthNameShort : "",
//   dayOfMonth     : "",
//   dayOfWeek      : "",
//   hour           : "",
//   minute         : "",
//   second         : ""
// }

  var dateTime = {};  // output buffer
  var dateObj = new Date(1000 * (UTC+tzDelta)); // Javascript toUTCString() method can be
  var tString = dateObj.toUTCString();          // given a UTC-compliant time in milliseconds
                                                // and will produce a string like this: 
                                                // "Fri, 13 Dec 2019 07:00:00 GMT"
  var tArr = tString.split(" "); // which we break apart at the spaces
  dateTime.year = tArr[3];
  dateTime.monthNameShort = tArr[2];
  switch (tArr[2])
  {
    case "Jan": dateTime.month =  1; dateTime.monthName =   "January"; break;
    case "Feb": dateTime.month =  2; dateTime.monthName =  "February"; break;
    case "Mar": dateTime.month =  3; dateTime.monthName =     "March"; break;
    case "Apr": dateTime.month =  4; dateTime.monthName =     "April"; break;
    case "May": dateTime.month =  5; dateTime.monthName =       "May"; break;
    case "Jun": dateTime.month =  6; dateTime.monthName =      "June"; break;
    case "Jul": dateTime.month =  7; dateTime.monthName =      "July"; break;
    case "Aug": dateTime.month =  8; dateTime.monthName =    "August"; break;
    case "Sep": dateTime.month =  9; dateTime.monthName = "September"; break;
    case "Oct": dateTime.month = 10; dateTime.monthName =   "October"; break;
    case "Nov": dateTime.month = 11; dateTime.monthName =  "November"; break;
    case "Dec": dateTime.month = 12; dateTime.monthName =  "December"; break;
    default: break;
  }
  dateTime.dayOfMonth = tArr[1];
  switch (tArr[0])
  {
    case "Mon,": dateTime.dayOfWeek =    "Monday"; break;
    case "Tue,": dateTime.dayOfWeek =   "Tuesday"; break;
    case "Wed,": dateTime.dayOfWeek = "Wednesday"; break;
    case "Thu,": dateTime.dayOfWeek =  "Thursday"; break;
    case "Fri,": dateTime.dayOfWeek =    "Friday"; break;
    case "Sat,": dateTime.dayOfWeek =  "Saturday"; break;
    case "Sun,": dateTime.dayOfWeek =    "Sunday"; break;
    default: break;
  }
  var todArr = tArr[4].split(":");  
  dateTime.hour   = todArr[0];
  dateTime.minute = todArr[1];
  dateTime.second = todArr[2];
  return(dateTime);
}
}

