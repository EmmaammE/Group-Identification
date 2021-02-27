import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { useSelector } from 'react-redux';
import { transpose, mmultiply } from '../../utils/mm';
import Heatmap from './Heatmap';
import { StateType } from '../../types/data';

export const WIDTH = 60;
export const HEIGHT = 60;

export const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
// const color = d3.scaleLinear<string>().domain([0, 0.2, 1]).range(['#fff', '#ccc', '#666']);

const HeatmapWrapper = () => {
  const cpArray = useSelector((state: StateType) => [
    state.identify.pca.pc1,
    state.identify.pca.pc2,
  ]);
  const samples = useSelector((state: StateType) => state.identify.samples);
  const heteroList = useSelector((state: StateType) => state.identify.heteroList);

  const points = useMemo(() => {
    const cpT = transpose(cpArray); // 784*2
    return mmultiply(samples, cpT);
  }, [cpArray, samples]);

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

  const linear = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(densityData, (d) => d.value)] as [number, number])
        .range([0, 1]),
    [densityData]
  );

  const heteroPointsArr = useMemo(
    () =>
      heteroList.map((heteroItem) =>
        heteroItem.heteroIndex.map((index) => {
          const point = points[index];
          return [xScale(point[0]), yScale(point[1])];
        })
      ),
    [heteroList, points, xScale, yScale]
  );

  // console.log(heteroPointsArr)

  return (
    <div className="pair-rect-wrapper">
      {heteroList.map((heteroItem, i) => (
        <div className="pair-rect" key={i}>
          <div>
            <Heatmap densityData={densityData} linear={linear} heteroPoints={heteroPointsArr[i]} />
          </div>
          <p>Size: {heteroItem.heteroSize}</p>
          <p>Purity: {d3.format('.0%')(heteroItem.heteroRate)}</p>
        </div>
      ))}
    </div>
  );
};

export default HeatmapWrapper;
