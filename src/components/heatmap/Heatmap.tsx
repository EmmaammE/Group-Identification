import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
// import { cp1, cp2} from './test'
import { line } from 'd3';
import data from '../../assets/source/samples.json';

const transpose = (a: number[][]) => a[0].map((x, i) => a.map((y) => y[i]));
const dotproduct = (a: number[], b: number[]) =>
  a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
const mmultiply = (a: number[][], b: number[][]) =>
  a.map((x) => transpose(b).map((y) => dotproduct(x, y)));

const WIDTH = 60;
const HEIGHT = 60;

const rawData = (data as any).samples;
// const MARGIN = {top: 30, right: 30, bottom: 30, left: 30};
const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

interface HeatmapProps {
  cpArray: number[][];
}

const Heatmap = ({ cpArray }: HeatmapProps) => {
  const points = useMemo(() => {
    const cpT = transpose(cpArray); // 31*2
    return mmultiply(rawData, cpT);
  }, [cpArray]);

  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.bottom - MARGIN.right;

  const $axes = useRef(null);

  const x = [Number.MAX_VALUE, Number.MIN_VALUE];
  const y = x.slice();

  points.forEach((point) => {
    x[0] = Math.min(point[0], x[0]);
    x[1] = Math.max(point[0], x[1]);

    y[0] = Math.min(point[1], y[0]);
    y[1] = Math.max(point[1], y[1]);
  });

  const xScale = d3.scaleLinear().domain(x).range([0, width]).nice();
  const yScale = d3.scaleLinear().domain(y).range([height, 0]).nice();

  const densityData = useMemo(
    () =>
      d3
        .contourDensity()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .size([width, height])
        .bandwidth(10)
        .thresholds(1000)(points as any),
    [xScale, width, height, points, yScale]
  );

  const linear = d3
    .scaleLinear()
    .domain([0, d3.max(densityData, (d) => d.value)] as [number, number]) // Points per square pixel.
    .range([0, 1]);

  const color = d3.scaleLinear<string>().domain([0, 0.2, 1]).range(['#fff', '#ccc', '#666']);

  const hull = d3.polygonHull(points.map((point) => [xScale(point[0]), yScale(point[1])]));

  // useEffect(() => {
  //   if($axes.current) {
  //     d3.select($axes.current)
  //       .append('g').call(d3.axisLeft(yScale));

  //     d3.select($axes.current)
  //       .append('g')
  //       .attr('transform', `translate(0, ${height})`)
  //       .call(d3.axisBottom(xScale));
  //   }

  // }, [$axes, height, xScale, yScale])

  // console.log(densityData);
  // console.log(points)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <clipPath id="cut-off">
          <rect x={0} y={0} width={width} height={height} />
        </clipPath>
      </defs>

      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* <g className="axes" ref={$axes} /> */}
        <g clipPath="url(#cut-off)">
          {densityData.map((d, i) => (
            <path d={d3.geoPath()(d) as string} key={i} fill={color(linear(d.value))} />
          ))}
        </g>

        {hull && <path d={`M${hull.join('L')}Z`} fill="none" stroke="var(--primary-color)" />}
      </g>

      <rect
        x={MARGIN.left}
        y={MARGIN.top}
        width={width}
        height={height}
        fill="none"
        stroke="#000"
      />
    </svg>
  );
};

export default React.memo(Heatmap);
