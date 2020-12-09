import React from 'react';
import './App.scss';
import ScatterplotContainer from './panels/ScatterplotContainer';

function App() {
  return (
    <div className="App">
      <ScatterplotContainer />
      <div className="column-2" />
    </div>
  );
}

export default App;
