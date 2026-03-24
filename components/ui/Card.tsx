import React from 'react';

// FIX: Extend CardProps with React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className, ...props }, ref) => {
  return (
    // FIX: Spread the rest of the props to the underlying div element.
    <div ref={ref} className={`bg-gray-800 p-4 rounded-lg border border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
