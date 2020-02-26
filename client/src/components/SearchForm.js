import React from "react";
import "./SearchForm.css";

function SearchForm(props) {
  return (
    <>
      <h6 id="timedate">{props.timeAndDate}</h6><h6 id="timecat">{props.isWeekday? 'weekday':'weekend'}, {props.partOfDay}</h6>
    <div id="search-box">
        <div>
          <div id="button-random">
            <button className="button-random" onClick={props.whereAmI}>random</button>
          </div>  
            <label id="position-lat-label" htmlFor="position-lat">Location: lat</label>
            <div id="position-lat" className="number-box" value={props.title} name="position-lat">
            <p>{props.lat}</p>  
            </div>
            <label id="position-lon-label" htmlFor="position-lon">lon</label>
            <div id="position-lon" className="number-box" value={props.author} name="position-lon">
              {props.lon}
            </div>
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
            >{props.startName}</div>
        </div>
        <div>
            <label id="end-station-id-label" htmlFor="end-station-id">Destination Station id & name</label>
            <div id="end-station-id">{props.endStation}</div>
            <div
            id="end-station"
            className="form-input"
            value={props.subject}
            name="end-station"
            >{props.endName}</div>
        </div>
    </div>
        <div id="radio-box-location">
          <p>Map click:</p>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="clickStart"
                value="start"
                className="form-check-input"
                checked={props.clickStart}
                onChange={props.handleClickStart}
              />
              start
            </label>
          </div>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="clickStart"
                value="end"
                className="form-check-input"
                checked={!props.clickStart}
                onChange={props.handleClickStart}
              />
              destination
            </label>
          </div>
        </div>
        <div id="radio-box-time">
          <p>Use day & time?</p>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="useTime"
                value="yes"
                className="form-check-input"
                checked={props.useTime}
                onChange={props.handleRadio}
              />
              yes
            </label>
          </div>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="useTime"
                value="no"
                className="form-check-input"
                checked={!props.useTime}
                onChange={props.handleRadio}
              />
              no
            </label>
          </div>
        </div>
        <div id="radio-box-profile">
          <p>Use user profile?</p>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="useProfile"
                value="yes"
                className="form-check-input"
                checked={props.useProfile}
                onChange={props.handleRadio}
              />
              yes
            </label>
          </div>
          <div className="form-check">
            <label>
              <input
                type="radio"
                name="useProfile"
                value="no"
                className="form-check-input"
                checked={!props.useProfile}
                onChange={props.handleRadio}
              />
              no
            </label>
          </div>
        </div>
    </>
  );
}

export default SearchForm;
