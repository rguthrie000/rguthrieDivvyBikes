// LoginSignUp.js - Login / Signup dialog component for Divvy Bikes Planner
import React from "react";
import "./LogInSignUp.css";

export default function LogInSignUp(props) {
  return (
    <div className="loginsignup">  
        <h4>Sign Up or Log In</h4>
        <p className="message-box">{props.user.lastTry}</p>
        <form id="form-search">
            <div>
                <input
                  className="form-input"
                  value={props.user.userNameTmp}
                  name="userNameTmp"
                  type="text"
                  placeholder="user name"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.passwordTmp}
                  name="passwordTmp"
                  type="text"
                  placeholder="password"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.genderTmp}
                  name="genderTmp"
                  type="text"
                  placeholder="gender (sign up)"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.birthYearTmp}
                  name="birthYearTmp"
                  type="text"
                  placeholder="birth year (sign up)"
                  onChange={props.handleFormChange}
                />
            </div>
            <button className="btn btn-primary button-submit" onClick={props.handleFormSubmit}>
              Submit
            </button>
            <button className="btn btn-primary button-dismiss" onClick={props.handleFormDismiss}>
              Not Now
            </button>
        </form>
    </div>
  );
}
