import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDispatch, useSelector } from 'react-redux';
import Triangle from '../markers/Triangle';
import { setRoundAction, setUpdateAction } from '../../store/reducers/basic';
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

const GAP = 0.1;

const brushHandle = (g: any, selection: any) =>
  g
    .selectAll('.handle--custom')
    .data([(selection[0] + selection[1]) / 2])
    .join((enter: any) =>
      enter
        .append('path')
        .attr('class', 'handle--custom')
        .attr('fill', 'var(--primary-color)')
        // .attr("stroke", "#000")
        // .attr("stroke-width", 1.5)
        // .attr("cursor", "ew-resize")
        .attr('d', 'M0 8 L-15 -8 L15 -8Z')
    )
    .attr('display', selection === null ? 'none' : null)
    .attr('transform', selection === null ? null : (d: any, i: number) => `translate(${d},0)`);

const AnnoLineChart = ({ margin, data, list }: LineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  // const [round, setRound] = useState<number>(1);
  const round = useSelector((state: StateType) => state.basic.round);
  const dispatch = useDispatch();
  const setRound = useCallback((i) => dispatch(setRoundAction(i)), [dispatch]);

  const $lines = useRef(null);

  const xScale = d3.scaleLinear().range([0, widthMap]).domain([0, data.length]).nice();

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

  const $brush: any = useRef(null);

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

  const onBrush = useCallback(function handle(this: any, { selection }) {
    d3.select(this).call(brushHandle, selection);
  }, []);

  // reference: https://bl.ocks.org/EfratVil/5edc17dd98ece6aabc9744384e46f45b
  const brush = useMemo(
    () =>
      d3
        .brushX()
        .extent([
          [0, 0],
          [widthMap, heightMap - 2],
        ])
        .on('brush', onBrush)
        .on('end', ({ selection }) => {
          const d = selection.map(xScale.invert);
          const value = (d[0] + d[1]) / 2;
          const fixedValue = Math.ceil(value);

          if (round !== fixedValue) {
            setRound(fixedValue);
          }
        }),
    [heightMap, onBrush, round, setRound, widthMap, xScale.invert]
  );

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    const brushSelection = d3.select($brush.current);

    console.log('brushSelection');

    const s = [xScale(round - GAP), xScale(round + GAP)];

    brushSelection.call(brush).transition().call(brush.move, s);

    brushSelection.selectAll('.handle').remove();
    brushSelection.select('.overlay').remove();
    brushSelection.call(brushHandle, s);
  }, [$brush, brush, data.length, round, xScale]);

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

        <g ref={$brush} className="brush" />
      </g>
    </svg>
  );
};

export default AnnoLineChart;
