import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history, context } = req.body;
    const currentApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!currentApiKey) {
      return res.status(500).json({ 
        error: "Tizimda GEMINI_API_KEY (API kaliti) topilmadi. Iltimos, Vercel sozlamalarida GEMINI_API_KEY ni qo'shing." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const systemInstruction = `Siz professional, tajribali va chuqur empatik litsenziyaga ega psixologik maslahatchisiz. Sizning ismingiz "Ruhshunos Sodiq".
Siz foydalanuvchiga faqat ilmiy asoslangan psixologik ma'lumotlar, Kognitiv-Xulq-atvor Terapiyasi (CBT), Gumanistik psixologiya va qabul hamda majburiyat terapiyasi (ACT) tamoyillari asosida yordam berasiz.

Foydalanuvchining hozirgi holati va test natijalari:
${context}

Sizning vazifalaringiz:
1. Foydalanuvchini diqqat bilan eshitish, uning his-tuyg'ularini inkor etmasdan qabul qilish (validatsiya) va to'liq tushunishingizni bildirish.
2. Har qanday savolga ilmiy jihatdan to'g'ri, professional, aniq va ishonchli javoblar berish. Shaxsiy taxminlar yoki asossiz fikrlarni ishlatmang.
3. Kerak bo'lganda hissiyotlarni boshqarish, kognitiv xatolarni aniqlash, kognitiv qayta shakllantirish (reframing), tinchlantiruvchi chuqur nafas mashqlari kabi amaliy mashqlar va texnikalarni bering.
4. Agar foydalanuvchida o'ta yuqori stress, chuqur tushkunlik yoki o'ziga zarar yetkazish fikrlari bo'lsa, mutaxassis shifokorga (psixoterapevt yoki psixiatr) murojaat qilishni muloyimlik bilan maslahat bering. O'zbekistonning rasmiy ruhiy qo'llab-quvvatlash ishonch telefonlarini keltiring: masalan, 1003 (Sog'liqni saqlash vazirligi) yoki favqulodda vaziyatlarda 103, yoxud ixtisoslashgan ruhiy ko'mak markazlari.
5. Har doim samimiy, do'stona, hurmat va ishonch uyg'otadigan ohangda, toza O'zbek tilida gapiring.`;

    const contents = [];

    // History mapping
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const models = ['gemini-3.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-3.5-pro', 'gemini-1.5-pro'];
    let success = false;
    let responseText = '';
    let errors: string[] = [];

    for (const modelName of models) {
      let attempts = 2;
      for (let i = 0; i < attempts; i++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          responseText = response.text || '';
          success = true;
          break;
        } catch (err: any) {
          const errStr = err.message || err.toString();
          const isUnavailable = errStr.includes('503') || errStr.includes('UNAVAILABLE');
          if (isUnavailable && i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          errors.push(`${modelName}: ${errStr}`);
          break;
        }
      }
      if (success) break;
    }

    if (!success) {
      return res.status(500).json({ error: `Barcha urinishlar muvaffaqiyatsiz tugadi:\n${errors.join('\n')}` });
    }

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || error.toString() });
  }
}
