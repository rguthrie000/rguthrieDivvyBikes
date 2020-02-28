// checkModel() - counts records in Trips and Stations tables, and loads them if not full.
// Offers a dbReady() function to report whether the tables are fully loaded in the db.

const fs         = require('fs');
const path       = require('path');
const readline   = require('readline');
const csv        = require('csv-parser');
const db         = require("../models");
const debug      = require("../debug");

const dbReadyState = {
    Users       : false,
    Stations    : false,
    Trips       : false,
    TripsSorted : true
}

module.exports = {

  dbReady : () => {
    return(dbReadyState)
  },

  checkModel : () => {

    // desired number of records in the Stations and Trips tables/models
    const totalStations = 611;
    const totalTrips    = 5827718;

    // dbWorker variables
    const totalChunks   = 62;   // count of files which collectively comprise 2018-2019 Divvy trip records
    let   chunksToLoad  = 0;    // down-counter for files remaining to be loaded
    let   trips         = 0;    // cumulative count of desired records from Divvy trip records
    let   tripsPosting  = 0;    // count of records which are in-process with the MongoDB server
    let   tripsQueue    = [];   // internal Q for buffering file records destined for MongoDB
    let   startTimeOld  = 0;
    let   sortErrors    = 0;

    const LOADING_CHUNKS    = 0;
    const WAITING_FOR_TRIPS = 1;
    const SORTING           = 2;
    const POSTING           = 3;
    let   dbWorkerState     = LOADING_CHUNKS;

    // startDBworker() initializes dbWorker, which wakes periodically to supervise the process
    // of fetching files and regulating the submission of their records to MongoDB.  
    function startDBworker() {
      // start the interval timer
      setTimeout(dbWorker,500);
      if (debug) {console.log('dbWorker started');}
      // init the file down-counter
      chunksToLoad = totalChunks;
      // start the first file read. note post-decrement of chunksToLoad.
      loadAFile(totalChunks - chunksToLoad--);
    }

    // dbWorker() is the periodic service for the DB loading process. 
    // 1. the number of records in process by the db server is 'topped off'
    //    for the next interval by posting records from the queue. 
    // 2. the queue is kept stocked from the files
    // 3. the process is supervised until all of the record posts have been
    //    acknowledged by the db server.
    function dbWorker() {
      // where do we stand?
      switch (dbWorkerState) {
        case LOADING_CHUNKS:
          loadAFile(totalChunks - chunksToLoad--);
          if (!chunksToLoad) {
            dbWorkerState = WAITING_FOR_TRIPS;
          }
          setTimeout(dbWorker,500);
          break;
        case WAITING_FOR_TRIPS:
          if (debug) {console.log(`trips loaded: ${trips}. sort errors ${sortErrors}`);}
          if (trips < totalTrips) {
            setTimeout(dbWorker,500);
          } else {
            if (sortErrors) {
              if (debug) {console.log('starting sort');}
              setTimeout(dbWorker,120000);  // 2 minutes
              tripsQueue.sort((a,b) => a.startTime - b.startTime);
              // fix it
              let j = 1;
              for (let i = 0; i < trips-1;) {
                if (tripsQueue[i].startTime >= tripsQueue[j].startTime) {
                  tripsQueue[j].startTime += 50;
                } else {
                  i++;
                  j++;
                }
              }
              // test it
              j = 1;
              for (let i = 0; i < trips-1;) {
                if (tripsQueue[i].startTime >= tripsQueue[j].startTime) {
                  dbReadyState.TripsSorted = false;
                  if (debug) {console.log(`${tripsQueue[i].startTime - tripsQueue[j].startTime}`);}
                } else {
                  i++;
                  j++;
                }
              }
              dbWorkerState = SORTING;
            } else {
              setTimeout(dbWorker,500);
              dbWorkerState = POSTING;
            }
          }  
          break;
        case SORTING:
          if (debug) {console.log('end of long wait');}
          dbWorkerState = POSTING;
          setTimeout(dbWorker,500);
          break;
        case POSTING:
          let inQ = tripsQueue.length;
          if (debug) {
            console.log(
              `POSTING: trips ${trips} inQ ${inQ} inPost ${tripsPosting}`
            );
          }
          // load up MongoDB for the next interval
          while (tripsPosting < 10000 && inQ > 0) {
            // MongoDB will take 'insertMany' of 1000 records without incurring 
            // extra management on their side.  So make as many posts of 1000 as
            // needed to have at least 10000 total records pending with MongoDB.
            let postCt = (inQ >= 1000 ? 1000 : inQ);
            if (postCt > 0) {
              postAThousand(postCt);
            }  
            // and track them coming out of tripsQueue
            inQ -= postCt;
          }  
          if (inQ == 0 && tripsPosting == 0) {
            if (debug) {console.log('Trips: loaded.');}
            dbReadyState.Trips = true;
            trialQuery();
          } else {
            setTimeout(dbWorker,500);
          }
          break;
      }
    }

    // postAThousand() dequeues records from the internal queue and posts
    // them to the db server.
    function postAThousand(count) {
      // simple queue implementation; dequeue from the front using
      // slice() to get to a named piece of the array suitable for the 
      // database post, then using splice() to remove those records
      // from the front of the queue.
      let submittalArr = tripsQueue.slice(0,count);
      tripsQueue.splice(0,count);
      // track the count in going in...
      tripsPosting += count;
      db.Trips.insertMany(submittalArr, () => {
        // ...and track them when reported done.
        tripsPosting -= count;
      });
    }

    // genDivvyFilename() takes a file indicator and uses it to name the 
    // corresponding file from the set of files comprising the trip records.
    function genDivvyFilename(fileIndicator) {
      if ((fileIndicator < 0) || (fileIndicator > totalChunks-1)) 
        {return(`genDivvyFilename: argument ${fileIndicator} is out of range 0 - ${totalChunks-1}`);}

      if (fileIndicator <  4) {return(`0${fileIndicator}-Divvy_Trips_2018_Q1.csv`);}
      if (fileIndicator < 13) {return( `${fileIndicator<10? '0'+fileIndicator:fileIndicator}-Divvy_Trips_2018_Q2.csv`);}
      if (fileIndicator < 25) {return( `${fileIndicator}-Divvy_Trips_2018_Q3.csv`);}
      if (fileIndicator < 31) {return( `${fileIndicator}-Divvy_Trips_2018_Q4.csv`);}
      if (fileIndicator < 35) {return( `${fileIndicator}-Divvy_Trips_2019_Q1.csv`);}
      if (fileIndicator < 44) {return( `${fileIndicator}-Divvy_Trips_2019_Q2.csv`);}
      if (fileIndicator < 56) {return( `${fileIndicator}-Divvy_Trips_2019_Q3.csv`);}
      if (fileIndicator < 62) {return( `${fileIndicator}-Divvy_Trips_2019_Q4.csv`);}
    }

    // loadAFile() uses the indicated filename prefix to open a file, read
    // and filter its records, and push the screened records into the queue. 
    function loadAFile(fileCtr) {
      // use secret decoder to get the filename for this iteration
      let rdFileBase = genDivvyFilename(fileCtr);
      if (debug) {console.log(`${rdFileBase} --> inQ`);}         
      let rdFile = path.join(__dirname,`./chunked/${rdFileBase}`);
      // this loop will run on each line in the input file
      let lArr = [];

      readline.createInterface({input: fs.createReadStream(rdFile)}).on('line', (line) => {
        lArr = line.split(',');
      // fs.createReadStream(rdFile).pipe(csv()).on('data', (line) => {
        // map from file columns to database properties (see '../models/trips.js').
        // note exclusion of userType, which is always '1' (because the CSV has already been purged
        // of non-subscribers).  
        if (lArr[0] !== 'id' && lArr[0] !== 'startTime') {
          let startTime = lArr[0];
          if (!startTimeOld) {
            startTimeOld = startTime;
          } else {
            if (startTimeOld >= startTime) {
              sortErrors++;
              if (debug) {console.log(`non-inc at ${trips} in ${rdFileBase}; ${startTime} <= ${startTimeOld}`)}
            } 
            startTimeOld = startTime; 
          }
          tripsQueue.push({
            startTime    : startTime,
            tripDuration : lArr[1],
            startStation : lArr[2],
            endStation   : lArr[3],
            genderMale   : lArr[4],
            birthYear    : lArr[5]
          });
          trips++;
        }
      });
    }

    function trialQuery() {

      if (debug) {console.log('trial queries');}

      // Trips trial
      const queryCheck = {
        startTime     : 1561689720013,
        tripDuration  : 463,
        startStation  : 181,
        endStation    : 111,
        genderMale    : 0,
        birthYear     : 1993
      };

      // structure a query which is known to match only one record in the DB.
      let ms = 1561689720013;
      db.Trips.find({
        startTime   : { $gte: ms - 15*6000, $lte: ms + 15*6000+100 },
        birthYear   : { $gte:  1950, $lte:  2000 },
        startStation: 181,
        endStation  : 111,
        genderMale  : 0
      }).
      sort({ startTime: 1 }).
      // select({ tripDuration: 1, _id: 0 }).
      // , startStation: 0, endStation: 0, genderMale:0, birthYear: 0 , _id: 0}).
      exec( (err, res) => {
        if (err) {
          dbReadyState.Trips = false;
        } else {
          if (
              res[0].startTime    == queryCheck.startTime    && 
              res[0].tripDuration == queryCheck.tripDuration &&
              res[0].startStation == queryCheck.startStation && 
              res[0].endStation   == queryCheck.endStation   &&
              res[0].genderMale   == queryCheck.genderMale   && 
              res[0].birthYear    == queryCheck.birthYear     ) {
            if (debug) {
              console.log(res,'\nTrips: trial query successful');
            } else {
              dbReadyState.Trips = false;
            }
          }
        } // end Trips trial 
        // Stations trial
        db.Stations.find({}).exec( (err, data) => {
          if (err) {
            if (debug) {console.log(err);}
            dbReadyState.Stations = false;
          } else {
            if (data.length == totalStations) {
              if (debug) {
                console.log(data[0]);
                console.log(`...and ${data.length-1} more.`)
                console.log('\nStations: trial query successful');
              }
            } else {
              dbReadyState.Stations = false;
            }
          } // end Stations trial
        }); // end Stations trial promise
      }); // end Trips trial promise  
    }

    //* Start of Execution ***************
    
    //* Play area ************************

          // < JS execution sandbox ></JS>

    //* Users ****************************

    db.Users.countDocuments({}, (e,usersCount) => {
      if (debug) {
        console.log(
          `Users:          ${usersCount}${usersCount < 1? ', need at least 1':''}`
        );
      }
      if (usersCount >= 1) {
        dbReadyState.Users = true;
      } else {
        // Users is empty. Need 1 user for a trial Query! 
        db.Users.create({
          userName   : 'ChicagoDog',
          password   : 'ViennaBeef',
          genderMale : 1,
          birthYear  : 1959
        })
        .then((err,rowsAffected) => {
          // rowsAffected is an array whose first element is the number of rows affected.
          // here we expect either creation of one row, or zero rows if the userName
          // is not unique. 
          dbReadyState = rowsAffected[0] > 0 ? true : false;
          if (debug) {console.log(`Users:    Loaded (created user 'ChicagoDog').`)}
        })
        .catch( (err) => {
          if (debug) {console.log(err);}
          dbReadyState.Users = false;
        });
      }
    });  

    //* Stations *************************

    // evaluate the Stations model. 
    // nothing to do if all of the records are present
    db.Stations.countDocuments({}, (e,stationsCount) => {
      if (debug) {
        console.log(
          `Stations:     ${stationsCount}${stationsCount<totalStations? `, need ${totalStations}`:''}`
        );
      }
      if (stationsCount == totalStations) {
        dbReadyState.Stations = true;
      } else {
        // Stations is either empty or missing records. 
        // deleteMany() will truncate Stations...which
        // is not necessary if stationsCount == 0, but
        // is very fast for this small table.
        db.Stations.deleteMany({}).then( () => {
          let stations = 0;
          let file = path.join(__dirname,'Divvy_Bicycle_Stations.csv');
          if (debug) {console.log('Stations: <-- Divvy_Bicycle_Stations.csv');}
          // this line opens the file, and based on the first line assigns
          // header names to columns. it is also the control for a loop on 
          // records in the file. each record is presented as 'line'.
          fs.createReadStream(file).pipe(csv()).on('data', (line) => {
              stations++;
              // map the record and post the creation request
              db.Stations.create({
                stationId     : line[          'ID'],
                stationName   : line['Station Name'],
                docks         : line[ 'Total Docks'],
                stationLat    : line[    'Latitude'],
                stationLon    : line[   'Longitude']
              }).then(() =>{
                // done when all requests have been processed
                if (--stations == 0) {
                  if (debug) {console.log('Stations: loaded.');}
                  dbReadyState.Stations = true;
                }
              });
            })
        });  // end sync complete callback
      }    // end if (stationsCount...
    });  // end count complete callback

  //* Trips ******************************

    // check the Trips model. 
    db.Trips.countDocuments({}, (e,tripsCount) => {
      if (debug) {
        console.log(
          `Trips:    ${tripsCount}${tripsCount>=totalTrips? '' : `, need ${totalTrips}`}`
        );
      }  
      if (tripsCount >= totalTrips) {
        dbReadyState.Trips = true;
        trialQuery();
      } else {  
        //Trips is either empty or missing records. 
        //deleteMany({}) will 'clean-slate' Trips, but will take a long time
        //if Trips was nearly full.  So avoid deleteMany if possible.
        if (!tripsCount) {
          // use dbWorker to regulate the process of fetching records from files
          // and sending them to MongoDB.
          startDBworker();
        } else {  
          if (debug) {console.log('Trips: truncating');}
          db.Trips.deleteMany({}).then( () => {
            //ok, clean sheet. Use timer to meter in trips chunk by chunk.
            if (debug) {console.log('Trips: truncated');}
            startDBworker();
          });  
        }
      }
    }); 
        
  }  

}

 