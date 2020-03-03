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
  
  const defaultProps = { center: {lat: 41.9, lng: -87.65}, zoom: 11 };

  const Station = (props) => (
    <div style={{
      color: props.textColor ? props.textColor : 'white', 
      background: props.bkgnd,
      padding: '0px 1px 0px 1px',
      height: props.height? props.height : 'auto',
      width: props.width? props.width : 'auto',
      display: 'inline-flex',
      fontSize : props.fontSize? props.fontSize : '10px',
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid black',
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
          height={'40px'}
          width={'60px'}
          fontSize={'24px'}
          bkgnd={'magenta'}
        />
        <Station 
          lat={startStation.stationLat}
          lng={startStation.stationLon}
          text={'start'} 
          textColor='green'
          height={'40px'}
          width={'60px'}
          fontSize={'24px'}
          bkgnd={'white'}
        />
        <Station
          lat={endStation.stationLat}
          lng={endStation.stationLon} 
          text={'dest'}
          height={'40px'}
          width={'60px'}
          fontSize={'24px'}
          bkgnd={'red'}  
        />
      </GoogleMapReact> 
    </div>  
  );
}

