import React from 'react';
import Scatterplot from '../components/scatterplots/Scatterplot';
import { ChartProps } from '../types/chart';
import CPCA from '../assets/cpca.json';
import LABEL from '../assets/labels.json';
import './Scatter.scss';

const chartProps: ChartProps = {
  width: 400,
  height: 350,
  margin: { t: 25, r: 0, b: 50, l: 50 },
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

const datum = CPCA.map((data) =>
  data.map((d, i) => ({
    pos: d,
    label: LABEL[i],
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
            render={0}
          />
        </div>
      ))}
    </div>
  );
}

export default ScatterplotContainer;
