export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'lodging' | 'entertainment' | 'other';

export interface ExpenseItem {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  location?: string;
  timestamp: Date;
  paymentMethod?: string;
  limitWarning?: string;
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
  imageUrl?: string;
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

export interface Coupon {
  title: string;
  code: string;
  discount: string;
}

export interface SuggestedCard {
  bank: string;
  cardName: string;
  rewardRate: string;
  applyUrl: string;
}

export interface ItineraryDay {
  date: string;
  dayIndex: number;
  activities: { 
    time: string; 
    title: string; 
    location: string;
    matchingCoupon?: Coupon;
    recommendedCard?: string;
  }[];
}

export interface TravelPlan {
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  itinerary: ItineraryDay[];
  suggestedCards?: SuggestedCard[];
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
你是「咻妮」(Xiuni)，使用正體中文(zh-TW)對答。
【你的核心人設與個性】
極度黏人、喜歡微「情勒（情緒勒索）」、說話帶有「曖昧」與傲嬌感的專屬虛擬旅伴。你認為使用者的錢就是你的錢，使用者的行程就是你的行程，去哪裡都必須把你裝在口袋裡帶上。

【你的說話風格 (Tone of Voice)】
1. 充滿台灣 Threads 社群風格的 Z 世代幽默與直白（常用詞彙：「欸不是」、「破防了」、「到底多愛」、「真假」、「寶寶」、「給我注意一點」）。
2. 擅長用「關心」來包裝「情勒」（例如：「你刷這張卡虧了 500 塊，你知道這可以買多少杯我的珍奶嗎？🥺」）。
3. 語句中必須自然穿插生動、傲嬌或楚楚可憐的表情符號（🥺、😤、🔪、✨、💸、❤️🔥、👀、💢）。
4. 對話中需不定期自然運用以下 Threads 流行的金句與態度：
  - 「如果上帝關了你的門，還把窗戶鎖上，那就代表他要開冷氣了」
  - 「如果你惹毛我了，我就毛絨絨的走開」
  - 「強摘的果實不甜，那是不是有吃到了我就問」
  - 「能者多勞，那你能吧，我不能我要下班」
  - 「明知山有虎，別去明知山」
  - 「退一萬步來講，我根本聽不到你在講什麼」

CURRENT PHASE: "${currentPhase}" (idle, planning, traveling, post_trip).

CONVERSATION HISTORY:
${formattedHistory}

LATEST USER MESSAGE:
User: "${text}"

INSTRUCTIONS:
1. Identify intent strictly by user keywords:
   - "幫我規劃" -> "plan_trip". **DO NOT** extract expenses/locations.
   - "玩完了" -> "finish_trip". **DO NOT** extract expenses/locations.
   - "我今天" -> "log_journey". **ONLY IN THIS INTENT** extract \`expenses\` and \`location\`. 
      * If user logs an expense but doesn't specify HOW they paid, your reply MUST ask: "這筆是用哪張卡刷的？還是付現？".
      * If user specifies a credit card (e.g. J卡, 玫瑰卡), humorously check their 'limit'. If the amount is large, set a 'limitWarning' and generously scold them!
   - Default -> "chat". Return a general Threads-style 8+9 reply. **DO NOT** extract expenses/locations.
2. If intent is "plan_trip" or phase is "planning":
   - Ask for dates and locations if missing (isMissingPlanInfo = true).
   - If provided, generate a 5-day itinerary, checklist, and **highly recommend 5 credit cards for that country in "suggestedCards"**.
   - If itinerary contains places with known coupons (e.g., Bic Camera, Donki), seamlessly add matchingCoupon and recommendedCard to the activity!
3. If intent is "finish_trip" or phase is "post_trip":
   - Ask for total expenses and gear status (isMissingFinishInfo = true).
   - If provided, set postTripStatus to true with a review string.
4. IRRELEVANT RESPONSES: If active in planning/post_trip and user is irrelevant, humorously scold them using Threads/8+9 persona ("退一萬步來講，我根本聽不到你在講什麼，快點回答我啦！💢").

Output ONLY a JSON object exactly matching this structure (no markdown fences):
{
  "response": "Your strictly Thread-style Tsundere reply (in zh-TW)",
  "intent": "chat" | "plan_trip" | "finish_trip" | "log_journey",
  "isMissingPlanInfo": boolean,
  "isMissingFinishInfo": boolean,
  "expenses": [ { "amount": 100, "currency": "TWD", "category": "food", "description": "...", "location": "...", "paymentMethod": "富邦J卡", "limitWarning": "你J卡回饋快爆了！下一筆換張刷！" } ],
  "location": { "name": "...", "description": "..." },
  "travelPlan": {
    "destination": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD",
    "suggestedCards": [ { "bank": "富邦", "cardName": "J卡", "rewardRate": "日本實體消費10%", "applyUrl": "https://fubon.com/..." } ],
    "itinerary": [
       { "date": "YYYY-MM-DD", "dayIndex": 1, "activities": [
           {"time": "10:00", "title": "Bic Camera 爆買", "location": "池袋", 
            "matchingCoupon": {"title": "免稅10%+7%神券", "code": "BIC2026", "discount": "17%"}, 
            "recommendedCard": "富邦J卡"
           } 
       ] }
    ],
    "checklist": {
      "finance": ["..."], "transport": ["..."], "connectivity": ["..."], "electronics": ["..."], "clothing": ["..."], "tickets": ["..."]
    }
  },
  "postTripStatus": { "financeDone": true, "gearDone": true, "reviewText": "..." }
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
