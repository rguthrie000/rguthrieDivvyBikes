// checkModel() - counts records in Trips and Stations tables, and loads them if
// not full. Offers a dbReady() function to report whether the tables are fully
// loaded in the db. Look for MAINTAIN string below for anticipated maintenance
// points when database changes

const fs         = require('fs');
const path       = require('path');
const readline   = require('readline');
const csv        = require('csv-parser');
const db         = require("../models");
const debug      = require("../debug");

let dbReadyState = {
    UsersCollection    : false,
    StationsCollection : false,
    TripsCollection    : true,
    tripsCount         : 0,
    totalTrips         : 0,
    trips              : 0,
    tripsToLoad        : 0,
    inQ                : 0,
    tripsPosting       : 0,
}

// dbWorker variables used in status reporting
const totalTrips    = 5827718; // MAINTAIN - records in the Trips Collection
let   tripsCount    = 0;       // initial count in Trips Collection
let   trips         = 0;       // cumulative count of Divvy trip records
let   tripsToLoad   = 0;       // trips goal for the files opened
let   tripsPosting  = 0;       // count in-process records at MongoDB
let   tripsQueue    = [];      // internal Q for buffering records

module.exports = {

  dbReady : () => {
    dbReadyState = {
      ...dbReadyState,
      totalTrips   : totalTrips,
      tripsCount   : tripsCount,
      trips        : trips,
      tripsToLoad  : tripsToLoad,
      inQ          : tripsQueue.length,
      tripsPosting : tripsPosting
    };
    return(dbReadyState);
  },

  checkModel : () => {

    // dbWorker variables which aren't part of status reporting
    const totalStations = 611;    // MAINTAIN
    const totalChunks   = 59;     // MAINTAIN count of 'chunked' files
    const chunkFileRecs = 100000; // default number of records per chunkfile
    let   chunksToLoad  = 0;      // down-counter for files not yet loaded
    let   tHandle;                // timer handle; saved at timer registration

    // dbWorker machine parameters
    const intervalTimeMs     = 500;   // run each half-second (2 Hz)
    const tripsPostingTopOff = 10000; // on each service, top-up the count
    const mongoPacketLimit   = 1000;  // per mongo docs

    // startDBworker() initializes dbWorker, which wakes periodically to 
    // supervise the process of fetching files and regulating the submission
    // of their records to MongoDB.  
    function startDBworker() {
      // start the interval timer
      tHandle = setInterval(dbWorker,intervalTimeMs);
      if (debug) {console.log('dbWorker started');}
      // init the file down-counter
      chunksToLoad = totalChunks;
      // start the first file read. note post-decrement of chunksToLoad.
      loadAFile(totalChunks - chunksToLoad--);
      tripsToLoad = chunkFileRecs;
    }

    // dbWorker() is the periodic service for the DB loading process. 
    // 1. the number of records in process by the db server is 'topped off'
    //    for the next interval by posting records from the queue. 
    // 2. the queue is kept stocked from the files
    // 3. the process is supervised until all of the record posts have been
    //    acknowledged by the db server.
    function dbWorker() {
      // where do we stand?
      let inQ = tripsQueue.length;
      if (debug) {
        console.log(`dbWorker: trips ${trips} tripsToLoad ${tripsToLoad} inQ ${inQ} inPost ${tripsPosting}`);
      }
      while (tripsPosting < tripsPostingTopOff && inQ > 0) {
        // MongoDB will take 'insertMany' of mongoPacketLimit records without
        // incurring extra management on their side.  So make as many posts of
        // mongoPacketLimit as needed to have at least tripsPostingTopOff total
        // records pending with MongoDB.
        let postCt = (inQ >= mongoPacketLimit ? mongoPacketLimit : inQ);
        if (postCt > 0) {
          postMongoPacket(postCt);
        }  
        // and track them coming out of tripsQueue
        inQ -= postCt;
      }  
      if (inQ < chunkFileRecs && 
          chunksToLoad > 0      && 
         (tripsToLoad - trips < chunkFileRecs)) {
        let filePrefix = totalChunks - chunksToLoad--;
        tripsToLoad += filePrefix < totalChunks-1? 
          chunkFileRecs : (totalTrips % chunkFileRecs);
        loadAFile(filePrefix);
      }
      if (!chunksToLoad && !inQ && !tripsPosting) {
        if (debug) {console.log(`Trips: loaded.`);}
        clearInterval(tHandle);
        dbReadyState.TripsCollection = true;
        trialQuery();
      }
    }

    // postMongoPacket() dequeues records from the internal queue and posts
    // them to the db server.
    function postMongoPacket(count) {
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

    // loadAFile() uses the indicated filename prefix to open a file, read
    // and filter its records, and push the screened records into the queue. 
    function loadAFile(fileCtr) {
      // use secret decoder to get the filename for this iteration
      let rdFileBase = `${fileCtr < 10? '0':''}${filectr}-Divvy.csv`;
      if (debug) {console.log(`${rdFileBase} --> inQ`);}         
      let rdFile = path.join(__dirname,`./chunked/${rdFileBase}`);

      // this loop will run on each line in the input file
      let lArr = [];
      readline.
      createInterface({input: fs.createReadStream(rdFile)}).
      on('line', (line) => {
        lArr = line.split(',');
        // map from file columns to database properties 
        // (see '../models/index.js').
        if (lArr[0] !== 'startTime') {
          tripsQueue.push({
            startTime    : lArr[0],
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

      // Trips trial
      // structure a query using the first record in the Collection
      const queryCheck = {
        startTime     : 1514805120000,    //MAINTAIN (all properties)
        tripDuration  : 323,              
        startStation  : 69,
        endStation    : 159,
        genderMale    : 1,
        birthYear     : 1988
      };

      let ms = queryCheck.startTime;
      db.Trips.find({
        startTime   : queryCheck.startTime
      }).
      exec( (err, res) => {
        if (err) {
          dbReadyState.TripsCollection = false;
        } else {
          if (!res.length) {
            dbReadyState.TripsCollection = false;
            if (debug) {
              console.log('Trips: trial query failed - response empty.');
            }
          } else {
            if (  
              res[0].startTime    == queryCheck.startTime    && 
              res[0].tripDuration == queryCheck.tripDuration &&
              res[0].startStation == queryCheck.startStation && 
              res[0].endStation   == queryCheck.endStation   &&
              res[0].genderMale   == queryCheck.genderMale   && 
              res[0].birthYear    == queryCheck.birthYear     ) {
            } else {  
              if (debug) {
                console.log(res,'Trips: trial failed - response incorrect.');
              }
              dbReadyState.TripsCollection = false;
            }
          }
        } // end Trips trial 
        // Stations trial
        db.Stations.find({}).exec( (err, data) => {
          if (err) {
            if (debug) {console.log(err,'Stations: trial failed - error.');}
            dbReadyState.StationsCollection = false;
          } else {
            if (data.length != totalStations) {
              if (debug) {console.log('Stations: trial failed - Stations.');}
              dbReadyState.StationsCollection = false;
            }
          } // end Stations trial
        }); // end Stations trial promise
      }); // end Trips trial promise  
    }

    //* Start of Execution ***************
    
    //* Users ****************************

    db.Users.countDocuments({}, (e,usersCt) => {
      if (debug) {
        console.log(
          `Users:          ${usersCt}${usersCt < 1? ', need at least 1':''}`
        );
      }
      if (usersCt >= 1) {
        dbReadyState.UsersCollection = true;
      } else {
        // Users is empty. Need 1 user for a trial Query! 
        db.Users.create({
          userName   : 'ChicagoDog',
          password   : 'ViennaBeef',
          genderMale : 1,
          birthYear  : 1959
        })
        .then((err,rowsAffected) => {
          // rowsAffected is an array whose first element is the number of rows
          // affected. here we expect either creation of one row, or zero rows
          // if the userName is not unique. 
          dbReadyState.UsersCollection = rowsAffected? true : false;
          if (debug) {console.log(`Users:    Loaded (created 'ChicagoDog').`)}
        })
        .catch( (err) => {
          if (debug) {console.log(err);}
          dbReadyState.UsersCollection = false;
        });
      }
    });  

    //* Stations *************************

    // evaluate the Stations model. 
    // nothing to do if all of the records are present
    db.Stations.countDocuments({}, (e,statCt) => {
      if (debug) {
        console.log(
          `Stations:     ${statCt}`);
        console.log(`${statCt<totalStations? `need ${totalStations}`:''}`);
      }
      if (statCt == totalStations) {
        dbReadyState.StationsCollection = true;
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
                  dbReadyState.StationsCollection = true;
                }
              });
            })
        });  // end sync complete callback
      }    // end if (stationsCount...
    });  // end count complete callback

  //* Trips ******************************

    // check the Trips model. 
    db.Trips.countDocuments({}, (e,count) => {
      if (debug) {
        console.log(
          `Trips:    ${count}${count>=totalTrips? '' : `, need ${totalTrips}`}`
        );
      }  
      tripsCount = count;
      if (tripsCount >= totalTrips) {
        dbReadyState.TripsCollection = true;
        trialQuery();
      } else {  
        // Trips is either empty or missing records. 
        // deleteMany({}) will truncate Trips, but will take a long time
        // if Trips was nearly full.  So avoid deleteMany if possible;
        // i.e. if count is already 0, don't deleteMany({}).
        if (!tripsCount) {
          // use dbWorker to regulate the process of fetching records from 
          // files and sending them to MongoDB.
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

 