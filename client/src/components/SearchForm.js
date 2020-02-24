import React from "react";
import "./SearchForm.css";

function SearchForm(props) {
  return (
    <>
      <h6>{props.timeAndDate}</h6>
    <div className="nav-button">
      <button className="page-choice" onClick={props.whereAmI}>random</button>
    </div>
    <form id="form-search">
        <div>
            <input
            className="form-input"
            value={props.title}
            name="title"
            type="text"
            placeholder={props.lat}
            onChange={props.handleFormChange}
            />
        </div>
        <div>
            <input
            className="form-input"
            value={props.author}
            name="author"
            type="text"
            placeholder={props.lon}
            onChange={props.handleFormChange}
            />
        </div>
        <div>
            <input
            className="form-input"
            value={props.subject}
            name="subject"
            type="text"
            placeholder={props.startStation}
            onChange={props.handleFormChange}
            />
        </div>
        <div>
            <input
            className="form-input"
            value={props.subject}
            name="subject"
            type="text"
            placeholder={props.endStation}
            onChange={props.handleFormChange}
            />
        </div>
        <button className="btn btn-primary button-search" 
          onClick={props.handleFormSubmit}>Go!</button>
    </form>
    </>
  );
}

export default SearchForm;
