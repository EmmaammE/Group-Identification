import * as d3 from 'd3';
import React, { useMemo } from 'react';

interface GridRectProps {
  data: number[][];
}

const WIDTH = 390;
const HEIGHT = 320;
const margin = { t: 33, r: 10, b: 20, l: 30 };

const colorScale = d3.scaleLinear<string>().domain([0, 1]).range(['#fff', 'rgba(84, 122, 167, .7)']);

const GridRect = ({ data }: GridRectProps) => {
  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, data.length])
        .range([0, WIDTH - margin.l - margin.r]),
    [data]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, data.length])
        .range([0, HEIGHT - margin.t - margin.b]),
    [data]
  );

  const width = useMemo(() => xScale(1) - xScale(0), [xScale]);
  const height = useMemo(() => yScale(1) - yScale(0), [yScale]);

  return (
    <div className="container grid-wrapper">
      <div className="legend">
        <span>1</span>
        <svg viewBox="0 0 55 5">
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0b69b6" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="90%" height="100%" fill="url(#gradient2)" />
        </svg>
        <span>0</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(${margin.l},${margin.t})`}>
          {data.map((dataRow, i) =>
            dataRow.map((d, j) => (
              <rect
                key={`${i}-${j}`}
                x={xScale(j)}
                y={yScale(i)}
                width={width}
                height={height}
                fill={colorScale(d)}
                // stroke='#ccc'
              />
            ))
          )}
        </g>
      </svg>
    </div>
  );
};

export default GridRect;
