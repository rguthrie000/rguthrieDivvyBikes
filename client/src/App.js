import React, {useState, useEffect} from "react";
import tripsAPI                     from "./utils/tripsAPI";
import geoMath                      from "./utils/geoMath";
import SearchForm                   from "./components/SearchForm";
import MapCard                      from "./components/MapCard";
import TripsChart                   from "./components/TripsChart";
import {getTimeStr,getTimeFlags}    from "./utils/timeSvcs";
import {debug}                      from "./debug"
import "./App.css";


export default function App() {

//******************
//*   State Data   *
//******************
  
  // Station list. A station:
  // {
  //   stationId   : < one of 611 numbers in 2..673 (not all values are used) >
  //   stationName : < string, descriptive of station location, e.g. an intersection or landmark>
  //   docks       : < bikes capacity >
  //   stationLat  : < latitude, a real number in 41.736646 - 42.064854, numbers are larger going North>
  //   stationLon  : < longitude, a real number in -87.774704 - -87.54938625, numbers are more negative going West>
  // }   
  const [stations,setStations] = useState({
    populated      : 0,
    centerSkew     : geoMath.centerSkew(),
    startIndex     : 564,
    endIndex       : 299,
    list           : [],
    latitude       : geoMath.randLat(),
    longitude      : geoMath.randLon(),
    minStationDist : 0.0
  });

  const [searchOptions,setSearchOptions] = useState({
      useTime    : false,
      useProfile : false
  });

  const [clickStart,setClickStart] = useState();

  const [timeAndDate,setTimeAndDate] = useState({
    timeStr     : '',
    isWeekday   : 0,
    isOvernight : 0,
    isMorning   : 0,
    isAfternoon : 0,
    isEvening   : 0
  });

  const [statsAndCharts,setStatsAndCharts] = useState({
    minDuration     : '',
    maxDuration     : '',
    averageDuration : '',
    stdDevDuration  : '',
    labels          : [],
    binTrips        : []
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
        setClickStart(true);
        setDbOkay(DB_UNKNOWN);
        tripsAPI.getStations(setStationsList);
      }
    },
    // no monitoring  
    []
  );      

  function setStationsList(stationArr) {
    let closestStation = geoMath.findClosestStation(stations.latitude,stations.longitude,stationArr);
    setStations({
      ...stations,
      populated      : stations.populated + 1, 
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
    let lat = geoMath.randLat();
    let lng = geoMath.randLon();
    let closestStation = geoMath.findClosestStation(lat,lng,stations.list);
    setStations({
      ...stations,
      latitude       : lat,
      longitude      : lng,
      minStationDist : closestStation.minDist,
      startIndex     : closestStation.minIndex
    }); 
    tripsAPI.getDBready(dbReadyResponse);
    if (dbOkay === DB_GOOD) {
      tripsAPI.getTrips(stations,searchOptions,processTrips);
    }  
  }

  function mapClick({x, y, lat, lng}) {
    console.log(x, y, lat, lng)
    let closestStation = geoMath.findClosestStation(lat,lng,stations.list);
    setStations({
      ...stations,
      latitude       : clickStart ? lat : stations.latitude,
      longitude      : clickStart ? lng : stations.longitude,
      minStationDist : clickStart ? closestStation.minDist : stations.minStationDist,
      startIndex     : clickStart ? closestStation.minIndex : stations.startIndex,
      endIndex       : clickStart ? stations.endIndex : closestStation.minIndex
    });  
    tripsAPI.getTrips(stations,searchOptions,processTrips);
  }

  // these functions are kept separate so they cleanly match 
  // the database responses.
  function processTrips(trips) {
    console.log('pushed to trips ',JSON.stringify(trips));
    if (trips.length === 0) {
      setStatsAndCharts({
        minDuration     : 0,
        maxDuration     : 0,
        averageDuration : '--:--',
        stdDevDuration  : '--:--',
        binTrips        : []
      });
    } else {  
      // sorting will help with rejection of outliers later
      console.log('tripStats ', trips.length)
      trips.sort( (a,b) => a.tripDuration - b.tripDuration);
      let mean = trips.reduce((total,t) => total + t.tripDuration, 0) / trips.length;
      console.log(`mean ${mean}`);
      let variance = trips.reduce((total,t) => total + (t.tripDuration-mean)**2, 0) / (trips.length > 1 ? trips.length-1 : 1);
      let stdDev = Math.sqrt(variance);
      console.log(`stdDev ${stdDev}`);

      trips = trips.filter( (t) => Math.abs(t.tripDuration-mean) <= 3.0*stdDev )
      mean = trips.reduce((total,t) => total + t.tripDuration, 0) / trips.length;
      console.log(`mean (reduce) ${mean}`);
      variance = trips.reduce((total,t) => total + (t.tripDuration-mean)**2, 0) / (trips.length > 1 ? trips.length-1 : 1);
      stdDev = Math.sqrt(variance);
      console.log(`stdDev (reduce) ${stdDev}`);

      let span = trips[trips.length-1].tripDuration - trips[0].tripDuration;
      let baseDuration = trips[0].tripDuration;
      let durationStep = 0.1*span;
      let maxbinCt = 0;
      let binTrips = [];
      let labels = [];
      let t = 0;
      for (let b = 0; b < 10 && t < trips.length; b++) {
        let countInBin = 0;
        while ((t < trips.length) && (trips[t].tripDuration < (baseDuration + (b+1)*durationStep))) {
          countInBin++;
          t++;
        }
        if (countInBin > maxbinCt) {
          maxbinCt = countInBin;
        }
        labels.push(`${(parseInt(b) & 1) ? '-' : makeMinutesAndSeconds((b + 0.5)*durationStep + baseDuration)}`);
        binTrips.push({ 
          bin  : b+1, 
          trips: countInBin
        });
      }
      console.log(`baseDuration ${baseDuration} durationStep ${durationStep}`);
      console.log(`avgD ${mean} s =${Math.floor(mean/60)+':' + mean % 60} stdDev ${stdDev} s = ${Math.floor(stdDev/60)+':' + stdDev % 60}`);
      console.log(`maxbinCt ${maxbinCt}`,JSON.stringify(binTrips));
      setStatsAndCharts({
        minDuration     : trips[0].tripDuration,
        maxDuration     : trips[trips.length-1].tripDuration,
        averageDuration : makeMinutesAndSeconds(mean), 
        stdDevDuration  : makeMinutesAndSeconds(stdDev),
        labels          : labels,
        binTrips        : binTrips
      });
    }
  }

  function clock() { 
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

  function handleRadioToggle(event) {
    event.preventDefault();
    let name = event.target.name;
    let value = event.target.value;
    setSearchOptions({
      ...searchOptions,
      [name] : searchOptions[name] ? false : true
    })
  };

  function handleClickStart(event) {
    event.preventDefault();
    let value = event.target.value;
    setClickStart(clickStart ? false : true);
  }

  function makeMinutesAndSeconds(seconds) {
    let sec = Math.floor(seconds % 60);
    let min = Math.floor(seconds / 60);
    sec = sec < 10? '0'+sec : sec;
    return(min+':'+sec);
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
              useTime         ={searchOptions.useTime}
              useProfile      ={searchOptions.useProfile}
              dbOkay          ={dbOkay}
              whereAmI        ={whereAmI}
              clickStart      ={clickStart}
              handleRadio     ={handleRadioToggle}
              handleClickStart={handleClickStart}
            />
          </div>
          <div className="row chart-card">
            <TripsChart
              minDuration    ={statsAndCharts.minDuration}
              maxDuration    ={statsAndCharts.maxDuration}
              averageDuration={statsAndCharts.averageDuration}
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
