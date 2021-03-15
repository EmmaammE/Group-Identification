/* eslint-disable jsx-a11y/label-has-associated-control */
import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import inputStyles from '../../styles/input.module.css';
import useWindowSize from '../../utils/useResize';
import Gradient from '../ui/Gradient';
import ICON from '../../assets/convex.svg';
import { getType } from '../../utils/getType';
import { StateType } from '../../types/data';

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
  // 列表的点
  strokeSet: Set<number>;
  strokeStatus: number;
  chosePoint: number;
  setChosePoint: Function;
  setStrokePoints: Function;
}

// 点的半径
const R = 3;

const isInCircle = (point: number[], x: number, y: number) =>
  (point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y) <= R * R + 2;

// const margin = { t: 50, r: 0, b: 0, l: 60 };
const margin = { t: 0, r: 0, b: 0, l: 0 };
// 格子之间的缝隙
const padding = 10;

const colorScale = d3
  .scaleLinear<string>()
  // .domain([0, 0.5, 1])
  .domain([0, 0.5, 1])
  .range(['#ffdfb2', '#eee', '#cde8ba']);
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

  const [svgWidth, setWidth] = useState(425);
  const [svgHeight, setHeight] = useState(425);

  const xLabelsArr = useMemo(() => Array.from(new Set(xLabels)).sort(), [xLabels]);
  const yLabelsArr = useMemo(() => Array.from(new Set(yLabels)).sort(), [yLabels]);

  const heteroPointsFromStore = useSelector((state: StateType) => state.basic.heteroPoints);
  const labelNames = useSelector((state: StateType) => state.basic.labelNames);

  const annoPoints = useSelector((state: StateType) => new Set(state.basic.annoPoints));
  // 格子的大小
  const [gridSize, setGridSize] = useState<number>(0.05);
  // true是checked
  const [display, toggelDisplat] = useState<boolean>(true);

  const [t, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity.translate(0, 0).scale(1));

  const $svg = useRef(null);

  const handleResize = useCallback(() => {
    const { offsetWidth, offsetHeight } = ($wrapper as any).current;
    const size = Math.min(offsetWidth, offsetHeight);
    if (xLabelsArr.length === 0) {
      setWidth(size);
      setHeight(size);
    } else {
      const wGrid = (offsetWidth - padding * (xLabelsArr.length - 1)) / xLabelsArr.length;
      const hGrid = (offsetHeight - padding * (xLabelsArr.length - 1)) / xLabelsArr.length;
      const grid = Math.min(wGrid, hGrid);

      const w = grid * xLabelsArr.length + padding * (xLabelsArr.length - 1);
      const h = grid * yLabelsArr.length + padding * (yLabelsArr.length - 1);

      setWidth(w);
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

  const width = useMemo(() => indexXScale(2) - indexXScale(0) - 2, [indexXScale]);
  const height = useMemo(() => indexYScale(2) - indexYScale(0) - 2, [indexYScale]);

  useEffect(() => {
    const zoomer: any = d3
      .zoom()
      .scaleExtent([1, 100])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .duration(300)
      .on('zoom', ({ transform }) => {
        // setTransform(d3.zoomIdentity.translate(0, 0).scale(transform.k));
        setTransform(transform);
        // console.log('zoom')
      });

    d3.select($svg.current).call(zoomer);
    // .on('dblclick.zoom', () => {
    //   const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    //   d3.select($svg.current)
    //     .transition()
    //     .duration(200)
    //     .ease(d3.easeLinear)
    //     .call((zoomer as any).transform, transform);
    // });
  }, [$svg, height, width]);
  // console.log('size', width, height)
  // 格子的size映射为坐标上相差多少
  const normScale = t.rescaleX(d3.scaleLinear().range([0, width]).domain([0, 1]));

  const xScale = useMemo(
    () =>
      t.rescaleX(
        d3
          .scaleLinear()
          .range([0, width])
          .domain(d3.extent(data, (d) => d[0]) as [number, number])
          .nice()
      ),
    [data, t, width]
  );

  const yScale = useMemo(
    () =>
      t.rescaleY(
        d3
          .scaleLinear()
          .range([0, height])
          .domain(d3.extent(data, (d) => d[1]) as [number, number])
          .nice()
      ),
    [data, height, t]
  );

  // console.log(xScale.domain(), xScale.range())

  const points: number[][] = useMemo(
    () =>
      data.map((point, k) => {
        const pointX = xLabels[k];
        const pointY = yLabels[k];
        return [xScale(point[0]) || 0, yScale(point[1]) || 0, pointX, pointY, k];
      }),
    [data, xLabels, yLabels, xScale, yScale]
  );

  const type = getType();

  const heteroPoints: [number, number][] = useMemo(() => {
    if (type === 'local') {
      return points.filter((d, k) => heteroIndex.has(k)).map((point) => [point[0], point[1]]);
    }
    return heteroPointsFromStore.map((point) => [xScale(point[0]), yScale(point[1])]);
  }, [heteroIndex, heteroPointsFromStore, points, type, xScale, yScale]);

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
            ratio: searched.length ? positive.length / searched.length : -1,
          });
        }

        arrByColumn.push(row);
      }

      arr.push(arrByColumn);
    });

    // console.log(arr);
    return arr;
  }, [gridSize, normScale, search, xLabelsArr]);

  // console.log(heteroPoints)
  const hull = useMemo(() => d3.polygonHull(heteroPoints), [heteroPoints]);

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

              if (annoPoints.size === 0) {
                // 如果，没有高亮的标记点，计算当前选择的点和异构块中的点的关系
                let isInHull = false;
                if (type === 'local') {
                  isInHull = heteroIndex.has(k);
                } else {
                  isInHull = hull !== null && d3.polygonContains(hull, point as any);
                }

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
              } else if (annoPoints.has(k)) {
                isStroke = 1;
              }

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
      annoPoints,
      heteroIndex,
      heteroLabels,
      hull,
      indexXScale,
      indexYScale,
      points,
      strokeSet,
      strokeStatus,
      type,
      xLabels,
      xLabelsArr,
      yLabels,
      yLabelsArr,
    ]
  );

  useEffect(() => {
    if (annoPoints.size === 0) {
      // 如果stroke的是注释的点，不更新
      const arr: any = [];
      gridPoints.forEach((gridPointsRow) => {
        gridPointsRow.forEach((pointArr) => {
          pointArr.forEach((point) => {
            // console.log(point)
            if (point[3]) {
              arr.push(point[4]);
            }
          });
        });
      });

      setStrokePoints(arr);
    }
  }, [annoPoints, gridPoints, setStrokePoints]);

  useEffect(() => {
    if (!$chart.current || !xScale || !yScale) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, svgWidth, svgHeight);
    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgba(0,0,0, 0.5)';

    // console.log(pointsInHullArr);
    gridPoints.forEach((gridPointRow, i) => {
      // 每一行
      gridPointRow.forEach((gridPoint, j) => {
        const left = margin.l + indexXScale(i * 2) + padding * i;
        const top = margin.t + indexYScale(j * 2) + padding * j;
        // ctx.restore();

        // ctx.rect(left, top,  width, height);
        // ctx.fill()
        // ctx.clip();

        // 每一格，point的序号已经变了，必须使用point数组中的k
        gridPoint.forEach((point) => {
          let alpha = 0.7;

          if (highlight.has(point[4])) {
            alpha = 1;
          }
          if (point[2] === 0) {
            // 0 一致
            ctx.fillStyle = `rgba(200,200,200,${alpha - 0.1})`;
          } else {
            ctx.fillStyle = `rgba(149, 98, 53,${alpha})`;
            // ctx.fillStyle = `rgba(197,92,0,${alpha})`;
          }

          if (
            point[0] >= left + R &&
            point[0] <= left + width - R &&
            point[1] >= top + R &&
            point[1] <= top + width - R
          ) {
            ctx.moveTo(point[0], point[1]);
            ctx.beginPath();

            ctx.arc(point[0], point[1], point[4] === chosePoint ? R + 2 : R, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (point[3]) {
              ctx.stroke();
            }
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
    const { pos } = e.target.dataset;
    const { offsetX, offsetY } = e.nativeEvent;
    // ${i}-${j}-${rectX}-${rectY}
    if (pos) {
      const [i, j, rectX, rectY] = pos.split('-');
      const gridPoint = clusterPoints[i][rectX][rectY];

      const { x0, y0, x1, y1 } = gridPoint;
      // console.log(clusterPoints);
      // console.log(gridPoint);

      const offset = R * 2;
      const searched = search(x0 - offset, y0 - offset, x1 + offset, y1 + offset).filter(
        (point: number[]) => point[2] === xLabelsArr[i] && point[3] === yLabelsArr[j]
      );
      // console.log(searched)

      const left = margin.l + indexXScale(i * 2) + padding * i;
      const top = margin.t + indexYScale(j * 2) + padding * j;

      const results = searched
        .filter((point: number[]) =>
          isInCircle([point[0], point[1]], offsetX - left, offsetY - top)
        )
        .sort(
          (a: number[], b: number[]) => Number(heteroLabels[a[4]]) - Number(heteroLabels[b[4]])
        );
      // console.log(results)
      if (results.length) {
        setChosePoint(results[0][4]);
      }
    }
  };

  return (
    <div className="grid-container">
      <div className="row">
        <div className="col">
          <div className="input-wrapper">
            <p className="label">Grid size: </p>
            <div className={inputStyles.wrapper}>
              <input
                className={inputStyles.input}
                type="number"
                min="0.0"
                max="1.0"
                step="0.01"
                value={gridSize}
                onChange={handleGridSizeChange}
              />
            </div>
          </div>

          <div className="input-wrapper">
            <span> Ground-truth labels: </span>
            <Gradient
              colors={['#ffdfb2', '#eee', '#cde8ba']}
              legends={['0%', '100%']}
              width="50px"
              height={25}
            />
          </div>
        </div>
        <div className="col">
          <div className="tgl-wrapper">
            <input
              className="tgl"
              id="cb4"
              type="checkbox"
              checked={display}
              onChange={handleDisplay}
            />
            <label className="tgl-btn" htmlFor="cb4" />
            <span>Display scatters</span>
          </div>

          <div className="convex-legend">
            <img src={ICON} alt="convex" />
            <span>Convex of the selected cluster</span>
          </div>
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
              <span key={text}>{labelNames[text]}</span>
            ))}
          </div>
        </div>

        <div className="chart-wrapper" ref={$wrapper}>
          <div className="yLabels" style={{ height: `${svgHeight}px` }}>
            {yLabelsArr.map((text, j) => (
              <span key={j}>{labelNames[text]}</span>
            ))}
          </div>
          <div className="svg-wrapper">
            <svg
              viewBox={`-1 -1  ${svgWidth + 2} ${svgHeight}`}
              width={`${svgWidth + 2}px`}
              height={`${svgHeight}px`}
              cursor="pointer"
              ref={$svg}
            >
              <defs>
                <clipPath id="rect">
                  <rect x={0} y={0} width={width} height={height} />
                </clipPath>
              </defs>
              <g transform={`translate(${margin.l},${margin.t})`} onClick={clickPoint}>
                {width > 0 &&
                  xLabelsArr.map((x, i) =>
                    yLabelsArr.map((y, j) => {
                      const left = margin.l + indexXScale(i * 2) + padding * i;
                      const top = margin.t + indexYScale(j * 2) + padding * j;
                      // const hull = hullArr[i][j];

                      return (
                        <g
                          key={`${i}-${j}`}
                          id={`${i}-${j}`}
                          transform={`translate(${left}, ${top})`}
                          clipPath="url(#rect)"
                        >
                          {clusterPoints[i].map((cluster: any, rectX: number) => (
                            <g key={`${i}-${j}-${rectX}`} id={`${i}-${rectX}`}>
                              {cluster.map((rect: any, rectY: number) => {
                                const { x0, x1, y0, y1, ratio } = rect;
                                return (
                                  <rect
                                    data-pos={`${i}-${j}-${rectX}-${rectY}`}
                                    key={`${x0},${y0},${i}`}
                                    fill={ratio === -1 ? '#fff' : colorScale(ratio)}
                                    x={x0}
                                    y={y0}
                                    width={x1 - x0}
                                    height={y1 - y0}
                                  />
                                );
                              })}
                            </g>
                          ))}
                        </g>
                      );
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

            <svg
              viewBox={`-1 -1  ${svgWidth + 2} ${svgHeight}`}
              width={`${svgWidth + 2}px`}
              height={`${svgHeight}px`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
              }}
            >
              <g transform={`translate(${margin.l},${margin.t})`} onClick={clickPoint}>
                {width > 0 &&
                  xLabelsArr.map((x, i) =>
                    yLabelsArr.map((y, j) => {
                      const left = margin.l + indexXScale(i * 2) + padding * i;
                      const top = margin.t + indexYScale(j * 2) + padding * j;
                      // const hull = hullArr[i][j];
                      return (
                        <g
                          key={`${i}-${j}`}
                          id={`${i}-${j}`}
                          clipPath="url(#rect)"
                          transform={`translate(${left}, ${top})`}
                        >
                          {hull !== null && (
                            <path
                              d={`M${hull.join(' L')} Z`}
                              fill="none"
                              strokeWidth={2}
                              stroke="var(--primary-color)"
                            />
                          )}
                          <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill="none"
                            stroke="#777"
                            strokeDasharray="2 2"
                            strokeWidth="1px"
                            className="outline"
                          />
                        </g>
                      );
                    })
                  )}
              </g>
            </svg>
          </div>
        </div>

        {/* end of chart-container */}
      </div>
    </div>
  );
};

// export default React.memo(GridMatrix);
export default GridMatrix;
