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
  index: number;
  hetData: number[];
}

const WIDTH = 380;
const HEIGHT = 160;

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
// 灰色（一致））棕色（不一致）
const lineColor = ['#b5b6b6', '#aa815d'];

const CpLineChart = ({ margin, data: rawData, title, index, hetData }: CpLineChartProps) => {
  const widthMap: number = WIDTH - margin.l - margin.r;
  const heightMap: number = HEIGHT - margin.t - margin.b;

  const [data, setData] = useState<Hash[] | null>(null);
  const [maxValue, setMax] = useState<number>(0);

  const [binsCount, setBinsCount] = useState<any>([null, null]);
  const [hetBinCount, setHetBinCount] = useState<any>({});

  useEffect(() => {
    if (rawData) {
      const hashArr = rawData.map((d) => count(d));
      setData(hashArr);
    }
  }, [rawData]);

  const dataKeys = useMemo(
    () =>
      data
        ? data.map((d) =>
            Object.keys(d)
              .map((v) => +v)
              .sort((a, b) => a - b)
          )
        : [[0], [0]],
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
    if (data === null) {
      return;
    }
    const bins = d3
      .bin()
      // .thresholds(step)
      .thresholds(xScale.ticks(step))(Array.from(new Set([...dataKeys[0], ...dataKeys[1]])));

    const countBins: any[] = [{}, {}];
    const hetBin: any = {};

    const hetHash = count(hetData);

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

        if (hetHash[v]) {
          // 如果Bin中含有的值，是不一致的点具有的值
          if (!hetBin[value]) {
            // 如果还未记录次数
            hetBin[value] = 0;
          }
          // 记在value上
          hetBin[value] += hetHash[v];
        }
      });
    });

    console.log(hetBin, hetHash);

    // 转换为百分比
    const size = hetData.length;
    countBins.forEach((hash) => {
      Object.keys(hash).forEach((key) => {
        hash[+key] /= size;
      });
    });

    Object.keys(hetBin).forEach((key) => {
      hetBin[key] /= size;
    });

    console.log(hetBin);
    setBinsCount(countBins);
    setHetBinCount(hetBin);
    // console.log(bins)
    // console.log(title, countBins)

    // console.log(hetBin)
  }, [data, dataKeys, hetData, rawData, xScale]);

  useEffect(() => {
    if (binsCount[0]) {
      setMax(
        getMax(Object.values(binsCount[0]), Object.values(binsCount[1]), Object.values(hetBinCount))
      );
    }
  }, [binsCount, hetBinCount]);

  const yScales = [
    d3.scaleLinear().range([heightMap, 0]).domain([0, maxValue]).nice(),
    d3.scaleLog().range([heightMap, 0]).domain([1e-5, maxValue]).nice(),
    d3
      .scaleSymlog()
      .domain([0, maxValue])
      .constant(10 ** 0)
      .range([heightMap, 0]),
  ];

  const yScale = yScales[index];

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const line = useCallback(
    (datum) =>
      d3
        .line()
        .x((d: any) => xScale(d) as number)
        .y((d: any) => yScale(datum[d]))
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
    d3.select($yaxis.current).call(yAxis.scale(yScale).tickFormat(d3.format('.2%')));
  }, [xScale, yScale, title]);

  return (
    <div className="line-wrapper">
      {/* <p style={{ textAlign: 'center' }}>Attribute {title}</p> */}
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
          {binsCount.map(
            (datum: any, i: number) =>
              datum && (
                <path
                  key={i}
                  d={line(datum)(Object.keys(datum) as any) || ''}
                  stroke={lineColor[i]}
                  fill="none"
                  // opacity="0.7"
                />
              )
          )}
          {binsCount.map((datum: any, i: number) => (
            <g key={`c-${i}`}>
              {datum !== null &&
                Object.keys(datum).map((key, j) => (
                  <circle
                    key={`c-${i}-${j}`}
                    cx={xScale(+key)}
                    cy={yScale(datum[key as any])}
                    r={2}
                    stroke={lineColor[i]}
                    fill="#fff"
                    // opacity="0.7"
                  />
                ))}
            </g>
          ))}

          <g>
            <path
              d={line(hetBinCount)(Object.keys(hetBinCount) as any) || ''}
              stroke="#c04548"
              fill="none"
            />
            {Object.keys(hetBinCount).map((key, j) => (
              <circle
                key={`h-${j}`}
                cx={xScale(+key)}
                cy={yScale(hetBinCount[key])}
                r={2}
                stroke="#c04548"
                fill="#fff"
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CpLineChart;
