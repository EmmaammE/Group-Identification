/* eslint-disable jsx-a11y/no-onchange */
import React from 'react';

interface DropdownProps {
  items: string[];
  index: number;
  setIndex: Function;
}

const Dropdown = ({ items, index, setIndex }: DropdownProps) => {
  const handleChange = (e: any) => {
    console.log(e.target.value);
    setIndex(e.target.value);
  };
  return (
    <div className="select-dropdown">
      <select onChange={handleChange}>
        <option style={{ display: 'none' }} />
        {items.map((item, i) => (
          <option key={item} value={i} selected={index === i}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
