import React from 'react';
import CPCA from '../assets/cpca.json';
import LABEL from '../assets/labels.json';
import Parallel from '../components/parallel/Parallel';
import { ChartBasicProps } from '../types/chart';

const chartProps: ChartBasicProps = {
  width: 380,
  height: 400,
  margin: { t: 25, r: 50, b: 50, l: 100 },
};

const datum = CPCA.map((data) =>
  data.map((d, i) => ({
    PC1: d[0],
    PC2: d[1],
    label: LABEL[i],
  }))
);

export default function ParallelContainer() {
  return (
    <div className="parallel">
      {Array.from({ length: 4 }, (v, i) => i).map((d, index) => (
        <Parallel
          key={index}
          chartConfig={chartProps}
          dimensions={['PC1', 'PC2']}
          datum={datum[index]}
        />
      ))}
    </div>
  );
}
