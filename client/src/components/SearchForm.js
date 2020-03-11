import React from "react";
import "./SearchForm.css";

function SearchForm(props) {

  // Helper Functions
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
  const profileText    = () => {
    return(props.user.userName ? 
      (`Use user profile? ${props.options.useProfile ? 'profile' : 'all users'}`) 
      :
      ('click for LogIn to use profile')
    );
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
          onClick={props.handleToggle}
        >
          Use day & time? {props.options.useTime ? 'day of week' : 'anytime'}
        </button>
        {/* Need a logged in user to have profile information */}
        <button id="toggle-box-profile"
          name="useProfile"
          onClick={props.handleToggle}
        >
          {profileText()}
        </button>
        <button id="toggle-box-location"
          name="chooseStart"
          onClick={props.handleToggle}
        >
          Map click: {props.options.chooseStart ? 'start' : 'destination'}
        </button>
      </div>
    </>
  );
}

export default SearchForm;
