// App.js - Bike Planner client-side head page.  Home for 
// React state variables and HTML body rendering.

import React, {useState} from "react";
import tripsAPI          from "./utils/tripsAPI";
import geoMath           from "./utils/geoMath";
import SearchForm        from "./components/SearchForm";
import MapCard           from "./components/MapCard";
import TripsChart        from "./components/TripsChart";
import LogInSignUp       from "./components/LogInSignUp";
import timeSvcs          from "./utils/timeSvcs";
import tripsAnalysis     from "./utils/tripsAnalysis";
import {debug}           from "./debug"
import "./App.css";


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

    // current user login and profile information - also
    // has state information for login sequence and display
    const [user,setUser] = useState({
      userName  : '',
      password  : '',
      gender    : '',
      birthYear : '',
      lastTry   : '',
      showLogin : false
    });

    // toggle setting for action of a click on the map
    const [mapOptions,setMapOptions] = useState({
      chooseStart : true    // map click selector - Start or Dest
    });

    // Search Options
    // day of week options
    const ALL_DAYS = 0;
    // const WEEKDAYS = 1;  // these are not explicitly referenced
    // const WEEKENDS = 2;
    // gender & age options -- these are not explicitly referenced
    // const ALL_TRIPS   = 0;
    // const USE_GENDER  = 1;
    // const USE_AGE     = 2;
    // const USE_PROFILE = 3;
    const [searchOptions,setSearchOptions] = useState({
      useTime     : ALL_DAYS, // restrict query by time of week
      useGender   : false,    // restrict query by gender
      useAge      : false,    // restrict query by age
      ageTol      : 5         // if useProfile, find only birthYear +/- ageTol
    });

    // stations is the set of variables used for the main elements used in the
    // Map and for searching. the 'list' array holds objects from the Stations
    // collection. A station in the Stations collection is:
    // {
    //   stationId   : one of 611 numbers in 2..673 (not all values are used)
    //   stationName : string, descriptive of station location, 
    //                 e.g. an intersection or landmark
    //   docks       : bikes capacity
    //   stationLat  : latitude in degrees, a float in 41.736646-42.064854, 
    //                 numbers are larger going North>
    //   stationLon  : longitude in degrees, a float in -87.775 - -87.5494,
    //                 numbers are more negative going West>
    // }   
    // 
    const [stations,setStations] = useState({
      populated      : false,
      startIndex     : 423,  // Station 91, Clinton St & Washington Blvd
      endIndex       :  72,  // Station 43, train station 'Millennium'
      list           :  [],
      location       : {lat: 41.884550, lon: -87.639971}, 
      minStationDist : 0.0
    });

    // time variables; the flags allow refinement of searching/charting, 
    // though presently only 'isWeekday' is used.
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
      binTrips       : [],
      labelsDur      : [],
      pointsDur      : [],
      pointsCt       : [],
      plotTripsByDur : true
    });

    // database-ready (dbReady) states and state variable
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
          tripsAPI.getStations(setStationsList);
          tripsAPI.getDBready(dbReadyResponse);
          tripsAPI.checkLogin(loginResponse);
        } else {
          // monitoring searchOptions to automatically re-query 
          // based on new filter settings
          // but not while a query is already active...
          if (!queryObj.queryWait) {
            tripsAPI.getTrips(
              stations.list[stations.startIndex].stationId,
              stations.list[stations.endIndex  ].stationId,
              searchOptions,
              user,
              processTrips
            );
            setQueryWait({queryWait: true, waitTimer: 0});
          }
        }
      },
      // look for change in search options or user   
      [searchOptions]
    );      

    // setStationsList() - callback given to the stations list query
    function setStationsList(stationArr) {
      // the server's check of the trips collection may not have 
      // been complete when the first check for dbReady was made in
      // useEffect(). give it another chance.
      if (dbOkay !== DB_GOOD) {
        tripsAPI.getDBready(dbReadyResponse);
      }
      // find the nearest station to the present location
      let closestStation = 
        geoMath.findClosestStation(stations.location,stationArr);
      // add the list and set the closest station  
      setStations({
        ...stations,
        populated      : true, 
        list           : stationArr,
        minStationDist : closestStation.minDist,
        startIndex     : closestStation.minIndex
      });
      // query for trips. note use of stationArr as setStations
      // may not be (or probably isn't) finished.
      tripsAPI.getTrips(
        stationArr[stations.startIndex].stationId,
        stationArr[stations.endIndex  ].stationId,
        searchOptions,
        user,
        processTrips
      );
      setQueryWait({queryWait: true, waitTimer: 0});
    }

    // dbReadyResponse() processes the server response to a dbReady query
    function dbReadyResponse(r) {
      if (
          r.UsersCollection    && 
          r.StationsCollection && 
          r.TripsCollection
         ) {
        setDbOkay(DB_GOOD);
      } else {
        if (debug) {console.log(JSON.stringify(r));}
        // not all are good, and no hope if either Users or Stations is false
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

    // clock() is the service for the 1 Hz timer. clock() tracks wait time
    // while queries are outstanding, and tracks time of day.
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

    // whereAmI() handles the random location button
    function whereAmI(event) {
      event.preventDefault();
      // another good time to check (re-check) for dbReady
      if (dbOkay !== DB_GOOD) {
        tripsAPI.getDBready(dbReadyResponse);
      } else { 
        // db is ready...set up for and execute trips query
        let loc = geoMath.randLoc();
        let closestStation = geoMath.findClosestStation(loc,stations.list);
        let startId = stations.list[closestStation.minIndex].stationId;
        let endId = stations.list[stations.endIndex].stationId;
        tripsAPI.getTrips(startId,endId,searchOptions,user,processTrips);
        setQueryWait({queryWait: true, waitTimer: 0});

        // update to the new location
        setStations({
          ...stations,
          location       : {lat : loc.lat, lon : loc.lon},
          minStationDist : closestStation.minDist,
          startIndex     : closestStation.minIndex
        }); 
        if (debug) {console.log(`random start: lat ${loc.lat}, lon ${loc.lon}; startStation ${startId}, endStation ${endId}`);}
      }  
    }

    // mapClick() handles choice of new location or new destination.
    // the arguments are the map coordinates in pixels and calculated
    // latitude and longitude based on the current extents and center 
    // of the map.
    function mapClick({x, y, lat, lng}) {
      // another effort to get to a good database status
      if (dbOkay !== DB_GOOD) {
        tripsAPI.getDBready(dbReadyResponse);
      } else { 
        let start   = 0;
        let end     = 0;
        let slat    = 0;
        let slon    = 0;
        let minDist = 0;
        // find the nearest station to the new location
        let closestStation = geoMath.findClosestStation({lat : lat, lon: lng}, stations.list);

        // if a new Start, the start station and location will change
        if (mapOptions.chooseStart) {
          start   = closestStation.minIndex;
          end     = stations.endIndex;
          slat    = lat;
          slon    = lng;
          minDist = closestStation.minDist;
        } else {
          // but if a new Dest, only the Dest will change
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

    // processTrips is the callback from a Trips Query. The trips 
    // argument is an array of objects, each a startTime and tripDuration
    function processTrips(trips) {
      if (!trips.length) {
        setStatsAndCharts({
          ...statsAndCharts,
          trips          :  0,
          modeDuration   : '(no trips)',
          nextBin        : '',
          stdDevDuration : '--:--',
          labels         : [],
          binTrips       : [],
          labelsDur      : [],
          pointsDur      : [],
          pointsCt       : []
        });
      } else {  
        // farm out the hard work to tripsAnalysis
        let resultsObj   = tripsAnalysis.tripsByDuration(trips);
        let durationsObj = tripsAnalysis.durationsByHourOfDay(trips);
        // and update the graphics state accordingly.
        setStatsAndCharts({
          ...statsAndCharts,
          trips          : resultsObj.trips,
          modeDuration   : resultsObj.modeDuration, 
          nextBin        : resultsObj.nextBin,
          stdDevDuration : resultsObj.stdDevDuration,
          labels         : resultsObj.labels,
          binTrips       : resultsObj.binTrips,
          labelsDur      : durationsObj.labels,
          pointsDur      : durationsObj.pointsDur,
          pointsCt       : durationsObj.pointsCt
        });
      }
      // indicate no longer waiting!
      setQueryWait({queryWait: false, waitTimer: 0});
    }

    // handleCycle() progresses the indicated variable through its cycle of
    // settings.
    function handleCycle(event) {
      event.preventDefault();
      if (!queryObj.queryWait) {
        switch (event.target.name) {
          case 'swapPlot':
            setStatsAndCharts({
              ...statsAndCharts,
              plotTripsByDur : statsAndCharts.plotTripsByDur? false : true
            });
            break;
          case 'chooseStart': 
            setMapOptions({
              ...mapOptions,
              chooseStart : mapOptions.chooseStart? false : true
            });
            break;
          case 'useTime': 
            // advance through ALL_DAYS, WEEKDAYS, and WEEKENDS, with wraparound
            setSearchOptions({
              ...searchOptions,
              useTime : (searchOptions.useTime + 1) % 3
            });
            break;
          case 'useProfile': 
            if (user.userName) {
              // this is the most interesting case. the cycle is implemented
              // over two variables - useGender and useAge - and depends on
              // these const values for meaning.
              // from above -
              // const ALL_TRIPS   = 0;
              // const USE_GENDER  = 1;
              // const USE_AGE     = 2; 
              // const USE_PROFILE = 3;  // i.e. both true
              //
              // cycle goes from both false,        0
              // to useGender true, useAge false,   1
              // to useGender false, useAge true,   2
              // to both true,                      3
              let nextOption = 
                ((searchOptions.useGender? 1 : 0) +
                (searchOptions.useAge   ? 2 : 0) + 1) % 4;
              if (debug) {console.log(`useGender: ${nextOption % 2 ? true:false}, useAge ${nextOption > 1}`)};   
              setSearchOptions({
                ...searchOptions,
                // useGender is true if the cycle value is odd (i.e. 1 or 3)
                useGender : nextOption % 2 ? true : false,
                // useAge is true if the cycle value exceeds 1
                useAge    : nextOption > 1 ? true : false
              });
            } else {
              // and if there's no profile, show Login
              setUser({
                ...user,
                showLogin : true
              });  
            }
            break;
          default: break;
        }
      }
    };

    // loggedOut is the logout() callback.
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

    // handleDelete() is actually three functions which cascade on callbacks.
    // logout() is performed before deletion.
    function handleDelete() {
      tripsAPI.getLogout(deleteUser);
    }
    const deleteUser   = (msg)  => {
      if (msg  === 'logged out') tripsAPI.getDelete(user.userName,verifyDelete);
    }
    const verifyDelete = (data) => {
      if (data === 'deleted'   ) loggedOut('deleted');
    }

    // handleLogBtn() supports the Login/Logout button.
    function handleLogBtn() {
      if (user.userName) {
        // if there's a user, button shows 'Logout', and click means log out.
        tripsAPI.getLogout(loggedOut);
      } else {
        // otherwise there's not a user, button shows 'Login', and click
        // means log in.
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

    // handleFormDismiss() handles the 'Not Now' button, which lets a 
    // user re-think the decision to login/signup
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
    
    // loginResponse() is the callback for a login or signup request.
    // see handleFormSubmit()
    const TRY_LOGIN = 0;
    const TRY_SIGNUP = 1;
    let formState = TRY_LOGIN;
    function loginResponse(respObj) {
      console.log('loginResponse: ',JSON.stringify(respObj));
      // if login success or signup success, response will be 'loggedIn'
      if (respObj.result === 'loggedIn') {
        // setup for next time
        formState = TRY_LOGIN;
        // and set the user info
        setUser({
          ...user,
          userName  : respObj.userName,
          gender    : respObj.genderMale ? 'male' : 'not male',
          birthYear : respObj.birthYear,
          showLogin : false
        });
      } else {
        // not 'loggedIn'. see handleFormSubmit(); formState is set to 
        // TRY_SIGNUP as part of login attempt -- so passing this test...
        if (formState === TRY_SIGNUP && respObj.result === 'not found') {
          // means userName not found. so check the profile information and 
          // post a signup.
          console.log(`handleFormSubmit (entry), TRY_SIGNUP: `,JSON.stringify(user));        
          // set formState for next time
          formState = TRY_LOGIN;
          // check the profile information
          if (user.userName && user.password.length > 7 && user.gender && user.birthYear) {
            let genderStr = user.gender.toLowerCase();
            let genderMale = (genderStr === 'male' || genderStr === 'm');
            if (user.birthYear < 1920 || user.birthYear > 2017) {
              // with possible no-signup because of bad info.
              setUser({
                ...user,
                lastTry   : 'invalid profile'
              })
            } else {
              // ok, sign up.
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
          // this is the path for an incorrect password
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

    // handleFormSubmit() services the 'submit' button on the Login form
    function handleFormSubmit(event) {
      event.preventDefault();
      // the form is only available when no one's logged in. 
      // first, try login using username and password 
      if (user.userName && user.password.length > 7) {
        // set the state variable for the next call (assumes login will fail)
        formState = TRY_SIGNUP;
        // then setup and submit login
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

    // Page render.
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
                  handleCycle   ={handleCycle}
                />)}
            </div>
            {/* 1a0 - second row - TripsChart */}
            <div className="row chart-card">
              <TripsChart
                query     ={queryObj}
                plot      ={statsAndCharts}
                swapPlots ={handleCycle}
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
