import React, {useState, useEffect} from "react";
// import mapAPI                       from "./utils/googleAPI";
import tripsAPI                     from "./utils/tripsAPI";
import geoMath                      from "./utils/geoMath";
import SearchForm                   from "./components/SearchForm";
import MapCard                      from "./components/MapCard";
import {getTimeStr, getTimeFlags}   from "./utils/timeSvcs";
// import {debug}                      from "./debug";
import "./App.css";

// On 'Demo Go!'
// 1. Randomized location over city area. Then pick closest station.
// 2. 2nd Randomized location over city area. Then pick closest station.
// 3. Time -- now, weekday morning, weekday afternoon, weekday evening, weekend/holiday day, weekend/holiday evening
// 4. fetch route for start/dest
// 5. fetch actuals from server - recent and near future days in category (weekday or weekend/holiday)
// 6. build and chart statistics - compare to Google's answer.


function App() {


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
    startIndex     : 0,
    endIndex       : 1,
    list           : [],
    latitude       : geoMath.randLat(),
    longitude      : geoMath.randLon(),
    minStationDist : 0.0
  });

  const [searchOptions,setSearchOptions] = useState({
      useTime    : false,
      useProfile : false
  });

  const [timeAndDate,setTimeAndDate] = useState({
    timeStr     : '',
    isWeekday   : 0,
    isMorning   : 0,
    isAfternoon : 0,
    isEvening   : 0
  });

//******************
//*   Functions    *
//******************
  
  // When ready...
  useEffect( () => {
      if (!stations.list.length) {
        setInterval(clock,1000);
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

  function updateStations(lat,lon,list) {
    let closestStation = geoMath.findClosestStation(lat,lon,list);
    setStations({
      ...stations,
      latitude       : lat,
      longitude      : lon,
      minStationDist : closestStation.minDist,
      startIndex     : closestStation.minIndex
    });  
  }

  function whereAmI(event) {
    event.preventDefault();
    let lat = geoMath.randLat();
    let lon = geoMath.randLon();
    updateStations(lat,lon,stations.list);
    // let closestStation = geoMath.findClosestStation(lat,lon,stations.list);
    // if (debug) {console.log(`lat,lon ${lat},${lon} is ${closestStation.minDist} from station ${stations.list[closestStation.minIndex].stationId}`)}
    // setStations({
    //   ...stations,
    //   latitude       : lat,
    //   longitude      : lon,
    //   minStationDist : closestStation.minDist,
    //   startIndex     : closestStation.minIndex
    // });  
  }

  function clock() { 
    let tStr = getTimeStr();
    let flagsObj = getTimeFlags(tStr);
    setTimeAndDate({
      timeStr     : tStr,
      isWeekday   : flagsObj.isWeekday,
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
      [name] : value === 'yes' ? true : false
    })
  };

return (
    <div className="container AppBar">
      <div className="row AppBar-header">
        <div id="nameBox">
            <h5>rguthrie's</h5>
            <h4>Divvy Bikes Planner</h4>
        </div>
        <h1 className="AppBar-title">Bike Chicago!</h1>
      </div>

      <div className="row">
        <div className="col-sm-6">
          <div className="row card">
            <div>
              <SearchForm
                timeAndDate    ={timeAndDate.timeStr}
                isWeekday      ={timeAndDate.isWeekday}
                partOfDay      ={timeAndDate.isMorning?'morning':(timeAndDate.isEvening?'evening':'afternoon')}
                lat            ={stations.latitude.toPrecision(8)}
                lon            ={stations.longitude.toPrecision(8)}
                startStation   ={stations.populated? stations.list[stations.startIndex].stationId   : ''}
                startName      ={stations.populated? stations.list[stations.startIndex].stationName : ''}
                endStation     ={stations.populated? stations.list[stations.endIndex  ].stationId   : ''}
                endName        ={stations.populated? stations.list[stations.endIndex  ].stationName : ''}
                minStationDist ={stations.minStationDist.toPrecision(3)}
                useTime        ={searchOptions.useTime}
                useProfile     ={searchOptions.useProfile}
                whereAmI       ={whereAmI}
                handleRadio    ={handleRadioToggle}
              />
            </div>
          </div>
          <div className="row card">
          </div>
        </div>
        <div className="col-sm-6">
            <MapCard />
        </div>
      </div>
    </div>
  );
}

export default App;