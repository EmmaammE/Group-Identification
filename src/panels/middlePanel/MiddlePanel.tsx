/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import { ChartProps } from '../../types/chart';
import './style.scss';
import inputStyles from '../../styles/input.module.css';
import Dropdown from '../../components/ui/Dropdown';
import HeatmapWrapper from '../../components/heatmap/HeatmapWrapper';
import { StateType } from '../../types/data';
import {
  setLevelAction,
  onTypeUpdateOrInitAction,
  defaultCount,
  onRoundAction,
  onListAction,
  onAllAlphaAction,
  instance,
} from '../../store/reducers/service';
import HTTP_LEVEL from '../../utils/level';
import ICON from '../../assets/convex.svg';
import { getType, setType } from '../../utils/getType';
import REFRESH from '../../assets/refresh.svg';
import http from '../../utils/http';
import { setIndexAction } from '../../store/reducers/blockIndex';

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

function MiddlePanel() {
  const [dataTypeIndex, setDataIndex] = useState<number>(0);
  // const [param, setParam] = useState<number | null>(null);
  const allCpcaAlpha = useSelector((state: StateType) => state.service.allCPCA.alpha);

  // cluster number 输入时的映射
  // const [nOfCluster, setNOfCluster] = useState<number | null>(defaultCount);
  const round = useSelector((state: StateType) => state.basic.round);
  const blockIndex = useSelector((state: StateType) => state.blockIndex);

  const samples = useSelector((state: StateType) => state.service.samples);
  const heteroList = useSelector((state: StateType) => state.service.heteroList.clusterList);

  const dispatch = useDispatch();
  const clusterFromRes = useSelector((state: StateType) => state.service.heteroList.nrOfClusters);
  const setLevel = useCallback((level: number) => dispatch(setLevelAction(level)), [dispatch]);
  const getAllCPCA = useCallback(
    (alpha: number | null, count: number | null, blockId: number, cpcaAlphaP) =>
      dispatch(onAllAlphaAction(alpha, count, blockId, cpcaAlphaP)),
    [dispatch]
  );
  const getLists = useCallback(
    (count: number | null, blockId: number, cpcaAlphaP) =>
      dispatch(onListAction(count, blockId, cpcaAlphaP)),
    [dispatch]
  );
  const updateBlock = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const blockCpcaAlpha = useSelector((state: StateType) => state.service.cpca.alpha);
  const onTypeUpdateOrInit = useCallback(
    (
      type: string,
      r: number,
      alpha: number | null,
      count: number | null,
      blockId: number | null,
      cpcaAlphaP: number | null
    ) => dispatch(onTypeUpdateOrInitAction(type, r, alpha, count, blockId, cpcaAlphaP)),
    [dispatch]
  );

  const onRoundChange = useCallback(
    (
      r: number,
      alpha: number | null,
      count: number | null,
      blockId: number | null,
      cpcaAlphaP: number | null
    ) => dispatch(onRoundAction(r, alpha, count, blockId, cpcaAlphaP)),
    [dispatch]
  );

  const $inputCount = useRef(null);

  useEffect(() => {
    ($inputCount as any).current.value = clusterFromRes;
  }, [clusterFromRes]);

  const nOfConsistent = useSelector((state: StateType) =>
    dataTypeIndex === 0
      ? state.service.heteroLabels.filter((d) => d).length
      : state.service.samplesHeteroLabels.filter((d) => d).length
  );
  const level = useSelector((state: StateType) => state.service.level);

  const [topStatus, setTopStatus] = useState<number>(1);

  // alpha变化
  const handleParamChange = useCallback(
    (e: any) => {
      // setLevel(HTTP_LEVEL.pca);
      const value = +e.target.value;
      if (allCpcaAlpha !== value) {
        getAllCPCA(value, clusterFromRes, value, allCpcaAlpha);
      }
    },
    [allCpcaAlpha, getAllCPCA, clusterFromRes]
  );

  const freshParam = useCallback(() => {
    // console.log('result')
    getAllCPCA(null, clusterFromRes, blockIndex, allCpcaAlpha);
  }, [getAllCPCA, clusterFromRes, blockIndex, allCpcaAlpha]);

  const x = d3.extent(samples, (d) => d[0]) as any;
  const y = d3.extent(samples, (d) => d[1]) as any;

  const handleDropDown = useCallback(
    (e: any) => {
      // setLevel(HTTP_LEVEL.sampling);
      setDataIndex(e);
      setType(items[e]);

      onTypeUpdateOrInit(items[e], round, allCpcaAlpha, clusterFromRes, null, blockCpcaAlpha);
    },
    [allCpcaAlpha, blockCpcaAlpha, clusterFromRes, onTypeUpdateOrInit, round]
  );

  useEffect(() => {
    setType(items[dataTypeIndex]);
  }, []);

  useEffect(() => {
    if (level === HTTP_LEVEL.labels) {
      onRoundChange(round, allCpcaAlpha, clusterFromRes, blockIndex, blockCpcaAlpha);
    }
  }, [
    round,
    level,
    onRoundChange,
    allCpcaAlpha,
    clusterFromRes,
    blockIndex,
    blockCpcaAlpha,
    heteroList,
  ]);

  const onInputNumber = (e: any) => {
    const reg = new RegExp('^[0-9]*$');
    const { value } = e.target;

    if (value.match(reg)) {
      // setNOfCluster(+value);
      setLevel(HTTP_LEVEL.cpca);
      if (+value !== clusterFromRes) {
        if (blockIndex === -1) {
          getLists(+value, 0, blockCpcaAlpha);
          updateBlock(0);
        } else {
          getLists(+value, blockIndex, blockCpcaAlpha);
        }
      }
    } else {
      // setNOfCluster(null);
      ($inputCount as any).current.value = '';
    }
  };

  const freshCount = useCallback(() => {
    getLists(null, blockIndex, blockCpcaAlpha);
    setLevel(HTTP_LEVEL.cpca);
  }, [blockCpcaAlpha, blockIndex, getLists, setLevel]);

  const $inputAlpha = useRef(null);
  useEffect(() => {
    ($inputAlpha as any).current.value = allCpcaAlpha?.toFixed(2);
  }, [allCpcaAlpha]);

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Model Output Comparison</h2>

      <div className="content">
        <div className="scatter-container">
          <h3>Output Comparison</h3>

          <div className="row">
            <div className="info-row">
              <p>Inputs: </p>
              <Dropdown items={items} index={dataTypeIndex} setIndex={handleDropDown} />
            </div>

            <div className="row">
              <p className="label">Contrastive parameter: </p>
              <div className={inputStyles.wrapper}>
                <input
                  className={inputStyles.input}
                  type="text"
                  defaultValue={allCpcaAlpha?.toFixed(2) || ''}
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
          <Scatterplot chartConfig={chartProps} points={samples} x={x} y={y} onTop={topStatus} />
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
                    defaultValue={clusterFromRes}
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
          <HeatmapWrapper points={samples} x={x} y={y} nOfCluster={clusterFromRes} />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
