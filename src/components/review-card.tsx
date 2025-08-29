"use client";

import { useState } from 'react';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { StarRating } from './star-rating';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isLiked, setIsLiked] = useState(false);

  const handleHelpfulClick = () => {
    if (!isLiked) {
      setHelpfulCount((c) => c + 1);
      setIsLiked(true);
    } else {
      setHelpfulCount((c) => c - 1);
      setIsLiked(false);
    }
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarFallback>{review.author.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-bold font-body">{review.author}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(review.date), 'MMMM d, yyyy')}</p>
        </div>
        <StarRating rating={review.rating} readOnly size={16} />
      </CardHeader>
      <CardContent>
        <p className="text-foreground/90">{review.text}</p>
      </CardContent>
      <CardFooter>
        <Button
          variant={isLiked ? "secondary" : "ghost"}
          size="sm"
          onClick={handleHelpfulClick}
          className="flex items-center gap-2 text-muted-foreground hover:text-accent-foreground"
          aria-label={`Mark review as helpful. Currently ${helpfulCount} helpful votes.`}
        >
          <ThumbsUp size={16} className={cn(isLiked && 'text-accent fill-accent/20')} />
          <span>Helpful ({helpfulCount})</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
