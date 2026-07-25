import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'bg-slate-800 animate-pulse';
  
  let variantClasses = '';
  switch (variant) {
    case 'circular':
      variantClasses = 'rounded-full';
      break;
    case 'text':
      variantClasses = 'rounded-md h-4';
      break;
    case 'rectangular':
    default:
      variantClasses = 'rounded-xl';
      break;
  }

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} />
  );
};
