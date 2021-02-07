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

const instance = new Worker();

const chartProps: ChartProps = {
  width: 400,
  height: 413,
  margin: { t: 33, r: 10, b: 20, l: 30 },
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
        <h3>Data Heterogeneous Location</h3>
        <div className="scatter-container">
          {status
            ? data && (
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
              )
            : rawData !== null && <GridRect data={rawData[index].dataMatrix} />}
        </div>

        <div className="info-container">
          <div className="legend">
            <span>-1</span>
            <svg viewBox="0 0 55 5">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e60d17" />
                  <stop offset="45%" stopColor="#eee" />
                  <stop offset="55%" stopColor="#eee" />
                  <stop offset="100%" stopColor="#0b69b6" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" />
            </svg>
            <span>1</span>
          </div>
        </div>

        <div className="pair-rect-wrapper">
          {rawData !== null &&
            rawData.map((d: any, i: number) => (
              <PairRect
                key={i}
                data={[d.cpca.cp1, d.cpca.cp2]}
                names={['Cp1', 'Cp2']}
                index={i}
                size={d.heteroSize}
                handleClick={() => setIndex(i)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
