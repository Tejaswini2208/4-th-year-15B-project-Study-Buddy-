
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
