import React, {useState, useEffect} from "react";
import tripsAPI                     from "./utils/tripsAPI";
import geoMath                      from "./utils/geoMath";
import SearchForm                   from "./components/SearchForm";
import MapCard                      from "./components/MapCard";
import TripsChart                   from "./components/TripsChart";
import {getTimeStr,getTimeFlags}    from "./utils/timeSvcs";
import {debug}                      from "./debug"
import "./App.css";

let queryWait = false;
let waitTimer = 0;

export default function App() {

//******************
//*   State Data   *
//******************
  
  const [searchOptions,setSearchOptions] = useState({
      chooseStart  : true,
      useTime      : false,
      useProfile   : false,
      waitForQuery : false,
      waitTime     : 0
  });

  // Station list. A station:
  // {
  //   stationId   : < one of 611 numbers in 2..673 (not all values are used) >
  //   stationName : < string, descriptive of station location, e.g. an intersection or landmark>
  //   docks       : < bikes capacity >
  //   stationLat  : < latitude, a real number in 41.736646 - 42.064854, numbers are larger going North>
  //   stationLon  : < longitude, a real number in -87.774704 - -87.54938625, numbers are more negative going West>
  // }   
  const [stations,setStations] = useState({
    populated      : false,
    centerSkew     : geoMath.centerSkew(),
    startIndex     : 564,
    endIndex       : 299,
    list           : [],
    latitude       : geoMath.randLat(),
    longitude      : geoMath.randLoc().lon,
    minStationDist : 0.0
  });

  const [timeAndDate,setTimeAndDate] = useState({
    timeStr     : '',
    isWeekday   : 0,
    isOvernight : 0,
    isMorning   : 0,
    isAfternoon : 0,
    isEvening   : 0
  });

  const [statsAndCharts,setStatsAndCharts] = useState({
    minDuration    : '',
    maxDuration    : '',
    trips          : '',
    modeDuration   : '',
    nextBin        : '',
    stdDevDuration : '',
    labels         : [],
    binTrips       : []
  });

  const DB_BAD             = 0;
  const DB_GOOD            = 1;
  const DB_UNKNOWN         = 2;
  const DB_TRIPSLOADING    = 3;
  const [dbOkay,setDbOkay] = useState();

//******************
//*   Functions    *
//******************
  // When ready...
  useEffect( () => {
      if (!stations.list.length) {
        setInterval(clock,1000);
        setDbOkay(DB_UNKNOWN);
        tripsAPI.getDBready(dbReadyResponse);
        tripsAPI.getStations(setStationsList);
      }
    },
    // no monitoring  
    []
  );      

  function setStationsList(stationArr) {
    tripsAPI.getDBready(dbReadyResponse);
    let closestStation = geoMath.findClosestStation(stations.latitude,stations.longitude,stationArr);
    setStations({
      ...stations,
      populated      : true, 
      list           : stationArr,
      minStationDist : closestStation.minDist,
      startIndex     : closestStation.minIndex
    });
  }

  function dbReadyResponse(r) {
    if (debug) {console.log(JSON.stringify(r));}
    if (r.UsersCollection && r.StationsCollection && r.TripsCollection) {
      setDbOkay(DB_GOOD);
    } else {
      // not all good, no hope if either Users or Stations is false
      if (!r.UsersCollection || !r.StationsCollection) {
        setDbOkay(DB_BAD);
      } else {
        // TripsCollection is false. Is it because we're loading?
        if (r.tripsPosting || r.inQ) {
          setDbOkay(DB_TRIPSLOADING);
        } else {
          // oh well.
          setDbOkay(DB_BAD);
        } 
      }
    }
  }  

  function whereAmI(event) {
    event.preventDefault();
    console.log('setting queryWait');
    let loc = geoMath.randLoc();
    let lat = loc.lat;
    let lng = loc.lon;
    let closestStation = geoMath.findClosestStation(lat,lng,stations.list);
    let startId = stations.list[closestStation.minIndex].stationId;
    let endId = stations.list[stations.endIndex].stationId;
    tripsAPI.getDBready(dbReadyResponse);
    if (dbOkay === DB_GOOD) {
      setSearchOptions({...searchOptions, waitForQuery : true, waitTime : 0});
      queryWait = true;
      waitTimer = 0;
      tripsAPI.getTrips(startId,endId,searchOptions,processTrips);
    }  
    setStations({
      ...stations,
      latitude       : lat,
      longitude      : lng,
      minStationDist : closestStation.minDist,
      startIndex     : closestStation.minIndex
    }); 
    if (debug) {console.log(`random start: lat ${lat}, lon ${lng}; startStation ${startId}, endStation ${endId}`);}
  }

  function mapClick({x, y, lat, lng}) {

    tripsAPI.getDBready(dbReadyResponse);
    console.log('setting queryWait');
    let start   = 0;
    let end     = 0;
    let slat    = 0;
    let slon    = 0;
    let minDist = 0;

    let closestStation = geoMath.findClosestStation(lat,lng,stations.list);

    if (searchOptions.chooseStart) {
      start   = closestStation.minIndex;
      end     = stations.endIndex;
      slat    = lat;
      slon    = lng;
      minDist = closestStation.minDist;
    } else {
      start   = stations.startIndex;
      end     = closestStation.minIndex;
      slat    = stations.latitude;
      slon    = stations.longitude;
      minDist = stations.minStationDist;
    }
    let startId = stations.list[start].stationId;
    let endId   = stations.list[end].stationId;
    if (dbOkay === DB_GOOD) {
      setSearchOptions({...searchOptions, waitForQuery : true, waitTime : 0});
      queryWait = true;
      waitTimer = 0;
      tripsAPI.getTrips(startId,endId,searchOptions,processTrips);
    }  
    setStations({
      ...stations,
      latitude       : slat,
      longitude      : slon,
      minStationDist : minDist,
      startIndex     : start,
      endIndex       : end
    });  
    if (debug) {console.log(`map click @ cursor ${x},${y} --> lat ${lat}, lon ${lng}; startStation ${startId}, endStation ${endId}`);}
  }

  // these functions are kept separate so they cleanly match 
  // the database responses.
  function processTrips(trips) {

    const CHART_BINS = 7; // odd number to split at the mean

    let count = trips.length;
    let labels = [];
    let binTrips = [];
    let mean = 0;
    let stdDev = 0;
    let baseDuration = 0;
    let durationStep = 0;
    let maxBinCt = 0;
    let maxIndex = 0;

    if (!count) {
      setStatsAndCharts({
        minDuration    : 0,
        maxDuration    : 0,
        modeDuration   : '(no trips)',
        nextBin        : '',
        stdDevDuration : '--:--',
        binTrips       : []
      });
    } else {  
      if (debug) {console.log(`processing ${count} trips`);}
      // sorting will help with rejection of outliers later
      trips.sort( (a,b) => a.tripDuration - b.tripDuration);
      mean   = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
      stdDev = Math.sqrt(trips.reduce(
        (acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1));

      if (count > 30) {
        trips  = trips.filter( (t) => Math.abs(t.tripDuration-mean) <= 3.0*stdDev);
        count  = trips.length;
        mean   = trips.reduce((acc,t) => acc + t.tripDuration, 0) / count;
        stdDev = Math.sqrt(trips.reduce(
          (acc,t) => acc + (t.tripDuration-mean)**2, 0) / (count > 1 ? count-1 : 1));
      }

      if (debug) {console.log(`trips ${count}: mean ${mean}, standard deviation ${stdDev}`);}
      if (count === 1) {
        baseDuration = trips[0].tripDuration;
        maxBinCt = 0;
        maxIndex = 0;
        labels.push(makeMinutesAndSeconds(baseDuration));
        binTrips.push({ 
          bin  : 1, 
          trips: 1
        });
        durationStep = 0;
      } else {
        baseDuration = mean - ((CHART_BINS-1)/4-0.25)*stdDev;
        durationStep = 0.5*stdDev;
        let t = 0;
        for (let b = 0; b < CHART_BINS; b++) {
          labels[b] = makeMinutesAndSeconds(baseDuration+b*durationStep)
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
      }  
    }
    if (count) {
      console.log(`${JSON.stringify(binTrips)}`,labels);
      setStatsAndCharts({
        minDuration     : trips[0].tripDuration,
        maxDuration     : trips[count-1].tripDuration,
        trips           : count,
        modeDuration    : makeMinutesAndSeconds(baseDuration+maxIndex*durationStep), 
        nextBin         : makeMinutesAndSeconds(baseDuration+(maxIndex+1)*durationStep),
        stdDevDuration  : makeMinutesAndSeconds(stdDev),
        labels          : labels,
        binTrips        : binTrips
      });
    }
    setSearchOptions({...searchOptions, waitForQuery : false, waitTime : 0});
    queryWait = false;
    waitTimer = 0;
    console.log('clearing queryWait');
  }

  function handleToggle(event) {
    event.preventDefault();
    switch (event.target.name) {
      case 'chooseStart': 
        setSearchOptions({
          ...searchOptions,
          chooseStart : searchOptions.chooseStart? false : true
        });
        break;
      case 'useTime': 
        setSearchOptions({
          ...searchOptions,
          useTime : searchOptions.useTime ? false : true
        });
        break;
      case 'useProfile': 
        setSearchOptions({
          ...searchOptions,
          useProfile : searchOptions.useProfile ? false : true
        });
        break;
      default: break;
    }
  };

  function makeMinutesAndSeconds(seconds) {
    let sec = Math.floor(seconds % 60);
    let min = Math.floor(seconds / 60);
    sec = sec < 10? '0'+sec : sec;
    return(min+':'+sec);
  }

  const getQueryWait = () => queryWait;

  function clock() { 
    if (getQueryWait()) {
      waitTimer++;
      setSearchOptions({
        ...searchOptions,
        waitTime : searchOptions.waitTime + 1
      });
    };
    let tStr = getTimeStr();
    let flagsObj = getTimeFlags(tStr);
    setTimeAndDate({
      timeStr     : tStr,
      isWeekday   : flagsObj.isWeekday,
      isOvernight : flagsObj.isOvernight,
      isMorning   : flagsObj.isMorning,
      isAfternoon : flagsObj.isAfternoon,
      isEvening   : flagsObj.isEvening
    });
  }

  return (
    <div className="container AppBar">
      <div className="row AppBar-header">
        <div id="nameBox">
            <h5>rguthrie's</h5>
            <h4>Divvy Bikes Planner</h4>

            <div className="smallprint">
              <br />
              <p>copyright &#169; rguthrie, 2020</p>
            </div>   

        </div>
        <h1 className="AppBar-title">Bike Chicago!</h1>
      </div>
      <div className="row">
        <div className="col-sm-4">
          <div className="row info-card">
            <SearchForm
              timeAndDate    ={timeAndDate.timeStr}
              isWeekday      ={timeAndDate.isWeekday}
              partOfDay      ={
                timeAndDate.isOvernight ? 'overnight' : (
                  timeAndDate.isMorning ? 'morning': (
                    timeAndDate.isEvening?'evening':'afternoon'
                  )
                )
              }
              lat             ={stations.latitude.toPrecision(8)}
              lon             ={stations.longitude.toPrecision(8)}
              startStation    ={stations.populated? stations.list[stations.startIndex].stationId   : ''}
              startName       ={stations.populated? stations.list[stations.startIndex].stationName : ''}
              endStation      ={stations.populated? stations.list[stations.endIndex  ].stationId   : ''}
              endName         ={stations.populated? stations.list[stations.endIndex  ].stationName : ''}
              minStationDist  ={stations.minStationDist.toPrecision(3)}
              chooseStart     ={searchOptions.chooseStart}
              useTime         ={searchOptions.useTime}
              useProfile      ={searchOptions.useProfile}
              dbOkay          ={dbOkay}
              whereAmI        ={whereAmI}
              handleToggle    ={handleToggle}
            />
          </div>
          <div className="row chart-card">
            <TripsChart
              querying       ={queryWait}
              waitTime       ={makeMinutesAndSeconds(waitTimer)}
              minDuration    ={statsAndCharts.minDuration}
              maxDuration    ={statsAndCharts.maxDuration}
              trips          ={statsAndCharts.trips}
              modeDuration   ={statsAndCharts.modeDuration}
              nextBin        ={statsAndCharts.nextBin}
              stdDevDuration ={statsAndCharts.stdDevDuration}
              labels         ={statsAndCharts.labels}
              binTrips       ={statsAndCharts.binTrips} 
            />
          </div>
        </div>
        <div className="col-sm-8">
            <MapCard 
              centerSkew   ={{key: stations.centerSkew}}
              centerLat    ={stations.latitude}
              centerLon    ={stations.longitude}
              stations     ={stations.populated? stations.list: []}
              startStation ={stations.populated? stations.list[stations.startIndex] : {}}
              endStation   ={stations.populated? stations.list[stations.endIndex  ] : {}}
              mapClick     ={mapClick}
            />
      </div>
      </div>
    </div>
  )
}
