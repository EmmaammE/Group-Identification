import React, { useState } from 'react';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridMatrix from '../../components/PairRect.tsx/GridMatrix';
import './RightPanel.scss';
import rawData from '../../assets/source/samples.json';
import Dropdown from '../../components/ui/Dropdown';
// import heteroList from '../../assets/data_2/heteroList.json';
// import groundTruth from '../../assets/data_2/groundTruth.json';
// import outputLabels from '../../assets/data_2/outputLabels.json';
import heteroList from '../../assets/source/heteroList.json';
import groundTruth from '../../assets/source/groundTruth.json';
import outputLabels from '../../assets/source/outputLabels.json';

interface RightPanelPorps {
  cpArray: any;
  gridData: number[][] | null;
}
const margin = { t: 50, r: 60, b: 20, l: 50 };
const titles = ['cp1', 'cp2'];

const size = 31;
const data: number[][][] = [...Array(size)].map(() => [[], []]);
const hetData: number[][] = [...Array(size)].map(() => []);
const labels = (rawData as any).labels_real;
const hetLabels = (rawData as any).labels_het;

(rawData as any).samples.forEach((d: number[], j: number) => {
  if (!labels[j]) {
    // negative labels
    d.forEach((value, i) => i < size && data[i][0].push(value));
  } else {
    // positive labels,
    d.forEach((value, i) => i < size && data[i][1].push(value));
  }

  // 如果不一致
  if (hetLabels[j] === false) {
    d.forEach((value, i) => i < size && hetData[i].push(value));
  }
});

function RightPanel({ cpArray, gridData }: RightPanelPorps) {
  const [index, setIndex] = useState(0);

  return (
    <div className="panel" id="RightPanel">
      <h2>Data Space Exploration</h2>
      <div className="content">
        <div className="grid-wrapper">
          <h3>Ground Truth Comparison</h3>
          {/* {gridData && <GridRect data={gridData} />} */}
          <GridMatrix
            data={heteroList[0].cpca.projectedData}
            dataId={heteroList[0].dataID}
            xLabels={groundTruth}
            yLabels={outputLabels}
          />
        </div>

        <div className="attr-container">
          <div className="divider" />

          <div className="row">
            <h3>Attribute Distribution</h3>

            <div className="legends">
              <svg height="20px" viewBox="0 0 90 20">
                <line x1="0" y1="10" x2="18" y2="10" stroke="#5082b3" />
                <text x="20" y="15">
                  Positive
                </text>
              </svg>

              <svg height="20px" viewBox="0 0 90 20">
                <line x1="0" y1="10" x2="18" y2="10" stroke="#c84649" />
                <text x="20" y="15">
                  Negative
                </text>
              </svg>

              <svg height="20px" viewBox="0 0 120 20">
                <line x1="0" y1="10" x2="18" y2="10" stroke="var(--primary-color)" />
                <text x="20" y="15">
                  Inconsistency
                </text>
              </svg>

              <Dropdown items={['linear', 'log']} index={0} setIndex={setIndex} />
            </div>
          </div>

          <div className="lines-container">
            <div className="lines">
              {data.map((arr: number[][], i: number) => (
                <CpLineChart
                  key={i}
                  margin={margin}
                  data={arr}
                  title={`${i}`}
                  index={index}
                  hetData={hetData[i]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
