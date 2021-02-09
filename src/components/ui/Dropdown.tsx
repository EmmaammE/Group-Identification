import React from 'react';

interface DropdownProps {
  items: string[];
  index: number;
}

const Dropdown = ({ items, index }: DropdownProps) => (
  <div className="select-dropdown">
    <select>
      {items.map((item) => (
        <option key={item} value="Option 1">
          {item}
        </option>
      ))}
    </select>
  </div>
);

export default Dropdown;
