'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import ChartSkeleton from './ChartSkeleton';

interface LazyChartProps {
  children: ReactNode;
  skeletonType?: 'radar' | 'bar' | 'line' | 'pie';
  className?: string;
  fallback?: ReactNode;
}

export default function LazyChart({
  children,
  skeletonType = 'radar',
  className = '',
  fallback,
}: LazyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
            // Once visible, we can stop observing to free up resources
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '50px', // Start loading 50px before element enters viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {!hasBeenVisible ? (
        fallback || <ChartSkeleton type={skeletonType} />
      ) : (
        children
      )}
    </div>
  );
}
