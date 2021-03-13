import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import Overview, { OverviewData } from '../../components/overview/Overview';
import './style.scss';
import Gradient from '../../components/ui/Gradient';
import RangeSlider from '../../components/ui/RangeSlider';
import Dropdown from '../../components/ui/Dropdown';
import {
  initBasicData,
  setLabelNamesAction,
  setNameAction,
  setRoundAction,
} from '../../store/reducers/basic';
import { StateType } from '../../types/data';
import {
  getSamplesAction,
  initIdentityAction,
  setLevelAction,
  onTypeUpdateOrInitAction,
} from '../../store/reducers/identify';
import HTTP_LEVEL from '../../utils/level';
import { getType, setDatasetInfo } from '../../utils/getType';

const fakeData = {
  // 联邦模型矢量
  server: [],
  local: [],
  cosines: [],
  weight0: [],
};

interface Info {
  // 拼接成字符串
  labels: string;
  dimensions: number | '' | string;
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

// inputData is a nested array which can be converted into an ndarray
// alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')

const GRADIENT = ['#fff', '#aa815d'];
const datasetNameHash: any = {
  mnist: 'MNIST',
  face: 'Face Mask',
};

function LeftPanel() {
  // TODO 修改local数据集
  const [index, setIndex] = useState(-1);

  // overview显示的范围（数组下标)
  const [range, setRange] = useState<number[]>([0, 9]);

  const dispatch = useDispatch();
  const updateName = useCallback((n) => dispatch(setNameAction(n)), [dispatch]);
  // const [round, setRound] = useState<number>(121);
  // weights接口的数据
  const [rawWeights, setRawWeights] = useState<any>(null);
  const round = useSelector((state: StateType) => state.basic.round);

  // client Names
  const [names, setClientNames] = useState<string[]>([]);
  // datasetNames
  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetIndex, setDatasetIndex] = useState<number>(-1);

  const [info, setInfo] = useState<Info>(initInfo);

  const initBasic = useCallback(() => dispatch(initBasicData()), [dispatch]);
  const initIdentity = useCallback(() => dispatch(initIdentityAction()), [dispatch]);

  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  const level = useSelector((state: StateType) => state.identify.level);
  const setRound = useCallback((i) => dispatch(setRoundAction(i)), [dispatch]);
  const onTypeUpdateOrInit = useCallback(
    (type: string, r: number, alpha: number | null, count: number | null) =>
      dispatch(onTypeUpdateOrInitAction(type, r, alpha, count)),
    [dispatch]
  );
  const setLabelNames = useCallback((n: string[]) => dispatch(setLabelNamesAction(n)), [dispatch]);

  // 修改client
  const onDropdownChange = (i: any) => {
    setIndex(i);
    // console.log('test')
    if (index !== -1) {
      initBasic();
      initIdentity();
      setRound(0);
      setLevel(HTTP_LEVEL.client);
    }
  };

  const onDatasetChange = (i: any) => {
    setDatasetIndex(i);

    fetch('/fl-hetero/datasets/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetName: datasets[i],
        // datasetName: datasetNames,
      }),
    })
      .then((res2) => res2.json())
      .then((res2) => {
        const {
          clientNames,
          communicationRounds,
          dimensions,
          labelDescription: labels,
          labelNames,
          numberOfClients,
          testDataSize,
          trainingDataSize,
          type,
        } = res2;

        setClientNames(clientNames);

        setInfo({
          labels,
          communicationRounds,
          dimensions: dimensions.join('x'),
          numberOfClients,
          testDataSize,
          trainingDataSize,
        });

        setDatasetInfo(
          type,
          dimensions.slice(-2).reduce((acc: number, cur: number) => acc * cur, 1)
        );

        setLabelNames(labelNames);
        // setLevel(HTTP_LEVEL.datasets+1);
      });
  };
  useEffect(() => {
    fetch('/fl-hetero/datasets/')
      .then((res) => res.json())
      .then((res) => {
        // console.log(res);
        // 当前只有一个数据集
        const { datasetNames } = res;
        setDatasets(datasetNames);
      });
  }, []);

  useEffect(() => {
    console.log(level);
    if (index !== -1 && level === HTTP_LEVEL.weights) {
      fetch('/fl-hetero/weights/')
        .then((res) => res.json())
        .then((res) => {
          setRawWeights(res);
          setRange([0, res.serverWeights.length - 1]);
          setRound(res.serverWeights.length);
          setLevel(HTTP_LEVEL.sampling);
        });
    }
  }, [index, level, setLevel, setRound]);

  useEffect(() => {
    if (HTTP_LEVEL.sampling === level && round !== -1) {
      console.log('init');
      if (rawWeights) {
        setRound(rawWeights.serverWeights.length);
      }
      onTypeUpdateOrInit(getType(), round, null, null);
    }
  }, [level, onTypeUpdateOrInit, rawWeights, round, setRound]);

  useEffect(() => {
    if (names[index]) {
      updateName(names[index]);
    }
  }, [index, initBasic, initIdentity, names, setRound, updateName]);

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

  const cosineExtent = useMemo(() => {
    if (rawWeights) {
      const extent: any = d3.extent(rawWeights.cosines);

      if (extent) {
        return [
          (Math.floor(extent[0] * 100) / 100).toFixed(2),
          (Math.ceil(extent[1] * 100) / 100).toFixed(2),
        ];
      }
      // return extent
    }
    return [-1, 1];
  }, [rawWeights]);

  return (
    <div id="LeftPanel" className="panel">
      <h2>Federated Learning Observation</h2>

      <div className="content">
        <div className="info-container">
          <h3>Model Information</h3>
          {/* <p className='title'>Model Information Panel</p> */}
          <div>
            <div className="info-row">
              <span>Name of dataset: </span>
              <Dropdown
                items={datasets.map((d: string) => datasetNameHash[d])}
                setIndex={onDatasetChange}
                index={datasetIndex}
              />
            </div>
            <p>Label: {info.labels} </p>
            <p>#Dimensions: {info.dimensions}</p>
            <p>#Clients: {info.numberOfClients} </p>
            <p>Current communication round: {info.communicationRounds}</p>
          </div>

          <div id="info-two">
            {/* <p className='title'>Local Information Panel</p> */}
            <h3>Local Information</h3>

            <div className="info-row">
              <span>Name of this client: </span>
              <Dropdown items={names} setIndex={onDropdownChange} index={index} />
            </div>
            <p>Size of the local data: </p>
            <p>{info.trainingDataSize} records in the training set</p>
            <p>{info.testDataSize} records in the test set</p>
          </div>
        </div>

        <div className="overview-wrapper">
          <div className="dashed-divider" />

          <h3>Parameter Projection</h3>
          <div className="overview-content">
            <div className="info">
              {/* <div className="row"> */}
              <p>Communication round range:</p>
              <RangeSlider
                range={range}
                setRange={setRange}
                extent={rawWeights !== null ? rawWeights.serverWeights.length : range[1] + 1}
              />
              {/* </div> */}

              <div>
                <svg height="20px" viewBox="0 0 300 20">
                  <circle cx="8" cy="10" r="2" stroke="#000" fill="#fff" />
                  <text x="20" y="15">
                    Selected communication round
                  </text>
                </svg>
              </div>
              <div>
                <svg height="20px" viewBox="0 0 200 20">
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
                    Local parameter updates
                  </text>
                </svg>
              </div>

              <div className="row">
                {/* <p>Update disagreement (Cosine) :</p> */}
                <p>Disagreement (Cosine) :</p>
                <div className="cosine-legend">
                  <Gradient
                    colors={GRADIENT}
                    legends={[`${cosineExtent[0]}`, `${cosineExtent[1]}`]}
                    width="90px"
                  />
                </div>
              </div>
            </div>

            <Overview
              data={overviewData}
              flag={range[0] === 0}
              round={round - range[0]}
              colorExtent={cosineExtent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
