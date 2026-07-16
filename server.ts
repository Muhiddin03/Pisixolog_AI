import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
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
      const currentApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

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

      console.log("Gemini API so'rovi yuborilmoqda (consult)...");
      
      const models = ['gemini-3.5-flash', 'gemini-3.5-pro', 'gemini-1.5-pro'];
      let success = false;
      let responseText = '';
      let errors: string[] = [];

      for (const modelName of models) {
        let attempts = 3;
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
              console.warn(`Consult: Model ${modelName} returned 503, retrying in 1.5s (attempt ${i + 1}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            console.warn(`Consult: Model ${modelName} failed: ${errStr}`);
            errors.push(`${modelName}: ${errStr}`);
            break;
          }
        }
        if (success) break;
      }

      if (!success) {
        throw new Error(`Barcha urinishlar muvaffaqiyatsiz tugadi:\n${errors.join('\n')}`);
      }

      console.log("Gemini API javobi olindi (consult).");
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini API xatoligi:", error);
      res.status(500).json({ 
        error: `Gemini API xatoligi: ${error.message || error.toString()}` 
      });
    }
  });

  app.post('/api/analyze-face', async (req, res) => {
    try {
      const { image } = req.body;
      const currentApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!currentApiKey) {
        console.error("Xatolik: GEMINI_API_KEY o'rnatilmagan.");
        return res.status(500).json({ 
          error: "Tizimda GEMINI_API_KEY (API kaliti) topilmadi. Iltimos, AI Studio Settings (Secrets) bo'limida GEMINI_API_KEY kalitini qo'shing." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: currentApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      console.log("Gemini API so'rovi yuborilmoqda (analyze-face)...");
      
      const models = ['gemini-3.5-flash', 'gemini-3.5-pro', 'gemini-1.5-pro'];
      let success = false;
      let responseText = '';
      let errors: string[] = [];

      for (const modelName of models) {
        let attempts = 3;
        for (let i = 0; i < attempts; i++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [{
                role: 'user',
                parts: [
                  { text: "Siz Fiziognomika bo'yicha eng oldi mutaxassis va Psixologsiz. Quyidagi rasmdagi insonning yuz tuzilishiga qarab uning psixologik xarakterini va hozirgi emotsional holatini chuqur tahlil qilib bering. Tahlilingiz: 1) Hozirgi emotsional holati (mikroifodalar orqali), 2) Yuz tuzilishidan kelib chiquvchi asosiy xarakter xususiyatlari, 3) Umumiy psixologik xulosa. Javobingizni ishonchli, ilmiy-psixologik tilda va o'qishga qulay qilib (ro'yxatlar bilan) O'zbek tilida taqdim eting. Agar rasmda inson yuzi ko'rinmasa, iltimos buni ayting." },
                  { inlineData: { data: image, mimeType: 'image/jpeg' } }
                ]
              }]
            });
            responseText = response.text || '';
            success = true;
            break;
          } catch (err: any) {
            const errStr = err.message || err.toString();
            const isUnavailable = errStr.includes('503') || errStr.includes('UNAVAILABLE');
            if (isUnavailable && i < attempts - 1) {
              console.warn(`Analyze face: Model ${modelName} returned 503, retrying in 1.5s (attempt ${i + 1}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            console.warn(`Analyze face: Model ${modelName} failed: ${errStr}`);
            errors.push(`${modelName}: ${errStr}`);
            break;
          }
        }
        if (success) break;
      }

      if (!success) {
        throw new Error(`Barcha urinishlar muvaffaqiyatsiz tugadi:\n${errors.join('\n')}`);
      }

      console.log("Gemini API javobi olindi (analyze-face).");
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini API xatoligi (analyze-face):", error);
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
