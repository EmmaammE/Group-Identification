import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  setRange: Function;
  extent: number[];
  invoke: Function;
}

const WIDTH = 120;
const HEIGHT = 20;
const MARGIN = {
  bottom: 5,
  top: 5,
  left: 5,
  right: 5,
};

// brush两侧的宽度
const HANDLE_WIDTH = 10;

const RangeSlider = ({ minValue, maxValue, setRange, extent, invoke }: RangeSliderProps) => {
  const heightMap = HEIGHT - MARGIN.top - MARGIN.bottom;
  const widthMap = WIDTH - MARGIN.left - MARGIN.right;

  const x = d3.scaleLinear().domain(extent).range([0, widthMap]);

  const $brush = useRef(null);

  const brush = useMemo(
    () =>
      d3
        .brushX()
        .extent([
          [-2, -2],
          [widthMap, heightMap + 1],
        ])
        .on('start brush end', ({ selection, sourceEvent, type }) => {
          if (!sourceEvent) return;
          if (selection) {
            const sx = selection.map(x.invert);
            sx[0] = Math.floor(sx[0]);
            sx[1] = Math.ceil(sx[1]);

            if (sx[0] < extent[0]) {
              // eslint-disable-next-line prefer-destructuring
              sx[0] = extent[0];
            }

            if (sx[0] !== minValue || sx[1] !== maxValue) {
              d3.select($brush.current as any).call(brush.move, sx.map(x));
              // console.log(sx)
              setRange(sx);

              if (type === 'end') {
                invoke([sx[0] - 1, sx[1] - 1]);
              }
            }
          }
        }),
    [extent, heightMap, invoke, maxValue, minValue, setRange, widthMap, x]
  );

  useEffect(() => {
    if ($brush.current) {
      const brushSelect = d3.select($brush.current as any).call(brush);
      brushSelect.call(brush.move, extent.map(x));
    }
  }, [extent]);

  return (
    <div className="legend-wrapper">
      <p>{minValue < 10 ? `${minValue} ` : minValue}</p>
      <svg width="120px" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="range" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>

        <rect
          x={MARGIN.left}
          width={widthMap}
          y={MARGIN.top - 1}
          height={heightMap + 2}
          fill="#fff"
          stroke="#000"
        />

        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          <g ref={$brush} className="range-brush" />
          <rect
            className="my-handle"
            x={x(minValue)}
            y={-MARGIN.top}
            width={HANDLE_WIDTH}
            height={HEIGHT}
            rx={HANDLE_WIDTH / 2}
            ry={HANDLE_WIDTH / 2}
          />
          <rect
            className="my-handle"
            x={x(maxValue) - HANDLE_WIDTH / 2}
            y={-MARGIN.top}
            width={HANDLE_WIDTH}
            height={HEIGHT}
            rx={HANDLE_WIDTH / 2}
            ry={HANDLE_WIDTH / 2}
          />
        </g>
      </svg>
      <p>{maxValue}</p>
    </div>
  );
};

export default RangeSlider;
