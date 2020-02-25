import React from 'react';
import GoogleMapReact from 'google-map-react';
import "./MapCard.css";

const AnyReactComponent = ({ text }) => (
  <div style={{
    color: 'white', 
    background: 'grey',
    padding: '15px 10px',
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

class SimpleMap extends React.Component {
  static defaultProps = {
    center: {lat: 41.90075, lng: -87.85},
    zoom: 11
  };

  render() {
    return (
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyAcAthdRfN4aH4z75JtzKI3UXDFZxmw_V4' }}
        defaultCenter={this.props.center}
        defaultZoom={this.props.zoom}
      >
        <AnyReactComponent 
          lat={41.876511229} 
          lng={-87.62054801} 
          text={'Buckingham Fountain'} 
        />
      </GoogleMapReact>
    );
  }
}

function MapCard(props) {
  return (
    <div id="map" className="card mapcard">
      <SimpleMap/>
    </div>
  );
}

export default MapCard;
