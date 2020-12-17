import React from 'react';
import Scatterplot from '../components/scatterplots/Scatterplot';
import { ChartProps } from '../types/chart';
import CPCA from '../assets/cpca.json';
import LABEL from '../assets/labels.json';
import './Scatter.scss';
import { DataItem } from '../types/data';

const chartProps: ChartProps = {
  width: 400,
  height: 380,
  margin: { t: 50, r: 10, b: 20, l: 50 },
  // margin:{t: 0, r: 0, b: 0, l: 0},
  yaxis: {
    title: 'PC2',
    color: 'rgba(174, 174, 174, 1)',
    grid: true,
  },
  xaxis: {
    title: 'PC1',
    color: 'rgba(174, 174, 174, 1)',
    grid: true,
  },
};

let id = 0;
const datum: Array<DataItem[]> = CPCA.map((data) =>
  data.map((d, i) => ({
    id: id++,
    label: LABEL[i],
    // pos: d,
    PC1: d[0],
    PC2: d[1],
  }))
);

function ScatterplotContainer() {
  return (
    <div className="scatters">
      {Array.from({ length: 4 }, (v, i) => i).map((d, index) => (
        <div className="scatter-wrapper" key={index}>
          <Scatterplot
            chartConfig={chartProps}
            data={datum[index]}
            render={1}
            oIndex={index}
            dimensions={['PC1', 'PC2']}
          />
        </div>
      ))}
    </div>
  );
}

export default ScatterplotContainer;
