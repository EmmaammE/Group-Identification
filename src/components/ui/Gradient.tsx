import React from 'react';
import * as d3 from 'd3';

export interface GradientProps {
  colors: string[];
  legends: string[];
  width?: string;
}

const Gradient = ({ colors, legends, width }: GradientProps) => {
  const scale = d3
    .scaleLinear<string>()
    .domain([0, colors.length - 1])
    .range(['0%', '100%']);

  return (
    <div className="legend-wrapper">
      <p>{legends[0]}</p>
      <svg width={width || '120px'} viewBox={width ? `0 0 80 15` : '0 0 120 15'}>
        <defs>
          <linearGradient id={colors.join('')} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, i) => (
              <stop offset={scale(i)} stopColor={color} key={color} />
            ))}
          </linearGradient>
        </defs>
        <rect x="0%" y="0" width="100%" height="100%" fill={`url(#${colors.join('')})`} />
      </svg>
      <p>{legends[1]}</p>
    </div>
  );
};

export default React.memo(Gradient);
