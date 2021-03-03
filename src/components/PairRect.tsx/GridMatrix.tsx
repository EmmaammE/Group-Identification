import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import inputStyles from '../../styles/input.module.css';
import Gradient from '../ui/Gradient';

interface GridMatrixProps {
  // 一个二维数组，表示点的投影坐标
  data: number[][];
  // 点的位置和label的id
  // dataId: number[];
  // 不一致的点的投影坐标
  // inconsistentData: number[][],
  xLabels: number[];
  yLabels: number[];
  // 高亮的点的下标
  highlight: Set<number>;
  inconsistentSize: number;
}

// const margin = { t: 50, r: 0, b: 0, l: 60 };
const margin = { t: 0, r: 0, b: 0, l: 0 };
// 格子之间的缝隙
const padding = 10;

const colorScale = d3
  .scaleLinear<string>()
  // .domain([0, 0.5, 1])
  .domain([0, 1])
  .range(['#fff', '#9ccb3c']);
// 红白蓝
// .range(['#e60d17', '#fff', '#0b69b6']);

const GridMatrix = ({ data, xLabels, yLabels, highlight, inconsistentSize }: GridMatrixProps) => {
  const $chart = useRef(null);

  const [svgWidth, setWidth] = useState(350);
  const [svgHeight, setHeight] = useState(350);

  const xLabelsArr = useMemo(() => Array.from(new Set(xLabels)).sort(), [xLabels]);
  const yLabelsArr = useMemo(() => Array.from(new Set(yLabels)).sort(), [yLabels]);

  // 格子的大小
  const [gridSize, setGridSize] = useState<number>(0.05);
  const [display, toggelDisplat] = useState<boolean>(true);

  useEffect(() => {
    const { offsetWidth, offsetHeight } = ($chart as any).current;
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
    // console.log(size)
  }, [$chart, xLabelsArr.length, yLabelsArr.length]);

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
        .domain(d3.extent(data, (d) => d[0]) as [number, number]),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .range([0, height])
        .domain(d3.extent(data, (d) => d[1]) as [number, number]),
    [data, height]
  );

  const points: number[][] = useMemo(
    () =>
      data.map((point, k) => {
        const pointX = xLabels[k];
        const pointY = yLabels[k];
        return [xScale(point[0]), yScale(point[1]), pointX, pointY];
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

  const gridPoints = useMemo(
    () =>
      xLabelsArr.map((xLabel, i) =>
        yLabelsArr.map((yLabel, j) => {
          const left = margin.l + indexXScale(i * 2) + padding * i;
          const top = margin.t + indexYScale(j * 2) + padding * j;

          const pointsArr: number[][] = [];
          points.forEach((point, k) => {
            // 绘制点
            const posX = point[0] + left;
            const posY = point[1] + top;

            // const pointX = point[2];
            // const pointY = point[3];
            const pointX = xLabels[k];
            const pointY = yLabels[k];

            if (pointX === xLabel && pointY === yLabel) {
              if (k < data.length - inconsistentSize) {
                pointsArr.push([posX, posY, 0]);
              } else {
                pointsArr.push([posX, posY, 1]);
              }
            }
          });

          return pointsArr;
        })
      ),
    [
      data.length,
      inconsistentSize,
      indexXScale,
      indexYScale,
      points,
      xLabels,
      xLabelsArr,
      yLabels,
      yLabelsArr,
    ]
  );

  useEffect(() => {
    if (!$chart.current || !xScale || !yScale) {
      return;
    }

    const ctx = ($chart.current as any).getContext('2d');

    ctx.clearRect(0, 0, svgWidth, svgHeight);
    ctx.lineWidth = 1;

    // console.log(gridPoints)
    gridPoints.forEach((gridPointRow) => {
      // 每一行
      gridPointRow.forEach((gridPoint) => {
        // 每一格
        gridPoint.forEach((point, k) => {
          if (point[2] === 0) {
            ctx.fillStyle = 'rgba(221,221,221, .9)';
          } else {
            // console.log(point, k)
            ctx.fillStyle = 'rgba(149, 98, 53,.5)';
          }

          ctx.moveTo(point[0], point[1]);
          ctx.beginPath();

          // console.log(point[0], point[1])

          ctx.arc(point[0], point[1], 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          if (highlight.has(k)) {
            ctx.stroke();
          }
        });
      });
    });

    // xLabelsArr.forEach((xLabel, i) => {
    //   yLabelsArr.forEach((yLabel, j) => {
    //     const left = margin.l + indexXScale(i * 2) + padding * i;
    //     const top = margin.t + indexYScale(j * 2) + padding * j;
    //     // console.log(top)
    //     data.forEach((point, k) => {
    //       // 绘制点
    //       const posX = xScale(point[0]) + left;
    //       const posY = yScale(point[1]) + top;

    //       const pointX = xLabels[k];
    //       const pointY = yLabels[k];

    //       if (pointX === xLabel && pointY === yLabel) {
    //         // ctx.fillStyle="rgba(149, 98, 53,.5)";

    //         ctx.moveTo(posX, posY);
    //         ctx.beginPath();

    //         ctx.arc(posX, posY, 2, 0, Math.PI * 2);
    //         ctx.closePath();
    //         ctx.fill();
    //       }
    //       // else {
    //       //   ctx.fillStyle = 'rgba(200,200,200,0.1)';

    //       //   ctx.moveTo(posX, posY);
    //       //   ctx.beginPath();

    //       //   ctx.arc(posX, posY, 2, 0, Math.PI * 2);
    //       //   ctx.closePath();
    //       //   ctx.fill();
    //       // }
    //     });
    //   });
    // });
  }, [
    $chart,
    data,
    data.length,
    gridPoints,
    height,
    highlight,
    inconsistentSize,
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
  ]);

  const handleGridSizeChange = (e: any) => {
    setGridSize(e.target.value);
  };

  const handleDisplay = () => {
    toggelDisplat(!display);
  };

  const hullArr = useMemo(
    () =>
      gridPoints.map((gridRow: any) =>
        gridRow.map((pointsArr: any) =>
          d3.polygonHull(pointsArr.map((point: number[]) => [point[0], point[1]]))
        )
      ),
    [gridPoints]
  );

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

        <div className="checkbox">
          <span>Display scatters</span>
          <input type="checkbox" checked={display} onChange={handleDisplay} />
        </div>
      </div>

      <div className="chart-container">
        <p className="yLabel-title">Output label</p>

        <div className="xLabels">
          <div>
            <span>Ground-truth label</span>
            <div className="input-wrapper">
              <span> (density:</span>
              <Gradient
                colors={['#fff', '#9ccb3c']}
                legends={['0%', '100%']}
                width="50px"
                height={25}
              />
              <span>)</span>
            </div>
          </div>
          <div>
            {xLabelsArr.map((text) => (
              <span key={text}> Label{text}</span>
            ))}
          </div>
        </div>

        <div className="chart-wrapper">
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
            >
              <g transform={`translate(${margin.l},${margin.t})`}>
                {xLabelsArr.map((x, i) =>
                  yLabelsArr.map((y, j) => {
                    const left = margin.l + indexXScale(i * 2) + padding * i;
                    const top = margin.t + indexYScale(j * 2) + padding * j;
                    const hull = hullArr[i][j];

                    return clusterPoints[i].map((cluster: any, k: number) => (
                      <g key={`${i}-${j}-${k}`}>
                        <rect
                          x={left}
                          y={top}
                          width={width}
                          height={height}
                          fill="none"
                          stroke="#777"
                          strokeDasharray="2 2"
                        />
                        {cluster.map((rect: any) => {
                          const { x0, x1, y0, y1, ratio } = rect;
                          return (
                            <rect
                              key={`${x0},${y0},${i}`}
                              fill={colorScale(ratio)}
                              x={x0 + left}
                              y={y0 + top}
                              width={x1 - x0}
                              height={y1 - y0}
                              fillOpacity="0.5"
                            />
                          );
                        })}

                        {hull && (
                          <path
                            d={`M${hull.join(' L')} Z`}
                            fill="none"
                            strokeWidth={2}
                            stroke="var(--primary-color)"
                          />
                        )}
                      </g>
                    ));
                  })
                )}
              </g>

              {/* {
                hullArr.map((hull,i )=> hull && <path
                key={i}
                d={`M${hull.join('L')}Z`}
                // fill="var(--primary-color)"
                fill="none"
                strokeWidth={2}
                stroke="var(--primary-color)"
              />)
              } */}
            </svg>

            <canvas
              ref={$chart}
              width={`${svgWidth}px`}
              height={`${svgHeight}px`}
              style={{
                opacity: display ? 1 : 0,
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
