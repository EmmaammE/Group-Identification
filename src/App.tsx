import React from 'react';
import './App.scss';
import LeftPanel from './panels/leftPanel/LeftPanel';
import MiddlePanel from './panels/middlePanel/MiddlePanel';
import RightPanel from './panels/rightPanel/RightPanel';

function App() {
  return (
    <div className="App">
      <LeftPanel />
      <MiddlePanel />
      <RightPanel />
    </div>
  );
}

export default App;
