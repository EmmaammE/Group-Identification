/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import { ChartProps } from '../../types/chart';
import './style.scss';
import inputStyles from '../../styles/input.module.css';
import Dropdown from '../../components/ui/Dropdown';
import HeatmapWrapper from '../../components/heatmap/HeatmapWrapper';
import { StateType } from '../../types/data';
import { mmultiply, transpose } from '../../utils/mm';
import {
  getCPCAResults,
  getSamplesAction,
  getLabelsAction,
  setLevelAction,
  getAllCPCA,
  onTypeUpdateOrInitAction,
  defaultCount,
  setChosePointAction,
  onRoundAction,
  getHeteList,
} from '../../store/reducers/identify';
import useFetch from '../../utils/useFetch';
import HTTP_LEVEL from '../../utils/level';
import ICON from '../../assets/convex.svg';
import { getType, setType } from '../../utils/getType';
import REFRESH from '../../assets/refresh.svg';
import http from '../../utils/http';

const chartProps: ChartProps = {
  width: 400,
  height: 400,
  // margin: { t: 25, r: 25, b: 25, l: 25 },
  // margin: { t: 10, r: 10, b: 10, l: 10 },
  margin: { t: 0, r: 0, b: 0, l: 0 },
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

const items = ['local', 'stratified', 'systematic'];
const defaultCPACA = 5;

function MiddlePanel() {
  const [dataIndex, setDataIndex] = useState<number>(0);
  // const [param, setParam] = useState<number | null>(null);
  const param = useSelector((state: StateType) => state.identify.pca.alpha);

  // cluster number 输入时的映射
  const [nOfCluster, setNOfCluster] = useState<number | null>(defaultCount);
  const round = useSelector((state: StateType) => state.basic.round);

  const cpArray = useSelector((state: StateType) => [
    state.identify.pca.cpc1,
    state.identify.pca.cpc2,
  ]);
  // all cpca
  // const [cpArray, setCpArray] = useState<number[][]>([[], []]);

  const samples = useSelector((state: StateType) =>
    getType() === 'local' ? state.identify.localData : state.identify.samples
  );

  const dispatch = useDispatch();
  const clusterFromRes = useSelector((state: StateType) => state.identify.heteroList.nrOfClusters);
  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  const getCPCA = useCallback((alpha: number | null) => dispatch(getAllCPCA(alpha)), [dispatch]);
  const getLists = useCallback((count: number | null) => dispatch(getHeteList(count)), [dispatch]);

  const onTypeUpdateOrInit = useCallback(
    (type: string, r: number, alpha: number | null, count: number | null) =>
      dispatch(onTypeUpdateOrInitAction(type, r, alpha, count)),
    [dispatch]
  );

  const onRoundChange = useCallback(
    (r: number, alpha: number | null, count: number | null) =>
      dispatch(onRoundAction(r, alpha, count)),
    [dispatch]
  );

  const $inputCount = useRef(null);

  useEffect(() => {
    setNOfCluster(clusterFromRes);
    ($inputCount as any).current.value = clusterFromRes;
  }, [clusterFromRes]);

  const nOfConsistent = useSelector(
    (state: StateType) => state.identify.heteroLabels.filter((d) => d).length
  );
  const level = useSelector((state: StateType) => state.identify.level);

  // // 当选择local时，从store的local加载数据。否则从samplesData加载数据
  // const [data, setRequest]: any = useFetch('');

  const [topStatus, setTopStatus] = useState<number>(1);

  // alpha变化
  const handleParamChange = useCallback(
    (e: any) => {
      setLevel(HTTP_LEVEL.pca);
      getCPCA(+e.target.value);
    },
    [getCPCA, setLevel]
  );

  const freshParam = useCallback(() => {
    getCPCA(null);
  }, [getCPCA]);

  // useEffect(() => {
  //   if (param === null) {
  //     setParam(paramFromRes);
  //   }
  // }, [param, paramFromRes]);

  const points = useMemo(() => {
    try {
      // console.log(cpArray)
      if (cpArray[0].length !== 0) {
        const cpT = transpose(cpArray); // 784*2

        if (samples.length !== 0) {
          // console.log(data)
          return mmultiply(samples, cpT);
        }
      }
      return [[]];
      // console.log(samples, cpT)
    } catch (err) {
      console.log(err);
    }

    return [[]];
  }, [cpArray, samples]);

  const x = d3.extent(points, (d) => d[0]) as any;
  const y = d3.extent(points, (d) => d[1]) as any;

  // const onAlphaChange = useCallback(async () => {
  // const res = await http('/fl-hetero/cpca/all/', {alpha: param});
  // setCpArray([res.cpc1, res.cpc2]);

  // setParam(res.alpha);
  // }, [param])

  // const onTypeChange = useCallback(async () => {
  //   // 当请求数据变化
  //   await getSamples(items[dataIndex]);
  //   await getLabels(round);
  //   onAlphaChange();
  // }, [dataIndex, getLabels, getSamples, onAlphaChange, round])

  // const onRoundChange = useCallback(async (r) => {
  //   await getLabels(r);
  //   onAlphaChange();
  // }, [getLabels, onAlphaChange])

  // useEffect(() => {
  //   if(HTTP_LEVEL.labels === level) {
  //     getLabels(round);
  //   }
  // }, [round, getLabels, level])

  const handleDropDown = useCallback(
    (e: any) => {
      // setLevel(HTTP_LEVEL.sampling);
      setDataIndex(e);
      setType(items[e]);
      onTypeUpdateOrInit(items[e], round, null, null);
    },
    [onTypeUpdateOrInit, round]
  );

  useEffect(() => {
    setType(items[dataIndex]);
  }, []);

  useEffect(() => {
    if (level === HTTP_LEVEL.labels) {
      onRoundChange(round, param, nOfCluster);
    }
  }, [round, level, onRoundChange, param, nOfCluster]);

  const onInputNumber = (e: any) => {
    const reg = new RegExp('^[0-9]*$');

    if (e.target.value.match(reg)) {
      setNOfCluster(+e.target.value);
      setLevel(HTTP_LEVEL.cpca);
      getLists(+e.target.value);
    } else {
      setNOfCluster(null);
    }
  };

  const freshCount = useCallback(() => {
    getLists(null);
    setLevel(HTTP_LEVEL.cpca);
  }, [getLists, setLevel]);

  const $inputAlpha = useRef(null);
  useEffect(() => {
    ($inputAlpha as any).current.value = param?.toFixed(2);
  }, [param]);

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Model Output Comparison</h2>

      <div className="content">
        <div className="scatter-container">
          <h3>Output Comparison</h3>

          <div className="row">
            <div className="info-row">
              <p>Inputs: </p>
              <Dropdown items={items} index={dataIndex} setIndex={handleDropDown} />
            </div>

            <div className="row">
              <p className="label">Contrastive parameter: </p>
              <div className={inputStyles.wrapper}>
                <input
                  className={inputStyles.input}
                  type="text"
                  defaultValue={param?.toFixed(2) || ''}
                  onBlur={handleParamChange}
                  ref={$inputAlpha}
                />
                <span className={inputStyles.icon} onClick={freshParam}>
                  <img src={REFRESH} alt="refresh" />
                </span>
              </div>
            </div>
          </div>
          <div className="scatter-legends">
            <div>
              <span className="legend" onClick={() => setTopStatus(1)} />
              <span>Inconsistent records: {samples.length - nOfConsistent}</span>
              {topStatus === 1 && <span>-shown on the top</span>}
            </div>
            <div>
              <span className="legend" onClick={() => setTopStatus(0)} />
              <span>Consistent records: {nOfConsistent}</span>
              {topStatus === 0 && <span>-shown on the top</span>}
            </div>
          </div>
          <Scatterplot chartConfig={chartProps} points={points} x={x} y={y} onTop={topStatus} />
        </div>

        <div>
          <div className="info-container">
            <h3>Inconsistent Cluster Analysis</h3>
            <div className="row">
              <div className="input-wrapper">
                <p className="label">#Clusters:</p>
                <div className={inputStyles.wrapper} style={{ maxWidth: '25px' }}>
                  <input
                    className={inputStyles.input}
                    type="text"
                    defaultValue={nOfCluster || ''}
                    onBlur={onInputNumber}
                    ref={$inputCount}
                  />
                  <span className={inputStyles.icon} onClick={freshCount}>
                    <img src={REFRESH} alt="refresh" />
                  </span>
                </div>
              </div>

              <div className="convex-legend">
                <img src={ICON} alt="convex" />
                <span>Convex</span>
              </div>

              <div className="input-wrapper">
                <span>Density:</span>
                <div className="legend-wrapper">
                  <p>0</p>
                  <svg width="80" viewBox="0 0 80 15">
                    <defs>
                      <linearGradient id="#fff#000" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="20%" stopColor="#ccc" />
                        <stop offset="100%" stopColor="#666" />
                      </linearGradient>
                    </defs>
                    <rect x="0%" y="0" width="100%" height="100%" fill="url(##fff#000)" />
                  </svg>
                  <p>1</p>
                </div>
              </div>
            </div>
          </div>
          <HeatmapWrapper points={points} x={x} y={y} nOfCluster={nOfCluster} />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
