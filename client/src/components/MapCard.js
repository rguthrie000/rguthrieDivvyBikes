import React from 'react';
import GoogleMapReact from 'google-map-react';
import "./MapCard.css";

const Station = ({ text, background }) => (
  <div style={{
    color: 'white', 
    background: 'gray',
    padding: '0px 1px',
    display: 'inline-flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100%',
    transform: 'translate(-50%, -50%)'
  }}>
    {text}
  </div>
);

const LocStation = ({ text, background }) => (
  <div style={{
    color: 'white', 
    background: 'magenta',
    padding: '0px 1px',
    display: 'inline-flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100%',
    transform: 'translate(-50%, -50%)'
  }}>
    {text}
  </div>
);

const StartStation = ({ text, background }) => (
  <div style={{
    color: 'white', 
    background: 'green',
    padding: '0px 1px',
    display: 'inline-flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100%',
    transform: 'translate(-50%, -50%)'
  }}>
    {text}
  </div>
);

const EndStation = ({ text, background }) => (
  <div style={{
    color: 'white', 
    background: 'red',
    padding: '0px 1px',
    display: 'inline-flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100%',
    transform: 'translate(-50%, -50%)'
  }}>
    {text}
  </div>
);

function SimpleMap({keyVal,centerLat,centerLon,stations,startStation,endStation,mapClick}) {
  const defaultProps = {
    center: {lat: 41.90075, lng: -87.65},
    zoom: 11
  };

  return (
    <GoogleMapReact
      onClick={mapClick}
      // bootstrapURLKeys={{ key: {keyVal} }}
      bootstrapURLKeys={{ key: 'AIzaSyAcAthdRfN4aH4z75JtzKI3UXDFZxmw_V4'}}
      defaultCenter={defaultProps.center}
      defaultZoom={defaultProps.zoom}
      yesIWantToUseGoogleMapApiInternals
    >
      {stations.map((s,i) => (
        <Station key={i} lat={s.stationLat} lng={s.stationLon} text={'*'} background={'gray'}/>
      ))}
      <LocStation   lat={centerLat              } lng={centerLon              } text={'loc'}   />
      <StartStation lat={startStation.stationLat} lng={startStation.stationLon} text={'start'} />
      <EndStation   lat={endStation.stationLat  } lng={endStation.stationLon  } text={'dest'}  />
    </GoogleMapReact> 
  );
}

function MapCard({keyVal,centerLat,centerLon,stations,startStation,endStation,mapClick}) {
  return (
    <div id="map" className="card mapcard">
      <SimpleMap 
        keyVal={keyVal}
        centerLat={centerLat}
        centerLon={centerLon}
        stations={stations}
        startStation={startStation}
        endStation={endStation}
        mapClick={mapClick}
      />
    </div>
  );
}

export default MapCard;
