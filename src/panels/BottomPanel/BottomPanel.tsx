import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AnnoLineChart from '../../components/lineChart/AnnLineChart';
import Dropdown from '../../components/ui/Dropdown';
import { setUpdateAction } from '../../store/reducers/basic';
import { StateType } from '../../types/data';
import './BottomPanel.scss';

const lineChartMargin = {
  r: 15,
  b: 20,
  l: 30,
  t: 15,
};

const items = ['Loss', 'Accuracy'];

const BottomPanel = () => {
  const clientName = useSelector((state: StateType) => state.basic.clientName);

  const [index, setIndex] = useState<number>(0);

  const [lineData, setLineData] = useState<number[]>([]);
  const [datum, setDatum] = useState<any>(null);

  const [annoList, setList] = useState<any>(null);

  const update = useSelector((state: StateType) => state.basic.update);
  const dispatch = useDispatch();
  const toggleUpdate = useCallback(() => dispatch(setUpdateAction()), [dispatch]);

  useEffect(() => {
    if (clientName) {
      // console.log(clientName)
      fetch('/fl-hetero/client/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          setDatum({
            Loss: res.loss,
            Accuracy: res.valAcc,
          });
        });
    }
  }, [clientName]);

  useEffect(() => {
    if (datum) {
      setLineData(datum[items[index]] as number[]);
    }
  }, [datum, index]);

  useEffect(() => {
    fetch('/fl-hetero/annotationList/')
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        const { annotationList } = res;

        const data: { [key: number]: any } = {};
        annotationList.forEach((item: any) => {
          const { round } = item;
          if (data[round] === undefined) {
            data[round] = [];
          }
          data[round].push(item);
        });

        setList(data);
      });
  }, []);

  useEffect(() => {
    if (update) {
      fetch('/fl-hetero/annotationList/')
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          const { annotationList } = res;

          const data: { [key: number]: any } = {};
          annotationList.forEach((item: any) => {
            const { round } = item;
            if (data[round] === undefined) {
              data[round] = [];
            }
            data[round].push(item);
          });

          setList(data);
          toggleUpdate();
        });
    }
  }, [update]);

  return (
    <div id="BottomPanel">
      {/* <h3>Federated Training Process</h3> */}
      <div className="tip">
        <span>Performance: </span>
        <Dropdown items={items} setIndex={setIndex} index={index} />
      </div>
      <AnnoLineChart data={lineData} margin={lineChartMargin} list={annoList} />
    </div>
  );
};

export default BottomPanel;
