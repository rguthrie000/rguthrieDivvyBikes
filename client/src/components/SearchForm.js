// SearchForm.js - information/options component for Divvy Bikes Planner
import React from "react";
import "./SearchForm.css";

export default function SearchForm(props) {

  // Helper Functions ********************************************************

  // These must all resolve/return a value so they will integrate with the 
  // rendering jsx which uses them.
  const DB_BAD          = 0;
  const DB_GOOD         = 1;
  const DB_UNKNOWN      = 2;
  const DB_TRIPSLOADING = 3;
  const dbStyle = () => {
    switch (props.dbOkay) {
      case DB_BAD          : return('dbRed');
      case DB_GOOD         : return('dbGreen');
      case DB_UNKNOWN      : return('dbBlue');
      case DB_TRIPSLOADING : return('dbYellow');
      default              : return('dbBrown');
    };
  }
  const partOfDay = () => {
    return(
      props.timeAndDate.isOvernight ? 'overnight' : (
      props.timeAndDate.isMorning   ? 'morning'   : (
      props.timeAndDate.isEvening   ? 'evening'   : 
                                      'afternoon'   ))
    );
  }
  const startStation   = () => {return(props.stations.populated? props.stations.list[props.stations.startIndex].stationId   : '');}
  const startName      = () => {return(props.stations.populated? props.stations.list[props.stations.startIndex].stationName : '');}
  const endStation     = () => {return(props.stations.populated? props.stations.list[props.stations.endIndex  ].stationId   : '');}
  const endName        = () => {return(props.stations.populated? props.stations.list[props.stations.endIndex  ].stationName : '');}
  const minStationDist = () => {return(props.stations.populated? props.stations.minStationDist.toPrecision(3)               : '');}
  const dayText        = () => {
    return(
      props.searchOptions.useTime === 0 ?
        ('Search all days')
      : 
        (props.searchOptions.useTime === 1 ?
          ('Search weekdays')
        :
          ('Search weekends')    
    ));
  }
  const profileText    = () => {
    return(
      !props.user.userName ?
        ('click for LogIn to use profile')
      :
        (props.searchOptions.useGender && props.searchOptions.useAge ?
          ('Search by: gender+age')
        :
          (props.searchOptions.useGender ?
            ('Search by: gender')
          : 
            (props.searchOptions.useAge ?
              ('Search by: age')
            :  
              ('Find all rides')
    ))));
  }

  // page render - SearchForm
  return (
    <>
      <h6 id="timedate">{props.timeAndDate.timeStr}</h6><h6 id="timecat">{props.timeAndDate.isWeekday? 'weekday':'weekend'}, {partOfDay()}</h6>
      <div id="search-box">
        <div>
          <label id="position-lat-label" htmlFor="position-lat">Location: lat</label>
          <div id="position-lat" className="number-box" name="position-lat">
            {props.stations.location.lat.toPrecision(8)}  
          </div>
          <label id="position-lon-label" htmlFor="position-lon">lon</label>
          <div id="position-lon" className="number-box" name="position-lon">
            {props.stations.location.lon.toPrecision(8)}
          </div>
        </div>
        <div id="button-random">
          <button id={dbStyle()} className="button-random" onClick={props.whereAmI}>random location</button>
        </div>  
        <p id="minDistance">from this location, {minStationDist()} miles to:</p>
        <div>
          <label id="start-station-id-label" htmlFor="start-station-id">Start Station # & name</label>
          <div id="start-station-id">{startStation()}</div>
          <div
            id="start-station"
            className="number-box"
            name="start-station"
          >
            {startName()}
          </div>
        </div>
        <div>
          <label id="end-station-id-label" htmlFor="end-station-id">Destination Station # & name</label>
          <div id="end-station-id">{endStation()}</div>
          <div
            id="end-station"
            className="number-box"
            name="end-station"
          >
            {endName()}
          </div>
        </div>
        <button id="toggle-box-time"
          name="useTime"
          onClick={props.handleCycle}
        >
          {dayText()}
        </button>
        {/* Need a logged in user to have profile information */}
        <button id="toggle-box-profile"
          name="useProfile"
          onClick={props.handleCycle}
        >
          {profileText()}
        </button>
        <button id="toggle-box-location"
          name="chooseStart"
          onClick={props.handleCycle}
        >
          Map click: {props.mapOptions.chooseStart ? 'start' : 'destination'}
        </button>
      </div>
    </>
  );
}