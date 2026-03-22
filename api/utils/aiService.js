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

/**
 * Generates a structured Markdown lesson plan.
 */
export const generateLessonPlan = async (topic, gradeLevel, duration) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an expert curriculum designer. Draft a comprehensive lesson plan for Grade ${gradeLevel} on the topic: "${topic}". The duration is ${duration} minutes. Include Learning Objectives, Required Materials, Introduction, Core Activity, Conclusion, and a creative Homework assignment. Output MUST be purely in markdown format with no wrapping blocks.`
      }
    ],
    model: 'llama-3.3-70b-versatile',
  });

  return completion.choices[0]?.message?.content || 'Failed to generate lesson plan.';
};

/**
 * Generates a JSON question bank for exams.
 */
export const generateExam = async (topic, gradeLevel, questionCount, difficulty) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an expert examiner. Generate a ${questionCount}-question multiple-choice exam for Grade ${gradeLevel} on the topic: "${topic}" with ${difficulty} difficulty. Output MUST be precisely in the following JSON format: { "examTitle": "string", "questions": [ { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string (the exact option text)", "explanation": "string" } ] }`
      }
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content || '{}');
};

/**
 * Generates advanced predictive AI insights for the Dashboard Risk Radar.
 */
export const generatePredictiveInsights = async (contextData) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are the core Machine Learning intelligence engine for EduStream SaaS. Analyze this school's telemetry data to provide bleeding-edge predictive forecasts. Act like a highly advanced financial and operational AI.

        Return exactly ONE JSON object with a "predictions" array. Each array item MUST have this shape:
        {
          "category": "Financial Forecast" | "Student Churn Risk" | "Operational Bottleneck" | "Academic Trend",
          "severity": "critical" | "warning" | "success" | "info",
          "title": "Short punchy title",
          "description": "Detailed predictive analysis (e.g., 'Based on X, we project Y by next month.')",
          "action": "Recommended action to take"
        }
        
        Generate exactly 3 extremely realistic predictions.`
      },
      {
        role: 'user',
        content: JSON.stringify(contextData),
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content || '{"predictions": []}');
};
