import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import Triangle from '../markers/Triangle';
import { setRoundAction } from '../../store/reducers/basic';
import { StateType } from '../../types/data';
import chat from '../../assets/chat.svg';

export interface LineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[];
  list: { [key: string]: any };
}

const WIDTH = 1920;
const HEIGHT = 200;

const xTicks = 20;
const yTicks = 5;

const DRAG_PADDING = 20;

const AnnoLineChart = ({ margin, data, list }: LineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const round = useSelector((state: StateType) => state.basic.round);
  const dispatch = useDispatch();
  const setRound = useCallback((i) => dispatch(setRoundAction(i)), [dispatch]);

  const $lines = useRef(null);

  const xScale = d3.scaleLinear().range([0, widthMap]).domain([0, data.length]).nice();
  const [pos, setPos] = useState<number>(0);

  // const yScale = d3
  //   .scaleSymlog()
  //   .range([heightMap / 2 - PADDING, 0])
  //   .domain([0, d3.max(data.flat()) as number])
  //   .nice();
  const yScale = d3
    .scaleLinear()
    .range([heightMap, 0])
    .domain(d3.extent(data) as any)
    .nice();

  const $drag: any = useRef(null);

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x((d, i) => xScale(i))
    .y((d: any) => yScale(d));

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(xTicks);
    const yAxis = d3.axisLeft(yScale).ticks(yTicks);

    d3.select($xaxis.current).transition().call(xAxis.scale(xScale));

    d3.select($yaxis.current).transition().call(yAxis.scale(yScale));

    const d3lines = d3.select($lines.current);

    d3lines.select('g.yline').call(
      d3
        .axisLeft(yScale)
        .ticks(yTicks)
        .tickSize(-widthMap)
        .tickFormat('' as any) as any
    );
    d3lines.select('g.xline').call(
      d3
        .axisBottom(xScale)
        .ticks(xTicks)
        .tickSize(heightMap)
        .tickFormat('' as any) as any
    );
  }, [data, widthMap, xScale, yScale, $lines, heightMap]);

  const drag = useMemo(
    () =>
      d3
        .drag()
        .on('drag', ({ x }) => {
          setPos(x);
        })
        .on('end', ({ x }) => {
          const d = xScale.invert(x);
          const fixedValue = Math.round(d);
          if (round !== fixedValue) {
            setRound(fixedValue);
          }

          const posX = xScale(fixedValue);
          if (posX !== pos) {
            setPos(posX);
          }
        }),
    [pos, round, setRound, xScale]
  );

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    const dragSelection = d3.select($drag.current);
    dragSelection.call(drag);
  }, [data.length, drag, round, xScale]);

  const chatPos = useMemo(() => {
    const arr: any = [];

    if (list) {
      Object.keys(list).forEach((r) => {
        const x = xScale(+r);
        const indexScale = d3
          .scaleLinear()
          .range([10, heightMap - 10])
          .domain([0, list[r].length]);

        list[r].forEach((anno: any, j: number) => {
          arr.push({
            text: anno.text,
            x,
            y: indexScale(j),
          });
        });
      });
    }

    return arr;
  }, [heightMap, list, xScale]);

  return (
    <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <defs>
        <Triangle />
      </defs>
      <g transform={`translate(${margin.l}, ${margin.t})`}>
        <g transform={`translate(0, ${heightMap})`} className="axes x-axis" ref={$xaxis} />
        <g className="axes y-axis" ref={$yaxis} />

        <g ref={$lines} className="lines">
          <g className="yline" />
          <g className="xline" />
        </g>

        <line
          x1={0}
          x2={widthMap + 5}
          y1={heightMap}
          y2={heightMap}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <line
          x1={0}
          x2={0}
          y1={heightMap}
          y2={-10}
          stroke="rgba(0,0,0,0.8)"
          markerEnd="url(#arrow)"
        />
        <g transform={`translate(${WIDTH - 40},${HEIGHT - 50})`}>
          <text textAnchor="end">Communication round</text>
        </g>
        <path d={line(data as any) || ''} stroke="#777" fill="none" />
        <g>
          {chatPos.map((chatItem: any, i: number) => (
            <image
              xlinkHref={chat}
              key={i}
              id={`${i}`}
              x={chatItem.x}
              y={chatItem.y}
              height="20"
              width="20"
            />
          ))}
        </g>

        <g
          ref={$drag}
          transform={`translate(${pos}, ${DRAG_PADDING})`}
          cursor="move"
          fill="var(--primary-color)"
        >
          <text textAnchor="middle" y={-DRAG_PADDING + 8} fill="#000">
            {Math.round(xScale.invert(pos))}
          </text>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={heightMap - DRAG_PADDING}
            strokeWidth="3"
            stroke="var(--primary-color)"
          />
          <path d="M0 8 L-15 -8 L15 -8Z" />
        </g>
      </g>
    </svg>
  );
};

export default AnnoLineChart;
