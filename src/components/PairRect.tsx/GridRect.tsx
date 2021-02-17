import * as d3 from 'd3';
import { index } from 'd3';
import React, { useMemo } from 'react';
import inputStyles from '../../styles/input.module.css';
import Gradient from '../ui/Gradient';

interface GridRectProps {
  data: number[][];
}

const WIDTH = 460;
const HEIGHT = 420;
const margin = { t: 50, r: 0, b: 0, l: 90 };
// 格子之间的缝隙
const padding = 10;

const colorScale = d3
  .scaleLinear<string>()
  .domain([0, 1])
  .range(['#fff', 'rgba(84, 122, 167, .7)']);

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

  const size = 3;
  // 矩形，这里就用宽代替了
  const indexScale = d3
    .scaleLinear()
    .range([0, WIDTH - margin.l - margin.r - padding * (size - 1)])
    .domain([0, 2 * size]);

  return (
    <div className="grid-container">
      <div className="svg-wrapper">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} height="100%">
          <text x={WIDTH / 2 + margin.l / 2} y="20" textAnchor="middle">
            Ground truth label
          </text>
          <text x="20" y={HEIGHT / 2 + margin.t / 2} textAnchor="middle" className="label">
            Output label
          </text>
          {/* <text x="80" y="50%" textAnchor="end">LabelY</text> */}
          {/* <text x="50%" y="40" textAnchor="end">LabelX</text> */}
          <g transform={`translate(${margin.l},${margin.t})`}>
            {Array.from({ length: size }, (v, i) => `Label${i}`).map((text, j) => (
              <text key={j} x={indexScale(2 * j + 1) + j * padding} y={-10} textAnchor="middle">
                {text}
              </text>
            ))}
            {Array.from({ length: size }, (v, i) => `Label${i}`).map((text, j) => (
              <text key={j} y={indexScale(2 * j + 1) + j * padding} x={-30} textAnchor="middle">
                {text}
              </text>
            ))}
            {data.map((dataRow, i) =>
              dataRow.map((d, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={xScale(j)}
                  y={yScale(i)}
                  width={width}
                  height={height}
                  fill={colorScale(d)}
                />
              ))
            )}
          </g>
        </svg>
      </div>

      <div className="grid-info">
        {/* todo: store index */}
        <p>Inconsistent block 1</p>

        <div className="input-wrapper">
          <p className="label">Grid Size: </p>
          <div className={inputStyles.wrapper}>
            <input
              className={inputStyles.input}
              type="number"
              min="0.1"
              max="15"
              defaultValue={0.1}
            />
          </div>
        </div>

        <p>Positive labels:</p>
        <Gradient colors={['#e60d17', '#fff', '#0b69b6']} legends={['0%', '100%']} width="100%" />

        <p>Outputs:</p>
        <p>Positives</p>
        <p>Negatives</p>

        <p>Label: (The semantic</p>
        <p>meaning of the label)</p>

        <div className="op-container">
          <p>Operation</p>
          <div>
            <div>
              <input type="radio" />
              <span>Remove this block</span>
            </div>
            <div>
              <input type="radio" />
              <span>Ignore</span>
            </div>
            <div>
              <input type="radio" />
              <span>
                Quit federated
                <br /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;learning
              </span>
            </div>
          </div>
          <button type="button">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default GridRect;
