import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as d3 from 'd3';
import { ChartBasicProps } from '../../types/chart';

interface ParallelProps {
  chartConfig: ChartBasicProps;
  dimensions: string[];
  datum: Object[];
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
}: ParallelProps) {
  const widthMap: number = width - margin.l - margin.r;
  const heightMap: number = height - margin.t - margin.b;

  const [yScales, setYScales] = useState<any>({});
  const [domains, setDomains] = useState<any>([]);

  const $lines: any = useRef(null);
  const $axis: any = useRef(null);

  const [selected, setSelected] = useState<string>('');
  const [actives, setActives] = useState<Array<ActiveItem> | []>([]);

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

    setActives(activesT);
  }, [yScales]);

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
      const extent = [
        [Number.MAX_VALUE, Number.MIN_VALUE],
        [Number.MAX_VALUE, Number.MIN_VALUE],
      ];

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
      .on('dblclick', () => {
        d3.select($axis.current)
          .selectAll('g.brush')
          .each(function cancle(d, i) {
            d3.select(this)
              .transition()
              .call((brushes[i] as any).move, null);
          });

        setActives([]);
      });
  }, [$lines, actives.length, brushes]);

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
        .attr('class', 'axis')
        .each(function drawAxis(d) {
          const axis = d3.axisLeft(yScales[d]).ticks(5);
          d3.select(this).call(axis.scale(yScales[d]));
        })
        .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text((d) => d)
        .style('fill', 'black');

      $axisSelect
        .append('g')
        .attr('class', 'brush')
        .each(function drawBrush(d, i) {
          d3.select(this).call(brushes[i] as any);
        });
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

  const getOpacity = (label: string) => {
    if (selected === '') {
      return 0.5;
    }
    return label === selected ? 1 : 0.3;
  };

  const getColor = ({ label, ...data }: { [key: string]: any }): string => {
    const isActive = actives.every((active) => {
      const value = (data as any)[active.dimension];
      return active.extent[0] >= value && active.extent[1] <= value;
    });

    const isSelected =
      actives.length === 0 && (selected === '' || label === selected);

    if (isActive || isSelected) {
      return color(label) as string;
    }

    return '#333';
    // TODO 转换为index
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
                opacity={getOpacity(`${d.label}`)}
                stroke={getColor(d)}
                d={path(d) as string}
                style={{
                  transition: 'opacity 300ms ease-in-out',
                }}
              />
            ))}
        </g>
        <g ref={$axis} />
      </g>
    </svg>
  );
}
