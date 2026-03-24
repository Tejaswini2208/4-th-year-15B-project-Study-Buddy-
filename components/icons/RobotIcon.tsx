import React from 'react';

export const RobotIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5m-15 4.5H3m18 0h-1.5m-15 4.5H3m18 0h-1.5m-15 4.5H3m18 0h-1.5M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM11.25 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM13.5 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM15.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM21 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 18.75a6 6 0 0 0 6-6V6.75a6 6 0 0 0-6-6h-1.5a6 6 0 0 0-6 6v6a6 6 0 0 0 6 6h1.5Z" />
  </svg>
);
