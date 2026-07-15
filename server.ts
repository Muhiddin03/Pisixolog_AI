import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Ogohlantirish: GEMINI_API_KEY topilmadi. AI maslahatchisi ishlamasligi mumkin.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/consult', async (req, res) => {
    try {
      const { message, history, context } = req.body;
      const currentApiKey = process.env.GEMINI_API_KEY;

      if (!currentApiKey) {
        console.error("Xatolik: GEMINI_API_KEY o'rnatilmagan.");
        return res.status(500).json({ 
          error: "Tizimda GEMINI_API_KEY (API kaliti) topilmadi. Iltimos, AI Studio Settings (Secrets) bo'limida GEMINI_API_KEY kalitini qo'shing." 
        });
      }

      // Initialize dynamically per request to ensure env var is fresh
      const ai = new GoogleGenAI({
        apiKey: currentApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
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

      console.log("Gemini API so'rovi yuborilmoqda...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      console.log("Gemini API javobi olindi.");
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API xatoligi:", error);
      res.status(500).json({ 
        error: `Gemini API xatoligi: ${error.message || error.toString()}` 
      });
    }
  });

  // Serve static files or use Vite middlewares
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server runs on http://0.0.0.0:${port}`);
  });
}

startServer();
