import React, { useEffect, useState } from 'react';
import TSNE from 'tsne-js';
import Overview, { OverviewProps } from '../../components/overview/Overview';
import data from '../../assets/data/test_data.json';
import LineChart from '../../components/lineChart/Linechart';
import './MiddlePanel.scss';

const lineChartMargin = {
  r: 50,
  b: 18,
  l: 36,
  t: 36,
};

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

const model = new TSNE({
  dim: 2,
  perplexity: 30.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 1000,
  metric: 'euclidean',
});

// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

const dataProps: OverviewProps = {
  data: fakeData,
};

function MiddlePanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(1);
  // TODO 初始化fakeData
  const [overviewData, setData] = useState(fakeData);
  const lineChartData = [(data as any).federated.loss, (data as any).others[index].loss];

  // TODO如果请求获取数据，这里要加一点东西
  useEffect(() => {
    model.init({
      data: (data as any).federated.weight,
      type: 'dense',
    });

    const fed = model.getOutput();

    model.init({
      data: (data as any).others[index].weight,
      type: 'dense',
    });
    const local = model.getOutput();

    const batchSize = (data as any).time.map((d: Array<number>) => d.length);
    setData({ ...overviewData, fed, local, batchSize });
  }, []);

  return (
    <div id="MiddlePanel" className="panel">
      <h2>XXXX</h2>
      <div className="info-container">
        <h3>Dataset Description</h3>
        <p>Name: xxx</p>
        <p>Label: xxx</p>
        <p>Attributes</p>

        <h3>Federated Learning Description</h3>
        <p>Party number</p>
        <p>Iteration</p>
        <h3>Federated Process Overview</h3>
      </div>

      <Overview data={overviewData} />
      <div className="wrapper">
        <LineChart data={lineChartData} margin={lineChartMargin} />
      </div>
    </div>
  );
}

export default MiddlePanel;
