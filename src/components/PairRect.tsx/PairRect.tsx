import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PairRect.scss';
import { useSelector } from 'react-redux';
import Heatmap from '../heatmap/Heatmap';

export interface PairRectProps {
  data: number[][];
  names: string[];
  size: number;
  index: number;
  handleClick: any;
  heteroIndex: number[];
  rate: number;
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

// const color = d3.scaleLinear<string>().domain([-1, 0, 1]).range(['#e60d17', '#eee', '#0b69b6']);
const color = d3.scaleLinear<string>().domain([-0.3, 0, 0.3]).range(['#9ccb3c', '#fff', '#f7b326']);
// const color = d3.scaleLinear<string>().domain([-0.01, 0, 0.01]).range(['#a7ff83', '#fff', '#ffaa64']);

const rectWidth = 10;
const rectHeight = 50;
const rectPadding = 2;
const rectWidthPad = 0;
const PairRect = ({ data, names, size, index, handleClick, heteroIndex, rate }: PairRectProps) => {
  const WIDTH = rectWidth * data[0].length + rectWidthPad * (data[0].length - 1);
  const HEIGHT = rectHeight * data.length + rectPadding * (data.length - 1);
  // const xScale = d3.scaleLinear().domain([0, data[0].length-1]).range([0, WIDTH]);
  const samples = useSelector((state: any) => state.identify.samples);

  const $svg = useRef(null);
  const $chart = useRef(null);

  const [bound, setBound] = useState<any>({ width: 0, height: 0 });
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const { offsetWidth, offsetHeight } = ($svg as any).current;
    setBound({
      width: offsetWidth,
      height: offsetHeight,
    });
  }, [$svg]);

  const indexScale = d3.scaleLinear().domain([0, data[0].length]).range([0, WIDTH]);

  useEffect(() => {
    if (!$chart.current) {
      return;
    }
    // 绘制矩形
    const ctx = ($chart.current as any).getContext('2d');

    let pixelRatio = getPixelRatio(ctx);
    let scaleRatio = 1;

    if (data[0].length > bound.width) {
      // 如果每个矩形的宽度会小于1，放大canvas
      scaleRatio = 1 / (bound.width / data[0].length);
    }

    pixelRatio *= scaleRatio;
    setScale(pixelRatio);

    // console.log(d3.extent(data[0]), d3.extent(data[1]))

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const xScale = d3
      .scaleLinear()
      .domain([0, WIDTH])
      .range([0, bound.width * scaleRatio]);

    const yScale = d3.scaleLinear().domain([0, HEIGHT]).range([0, bound.height]);

    ctx.clearRect(0, 0, bound.width, bound.height);

    const rectHeightMap = yScale(rectHeight);
    const rectPaddingMap = yScale(rectPadding);

    // const rectWidthMap = xScale(rectWidth) < 1?1:xScale(rectWidth);
    const rectWidthMap = xScale(rectWidth);

    data.forEach((datum, i) => {
      datum.forEach((d, j) => {
        // console.log(color(d))
        // ctx.fillStyle='#F00';
        // if(j % 10 === 0) {
        //   ctx.fillStyle=color(d);
        //   ctx.fillRect(rectWidthMap*j, i * (rectHeightMap + rectPaddingMap), rectWidthMap, rectHeightMap);
        //   // ctx.rect(j, 0, 5, 50);
        // }
        // ctx.save();

        // if(j%2===0) {
        ctx.beginPath();
        ctx.moveTo(rectWidthMap * j, i * (rectHeightMap + rectPaddingMap));

        ctx.lineTo(rectWidthMap * j, i * (rectHeightMap + rectPaddingMap) + rectHeightMap);
        ctx.strokeStyle = color(d);
        ctx.lineWidth = rectWidthMap;
        ctx.stroke();
        // }
      });
    });
    // console.log('draw')
  }, [HEIGHT, WIDTH, bound.height, bound.width, data, indexScale]);

  return (
    <div
      className="pair-rect-container"
      onClick={handleClick}
      onKeyDown={handleClick}
      role="menuitem"
      tabIndex={0}
    >
      <div className="title">
        <span>Inconsistent block {index + 1}</span>
        <div>
          <span>Size: {size}</span>
          <span>Purity: {d3.format('.0%')(rate)}</span>
        </div>
      </div>
      <div className="wrapper">
        <Heatmap cpArray={data} data={samples} heteroIndex={heteroIndex} />
        <div className="names">
          {names.map((name) => (
            <p key={name}>{name}</p>
          ))}
        </div>
        <div className="svg-wrapper" ref={$svg}>
          <canvas
            className="pair-canvas"
            // width="100%"
            // height="100%"
            width={`${bound.width * scale}px`}
            height={`${bound.height * scale}px`}
            ref={$chart}
            style={{
              width: `${bound.width}px`,
              height: `${bound.height}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PairRect;
