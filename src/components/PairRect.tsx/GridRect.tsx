import * as d3 from 'd3';
import React, { useMemo } from 'react';
import inputStyles from '../../styles/input.module.css';
import Gradient from '../ui/Gradient';

interface GridRectProps {
  data: number[][];
}

const WIDTH = 390;
const HEIGHT = 390;
const margin = { t: 0, r: 0, b: 0, l: 0 };

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
    <div className="grid-container">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%">
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

      <div className="grid-info">
        {/* todo: store index */}
        <p>Inconsistent block 1</p>
        <div className="dashed-divider" />

        <div className="input-wrapper">
          <p className="label">Grid Size: </p>
          <div className={inputStyles.wrapper}>
            <input className={inputStyles.input} type="number" min="0.1" max="15" defaultValue={0.1} />
          </div>
        </div>

        <div className="dashed-divider" />

        <p>Positive labels:</p>
        <Gradient colors={['#0b69b6', '#fff']} legends={['0%', '100%']} width="100%" />
        <div className="dashed-divider" />

        <p>Outputs:</p>
        <p>Positives</p>
        <p>Negatives</p>
      </div>
    </div>
  );
};

export default GridRect;
