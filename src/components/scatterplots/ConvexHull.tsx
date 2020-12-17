import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../../styles/line.module.css';

interface ConvexHullProps {
  points: any;
}
function ConvexHull({ points }: ConvexHullProps) {
  const $hull = useRef(null);

  const hull = useMemo(() => d3.polygonHull(points), [points]);

  useEffect(() => {
    if ($hull) {
      d3.select($hull.current).transition().style('fill', 'lightblue');
    }
  }, [$hull, hull]);

  return (
    <g className={styles.convex}>
      <path ref={$hull} d={`M${hull?.join('L')}Z`} />
    </g>
  );
}

export default ConvexHull;
