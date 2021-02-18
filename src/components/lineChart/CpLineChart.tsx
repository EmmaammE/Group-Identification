/* eslint-disable no-param-reassign */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface CpLineChartProps {
  margin: {
    r: number;
    b: number;
    l: number;
    t: number;
  };
  data: number[][];
  title: string;
}

const WIDTH = 350;
const HEIGHT = 180;

type Hash = { [key: number]: number };

const step = 20;
// 记录数组中各个值的个数，返回一个object
const count = (d: number[]) => {
  const hash: Hash = {};
  d.forEach((value) => {
    if (hash[value]) {
      hash[value]++;
    } else {
      hash[value] = 1;
    }
  });
  return hash;
};

const getMax = (...arr: number[][]) => {
  let maxValue = Number.MIN_VALUE;
  arr.forEach((inner) => {
    inner.forEach((value) => {
      if (value > maxValue) {
        maxValue = value;
      }
    });
  });

  return maxValue;
};
// 红色 蓝色
const lineColor = ['#c04548', '#5783b4'];

const CpLineChart = ({ margin, data: rawData, title }: CpLineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const [data, setData] = useState<Hash[]>([{ 0: 0 }, { 0: 0 }]);
  const [maxValue, setMax] = useState<number>(0);

  const [binsCount, setBinsCount] = useState<any>([[], []]);

  useEffect(() => {
    const hashArr = rawData.map((d) => count(d));
    setData(hashArr);
  }, [rawData]);

  const dataKeys = useMemo(
    () =>
      data.map((d) =>
        Object.keys(d)
          .map((v) => +v)
          .sort((a, b) => a - b)
      ),
    [data]
  );

  const xScale = useMemo(
    () =>
      // console.log(data)
      d3
        .scaleLinear()
        .domain([
          Math.min(+dataKeys[0][0], +dataKeys[1][0]),
          Math.max(+dataKeys[0][dataKeys[0].length - 1], +dataKeys[1][dataKeys[1].length - 1]),
        ])
        .range([0, widthMap])
        .nice(),
    [dataKeys, widthMap]
  );

  useEffect(() => {
    const bins = d3
      .bin()
      // .thresholds(step)
      .thresholds(xScale.ticks(step))(Array.from(new Set([...dataKeys[0], ...dataKeys[1]])));

    const countBins: any[] = [{}, {}];

    bins.forEach((bin: any) => {
      const value = (bin.x0 + bin.x1) / 2;
      bin.forEach((v: any) => {
        // console.log('bin', v, bin.x0, bin.x1)
        countBins.forEach((countBin, i) => {
          if (data[i][v]) {
            if (!countBin[value]) {
              countBin[value] = 0;
            }
            countBin[value] += data[i][v];
          }
        });
      });
    });

    // 转换为百分比
    const size = rawData[0].length + rawData[1].length;
    countBins.forEach((hash) => {
      Object.keys(hash).forEach((key) => {
        hash[+key] /= size;
      });
    });

    setBinsCount(countBins);
    // console.log(bins)
    // console.log(title, countBins)
  }, [data, dataKeys, rawData, xScale]);

  useEffect(() => {
    setMax(getMax(Object.values(binsCount[0]), Object.values(binsCount[1])));
  }, [binsCount]);

  const yScale = d3.scaleLinear().range([heightMap, 0]).domain([0, maxValue]).nice();

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = useCallback(
    (datum) =>
      d3
        .line()
        .x((d: any) => xScale(d) as number)
        .y((d: any) => yScale(datum[d]))
        // .curve(d3.curveStep)
        .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  useEffect(() => {
    const xAxis = d3.axisBottom(xScale).ticks(5);
    // .tickValues(xScale.domain().filter((d, i) => i % 2));
    const yAxis = d3.axisLeft(yScale).ticks(5);

    d3.select($xaxis.current).call(
      xAxis.scale(xScale).tickFormat((x) => {
        if (+title < 8) {
          return Number(x).toFixed(4);
        }
        return Number(x).toFixed(2);
      })
    );
    d3.select($yaxis.current).call(yAxis.scale(yScale).tickFormat(d3.format('.0%')));
  }, [xScale, yScale, title]);

  return (
    <div className="line-wrapper">
      <p style={{ textAlign: 'center' }}>Attribute {title}</p>
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <g transform={`translate(${margin.l}, ${margin.t})`}>
          <g transform={`translate(0, ${heightMap})`} className="axes x-axis" ref={$xaxis} />
          <g className="axes y-axis" ref={$yaxis} />

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
          <text dy={-25} textAnchor="middle">
            Percentage
          </text>
          <text transform={`translate(${widthMap + 20},${heightMap + 5})`}>Value</text>

          {binsCount.map((datum: any, i: number) => (
            <path
              key={i}
              d={line(datum)(Object.keys(datum) as any) || ''}
              stroke={lineColor[i]}
              fill="none"
              // opacity="0.7"
            />
          ))}
          {binsCount.map((datum: any, i: number) => (
            <g>
              {Object.keys(datum).map((key, j) => (
                //  console.log(xScale(+key))
                <circle
                  key={`c-${i}-${j}`}
                  cx={xScale(+key)}
                  cy={yScale(datum[key as any])}
                  r={1}
                  stroke={lineColor[i]}
                  fill="#fff"
                  // opacity="0.7"
                />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default CpLineChart;
