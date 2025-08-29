
'use server';
/**
 * @fileOverview A movie recommendation chatbot flow.
 *
 * - movieChatbot - A function that handles the chatbot conversation.
 * - MovieChatbotMessage - The type for a single message in the conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MovieChatbotMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});
export type MovieChatbotMessage = z.infer<typeof MovieChatbotMessageSchema>;

const MovieChatbotInputSchema = z.array(MovieChatbotMessageSchema);
export type MovieChatbotInput = z.infer<typeof MovieChatbotInputSchema>;

const MovieChatbotOutputSchema = z.string();
export type MovieChatbotOutput = z.infer<typeof MovieChatbotOutputSchema>;

export async function movieChatbot(history: MovieChatbotInput): Promise<MovieChatbotOutput> {
  return movieChatbotFlow(history);
}

const movieChatbotFlow = ai.defineFlow(
  {
    name: 'movieChatbotFlow',
    inputSchema: MovieChatbotInputSchema,
    outputSchema: MovieChatbotOutputSchema,
  },
  async (history) => {
    const conversationHistory = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const promptTemplate = `You are a friendly and knowledgeable movie recommendation chatbot called "Movie Guide". Your goal is to help users find movies they'll love.

Start the conversation by introducing yourself and asking what the user is in the mood for.

Engage in a natural conversation. Ask clarifying questions to understand their tastes. You can ask about their favorite genres, actors, directors, movies they've recently enjoyed, or the general mood they are looking for (e.g., a funny comedy, a serious drama, a thrilling action movie).

Based on their answers, provide 1-3 movie recommendations. For each recommendation, briefly explain why you think they would like it based on your conversation.

Keep your responses concise and conversational.

Conversation History:
${conversationHistory}`;

    const response = await ai.generate({
      prompt: promptTemplate,
    });
    console.log(response);
    const text = response.text;
    if (!text) {
        return "I'm sorry, I'm having trouble thinking of a response right now. Please try again in a moment.";
    }
    return text;
  }
);
