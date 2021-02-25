import React from 'react';
import './App.scss';
import LeftPanel from './panels/leftPanel/LeftPanel';
import MiddlePanel from './panels/middlePanel/MiddlePanel';
import RightPanel from './panels/rightPanel/Panel';

function App() {
  return (
    <div className="App">
      <MiddlePanel />
      <LeftPanel />
      <RightPanel />
    </div>
  );
}

export default App;
