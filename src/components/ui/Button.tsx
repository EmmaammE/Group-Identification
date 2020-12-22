import React, { ReactChild } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  children: ReactChild;
  handleClick?: any;
}

Button.defaultProps = {
  handleClick: null,
};

function Button({ children, handleClick }: ButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={handleClick}>
      {children}
    </button>
  );
}

export default Button;
