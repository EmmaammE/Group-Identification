import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PairRect.scss';
import { useDispatch, useSelector } from 'react-redux';
import { parse } from 'path';
import { StateType } from '../../types/data';
import { setPosAction, setPropertyAction } from '../../store/reducers/basic';

export interface PairRectProps {
  data: number[];
  title: number;
}

function getPixelRatio(context: any) {
  const dpr = window.devicePixelRatio || 1;
  const bsr =
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  return dpr / bsr;
}

// const color = d3.scaleLinear<string>().domain([-1, 0, 1]).range(['#e60d17', '#eee', '#f7b326']);
const color = d3.scaleLinear<string>().domain([-0.3, 0, 0.3]).range(['#0aa6e9', '#fff', '#ea4d40']);

const rectWidth = 20;
const rectHeight = 20;

const rowCount = 28;
interface Pro {
  x: number;
  y: number;
  width: number;
  height: number;
}
const PairRect = ({ data, title }: PairRectProps) => {
  const columnCount = data.length / rowCount;
  const WIDTH = rectWidth * columnCount;
  const HEIGHT = rectHeight * rowCount;

  const $svg = useRef(null);
  const $chart = useRef(null);
  const $rect = useRef(null);

  const [bound, setBound] = useState<any>({ width: 0, height: 0 });
  const [scale, setScale] = useState<number>(1);
  const dispatch = useDispatch();

  const propertyIndex = useSelector((state: StateType) => state.basic.propertyIndex);

  // const [chosePro, setPro] = useState<Pro>({
  //   x:0,
  //   y:0,
  //   width:0,
  //   height: 0
  // })

  const xScale = d3.scaleLinear().domain([0, WIDTH]).range([0, bound.width]);

  const yScale = d3.scaleLinear().domain([0, HEIGHT]).range([0, bound.height]);

  // const dataScale = d3.scaleLinear().domain(d3.extent(data) as any).range([-0.5,0.5]);

  const rectHeightMap = yScale(rectHeight);
  const rectWidthMap = xScale(rectWidth);

  const chosePro = useMemo(
    () => ({
      x: rectWidthMap * (propertyIndex % columnCount),
      y: rectHeightMap * parseInt(`${propertyIndex / rowCount}`, 10),
      width: rectWidthMap,
      height: rectHeightMap,
    }),
    [columnCount, propertyIndex, rectHeightMap, rectWidthMap]
  );

  const updatePropertyIndex = useCallback((i) => dispatch(setPropertyAction(i)), [dispatch]);
  const updatePos = useCallback((x: number, y: number) => dispatch(setPosAction(x, y)), [dispatch]);

  useEffect(() => {
    const { offsetWidth, offsetHeight } = ($svg as any).current;
    const size = Math.min(offsetHeight - 10, offsetWidth);
    setBound({
      width: size,
      height: size,
    });
  }, [$svg]);

  useEffect(() => {
    if (!$chart.current) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, bound.width, bound.height);

    data.forEach((d, j) => {
      const x = j % columnCount;
      const y = parseInt(`${j / columnCount}`, 10);

      // ctx.fillStyle=color(dataScale(d));
      ctx.fillStyle = color(d);
      ctx.fillRect(rectWidthMap * x, rectHeightMap * y, rectWidthMap, rectHeightMap);
    });
    console.log('draw');
  }, [
    HEIGHT,
    WIDTH,
    bound.height,
    bound.width,
    columnCount,
    data,
    propertyIndex,
    xScale,
    yScale,
    scale,
    rectWidthMap,
    rectHeightMap,
  ]);

  useEffect(() => {
    d3.select($rect.current).on('click', (event) => {
      const { offsetX, offsetY } = event;
      const indexY = parseInt(`${offsetY / rectHeightMap}`, 10);
      const indexX = parseInt(`${offsetX / rectWidthMap}`, 10);
      const index = indexY * rowCount + indexX;
      updatePropertyIndex(index);
      updatePos(indexX, indexY);
    });
  }, [columnCount, rectHeightMap, rectWidthMap, updatePos, updatePropertyIndex, yScale]);

  return (
    // <div className="pair-rect-container">
    <div className="wrapper">
      {/* <div className="names">
          {names.map((name) => (
            <p key={name}>{name}:</p>
          ))}
        </div> */}
      <p>ccPC{title + 1}</p>
      <div className="svg-wrapper" ref={$svg}>
        <svg width="100%" height="90%" />
        <canvas
          className="pair-canvas"
          ref={$chart}
          width={`${bound.width}px`}
          height={`${bound.height}px`}
          style={{
            // width: 130,
            // height: 130,
            border: '1px dashed #777',
          }}
        />

        <svg width={`${bound.width}px`} height={`${bound.height}px`} className="overlay">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            ref={$rect}
            cursor="pointer"
            fill="transparent"
          />
          <rect {...chosePro} stroke="#000" fill="#fff" fillOpacity="0" />
        </svg>
      </div>
    </div>
    // </div>
  );
};

export default PairRect;
