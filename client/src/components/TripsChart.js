import React from "react";
import timeSvcs from "../utils/timeSvcs"
import { 
    VictoryBar, VictoryChart, VictoryAxis, VictoryTheme 
  } from "victory";
import "./TripsChart.css"

export default function TripsChart(props) {
  const chartStyle = {
    width: '100%',
    height: 'auto'
  };

  return (
    <>
      {props.query.queryWait?
      (
        <div id="waitMsg">Waiting for results: {timeSvcs.makeMinutesAndSeconds(props.query.waitTimer)}</div>
      ) :
      (
        <div className="chart-summary">
          Most Ride Times: <span id="average">{props.plot.modeDuration}{props.plot.nextBin? ` - ${props.plot.nextBin}`: ''}</span>
          <div id="canvas" style={chartStyle}>
            <VictoryChart 
              domainPadding={10} 
              theme={VictoryTheme.material} 
            >
              <VictoryAxis
                tickValues={props.plot.labels}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => (`${x}`)}
              />
              <VictoryBar 
                alignment={"start"}
                barRatio = {1.25}
                data={props.plot.binTrips}
                x={"bin"}
                y={"trips"}
              />
            </VictoryChart>
          </div>
          <div className="chart-detail">
            <p id="std-dev">trips: {props.plot.trips ? props.plot.trips:'-'},
              standard deviation: {props.plot.stdDevDuration ? props.plot.stdDevDuration:'-'}</p>
          </div>
        </div>
      )}
    </>
  );
}
