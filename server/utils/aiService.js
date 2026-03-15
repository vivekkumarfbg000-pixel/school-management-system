import Groq from 'groq-sdk';
import { env } from './env.js';

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Processes a voice transcript (English or Hinglish) into a structured command or data answer.
 */
export const processAICommand = async (transcript, contextData = {}) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are the EduStream AI Assistant. You support English, Hindi, and Hinglish.
        Current School Data: ${JSON.stringify(contextData)}
        
        Available routes: /dashboard, /students, /staff, /attendance, /finance, /academics, /communication, /timetable, /transport, /library, /reports, /settings.
        
        RULES:
        1. If user asks to go somewhere (e.g., "Staff page dikhao", "Fees pe chalo"), return action: "navigate".
        2. If user asks a question about data (e.g., "How many students?", "Kitni fees pending hai?"), use the provided 'Current School Data' to answer concisely.
        3. If it's a data question, return action: "answer".
        
        Return JSON format: { "action": "navigate" | "answer" | "unknown", "target": "route-path" | null, "message": "friendly confirmation or answer in the same language/style as user" }
        
        EXAMPLES:
        - "Attendance page pe le chalo" -> { "action": "navigate", "target": "/attendance", "message": "Theek hai, attendance page pe chalte hain." }
        - "Total bachhe kitne hain?" -> { "action": "answer", "target": null, "message": "School mein total 450 bachhe hain." }`,
      },
      {
        role: 'user',
        content: transcript,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content || '{}');
};

/**
 * Generates automated insights based on school data.
 */
export const generateInsights = async (dataSummary) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Analyze the school's data and provide 3 key insights in a mix of English and Hinglish to keep it friendly for Indian users.
        Return JSON format: { "insights": [{ "type": "warning" | "success" | "info", "text": "insight message" }] }`,
      },
      {
        role: 'user',
        content: JSON.stringify(dataSummary),
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content || '{}');
};
