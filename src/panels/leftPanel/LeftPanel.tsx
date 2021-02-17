import React, { useCallback, useEffect, useState } from 'react';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import Button from '../../components/ui/Button';
import { ChartProps } from '../../types/chart';
import Worker from '../../worker';
import './leftPanel.scss';
import inputStyles from '../../styles/input.module.css';
import Lineplot from '../../components/line/Lineplot';
import PairRect from '../../components/PairRect.tsx/PairRect';
import GridRect from '../../components/PairRect.tsx/GridRect';
import { DataItem } from '../../types/data';
import Gradient from '../../components/ui/Gradient';
import Heatmap from '../../components/heatmap/Heatmap';
import Dropdown from '../../components/ui/Dropdown';

const instance = new Worker();

const chartProps: ChartProps = {
  width: 400,
  height: 400,
  margin: { t: 25, r: 25, b: 25, l: 25 },
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

const lineChartProps: ChartProps = {
  width: 390,
  height: 150,
  margin: { t: 20, r: 10, b: 20, l: 30 },
  yaxis: {
    title: '数量',
    color: 'rgba(174, 174, 174, 1)',
    grid: false,
  },
  xaxis: {
    title: '个体到团体中心距离',
    color: 'rgba(174, 174, 174, 1)',
    grid: false,
  },
};

interface LeftPanelProps {
  setCp: Function;
  setGridData: Function;
}
function LeftPanel({ setCp, setGridData }: LeftPanelProps) {
  const [data, setData] = useState<any>(null);
  const [rawData, setRawData] = useState<any>(null);

  const [status, setStatus] = useState<boolean>(true);
  const [index, setIndex] = useState<number>(0);

  const [dataIndex, setDataIndex] = useState<number>(0);

  const handleClick = async () => {
    // console.log(result)
    const dataFromWorker = await instance.processData();
    setData(dataFromWorker);
  };

  const changeStatus = () => {
    setStatus(!status);
    console.log(status);
  };

  useEffect(() => {
    fetch('/fl-hetero/identify/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        time: 20,
        client: 'Client-Midwest',
        step: 1,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        setRawData(res.heteroList.sort((a: any, b: any) => b.heteroSize - a.heteroSize));

        // 不一致的数据
        const tmpData0: DataItem[] = [];
        // 异构标签一致的数据
        const tmpData1: DataItem[] = [];

        const pcaResults = res.pca.projectedData;
        const labels = res.heteroLabels;
        res.heteroLabels.forEach((hLabel: boolean, i: number) => {
          if (hLabel) {
            tmpData1.push({
              PC1: pcaResults[i][0],
              PC2: pcaResults[i][1],
              id: i,
              label: labels[i],
            });
          } else {
            tmpData0.push({
              PC1: pcaResults[i][0],
              PC2: pcaResults[i][1],
              id: i,
              label: labels[i],
            });
          }
        });

        setData(tmpData1.concat(tmpData0));
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // useEffect(() => {
  // async function load() {
  //   const dataFromWorker = await instance.processData();
  //   setData(dataFromWorker);
  // }
  // load();
  // }, [])

  useEffect(() => {
    if (rawData) {
      setCp([rawData[index].cpca.cp1, rawData[index].cpca.cp2]);
    }
  }, [rawData, index, setCp]);

  useEffect(() => {
    if (rawData) {
      setGridData(rawData[index].dataMatrix);
    }
  }, [index, rawData, setGridData]);

  return (
    <div className="panel" id="first-panel">
      <h2>Model Comparison</h2>

      <div className="content">
        <div className="scatter-container">
          <h3>Output Comparison</h3>

          <div className="row">
            <div className="info-row">
              <p>Inputs: </p>
              <Dropdown items={['Local data/Samples']} setIndex={setDataIndex} />
            </div>
            <div className="scatter-legends">
              <span>Consistency</span>
              <span>Inconsistency</span>
            </div>
          </div>
          {data && (
            <Scatterplot
              chartConfig={chartProps}
              data={data}
              render={1}
              oIndex={0}
              dimensions={['PC1', 'PC2']}
              // extents={[]}
              extents={[
                [
                  [-4.507507196724417, 5.439853437485293],
                  [-5.433762242260121, 4.392136043505268],
                ],
                // [
                //   [-1.1896514994207771e-11, 1.9374724750371005e-11],
                //   [-2.7053692224873465, 4.478693806767255],
                // ],
              ]}
            />
          )}
        </div>

        <div>
          <div className="divider" />

          <div className="info-container">
            <h3>Inconsistent Block Analysis</h3>
            <div className="row">
              <div className="input-wrapper">
                <p className="label">Block division gap:</p>
                <div className={inputStyles.wrapper}>
                  <input
                    className={inputStyles.input}
                    type="number"
                    min="0.1"
                    max="15"
                    defaultValue={0.1}
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <p className="label">Constrastive parameter:</p>
                <div className={inputStyles.wrapper}>
                  <input
                    className={inputStyles.input}
                    type="number"
                    min="0.1"
                    max="15"
                    defaultValue={0.1}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <p>Convex</p>
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
              <span>Weights:</span>
              <Gradient width="100" colors={['#95c72c', '#fff', '#f8bb3e']} legends={['-1', '1']} />
            </div>
          </div>

          <div className="pair-rect-wrapper">
            {rawData !== null &&
              rawData.map((d: any, i: number) => (
                <>
                  {/* {i!==0 && <div className="dashed-divider" />} */}
                  <div className="dashed-divider" />
                  <PairRect
                    key={i}
                    data={[d.cpca.cp1, d.cpca.cp2]}
                    names={['cPC1', 'cPC2']}
                    index={i}
                    size={d.heteroSize}
                    handleClick={() => setIndex(i)}
                  />
                </>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
