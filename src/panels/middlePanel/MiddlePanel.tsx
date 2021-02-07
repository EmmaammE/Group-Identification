import React, { useEffect, useState } from 'react';
import TSNE from 'tsne-js';
import Overview, { OverviewProps } from '../../components/overview/Overview';
// import data from '../../assets/data/test_data.json';
import LineChart from '../../components/lineChart/Linechart';
import './MiddlePanel.scss';

const lineChartMargin = {
  r: 36,
  b: 100,
  l: 20,
  t: 36,
};

const fakeData = {
  // 联邦模型矢量
  fed: [
    // [0.1, 0.1],
    // [0.3, 0.2],
    // [0.9, 1.2],
  ],
  local: [
    // [0.1, 0.3],
    // [-0.9, 0.1],
    // [0.7, 1.2],
  ],
  // batchSize: [1, 2, 1],
  batchSize: [],
};

interface OverviewData {
  fed: number[][];
  local: number[][];
  batchSize: number[];
}

type LineChartData = [number[], number[]];
const model = new TSNE({
  dim: 2,
  perplexity: 30.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 1000,
  metric: 'euclidean',
});

interface dataType {
  time: number[][];
  federated: {
    loss: [];
    gradient: number[][];
    weight: number[][];
  };
  others: Array<{
    clientName: string;
    loss: number[];
    gradient: number[][];
    weight: number[][];
  }>;
}
// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

function MiddlePanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(1);
  const [overviewData, setOverviewData] = useState<OverviewData>(fakeData);
  // const [data, setData] = useState<dataType | null>(null);
  const [lineChartData, setLineChartData] = useState<LineChartData>([[], []]);
  const [name, setName] = useState<string>('');
  const [time, setTime] = useState<Array<number>>([]);

  useEffect(() => {
    fetch('/fl-hetero/initialize/')
      .then((res) => res.json())
      .then((res: dataType) => {
        // console.log(res)
        model.init({
          data: res.federated.weight,
          type: 'dense',
        });

        const fed = model.getOutput();

        model.init({
          data: res.others[index].weight,
          type: 'dense',
        });
        const local = model.getOutput();

        const batchSize: number[] = res.time.map((d: number[]) => d.length);
        const timeEnd: number[] = res.time.map((d: number[]) => d[1]);

        setOverviewData({ fed, local, batchSize });
        setLineChartData([res.federated.loss, res.others[index].loss]);
        setName(res.others[index].clientName);
        setTime(timeEnd);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Federated Learning Overview</h2>

      <div className="content">
        <div className="info-container">
          <h3>Data Description</h3>
          <p>Dataset: {name} Dataset</p>
          <p>Label: xxx</p>
          <p>Size: </p>

          <div className="divider" />

          <h3>Federated Learning Description</h3>
          <p>Total number of clients: 123</p>
          <p>Name of the client: xxx</p>
          <p>Current communication round: No.123 (Updating)</p>

          <div className="divider" />
        </div>

        <div className="overview-wrapper">
          <h3>Model Updates Projection</h3>
          <div className="overview-content">
            <Overview data={overviewData} />
            <div className="info">
              <div>
                <p>Communication round range:</p>
                <svg width="80px" viewBox="0 0 80 20">
                  <rect />
                </svg>
              </div>
            </div>
          </div>
          <div className="divider" />
        </div>

        <div className="loss-wrapper">
          <h3>Federated Training Process</h3>
          <LineChart data={lineChartData} margin={lineChartMargin} time={time} />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
