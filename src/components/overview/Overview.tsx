import React, { useMemo } from 'react';
import './Overview.scss';

export interface OverviewProps {
  data: {
    fed: number[][];
    local: number[][];
    batchSize: number[];
  };
}

const SIZE = 400;

const dot = (v1: [number, number], v2: [number, number]) =>
  v1[0] * v2[0] + v1[1] * v2[1];

const color = ['#e60d17', '#0b69b6'];

const path = (
  fedPoints: number[][],
  localPoints: number[][],
  dimension: number
) => {
  // let str = '';

  // points.forEach((point, i) => {
  //   if(i === 0) {
  //     str += `M ${point[0]} ${point[1]}`
  //   } else {
  //     str += `l ${point[0]} ${point[1]}`
  //   }
  // })

  // return str;

  // 计算每一段的路径的绝对起点和终点
  // const prev = [points[0][0] * dimension, points[0][1] * dimension];
  const prev = [0, 0];
  const paths = [];
  const pathsLocal = [];
  for (let i = 0; i < fedPoints.length; i++) {
    const point = fedPoints[i];
    const localPoint = localPoints[i];

    const cosine = dot(
      point as [number, number],
      localPoint as [number, number]
    );

    pathsLocal.push({
      x1: prev[0],
      y1: SIZE - prev[1],
      x2: prev[0] + localPoint[0] * dimension,
      y2: SIZE - (prev[1] + localPoint[1] * dimension),
      stroke: cosine < 0 ? color[0] : color[1],
      cosine,
    });

    paths.push({
      x1: prev[0],
      y1: SIZE - prev[1],
      x2: (prev[0] += point[0] * dimension),
      y2: SIZE - (prev[1] += point[1] * dimension),
    });
  }

  return {
    fed: paths,
    local: pathsLocal,
  };
};

// 返回x轴和y轴sum值的最大值
const sumExtent = (arr: number[][]) => {
  let x = 0;
  let y = 0;

  arr.forEach((point) => {
    x += point[0];
    y += point[1];
  });
  return Math.max(x, y);
};

function Overview({ data }: OverviewProps) {
  // todo: 使用线性映射
  const dimension = useMemo(
    () => 400 / Math.ceil(Math.max(sumExtent(data.fed), sumExtent(data.local))),
    [data.fed, data.local]
  );

  const paths = useMemo(() => path(data.fed, data.local, dimension), [
    data.fed,
    data.local,
    dimension,
  ]);

  return (
    <div className="Overview">
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        <defs>
          <marker
            id={`${color[0]}`}
            refX="6 "
            refY="6"
            viewBox="0 0 16 16"
            markerWidth="10"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 12 6 0 12 3 6 Z" fill={color[0]} />
          </marker>
          <marker
            id={`${color[1]}`}
            refX="6 "
            refY="6"
            viewBox="0 0 16 16"
            markerWidth="10"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 12 6 0 12 3 6 Z" fill={color[1]} />
          </marker>
        </defs>
        {paths.local.map((pathPoint, i) => (
          <line
            key={i}
            markerEnd={`url(#${pathPoint.stroke})`}
            strokeWidth={data.batchSize[i]}
            {...pathPoint}
          />
        ))}

        {paths.fed.map((pathPoint, i) => (
          <line
            key={i}
            stroke="#777"
            strokeWidth={data.batchSize[i]}
            {...pathPoint}
          />
        ))}
      </svg>
    </div>
  );
}

export default Overview;
