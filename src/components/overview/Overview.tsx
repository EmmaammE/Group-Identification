/* eslint-disable prefer-destructuring */
import React, { useMemo } from 'react';
import * as d3 from 'd3';

export interface OverviewProps {
  data: {
    fed: number[][];
    local: number[][];
    point: number[];
  };
  range: number[];
}

const SIZE = 400;
const PADDING = 10;

const dot = (v1: [number, number], v2: [number, number]) =>
  (v1[0] * v2[0] + v1[1] * v2[1]) /
  (Math.abs(v1[0] * v1[0] + v1[1] * v1[1]) ** 0.5 * Math.abs(v2[0] * v2[0] + v2[1] * v2[1]) ** 0.5);

// const color = d3.scaleLinear<string>().domain([-1, 0, 1]).range(['#aa815d', '#ffae7f', '#e6e6e6']);

const color = d3.scaleLinear<string>().domain([-1, 1]).range(['#aa815d', '#e6e6e6']);

const path = (fedPoints: number[][], localPoints: number[][], range: number[]) => {
  const arr = [];

  // for (let i = 0; i < fedPoints.length; i++) {
  if (range[1] !== 0) {
    for (let i = range[0]; i < range[1]; i++) {
      const prev = fedPoints[i - 1];

      const point = [fedPoints[i][0] - prev[0], fedPoints[i][1] - prev[1]];
      const localPoint = [localPoints[i - 1][0] - prev[0], localPoints[i - 1][0] - prev[1]];

      const cosine = dot(point as [number, number], localPoint as [number, number]);
      // console.log(prev, fedPoints[i], localPoints[i])
      arr.push(cosine);
    }
  }
  return arr;
};

const mergeDomain = (d1: number[], d2: number[]) => [
  d1[0] < d2[0] ? d1[0] : d2[0],
  d1[1] > d2[1] ? d1[1] : d2[1],
];
function Overview({ data, range }: OverviewProps) {
  const paths = useMemo(() => path(data.fed, data.local, range), [data.fed, data.local, range]);

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([PADDING, SIZE - PADDING])
        .domain(
          mergeDomain(
            d3.extent(data.local, (d) => d[0]) as any,
            d3.extent(data.fed, (d) => d[0]) as any
          )
        )
        .nice(),
    [data.fed, data.local]
  );
  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([SIZE - PADDING, PADDING])
        .domain(
          mergeDomain(
            d3.extent(data.local, (d) => d[1]) as any,
            d3.extent(data.fed, (d) => d[1]) as any
          )
        )
        .nice(),
    [data.fed, data.local]
  );

  console.log(xScale(0), yScale(0), '初始值');
  const colorScaleLinear = d3
    .scaleSequential(d3.interpolateRgb('#efefef', '#777'))
    .domain([0, data.fed.length]);

  return (
    <div id="Overview">
      <svg width="90%" viewBox="0 0 400 400">
        <defs>
          {/* {paths.local.map((pathPoint, i) => (
            <marker
              id={`marker-${i}`}
              key={`marker-${i}`}
              refX="6 "
              refY="6"
              viewBox="0 0 16 16"
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 0 0 12 6 0 12 3 6 Z" fill={pathPoint.stroke} />
            </marker>
          ))} */}

          {data.point.map((i) => (
            // const i: any = data.point[index];

            <marker
              id={`marker-${i}`}
              key={`marker-${i}`}
              refX="6 "
              refY="6"
              viewBox="0 0 16 16"
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path
                d="M 0 0 12 6 0 12 3 6 Z"
                // fill={color(paths[i])}
                fill="var(--primary-color)"
              />
            </marker>
          ))}
        </defs>
        <rect
          height="100%"
          width="100%"
          strokeWidth="2"
          strokeDasharray="2"
          fill="none"
          stroke="#000"
        />
        <g>
          {data.fed.map((point, i) => {
            if (i > 0) {
              return (
                <line
                  id={`${i}`}
                  key={`path${i}`}
                  stroke={colorScaleLinear(i)}
                  strokeWidth={1}
                  // {...pro}
                  x1={xScale(data.fed[i - 1][0])}
                  x2={xScale(point[0])}
                  y1={yScale(data.fed[i - 1][1])}
                  y2={yScale(point[1])}
                  strokeLinecap="round"
                />
              );
            }
            return null;
          })}
        </g>

        {/* <g>
        {
          data.local.map((point, i) => (
            <line
            key={`local${i}`}
            // markerEnd={`url(#${pathPoint.stroke})`}
            markerEnd={`url(#marker-${i})`}
            // stroke='var(--primary-color)'
            stroke={paths.local[i] && paths.local[i].stroke}
            x1={xScale(data.fed[i][0])}
            x2={xScale(point[0])}
            y1={yScale(data.fed[i][1])}
            y2={yScale(point[1])}
          />
          ))
        }
        </g> */}

        <g>
          {data.point.map((i) => {
            // const i: any = data.point[index];
            const point = data.local[i];

            return (
              <line
                key={`local${i}`}
                // markerEnd={`url(#${pathPoint.stroke})`}
                markerEnd={`url(#marker-${i})`}
                stroke="var(--primary-color)"
                // stroke={color(paths[i])}
                id={`${paths[i]}`}
                // stroke={paths.local[i] && paths.local[i].stroke}
                x1={xScale(data.fed[i][0])}
                x2={xScale(point[0])}
                y1={yScale(data.fed[i][1])}
                y2={yScale(point[1])}
              />
            );
          })}
        </g>

        {/* {data.fed.map((point, i) => {
          if(i>0) {
            return (
              <line
                key={`path${i}`}
                stroke={colorScaleLinear(i)}
                strokeWidth={1}
                // {...pro}
                x1={xScale(data.fed[i-1][0])}
                x2={xScale(point[0])}
                y1={yScale(data.fed[i-1][1])}
                y2={yScale(point[1])}
                strokeLinecap="round"
              />
            )
          } 
          return null
        })} */}

        {/* {paths.fed.map(({ x1, y1 }, i) => (
          <circle
            key={`${i}circle`}
            stroke="#777"
            r={1}
            cx={xScale(x1)}
            cy={yScale(y1)}
            fill="#fff"
          />
        ))} */}

        {/* <g>
        {data.fed.map((point, i) => (
              <circle
                key={`${i}circle`}
                stroke="#777"
                r={1}
                cx={xScale(point[0])}
                cy={yScale(point[1])}
                fill="#fff"
              />
            ))}
        </g> */}
      </svg>
    </div>
  );
}

export default Overview;
