/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getPCAResults, getSamplesAction, getLabelsAction } from '../../store/reducers/identify';
import useFetch from '../../utils/useFetch';
import HTTP_LEVEL from '../../utils/level';

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
  const [dataIndex, setDataIndex] = useState<number>(0);
  const [param, setParam] = useState<number | null>(null);

  // cluster number 输入时的映射
  const [nOfCluster, setNOfCluster] = useState<number | null>(null);
  const round = useSelector((state: StateType) => state.basic.round);

  // const cpArray = useSelector((state: StateType) => [
  //   state.identify.pca.cpc1,
  //   state.identify.pca.cpc2,
  // ]);
  // all cpca
  const [cpArray, setCpArray] = useState<number[][]>([[], []]);

  const samples = useSelector((state: StateType) => state.identify.samples);

  const dispatch = useDispatch();
  const getSamples = useCallback((type) => dispatch(getSamplesAction(type)), [dispatch]);
  // const getPCA = useCallback((alpha) => dispatch(getPCAResults(alpha)), [dispatch]);
  const getLabels = useCallback((roundParam) => dispatch(getLabelsAction(roundParam)), [dispatch]);
  // const heteroList = useSelector((state: StateType) => state.identify.heteroList);
  // const loading = useSelector((state: StateType) => state.identify.loading);
  // const paramFromRes = useSelector((state: StateType) => state.identify.pca.alpha);
  const clusterFromRes = useSelector((state: StateType) => state.identify.heteroList.nrOfClusters);

  useEffect(() => {
    setNOfCluster(clusterFromRes);
  }, [clusterFromRes]);

  const nOfConsistent = useSelector(
    (state: StateType) => state.identify.heteroLabels.filter((d) => d).length
  );
  const level = useSelector((state: StateType) => state.identify.level);

  // 当选择local时，从store的local加载数据。否则从samplesData加载数据
  const [data, setRequest]: any = useFetch('');

  const [topStatus, setTopStatus] = useState<number>(1);

  const handleParamChange = useCallback(
    (e: any) => {
      setParam(+e.target.value);
    },
    [setParam]
  );

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
        if (dataIndex === 0 && samples.length !== 0) {
          return mmultiply(samples, cpT);
        }
        if (data.length !== 0) {
          // console.log(data)
          return mmultiply(data, cpT);
        }
      }
      return [[]];
      // console.log(samples, cpT)
    } catch (err) {
      console.log(err);
    }

    return [[]];
  }, [cpArray, dataIndex, samples, data]);

  const x = d3.extent(points, (d) => d[0]) as any;
  const y = d3.extent(points, (d) => d[1]) as any;

  const loadData = useCallback(async () => {
    if (dataIndex !== -1 && round !== 0) {
      // 如果是初次请求，加载samples。
      if (level === HTTP_LEVEL.sampling) {
        if (dataIndex === 0) {
          if (samples.length === 0) {
            // console.log('load samples')
            await getSamples(items[dataIndex]);
          }
        } else {
          setRequest(items[dataIndex]);
        }
      }
      if (level === HTTP_LEVEL.pca) {
        await getLabels(round);

        try {
          const res = await fetch('/fl-hetero/cpca/all/', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: param
              ? JSON.stringify({
                  alpha: param,
                })
              : JSON.stringify({}),
          });
          const resp = await res.json();

          setCpArray([resp.cpc1, resp.cpc2]);

          setParam(resp.alpha);
        } catch (err) {
          console.log(err);
        }
      }
    }
  }, [dataIndex, getLabels, getSamples, level, param, round, samples.length, setRequest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onInputNumber = (e: any) => {
    const reg = new RegExp('^[0-9]*$');

    if (e.target.value.match(reg)) {
      setNOfCluster(+e.target.value);
    } else {
      setNOfCluster(null);
    }
  };

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Model Output Comparison</h2>

      <div className="content">
        <div className="scatter-container">
          <h3>Output Comparison</h3>

          <div className="row">
            <div className="info-row">
              <p>Inputs: </p>
              <Dropdown items={items} index={dataIndex} setIndex={setDataIndex} />
            </div>

            <div className="row">
              <p className="label">Contrastive parameter: </p>
              <div className={inputStyles.wrapper}>
                <input
                  className={inputStyles.input}
                  type="number"
                  min="0.01"
                  max="100"
                  step="1"
                  defaultValue={param?.toFixed(2) || ''}
                  onBlur={handleParamChange}
                  // readOnly
                />
              </div>
            </div>
          </div>
          <div className="scatter-legends">
            <div>
              <span className="legend" onClick={() => setTopStatus(0)} />
              <span>Consistent records: {nOfConsistent}</span>
              {topStatus === 0 && <span>-on the top</span>}
            </div>
            <div>
              <span className="legend" onClick={() => setTopStatus(1)} />
              <span>Inconsistent records: {samples.length - nOfConsistent}</span>
              {topStatus === 1 && <span>-on the top</span>}
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
                <div className={inputStyles.wrapper}>
                  <input
                    className={inputStyles.input}
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={nOfCluster || ''}
                    onInput={onInputNumber}
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <span>Density:</span>
                <div className="legend-wrapper">
                  <p>0</p>
                  <svg width="100" viewBox="0 0 80 15">
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

            {/* <div className="row">
              <p>Convex</p> */}

            {/* <span>Weights:</span>
              <Gradient width="100" colors={['#95c72c', '#fff', '#f8bb3e']} legends={['-1', '1']} /> */}
            {/* </div> */}
          </div>
          <HeatmapWrapper points={points} x={x} y={y} nOfCluster={nOfCluster} />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
