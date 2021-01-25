import React, { useMemo } from 'react';
import './Overview.scss';
import * as d3 from 'd3';

export interface OverviewProps {
  data: {
    fed: number[][];
    local: number[][];
    batchSize: number[];
  };
}

const SIZE = 400;
const PADDING = 10;

const dot = (v1: [number, number], v2: [number, number]) =>
  (v1[0] * v2[0] + v1[1] * v2[1]) /
  ((v1[0] * v1[0] + v1[1] * v1[1]) ** 0.5 *
    (v2[0] * v2[0] + v2[1] * v2[1]) ** 0.5);

const color = d3
  .scaleLinear<string>()
  .domain([-1, 0, 1])
  .range(['#e60d17', '#ccc', '#0b69b6']);

const path = (fedPoints: number[][], localPoints: number[][]) => {
  // 计算x y 范围的极值
  const xExtent = [Number.MAX_VALUE, Number.MIN_VALUE];
  const yExtent = xExtent.slice();

  // 计算每一段的路径的绝对起点和终点
  const prev = [0, 0];
  const paths = [];
  const pathsLocal = [];

  const factor = 0.0001;

  for (let i = 0; i < fedPoints.length; i++) {
    const point = fedPoints[i];
    const localPoint = localPoints[i];

    const cosine = dot(
      point as [number, number],
      localPoint as [number, number]
    );

    const x1 = prev[0];
    const x2 = prev[1];
    const y1 = prev[0] + localPoint[0];
    const y2 = prev[1] + localPoint[1];
    const size = ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) ** 0.5;
    pathsLocal.push({
      x1: prev[0],
      y1: prev[1],
      x2: prev[0] + localPoint[0],
      y2: prev[1] + localPoint[1],
      // x1,
      // y1,
      // x2: x1 + factor * (x2 - x1) / size,
      // y2: y1 + factor * (y2 - y1) / size,
      // stroke: cosine < 0 ? '#e60d17' : '#0b69b6',
      stroke: color(cosine),
      cosine,
    });

    paths.push({
      x1: prev[0],
      y1: prev[1],
      x2: (prev[0] += point[0]),
      y2: (prev[1] += point[1]),
    });

    xExtent[0] = Math.min(xExtent[0], paths[i].x1, paths[i].x2, x2);
    xExtent[1] = Math.max(xExtent[1], paths[i].x1, paths[i].x2, x2);
    yExtent[0] = Math.min(yExtent[0], paths[i].y1, paths[i].y2, y2);
    yExtent[1] = Math.max(yExtent[1], paths[i].y1, paths[i].y2, y2);
  }

  // console.log('xExtent, yExtent', xExtent, yExtent)
  return {
    fed: paths,
    local: pathsLocal,
    extent: [xExtent, yExtent],
  };
};

function Overview({ data }: OverviewProps) {
  const paths = useMemo(() => path(data.fed, data.local), [
    data.fed,
    data.local,
  ]);

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([PADDING, SIZE - PADDING])
        .domain(paths.extent[0])
        .nice(),
    [paths.extent]
  );
  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([PADDING, SIZE - PADDING])
        .domain(paths.extent[1])
        .nice(),
    [paths.extent]
  );

  console.log(xScale(0), yScale(0), '初始值');
  const colorScaleLinear = d3
    .scaleSequential(d3.interpolateRgb('#efefef', '#000'))
    .domain([0, data.fed.length]);

  return (
    <div className="Overview">
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        <defs>
          {paths.local.map((pathPoint, i) => (
            <marker
              id={`marker-${i}`}
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
          ))}
        </defs>
        {paths.local.map(({ x1, x2, y1, y2, ...pro }, i) => (
          <line
            key={i}
            // markerEnd={`url(#${pathPoint.stroke})`}
            markerEnd={`url(#marker-${i})`}
            strokeWidth={1}
            {...pro}
            x1={xScale(x1)}
            x2={xScale(x2)}
            y1={yScale(y1)}
            y2={yScale(y2)}
          />
        ))}

        {paths.fed.map(({ x1, x2, y1, y2, ...pro }, i) => (
          <line
            key={i}
            stroke={colorScaleLinear(i)}
            strokeWidth={data.batchSize[i] * 1.5}
            {...pro}
            x1={xScale(x1)}
            x2={xScale(x2)}
            y1={yScale(y1)}
            y2={yScale(y2)}
            strokeLinecap="round"
          />
        ))}

        {paths.fed.map(({ x1, y1 }, i) => (
          <circle
            key={`${i}circle`}
            stroke={colorScaleLinear(i)}
            r={data.batchSize[i] * 1.5}
            cx={xScale(x1)}
            cy={yScale(y1)}
            fill="#fff"
          />
        ))}
      </svg>
    </div>
  );
}

export default Overview;
