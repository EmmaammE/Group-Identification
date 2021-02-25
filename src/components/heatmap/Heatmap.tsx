import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { transpose, mmultiply } from '../../utils/mm';

const WIDTH = 60;
const HEIGHT = 60;

// const MARGIN = {top: 30, right: 30, bottom: 30, left: 30};
const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

interface HeatmapProps {
  cpArray: number[][];
  data: number[][];
  // 异构点的序号
  heteroIndex: number[];
}

const Heatmap = ({ cpArray, data, heteroIndex }: HeatmapProps) => {
  const points = useMemo(() => {
    const cpT = transpose(cpArray); // 784*2
    return mmultiply(data, cpT);
  }, [cpArray, data]);

  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.bottom - MARGIN.right;

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

  const hull = d3.polygonHull(
    heteroIndex.map((index) => {
      const point = points[index];
      return [xScale(point[0]), yScale(point[1])];
    })
  );

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
        <g clipPath="url(#cut-off)">
          {densityData.map((d, i) => (
            <path d={d3.geoPath()(d) as string} key={i} fill={color(linear(d.value))} />
          ))}
        </g>

        {hull && (
          <path
            d={`M${hull.join('L')}Z`}
            // fill="var(--primary-color)"
            fill="none"
            strokeWidth={4}
            stroke="var(--primary-color)"
          />
        )}
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
