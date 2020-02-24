import React, {useState, useEffect} from "react";
import mapAPI                       from "./utils/googleAPI";
import tripsAPI                     from "./utils/tripsAPI";
import geoMath                      from "./utils/geoMath";
import SearchForm                   from "./components/SearchForm";
import MapCard                      from "./components/MapCard";
import {getTimeStr}                 from "./utils/timeSvcs";
import {debug}                      from "./debug";
import "./App.css";

// On 'Demo Go!'
// 1. Randomized location over city area. Then pick closest station.
// 2. 2nd Randomized location over city area. Then pick closest station.
// 3. Time -- now, weekday morning, weekday afternoon, weekday evening, weekend/holiday day, weekend/holiday evening
// 4. fetch route for start/dest
// 5. fetch actuals from server - recent and near future days in category (weekday or weekend/holiday)
// 6. build and chart statistics - compare to Google's answer.


function App() {
  let haveStations = false;


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
    trigger : true,
    selectedStart :   2,
    selectedEnd   : 673,
    list : []
  });

  const [location,setLocation] = useState({
    latitude  : 0.0,
    longitude : 0.0
  });

  const [timeAndDate,setTimeAndDate] = useState();

//******************
//*   Functions    *
//******************
  
  // When ready...
  useEffect( () => {
      setInterval(clock,1000);
      setLocation({
        latitude  : geoMath.randLat(),
        longitude : geoMath.randLon()
      });
      if (!haveStations) {
        let stationArr = tripsAPI.getStations();
        setStations({trigger: stations.trigger + 1, stations: stationArr});
        haveStations = true;
      }
    },
    // no monitoring  
    []
  );      

  // handleFormChange() updates the search object as the user types
  // in the form fields. react renders them as they are changed.
  function handleFormChange(event) {
    event.preventDefault();
    // Get the value and name of the input which triggered the change
    const name  = event.target.name;
    const value = event.target.value;
    // And update the state so the user can see feedback as the input is typed.

    // setSearch({...search, [name] : value});
  };

  function handleFormSubmit() {

  }

  function whereAmI() {
    setLocation({
      latitude  : geoMath.randLat(),
      longitude : geoMath.randLon()
    });
  }

  function clock() {
    setTimeAndDate(getTimeStr());
  }

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
                timeAndDate={timeAndDate}
                lat={location.latitude}
                lon={location.longitude}
                startStation={stations.selectedStart}
                endStation={stations.selectedEnd}
                whereAmI={whereAmI}
                handleFormChange={handleFormChange}
                handleFormSubmit={handleFormSubmit}
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