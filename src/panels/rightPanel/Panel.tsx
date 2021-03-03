import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIndexAction } from '../../store/reducers/blockIndex';
import CpLineChart from '../../components/lineChart/CpLineChart';
import GridMatrix from '../../components/PairRect.tsx/GridMatrix';
import './RightPanel.scss';
import Dropdown from '../../components/ui/Dropdown';
import { mmultiply, transpose } from '../../utils/mm';
import PairRect from '../../components/PairRect.tsx/PairRect';
import { StateType } from '../../types/data';
import Gradient from '../../components/ui/Gradient';
import inputStyles from '../../styles/input.module.css';
import { fetchLists, setUpdateAction } from '../../store/reducers/basic';

const margin = { t: 50, r: 20, b: 20, l: 50 };

function RightPanel() {
  const index: number = useSelector((state: any) => state.blockIndex);
  const heteroList = useSelector((state: StateType) => state.identify.heteroList);
  const samples = useSelector((state: any) => state.identify.samples);
  const heteroLabels = useSelector((state: any) => state.identify.heteroLabels);
  const outputLabels = useSelector((state: any) => state.identify.outputLabels);
  const groundTruth = useSelector((state: any) => state.identify.groundTruth);

  const blockIndex = useSelector((state: StateType) => state.blockIndex);

  const propertyIndex = useSelector((state: StateType) => state.basic.propertyIndex);

  const dispatch = useDispatch();
  const setIndex = useCallback((i) => dispatch(setIndexAction(i)), [dispatch]);

  const getList = useCallback(() => dispatch(fetchLists()), [dispatch]);

  const [heteData, setHeteData] = useState<any>(null);

  const [pcArr, setcPCA] = useState([[], []]);
  // const pcArr = useSelector((state: StateType) => [
  //   state.identify.cpca.cpc1,
  //   state.identify.cpca.cpc2,
  // ])

  const [annoText, setAnnoText] = useState<string>('');

  // const pcArr = useMemo(() => heteroList[index] && heteroList[index].cpca ? [heteroList[index].cpca.cpc1, heteroList[index].cpca.cpc2] : [], [heteroList, index])

  const round = useSelector((state: StateType) => state.basic.round);

  const cpT = useMemo(() => (pcArr[0].length > 0 ? transpose(pcArr) : [[], []]), [pcArr]);

  const pos = useSelector((state: StateType) => state.basic.pos);

  // TODO 去掉
  const size = useSelector((state: StateType) => state.basic.size);

  const annoList = useSelector((state: StateType) => state.basic.annoLists);
  const [chosedAnnList, setChoseAnnList] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (round !== 0) {
      fetch('/fl-hetero/cpca/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clusterID: blockIndex,
          alpha: 30, // 默认30
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          setcPCA([res.cpc1, res.cpc2]);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [blockIndex, round]);

  // console.log(pcArr)

  const addAnn = () => {
    fetch('/fl-hetero/annotation/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clusterID: blockIndex,
        text: annoText,
        // "round": 5
      }),
    }).then((res) => {
      console.log(res);
      getList();
      setAnnoText('');
    });
  };

  const handleInput = (e: any) => {
    setAnnoText(e.target.value);
  };

  const consistentData = useMemo(() => {
    if (samples.length === 0 || cpT.length === 0 || heteroLabels.length === 0) {
      return [[]];
    }
    // console.log('consistentData', samples, heteroLabels, cpT);
    const temp = samples.filter((u: any, i: number) => heteroLabels[i] === false);

    return mmultiply(temp, cpT);
  }, [samples, cpT, heteroLabels]);

  const datum = useMemo(() => {
    if (heteroList[index] === undefined || samples.length === 0 || cpT.length === 0) {
      return [[]];
    }

    const temp = heteroList[index].heteroIndex.map((i: number) => samples[i]);

    return consistentData.concat(mmultiply(temp, cpT));
  }, [consistentData, cpT, heteroList, index, samples]);

  const lineDatum = useMemo(() => {
    // 一致的点，不一致的点
    const temp: number[][] = [[], []];
    const tempHeteData: number[] = [];

    samples.forEach((d: number[], j: number) => {
      // 如果不一致
      if (heteroLabels[j] === false) {
        temp[1].push(d[propertyIndex]);
      } else {
        temp[0].push(d[propertyIndex]);
      }
      tempHeteData.push(d[propertyIndex]);
    });

    setHeteData(tempHeteData);

    return temp;
  }, [heteroLabels, propertyIndex, samples]);

  const handleChange = (e: any) => {
    const { id } = e.target.dataset;
    const { checked } = e.target;
    if (checked) {
      setChoseAnnList(new Set([...Array.from(chosedAnnList), ...annoList[id].dataIndex]));
    } else {
      const toDelete = new Set(annoList[id].dataIndex);
      setChoseAnnList(new Set([...Array.from(chosedAnnList)].filter((d) => !toDelete.has(d))));
    }
  };

  // console.log(heteData, lineDatum)
  return (
    <div className="panel" id="RightPanel">
      <h2>Heterogenity Examination</h2>
      <div className="content">
        <div className="weight-rects r-panel">
          <div className="row">
            <div className="row">
              <p className="label">Contrastive parameter: </p>
              <div className={inputStyles.wrapper}>
                <input
                  className={inputStyles.input}
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.1"
                  value={30}
                  // onChange={handleGridSizeChange}
                />
              </div>
            </div>
            <div className="row">
              <span>Weights:</span>
              <Gradient colors={['#0aa6e9', '#fff', '#ea4d40']} legends={['-1', '1']} width="80" />
            </div>
          </div>
          <div className="pair-rects">
            {pcArr[0].length > 0 && pcArr.map((pc, i) => <PairRect key={i} data={pc} title={i} />)}
          </div>
        </div>

        <div className="attr-container r-panel">
          <div className="row">
            <p>Dimension: {pos.join(',')} </p>
            <div className="info">
              <span>y-scale:</span>
              <Dropdown items={['linear', 'log']} index={0} setIndex={setIndex} />
            </div>
          </div>

          <div className="row svg-legends">
            <svg height="20px" viewBox="0 0 95 20">
              <line x1="0" y1="10" x2="10" y2="10" stroke="#b6b6b6" />
              <text x="12" y="15">
                Consistent
              </text>
            </svg>

            <svg height="20px" viewBox="0 0 95 20">
              <line x1="0" y1="10" x2="10" y2="10" stroke="var(--primary-color)" />
              <text x="12" y="15">
                Inconsistent
              </text>
            </svg>

            <svg height="20px" viewBox="0 0 30 20">
              <line x1="0" y1="10" x2="10" y2="10" stroke="#5082b3" />
              <text x="12" y="15">
                All
              </text>
            </svg>
          </div>

          <div className="lines-container">
            <div className="lines">
              {heteData && (
                <CpLineChart
                  margin={margin}
                  data={lineDatum}
                  title=""
                  index={index}
                  hetData={heteData}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid-wrapper r-panel">
          <GridMatrix
            data={datum}
            xLabels={groundTruth}
            yLabels={outputLabels}
            highlight={chosedAnnList}
            inconsistentSize={heteroList[index] ? heteroList[index].heteroIndex.length : 0}
          />
        </div>

        <div className="op-container r-panel">
          <div id="anno-panel">
            <p className="title">Instance Verification</p>
            <div className="lists instance-panel">
              <div id="data-wrapper">
                <p>Data:</p>
              </div>
              <div>
                <p>Ground-truth label:</p>
                {/* <p>Ground-truth label:</p> */}
                <p>Output label:</p>
                {/* <p>Output label:</p> */}
                <p>Confidence:</p>
              </div>
              {/* <textarea placeholder="Input" value={annoText} onInput={handleInput} />
              <div className="btn-area">
                <button type="button" className="c-btn" onClick={addAnn}>
                  Record
                </button>
              </div> */}
            </div>
          </div>

          <div id="control-panel">
            <p className="title">Control Panel</p>
            <div className="lists">
              <div className="list-content">
                <p>Overlap lists:</p>
                <div className="list-area" onChange={handleChange}>
                  {annoList.map(({ round: r, text, dataIndex }, i) => (
                    <>
                      <div className="checkbox" key={i}>
                        <input type="checkbox" data-id={i} />
                        <span>
                          In round {r} (size:{dataIndex.length}){' '}
                        </span>
                      </div>
                      <p className="anno">{text}</p>
                    </>
                  ))}
                </div>
                <div className="btn-area">
                  <button type="button" className="c-btn">
                    Intersect
                  </button>
                  <button type="button" className="c-btn">
                    Join
                  </button>
                </div>
              </div>
              <div id="input-wrapper">
                <textarea placeholder="Input" value={annoText} onInput={handleInput} />

                <div className="btn-area">
                  <button type="button" className="c-btn" onClick={addAnn}>
                    Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
