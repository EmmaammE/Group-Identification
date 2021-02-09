import React, { useEffect, useState } from 'react';
import TSNE from 'tsne-js';
import Overview, { OverviewProps } from '../../components/overview/Overview';
// import data from '../../assets/data/test_data.json';
import LineChart from '../../components/lineChart/Linechart';
import './MiddlePanel.scss';
import Gradient from '../../components/ui/Gradient';
import RangeSlider from '../../components/ui/Range';
import Dropdown from '../../components/ui/Dropdown';

const lineChartMargin = {
  r: 15,
  b: 80,
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

const GRADIENT = ['#fff', '#aa815d'];

function MiddlePanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(1);
  const [overviewData, setOverviewData] = useState<OverviewData>(fakeData);
  // const [data, setData] = useState<dataType | null>(null);
  const [lineChartData, setLineChartData] = useState<LineChartData>([[], []]);
  const [name, setName] = useState<string>('');
  const [time, setTime] = useState<Array<number>>([]);
  const [maxRound, setMaxRound] = useState<number>(40);

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
        setMaxRound(timeEnd[timeEnd.length - 1]);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const items = ['1', '2'];

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Federated Learning Overview</h2>

      <div className="content">
        <div className="info-container">
          <h3>Data Description</h3>
          <div className="row">
            <p>Dataset: {name} Dataset</p>
            <Dropdown items={items} index={0} />
          </div>
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
                <div className="legend-wrapper">
                  <p>1</p>
                  <RangeSlider minValue={1} maxValue={maxRound} />
                  <p>{maxRound}(max)</p>
                </div>
                <div className="dashed-divider" />
              </div>

              <div>
                <p>Updates:</p>
                <div className="update-wrapper">
                  <svg width="80px" viewBox="0 0 80 30">
                    <defs>
                      <marker
                        id="o-marker"
                        refX="6 "
                        refY="6"
                        viewBox="0 0 16 16"
                        markerWidth="10"
                        markerHeight="10"
                        markerUnits="userSpaceOnUse"
                        orient="auto"
                      >
                        <path d="M 0 0 12 6 0 12 3 6 Z" fill="var(--primary-color)" />
                      </marker>
                    </defs>
                    <line x1="0" y1="22.5%" x2="100%" y2="22.5%" stroke="#777" />
                    <line x1="0" y1="87.5%" x2="95%" y2="87.5%" stroke="var(--primary-color)" markerEnd="url(#o-marker)" />
                  </svg>

                  <div>
                    <p>Federated results</p>
                    <p>Local uploads</p>
                  </div>
                </div>
                <div className="dashed-divider" />
              </div>

              <div>
                <p>Gradient similarity(Cosine)</p>
                <Gradient colors={GRADIENT} legends={['-1', '1']} />
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
