import React from "react";
import "./SearchForm.css";

function SearchForm(props) {
  return (
    <>
      <h6 id="timedate">{props.timeAndDate}</h6><h6 id="timecat">{props.isWeekday? 'weekday':'weekend'}, {props.partOfDay}</h6>
    <div id="search-box">
        <div>
          <div id="button-random">
            <button className="btn btn-primary button-search" onClick={props.whereAmI}>random</button>
          </div>  
            <div
            id="position-lat"
            className="number-box"
            value={props.title}
            name="position-lat"
            >{props.lat}</div>
            <div
            id="position-lon"
            className="number-box"
            value={props.author}
            name="position-lon"
            >{props.lon}</div>
        </div>
        <p id="minDistance">{props.minStationDist} miles to:</p>
        <div>
            <div id="start-station-id">{props.startStation}</div>
            <div
            id="start-station"
            className="number-box"
            value={props.subject}
            name="start-station"
            >{props.startName}</div>
        </div>
        <div>
            <div id="end-station-id">{props.endStation}</div>
            <div
            id="end-station"
            className="form-input"
            value={props.subject}
            name="end-station"
            >{props.endName}</div>
        </div>
    </div>
        <div id="radio-box-time">
          <p>Use day and time?</p>
          <div className="form-check-inline">
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
          <div className="form-check-inline">
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
          <div className="form-check-inline">
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
          <div className="form-check-inline">
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
