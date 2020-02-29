// cleanDivvy.js - Bike Planner support tool, a standalone program to
// read Divvy .csv files, filter out broken and non-subscriber records,
// massage data into desired format, sort, then save as a number of
// sequentially ordered files. cleanDivvy is needed ultimately because
// the Divvy raw files are not all smaller than the GitHub filesize 
// limit (currently 100 MB) -- so since break-up is needed, why not
// also prep the data to save effort in Bike Planner? 
//
// The Divvy .csv files are *mostly* in start-time order, but this is
// not strict.  To insure monotonically increasing start-times in the
// database, all of the 'raw' .csv files are read, with resulting 
// 'good' records kept as POJOs in a single array. This array is then
// sorted.  
//
// To ensure space for working with the large number of records, the
// heap allocation is increased prior by invoking the program with:
//
//   node --max-old-space-size=8192 cleanDivvy.js 
// 
// Note that this is not an option for deployed applications, so yet
// another reason to pre-process the raw files before deployment.
//
// Start times are only kept with 1-minute resolution, so there are
// many records with non-unique start times. This is addressed after
// the sort by adding a sequential number of milliseconds to each 
// non-unique start time.  Suppose three records have the same start
// time. The ascending sort will have grouped them in the list:
// 
// Example:  Record   n, start(n)   == x
//           Record n+1, start(n+1) == x
//           Record n+2, start(n+2) == x
//
// Because x, now in units of milliseconds, originated from a time
// stamp in units of minutes, x is an even multiple of 60000.  So to
// establish unique, increasing timestamps, we can make the 
// following adjustments with no real impact to the start time.
//
// 1. observe start(n) >= start(n+1), 
//      assign start(n+1) = start(n)+1.
//    result: Record n+1 has start time x+1
//
// 2. observe start(n+1) >= start(n+2),
//      assign start(n+2) = start(n+1)+1.
//    result: Record n+2 has start time x+2
//
// Then all three records which had the same start-time in the 
// .csv file will have unique start times in the database.
// For this scheme to break, 60000 rides would have to have started
// in the same minute.  There aren't that many bikes.

  const fs       = require('fs');
  const path     = require('path');
  const readline = require('readline');

  const csvFiles = [
    "Divvy_Trips_2018_Q1",
    "Divvy_Trips_2018_Q2",
    "Divvy_Trips_2018_Q3",
    "Divvy_Trips_2018_Q4",
    "Divvy_Trips_2019_Q1",
    "Divvy_Trips_2019_Q2",
    "Divvy_Trips_2019_Q3",
    "Divvy_Trips_2019_Q4"
  ];

  const fileLimit = 100000;
  const wrHeader =
    'startTime,tripDuration,startStation,endStation,genderMale,birthYear';
  const totalTrips = 5827718;
  let trips        =  0;
  let tripsQueue   = [];
  var outLine      = '';
  var rdFile       = '';
  var rdFileBase   = '';
  var wrFilePrefix =  0;
  var wrFile       = '';
  var wrFileBase   = '';
  var fIndex       =  0;
  var lArr         = [];    

  function writeAFile() {
    wrFileBase = `${wrFilePrefix < 10? '0'+wrFilePrefix : wrFilePrefix}-Divvy.csv`;
    wrFilePrefix++;
    console.log(`--> ${wrFileBase}`);
    wrFile = path.join(__dirname,'chunked/' + wrFileBase);
    let records = 0;
    outLine = wrHeader + '\n';
    for (let i = 0; i < fileLimit && trips > 0; i++) {
      outLine += tripsQueue[i].startTime    + ',';
      outLine += tripsQueue[i].tripDuration + ',';
      outLine += tripsQueue[i].startStation + ',';
      outLine += tripsQueue[i].endStation   + ',';
      outLine += tripsQueue[i].genderMale   + ',';
      outLine += tripsQueue[i].birthYear    +'\n';
      trips--;
      records++;
    }
    fs.writeFileSync(wrFile,outLine);
    tripsQueue.splice(0,records);
    console.log(`*   ${wrFileBase}, ${trips} trips remaining.`);
  }

  // tCSVtoUTC() converts a Divvy timestamp to a UTC time in milliseconds.
  // With knowledge of the actual records, the Divvy trip id is used to look
  // for CDT <--> CST transitions.
  function tCSVtoUTC( id, s ) {
    const DSTtransitions = [
      17855346,  //      trip id < this number --> add 21600 seconds to get GMT
      21419851,  // else trip id < this number --> add 18000 seconds to get GMT
      22021259,  // else trip id < this number --> add 21600 seconds to get GMT
      25615852   // else trip id < this number --> add 18000 seconds to get GMT
                 // else                       --> add 21600 seconds to get GMT
    ];
    // input format of s is date and time like so: '2020-01-01 14:35'
    // slice & dice, shake & bake...and remember, JS months are offset by 1.
    let yr = parseInt(s.slice( 0, 4));
    let mo = parseInt(s.slice( 5, 7)) - 1;
    let dy = parseInt(s.slice( 8,10));
    let hr = parseInt(s.slice(11,13));
    let mn = parseInt(s.slice(14,16));
    // convert to a GMT date-time string as a waypoint towards seconds-since-1970.  
    let d = new Date(yr,mo,dy,hr,mn,0,0);
    // getTime() converts to milliseconds since 1970-01-01 00:00:00.000.
    let CentralTimeMs = d.getTime();
    // to get to absolute GMT time, we must adjust for timezone offset -- which
    // changes in Spring and Fall to/from Daylight Saving Time.
    // the 'fall back' transition produces ambiguous local time because the hour
    // from 0100 - 0200 repeats. To resolve this, the DSTtransitions array was
    // determined by inspecting the trips at the DST transitions in the Divvy files. 

    // Adjust so that the return value is GMT, a.k.a. UTC.
    if      (id < DSTtransitions[0]) {return(CentralTimeMs+21600000);}
    else if (id < DSTtransitions[1]) {return(CentralTimeMs+18000000);}
    else if (id < DSTtransitions[2]) {return(CentralTimeMs+21600000);}
    else if (id < DSTtransitions[3]) {return(CentralTimeMs+18000000);}
    else                             {return(CentralTimeMs+21600000);}  
  }

//* Start Execution ******************************************************

// dbWorker clock service - states of operation
const READ  = 1;
const SORT  = 2;
const WRITE = 3;
let   dbWorkerState = READ;

// timeout values for various operations
const T_CLOCK      =   0.5;
const T_READFILES  =  30.0;
const T_SORTFILES  = 300.0;
const T_WRITEFILE  =   5.0;

// timer service -- first timeout is set in cleanDivvy function
function dbWorker() {
  switch (dbWorkerState)
  {
    case READ:  
      // Reading occurs in the background. There's a long delay before
      // the first timer timeout - so nominally case READ only enters
      // once. 
      if (trips >= totalTrips) {
        console.log(`finished reading ${trips} trips.`)  
        dbWorkerState = SORT;
      }
      setTimeout(dbWorker,T_CLOCK*1000);
      break;
    case SORT:
      // all records in; ready to process the data  
      console.log(`starting sort; allocating ${T_SORTFILES} seconds`);

      // the next two statements cause the next timer timeout to go
      // to case WRITE -- so everything here is expected to be done
      // before T_SORTFILES seconds have expired.
      setTimeout(dbWorker,T_SORTFILES*1000);
      dbWorkerState = WRITE;

      // sort in ascending order of startTime
      tripsQueue.sort((a,b) => a.startTime - b.startTime);
      // now adjust duplicates to be unique -- see discussion
      // at top of file.
      let i = 0; 
      let j = 1;
      while (i < totalTrips-1) {
        if (tripsQueue[i].startTime >= tripsQueue[j].startTime) {
          tripsQueue[j].startTime = tripsQueue[i].startTime + 1;
        } 
        i++;
        j++;
      }
      // test it
      i = 0; 
      j = 1; 
      let e = 0;
      while (i < totalTrips-1) {
        if (tripsQueue[i].startTime >= tripsQueue[j].startTime) {
          e++;
          console.log(`@@@ record ${i}: startTime ${tripsQueue[i].startTime} exceeds next record startTime by ${tripsQueue[i].startTime - tripsQueue[j].startTime} ms.`);
        }
        i++;
        j++;
      }
      console.log(`sorting errors: ${e}`);
      filesToWrite = Math.ceil(totalTrips/fileLimit);
      break;
    case WRITE:
      if (filesToWrite) {
        console.log(`starting file write, ${filesToWrite} to go.`);
        filesToWrite--;
        setTimeout(dbWorker,T_WRITEFILE*1000);
        writeAFile();
      } else {
        console.log('final file written');
      }
    default: break;
  }
}

cleanDivvy(); function cleanDivvy() {
  console.log(`start the clock...${T_READFILES} s allocated for reading files`);  
  setTimeout(dbWorker,T_READFILES*1000);
  // outer for() loop to iterate through the supplied trip files
  for (fIndex = 0; fIndex < csvFiles.length; fIndex++) { 
    rdFileBase = `${csvFiles[fIndex]}.csv`;
    console.log(`<-- ${rdFileBase}`);
    rdFile = path.join(__dirname,rdFileBase);

    // this is a loop control statement.  the loop will iterate on each line in the input file.
    // the raw file columns are:
    //      0          1         2        3         4               5
    //   trip_id, start_time, end_time, bikeid, tripduration, from_station_id, 
    //
    //      6                     7             8              9        10       11
    //   from_station_name, to_station_id, to_station_name, usertype, gender, birthyear
    //
    readline.createInterface({input: fs.createReadStream(rdFile)}).on('line', (line) => {
      // CSV file, so split-on-comma to separate the cell contents into an array of strings
      lArr = line.split(',');    

      // ignore the header
      if (lArr[0] !== 'trip_id') {

        // handle the weirdness where tripDuration *sometimes* has quotes and an internal comma
        // (that's right, it violates CSV cell separation rules by using a comma that's not
        // a cell separator. )  our split-on-comma will have put this value into two locations,
        // so alignment of lArr and our output string will be off by one element.
        // Example -- instead of trip duration of '1891', the csv value is "1,891.00", giving
        // us '"1' and '891.00"'.  Ugly.  A leading " in the string tells us this happened.
        let dt = 0;
        if (lArr[4][0] !== '"') {
          // ahh, a 'normal' tripduration cell
          dt = Math.trunc(lArr[4]);
        } else {
          // ok, let's fix this. first, shove them back together
          let dtHi  = lArr[4];
          dtHi += lArr[5];
          // and get rid of those pesky double-quotes
          dtHi = dtHi.replace(/"/g,'');
          // then force the result to be an integer.
          dt = Math.trunc(dtHi);
          // and lastly, remove the 'extra' cell to restore order in the array!
          lArr.splice(4,1);
        }

        // ok, with a little prep work done, we're ready to validate the row
        // and, if it passes all tests, to assign this input row to the output.
        // so, if a Subscriber...
        if (lArr[9].toLowerCase() === 'subscriber') {
          let startTime = tCSVtoUTC(lArr[0],lArr[1]);
          if (startTime >= 1514805120000 && startTime < 1577876220003) {
            if (dt <= 28800) {                                               // 8 hour tripDuration limit
              if (lArr[5] && (lArr[5] > 0 && lArr[5] < 700)) {               // startStation must be in 1..699
                if (lArr[7] && (lArr[7] > 0 && lArr[7] < 700)) {             // endStation must be in 1..699
                  if (lArr[10]) {                                            // gender must be non-empty 
                    let gender = lArr[10].toLowerCase() === 'male'? 1:0;     // gender --> genderMale Boolean
                    if (lArr[11] && (lArr[11] > 1900 && lArr[11] < 2018)) {  // age must be in 2..110 
                      tripsQueue.push({
                        startTime    : startTime,
                        tripDuration : dt,
                        startStation : lArr[5],
                        endStation   : lArr[7],
                        genderMale   : gender,
                        birthYear    : lArr[11]
                      });
                      // count 'good' records
                      trips++;
                    }
                  }  
                }    
              }      
            }
          }   // end 'if (lArr[9]...'
        }   // end row validation
      }   // end check for file header
    }); // end '.on( 'line'...'
  };  // end for
}   // end chunkFiles