import React from "react";
import "./SearchForm.css";

function SearchForm(props) {
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

  return (
    <>
      <h6 id="timedate">{props.timeAndDate}</h6><h6 id="timecat">{props.isWeekday? 'weekday':'weekend'}, {props.partOfDay}</h6>
      <div id="search-box">
        <div>
          <label id="position-lat-label" htmlFor="position-lat">Location: lat</label>
          <div id="position-lat" className="number-box" value={props.title} name="position-lat">
            {props.lat}  
          </div>
          <label id="position-lon-label" htmlFor="position-lon">lon</label>
          <div id="position-lon" className="number-box" value={props.author} name="position-lon">
            {props.lon}
          </div>
        </div>
        <div id="button-random">
          <button id={dbStyle()} className="button-random" onClick={props.whereAmI}>random</button>
        </div>  
        <p id="minDistance">from this location, {props.minStationDist} miles to:</p>
        <div>
          <label id="start-station-id-label" htmlFor="start-station-id">Start Station id & name</label>
          <div id="start-station-id">{props.startStation}</div>
          <div
            id="start-station"
            className="number-box"
            value={props.subject}
            name="start-station"
          >
            {props.startName}
          </div>
        </div>
        <div>
          <label id="end-station-id-label" htmlFor="end-station-id">Destination Station id & name</label>
          <div id="end-station-id">{props.endStation}</div>
          <div
            id="end-station"
            className="form-input"
            value={props.subject}
            name="end-station"
          >
            {props.endName}
          </div>
        </div>
        <button id="toggle-box-time"
          name="useTime"
          onClick={props.handleToggle}
        >
          Use day & time? {props.useTime ? 'day of week' : 'anytime'}
        </button>
        <button id="toggle-box-profile"
          name="useProfile"
          onClick={props.handleToggle}
        >
          Use user profile? {props.useProfile ? 'profile' : 'all users'}
        </button>
        <button id="toggle-box-location"
          name="chooseStart"
          onClick={props.handleToggle}
        >
          Map click: {props.chooseStart ? 'start' : 'destination'}
        </button>
      </div>
    </>
  );
}

export default SearchForm;
