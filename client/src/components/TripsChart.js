import React from "react";
import { 
    VictoryBar, VictoryChart, VictoryAxis, VictoryTheme 
  } from "victory";
import "./TripsChart.css"

export default function TripsChart(props) {
  return (
    <>
      <div className="chart-summary">
        Average Ride Time <span id="average">{props.averageDuration}</span>
      </div>
      <div id="canvas">
        <VictoryChart 
          domainPadding={20} 
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
            data={props.binTrips}
            x={"bin"}
            y={"trips"}
          />
        </VictoryChart>
      </div>
      <div className="chart-detail">
        standard deviation <span id="std-dev">{props.stdDevDuration}</span>
      </div>
    </>
  );
}
