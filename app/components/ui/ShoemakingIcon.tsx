// ShoemakingIcon.tsx – Signature style
import React from 'react';

interface ShoemakingIconProps {
  size?: number;
  className?: string;
  color?: string;
}

const ShoemakingIcon: React.FC<ShoemakingIconProps> = ({
  size = 28,
  className = '',
  color = '#2C1810', // rich dark brown
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Signature stroke: shoe last outline + needle thread */}
      <path
        d="M 6 24 
           C 6 16, 8 10, 12 8 
           C 16 6, 20 6, 24 8 
           C 28 10, 28 14, 26 16 
           C 24 18, 20 18, 18 16 
           L 14 20 
           C 12 22, 10 24, 6 24 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Needle as a sharp dash */}
      <line
        x1="24"
        y1="6"
        x2="22"
        y2="10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Thread flowing from needle */}
      <path
        d="M 22 10 C 20 12, 16 12, 14 14"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 1"
      />
      {/* Small stitch dot */}
      <circle cx="14" cy="14" r="0.8" fill={color} />
    </svg>
  );
};

export default ShoemakingIcon;