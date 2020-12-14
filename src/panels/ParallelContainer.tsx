import React from 'react';
import CPCA from '../assets/cpca.json';
import LABEL from '../assets/labels.json';
import Parallel from '../components/parallel/Parallel';
import { ChartBasicProps } from '../types/chart';
import { DataItem } from '../types/data';

const chartProps: ChartBasicProps = {
  width: 380,
  height: 400,
  margin: { t: 25, r: 50, b: 50, l: 100 },
};

let id = 0;
const datum: Array<DataItem[]> = CPCA.map((data) =>
  data.map((d, i) => ({
    id: id++,
    label: LABEL[i],
    PC1: d[0],
    PC2: d[1],
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
          oIndex={index}
        />
      ))}
    </div>
  );
}
