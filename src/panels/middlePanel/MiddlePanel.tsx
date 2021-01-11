import React from 'react';
import Overview, { OverviewProps } from '../../components/overview/Overview';

const fakeData = {
  // 联邦模型矢量
  fed: [
    [0.1, 0.1],
    [0.3, 0.2],
    [0.9, 1.2],
  ],
  local: [
    [0.1, 0.3],
    [-0.9, 0.1],
    [0.7, 1.2],
  ],
  batchSize: [1, 2, 1],
};

const dataProps: OverviewProps = {
  data: fakeData,
};

function MiddlePanel() {
  return (
    <div className="panel">
      <h2>Dataset Description</h2>
      <Overview {...dataProps} />
    </div>
  );
}

export default MiddlePanel;
