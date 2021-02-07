import React, { useState } from 'react';
import './App.scss';
import LeftPanel from './panels/leftPanel/LeftPanel';
import MiddlePanel from './panels/middlePanel/MiddlePanel';
import RightPanel from './panels/rightPanel/RightPanel';

function App() {
  const [cpArray, setCp] = useState([]);
  const [gridData, setGridData] = useState(null);

  return (
    <div className="App">
      <MiddlePanel />
      <LeftPanel setCp={setCp} setGridData={setGridData} />
      <RightPanel cpArray={cpArray} gridData={gridData} />
    </div>
  );
}

export default App;
