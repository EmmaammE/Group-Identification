import React, { useEffect, useState } from 'react';
import Scatterplot from '../../components/scatterplots/Scatterplot';
import Button from '../../components/ui/Button';
import { ChartProps } from '../../types/chart';
import Worker from '../../worker';
import './leftPanel.scss';
import inputStyles from '../../styles/input.module.css';
import Lineplot from '../../components/line/Lineplot';
import PairRect from '../../components/PairRect.tsx/PairRect';

const instance = new Worker();

const chartProps: ChartProps = {
  width: 390,
  height: 320,
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

function LeftPanel() {
  const [data, setData] = useState<any>(null);

  const handleClick = async () => {
    // console.log(result)
    const dataFromWorker = await instance.processData();
    setData(dataFromWorker);
  };

  useEffect(() => {
    async function load() {
      const dataFromWorker = await instance.processData();
      setData(dataFromWorker);
    }
    load();
  }, []);

  return (
    <div className="panel" id="first-panel">
      <div className="info-container">
        <h3>Data Heterogeneous Location</h3>
      </div>

      <div>
        <PairRect
          data={[
            [0.1, 0.2, -0.3],
            [0.1, 0.2, -0.3],
          ]}
          title="Parameter Comparison"
          names={['Federated model', 'Self-trained model']}
        />

        <PairRect
          data={[
            [0.1, 0.2, -0.3],
            [0.1, 0.2, -0.3],
          ]}
          title="Difference Component"
          names={['Cp1', 'Cp2']}
        />
      </div>
      <div className="scatter-container">
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

        <div className="btns">
          <div className="input-wrapper">
            <div className="label">Step Size: </div>
            <div className={inputStyles.wrapper}>
              <input className={inputStyles.input} type="number" min="0.1" max="15" defaultValue={10} />
            </div>
          </div>

          <div className="btn-wrapper">
            <Button>Post</Button>
          </div>
        </div>
      </div>

      <div>
        <h3>Outlier filter</h3>
        <Lineplot chartConfig={lineChartProps} />
      </div>
    </div>
  );
}

export default LeftPanel;
