import React from 'react';
import * as d3 from 'd3';

export interface GradientProps {
  colors: string[];
  legends: string[];
  width?: string;
}

const Gradient = ({ colors, legends, width }: GradientProps) => {
  const scale = d3.scaleLinear<string>().domain([0, colors.length]).range(['0%', '100%']);

  return (
    <div className="legend-wrapper">
      <p>{legends[0]}</p>
      <svg width={width || '160px'} viewBox={width ? `0 0 80 20` : '0 0 160 20'}>
        <defs>
          <linearGradient id={colors.join('')} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, i) => (
              <stop offset={scale(i)} stopColor={color} />
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
