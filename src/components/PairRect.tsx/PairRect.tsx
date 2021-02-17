import React from 'react';
import * as d3 from 'd3';
import './PairRect.scss';
import Heatmap from '../heatmap/Heatmap';

export interface PairRectProps {
  data: number[][];
  names: string[];
  size: number;
  index: number;
  handleClick: any;
}

// const color = d3.scaleLinear<string>().domain([-1, 0, 1]).range(['#e60d17', '#eee', '#0b69b6']);
const color = d3.scaleLinear<string>().domain([-1, 0, 1]).range(['#9ccb3c', '#fff', '#f7b326']);

const rectWidth = 10;
const rectHeight = 20;
const rectPadding = 5;
const PairRect = ({ data, names, size, index, handleClick }: PairRectProps) => {
  const WIDTH = rectWidth * data[0].length;
  const HEIGHT = rectHeight * data.length + rectPadding * (data.length - 1);
  const xScale = d3.scaleLinear().domain([0, data[0].length]).range([0, WIDTH]);

  return (
    <div
      className="pair-rect-container"
      onClick={handleClick}
      onKeyDown={handleClick}
      role="menuitem"
      tabIndex={0}
    >
      <div className="title">
        <span>Inconsistent block {index + 1}</span>
        <span>Size: {size}</span>
      </div>
      <div className="wrapper">
        <Heatmap cpArray={data} />
        <div className="names">
          {names.map((name) => (
            <p key={name}>{name}</p>
          ))}
        </div>
        <div className="svg-wrapper">
          <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
            {data.map((datum, i) => (
              <g key={`g-${i}}`}>
                {datum.map((d, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={xScale(j)}
                    y={i * (rectHeight + rectPadding)}
                    width={rectWidth}
                    height={rectHeight}
                    fill={color(d)}
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PairRect;
