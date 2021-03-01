import React, { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import TSNE from 'tsne-js';
import Overview from '../../components/overview/Overview';
import LineChart from '../../components/lineChart/Linechart';
import './style.scss';
import Gradient from '../../components/ui/Gradient';
import RangeSlider from '../../components/ui/RangeSlider';
import Dropdown from '../../components/ui/Dropdown';
import { getData } from '../../store/leftpanelAction';
import { setRoundAction, setNameAction } from '../../store/reducers/basic';
import weightsData from '../../assets/data/test_weights.json';

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
  point: [],
};

interface OverviewData {
  fed: number[][];
  local: number[][];
  point: number[];
}

interface Info {
  // 拼接成字符串
  labels: string;
  dimensions: number | '';
  numberOfClients: number | '';
  communicationRounds: number | '';
  testDataSize: number | '';
  trainingDataSize: number | '';
}

const initInfo: Info = {
  labels: '',
  dimensions: '',
  numberOfClients: '',
  communicationRounds: '',
  testDataSize: '',
  trainingDataSize: '',
};

type LineChartData = [number[], number[]];
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

const GRADIENT = ['#fff', '#aa815d'];

function LeftPanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(-1);
  const [overviewData, setOverviewData] = useState<OverviewData>(fakeData);
  // const [data, setData] = useState<dataType | null>(null);
  const [lineChartData, setLineChartData] = useState<LineChartData>([[], []]);
  const [name, setName] = useState<string>('');
  const [time, setTime] = useState<Array<number>>([]);

  const [range, setRange] = useState<number[]>([1, 10]);
  const [extent, setExtent] = useState<number[]>([1, 10]);
  const [rangeMap, setRangeMap] = useState<number[]>([0, 0]);

  const rawData = useSelector((state: any) => state.leftPanel, shallowEqual);
  const dispatch = useDispatch();
  const initialize = useCallback(() => dispatch(getData()), [dispatch]);
  const updateName = useCallback((n) => dispatch(setNameAction(n)), [dispatch]);
  // const [round, setRound] = useState<number>(121);

  // client Names
  const [names, setClientNames] = useState<string[]>([]);
  const [info, setInfo] = useState<Info>(initInfo);
  useEffect(() => {
    // initialize();
    fetch('/fl-hetero/datasets/')
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
        // 当前只有一个数据集
        const { datasetNames } = res;

        fetch('/fl-hetero/datasets/', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            datasetName: datasetNames,
          }),
        })
          .then((res2) => res2.json())
          .then((res2) => {
            const {
              clientNames,
              communicationRounds,
              dimensions,
              labels,
              numberOfClients,
              testDataSize,
              trainingDataSize,
            } = res2;

            setClientNames(clientNames);

            setInfo({
              labels: labels.join(','),
              communicationRounds,
              dimensions,
              numberOfClients,
              testDataSize,
              trainingDataSize,
            });

            fetch('/fl-hetero/weights/')
              .then((res3) => res3.json())
              .then((res3) => {
                const fed = res3.serverWeights;
                fed.unshift(res3.weight0);

                const local = res3.clientWeights;

                const odata = {
                  fed,
                  local,
                  point: res3.splitPoints,
                };

                setOverviewData(odata);
                setRangeMap([1, local.length]);
                setRange([1, local.length]);
                setExtent([1, local.length]);
              });
          });
      });
  }, []);

  useEffect(() => {
    updateName(names[index]);
  }, [index, names, updateName]);

  useEffect(() => {
    // if (index === -1) {
    //   return;
    // }
    // model.init({
    //   data: rawData.federated.weight,
    //   type: 'dense',
    // });
    // const fed = weightsData.weightsServer;
    // fed.unshift(weightsData.weight0);
    // const local = weightsData.weightsClient;
    // const timeEnd: number[] = rawData.time.map((d: number[]) => d[1]);
    // setOverviewData({ fed, local });
    // setLineChartData([rawData.federated.loss, rawData.others[index].loss]);
    // setName(rawData.others[index].clientName);
    // setTime(timeEnd);
    // const maxV = timeEnd.length;
    // setRange([1, maxV]);
    // setExtent([1, maxV]);
    // setRangeMap([0, maxV - 1]);
  }, []);

  return (
    <div id="LeftPanel" className="panel">
      <h2>Federated Learning Observation</h2>

      <div className="content">
        <div className="info-container">
          <h3>Information Panel</h3>

          <div>
            <p>Label: {info.labels} </p>
            <p>#Dimensions: {info.dimensions}</p>
            <p>#Clients: {info.numberOfClients} </p>
            <p>Current communication round: {info.communicationRounds}</p>
          </div>

          <div id="info-two">
            <div className="info-row">
              <span>Name of this client: </span>
              {/* {index === -1 ? ( */}
              <Dropdown items={names} setIndex={setIndex} index={index} />
              {/* ) : (
                <span>{names[index]}</span>
              )} */}
            </div>
            <p>Size: {info.trainingDataSize} records in the training set</p>
            <p className="next-line">{info.testDataSize} records in the test set</p>
          </div>
        </div>

        <div className="overview-wrapper">
          <div className="divider" />

          <h3>Model Updates Projection</h3>
          <div className="overview-content">
            <div className="info">
              <div className="row">
                <p>Communication round range:</p>
                {/* <div className="legend-wrapper">
                  <p>{range[0]}</p>
                  <p>{range[1]}</p>
                </div> */}
                <RangeSlider
                  minValue={range[0]}
                  maxValue={range[1]}
                  setRange={setRange}
                  extent={extent}
                  invoke={setRangeMap}
                />
              </div>

              <div className="row">
                <svg height="20px" viewBox="0 0 180 20">
                  <circle cx="4" cy="10" r="2" stroke="#000" fill="#fff" />
                  <text x="9" y="15">
                    Federated parameters
                  </text>
                </svg>
                <svg height="20px" viewBox="0 0 160 20">
                  <defs>
                    <marker
                      id="arrow-tip"
                      refX="6 "
                      refY="6"
                      viewBox="0 0 16 16"
                      markerWidth="8"
                      markerHeight="8"
                      markerUnits="userSpaceOnUse"
                      orient="auto"
                    >
                      <path d="M 0 0 12 6 0 12 3 6 Z" fill="var(--primary-color)" />
                    </marker>
                  </defs>
                  <line
                    x1="0"
                    y1="10"
                    x2="10"
                    y2="10"
                    stroke="var(--primary-color)"
                    markerEnd="url(#arrow-tip)"
                  />
                  <text x="20" y="15">
                    Local gradient
                  </text>
                </svg>
              </div>

              <div className="row">
                <p>Gradient similarity(Cosine)</p>
                <Gradient colors={GRADIENT} legends={['1', '-1']} />
              </div>
            </div>

            <Overview data={overviewData} range={rangeMap} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
