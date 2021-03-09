import React, { useCallback, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import { stat } from 'fs';
import { transpose, mmultiply } from '../../utils/mm';
import Heatmap from './Heatmap';
import { StateType } from '../../types/data';
import { getHeteList, loading } from '../../store/reducers/identify';
import { setSizeAction } from '../../store/reducers/basic';
import { setIndexAction } from '../../store/reducers/blockIndex';
import HTTP_LEVEL from '../../utils/level';

export const WIDTH = 60;
export const HEIGHT = 60;

export const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
// const color = d3.scaleLinear<string>().domain([0, 0.2, 1]).range(['#fff', '#ccc', '#666']);

interface HeatmapWrapperProps {
  points: number[][];
  // x范围
  x: number[];
  // y范围
  y: number[];
  nOfCluster: number | null;
}

const HeatmapWrapper = ({ points, x, y, nOfCluster }: HeatmapWrapperProps) => {
  const heteroList = useSelector((state: StateType) => state.identify.heteroList.clusterList);
  const round = useSelector((state: StateType) => state.basic.round);

  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.bottom - MARGIN.right;

  const xScale = d3.scaleLinear().domain(x).range([0, width]).nice();
  const yScale = d3.scaleLinear().domain(y).range([height, 0]).nice();

  const dispatch = useDispatch();
  const getLists = useCallback((count: number | null) => dispatch(getHeteList(count)), [dispatch]);

  const blockIndex = useSelector((state: StateType) => state.blockIndex);
  const setClusterSize = useCallback((s) => dispatch(setSizeAction(s)), [dispatch]);
  const updateBlock = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const level = useSelector((state: StateType) => state.identify.level);

  // const loading = useSelector((state: StateType) => state.identify.loading);

  useEffect(() => {
    if (round !== 0 && level === HTTP_LEVEL.clusters) {
      // console.log('test')
      getLists(nOfCluster);
    }
  }, [getLists, level, nOfCluster, round]);

  const densityData = useMemo(
    () =>
      d3
        .contourDensity()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .size([width, height])
        .bandwidth(4)
        .thresholds(800)(points as any),
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
      // console.log(heteroList)
      heteroList.map((heteroItem) =>
        heteroItem.heteroIndex.map((index) => {
          const point = points[index];
          if (point) {
            return [xScale(point[0]), yScale(point[1])];
          }
          return [0, 0];
        })
      ),
    [heteroList, points, xScale, yScale]
  );

  useEffect(() => {
    if (heteroList[blockIndex]) {
      setClusterSize(heteroList[blockIndex].heteroSize);
    }
  }, [blockIndex, heteroList, setClusterSize]);

  // console.log(heteroPointsArr)
  const n = nOfCluster !== null && nOfCluster < 4 ? nOfCluster : 4;
  const ifMultiLine = nOfCluster !== null && nOfCluster > 4;
  return (
    <div className="pair-rect-wrapper">
      <div
        className="scroll-glyphs"
        style={{
          gridTemplateColumns: `repeat(${n}, ${`${((ifMultiLine ? 100 : 103) - n * 3) / n}%`})`,
        }}
      >
        {heteroList.map((heteroItem, i) => (
          <div
            className="pair-rect"
            key={i}
            role="menuitem"
            tabIndex={0}
            onClick={() => updateBlock(i)}
            onKeyDown={() => updateBlock(i)}
          >
            <div className={blockIndex === i ? 'selected' : ''}>
              <Heatmap
                densityData={densityData}
                linear={linear}
                heteroPoints={heteroPointsArr[i]}
              />
            </div>
            <p>Size: {heteroItem.heteroSize}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapWrapper;
