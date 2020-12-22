import React, {
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as d3 from 'd3';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ChartBasicProps } from '../../types/chart';
import { setPoints } from '../../store/action';
import { PointsState } from '../../types/point';
import { DataItem } from '../../types/data';

interface ParallelProps {
  chartConfig: ChartBasicProps;
  dimensions: string[];
  datum: DataItem[];
  oIndex: number;
}
interface ActiveItem {
  dimension: number;
  extent: [number, number];
}

const color = d3
  .scaleOrdinal()
  .domain(['0', '1'])
  .range(['rgba(216, 85, 88, 1)', 'rgba(84, 122, 167, 1)']);

export default function Parallel({
  chartConfig: { width, height, margin },
  dimensions,
  datum,
  oIndex,
}: ParallelProps) {
  const widthMap: number = width - margin.l - margin.r;
  const heightMap: number = height - margin.t - margin.b;

  const [yScales, setYScales] = useState<any>({});
  const [domains, setDomains] = useState<any>([]);

  const $lines: any = useRef(null);
  const $axis: any = useRef(null);

  const [selected, setSelected] = useState<string>('');
  const [actives, setActives] = useState<Array<ActiveItem> | []>([]);

  const selectPoints = useSelector(
    (state: PointsState) => state.points,
    shallowEqual
  );

  const dispatch: Dispatch<any> = useDispatch();
  const saveSelectedPoints = React.useCallback(
    (points) => dispatch(setPoints(points)),
    [dispatch]
  );

  const brush = useCallback(() => {
    const activesT: Array<ActiveItem> = [];

    d3.select($axis.current)
      .selectAll('g')
      .select('g.brush')
      .filter(function filterHandler() {
        return d3.brushSelection(this as any) as any;
      })
      .each(function eachHandler(d: any) {
        const t = d3.brushSelection(this as any);
        if (t) {
          activesT.push({
            dimension: d,
            extent: (t as any).map(yScales[d].invert),
          });
        }
      });

    if (activesT.length > 0) {
      const points = new Map();

      datum.forEach((dat) => {
        const isActive = activesT.every((active) => {
          const value = (dat as any)[active.dimension];
          return active.extent[0] >= value && active.extent[1] <= value;
        });
        if (isActive) {
          points.set(dat.id, true);
        }
      });

      saveSelectedPoints({
        [oIndex]: points,
      });
      setActives(activesT);
    }
  }, [datum, oIndex, saveSelectedPoints, yScales]);

  const brushes = useMemo(
    () =>
      dimensions.map(() =>
        d3
          .brushY()
          .extent([
            [-10, 0],
            [10, heightMap],
          ])
          .on('brush', brush)
          .on('end', brush)
      ),
    [brush, dimensions, heightMap]
  );

  useEffect(() => {
    if (datum) {
      const extent = dimensions.map(() => [Number.MAX_VALUE, Number.MIN_VALUE]);

      datum.forEach((d: any) => {
        dimensions.forEach((name, i) => {
          const v = d[name];
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
  }, [datum, dimensions]);

  useEffect(() => {
    if (domains.length > 0) {
      const y = dimensions.reduce(
        (acc: any, name, i) => ({
          ...acc,
          [name]: d3
            .scaleLinear()
            .domain(domains[i])
            .range([heightMap, 0])
            .nice(),
        }),
        {}
      );

      setYScales(y);
    }
  }, [dimensions, domains, heightMap]);

  const xScale: Function = d3
    .scalePoint()
    .range([0, widthMap])
    .domain(dimensions);

  // lines事件监听
  useEffect(() => {
    const $linesSelect = d3.select($lines.current);
    $linesSelect
      .on('mouseover', (e) => {
        if (actives.length === 0) {
          $linesSelect
            .transition()
            .duration(50)
            .on('end', () => {
              if (e) {
                setSelected(d3.select(e.target).attr('class'));
              }
            });
        }
      })
      .on('mouseout', () => {
        $linesSelect
          .transition()
          .duration(200)
          .on('end', () => {
            setSelected('');
          });
      })
      .on('dblclick', (e) => {
        d3.select($axis.current)
          .selectAll('g.brush')
          .each(function cancle(d, i) {
            d3.select(this)
              .transition()
              .call((brushes[i] as any).move, null)
              .on('end', () => {
                setActives([]);
                saveSelectedPoints({
                  [oIndex]: new Map(),
                });
              });
          });
      })
      .on('dblclick.zoom', null);
  }, [$lines, actives.length, brushes, oIndex, saveSelectedPoints]);

  // draw axis and brush
  useEffect(() => {
    if (Object.keys(yScales).length > 0) {
      const $axisSelect = d3
        .select($axis.current)
        .selectAll('g')
        .data(dimensions)
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${xScale(d)}, 0)`);

      $axisSelect
        .append('g')
        .attr('class', 'brush')
        .each(function drawBrush(d, i) {
          d3.select(this).call(brushes[i] as any);
        });

      $axisSelect
        .append('g')
        .attr('class', 'axis')
        .each(function drawAxis(d) {
          const axis = d3.axisLeft(yScales[d]).ticks(5);
          d3.select(this)
            .call(axis.scale(yScales[d]))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
              g
                .selectAll('.tick:not(:first-of-type) line')
                .attr('stroke-opacity', 0.5)
                .attr('stroke-dasharray', '0,25')
            );
        })
        .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text((d) => d)
        .style('fill', 'black');

      $axisSelect.on('dblclick.zoom', null);
    }
  }, [$axis, brush, brushes, dimensions, heightMap, xScale, yScales]);

  function path(d: any) {
    const tmp: any = d3.scaleLinear().domain([0, 1]).range([heightMap, 0]);

    return d3.line()(
      dimensions.map((p) => {
        const y = yScales[p] || tmp;
        return [xScale(p), y(d[p])];
      })
    );
  }

  const getStyle = ({ label, ...data }: { [key: string]: any }): object => {
    const pointsMap = selectPoints[oIndex];
    const hasBrush = pointsMap && pointsMap.size > 0;

    const defaultStyle = { stroke: '#333', opacity: 0.2 };

    if (hasBrush) {
      const isActive = pointsMap.has(data.id);
      if (isActive) {
        return { stroke: color(label) as string, opacity: 1 };
      }
      return defaultStyle;
    }

    const isSelected = selected === '' || label === selected;

    if (isSelected) {
      return { stroke: color(label) as string, opacity: 0.5 };
    }

    return { stroke: '#333', opacity: 0.2 };
  };

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.l},${margin.t})`}>
        <g ref={$lines}>
          {domains.length > 0 &&
            datum.map((d: any, index: number) => (
              <path
                key={index}
                className={d.label}
                fill="none"
                {...getStyle(d)}
                d={path(d) as string}
                style={{
                  transition: 'opacity 300ms ease-in-out',
                }}
              />
            ))}
        </g>
        <g ref={$axis} />
        {dimensions.map((d) => (
          <line
            x1={xScale(d)}
            x2={xScale(d)}
            y1={heightMap}
            y2={-10}
            stroke="rgba(0,0,0,0.8)"
            markerEnd="url(#arrow)"
            markerStart="url(#arrow-end)"
          />
        ))}
      </g>
    </svg>
  );
}
