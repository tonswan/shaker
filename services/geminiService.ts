
import { GoogleGenAI } from "@google/genai";

// Satisfy TS compiler for process.env in Vite context
const apiKey = (process.env as any).API_KEY;
const ai = new GoogleGenAI({ apiKey });

export const getMotivationalMessage = async (score: number, mode: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user just finished a shaking session in ${mode} mode and scored ${score} points. 
      Generate a short (max 10 words), funny, and slightly competitive motivational message in Russian for a Telegram Mini App. 
      The theme is "Shake Master". Be energetic!`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "Отличная работа, Мастер Тряски!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ты настоящий зверь!";
  }
};
