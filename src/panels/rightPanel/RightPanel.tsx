import React from 'react';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridRect from '../../components/PairRect.tsx/GridRect';
import './RightPanel.scss';
import rawData from '../../assets/source/samples.json';

interface RightPanelPorps {
  cpArray: any;
  gridData: number[][] | null;
}
const margin = { t: 50, r: 60, b: 20, l: 50 };
const titles = ['cp1', 'cp2'];

const size = 31;
const data: number[][][] = [...Array(size)].map(() => [[], []]);
const labels = (rawData as any).labels_real;

(rawData as any).samples.forEach((d: number[], j: number) => {
  if (!labels[j]) {
    // negative labels
    d.forEach((value, i) => i < size && data[i][0].push(value));
  } else {
    // positive labels,
    d.forEach((value, i) => i < size && data[i][1].push(value));
  }
});

function RightPanel({ cpArray, gridData }: RightPanelPorps) {
  return (
    <div className="panel" id="RightPanel">
      <h2>Data Space Exploration</h2>
      <div className="content">
        <div className="grid-wrapper">
          <h3>Ground Truth Comparison</h3>
          {/* {gridData && <GridRect data={gridData} />} */}
          <GridRect data={[[1]]} />
        </div>

        <div className="attr-container">
          <div className="divider" />

          <div className="row">
            <h3>Attribute Distribution</h3>

            <div className="legends">
              <svg height="20px" viewBox="0 0 120 20">
                <line x1="0" y1="10" x2="18" y2="10" stroke="#5082b3" />
                <text x="20" y="15">
                  Positive
                </text>
              </svg>

              <svg height="20px" viewBox="0 0 120 20">
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
            </div>
          </div>

          <div className="lines-container">
            <div className="lines">
              {data.map((arr: number[][], i: number) => (
                <CpLineChart key={i} margin={margin} data={arr} title={`${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
