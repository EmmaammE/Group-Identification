import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AnnoLineChart from '../../components/lineChart/AnnLineChart';
import Dropdown from '../../components/ui/Dropdown';
import { fetchLists, setUpdateAction } from '../../store/reducers/basic';
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

  // const update = useSelector((state: StateType) => state.basic.update);
  const dispatch = useDispatch();
  // const toggleUpdate = useCallback(() => dispatch(setUpdateAction()), [dispatch]);

  const rawList = useSelector((state: StateType) => state.basic.annoLists);
  const annoList = useMemo(() => {
    const data: { [key: number]: any } = {};
    rawList.forEach((item: any) => {
      const { round } = item;
      if (data[round] === undefined) {
        data[round] = [];
      }
      data[round].push(item);
    });

    return data;
  }, [rawList]);

  const getList = useCallback(() => dispatch(fetchLists()), [dispatch]);

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
    getList();
  }, []);

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
