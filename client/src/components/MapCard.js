import React from 'react';
import GoogleMapReact from 'google-map-react';
import "./MapCard.css";

export default function MapCard({
    centerSkew,
    centerLat,
    centerLon,
    stations,
    startStation,
    endStation,
    mapClick
  }) {
  
  const defaultProps = { center: {lat: 41.90075, lng: -87.65}, zoom: 11 };

  const Station = (props) => (
    <div style={{
      color: 'white', 
      background: props.bkgnd,
      padding: '0px 1px',
      display: 'inline-flex',
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '100%',
      transform: 'translate(-50%, -50%)'
    }}>
      {props.text}
    </div>
  );

  return( 
    <div id="map" className="card mapcard">
      <GoogleMapReact
        onClick={mapClick}
        bootstrapURLKeys={centerSkew}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        yesIWantToUseGoogleMapApiInternals={true}
      >
        {stations.map((s,i) => (
          <Station key={i} 
            lat={s.stationLat} 
            lng={s.stationLon} 
            text={'*'} 
            bkgnd={'gray'}
          />
        ))}
        <Station 
          lat={centerLat} 
          lng={centerLon} 
          text={'loc'} 
          bkgnd={'magenta'}
        />
        <Station 
          lat={startStation.stationLat}
          lng={startStation.stationLon}
          text={'start'} 
          bkgnd={'green'}
        />
        <Station
          lat={endStation.stationLat}
          lng={endStation.stationLon} 
          text={'dest'}
          bkgnd={'red'}  
        />
      </GoogleMapReact> 
    </div>  
  );
}

