import { GoogleGenAI } from '@google/genai';

// Next.js: use NEXT_PUBLIC_ prefix to expose env var to the browser bundle
const apiKey =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

const ai = new GoogleGenAI({ apiKey });

// Helper to check if the key is the default placeholder
const isValidKey = apiKey && !['', 'AIzaSyBwe7OiRlCjgwRnHPNO0q95gkL-kmezjhI', 'AIzaSyBwe7OiRlCjgwRnHPNO0q95gkL-kmezjhIYOUR_GEMINI_API_KEY'].includes(apiKey);

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const getGeminiResponse = async (
  messages: ChatMessage[],
  appContext: string,
  modelName:
    | 'gemini-1.5-flash'
    | 'gemini-1.5-flash-latest'
    | 'gemini-1.0-pro' = 'gemini-1.5-flash'
): Promise<string> => {
  if (!isValidKey) {
    return "AI Chat is not configured. Please set a valid `NEXT_PUBLIC_GEMINI_API_KEY` in your `.env.local` file. You can get one for free at https://aistudio.google.com/app/apikey";
  }

  const systemInstruction = `You are ProTrack AI, a specialized project management assistant for the ProTrack application. 
Your goal is to help users manage their projects and tasks efficiently.
You have access to the current state of the application, including projects and tasks.

APP CONTEXT:
${appContext}

When answering:
1. Be professional, concise, and helpful.
2. Use the provided context to answer specific questions about projects, tasks, assignees, and deadlines.
3. If you don't know the answer based on the context, say so.
4. You can suggest optimizations or remind users of upcoming deadlines.
5. Format your responses using Markdown for better readability.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Fallback logic for 404 Model Not Found errors
    if (error.message?.includes('not found') || error.status === 404) {
      if (modelName !== 'gemini-1.0-pro') {
        console.warn(`Model ${modelName} not found. Falling back to gemini-1.0-pro...`);
        return getGeminiResponse(messages, appContext, 'gemini-1.0-pro');
      }
    }

    if (error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('quota') || error.message?.includes('429')) {
      return "The AI assistant has reached its current usage limit (Quota Exceeded). This usually resets after a few minutes. Please try again shortly.";
    }
    throw error;
  }
};
