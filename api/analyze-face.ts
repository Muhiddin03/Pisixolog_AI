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
    const { image } = req.body;
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

    const models = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
    let success = false;
    let responseText = '';
    let errors: string[] = [];

    for (const modelName of models) {
      let attempts = 2;
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
