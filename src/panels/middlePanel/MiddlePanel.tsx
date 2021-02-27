import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import { ChartProps } from '../../types/chart';
import './style.scss';
import inputStyles from '../../styles/input.module.css';
import PairRect from '../../components/PairRect.tsx/PairRect';
import Gradient from '../../components/ui/Gradient';
import Dropdown from '../../components/ui/Dropdown';
import HeatmapWrapper from '../../components/heatmap/HeatmapWrapper';

const chartProps: ChartProps = {
  width: 400,
  height: 400,
  // margin: { t: 25, r: 25, b: 25, l: 25 },
  margin: { t: 10, r: 10, b: 10, l: 10 },
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

function MiddlePanel() {
  const rawData = useSelector((state: any) => state.identify.heteroList);

  const [index, setIndex] = useState<number>(0);

  const [dataIndex, setDataIndex] = useState<number>(0);

  // cluster number 输入时的映射
  const [nOfCluster, setNOfCluster] = useState<number | ''>(2);

  useEffect(() => {
    // fetch('/fl-hetero/identify/', {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     round:20 //communication round
    //     client: 'Client-Midwest',
    //     nrOfClusters: 1, //聚类数量
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((res) => {
    //     setRawData(res.heteroList.sort((a: any, b: any) => b.heteroSize - a.heteroSize));
    //     // 不一致的数据
    //     const tmpData0: DataItem[] = [];
    //     // 异构标签一致的数据
    //     const tmpData1: DataItem[] = [];
    //     const pcaResults = res.pca.projectedData;
    //     const labels = res.heteroLabels;
    //     res.heteroLabels.forEach((hLabel: boolean, i: number) => {
    //       if (hLabel) {
    //         tmpData1.push({
    //           PC1: pcaResults[i][0],
    //           PC2: pcaResults[i][1],
    //           id: i,
    //           label: labels[i],
    //         });
    //       } else {
    //         tmpData0.push({
    //           PC1: pcaResults[i][0],
    //           PC2: pcaResults[i][1],
    //           id: i,
    //           label: labels[i],
    //         });
    //       }
    //     });
    //     setData(tmpData1.concat(tmpData0));
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
  }, []);

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
            <Dropdown items={['Local data/Samples']} index={dataIndex} setIndex={setDataIndex} />
          </div>
          <div className="scatter-legends">
            <span>Consistent records</span>
            <span>Inconsistent records</span>
          </div>
          <Scatterplot
            chartConfig={chartProps}
            // data={data}
            render={1}
            oIndex={0}
            dimensions={['PC1', 'PC2']}
            extents={[]}
          />
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

          {/* <div className="pair-rect-wrapper">
            {rawData !== null &&
              rawData.map((d: any, i: number) => (
                <div key={i}>
                  <div className="dashed-divider" />
                  <PairRect
                    data={[d.cpca.cpc1, d.cpca.cpc2]}
                    names={['cPC1', 'cPC2']}
                    index={i}
                    size={d.heteroSize}
                    handleClick={() => setIndex(i)}
                    heteroIndex={d.heteroIndex}
                    rate={d.heteroRate}
                  />
                </div>
              ))}
          </div> */}
          <HeatmapWrapper />
        </div>
      </div>
    </div>
  );
}

export default MiddlePanel;
