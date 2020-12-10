import React from 'react';
import './App.scss';
import ParallelContainer from './panels/ParallelContainer';
import ScatterplotContainer from './panels/ScatterplotContainer';

function App() {
  return (
    <div className="App">
      <ScatterplotContainer />
      <ParallelContainer />
    </div>
  );
}

export default App;
