/* eslint-disable jsx-a11y/label-has-associated-control */
import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import inputStyles from '../../styles/input.module.css';
import useWindowSize from '../../utils/useResize';
import Gradient from '../ui/Gradient';
import ICON from '../../assets/convex.svg';

interface GridMatrixProps {
  // 一个二维数组，表示点的投影坐标
  data: number[][];
  xLabels: number[];
  yLabels: number[];
  // 高亮的点的下标
  highlight: Set<number>;
  // 不一致点的下标
  heteroIndex: Set<number>;
  heteroLabels: boolean[];
  strokeSet: Set<number>;
  strokeStatus: number;
  chosePoint: number;
  setChosePoint: Function;
  setStrokePoints: Function;
}

const isInCircle = (point: number[], x: number, y: number) =>
  (point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y) <= 4;

// const margin = { t: 50, r: 0, b: 0, l: 60 };
const margin = { t: 0, r: 0, b: 0, l: 0 };
// 格子之间的缝隙
const padding = 10;

const colorScale = d3
  .scaleLinear<string>()
  // .domain([0, 0.5, 1])
  .domain([0, 1])
  .range(['#fff', '#39915f']);
// 红白蓝
// .range(['#e60d17', '#fff', '#0b69b6']);

const GridMatrix = ({
  data,
  xLabels,
  yLabels,
  highlight,
  heteroIndex,
  heteroLabels,
  strokeSet,
  strokeStatus,
  chosePoint,
  setChosePoint,
  setStrokePoints,
}: GridMatrixProps) => {
  const $chart = useRef(null);
  const $wrapper = useRef(null);

  const [svgWidth, setWidth] = useState(350);
  const [svgHeight, setHeight] = useState(350);

  const xLabelsArr = useMemo(() => Array.from(new Set(xLabels)).sort(), [xLabels]);
  const yLabelsArr = useMemo(() => Array.from(new Set(yLabels)).sort(), [yLabels]);

  // 格子的大小
  const [gridSize, setGridSize] = useState<number>(0.1);
  // true是checked
  const [display, toggelDisplat] = useState<boolean>(true);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($wrapper as any).current;
    const size = Math.min(offsetWidth, offsetHeight);
    if (xLabelsArr.length === 0) {
      setWidth(size);
      setHeight(size);
    } else {
      const w = (size - padding * (xLabelsArr.length - 1)) / xLabelsArr.length;
      const h = w * yLabelsArr.length + padding * (yLabelsArr.length - 1);

      setWidth(size);
      setHeight(h);
    }
  }, [xLabelsArr.length, yLabelsArr.length]);

  useWindowSize(handleResize);

  const indexXScale = d3
    .scaleLinear()
    .range([0, svgWidth - margin.l - margin.r - padding * (xLabelsArr.length - 1)])
    .domain([0, 2 * xLabelsArr.length]);

  // console.log(indexXScale.domain(), indexXScale(1))
  const indexYScale = d3
    .scaleLinear()
    .range([0, svgHeight - margin.t - margin.b - padding * (yLabelsArr.length - 1)])
    .domain([0, 2 * yLabelsArr.length]);

  const width = useMemo(() => indexXScale(2) - indexXScale(0), [indexXScale]);
  const height = useMemo(() => indexYScale(2) - indexYScale(0), [indexYScale]);

  // console.log('size', width, height)
  // 格子的size映射为坐标上相差多少
  const normScale = d3.scaleLinear().range([0, width]).domain([0, 1]);

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([0, width])
        .domain(d3.extent(data, (d) => d[0]) as [number, number])
        .nice(),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([0, height])
        .domain(d3.extent(data, (d) => d[1]) as [number, number])
        .nice(),
    [data, height]
  );

  const points: number[][] = useMemo(
    () =>
      data.map((point, k) => {
        const pointX = xLabels[k];
        const pointY = yLabels[k];
        return [xScale(point[0]), yScale(point[1]), pointX, pointY, k];
      }),
    [data, xLabels, yLabels, xScale, yScale]
  );

  const quadtree = d3
    .quadtree<any>()
    .extent([
      [-1, -1],
      [svgWidth + 1, svgHeight + 1],
    ])
    .x((d) => d[0])
    .y((d) => d[1])
    .addAll(points);

  const search = useCallback(
    (x0, y0, x3, y3) => {
      const validData: any = [];
      quadtree.visit((node, x1, y1, x2, y2) => {
        const pData = (node as any).data;

        if (pData) {
          const p = pData;
          p.selected = p[0] >= x0 && p[0] < x3 && p[1] >= y0 && p[1] < y3;
          if (p.selected) {
            validData.push(pData);
          }
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
      });
      return validData;
    },
    [quadtree]
  );

  const clusterPoints = useMemo(() => {
    const grids = d3.range(0, 1.00001, gridSize).map((d) => normScale(d));
    const arr: any = [];

    xLabelsArr.forEach((xlabel) => {
      const arrByColumn = [];
      for (let i = 0; i < grids.length - 1; i++) {
        const x0 = grids[i];
        const x1 = grids[i + 1];

        const row: any = [];

        for (let j = 0; j < grids.length - 1; j++) {
          const y0 = grids[j];
          const y1 = grids[j + 1];
          const searched = search(x0, y0, x1, y1);
          // const positive = searched.filter((d:any)=> d[2] === d[3]);
          const positive = searched.filter((d: any) => xlabel === d[3]);

          // console.log(positive)
          row.push({
            x0,
            x1,
            y0,
            y1,
            ratio: searched.length ? positive.length / searched.length : 0,
          });
        }

        arrByColumn.push(row);
      }

      arr.push(arrByColumn);
    });

    // console.log(arr);
    return arr;
  }, [gridSize, normScale, search, xLabelsArr]);

  const hull = useMemo(() => {
    const pointsArr: any[] = points
      .filter((d, k) => heteroIndex.has(k))
      .map((point) => [point[0], point[1]]);

    return d3.polygonHull(pointsArr);
  }, [heteroIndex, points]);

  const gridPoints = useMemo(
    () =>
      xLabelsArr.map((xLabel, i) =>
        yLabelsArr.map((yLabel, j) => {
          const left = margin.l + indexXScale(i * 2) + padding * i;
          const top = margin.t + indexYScale(j * 2) + padding * j;

          const pointsArr0: number[][] = [];
          const pointsArr1: number[][] = [];

          points.forEach((point, k) => {
            // 绘制点
            const posX = point[0] + left;
            const posY = point[1] + top;

            // const pointX = point[2];
            // const pointY = point[3];
            const pointX = xLabels[k];
            const pointY = yLabels[k];

            if (pointX === xLabel && pointY === yLabel) {
              let isStroke = 0;

              const isInHull = hull && d3.polygonContains(hull, point as any);

              switch (strokeStatus) {
                case 0:
                  if (isInHull) {
                    isStroke = 1;
                  }
                  break;
                case 1:
                  // 求交集
                  if (isInHull && strokeSet.has(k)) {
                    isStroke = 1;
                  }
                  break;
                case 2:
                  // 求并集
                  if (isInHull || strokeSet.has(k)) {
                    isStroke = 1;
                  }
                  break;
                default:
                  break;
              }

              // if (isStroke) {
              //   strokePoints.push(k);
              // }

              if (heteroLabels[k] === false) {
                // 不一致
                pointsArr1.push([posX, posY, 1, isStroke, k]);
              } else {
                pointsArr0.push([posX, posY, 0, isStroke, k]);
              }
            }
            // pointsArr0.push([posX, posY, heteroLabels[k] === false ? 1:0, 0, k]);
          });

          return pointsArr0.concat(pointsArr1);
        })
      ),
    [
      heteroLabels,
      hull,
      indexXScale,
      indexYScale,
      points,
      strokeSet,
      strokeStatus,
      xLabels,
      xLabelsArr,
      yLabels,
      yLabelsArr,
    ]
  );

  useEffect(() => {
    const arr: any = [];
    gridPoints.forEach((gridPointsRow) => {
      gridPointsRow.forEach((point) => {
        if (point[3]) {
          arr.push(point[4]);
        }
      });
    });

    setStrokePoints(arr);
    // console.log('setStroke')
  }, [gridPoints, setStrokePoints]);

  useEffect(() => {
    if (!$chart.current || !xScale || !yScale) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, svgWidth, svgHeight);
    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgba(120,120,120,0.3)';

    // console.log(pointsInHullArr);
    gridPoints.forEach((gridPointRow, i) => {
      // 每一行
      gridPointRow.forEach((gridPoint, j) => {
        // 每一格，point的序号已经变了，必须使用point数组中的k
        gridPoint.forEach((point) => {
          let alpha = 0.5;

          if (highlight.has(point[4])) {
            alpha = 1;
          }
          if (point[2] === 0) {
            // 0 一致
            ctx.fillStyle = `rgba(128,128,128,${alpha})`;
          } else {
            // ctx.fillStyle = `rgba(149, 98, 53,${alpha})`;
            ctx.fillStyle = `rgba(197,92,0,${alpha})`;
          }

          ctx.moveTo(point[0], point[1]);
          ctx.beginPath();

          ctx.arc(point[0], point[1], point[4] === chosePoint ? 4 : 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();

          if (point[3]) {
            ctx.stroke();
          }
        });
      });
    });
  }, [
    $chart,
    data,
    gridPoints,
    height,
    highlight,
    indexXScale,
    indexYScale,
    svgHeight,
    svgWidth,
    width,
    xLabels,
    xLabelsArr,
    xScale,
    yLabels,
    yLabelsArr,
    yScale,
    chosePoint,
  ]);

  const handleGridSizeChange = (e: any) => {
    setGridSize(e.target.value);
  };

  const handleDisplay = () => {
    toggelDisplat(!display);
  };
  // console.log(pointsInHull, hullArr)

  const clickPoint = (e: any) => {
    // console.log(e)

    const { pos } = e.target.dataset;
    const { offsetX, offsetY } = e.nativeEvent;
    // ${i}-${j}-${rectX}-${rectY}
    if (pos) {
      const [i, j, rectX, rectY] = pos.split('-');
      const gridPoint = clusterPoints[i][rectX][rectY];

      const { x0, y0, x1, y1 } = gridPoint;
      // console.log(clusterPoints);
      // console.log(gridPoint);

      const searched = search(x0, y0, x1, y1).filter(
        (point: number[]) => point[2] === xLabelsArr[i] && point[3] === yLabelsArr[j]
      );
      // console.log(searched)

      const left = margin.l + indexXScale(i * 2) + padding * i;
      const top = margin.t + indexYScale(j * 2) + padding * j;

      const results = searched.filter((point: number[]) => {
        const pointOffset = [point[0] + left, point[1] + top];
        return isInCircle(pointOffset, offsetX, offsetY);
      });
      // console.log(results)

      if (results.length) {
        setChosePoint(results[0][4]);
      }
    }
  };

  return (
    <div className="grid-container">
      <div className="row">
        <div className="input-wrapper">
          <p className="label">Grid size: </p>
          <div className={inputStyles.wrapper}>
            <input
              className={inputStyles.input}
              type="number"
              min="0.0"
              max="1.0"
              step="0.1"
              value={gridSize}
              onChange={handleGridSizeChange}
            />
          </div>
        </div>

        <div className="input-wrapper">
          <span> Ground-truth labels: </span>
          <Gradient
            colors={['#fff', '#9ccb3c']}
            legends={['0%', '100%']}
            width="50px"
            height={25}
          />
        </div>
      </div>

      <div className="row">
        <div className="tgl-wrapper">
          <span>Display scatters: </span>
          <input
            className="tgl"
            id="cb4"
            type="checkbox"
            checked={display}
            onChange={handleDisplay}
          />
          <label className="tgl-btn" htmlFor="cb4" />
        </div>

        <div className="convex-legend">
          <img src={ICON} alt="convex" />
          <span>Convex of the selected cluster</span>
        </div>
      </div>

      <div className="chart-container">
        <p className="yLabel-title">Output label (federated learning model) </p>

        <div className="xLabels">
          <div className="title">
            <span>Ground-truth label</span>
          </div>
          <div className="xLabels-arr">
            {xLabelsArr.map((text) => (
              <span key={text}> Label{text}</span>
            ))}
          </div>
        </div>

        <div className="chart-wrapper" ref={$wrapper}>
          <div className="yLabels" style={{ height: `${svgHeight}px` }}>
            {yLabelsArr.map((text, j) => (
              <span key={j}>Label{text}</span>
            ))}
          </div>
          <div className="svg-wrapper">
            <svg
              viewBox={`-1 0 ${svgWidth + 2} ${svgHeight}`}
              width={`${svgWidth + 2}px`}
              height={`${svgHeight}px`}
              cursor="pointer"
            >
              <g transform={`translate(${margin.l},${margin.t})`} onClick={clickPoint}>
                {width > 0 &&
                  xLabelsArr.map((x, i) =>
                    yLabelsArr.map((y, j) => {
                      const left = margin.l + indexXScale(i * 2) + padding * i;
                      const top = margin.t + indexYScale(j * 2) + padding * j;
                      // const hull = hullArr[i][j];

                      return clusterPoints[i].map((cluster: any, rectX: number) => (
                        <g key={`${i}-${j}-${rectX}`}>
                          <rect
                            x={left}
                            y={top}
                            width={width}
                            height={height}
                            fill="none"
                            stroke="#777"
                            strokeDasharray="2 2"
                          />
                          {cluster.map((rect: any, rectY: number) => {
                            const { x0, x1, y0, y1, ratio } = rect;
                            return (
                              <rect
                                data-pos={`${i}-${j}-${rectX}-${rectY}`}
                                key={`${x0},${y0},${i}`}
                                fill={colorScale(ratio)}
                                x={x0 + left}
                                y={y0 + top}
                                width={x1 - x0}
                                height={y1 - y0}
                              />
                            );
                          })}

                          {hull !== null && (
                            <path
                              d={`M${hull.join(' L')} Z`}
                              fill="none"
                              strokeWidth={2}
                              stroke="var(--primary-color)"
                              transform={`translate(${left}, ${top})`}
                            />
                          )}
                        </g>
                      ));
                    })
                  )}
              </g>
            </svg>

            <canvas
              ref={$chart}
              width={`${svgWidth}px`}
              height={`${svgHeight}px`}
              style={{
                opacity: display ? 1 : 0,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* end of chart-container */}
      </div>
    </div>
  );
};

export default React.memo(GridMatrix);
// export default GridMatrix;
