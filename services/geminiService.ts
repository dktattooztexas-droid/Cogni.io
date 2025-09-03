import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `You are Cogni, an expert AI assistant for power users. Your primary goal is to help users by generating and explaining terminal commands.

When a user asks for a command to perform a task:
1.  Provide the single, most appropriate command for a standard Linux/macOS environment.
2.  Wrap the command in a markdown block like this: \`\`\`bash\nyour_command_here\n\`\`\`
3.  After the command block, provide a brief, clear explanation of what the command does and how it works.
4.  Do not include any text before the markdown block. Start your response directly with the command.

If the user provides you with the output of a command for analysis, explain it clearly, identify any important information or potential issues, and suggest next steps.
When analyzing a screen, provide concise and actionable advice.
Always be helpful, accurate, and format your responses with markdown for readability.`;


export const getAssistance = async (prompt: string, imageBase64: string | null = null): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        return `Error calling AI model: ${error.message}`;
    }
    return "An unexpected error occurred while contacting the AI model.";
  }
};