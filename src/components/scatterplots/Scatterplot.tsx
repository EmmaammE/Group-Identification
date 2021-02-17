import React, { useState, useRef, useEffect, useCallback, Dispatch, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import ScatterplotProps from '../../types/scatter';
import './Scatterplot.scss';
import styles from '../../styles/axis.module.css';
import tipStyles from '../../styles/tip.module.css';
import Triangle from '../markers/Triangle';

function strokeType(type: string) {
  switch (type) {
    case 'dashed':
      return [18, 12];
    case 'dotted':
      return [2, 8];
    case 'dashed-dotted':
      return [18, 10, 1, 8, 1, 10];
    case 'solid':
    default:
      return [0];
  }
}

function pointColor(label: boolean | number) {
  // return label ? 'rgba(84, 122, 167, .7)' : 'rgba(216, 85, 88, .7)';
  return label ? 'rgba(221,221,221, .2)' : 'rgba(149, 98, 53,.7)';
}

function Scatterplot({
  chartConfig: { width: widthP, height: heightP, yaxis, xaxis, margin },
  data,
  render,
  oIndex,
  dimensions,
  extents,
}: ScatterplotProps) {
  const $chart: any = useRef(null);
  const $points: any = useRef(null);

  const [width, setWidth] = useState<number>(widthP);
  const [height, setHeight] = useState<number>(heightP);

  const [widthMap, setWidthMap] = useState<number>(0);
  const [heightMap, setHeightMap] = useState<number>(0);

  useEffect(() => {
    const { offsetWidth, offsetHeight } = $chart.current;
    const size = Math.min(offsetWidth, offsetHeight);
    setWidth(size);
    setHeight(size);

    setWidthMap(offsetWidth - margin.l - margin.r);
    setHeightMap(offsetHeight - margin.t - margin.b);
  }, [$chart, margin.b, margin.l, margin.r, margin.t]);

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const [domains, setDomains] = useState<any>([]);

  const [t, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity.translate(0, 0).scale(1));

  const [select, setSelect] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      const extent = [
        [Number.MAX_VALUE, Number.MIN_VALUE],
        [Number.MAX_VALUE, Number.MIN_VALUE],
      ];

      data.forEach((d) => {
        dimensions.forEach((key: string, i: number) => {
          const v: number = d[key];
          if (v < extent[i][0]) {
            extent[i][0] = v;
          }
          if (v > extent[i][1]) {
            extent[i][1] = v;
          }
        });
      });

      setDomains(extent);
    }
  }, [data, dimensions]);

  const xScale = t.rescaleX(
    d3
      .scaleLinear()
      .range([0, widthMap])
      .domain(domains[0] || [])
      .nice()
  );

  const yScale = t.rescaleY(
    d3
      .scaleLinear()
      .range([heightMap, 0])
      .domain(domains[1] || [])
      .nice()
  );

  const xAxis: any = useMemo(() => d3.axisBottom(xScale).ticks(10).tickFormat(d3.format('.2g')), [
    xScale,
  ]);

  const yAxis: any = useMemo(() => d3.axisLeft(yScale).ticks(10).tickFormat(d3.format('.2g')), [
    yScale,
  ]);

  // 存下点的位置
  const points: Array<Object> = useMemo(() => {
    if (data) {
      return data.map((dat) => {
        const d = dimensions.map((name: string) => dat[name]);
        return {
          pos: [xScale(d[0]), yScale(d[1])],
          label: dat.label,
          id: dat.id,
        };
      });
    }
    return [];
  }, [data, xScale, yScale, dimensions]);

  const drawPoints = useCallback(
    (sX: any, sY: any, k: number, ctx: CanvasRenderingContext2D) => {
      // console.log('drawPoint', pointsMap)

      points.forEach((point: any) => {
        ctx.save();
        ctx.fillStyle = pointColor(point.label);
        ctx.moveTo(point.pos[0], point.pos[1]);
        ctx.beginPath();

        ctx.arc(point.pos[0], point.pos[1], 3, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    },
    [points]
  );

  const drawLines = useCallback(
    (
      // sX: Function,
      // sY: Function,
      kin: number,
      ctx: CanvasRenderingContext2D
      // xAxis: any,
      // yAxis: any
    ) => {
      // const k = (kin > 1 ? kin * 0.75 : kin);
      // const lines = d3.line()
      //   .x(d => sX(d[0]))
      //   .y(d => sY(d[1]))
      //   .curve(d3.curveLinear)
      //   .context(ctx)

      if (yaxis.grid) {
        const yticks = yAxis.scale().ticks(10);
        ctx.restore();
        Object.keys(yticks).forEach((yy) => {
          ctx.beginPath();
          ctx.setLineDash(strokeType('solid'));
          ctx.moveTo(0, yScale(yticks[yy])); // X=min,Y=tick
          ctx.lineTo(widthMap, yScale(yticks[yy]));
          ctx.strokeStyle = 'rgba(10,10,40,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.save();

        // console.log('yticks', yticks);
      }

      if (xaxis.grid) {
        const xticks = xAxis.scale().ticks(10);
        ctx.restore();

        Object.keys(xticks).forEach((xx) => {
          // console.log(sX(xticks[xx]));
          ctx.beginPath();
          ctx.setLineDash(strokeType('solid'));
          ctx.moveTo(xScale(xticks[xx]), 0); // X=min,Y=tick
          ctx.lineTo(xScale(xticks[xx]), heightMap);
          ctx.strokeStyle = 'rgba(10,10,40,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.save();

        // console.log('xticks', xticks)
      }
    },
    [yaxis.grid, xaxis.grid, yAxis, yScale, widthMap, xAxis, xScale, heightMap]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, type: number = 1) => {
      if (domains.length > 0) {
        // 四舍五入到两位有效数字
        // const xAxis = d3
        //   .axisBottom(xScale)
        //   .ticks(9)
        //   .tickFormat(d3.format('.2g'));
        // const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2g'));

        if (type) {
          // draw axis
          d3.select($xaxis.current)
            .call(xAxis.scale(xScale))
            .call((g) => g.select('.domain').remove())
            // .call(g => g.select('.domain').append('line').style('marker-end', "url(#hTriangle)"))
            .call((g) =>
              g.selectAll('.tick line').attr('stroke-opacity', 0.5).attr('stroke-dasharray', '0,25')
            );

          d3.select($yaxis.current)
            .call(yAxis.scale(yScale))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
              g
                .selectAll('.tick:not(:first-of-type) line')
                .attr('stroke-opacity', 0.5)
                .attr('stroke-dasharray', '0,25')
            );
          // clear
          ctx.clearRect(0, 0, widthMap, heightMap);
        }
        // lines
        drawLines(t.k, ctx);

        if (render === 1) {
          // points
          drawPoints(xScale, yScale, t.k, ctx);
        }
      }
    },
    [
      domains.length,
      drawLines,
      t.k,
      render,
      xAxis,
      xScale,
      yAxis,
      yScale,
      widthMap,
      heightMap,
      drawPoints,
    ]
  );

  const chartctx = $chart.current && $chart.current.getContext('2d');

  // drawlasso
  const drawLasso = useCallback(
    (polygon: any) => {
      if (chartctx && select) {
        const xkey = dimensions[0];
        const ykey = dimensions[1];

        const path = d3.geoPath().context(chartctx);

        chartctx.clearRect(0, 0, width, height);
        chartctx.beginPath();
        path({
          type: 'LineString',
          coordinates: polygon,
        });
        chartctx.fillStyle = 'rgba(0,0,0,0.1)';
        chartctx.fill('evenodd');
        chartctx.lineWidth = 1.5;
        chartctx.stroke();

        const selected = new Map();

        data.forEach((d) => {
          if (
            polygon.length > 2 &&
            d3.polygonContains(polygon, [xScale(d[xkey]), yScale(d[ykey])])
          ) {
            selected.set(d.id, true);
          }
        });

        chartctx.closePath();

        draw(chartctx, 0);

        return selected;
      }
      return new Map();
    },
    [chartctx, data, dimensions, draw, height, select, width, xScale, yScale]
  );

  useEffect(() => {
    if (chartctx) {
      chartctx.rect(1, 1, widthMap - 7, heightMap - 1);
      chartctx.clip();

      const $pointsSelect = d3.select($chart.current);

      const zoomer = d3
        .zoom()
        .scaleExtent([-50, 100])
        .duration(700)
        .on('zoom', ({ transform }) => {
          if (!select) {
            chartctx.save();
            setTransform(transform);
            chartctx.restore();
          }
        });

      //  https://github.com/d3/d3-zoom/blob/84a5e7b08b28fc100f80a5facefe7d52d6354ee2/src/zoom.js#L303
      $pointsSelect.call(zoomer).on('dblclick.zoom', () => {
        const transform = d3.zoomIdentity.translate(0, 0).scale(1);
        $pointsSelect
          .transition()
          .duration(200)
          .ease(d3.easeLinear)
          .call((zoomer as any).transform, transform);
      });

      draw(chartctx);
    }
  }, [
    $points,
    $chart,
    draw,
    heightMap,
    widthMap,
    $xaxis,
    $yaxis,
    chartctx,
    domains,
    data,
    t,
    xScale,
    yScale,
    drawLasso,
    select,
    oIndex,
    dimensions,
  ]);

  const toSelect = () => {
    setSelect(!select);
  };

  const hullExtents = useMemo(
    () =>
      extents.map((extentArr) => [
        extentArr[0].map((d) => xScale(d)),
        extentArr[1].map((d) => yScale(d)),
      ]),
    [extents, xScale, yScale]
  );

  const colorScale = d3.scaleLinear<string>().domain([0, 1]).range(['#fff', '#ffd3b5']);

  return (
    <div className="scatter-box">
      <div className="container">
        <svg width={`${width}px`} height={`${height}px`}>
          <defs>
            <Triangle />
          </defs>

          <clipPath id="myClip">
            <rect width={widthMap} height={heightMap} />
          </clipPath>

          <g transform={`translate(${margin.l},${margin.t})`}>
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
            <text className={styles.label} x={heightMap / 13} y={heightMap - 5}>
              {xaxis.title}
            </text>
            <text
              className={styles.label}
              transform="rotate(-90)"
              x={(-heightMap * 12) / 13}
              dy="20"
            >
              {yaxis.title}
            </text>
            {/* {
              grids.map((gridRow, i) => 
                gridRow.map((grid, j) => <rect
                  {...grid}
                  key={`${grid.x},${grid.y}`}
                  fill="#efefef"
              />))
            } */}
            {/* {clusterPoints.map((cluster: any) => {
              const { i, j, rate } = cluster;
              const grid = grids[i][j];
              return <rect {...grid} key={`${grid.x},${grid.y}`} fill={colorScale(rate)} />;
            })} */}
            <g clipPath="url(#myClip)">
              {/* <g>
                {hullExtents.map((e,i) => (
                  <ExtentHull extent={e as any} key={`hull${i}`}/>
                ))}
              </g> */}
              {render ||
                (domains.length > 0 &&
                  data.map((dat, i) => (
                    <circle
                      key={i}
                      cx={xScale(dat.dimensions[0])}
                      cy={yScale(dat.dimensions[1])}
                      r={3}
                      fill={pointColor(dat.label)}
                    />
                  )))}
            </g>
          </g>
        </svg>
        <canvas
          width={`${width}px`}
          height={`${height}px`}
          ref={$chart}
          className="linemap"
          style={{
            width: '100%',
            // height: '100%',
            margin: `${margin.t}px ${margin.r}px ${margin.b}px ${margin.l}px`,
          }}
        />
      </div>
    </div>
  );
}

export default Scatterplot;
