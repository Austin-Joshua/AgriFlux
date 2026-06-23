import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

/**
 * Skeleton Loader Component
 * Renders high-quality placeholder shimmers for content states.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const variantClasses = {
    text: 'h-4 rounded-md w-full bg-gray-200 dark:bg-gray-700 shimmer',
    rect: 'rounded-xl bg-gray-200 dark:bg-gray-700 shimmer',
    circle: 'rounded-full bg-gray-200 dark:bg-gray-700 shimmer',
    card: 'card bg-gray-200 dark:bg-gray-700 shimmer min-h-[150px]',
  };

  const singleSkeleton = (index: number) => (
    <div key={index} className={`${variantClasses[variant]} ${className}`} style={style} />
  );

  if (count > 1) {
    return (
      <div className="space-y-2 w-full">
        {Array.from({ length: count }).map((_, i) => singleSkeleton(i))}
      </div>
    );
  }

  return singleSkeleton(0);
};

export default Skeleton;
