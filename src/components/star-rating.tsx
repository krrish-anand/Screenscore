"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
}

export function StarRating({ rating, totalStars = 5, size = 20, className, onRate, readOnly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (rate: number) => {
    if (readOnly) return;
    setHoverRating(rate);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  const handleClick = (rate: number) => {
    if (readOnly || !onRate) return;
    onRate(rate);
  };

  const currentRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-1', className)} onMouseLeave={handleMouseLeave} role="img" aria-label={`Rating: ${rating} out of ${totalStars} stars`}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            type="button"
            key={i}
            className={cn('bg-transparent border-none p-0', !readOnly && 'cursor-pointer')}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={readOnly}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors',
                starValue <= currentRating ? 'text-accent fill-accent' : 'text-muted-foreground/30'
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
