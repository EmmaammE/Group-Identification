import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Overview, { OverviewData } from '../../components/overview/Overview';
import './style.scss';
import Gradient from '../../components/ui/Gradient';
import RangeSlider from '../../components/ui/RangeSlider';
import Dropdown from '../../components/ui/Dropdown';
import { setNameAction } from '../../store/reducers/basic';
import { StateType } from '../../types/data';

const fakeData = {
  // 联邦模型矢量
  server: [
    // [0.1, 0.1],
    // [0.3, 0.2],
    // [0.9, 1.2],
  ],
  local: [
    // [0.1, 0.3],
    // [-0.9, 0.1],
    // [0.7, 1.2],
  ],
  cosines: [],
  weight0: [],
};

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

// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

const GRADIENT = ['#fff', '#aa815d'];

function LeftPanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(-1);

  // overview显示的范围（数组下标)
  const [range, setRange] = useState<number[]>([0, 10]);

  const dispatch = useDispatch();
  const updateName = useCallback((n) => dispatch(setNameAction(n)), [dispatch]);
  // const [round, setRound] = useState<number>(121);
  // weights接口的数据
  const [rawWeights, setRawWeights] = useState<any>(null);
  const round = useSelector((state: StateType) => state.basic.round);

  // client Names
  const [names, setClientNames] = useState<string[]>([]);
  const [info, setInfo] = useState<Info>(initInfo);
  useEffect(() => {
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
              labels,
              communicationRounds,
              dimensions,
              numberOfClients,
              testDataSize,
              trainingDataSize,
            });

            fetch('/fl-hetero/weights/')
              .then((res3) => res3.json())
              .then((res3) => {
                // const server = res3.serverWeights;
                // const local = res3.clientWeights;

                // const odata = {
                //   server,
                //   local,
                //   cosines: res3.cosines,
                //   weight0: res3.weight0,
                // };

                // setOverviewData(odata);
                // setRangeMap([1, local.length]);
                // setRange([1, local.length]);
                // setExtent([1, local.length]);
                setRawWeights(res3);
                setRange([0, res3.serverWeights.length - 1]);
              });
          });
      });
  }, []);

  useEffect(() => {
    updateName(names[index]);
  }, [index, names, updateName]);

  const overviewData: OverviewData = useMemo(() => {
    if (rawWeights === null) {
      return fakeData;
    }
    const { serverWeights, clientWeights, cosines, weight0 } = rawWeights;
    return {
      server: serverWeights.filter((d: any, i: number) => i >= range[0] && i <= range[1]),
      local: clientWeights.filter((d: any, i: number) => i >= range[0] && i <= range[1]),
      cosines: cosines.filter((d: any, i: number) => i >= range[0] && i <= range[1]),
      weight0: range[0] === 0 ? weight0 : serverWeights[range[0] - 1],
    };
  }, [range, rawWeights]);

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
          <div className="dashed-divider" />

          <h3>Parameter Projection</h3>
          <div className="overview-content">
            <div className="info">
              <div className="row">
                <p>Communication round range:</p>
                <RangeSlider
                  range={range}
                  setRange={setRange}
                  extent={rawWeights !== null ? rawWeights.serverWeights.length : 10}
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
                    Local parameter
                  </text>
                </svg>
              </div>

              <div className="row">
                <p>Disagreement (Cosine) </p>
                <Gradient colors={GRADIENT} legends={['1', '-1']} width="90px" />
              </div>
            </div>

            <Overview data={overviewData} flag={range[0] === 0} round={round - range[0]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
