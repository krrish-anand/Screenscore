
'use server';
/**
 * @fileOverview A movie recommendation quiz flow.
 *
 * - recommendMoviesFromQuiz - A function that recommends movies based on quiz answers.
 * - MovieQuizInput - The input type for the recommendMoviesFromQuiz function.
 * - MovieQuizOutput - The return type for the recommendMoviesFromQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MovieRecommendationSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  year: z.number().describe('The release year of the movie.'),
  reason: z.string().describe('A brief explanation of why this movie is a good recommendation based on the quiz answers.'),
});

const MovieQuizInputSchema = z.object({
  genre: z.string(),
  mood: z.string(),
  decade: z.string(),
  actor: z.string(),
  language: z.string(),
});
export type MovieQuizInput = z.infer<typeof MovieQuizInputSchema>;

const MovieQuizOutputSchema = z.array(MovieRecommendationSchema);
export type MovieQuizOutput = z.infer<typeof MovieQuizOutputSchema>;

export async function recommendMoviesFromQuiz(input: MovieQuizInput): Promise<MovieQuizOutput> {
  return movieQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'movieQuizPrompt',
  input: { schema: MovieQuizInputSchema },
  output: { schema: MovieQuizOutputSchema },
  prompt: `You are a movie recommendation expert. Based on the following quiz answers, recommend 3 movies. For each movie, provide the title, release year, and a short reason why the user would like it.

Quiz Answers:
- Favorite Genre: {{{genre}}}
- Desired Mood: {{{mood}}}
- Preferred Decade: {{{decade}}}
- An actor you like: {{{actor}}}
- Preferred Language: {{{language}}}

Provide exactly 3 recommendations.
`,
});

const movieQuizFlow = ai.defineFlow(
  {
    name: 'movieQuizFlow',
    inputSchema: MovieQuizInputSchema,
    outputSchema: MovieQuizOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      // Return a default or empty list if the model fails to provide an output
      return [];
    }
    return output;
  }
);
