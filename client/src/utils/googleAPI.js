import axios from "axios";
import {divvyLimits} from "./geoMath"
import {debug} from "../debug";

https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap

const BASE_URL = `https://maps.googleapis.com/maps/api/js?key=`;
const CALLBACK_LABEL = '&callback=';

function getMap(center,zoom) {
  const maxVolumes = 40; // Google Books' default is 10, max is 40
  let queryStr = `${BASE_URL}+process.env.geokey+CALLBACK_LABEL+initMap`;
  // Let's see what's out there.
  return(axios.get());
}


 let map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}

export default {getBooks, getVolume};
      
