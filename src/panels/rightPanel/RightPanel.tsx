import React from 'react';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridRect from '../../components/PairRect.tsx/GridRect';
import './RightPanel.scss';
import rawData from '../../assets/source/samples.json';

interface RightPanelPorps {
  cpArray: any;
  gridData: number[][] | null;
}
const margin = { t: 50, r: 80, b: 20, l: 50 };
const titles = ['cp1', 'cp2'];

const data: number[][] = [...Array(31)].map((x) => []);

(rawData as any).samples.forEach((d: number[]) => {
  d.forEach((value, i) => data[i].push(value));
});

function RightPanel({ cpArray, gridData }: RightPanelPorps) {
  return (
    <div className="panel" id="RightPanel">
      <h2>Data Space Exploration</h2>
      <div className="content">
        <div className="grid-wrapper">{gridData && <GridRect data={gridData} />}</div>
        <div className="lines">
          {data.map((arr: number[], i: number) => (
            <CpLineChart key={i} margin={margin} data={arr} title="" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
