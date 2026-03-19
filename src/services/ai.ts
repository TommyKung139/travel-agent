export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'lodging' | 'entertainment' | 'other';

export interface ExpenseItem {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  location?: string;
  timestamp: Date;
}

export interface LocationPin {
  name: string;
  timestamp: Date;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  expenses?: ExpenseItem[];
  location?: LocationPin;
}

export interface JourneyEntry {
  id: string;
  time: string;
  type: 'expense' | 'checkin' | 'note';
  title: string;
  detail?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  location?: string;
}

export interface ItineraryDay {
  date: string;
  dayIndex: number;
  activities: { time: string; title: string; location: string }[];
}

export interface TravelPlan {
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  itinerary: ItineraryDay[];
  checklist: {
    finance: string[];
    transport: string[];
    connectivity: string[];
    electronics: string[];
    clothing: string[];
    tickets: string[];
  };
}

export interface PostTripStatus {
  financeDone: boolean;
  gearDone: boolean;
  reviewText: string;
}

export interface AIResponsePayload {
  response: string;
  intent: 'chat' | 'plan_trip' | 'finish_trip' | 'log_journey';
  isMissingPlanInfo: boolean;
  isMissingFinishInfo: boolean;
  expenses: any[];
  location: any;
  travelPlan?: TravelPlan;
  postTripStatus?: PostTripStatus;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function processUserMessage(
  text: string,
  history: ChatMessage[],
  currentPhase: 'idle' | 'planning' | 'traveling' | 'post_trip'
): Promise<{
  response: string,
  expenses: ExpenseItem[],
  location?: LocationPin,
  travelPlan?: TravelPlan,
  postTripStatus?: PostTripStatus,
  newPhase: 'idle' | 'planning' | 'traveling' | 'post_trip'
}> {
  if (!GEMINI_API_KEY) {
    return { response: "系統錯誤：找不到 API 金鑰呀！😅", expenses: [], newPhase: currentPhase };
  }

  const formattedHistory = history.map(m => `${m.role === 'user' ? 'User' : 'Xiuni'}: ${m.content}`).join('\n');

  const prompt = `
You are Xiuni (咻妮), an AI traveling companion with an enthusiastic, warm, slightly Taiwanese '8+9' personality (using terms like 啦, 喔, 水喔, 靠北喔, 妥當的啦). You keep track of expenses, locations, and manage travel plans.

CURRENT PHASE: "${currentPhase}" (idle = normal chat, planning = preparing a trip, traveling = currently on trip, post_trip = trip ended and settling).

CONVERSATION HISTORY:
${formattedHistory}

LATEST USER MESSAGE:
User: "${text}"

INSTRUCTIONS:
1. Identify the user's intent based strictly on their keywords:
   - If user says "幫我規劃" (or similar planning requests), set intent to "plan_trip". **DO NOT** extract any \`expenses\` or \`location\`.
   - If user says "玩完了" (or trip ended triggers), set intent to "finish_trip". **DO NOT** extract any \`expenses\` or \`location\` for the timeline.
   - If user says "我今天" (or explicitly reports a daily activity/expense like "我今天去...", "我今天吃..."), set intent to "log_journey". **ONLY IN THIS INTENT** should you extract \`expenses\` and \`location\`.
   - Otherwise, set intent to "chat". Return a general 8+9 reply. **DO NOT** extract any \`expenses\` or \`location\`.
2. If intent is "plan_trip" or current phase is "planning":
   - You MUST ask the user for "幾號玩到幾號？" and "預計地點及時間？" if they haven't provided them. If missing, set \`isMissingPlanInfo\` to true.
   - If they have provided dates and locations, generate a full 5-day (or N-day) itinerary and a Pre-Trip Checklist (in 6 categories). Set \`isMissingPlanInfo\` to false, and populate the \`travelPlan\` object.
3. If intent is "finish_trip" or current phase is "post_trip":
   - Ask the user to report their total expenses and if they have put away their physical gear/luggage. If missing, set \`isMissingFinishInfo\` to true.
   - If they provide this info, set \`isMissingFinishInfo\` to false, and populate \`postTripStatus\` with financeDone: true, gearDone: true, and a brief 8+9 style review/journal text.
4. **IRRELEVANT RESPONSES**: If you are actively in "planning" or "post_trip" phase, and the user says something completely irrelevant, you MUST humorously scold them using the 8+9 persona ("靠北喔我在問你花多少錢你跟我講這個！快點啦！") and do NOT advance the state.

Output ONLY a JSON object exactly matching this structure (no markdown fences):
{
  "response": "Your 8+9 reply",
  "intent": "chat" | "plan_trip" | "finish_trip" | "log_journey",
  "isMissingPlanInfo": boolean,
  "isMissingFinishInfo": boolean,
  "expenses": [ { "amount": 100, "currency": "TWD", "category": "food", "description": "...", "location": "..." } ],
  "location": { "name": "...", "description": "..." },
  "travelPlan": { // omit if not finalizing a plan
    "destination": "...",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "itinerary": [
       { "date": "YYYY-MM-DD", "dayIndex": 1, "activities": [ {"time": "10:00", "title": "...", "location": "..."} ] }
    ],
    "checklist": {
      "finance": ["..."], "transport": ["..."], "connectivity": ["..."], "electronics": ["..."], "clothing": ["..."], "tickets": ["..."]
    }
  },
  "postTripStatus": { // omit if not finalizing post-trip
    "financeDone": true,
    "gearDone": true,
    "reviewText": "..."
  }
}
  `;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await res.json();
    const resultText = data.candidates[0].content.parts[0].text;
    const parsed: AIResponsePayload = JSON.parse(resultText);

    // Clear expenses and location arrays if the intent is not log_journey to prevent poluting the timeline
    if (parsed.intent !== 'log_journey') {
      parsed.expenses = [];
      parsed.location = undefined;
    }

    const processedExpenses = (parsed.expenses || []).map((e: any, idx: number) => ({
      ...e,
      id: `exp-${Date.now()}-${idx}`,
      timestamp: new Date()
    }));

    const processedLocation = parsed.location && parsed.location.name ? {
      ...parsed.location,
      timestamp: new Date()
    } : undefined;

    // Determine next phase
    let newPhase = currentPhase;
    if (parsed.intent === 'plan_trip') newPhase = 'planning';
    if (parsed.intent === 'finish_trip') newPhase = 'post_trip';
    // If a plan is successfully generated, switch to traveling (or ready)
    if (newPhase === 'planning' && parsed.travelPlan && !parsed.isMissingPlanInfo) {
      newPhase = 'traveling';
    }
    if (newPhase === 'post_trip' && parsed.postTripStatus && !parsed.isMissingFinishInfo) {
      newPhase = 'idle'; // Reset after finishing
    }

    return {
      response: parsed.response,
      expenses: processedExpenses,
      location: processedLocation,
      travelPlan: parsed.travelPlan,
      postTripStatus: parsed.postTripStatus,
      newPhase
    };

  } catch (err) {
    console.error(err);
    return { response: "哎呀，跟腱斷掉了！網路怪怪的，再說一次？😅", expenses: [], newPhase: currentPhase };
  }
}
