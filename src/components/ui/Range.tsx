import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
}

const WIDTH = 120;
const HEIGHT = 40;
const BOTTOM = 20;
const MARGIN = 8;
const TOP = 2;

const HANDLE_WIDTH = 10;

const RangeSlider = ({ minValue, maxValue }: RangeSliderProps) => {
  const heightMap = HEIGHT - BOTTOM;
  const widthMap = WIDTH + MARGIN * 2;

  const [left, setLeft] = useState<number>(minValue);
  const [right, setRight] = useState<number>(maxValue);

  const x = d3.scaleLinear().domain([minValue, maxValue]).range([0, WIDTH]);

  const $brush = useRef(null);

  const brush = useMemo(
    () =>
      d3
        .brushX()
        .extent([
          [0, 0],
          [WIDTH, heightMap + 1],
        ])
        .on('start brush end', ({ selection, sourceEvent }) => {
          if (!sourceEvent) return;
          if (selection) {
            const sx = selection.map(x.invert);
            // console.log(sx, selection)

            sx[0] = Math.floor(sx[0]) > minValue ? Math.floor(sx[0]) : minValue;
            sx[1] = Math.ceil(sx[1]);

            // console.log(sx)

            if (sx[0] !== left || sx[1] !== right) {
              setLeft(sx[0]);
              setRight(sx[1]);
              d3.select($brush.current as any).call(brush.move, sx.map(x));
            }
          }
        }),
    [heightMap, left, minValue, right, x]
  );

  useEffect(() => {
    if ($brush.current) {
      const brushSelect = d3.select($brush.current as any).call(brush);
      brushSelect.call(brush.move, [minValue, maxValue].map(x));
    }
  }, []);

  return (
    <svg viewBox={`0 0 ${widthMap} ${HEIGHT + TOP}`}>
      <defs>
        <linearGradient id="range" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
      </defs>

      <g transform={`translate(${MARGIN}, ${TOP})`}>
        <g ref={$brush} className="range-brush" />

        <rect className="my-handle" x={x(left)} y={0} width={HANDLE_WIDTH} height={heightMap} rx={HANDLE_WIDTH / 2} ry={HANDLE_WIDTH / 2} />
        <rect
          className="my-handle"
          x={x(right) - HANDLE_WIDTH / 2}
          y={0}
          width={HANDLE_WIDTH}
          height={heightMap}
          rx={HANDLE_WIDTH / 2}
          ry={HANDLE_WIDTH / 2}
        />

        <text x={x(left)} y={HEIGHT - 5} textAnchor="middle">
          {left}
        </text>
        <text x={x(right)} y={HEIGHT - 5} textAnchor="middle">
          {right}
        </text>
      </g>
    </svg>
  );
};

export default RangeSlider;
