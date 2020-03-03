import React from "react";
import { 
    VictoryBar, VictoryChart, VictoryAxis, VictoryTheme 
  } from "victory";
import "./TripsChart.css"

export default function TripsChart(props) {
  const chartStyle = {
    width: '400px',
    height: 'auto'
  };

  return (
    <>
      {props.querying?
      (
        <div id="waitMsg">Waiting for results: {props.waitTime}</div>
      ) :
      (
        <div className="chart-summary">
          Most Ride Times: <span id="average">{props.modeDuration}{props.nextBin? ` - ${props.nextBin}`: ''}</span>
          <div id="canvas" style={chartStyle}>
            <VictoryChart 
              domainPadding={10} 
              theme={VictoryTheme.material} 
            >
              <VictoryAxis
                tickValues={props.labels}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => (`${x}`)}
              />
              <VictoryBar 
                alignment={"start"}
                barRatio = {1.25}
                data={props.binTrips}
                x={"bin"}
                y={"trips"}
              />
            </VictoryChart>
          </div>
          <div className="chart-detail">
            <p id="std-dev">trips: {props.trips ? props.trips:'-'}, standard deviation: {props.stdDevDuration ? props.stdDevDuration:'-'}</p>
          </div>
        </div>
      )}
    </>
  );
}
