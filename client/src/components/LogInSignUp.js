import React from "react";
import "./LogInSignUp.css";

function LogInSignUp(props) {
  return (
    <div className="loginsignup">  
        <h4>Sign Up or Log In</h4>
        <p className="message-box">{props.user.lastTry}</p>
        <form id="form-search">
            <div>
                <input
                  className="form-input"
                  value={props.user.userName}
                  name="userName"
                  type="text"
                  placeholder="user name"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.password}
                  name="password"
                  type="password"
                  placeholder="password (8+ chars)"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.gender}
                  name="gender"
                  type="text"
                  placeholder="gender (sign up)"
                  onChange={props.handleFormChange}
                />
            </div>
            <div>
                <input
                  className="form-input"
                  value={props.user.birthYear}
                  name="birthYear"
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

export default LogInSignUp;
