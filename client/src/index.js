// index.js - Bike Planner client side start-up logic 
// (index.html has no content)
import tripsAPI              from "./utils/tripsAPI";
import React                 from "react";
import ReactDOM              from "react-dom";
import App                   from "./App";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";

// fetch Google Maps API key from our server.
// the react engine is then started from the callback,
// so the key has been provided *before* the first
// react render.
tripsAPI.getKey(startReact);

function startReact(key) {
  // copy the key into the namespace of the React app
  App.postKey(key);

  // and start React
  ReactDOM.render(<App.App />, document.getElementById("root"));

  // establish client side caching
  registerServiceWorker();
};
