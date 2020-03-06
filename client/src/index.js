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
  App.postKey(key);
  ReactDOM.render(<App.App />, document.getElementById("root"));
  registerServiceWorker();
};
