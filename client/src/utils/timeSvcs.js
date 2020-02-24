// timeSvcs - utilities for working with time in the Bike Planner
//
//
//
//
//

const DSTtransitions = [
    {
      startDST2018 : '2018-03-11T08:00',
        endDST2018 : '2018-11-04T07:00',
      startDST2019 : '2019-03-10T08:00',
        endDST2019 : '2019-11-03T07:00'
    },
];

// 1. get Date

// makeLocalTime() uses the javascript Date and toUTCString() functions
// to provide elements of date and time, as listed here for var
// dateAndTime.
var dateAndTime =
{
  year           : "",
  month          : "",
  monthName      : "",
  monthNameShort : "",
  dayOfMonth     : "",
  dayOfWeek      : "",
  hour           : "",
  minute         : "",
  second         : ""
}
function makeLocalTime(UTC,tzDelta)
{
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
  }
  var todArr = tArr[4].split(":");  
  dateTime.hour   = todArr[0];
  dateTime.minute = todArr[1];
  dateTime.second = todArr[2];
  return(dateTime);
}

