// MapCard.js - Google Map component for Divvy Bikes Planner
import React from 'react';
import GoogleMapReact from 'google-map-react';
import "./MapCard.css";

export default function MapCard({geoKey, stations, mapClick}) {
  
  const defaultProps = { center: {lat: 41.9, lng: -87.65}, zoom: 11 };

  // the Station subcomponent is parameterized for placement and
  // styling.
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

  const stationList = () => {return(stations.populated? stations.list : []);}

  return( 
    <div id="map" className="card mapcard">
      <GoogleMapReact
        onClick={mapClick}
        bootstrapURLKeys={{key: geoKey}}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        yesIWantToUseGoogleMapApiInternals={true}
      >
        {stationList().map((s,i) => (
          <Station key={i} 
            lat={s.stationLat} 
            lng={s.stationLon} 
            text={'*'} 
            bkgnd={'gray'}
          />
        ))}
        <Station 
          lat={stations.location.lat} 
          lng={stations.location.lon} 
          text={'loc'} 
          height={'40px'}
          width={'60px'}
          fontSize={'24px'}
          bkgnd={'magenta'}
        />
        <Station 
          lat={(stations.populated? stations.list[stations.startIndex] : {}).stationLat}
          lng={(stations.populated? stations.list[stations.startIndex] : {}).stationLon}
          text={'start'} 
          textColor='green'
          height={'40px'}
          width={'60px'}
          fontSize={'24px'}
          bkgnd={'white'}
        />
        <Station
          lat={(stations.populated? stations.list[stations.endIndex  ] : {}).stationLat}
          lng={(stations.populated? stations.list[stations.endIndex  ] : {}).stationLon} 
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

