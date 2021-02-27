import React from 'react';
import './App.scss';
import RightPanel from './panels/rightPanel/Panel';
import BottomPanel from './panels/BottomPanel/BottomPanel';
import LeftPanel from './panels/leftPanel/LeftPanel';
import MiddlePanel from './panels/middlePanel/MiddlePanel';

function App() {
  return (
    <div className="App">
      <LeftPanel />
      <MiddlePanel />
      <RightPanel />
      <BottomPanel />
    </div>
  );
}

export default App;
