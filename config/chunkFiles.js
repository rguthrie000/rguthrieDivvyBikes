// chunkFiles.js - support tool for Bike Planner.  Filters, massages,
// and breaks up a Divvy trip file. Expected use is multiple runs of
// ChunkFiles to cover a set of Divvy trip files, e.g. four Quarterly
// Divvy Files to add one year of trip records.

// RUNS ONE FILE ONLY
//
// To re-run 2018-2019 files:
//   1. EDIT csvFiles[] TO ONLY HAVE ONE NON-COMMENTED FILENAME, AND
//   2. SET var wrFilePrefix TO THE CORRESPONDING STARTING INDEX.
//   (SEE EXAMPLE BELOW)
//
// For new files, first time:
//   1. Change the single filename in csvFiles[] to the first 
//      (earliest trips) filename (no extension) in the new set. 
//   2. Set var wrFilePrefix to 0
//   3. Run the program, observe the highest file prefix created
//   4. Edit the csvFiles[] filename to the next filename
//   5. Set wrFilePrefix to one more than the highest file prefix
//      created on the previous run.
//   6. Run the program, observe the highest file prefix created
//   7. Repeat steps 4-6 for remaining new files.
//   8. To make maintenance convenient, save this information by 
//      adding new filenames to csvFiles[] and starting indexes
//      to wrFilePrefix.
//   9. Edit the Bike Planner server checkModel.js file for the
//      file prefix assignments you found in this process.
//
// Todo (20200223):
//   1. Establish looping capability by using timer to control
//      management of file reads and writes.
//   3. Provide fully sorted files. Currently, checkModel() in
//      the server loads all of the chunkFiles output files,
//      sorts the records set, and resolves duplicate startTimes
//      *before* starting a DB load. If the fileset was known
//      to be fully ordered, file reading and DB loading could
//      be performed in parallel.

const csvFiles = [

// PICK ONE OF THESE

    "Divvy_Trips_2018_Q1"
    // "Divvy_Trips_2018_Q2"
    // "Divvy_Trips_2018_Q3"
    // "Divvy_Trips_2018_Q4"
    // "Divvy_Trips_2019_Q1"
    // "Divvy_Trips_2019_Q2"
    // "Divvy_Trips_2019_Q3"
    // "Divvy_Trips_2019_Q4"
  ];

// AND UNCOMMENT THE MATCHING FILE PREFIX var HERE

  var wrFilePrefix =  0;
  // var wrFilePrefix =  4;
  // var wrFilePrefix = 13;
  // var wrFilePrefix = 25;
  // var wrFilePrefix = 31;
  // var wrFilePrefix = 35;
  // var wrFilePrefix = 44;
  // var wrFilePrefix = 56;

  const fs       = require('fs');
  const path     = require('path');
  const readline = require('readline');

  const fileLimit = 100000;
  const wrHeader =
    'startTime,tripDuration,startStation,endStation,userType,genderMale,birthYear';
  const rdHeader = 
    'trip_id,start_time,end_time,bikeid,tripduration,from_station_id,from_station_name,to_station_id,to_station_name,usertype,gender,birthyear';
  var records      = 0;
  var recordsArr   = [];
  var outLine      = '';
  var rdFile       = '';
  var rdFileBase   = '';
  var wrFile       = '';
  var wrFileBase   = '';
  var fIndex       = 0;
  var prefix       = '';
  var lArr         = [];    
  var dt           = 0;
  var dtHi         = '';

  function writeRecords() {
    prefix = wrFilePrefix < 10? '0'+wrFilePrefix : wrFilePrefix;
    wrFilePrefix++;
    wrFileBase = `${prefix}-${rdFileBase}`;
    wrFile = path.join(__dirname,'chunked/' + wrFileBase);

    recordsArr.sort((a,b) => a.startTime - b.startTime);
    outLine = wrHeader + '\n';
    for (let i = 0; i < records; i++) {
      let ofs = 0;
      for (let j = i + 1; j < records; j++) {
        if (recordsArr[i].startTime == recordsArr[j].startTime) {
          recordsArr[j].startTime += ++ofs;
        }  
      }
      addToLine(recordsArr[i]);
    }
    console.log(`--> ${wrFileBase}, ${records} trips`);
    fs.writeFileSync(wrFile,outLine);
    console.log(`*   ${wrFileBase}`);
  }

  function addToLine(obj) {
    outLine += obj.startTime    + ',';
    outLine += obj.tripDuration + ',';
    outLine += obj.startStation + ',';
    outLine += obj.endStation   + ',';
    outLine += obj.genderMale   + ',';
    outLine += obj.birthYear    +'\n';
  }

  function threeUniqueMinutes() {
    let end = recordsArr.length - 1;
    lastStart       = Math.floor(0.001*recordsArr[end  ].startTime);
    firstPrevStart  = Math.floor(0.001*recordsArr[end-1].startTime);
    secondPrevStart = Math.floor(0.001*recordsArr[end-2].startTime);
    return( 
      (lastStart      !==  firstPrevStart) && 
      (lastStart      !== secondPrevStart) && 
      (firstPrevStart !== secondPrevStart)
    );
  }

  function tCSV( id, s ) {

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
    let CentralTimeSec = Math.floor(d.getTime());
    // to get to absolute GMT time, we must adjust for timezone offset -- which
    // changes in Spring and Fall to/from Daylight Saving Time.
    // the 'fall back' transition produces ambiguous local time because the hour
    // from 0100 - 0200 repeats. To resolve this, the DSTtransitions array was
    // determined by inspecting the trips at the DST transitions in the Divvy files. 
    if      (id < DSTtransitions[0]) {return(CentralTimeSec+21600000);}
    else if (id < DSTtransitions[1]) {return(CentralTimeSec+18000000);}
    else if (id < DSTtransitions[2]) {return(CentralTimeSec+21600000);}
    else if (id < DSTtransitions[3]) {return(CentralTimeSec+18000000);}
    else                             {return(CentralTimeSec+21600000);}  
  }

//* Start Execution ******************************************************

chunkFiles(); function chunkFiles() {
  // outer for loop to iterate through the supplied trip files
  // for (fIndex = 0; fIndex < csvFiles.length; fIndex++) { 
    // at each file transition, align file writing with file reading
    rdFileBase = `${csvFiles[fIndex]}.csv`;
    rdFile = path.join(__dirname,rdFileBase);
    console.log(`<-- ${rdFileBase}`);

    let startTimeOld = 0;
    let startTimeOfs = 0;

    // this loop will run on each line in the input file
    readline.createInterface({input: fs.createReadStream(rdFile)}).on('line', (line) => {
      // CSV file, so split-on-comma to separate the cell contents into an array of strings
      lArr = line.split(',');    

      // handle the weirdness where tripDuration *sometimes* has quotes and an internal comma
      // (that's right, it violates CSV cell separation rules by using a comma that's not
      // a cell separator. )  our split-on-comma will have put this value into two locations,
      // so alignment of lArr and our output string will be off by one element.
      // Example -- instead of trip duration of '1891', the csv value is "1,891.00", giving
      // us '"1' and '891.00"'.  Ugly.  A leading " in the string tells us this happened.
      if (lArr[0] !== 'trip_id') {
        if (lArr[4][0] !== '"') {
          // ahh, a 'normal' tripduration cell
          dt = lArr[4];
        } else {
          // ok, let's fix this. first, shove them back together
          dtHi  = lArr[4];
          dtHi += lArr[5];
          // and get rid of those pesky double-quotes
          dtHi = dtHi.replace(/"/g,'');
          // then force the result to be an integer.
          dt = parseInt(dtHi);
          // and lastly, remove the 'extra' cell to restore order in the array!
          lArr.splice(4,1);
        }

        // ok, with a little prep work done, we're ready to validate the row
        // and, if it passes all tests, to assign this input row to the output.
        // so, if a Subscriber...
        if (lArr[9].toLowerCase() === 'subscriber') {
          let startTime = tCSV(lArr[0],lArr[1]);
          // we are making startTimes unique by incrementing the startTime for
          // each repeated value. (startTime is in milliseconds, so the distortion
          // of time is negligible.)
          if (!startTimeOld) {
            startTimeOld = startTime;
          } else {  
            if (startTime == startTimeOld) {
              startTime += ++startTimeOfs;
            } else {
              startTimeOld = startTime;
              startTimeOfs = 0;
            }
          }
          if (startTime >= 1514805120000 && startTime < 1577876220003) {
            if (dt <= 28800) {                                               // 8 hour limit
              if (lArr[5] && (lArr[5] > 0 && lArr[5] < 700)) {               // must be in 1..699
                if (lArr[7] && (lArr[7] > 0 && lArr[7] < 700)) {             // must be in 1..699
                  if (lArr[10]) {                                            // must be non-empty 
                    let gender = lArr[10].toLowerCase() === 'male'? 1:0;     // true if male
                    if (lArr[11] && (lArr[11] > 1900 && lArr[11] < 2018)) {  // age must be in 2..110 
                      recordsArr.push({
                        startTime    : startTime,
                        tripDuration : dt,
                        startStation : lArr[5],
                        endStation   : lArr[7],
                        genderMale   : gender,
                        birthYear    : lArr[11]
                      });
                      records++;
                    }
                  }  
                }    
              }      
            }        
          }
        }
        // when records is at fileLimit, time to write a file.
        // but don't split files when seconds are being adjusted
        if (records >= fileLimit && threeUniqueMinutes()) {
          let lastRecord = recordsArr[records-1];
          records--;
          console.log(`    ${records} dispatch for write`);
          writeRecords();
          records = 1;
          recordsArr = [];
          recordsArr.push(lastRecord);
        }
      }
    }); // end .on( 'line'...
    setTimeout(writeRecords,180000);
  // }; // end for
}   // end chunkFiles