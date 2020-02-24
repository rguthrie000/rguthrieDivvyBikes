import React from "react";
import "./SearchForm.css";

function SearchForm(props) {
  return (
    <>
      <h6>{props.timeAndDate} {props.isWeekday? 'weekday':'weekend'}, {props.partOfDay}</h6>
    <form id="form-search">
        <div>
          <div id="button-random">
            <button className="btn btn-primary button-search" onClick={props.whereAmI}>random</button>
          </div>  
            <input
            className="form-input"
            value={props.title}
            name="title"
            type="text"
            placeholder={props.lat}
            onChange={props.handleFormChange}
            />
            <input
            className="form-input"
            value={props.author}
            name="author"
            type="text"
            placeholder={props.lon}
            onChange={props.handleFormChange}
            />
        </div>
        <p>{props.minStationDist} miles to:</p>
        <div>
            <input
            className="form-input"
            value={props.subject}
            name="subject"
            type="text"
            placeholder={props.startStation+props.startName}
            onChange={props.handleFormChange}
            />
        </div>
        <div>
            <input
            className="form-input"
            value={props.subject}
            name="subject"
            type="text"
            placeholder={props.endStation+props.endName}
            onChange={props.handleFormChange}
            />
        </div>
    </form>
        <p>Use day and time?</p>
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
    </>
  );
}

export default SearchForm;
