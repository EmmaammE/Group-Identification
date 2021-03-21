import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PairRect.scss';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../../types/data';
import { setPosAction, setPropertyAction } from '../../store/reducers/basic';
import useWindowSize from '../../utils/useResize';
import { getDatasetInfo } from '../../utils/getType';

export interface PairRectProps {
  data: number[];
  title: number;
  color: d3.ScaleLinear<string, number>;
  channel: number;
}

interface RectData {
  x: number;
  y: number;
  width: number;
  height: number;
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

// const color = d3.scaleLinear<string>().domain([-0.3, 0, 0.3]).range(['#0aa6e9', '#fff', '#ea4d40']);

const rectWidth = 20;
const rectHeight = 20;

interface Pro {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PairRect = ({ data, title, color, channel }: PairRectProps) => {
  const { dimension } = getDatasetInfo();

  // const columnCount = data.length / rowCount;
  const rowCount = Math.sqrt(dimension);

  const columnCount = Math.ceil(dimension / rowCount);
  const WIDTH = rectWidth * columnCount;
  const HEIGHT = rectHeight * rowCount;

  // const color = useMemo(() => {
  //   const extent:number = Math.max(
  //     Math.abs(Math.min(...data)),
  //     Math.abs(Math.max(...data))
  //   )
  //   return d3.scaleLinear<string>().domain([-extent, 0, extent]).range(['#c21317', '#fff', '#1365c2']);
  // }, [])

  const $svg = useRef(null);
  const $chart = useRef(null);
  const $rect = useRef(null);

  const [bound, setBound] = useState<any>({ width: 400, height: 400 });
  const [scale, setScale] = useState<number>(1);
  const dispatch = useDispatch();

  const propertyIndex = useSelector((state: StateType) => state.basic.propertyIndex);
  const pos = useSelector((state: StateType) => state.basic.pos);

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
      id: `${propertyIndex % columnCount},${parseInt(`${propertyIndex / rowCount}`, 10)}`,
    }),
    [columnCount, propertyIndex, rectHeightMap, rectWidthMap, rowCount]
  );

  const [hoverPro, setHoverPro] = useState<RectData | null>(null);

  const updatePropertyIndex = useCallback((i) => dispatch(setPropertyAction(i)), [dispatch]);
  const updatePos = useCallback((x: number, y: number) => dispatch(setPosAction(x, y)), [dispatch]);

  useEffect(() => {
    const { id } = chosePro;

    const posArr = id.split(',').map((d) => +d);
    if (pos[0] !== posArr[0] || pos[1] !== posArr[1]) {
      updatePos(posArr[0], posArr[1]);
    }
  }, [chosePro, columnCount, pos, rectHeightMap, rectWidthMap, updatePos]);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($svg as any).current;
    const size = Math.min(offsetHeight - 30, offsetWidth);
    setBound({
      width: size,
      height: size,
    });
  }, []);

  useWindowSize(handleResize);

  useEffect(() => {
    if (!$chart.current) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, bound.width, bound.height);

    data.slice(dimension * channel, dimension * (channel + 1)).forEach((d, j) => {
      const x = j % columnCount;
      const y = parseInt(`${j / columnCount}`, 10);

      // ctx.fillStyle=color(dataScale(d));
      ctx.fillStyle = color(d);
      ctx.fillRect(rectWidthMap * x, rectHeightMap * y, rectWidthMap, rectHeightMap);
    });
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
    color,
    dimension,
    channel,
  ]);

  useEffect(() => {
    d3.select($rect.current)
      .on('click', (event) => {
        const { offsetX, offsetY } = event;
        const indexY = parseInt(`${offsetY / rectHeightMap}`, 10);
        const indexX = parseInt(`${offsetX / rectWidthMap}`, 10);
        const index = indexY * rowCount + indexX;
        updatePropertyIndex(index);
        updatePos(indexX, indexY);
        setHoverPro(null);
      })
      .on('mousemove', (event) => {
        const { offsetX, offsetY } = event;
        const indexY = parseInt(`${offsetY / rectHeightMap}`, 10);
        const indexX = parseInt(`${offsetX / rectWidthMap}`, 10);
        setHoverPro({
          x: indexX * rectWidthMap,
          y: indexY * rectHeightMap,
          width: rectWidthMap,
          height: rectHeightMap,
        });
      })
      .on('mouseout', () => {
        setHoverPro(null);
      });
  }, [columnCount, rectHeightMap, rectWidthMap, rowCount, updatePos, updatePropertyIndex, yScale]);

  return (
    <div className="wrapper">
      <div>
        <p className="rotate">cPC{title + 1}</p>
      </div>
      <div className="chart-wrapper" ref={$svg}>
        <canvas
          className="pair-canvas"
          ref={$chart}
          width={`${bound.width}px`}
          height={`${bound.height}px`}
          style={{
            border: '1px dashed #777',
            // width: '200px',
            // height: '200px'
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

          {hoverPro && (
            <rect {...hoverPro} stroke="#777" fill="#fff" fillOpacity="0" pointerEvents="none" />
          )}
        </svg>
      </div>
    </div>
  );
};

export default PairRect;
