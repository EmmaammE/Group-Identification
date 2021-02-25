import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIndexAction } from '../../store/reducers/blockIndex';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridMatrix from '../../components/PairRect.tsx/GridMatrix';
import './RightPanel.scss';
import Dropdown from '../../components/ui/Dropdown';
import { mmultiply, transpose } from '../../utils/mm';

const margin = { t: 50, r: 60, b: 20, l: 50 };

const size = 20;

function RightPanel() {
  const index = useSelector((state: any) => state.blockIndex);
  const heteroList = useSelector((state: any) => state.identify.heteroList);
  const samples = useSelector((state: any) => state.identify.samples);
  const heteroLabels = useSelector((state: any) => state.identify.heteroLabels);
  const outputLabels = useSelector((state: any) => state.identify.outputLabels);
  const groundTruth = useSelector((state: any) => state.identify.groundTruth);

  const dispatch = useDispatch();
  const setIndex = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const [heteData, setHeteData] = useState<any>(null);
  // const [lineDatum, setLineDatum] = useState<any>(null);

  const cpT = transpose([heteroList[index].cpca.cpc1, heteroList[index].cpca.cpc2]);

  const consistentData = useMemo(() => {
    // console.log('mm');
    const temp = samples.filter((u: any, i: number) => heteroLabels[i] === false);

    return mmultiply(temp, cpT);
  }, [samples, cpT, heteroLabels]);

  const datum = useMemo(() => {
    const temp = heteroList[index].heteroIndex.map((i: number) => samples[i]);

    return consistentData.concat(mmultiply(temp, cpT));
  }, [consistentData, cpT, heteroList, index, samples]);

  const lineDatum = useMemo(() => {
    // useEffect(() => {
    const temp: number[][][] = [...Array(size)].map(() => [[], []]);
    const hetData: number[][] = [...Array(size)].map(() => []);

    samples.forEach((d: number[], j: number) => {
      if (!groundTruth[j]) {
        // negative labels
        d.forEach((value, i) => i < size && temp[i][0].push(value));
      } else {
        // positive labels,
        d.forEach((value, i) => i < size && temp[i][1].push(value));
      }

      // 如果不一致
      if (heteroLabels[j] === false) {
        d.forEach((value, i) => i < size && hetData[i].push(value));
      }
    });

    // console.log(hetData)
    setHeteData(hetData);
    // setLineDatum(temp);
    return temp;
  }, [groundTruth, heteroLabels, samples]);

  return (
    <div className="panel" id="RightPanel">
      <h2>Data Space Exploration</h2>
      <div className="content">
        <div className="grid-wrapper">
          <h3>Ground Truth Comparison</h3>
          <GridMatrix data={datum} xLabels={groundTruth} yLabels={outputLabels} />
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
              {heteData !== null &&
                lineDatum.map((arr: number[][], i: number) => (
                  <CpLineChart
                    key={i}
                    margin={margin}
                    data={arr}
                    title={`${i}`}
                    index={index}
                    hetData={heteData[i]}
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
