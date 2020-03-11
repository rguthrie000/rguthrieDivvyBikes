import React, {useState} from "react";
import tripsAPI          from "./utils/tripsAPI";
import geoMath           from "./utils/geoMath";
import SearchForm        from "./components/SearchForm";
import MapCard           from "./components/MapCard";
import TripsChart        from "./components/TripsChart";
import timeSvcs          from "./utils/timeSvcs";
import tripsAnalysis     from "./utils/tripsAnalysis";
import {debug}           from "./debug"
import "./App.css";
import LogInSignUp from "./components/LogInSignUp";


//*********************************
//*   Globals (full-file scope)   *
//*********************************

// Storage for Google Maps API key (provided by our server)
// This value must be in scope prior to React instantiation.
// function.
let geoKey = '';

// State and counter to show waiting status during db queries...
// these just don't work when declared as properties of a react 
// state object. See Query Status methods below. 
let queryObj = {
  queryWait : false,
  waitTimer : 0
};

//**************
//*   Module   *
//**************

export default {

  // method used to register the Google Maps API key
  postKey : (key) => {geoKey = key;},
    
  // body of index.HTML, with logic and state.  
  App : () => {

    //*****************************
    //*   State Data and Methods  *
    //*****************************
    
    // Query status method -- see Globals, above.
    // React does not properly monitor changes when working
    // with this declaration from the timer interrupt context:
    // const [queryWait,setQueryWait] = useState({
    //   queryWaiting : false,
    //   waitTimer    : 0
    // })
    // So instead we work with the module-scoped variables
    // defined above and this method:
    const setQueryWait = (stateObj) => {
      queryObj = {
        queryWait : stateObj.queryWait,
        waitTimer : stateObj.waitTimer
      }
    }

    const [user,setUser] = useState({
      userName  : '',
      password  : '',
      gender    : '',
      birthYear : '',
      lastTry   : '',
      showLogin : false
    });

    const [mapOptions,setMapOptions] = useState({
      chooseStart : true    // map click selector - Start or Dest
    });

    // user options
    //   useTime
    //   useProfile, and if 1:
    //     genderMale
    //     birthYear
    //     ageTol
    const [searchOptions,setSearchOptions] = useState({
      useTime     : false,  // restrict query by time of week (weekday or weekends+holidays) or use all times
      useProfile  : false,  // restrict query by gender+age or find all rides
      ageTol      : 5       // age half-window width (if useProfile, find only birthYear-ageTol to birthYear+ageTol)
    });

    // stations is the set of variables used for the main elements used in the Map and for searching.
    // the 'list' array holds objects from the Stations collection. A station in the Stations collection is:
    // {
    //   stationId   : < one of 611 numbers in 2..673 (not all values are used) >
    //   stationName : < string, descriptive of station location, e.g. an intersection or landmark>
    //   docks       : < bikes capacity >
    //   stationLat  : < latitude in degrees, a real number in 41.736646 - 42.064854, 
    //                   numbers are larger going North>
    //   stationLon  : < longitude in degrees, a real number in -87.774704 - -87.54938625,
    //                   numbers are more negative going West>
    // }   
    // 
    const [stations,setStations] = useState({
      populated      : false,
      startIndex     : 423,  // Station 91, Clinton St & Washington Blvd
      endIndex       :  72,  // Station 43, Michigan Ave & Washington St (train station 'Millennium')
      list           :  [],
      location       : {lat: 41.884550, lon: -87.639971}, 
      minStationDist : 0.0
    });

    // time variables; the flags allow refinement of searching/charting, though
    // presently only 'isWeekday' is used.
    const [timeAndDate,setTimeAndDate] = useState({
      timeStr     : '',
      isWeekday   :  0,
      isOvernight :  0,
      isMorning   :  0,
      isAfternoon :  0,
      isEvening   :  0
    });

    // variables for use in data analysis and charting.
    const [statsAndCharts,setStatsAndCharts] = useState({
      trips          :  0,
      modeDuration   : '',
      nextBin        : '',
      stdDevDuration : '',
      labels         : [],
      binTrips       : []
    });

    // dbReady states and state variable
    const DB_BAD             = 0;
    const DB_GOOD            = 1;
    const DB_UNKNOWN         = 2;
    const DB_TRIPSLOADING    = 3;
    const [dbOkay,setDbOkay] = useState();

    //******************
    //*   Functions    *
    //******************
    
    // When ready...
    React.useEffect( () => {
        // initialization only
        if (!stations.list.length) {
          setInterval(clock,1000);
          setDbOkay(DB_UNKNOWN);
          tripsAPI.getDBready(dbReadyResponse);
          tripsAPI.getStations(setStationsList);
          tripsAPI.checkLogin(loginResponse);
        } else {
          tripsAPI.getTrips(
            stations.list[stations.startIndex].stationId,
            stations.list[stations.endIndex  ].stationId,
            searchOptions,
            user,
            processTrips
          );
          setQueryWait({queryWait: true, waitTimer: 0});
        }
      },
      // look for change in search options   
      [searchOptions]
    );      

    function setStationsList(stationArr) {
      let closestStation = geoMath.findClosestStation(stations.location,stationArr);
      setStations({
        ...stations,
        populated      : true, 
        list           : stationArr,
        minStationDist : closestStation.minDist,
        startIndex     : closestStation.minIndex
      });
      tripsAPI.getTrips(
        stationArr[stations.startIndex].stationId,
        stationArr[stations.endIndex  ].stationId,
        searchOptions,
        user,
        processTrips
      );
      setQueryWait({queryWait: true, waitTimer: 0});
    }

    function dbReadyResponse(r) {
      if (r.UsersCollection && r.StationsCollection && r.TripsCollection) {
        setDbOkay(DB_GOOD);
      } else {
        if (debug) {console.log(JSON.stringify(r));}
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

    function clock() { 
      if (queryObj.queryWait) {
        setQueryWait({queryWait : true, waitTimer : queryObj.waitTimer + 1});
      };
      let tStr = timeSvcs.getTimeStr();
      let flagsObj = timeSvcs.getTimeFlags(tStr);
      setTimeAndDate({
        timeStr     : tStr,
        isWeekday   : flagsObj.isWeekday,
        isOvernight : flagsObj.isOvernight,
        isMorning   : flagsObj.isMorning,
        isAfternoon : flagsObj.isAfternoon,
        isEvening   : flagsObj.isEvening
      });
    }

    function whereAmI(event) {
      event.preventDefault();
      if (dbOkay !== DB_GOOD) {
        tripsAPI.getDBready(dbReadyResponse);
      } else { 
        let loc = geoMath.randLoc();
        let closestStation = geoMath.findClosestStation(loc,stations.list);
        let startId = stations.list[closestStation.minIndex].stationId;
        let endId = stations.list[stations.endIndex].stationId;
        tripsAPI.getTrips(startId,endId,searchOptions,user,processTrips);
        setQueryWait({queryWait: true, waitTimer: 0});
        setStations({
          ...stations,
          location       : {lat : loc.lat, lon : loc.lon},
          minStationDist : closestStation.minDist,
          startIndex     : closestStation.minIndex
        }); 
        if (debug) {console.log(`random start: lat ${loc.lat}, lon ${loc.lon}; startStation ${startId}, endStation ${endId}`);}
      }  
    }

    function mapClick({x, y, lat, lng}) {

      if (dbOkay !== DB_GOOD) {
        tripsAPI.getDBready(dbReadyResponse);
      } else { 
        let start   = 0;
        let end     = 0;
        let slat    = 0;
        let slon    = 0;
        let minDist = 0;

        let closestStation = geoMath.findClosestStation({lat : lat, lon: lng}, stations.list);

        if (mapOptions.chooseStart) {
          start   = closestStation.minIndex;
          end     = stations.endIndex;
          slat    = lat;
          slon    = lng;
          minDist = closestStation.minDist;
        } else {
          start   = stations.startIndex;
          end     = closestStation.minIndex;
          slat    = stations.location.lat;
          slon    = stations.location.lon;
          minDist = stations.minStationDist;
        }
        let startId = stations.list[start].stationId;
        let endId   = stations.list[end].stationId;
        setQueryWait({queryWait: true, waitTimer: 0});
        tripsAPI.getTrips(startId,endId,searchOptions,user,processTrips);
        setStations({
          ...stations,
          location       : {lat : slat, lon : slon},
          minStationDist : minDist,
          startIndex     : start,
          endIndex       : end
        });  
        if (debug) {console.log(`map click @ cursor ${x},${y} --> lat ${lat}, lon ${lng}; startStation ${startId}, endStation ${endId}`);}
      }  
    }

    // these functions are kept separate so they cleanly match 
    // the database responses.
    function processTrips(trips) {
      if (!trips.length) {
        setStatsAndCharts({
          ...statsAndCharts,
          trips          :  0,
          modeDuration   : '(no trips)',
          nextBin        : '',
          stdDevDuration : '--:--',
          labels         : [],
          binTrips       : []
        });
      } else {  
        let resultsObj = tripsAnalysis.tripsByDuration(trips);
        setStatsAndCharts({
          ...statsAndCharts,
          trips           : resultsObj.trips,
          modeDuration    : resultsObj.modeDuration, 
          nextBin         : resultsObj.nextBin,
          stdDevDuration  : resultsObj.stdDevDuration,
          labels          : resultsObj.labels,
          binTrips        : resultsObj.binTrips
        });
      }
      setQueryWait({queryWait: false, waitTimer: 0});
    }

    function handleToggle(event) {
      event.preventDefault();
      switch (event.target.name) {
        case 'chooseStart': 
          setMapOptions({
            ...mapOptions,
            chooseStart : mapOptions.chooseStart? false : true
          });
          break;
        case 'useTime': 
          setSearchOptions({
            ...searchOptions,
            useTime : searchOptions.useTime ? false : true
          });
          break;
        case 'useProfile': 
          if (user.userName) {
            setSearchOptions({
              ...searchOptions,
              useProfile : searchOptions.useProfile ? false : true
            });
          } else {
            setUser({
              ...user,
              showLogin : true
            });  
          }
          break;
        default: break;
      }
    };

    function loggedOut(msg) {
      if (debug) {console.log(`log out ${msg}`);}
      setUser({
        userName  : '',
        password  : '',
        gender    : '',
        birthYear : '',
        lastTry   : '',
        showLogin : false
      })
    }

    function handleDelete() {tripsAPI.getLogout(deleteUser);}
      const deleteUser   = (msg)  => {if (msg  === 'logged out') tripsAPI.getDelete(user.userName,verifyDelete);}
      const verifyDelete = (data) => {if (data === 'deleted'   ) loggedOut('deleted');}

    function handleLogBtn() {
      if (user.userName) {
        tripsAPI.getLogout(loggedOut);
      } else {
        setUser({
          ...user,
          showLogin : true
        })
      }
    }

    // handleFormChange() updates the user login / signup fields
    // in the form fields. react renders them as they are changed.
    function handleFormChange(event) {
      event.preventDefault();
      // Get the value and name of the input which triggered the change
      const name  = event.target.name;
      const value = event.target.value;
      // And update the state so the user can see feedback as the input is typed.
      setUser({
        ...user, [name] : value
      });
    };

    function handleFormDismiss(event) {
      event.preventDefault();
      setUser({
        userName  : '',
        password  : '',
        gender    : '',
        birthYear : '',
        lastTry   : '',
        showLogin : false
      });
    }
    
    const TRY_LOGIN = 0;
    const TRY_SIGNUP = 1;
    let formState = TRY_LOGIN;

    function loginResponse(respObj) {
      console.log('loginResponse: ',JSON.stringify(respObj));
      if (respObj.result === 'loggedIn') {
        formState = TRY_LOGIN;
        setUser({
          ...user,
          userName  : respObj.userName,
          gender    : respObj.genderMale ? 'male' : 'not male',
          birthYear : respObj.birthYear,
          showLogin : false
        });
      } else {
        if (formState === TRY_SIGNUP && respObj.result === 'not found') {
          console.log(`handleFormSubmit (entry), TRY_SIGNUP: `,JSON.stringify(user));        
          formState = TRY_LOGIN;
          if (user.userName && user.password.length > 7 && user.gender && user.birthYear) {
            let genderStr = user.gender.toLowerCase();
            let genderMale = (genderStr === 'male' || genderStr === 'm');
            if (user.birthYear < 1920 || user.birthYear > 2017) {
              setUser({
                ...user,
                lastTry   : 'invalid profile'
              })
            } else {
              let userObj = {
                userName   : user.userName,
                password   : user.password,
                genderMale : genderMale,
                birthYear  : user.birthYear
              };
              console.log(`handleFormSubmit, TRY_SIGNUP: `,JSON.stringify(userObj));        
              tripsAPI.postSignup(userObj,loginResponse);
            }  
          }  
        } else {
          setUser({
            ...user,
            userName  : '',
            password  : '',
            gender    : '',
            birthYear : '',
            lastTry   : respObj.result
          });
        }
      }
    }

    function handleFormSubmit(event) {
      event.preventDefault();
      // the form is only available when no one's logged in. 
      // first, try login using username and password 
      if (user.userName && user.password.length > 7) {
        formState = TRY_SIGNUP;
        let userObj = {
          userName   : user.userName,
          password   : user.password,
          genderMale : '',
          birthYear  : ''
        };
        console.log(`handleFormSubmit, TRY_LOGIN: `,JSON.stringify(userObj));   
        tripsAPI.postLogin(userObj,loginResponse);
      }
    }

    return (
      // Page layout (bootstrap grid):
      //   container AppBar
      //     0. top row - AppBar-header
      //     1. bottom row - two columns
      //         1a - first column - two rows
      //             1a0 - first row:  SearchForm or LogInSignUp
      //             1a1 - second row: TripsChart
      //         1b - second column (no rows): MapCard
      //
      <div className="container AppBar">
        {/* 0. top row - AppBar-header */}
        <div className="row AppBar-header">
          <div id="nameBox">
              <h5>rguthrie's</h5>
              <h4>Divvy Bikes Planner</h4>
              <div className="smallprint">
                <br />
                <p>copyright &#169; rguthrie, 2020</p>
              </div>   
          </div>
          <p id="user">{user.userName? `Hi, ${user.userName}!`:''}</p>
          <div className='button-box'>
            <button 
              className="btn btn-primary button-login"  
              onClick={handleLogBtn}
            >
              {user.userName? 'Log Out':'Log In'}
            </button>
            <button 
              className="btn btn-primary button-delete" 
              style={{ display: user.userName ? null : 'none'}}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
          <h1 className="AppBar-title">Bike Chicago!</h1>
        </div>
        {/* 1. bottom row - two columns */}
        <div className="row">
          {/* 1a - first column - two rows */}
          <div className="col-sm-4">
            {/* 1a0 - first row - SearchForm or LogInSignUp*/}
            <div className="row info-card">
              {user.showLogin ?
                (<LogInSignUp
                  user              ={user}
                  handleFormChange  ={handleFormChange}
                  handleFormSubmit  ={handleFormSubmit}
                  handleFormDismiss ={handleFormDismiss}
                />)
              :
                (<SearchForm
                  timeAndDate   ={timeAndDate}
                  stations      ={stations}
                  mapOptions    ={mapOptions}
                  searchOptions ={searchOptions}
                  user          ={user}
                  dbOkay        ={dbOkay}
                  whereAmI      ={whereAmI}
                  handleToggle  ={handleToggle}
                />)}
            </div>
            {/* 1a0 - second row - TripsChart */}
            <div className="row chart-card">
              <TripsChart
                query ={queryObj}
                plot  ={statsAndCharts}
              />
            </div>
          </div>
          {/* 1b - second column (no rows): MapCard */}
          <div className="col-sm-8">
              <MapCard 
                geoKey   ={geoKey}
                stations ={stations}
                mapClick ={mapClick}
              />
          </div>
        </div>
      </div>
    )
  }  // end App function

}  // end module
