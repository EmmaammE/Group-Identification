import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import { ChartProps } from '../../types/chart';
import './style.scss';
import inputStyles from '../../styles/input.module.css';
import PairRect from '../../components/PairRect.tsx/PairRect';
import Gradient from '../../components/ui/Gradient';
import Dropdown from '../../components/ui/Dropdown';
import HeatmapWrapper from '../../components/heatmap/HeatmapWrapper';
import { StateType } from '../../types/data';
import { mmultiply, transpose } from '../../utils/mm';
import { getPCAResults, getSamplesAction, getLabelsAction } from '../../store/reducers/identify';

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
  const rawData = useSelector((state: any) => state.identify.heteroList);

  const [dataIndex, setDataIndex] = useState<number>(0);

  // cluster number 输入时的映射
  const [nOfCluster, setNOfCluster] = useState<number | ''>(5);
  const round = useSelector((state: StateType) => state.basic.round);

  const cpArray = useSelector((state: StateType) => [
    state.identify.pca.pc1,
    state.identify.pca.pc2,
  ]);
  const samples = useSelector((state: StateType) => state.identify.samples);

  const dispatch = useDispatch();
  const getSamples = useCallback((type) => dispatch(getSamplesAction(type)), [dispatch]);
  const getPCA = useCallback(() => dispatch(getPCAResults()), [dispatch]);
  const getLabels = useCallback((roundParam) => dispatch(getLabelsAction(roundParam)), [dispatch]);
  // const heteroList = useSelector((state: StateType) => state.identify.heteroList);

  const nOfConsistent = useSelector(
    (state: StateType) => state.identify.heteroLabels.filter((d) => d).length
  );
  const points = useMemo(() => {
    try {
      // console.log(cpArray)
      if (samples.length === 0 || cpArray[0].length === 0) {
        return [[]];
      }
      const cpT = transpose(cpArray); // 784*2

      // console.log(samples, cpT)
      return mmultiply(samples, cpT);
    } catch (err) {
      console.log(err);
    }

    return [[]];
  }, [cpArray, samples]);

  const x = d3.extent(points, (d) => d[0]) as any;
  const y = d3.extent(points, (d) => d[1]) as any;

  const loadData = useCallback(async () => {
    if (dataIndex !== -1 && round !== 0) {
      await getSamples(items[dataIndex]);
      await getPCA();
      await getLabels(round);
    }
  }, [dataIndex, getLabels, getPCA, getSamples, round]);

  useEffect(() => {
    loadData();
  }, [dataIndex, getLabels, getPCA, getSamples, loadData, round]);

  const onInputNumber = (e: any) => {
    const reg = new RegExp('^[1-9]*$');
    if (e.target.value.match(reg)) {
      // console.log(e.target.value)
      setNOfCluster(+e.target.value);
    } else {
      setNOfCluster('');
    }
  };

  return (
    <div id="MiddlePanel" className="panel">
      <h2>Model Output Comparison</h2>

      <div className="content">
        <div className="scatter-container">
          <h3>Output Comparison</h3>

          <div className="info-row">
            <p>Inputs: </p>
            <Dropdown items={items} index={dataIndex} setIndex={setDataIndex} />
          </div>
          <div className="scatter-legends">
            <span>Consistent records {nOfConsistent}</span>
            <span>Inconsistent records {samples.length - nOfConsistent}</span>
          </div>
          <Scatterplot chartConfig={chartProps} points={points} x={x} y={y} />
        </div>

        <div>
          <div className="divider" />

          <div className="info-container">
            <h3>Inconsistent Block Analysis</h3>
            <div className="row">
              <div className="input-wrapper">
                <p className="label">#Clusters:</p>
                <div className={inputStyles.wrapper}>
                  <input
                    className={inputStyles.input}
                    type="number"
                    min="1"
                    max="15"
                    step="1"
                    defaultValue={nOfCluster}
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
          <HeatmapWrapper points={points} x={x} y={y} nOfCluster={+nOfCluster} />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
