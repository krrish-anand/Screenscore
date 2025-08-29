
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { recommendMoviesFromQuiz, MovieQuizOutput } from '@/ai/flows/movie-quiz-flow';
import { useToast } from '@/hooks/use-toast';
import { searchMedia } from '@/lib/movie-api';
import type { MediaItem, Person } from '@/lib/types';
import Image from 'next/image';

const quizQuestions = [
  {
    question: "What's your favorite genre?",
    type: 'radio',
    options: ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Romance', "I'm open to anything"],
  },
  {
    question: 'What kind of mood are you in?',
    type: 'radio',
    options: ['Light-hearted and fun', 'Serious and thought-provoking', 'Intense and thrilling', 'Heartwarming and emotional'],
  },
  {
    question: 'Pick a decade for a movie setting.',
    type: 'radio',
    options: ['Modern (2010s-now)', '2000s', '90s', '80s', 'Classic (70s or earlier)', 'Any decade'],
  },
  {
    question: 'Name an actor or actress you like. (Optional)',
    type: 'text',
    placeholder: 'e.g., Tom Hanks',
  },
  {
    question: 'What is your preferred language for a movie?',
    type: 'text',
    placeholder: 'e.g., English, Spanish, Any',
  },
];

interface MovieQuizProps {
  onSelectMovie: (item: MediaItem | Person) => void;
}

export function MovieQuiz({ onSelectMovie }: MovieQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(quizQuestions.length).fill(''));
  const [recommendations, setRecommendations] = useState<MovieQuizOutput>([]);
  const [recommendedMedia, setRecommendedMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const { toast } = useToast();

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setQuizFinished(true);
    try {
      const quizInput = {
        genre: answers[0] || "any",
        mood: answers[1] || "any",
        decade: answers[2] || "any",
        actor: answers[3] || "any",
        language: answers[4] || "any",
      };
      const result = await recommendMoviesFromQuiz(quizInput);
      setRecommendations(result);

      if (result.length > 0) {
          const mediaItems = await Promise.all(
              result.map(async (rec) => {
                  const searchResults = await searchMedia(`${rec.title} ${rec.year}`);
                  return searchResults.find(item => item.title.toLowerCase() === rec.title.toLowerCase() && item.releaseYear === rec.year) || searchResults[0];
              })
          );
          setRecommendedMedia(mediaItems.filter(Boolean) as MediaItem[]);
      }

    } catch (error) {
      console.error("Failed to get recommendations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get recommendations. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
  // Make the actor question (index 3) optional
  const isActorQuestion = currentQuestionIndex === 3;
  const isAnswered = answers[currentQuestionIndex]?.trim() !== '';

  if (quizFinished) {
    return (
      <section className="py-12 border-t">
        <div className="container mx-auto">
          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline">Your Movie Recommendations</CardTitle>
              <CardDescription>Based on your quiz answers, here are a few movies you might enjoy!</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <p className="text-lg animate-pulse">Finding the perfect movies for you...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                    {recommendations.map((rec, index) => {
                         const mediaItem = recommendedMedia[index];
                         return (
                            <div key={rec.title} className="flex flex-col gap-2">
                                <Card className="overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105" onClick={() => mediaItem && onSelectMovie(mediaItem)}>
                                     {mediaItem ? (
                                        <Image
                                            src={mediaItem.posterUrl}
                                            alt={`Poster for ${mediaItem.title}`}
                                            width={400}
                                            height={600}
                                            className="w-full h-auto object-cover"
                                            data-ai-hint="movie poster"
                                        />
                                     ) : (
                                         <div className="bg-muted aspect-[2/3] flex items-center justify-center">
                                            <p className="text-muted-foreground p-4 text-center">Image not available</p>
                                         </div>
                                     )}
                                </Card>
                                <div className="text-center">
                                    <h3 className="font-bold">{rec.title} ({rec.year})</h3>
                                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                                </div>
                            </div>
                         )
                    })}
                </div>
              )}
               <div className="text-center mt-8">
                    <Button onClick={() => {
                        setQuizFinished(false);
                        setCurrentQuestionIndex(0);
                        setAnswers(Array(quizQuestions.length).fill(''));
                        setRecommendations([]);
                        setRecommendedMedia([]);
                    }}>
                        Take the Quiz Again
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t">
       <div className="container mx-auto">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">Find Your Next Movie</CardTitle>
            <CardDescription className="text-center">Answer a few questions and we'll recommend something to watch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="font-semibold text-lg">{currentQuestion.question}</p>
            </div>
            <div className="min-h-[120px]">
              {currentQuestion.type === 'radio' ? (
                <RadioGroup value={answers[currentQuestionIndex]} onValueChange={handleAnswerChange}>
                  {currentQuestion.options?.map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input
                  type="text"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestionIndex]}
                  onChange={e => handleAnswerChange(e.target.value)}
                  className="text-base"
                />
              )}
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
                Back
              </Button>
              {isLastQuestion ? (
                <Button onClick={handleSubmit} disabled={!isAnswered || isLoading}>
                  {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isActorQuestion && !isAnswered}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

    