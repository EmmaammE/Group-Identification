import React from 'react';
import Button from '../../components/ui/Button';
import Worker from '../../worker';

const instance = new Worker();

function LeftPanel() {
  const handleClick = async () => {
    // console.log(result)
    const size = await instance.processData();
    console.log(size);
  };

  return (
    <div className="panel">
      <h2>XXXX</h2>
      <p>Dataset: pppub20</p>
      <h3>Cohort Definition</h3>

      <Button handleClick={handleClick}>upload</Button>
    </div>
  );
}

export default LeftPanel;
