import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import ScatterplotProps from '../../types/scatter';
import './Scatterplot.scss';
import styles from '../../styles/axis.module.css';
import tipStyles from '../../styles/tip.module.css';

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

function pointColor(label: number) {
  return label ? 'rgba(84, 122, 167, .7)' : 'rgba(216, 85, 88, .7)';
}

interface TooltipData {
  x: number;
  y: number;
  info: string;
}

function Scatterplot({
  chartConfig: { width, height, yaxis, xaxis, margin },
  data,
  render,
}: ScatterplotProps) {
  const widthMap: number = width - margin.l - margin.r;
  const heightMap: number = height - margin.t - margin.b;

  const $chart: any = useRef(null);
  const $points: any = useRef(null);

  const $xaxis: any = useRef(null);
  const $yaxis: any = useRef(null);

  const [domains, setDomains] = useState<any>([]);

  const [tip, setTooltip] = useState<TooltipData | null>(null);

  const [t, setTransform] = useState<d3.ZoomTransform>(
    d3.zoomIdentity.translate(0, 0).scale(1)
  );

  useEffect(() => {
    if (data) {
      const extent = [
        [Number.MAX_VALUE, Number.MIN_VALUE],
        [Number.MAX_VALUE, Number.MIN_VALUE],
      ];

      data.forEach((d) => {
        d.pos.forEach((v, i) => {
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
  }, [data]);

  const drawPoints = useCallback(
    (sX: any, sY: any, k: number, ctx: CanvasRenderingContext2D) => {
      // points drawn to scales
      const pointGen = d3.symbol().context(ctx);

      // ctx.globalCompositeOperation = 'screen'

      data.forEach((dat) => {
        const d = dat.pos;
        ctx.save();
        ctx.fillStyle = pointColor(dat.label);
        ctx.translate(sX(d[0]), sY(d[1]));
        ctx.beginPath();
        pointGen.size(50)(d);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    },
    [data]
  );

  const drawLines = useCallback(
    (
      sX: Function,
      sY: Function,
      kin: number,
      ctx: CanvasRenderingContext2D,
      xAxis: any,
      yAxis: any
    ) => {
      // const k = (kin > 1 ? kin * 0.75 : kin);
      // const lines = d3.line()
      //   .x(d => sX(d[0]))
      //   .y(d => sY(d[1]))
      //   .curve(d3.curveLinear)
      //   .context(ctx)

      if (yaxis.grid) {
        const yticks = yAxis.scale(sY).scale().ticks(5);
        ctx.restore();

        Object.keys(yticks).forEach((yy) => {
          ctx.beginPath();
          ctx.setLineDash(strokeType('solid'));
          ctx.moveTo(0, sY(yticks[yy])); // X=min,Y=tick
          ctx.lineTo(widthMap, sY(yticks[yy]));
          ctx.strokeStyle = 'rgba(10,10,40,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.save();
      }

      if (xaxis.grid) {
        const xticks = xAxis.scale(sX).scale().ticks(9);
        ctx.restore();

        Object.keys(xticks).forEach((xx) => {
          ctx.beginPath();
          ctx.setLineDash(strokeType('solid'));
          ctx.moveTo(sX(xticks[xx]), 0); // X=min,Y=tick
          ctx.lineTo(sX(xticks[xx]), heightMap);
          ctx.strokeStyle = 'rgba(10,10,40,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.save();
      }
    },
    [heightMap, widthMap, xaxis.grid, yaxis.grid]
  );

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

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (domains.length > 0) {
        // 四舍五入到两位有效数字
        const xAxis = d3
          .axisBottom(xScale)
          .ticks(9)
          .tickFormat(d3.format('.2g'));
        const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2g'));

        // draw axis
        d3.select($xaxis.current).call(xAxis.scale(xScale));
        d3.select($yaxis.current).call(yAxis.scale(yScale));

        // clear
        ctx.clearRect(0, 0, widthMap, heightMap);

        // lines
        drawLines(xScale, yScale, t.k, ctx, xAxis, yAxis);

        if (render === 1) {
          // points
          drawPoints(xScale, yScale, t.k, ctx);
        }
      }
    },
    [
      domains.length,
      xScale,
      yScale,
      widthMap,
      heightMap,
      drawLines,
      drawPoints,
      t,
      render,
    ]
  );

  const chartctx = $chart.current && $chart.current.getContext('2d');

  useEffect(() => {
    if (chartctx) {
      chartctx.rect(1, 1, widthMap - 7, heightMap - 1);
      chartctx.clip();

      const $pointsSelect = d3.select($chart.current);

      const zoomer = d3
        .zoom()
        .scaleExtent([0.9, 100])
        .duration(700)
        .on('zoom', ({ transform }) => {
          chartctx.save();
          setTransform(transform);
          setTooltip(null);
          chartctx.restore();
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

      $pointsSelect
        .on('mousemove', (event: any) => {
          const m = d3.pointer(event);
          const { k } = t;
          // setup an array to push the points to when > 1 point matches... i.e. two line pts.
          let tooltipData: any = null;
          // get the "points" data
          const minD: number = Number.MAX_VALUE;
          data.forEach((dat) => {
            const d = dat.pos;
            const dx = xScale(d[0]) - m[0];
            const dy = yScale(d[1]) - m[1];

            // Check distance
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            if (
              distance <= Math.sqrt(50) * (k > 1 ? k * 0.75 : k) &&
              distance < minD
            ) {
              tooltipData = dat;
            }
          });
          if (tooltipData !== null) {
            const pxDat = [
              ~~xScale(tooltipData.pos[0]),
              ~~yScale(tooltipData.pos[1]),
            ];

            // console.log(pxDat[0], pxDat[1], "mouse:", m[0], m[1])
            setTooltip({
              x: pxDat[0],
              y: pxDat[1],
              info: tooltipData.label,
            });
          } else {
            setTooltip(null);
          }
        })
        .on('mouseout', () => {
          setTooltip(null);
        });
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
  ]);

  return (
    <div className="container">
      <svg width={width} height={height}>
        <clipPath id="myClip">
          <rect width={widthMap} height={heightMap} />
        </clipPath>

        <g transform={`translate(${margin.l},${margin.t})`}>
          <g
            transform={`translate(0, ${heightMap})`}
            className="axes x-axis"
            ref={$xaxis}
          />
          <g className="axes y-axis" ref={$yaxis} />
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
          <g clipPath="url(#myClip)">
            {render ||
              (domains.length > 0 &&
                data.map((dat, i) => (
                  <circle
                    key={i}
                    cx={xScale(dat.pos[0])}
                    cy={yScale(dat.pos[1])}
                    r={3}
                    fill={pointColor(dat.label)}
                  />
                )))}
          </g>
        </g>
      </svg>
      <canvas
        width={width}
        height={height - 2}
        ref={$chart}
        className="linemap"
        style={{
          margin: `${margin.t + 1}px ${margin.r}px ${margin.b}px ${margin.l}px`,
        }}
      />
      {tip && (
        <div
          className={tipStyles.tip}
          style={{
            left: tip.x + margin.l,
            top: tip.y + margin.t,
          }}
        >
          {tip.info}
        </div>
      )}
    </div>
  );
}

export default Scatterplot;
