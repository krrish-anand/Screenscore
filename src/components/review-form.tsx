
"use client";

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StarRating } from './star-rating';
import type { Review, MediaItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { AuthDialog } from './auth-dialog';

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating.").max(5),
  text: z.string().min(10, "Review must be at least 10 characters.").max(1000, "Review is too long."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  movie: MediaItem;
  onSubmitReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount' | 'author' | 'userId'>) => void;
  user: { userId: string, username: string } | null;
  onLogin: () => void;
}

export function ReviewForm({ movie, onSubmitReview, user, onLogin }: ReviewFormProps) {
  const { toast } = useToast();
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      text: '',
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit a review.",
        });
        return;
    }
    onSubmitReview({ ...data, tmdbId: movie.tmdbId, mediaType: movie.mediaType });
    form.reset({ rating: 0, text: '' });
  };

  return (
    <Card className="sticky top-8 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Write a Review</CardTitle>
        {!user && <CardDescription>You must be logged in to write a review.</CardDescription>}
      </CardHeader>
      <CardContent>
        {user ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Controller
                    control={form.control}
                    name="rating"
                    render={({ field, fieldState }) => (
                    <FormItem>
                        <FormLabel>Your Rating</FormLabel>
                        <FormControl>
                        <div className="flex flex-col">
                            <StarRating
                            rating={field.value}
                            onRate={(rating) => field.onChange(rating)}
                            readOnly={false}
                            size={24}
                            />
                        </div>
                        </FormControl>
                        <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Review</FormLabel>
                        <FormControl>
                        <Textarea rows={4} placeholder={`What did you think of the movie, ${user.username}?`} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    Submit Review
                </Button>
            </form>
            </Form>
        ) : (
            <AuthDialog onLoginClick={onLogin}>
                 <Button className="w-full">Login to Write a Review</Button>
            </AuthDialog>
        )}
      </CardContent>
    </Card>
  );
}
