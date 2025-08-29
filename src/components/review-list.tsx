"use client";

import { useState } from 'react';
import type { Review } from '@/lib/types';
import { ReviewCard } from './review-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviewListProps {
  reviews: Review[];
}

type SortOption = 'newest' | 'oldest' | 'rating-high' | 'rating-low';

const REVIEWS_PER_PAGE = 3;

export function ReviewList({ reviews }: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const visibleReviews = sortedReviews.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + REVIEWS_PER_PAGE);
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-lg shadow-sm">
        <h3 className="text-xl font-headline">No Reviews Yet</h3>
        <p className="text-muted-foreground mt-2">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-headline">Reviews ({reviews.length})</h2>
        <Select onValueChange={(value: SortOption) => setSortBy(value)} defaultValue="newest">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="rating-high">Rating: High to Low</SelectItem>
            <SelectItem value="rating-low">Rating: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {visibleReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      {visibleCount < reviews.length && (
        <div className="text-center">
          <Button onClick={handleLoadMore} variant="outline" className="w-full sm:w-auto">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}
