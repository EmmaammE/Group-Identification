import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ChartBasicProps } from '../../types/chart';

interface ParallelProps {
  chartConfig: ChartBasicProps;
  dimensions: string[];
  datum: Object[];
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

  // hover
  useEffect(() => {
    const $linesSelect = d3.select($lines.current);
    $linesSelect
      .on('mouseover', (e) => {
        $linesSelect
          .transition()
          .duration(50)
          .on('end', () => {
            setSelected(d3.select(e.target).attr('class'));
          });
      })
      .on('mouseout', () => {
        $linesSelect
          .transition()
          .duration(200)
          .on('end', () => {
            setSelected('');
          });
      });
  }, [$lines]);

  // draw axis
  useEffect(() => {
    if (Object.keys(yScales).length > 0) {
      d3.select($axis.current)
        .selectAll('myAxis')
        .data(dimensions)
        .enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', (d) => `translate(${xScale(d)}, 0)`)
        .each(function drawAxis(d) {
          // console.log(d, yScales)
          const axis = d3.axisLeft(yScales[d]).ticks(5);
          d3.select(this).call(axis.scale(yScales[d]));
        })
        .append('text')
        .style('text-anchor', 'middle')
        .attr('y', -9)
        .text((d) => d)
        .style('fill', 'black');
    }
  }, [$axis, dimensions, xScale, yScales]);

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

  const getColor = (label: string): string => {
    if (selected === '' || label === selected) {
      return color(label) as string;
    }
    return '#333';
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
                stroke={getColor(`${d.label}`)}
                d={path(d) as string}
                style={{
                  transition: 'opacity 300ms ease-in-out',
                }}
              />
            ))}
          <g ref={$axis} />
        </g>
      </g>
    </svg>
  );
}
