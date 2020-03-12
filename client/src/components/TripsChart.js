import React from "react";
import timeSvcs from "../utils/timeSvcs"
import { 
    VictoryChart, VictoryBar, VictoryLine, VictoryScatter,  
    VictoryAxis, VictoryLabel, VictoryTheme, VictoryClipContainer
  } from "victory";
import "./TripsChart.css"

export default function TripsChart(props) {
  const chartStyle1 = {
    width: '100%',
    height: 'auto'
  };
  const chartStyle2 = {
    width:  '88%',
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
          {props.plot.plotTripsByDur ?
          (<div id="canvas1" style={chartStyle1}>
            <button 
              className="button-swap-right"
              name="swapPlot" 
              onClick={props.swapPlots}
            >&rarr;</button>
            Most Ride Times: <span id="average">{props.plot.modeDuration}{props.plot.nextBin? ` - ${props.plot.nextBin}`: ''}</span>
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
            <div className="chart-detail">
              <p id="std-dev">trips: {props.plot.trips ? props.plot.trips:'-'},
                standard deviation: {props.plot.stdDevDuration ? props.plot.stdDevDuration:'-'}</p>
            </div>
          </div>)
          :  
          (<div id="canvas2">
            <button 
              className="button-swap-left" 
              name="swapPlot" 
              onClick={props.swapPlots}
            >&larr;</button>
            <div id="chartAvgByHr" style={chartStyle2}>
              <VictoryChart
              >
                <VictoryLabel text="Rides by Hour" x={250} y={30} textAnchor="middle"/>
                <VictoryAxis
                  label='hour of the day'
                  tickValues={props.plot.labelsDur}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(x) => (`${x}`)}
                  fixLabelOverlap
                />
                <VictoryLine
                  height={180}
                  groupComponent={<VictoryClipContainer clipPadding={{ top: 5, right: 10 }}/>}
                  style={{ data: { stroke: "#c43a31", strokeWidth: 15, strokeLinecap: "round" } }}
                  data={props.plot.pointsCt}
                />
              </VictoryChart>
              <VictoryChart
              >
                <VictoryLabel text="Average Duration by Hour" x={250} y={30} textAnchor="middle"/>
                <VictoryAxis
                  label='hour of the day'
                  tickValues={props.plot.labelsDur}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(x) => (`${timeSvcs.makeMinutesAndSeconds(x)}`)}
                  fixLabelOverlap
                />
                <VictoryScatter
                  height={180}
                  groupComponent={<VictoryClipContainer clipPadding={{ top: 5, right: 10 }}/>}
                  style={{ data: { stroke: "#c43a31", strokeWidth: 15, strokeLinecap: "round" } }}
                  data={props.plot.pointsDur}
                />
              </VictoryChart>
            </div>  
          </div>)}
        </div>
      )}
    </>
  );
}
