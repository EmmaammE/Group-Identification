import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import Heatmap from './Heatmap';
import { StateType } from '../../types/data';
import { getHeteList, loading, setChosePointAction } from '../../store/reducers/identify';
import { setSizeAction, setHeteroPointsAction } from '../../store/reducers/basic';
import { setIndexAction } from '../../store/reducers/blockIndex';
import HTTP_LEVEL from '../../utils/level';
import usePrevious from '../../utils/usePrevious';

export const WIDTH = 60;
export const HEIGHT = 60;

export const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
// const color = d3.scaleLinear<string>().domain([0, 0.2, 1]).range(['#fff', '#ccc', '#666']);
const areEqual = (first: number[][], second: number[][]) => {
  if (first.length !== second.length) {
    return false;
  }

  if (first.length === 0 || second.length === 0) {
    return false;
  }
  for (let i = 0; i < first.length; i++) {
    if (first[i].join('') !== second[i].join('')) {
      return false;
    }
  }
  // if(JSON.stringify(first)!==JSON.stringify(second)) {
  //   return false;
  // }
  return true;
};
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
  const heteroPoints = useSelector((state: StateType) => state.basic.heteroPoints);
  const setHeteroPoints = useCallback(
    (pointsParam) => dispatch(setHeteroPointsAction(pointsParam)),
    [dispatch]
  );
  const setChosePoint = useCallback((i) => dispatch(setChosePointAction(i)), [dispatch]);

  // const loading = useSelector((state: StateType) => state.identify.loading);

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
    if (heteroList[blockIndex] && heteroList[blockIndex].heteroIndex) {
      const d = heteroList[blockIndex].heteroIndex.map((index) => points[index] || []);
      // console.log(d)
      if (areEqual(heteroPoints, d) === false) {
        // console.log('set hetero')
        setClusterSize(heteroList[blockIndex].heteroSize);
        setHeteroPoints(d);
        setChosePoint(heteroList[blockIndex].heteroIndex[0]);
      }
    }
  }, [
    blockIndex,
    heteroList,
    heteroPoints,
    points,
    setChosePoint,
    setClusterSize,
    setHeteroPoints,
  ]);

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
