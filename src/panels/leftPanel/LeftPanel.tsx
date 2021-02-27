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
import { setRoundAction } from '../../store/reducers/basic';

const lineChartMargin = {
  r: 15,
  b: 50,
  l: 30,
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

// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

const GRADIENT = ['#fff', '#aa815d'];
const items = ['Client-Northeast', 'Client-Midwest', 'Client-South', 'Client-West'];

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

  const [roundRrange, setRoundRange] = useState<string[]>(['1', '2']);
  const round = useSelector((state: any) => state.basic.round);
  const setRound = useCallback((i: number) => dispatch(setRoundAction(i)), [dispatch]);

  useEffect(() => {
    // initialize();
  }, []);

  useEffect(() => {
    if (index === -1) {
      return;
    }

    model.init({
      data: rawData.federated.weight,
      type: 'dense',
    });

    const fed = model.getOutput();

    model.init({
      data: rawData.others[index].weight,
      type: 'dense',
    });
    const local = model.getOutput();

    const batchSize: number[] = rawData.time.map((d: number[]) => d.length);
    const timeEnd: number[] = rawData.time.map((d: number[]) => d[1]);

    setOverviewData({ fed, local, batchSize });
    setLineChartData([rawData.federated.loss, rawData.others[index].loss]);
    setName(rawData.others[index].clientName);
    setTime(timeEnd);

    const maxV = timeEnd.length;
    setRange([1, maxV]);
    setExtent([1, maxV]);
    setRangeMap([0, maxV - 1]);
  }, [index, rawData]);

  return (
    <div id="LeftPanel" className="panel">
      <h2>Federated Learning Observation</h2>

      <div className="content">
        <div className="info-container">
          <h3>Information Panel</h3>

          <div>
            <p>Label: xxx</p>
            <p>#Dimensions: xxx</p>
            <p>#Clients: xxx</p>
            <div className="info-row">
              <span>Current communication round: </span>
              {/* {index === -1 ? ( */}
              <Dropdown items={roundRrange} setIndex={setRoundRange} index={round} />
              {/* ) : (
                <span>round</span>
              )} */}
            </div>
          </div>

          <div id="info-two">
            <div className="info-row">
              <span>Name of this client: </span>
              {index === -1 ? (
                <Dropdown items={items} setIndex={setIndex} index={index} />
              ) : (
                <span>{items[index]}</span>
              )}
            </div>
            <p>Size: 123 records in the training set</p>
            <p>&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; 123 records in the test set</p>
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
