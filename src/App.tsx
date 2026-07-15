import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Brain, 
  Heart, 
  Activity, 
  MessageSquare, 
  Compass, 
  Calendar, 
  AlertCircle, 
  Send, 
  Check, 
  ChevronRight, 
  RotateCcw, 
  Wind, 
  Smile, 
  BookOpen, 
  Star, 
  RefreshCw, 
  User, 
  Shield, 
  Info, 
  ArrowRight, 
  Award, 
  PhoneCall,
  Key
} from 'lucide-react';

// Scientific Eysenck Temperament Inventory questions
interface Question {
  id: number;
  text: string;
  category: 'E' | 'N'; // E: Extraversion, N: Neuroticism
}

const EYSENCK_QUESTIONS: Question[] = [
  { id: 1, text: "Tez-tez yangi taassurotlar va hayajonli lahzalarni qidirasizmi?", category: 'E' },
  { id: 2, text: "Do'stlaringiz bilan muloqot qilish va ko'ngil ochishni juda yaxshi ko'rasizmi?", category: 'E' },
  { id: 3, text: "Odatda tez qaror qabul qilasizmi va faol harakat qilasizmi?", category: 'E' },
  { id: 4, text: "Davralarda diqqat markazida bo'lish sizga yoqadimi?", category: 'E' },
  { id: 5, text: "Notanish odamlar bilan osonlikcha suhbat boshlay olasizmi?", category: 'E' },
  { id: 6, text: "O'zingizni shijoatli va g'ayratli odam deb hisoblaysizmi?", category: 'E' },
  { id: 7, text: "Shovqinli va ko'p odam yig'ilgan joylarda o'zingizni erkin his qilasizmi?", category: 'E' },
  { id: 8, text: "Bir joyda uzoq vaqt tinch o'tirish sizga qiyinchilik tug'diradimi?", category: 'E' },
  { id: 9, text: "Do'stlaringiz sizni jo'shqin va kirishimli deb bilishadimi?", category: 'E' },
  { id: 10, text: "Biror ishni rejalashtirmasdan, tavakkal qilish sizga yoqadimi?", category: 'E' },
  { id: 11, text: "Kayfiyatingiz sababsiz tez-tez o'zgarib turadimi?", category: 'N' },
  { id: 12, text: "Arzimas narsalarga ham ko'p tashvishlanib, xavotirga tushasizmi?", category: 'N' },
  { id: 13, text: "Biror xatolikka yo'l qo'ysangiz, uzoq vaqt xayolingizdan ketmaydimi?", category: 'N' },
  { id: 14, text: "Sizni ranjitish yoki xafa qilish osonmi?", category: 'N' },
  { id: 15, text: "Tez-tez o'zingizni charchagan, asabiy yoki lanj his qilasizmi?", category: 'N' },
  { id: 16, text: "Kutilmagan qiyinchiliklar sizni osongina sarosimaga solib qo'yadimi?", category: 'N' },
  { id: 17, text: "Uyquga ketishingiz qiyin bo'lib, turli xavotirli fikrlar keladimi?", category: 'N' },
  { id: 18, text: "Ba'zida hech qanday sababsiz o'zingizni yolg'iz yoki tushkun his qilasizmi?", category: 'N' },
  { id: 19, text: "O'z his-tuyg'ularingizni nazorat qilish sizga qiyinchilik tug'diradimi?", category: 'N' },
  { id: 20, text: "Tanbehlarni yoki tanqidlarni juda og'ir qabul qilasizmi?", category: 'N' }
];

// Scientific PSS-10 questions
interface PssQuestion {
  id: number;
  text: string;
  isReversed: boolean;
}

const PSS_QUESTIONS: PssQuestion[] = [
  { id: 1, text: "Oxirgi bir oy davomida kutilmagan voqealar tufayli qanchalik tez-tez bezovta bo'ldingiz?", isReversed: false },
  { id: 2, text: "Oxirgi bir oy davomida hayotingizdagi muhim narsalarni nazorat qila olmayotgandek qanchalik tez-tez his qildingiz?", isReversed: false },
  { id: 3, text: "Oxirgi bir oy davomida qanchalik tez-tez o'zingizni asabiy va stress holatida his qildingiz?", isReversed: false },
  { id: 4, text: "Oxirgi bir oy davomida hayotiy muammolaringizni hal qilish qobiliyatingizga qanchalik ishonch hosil qildingiz?", isReversed: true },
  { id: 5, text: "Oxirgi bir oy davomida hamma narsa siz kutgandek ketayotganini qanchalik tez-tez his qildingiz?", isReversed: true },
  { id: 6, text: "Oxirgi bir oy davomida hal qila olmaydigan darajadagi ko'p muammolar to'planib qolganini qanchalik tez-tez his qildingiz?", isReversed: false },
  { id: 7, text: "Oxirgi bir oy davomida shaxsiy muammolaringizni nazorat qilish qobiliyatingizga qanchalik tez-tez ishonch hosil qildingiz?", isReversed: true },
  { id: 8, text: "Oxirgi bir oy davomida o'zingizni hamma narsadan ustun turgandek (nazorat sizda ekanligini) qanchalik tez-tez his qildingiz?", isReversed: true },
  { id: 9, text: "Oxirgi bir oy davomida siz nazorat qila olmaydigan muammolar tufayli qanchalik tez-tez g'azablandingiz?", isReversed: false },
  { id: 10, text: "Oxirgi bir oy davomida qiyinchiliklar shunchalik ko'payib ketganidan, ularni yengib o'tolmaydigandek qanchalik tez-tez his qildingiz?", isReversed: false }
];

interface MoodLog {
  id: string;
  date: string;
  mood: string;
  moodEmoji: string;
  notes: string;
  tags: string[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'tests' | 'ai-chat' | 'breathing' | 'mood' | 'info'>('tests');

  // --- EYSENCK TEST STATE ---
  const [eyQuestionIndex, setEyQuestionIndex] = useState(0);
  const [eyAnswers, setEyAnswers] = useState<boolean[]>([]);
  const [eyCompleted, setEyCompleted] = useState(false);
  const [eyResult, setEyResult] = useState<{
    eScore: number;
    nScore: number;
    type: 'Sangvinik' | 'Xolerik' | 'Flegmatik' | 'Melanxolik';
    title: string;
    description: string;
    advice: string;
  } | null>(null);

  // --- PSS TEST STATE ---
  const [pssQuestionIndex, setPssQuestionIndex] = useState(0);
  const [pssAnswers, setPssAnswers] = useState<number[]>([]);
  const [pssCompleted, setPssCompleted] = useState(false);
  const [pssResult, setPssResult] = useState<{
    score: number;
    level: 'Past' | 'O\'rtacha' | 'Yuqori';
    advice: string;
    color: string;
  } | null>(null);

  // --- CHAT STATE ---
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { 
      role: 'assistant', 
      text: "Salom! Men sizning shaxsiy psixologik maslahatchingiz - Ruhshunos Sodiqman. Bu yerda siz o'zingizni xavfsiz his qilishingiz mumkin. Quyidagi testlarni topshirib dilingizdagilarni yozsangiz, tahlillar orqali sizga yanada aniq va shaxsiy tavsiyalar beraman. Nimalar sizni bezovta qilyapti?" 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('VITE_GEMINI_API_KEY') || '');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const saveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem('VITE_GEMINI_API_KEY', key.trim());
    } else {
      localStorage.removeItem('VITE_GEMINI_API_KEY');
    }
  };

  // --- MOOD STATE ---
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [selectedMood, setSelectedMood] = useState('Sog\'lom & Tinch');
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState('😊');
  const [moodNotes, setMoodNotes] = useState('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  // --- BREATHING STATE ---
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingCycles, setBreathingCycles] = useState(0);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedEy = localStorage.getItem('psixologik_ey_result');
    if (savedEy) {
      try { setEyResult(JSON.parse(savedEy)); setEyCompleted(true); } catch (e) {}
    }
    const savedPss = localStorage.getItem('psixologik_pss_result');
    if (savedPss) {
      try { setPssResult(JSON.parse(savedPss)); setPssCompleted(true); } catch (e) {}
    }
    const savedLogs = localStorage.getItem('psixologik_mood_logs');
    if (savedLogs) {
      try { setMoodLogs(JSON.parse(savedLogs)); } catch (e) {}
    }
  }, []);

  // Save mood logs to localStorage
  const saveMoodLogs = (logs: MoodLog[]) => {
    setMoodLogs(logs);
    localStorage.setItem('psixologik_mood_logs', JSON.stringify(logs));
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // --- EYSENCK LOGIC ---
  const handleEyAnswer = (answer: boolean) => {
    const newAnswers = [...eyAnswers, answer];
    setEyAnswers(newAnswers);

    if (eyQuestionIndex < EYSENCK_QUESTIONS.length - 1) {
      setEyQuestionIndex(eyQuestionIndex + 1);
    } else {
      // Calculate scores
      let eScore = 0;
      let nScore = 0;

      EYSENCK_QUESTIONS.forEach((q, idx) => {
        const userAns = newAnswers[idx];
        if (q.category === 'E' && userAns === true) eScore += 1;
        if (q.category === 'N' && userAns === true) nScore += 1;
      });

      // Map temperament
      let type: 'Sangvinik' | 'Xolerik' | 'Flegmatik' | 'Melanxolik';
      let title = '';
      let description = '';
      let advice = '';

      if (eScore > 5 && nScore <= 5) {
        type = 'Sangvinik';
        title = "Sangvinik (Hissiy barqaror ekstravert)";
        description = "Siz quvnoq, faol, muloqotga kirishuvchan va harakatchansiz. Qiyinchiliklarga duch kelganda tushkunlikka tushmaysiz, moslashuvchanligingiz yuqori. Atrofingizdagilar sizni ijobiy energiya manbai sifatida ko'rishadi.";
        advice = "Sizning kuchli tarafingiz - optimizm va odamlar bilan tez til topishish. Biroq, ba'zida his-tuyg'ularingiz yuzaki bo'lishi yoki boshlagan ishingizni oxiriga yetkazmaslik ehtimoli bor. Diqqatni jamlash va chuqurroq rejalashtirish ustida ishlash tavsiya etiladi.";
      } else if (eScore > 5 && nScore > 5) {
        type = 'Xolerik';
        title = "Xolerik (Hissiy beqaror ekstravert)";
        description = "Siz o'ta jo'shqin, shiddatli, tez jahli chiqadigan va emotsional odamsiz. Yetakchilik qobiliyatingiz kuchli, ammo stress ostida jizzaki bo'lib, o'zingizni idora qilishda qiyinchilikka uchrashingiz mumkin.";
        advice = "Sizda ulkan hayotiy energiya mavjud. Stressli vaziyatlarda zudlik bilan javob berish yoki g'azablanish o'rniga, nafas olish mashqlarini bajaring (masalan, 4-7-8 mashqi). Qaror qabul qilishdan oldin 10 soniya to'xtab tahlil qilish sizni kutilmagan ko'ngilsizliklardan asraydi.";
      } else if (eScore <= 5 && nScore <= 5) {
        type = 'Flegmatik';
        title = "Flegmatik (Hissiy barqaror introvert)";
        description = "Siz o'ta xotirjam, mulohazali, sabr-toqatli va vazmin shaxssiz. His-tuyg'ularingizni tashqariga kam namoyish etasiz. Qiyin daqiqalarda sovuqqonlikni saqlab, mantiqiy reja tuza olasiz.";
        advice = "Sizning xotirjamligingiz va ishonchli xulq-atvoringiz har qanday jamoada qadrlanadi. Biroq, tashqi o'zgarishlarga yoki kutilmagan yangiliklarga moslashishda passivlik qilishingiz mumkin. Atrofingizdagilar bilan his-tuyg'ularingizni ochiqroq baham ko'rishga intiling va faollikni oshiring.";
      } else {
        type = 'Melanxolik';
        title = "Melanxolik (Hissiy beqaror introvert)";
        description = "Siz o'ta sezgir, nozik ta'sirchan, ijodiy fikrlovchi va o'ychan odamsiz. Har bir narsani chuqur his qilasiz, ko'pincha tahlil qilishni yoqtirasiz, xavotir va tushkunlikka tez berilasiz.";
        advice = "Sizning his-tuyg'ularingiz chuqurligi ijodiy qobiliyat, hamdardlik va tahlil qilishda yordam beradi. Ammo, o'zingizga haddan tashqari qattiqqo'l bo'lish yoki kognitiv xatolarga (hamma narsani qora rangda ko'rishga) moyilligingiz bor. Sizga kognitiv tahlil va AI maslahatchimiz bilan doimiy suhbatlar hamda o'z-o'zini qo'llab-quvvatlash mashqlari yaxshi ta'sir qiladi.";
      }

      const resObj = { eScore, nScore, type, title, description, advice };
      setEyResult(resObj);
      setEyCompleted(true);
      localStorage.setItem('psixologik_ey_result', JSON.stringify(resObj));
    }
  };

  const resetEyTest = () => {
    setEyQuestionIndex(0);
    setEyAnswers([]);
    setEyCompleted(false);
    setEyResult(null);
    localStorage.removeItem('psixologik_ey_result');
  };

  // --- PSS LOGIC ---
  const handlePssAnswer = (val: number) => {
    const newAnswers = [...pssAnswers, val];
    setPssAnswers(newAnswers);

    if (pssQuestionIndex < PSS_QUESTIONS.length - 1) {
      setPssQuestionIndex(pssQuestionIndex + 1);
    } else {
      // Calculate PSS-10 score
      let totalScore = 0;
      PSS_QUESTIONS.forEach((q, idx) => {
        const answerVal = newAnswers[idx];
        if (q.isReversed) {
          totalScore += (4 - answerVal);
        } else {
          totalScore += answerVal;
        }
      });

      let level: 'Past' | 'O\'rtacha' | 'Yuqori' = 'Past';
      let advice = '';
      let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';

      if (totalScore <= 13) {
        level = 'Past';
        advice = "Sizda stress darajasi normal holatda. Ruhiy salomatligingiz barqaror. Kundalik hayotingizda muvozanatni yaxshi saqlayapsiz. Shunday davom eting va stressni profilaktika qilish uchun sayrlar hamda to'g'ri uyqu rejimiga rioya qiling.";
        color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      } else if (totalScore <= 26) {
        level = 'O\'rtacha';
        advice = "Sizda o'rtacha stress darajasi mavjud. Ba'zi muammolar yoki kutilmagan vaziyatlar sizga ruhiy yuklama bergan. Sizga ko'proq dam olish, vaqtingizni ijobiy hislar beradigan odamlar bilan o'tkazish, hamda nafas mashqlari bilan band bo'lish tavsiya etiladi.";
        color = 'text-amber-600 bg-amber-50 border-amber-200';
      } else {
        level = 'Yuqori';
        advice = "Diqqat, sizda yuqori stress darajasi aniqlandi. Ruhiy yuklamangiz o'ta kuchli bo'lib, hayotingiz va sog'ligingizga ta'sir qilishi mumkin. Shoshilinch ravishda yuklamalarni kamaytiring, yaqinlaringizdan yordam so'rang, nafas olish mashqlarini bajaring va professional mutaxassis yoki 1003 ishonch raqami bilan bog'lanish haqida o'ylang.";
        color = 'text-rose-600 bg-rose-50 border-rose-200';
      }

      const resObj = { score: totalScore, level, advice, color };
      setPssResult(resObj);
      setPssCompleted(true);
      localStorage.setItem('psixologik_pss_result', JSON.stringify(resObj));
    }
  };

  const resetPssTest = () => {
    setPssQuestionIndex(0);
    setPssAnswers([]);
    setPssCompleted(false);
    setPssResult(null);
    localStorage.removeItem('psixologik_pss_result');
  };

  // --- AI CHAT LOGIC ---
  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    // Create current context summary
    let context = "Foydalanuvchi hali testlardan o'tmadi.";
    if (eyResult && pssResult) {
      context = `Foydalanuvchi temperament testi natijasi: ${eyResult.title} (Ekstraversiya: ${eyResult.eScore}/10, Neyrotizm: ${eyResult.nScore}/10). Stress testi natijasi (PSS-10): Score ${pssResult.score}/40, Daraja: ${pssResult.level}.`;
    } else if (eyResult) {
      context = `Foydalanuvchi temperament testi natijasi: ${eyResult.title} (Ekstraversiya: ${eyResult.eScore}/10, Neyrotizm: ${eyResult.nScore}/10).`;
    } else if (pssResult) {
      context = `Foydalanuvchi stress testi natijasi: Score ${pssResult.score}/40, Daraja: ${pssResult.level}.`;
    }

    try {
      let success = false;
      let assistantText = "";

      // 1. Try to fetch from Express Server side first
      try {
        const res = await fetch('/api/consult', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMsg,
            history: chatHistory,
            context: context
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            assistantText = data.text;
            success = true;
          }
        }
      } catch (err) {
        console.warn("Backend API route failed or not available (e.g. deployed on Vercel as client-side SPA). Falling back to direct client-side Gemini API...");
      }

      // 2. Fallback to direct client-side Gemini API if backend failed or is not running
      if (!success) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || customApiKey || localStorage.getItem('VITE_GEMINI_API_KEY');

        if (apiKey && apiKey.trim()) {
          try {
            const ai = new GoogleGenAI({
              apiKey: apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build'
                }
              }
            });

            // Map chat history to Gemini standard API structure
            const contents = [
              {
                role: 'user',
                parts: [{ text: `Tizim va foydalanuvchi ma'lumotlari: ${context}\nSiz Ruhshunos Sodiqsiz. Siz ilmiy-psixologik, o'ta xushmuomala, empatik, xavfsiz va tushunadigan AI maslahatchisiz.` }]
              },
              ...chatHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
              })),
              {
                role: 'user',
                parts: [{ text: userMsg }]
              }
            ];

            const response = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: contents,
              config: {
                systemInstruction: "Sizning ismingiz - Sodiq. Siz ilmiy-psixologik, o'ta xushmuomala, empatik, xavfsiz va tushunadigan AI maslahatchisiz. Foydalanuvchining his-tuyg'ularini qo'llab-quvvatlang, kognitiv-bixevioral terapiya (CBT) tamoyillari asosida ilmiy yondashing. Qisqa va tushunarli, o'zbek tilida javob bering."
              }
            });

            if (response && response.text) {
              assistantText = response.text;
              success = true;
            } else {
              throw new Error("Bo'sh javob qaytdi.");
            }
          } catch (geminiErr: any) {
            console.error("Direct Gemini call error:", geminiErr);
            assistantText = `Gemini API orqali bog'lanishda xatolik yuz berdi: ${geminiErr.message || geminiErr}. Iltimos, API kalit sozlamalarini tekshiring.`;
          }
        } else {
          assistantText = "Siz ushbu ilovani GitHub orqali yuklab, Vercel/GitHub Pages kabi statik xostingga joylaganga o'xshaysiz. AI Ruhshunos ishlashi uchun Vercel boshqaruv panelida 'VITE_GEMINI_API_KEY' muhit o'zgaruvchisini (Environment Variable) o'rnating, yoki o'ng tomondagi 'Ulanish Ma'lumotlari' qismida shaxsiy Gemini API kalitingizni kiriting.";
        }
      }

      setChatHistory(prev => [...prev, { role: 'assistant', text: assistantText }]);

    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const injectResultsToChat = () => {
    if (!eyResult && !pssResult) return;
    
    let infoText = "Mening ilmiy testlarim natijalari:\n";
    if (eyResult) {
      infoText += `- Temperament: ${eyResult.title}\n`;
    }
    if (pssResult) {
      infoText += `- Stress darajasi: ${pssResult.level} (${pssResult.score}/40 ball)\n`;
    }
    infoText += "Ushbu natijalar asosida menga qanday shaxsiy tavsiyalar berasiz va qanday amaliy mashqlarni tavsiya qilasiz?";
    
    setChatInput(infoText);
    setActiveTab('ai-chat');
  };

  // --- MOOD DIARY LOGIC ---
  const handleAddTag = () => {
    if (customTag.trim() && !moodTags.includes(customTag.trim())) {
      setMoodTags([...moodTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setMoodTags(moodTags.filter(t => t !== tag));
  };

  const handleSaveMoodLog = () => {
    const newLog: MoodLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      mood: selectedMood,
      moodEmoji: selectedMoodEmoji,
      notes: moodNotes,
      tags: moodTags
    };

    const newLogs = [newLog, ...moodLogs];
    saveMoodLogs(newLogs);
    setMoodNotes('');
    setMoodTags([]);
  };

  const handleDeleteMoodLog = (id: string) => {
    const filtered = moodLogs.filter(log => log.id !== id);
    saveMoodLogs(filtered);
  };

  // --- BREATHING EXERCISE LOGIC ---
  // Uses the popular 4-7-8 breathing method
  useEffect(() => {
    let interval: any = null;
    if (breathingPhase !== 'idle') {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          if (breathingPhase === 'inhale') {
            if (prev >= 4) {
              setBreathingPhase('hold');
              return 0;
            }
            return prev + 1;
          }
          if (breathingPhase === 'hold') {
            if (prev >= 7) {
              setBreathingPhase('exhale');
              return 0;
            }
            return prev + 1;
          }
          if (breathingPhase === 'exhale') {
            if (prev >= 8) {
              setBreathingPhase('inhale');
              setBreathingCycles(c => c + 1);
              return 0;
            }
            return prev + 1;
          }
          return 0;
        });
      }, 1000);
    } else {
      setBreathingTimer(0);
    }
    return () => clearInterval(interval);
  }, [breathingPhase]);

  const startBreathing = () => {
    setBreathingPhase('inhale');
    setBreathingTimer(0);
    setBreathingCycles(0);
  };

  const stopBreathing = () => {
    setBreathingPhase('idle');
    setBreathingTimer(0);
  };

  // Render different tabs
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-6 md:pb-0" id="app_root">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-stone-200/60 px-4 py-3" id="header_section">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm" id="logo_container">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-display font-extrabold tracking-tight text-slate-900 leading-none">Ruhiy Ko&apos;mak</h1>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ilmiy-psixologik platforma</p>
              </div>
            </div>

            {/* Quick emergency help button on mobile header */}
            <a href="tel:1003" className="md:hidden flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Yordam</span>
            </a>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 overflow-x-auto no-scrollbar max-w-full" id="main_navigation">
            <button 
              id="nav_tests"
              onClick={() => setActiveTab('tests')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${activeTab === 'tests' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Testlar</span>
            </button>
            <button 
              id="nav_chat"
              onClick={() => setActiveTab('ai-chat')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${activeTab === 'ai-chat' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Sodiq</span>
            </button>
            <button 
              id="nav_breathing"
              onClick={() => setActiveTab('breathing')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${activeTab === 'breathing' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nafas</span>
            </button>
            <button 
              id="nav_mood"
              onClick={() => setActiveTab('mood')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${activeTab === 'mood' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Smile className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kundalik</span>
            </button>
            <button 
              id="nav_info"
              onClick={() => setActiveTab('info')} 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${activeTab === 'info' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Maslahatlar</span>
            </button>
          </div>
        </div>
      </header>

      {/* EMERGENCY CRISIS TICKER */}
      <div className="bg-rose-50 border-b border-rose-100 px-4 py-2.5 text-center text-xs text-rose-700 font-semibold" id="emergency_ticker">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Favqulodda vaziyatda bepul va maxfiy ruhiy ko&apos;mak ishonch telefoni: <strong className="font-bold underline">1003</strong> (Sog&apos;liqni saqlash vazirligi) yoki <strong className="font-bold underline">103</strong>.</span>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-12" id="main_content_container">
        {/* TAB 1: TESTS & DIAGNOSTICS */}
        {activeTab === 'tests' && (
          <div className="space-y-8 md:space-y-10" id="tab_tests_view">
            {/* Top diagnostic state */}
            {(eyResult || pssResult) && (
              <div className="bg-white border border-stone-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-6" id="diagnostic_dashboard">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <h2 className="font-display font-bold text-base md:text-lg text-slate-900">Sizning Shaxsiy Ruhiy Diagnozingiz</h2>
                  </div>
                  <button 
                    id="btn_share_chat"
                    onClick={injectResultsToChat} 
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold border border-emerald-100 w-full sm:w-auto"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Natijalarni AI Ruhshunosga yuborish</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Temperament summary */}
                  {eyResult ? (
                    <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-stone-200/50 space-y-3" id="summary_temperament">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Shaxs Temperamenti</span>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {eyResult.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{eyResult.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{eyResult.description}</p>
                      <div className="pt-2">
                        <span className="text-xs font-bold text-emerald-700 block mb-1">Ilmiy tavsiya:</span>
                        <p className="text-xs text-slate-600 italic">{eyResult.advice}</p>
                      </div>
                      <div className="pt-4 border-t border-stone-200/50 flex justify-between text-xs text-slate-500">
                        <span>Ekstraversiya: <strong>{eyResult.eScore}/10</strong></span>
                        <span>Neyrotizm: <strong>{eyResult.nScore}/10</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-stone-50 border border-dashed border-stone-300 flex flex-col items-center justify-center text-center space-y-2">
                      <Brain className="w-8 h-8 text-stone-300" />
                      <h3 className="font-semibold text-slate-700 text-sm">Temperament Aniqlanmagan</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Eysenck testi orqali asab tizimingiz turini aniqlang.</p>
                    </div>
                  )}

                  {/* Stress summary */}
                  {pssResult ? (
                    <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-stone-200/50 space-y-3" id="summary_stress">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hozirgi Stress Holati (PSS-10)</span>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${pssResult.color}`}>
                          {pssResult.level} Stress
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">Stress Darajasi: {pssResult.score} / 40 ball</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{pssResult.advice}</p>
                      <div className="pt-4 border-t border-stone-200/50 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>0-13 Past | 14-26 O&apos;rtacha | 27-40 Yuqori</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-stone-50 border border-dashed border-stone-300 flex flex-col items-center justify-center text-center space-y-2">
                      <Activity className="w-8 h-8 text-stone-300" />
                      <h3 className="font-semibold text-slate-700 text-sm">Stress Aniqlanmagan</h3>
                      <p className="text-xs text-slate-400 max-w-xs">PSS-10 xalqaro testi yordamida stress darajangizni o&apos;lchang.</p>
                    </div>
                  )}
                </div>

                {/* Eysenck Coordinate Grid Plotting (Only if Eysenck completed) */}
                {eyResult && (
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/40" id="coordinate_grid_box">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">Eysenck Shaxs Koordinatalar Tizimi</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      {/* Interactive SVG Graph */}
                      <div className="relative w-64 h-64 bg-white border border-stone-300 rounded-lg shadow-inner overflow-hidden">
                        {/* Axes */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-px bg-slate-300"></div>
                        </div>
                        <div className="absolute inset-0 flex justify-center pointer-events-none">
                          <div className="w-px h-full bg-slate-300"></div>
                        </div>

                        {/* Quad Labels */}
                        <div className="absolute top-2 left-2 text-[10px] font-bold text-rose-500 opacity-65">Melanxolik</div>
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-500 opacity-65">Xolerik</div>
                        <div className="absolute bottom-2 left-2 text-[10px] font-bold text-blue-500 opacity-65">Flegmatik</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-bold text-emerald-500 opacity-65">Sangvinik</div>

                        {/* Axis Labels */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-slate-400">Neyrotizm (Yuqori)</div>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-slate-400">Turg&apos;unlik (Past)</div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400 rotate-90 origin-bottom">Ekstraversiya</div>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400 -rotate-90 origin-top">Introversiya</div>

                        {/* User Dot */}
                        <div 
                          className="absolute w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-md transition-all duration-1000 -translate-x-1/2 -translate-y-1/2 animate-bounce"
                          style={{
                            left: `${(eyResult.eScore / 10) * 100}%`,
                            top: `${100 - (eyResult.nScore / 10) * 100}%`
                          }}
                        ></div>
                      </div>

                      <div className="text-xs space-y-2 max-w-sm">
                        <p className="font-semibold text-slate-700">Grafikni o&apos;qish:</p>
                        <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                          <li><strong>X o&apos;qi (Ekstraversiya):</strong> O&apos;ng tomonga siljigan sari ochiqlik va muloqotga kirishuvchanlik oshadi.</li>
                          <li><strong>Y o&apos;qi (Neyrotizm):</strong> Yuqoriga siljigan sari hissiyotlar ta&apos;sirchanligi va asabiylik darajasi oshadi.</li>
                          <li>Yashil nuqta sizning asab tizimingizning boshqa odamlar bilan solishtirgandagi aniq pozitsiyasini ifodalaydi.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* EYSENCK TEST INTERFACE */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between" id="eysenck_test_card">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
                      <Brain className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-900">1. Temperament Testi (Eysenck)</h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Ushbu test shaxsiyatning 2 ta asosiy ustunini aniqlaydi: Muloqot xulqi (Ekstraversiya/Introversiya) va Hissiy barqarorlik. 20 ta savolga faqat ha/yo&apos;q shaklida samimiy javob bering.
                  </p>

                  {!eyCompleted ? (
                    <div className="space-y-6 pt-2" id="ey_question_area">
                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Savol {eyQuestionIndex + 1} / {EYSENCK_QUESTIONS.length}</span>
                          <span>{Math.round(((eyQuestionIndex + 1) / EYSENCK_QUESTIONS.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${((eyQuestionIndex) / EYSENCK_QUESTIONS.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/50 min-h-[100px] flex items-center justify-center">
                        <p className="font-bold text-base text-slate-800 text-center leading-relaxed">
                          {EYSENCK_QUESTIONS[eyQuestionIndex].text}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          id="btn_ey_yes"
                          onClick={() => handleEyAnswer(true)}
                          className="py-3 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-98"
                        >
                          Ha
                        </button>
                        <button 
                          id="btn_ey_no"
                          onClick={() => handleEyAnswer(false)}
                          className="py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-slate-700 font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-98"
                        >
                          Yo&apos;q
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2" id="ey_finished_area">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span>Tabriklaymiz, test muvaffaqiyatli yakunlandi! Natija yuqoridagi panelda aks etdi.</span>
                      </div>
                      <button 
                        id="btn_reset_ey"
                        onClick={resetEyTest}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition pt-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Testni qaytadan topshirish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* STRESS TEST INTERFACE */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between" id="stress_test_card">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-900">2. Stress darajasi (PSS-10)</h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Oxirgi bir oy davomidagi hayotiy stress darajangizni ilmiy o&apos;lchash uchun har bir holat sizda qanchalik ko&apos;p takrorlanganini samimiy belgilang (0: Hech qachon, 4: Juda ko&apos;p).
                  </p>

                  {!pssCompleted ? (
                    <div className="space-y-6 pt-2" id="pss_question_area">
                      {/* Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Savol {pssQuestionIndex + 1} / {PSS_QUESTIONS.length}</span>
                          <span>{Math.round(((pssQuestionIndex + 1) / PSS_QUESTIONS.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${((pssQuestionIndex) / PSS_QUESTIONS.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Question text */}
                      <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/50 min-h-[100px] flex items-center justify-center">
                        <p className="font-bold text-base text-slate-800 text-center leading-relaxed">
                          {PSS_QUESTIONS[pssQuestionIndex].text}
                        </p>
                      </div>

                      {/* 5 Options */}
                      <div className="flex flex-col gap-2">
                        {[
                          { val: 0, label: "Hech qachon" },
                          { val: 1, label: "Deyarli hech qachon" },
                          { val: 2, label: "Ba'zida" },
                          { val: 3, label: "Tez-tez" },
                          { val: 4, label: "Juda tez-tez" }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            id={`btn_pss_opt_${opt.val}`}
                            onClick={() => handlePssAnswer(opt.val)}
                            className="w-full text-left py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-slate-900 transition-all text-xs font-semibold text-slate-700 cursor-pointer shadow-xs active:scale-99"
                          >
                            {opt.val} - {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2" id="pss_finished_area">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span>Stress darajangiz hisoblandi! Umumiy natija tepada ko&apos;rsatilgan.</span>
                      </div>
                      <button 
                        id="btn_reset_pss"
                        onClick={resetPssTest}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition pt-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Testni qaytadan topshirish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI CONSULTANT CHAT */}
        {activeTab === 'ai-chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" id="tab_chat_view">
            {/* Chat Box Interface */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl md:rounded-3xl shadow-sm flex flex-col h-[480px] sm:h-[600px] overflow-hidden order-1 lg:order-2" id="chat_box_interface">
              {/* Chat Header */}
              <div className="bg-stone-50 border-b border-stone-100 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between" id="chat_header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold relative">
                    S
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900">Ruhshunos Sodiq</h3>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold">Tizimda faol • Empatik AI Maslahatchi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-semibold border border-stone-200/50">CBT Metodi</span>
                </div>
              </div>

              {/* Messages display */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF9F5]/40" id="chat_messages_area">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    id={`chat_msg_${idx}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white border border-stone-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line font-medium">{msg.text}</p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start" id="chat_loading_indicator">
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Sodiq javob yozmoqda</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={sendChatMessage} className="p-3 sm:p-4 bg-white border-t border-stone-100 flex gap-2" id="chat_input_form">
                <input
                  id="input_chat_text"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Xavotirlaringizni yozing..."
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-slate-800 font-medium transition"
                />
                <button
                  id="btn_chat_send"
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white p-3 sm:p-3.5 rounded-2xl transition shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Sidebar with current context */}
            <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl md:rounded-3xl p-5 shadow-sm space-y-4 lg:space-y-5 h-fit order-2 lg:order-1" id="chat_context_sidebar">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-sm text-slate-900">Ulanish Ma&apos;lumotlari</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ruhshunos Sodiq sizning topshirgan test natijalaringizni to&apos;g&apos;ridan-to&apos;g&apos;ri tahlil qila oladi. Muloqotingiz maxfiy va xavfsiz.
              </p>

              <div className="space-y-3 pt-1" id="sidebar_results_status">
                {eyResult ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-800 block mb-1">Temperament:</span>
                    <span className="text-slate-700">{eyResult.title}</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/50 border-dashed text-xs text-slate-400">
                    Siz hali Temperament testini topshirmadingiz.
                  </div>
                )}

                {pssResult ? (
                  <div className={`p-3.5 rounded-xl border text-xs ${pssResult.color}`}>
                    <span className="font-bold block mb-1">Stress (PSS-10):</span>
                    <span>{pssResult.level} stress ({pssResult.score}/40 ball)</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/50 border-dashed text-xs text-slate-400">
                    Siz hali Stress testini topshirmadingiz.
                  </div>
                )}
              </div>

              {(eyResult || pssResult) && (
                <button
                  id="btn_inject_results"
                  onClick={() => {
                    let infoText = "Mening test natijalarim:\n";
                    if (eyResult) infoText += `- Temperament: ${eyResult.title}\n`;
                    if (pssResult) infoText += `- Stress: ${pssResult.level} (${pssResult.score}/40)\n`;
                    infoText += "Menga ushbu ko'rsatkichlar bo'yicha maxsus va ilmiy tavsiyalar bera olasizmi?";
                    setChatInput(infoText);
                  }}
                  className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                >
                  Natijalarni yozish maydoniga joylash
                </button>
              )}

              {/* Static Hosting API Key settings panel */}
              <div className="pt-3.5 border-t border-stone-100 space-y-2" id="static_api_key_settings">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  Statik (Vercel) API Kaliti
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Ilovani GitHub/Vercel-ga joylaganingizda, o'z shaxsiy Gemini API kalitingizni kiritsangiz bo'ladi (kalit faqat brauzeringizda xavfsiz saqlanadi).
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    placeholder="Sizning Gemini API kalitingiz..."
                    value={customApiKey}
                    onChange={(e) => saveCustomApiKey(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                  {customApiKey && (
                    <button
                      onClick={() => saveCustomApiKey('')}
                      className="px-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                      title="O'chirish"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEEP BREATHING EXERCISE */}
        {activeTab === 'breathing' && (
          <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-2xl md:rounded-3xl p-5 sm:p-8 shadow-sm text-center space-y-6 sm:space-y-8 animate-fade-in" id="tab_breathing_view">
            <div className="space-y-2">
              <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Wind className="w-6 h-6" />
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-slate-900">Nafas Mashqi (4-7-8 Usuli)</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Tinchlanish va stress gormonlarini kamaytirish uchun qadimiy hind yoga amaliyotiga asoslangan, ilmiy tasdiqlangan tinchlanish mashqi.
              </p>
            </div>

            {/* Breathing Animation Canvas */}
            <div className="relative w-72 h-72 mx-auto flex items-center justify-center" id="breathing_visualizer">
              {/* Outer wave ripples */}
              <div className={`absolute inset-0 rounded-full border border-emerald-100 transition-all duration-1000 ${
                breathingPhase === 'inhale' ? 'scale-110 opacity-100' : 'scale-90 opacity-20'
              }`}></div>

              {/* Breathing Ball */}
              <div 
                className={`rounded-full flex flex-col items-center justify-center text-slate-900 transition-all shadow-md ${
                  breathingPhase === 'inhale' ? 'w-64 h-64 bg-emerald-100/90 duration-[4000ms]' :
                  breathingPhase === 'hold' ? 'w-64 h-64 bg-teal-100/95 duration-[7000ms]' :
                  breathingPhase === 'exhale' ? 'w-40 h-40 bg-emerald-50 duration-[8000ms]' :
                  'w-40 h-40 bg-stone-50 border border-stone-200'
                }`}
                id="breathing_ball"
              >
                {breathingPhase === 'idle' ? (
                  <div className="space-y-1.5" id="breath_idle_ui">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tayyormisiz?</p>
                    <span className="font-bold text-slate-800 text-sm">Boshlash</span>
                  </div>
                ) : (
                  <div className="space-y-1" id="breath_active_ui">
                    <p className="text-[10px] text-emerald-700 uppercase font-extrabold tracking-widest animate-pulse">
                      {breathingPhase === 'inhale' ? "Nafas oling" :
                       breathingPhase === 'hold' ? "Nafasni ushlang" :
                       "Nafas chiqaring"}
                    </p>
                    <span className="font-black text-4xl text-slate-900 block">{breathingTimer}s</span>
                    <p className="text-[9px] text-slate-500">Sikl: {breathingCycles}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Control buttons */}
            <div className="space-y-4" id="breathing_controls">
              {breathingPhase === 'idle' ? (
                <button
                  id="btn_start_breathing"
                  onClick={startBreathing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl text-sm transition shadow-sm cursor-pointer active:scale-98"
                >
                  Mashqni boshlash
                </button>
              ) : (
                <button
                  id="btn_stop_breathing"
                  onClick={stopBreathing}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-8 py-3 rounded-2xl text-sm transition border border-rose-200 cursor-pointer active:scale-98"
                >
                  To&apos;xtatish
                </button>
              )}

              {/* Instructions */}
              <div className="grid grid-cols-3 gap-2 bg-stone-50 p-4 rounded-2xl border border-stone-200/50 text-left text-xs" id="breathing_instruction_box">
                <div className="p-2 space-y-1">
                  <span className="font-bold text-emerald-800 block">1. Nafas olish (4s)</span>
                  <p className="text-slate-500 text-[11px]">Burun orqali chuqur va xotirjam nafas oling.</p>
                </div>
                <div className="p-2 space-y-1 border-x border-stone-200">
                  <span className="font-bold text-teal-800 block">2. Ushlab turish (7s)</span>
                  <p className="text-slate-500 text-[11px]">O&apos;pkani to&apos;ldirib, havoni ichkarida saqlang.</p>
                </div>
                <div className="p-2 space-y-1">
                  <span className="font-bold text-slate-800 block">3. Chiqarish (8s)</span>
                  <p className="text-slate-500 text-[11px]">Og&apos;iz orqali sekin va ohista havoni chiqaring.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MOOD DIARY */}
        {activeTab === 'mood' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" id="tab_mood_view">
            {/* New entry logging */}
            <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm space-y-5 h-fit" id="mood_form_box">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Smile className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">Bugungi kayfiyatingiz</h3>
              </div>

              {/* Mood Emojis Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 block">Holatni tanlang:</label>
                <div className="grid grid-cols-3 gap-2.5" id="mood_emoji_selector">
                  {[
                    { label: "Sog'lom & Tinch", emoji: "😊" },
                    { label: "Shod & Xursand", emoji: "😃" },
                    { label: "O'rtacha", emoji: "😐" },
                    { label: "Xafa & Tushkun", emoji: "😔" },
                    { label: "Asabiy & G'azabda", emoji: "😠" },
                    { label: "Charchagan", emoji: "😴" }
                  ].map((item) => (
                    <button
                      key={item.label}
                      id={`btn_mood_${item.label.replace(/\s+/g, '_')}`}
                      onClick={() => {
                        setSelectedMood(item.label);
                        setSelectedMoodEmoji(item.emoji);
                      }}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        selectedMood === item.label 
                          ? 'border-emerald-500 bg-emerald-50/50 text-slate-950 font-bold' 
                          : 'border-stone-200 hover:bg-stone-50 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[10px] leading-tight block truncate w-full">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Kunlik qaydlar (Sizni nimalar xursand qildi yoki bezovta qildi?):</label>
                <textarea
                  id="textarea_mood_notes"
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Shaxsiy hislaringizni yozing..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-medium transition min-h-[80px]"
                />
              </div>

              {/* Tags Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 block">Sizga ta&apos;sir qilayotgan omillar:</label>
                <div className="flex flex-wrap gap-1.5 mb-2" id="selected_tags_container">
                  {moodTags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 bg-stone-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-medium border border-stone-200"
                    >
                      <span>#{tag}</span>
                      <button 
                        id={`btn_remove_tag_${tag}`}
                        onClick={() => handleRemoveTag(tag)} 
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    id="input_custom_tag"
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Masalan: Ish, Oila, O'qish..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    id="btn_add_tag"
                    type="button"
                    onClick={handleAddTag}
                    className="bg-stone-200 hover:bg-stone-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Qo&apos;shish
                  </button>
                </div>
              </div>

              <button
                id="btn_save_mood_log"
                onClick={handleSaveMoodLog}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-xs cursor-pointer active:scale-98"
              >
                Qaydni saqlash
              </button>
            </div>

            {/* Logs display and trends */}
            <div className="lg:col-span-2 space-y-6" id="mood_history_box">
              {/* Simple weekly mood trend SVG Chart */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm" id="mood_analytics_panel">
                <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-600" />
                  <span>Ruhiy o&apos;zgarishlar dinamikasi (Oxirgi qaydlar)</span>
                </h3>

                {moodLogs.length > 0 ? (
                  <div className="space-y-4" id="analytics_with_data">
                    <div className="flex items-end justify-between h-32 px-4 bg-stone-50 rounded-2xl border border-stone-200/30 pt-6">
                      {/* Let's show up to 7 last logs as bar heights */}
                      {moodLogs.slice(0, 7).reverse().map((log, idx) => {
                        // Map mood to height
                        let height = "20%";
                        let color = "bg-stone-300";
                        if (log.mood.includes("Xursand") || log.mood.includes("Shod")) { height = "90%"; color = "bg-emerald-500"; }
                        if (log.mood.includes("Sog'lom") || log.mood.includes("Tinch")) { height = "75%"; color = "bg-teal-500"; }
                        if (log.mood.includes("O'rtacha")) { height = "50%"; color = "bg-amber-400"; }
                        if (log.mood.includes("Charchagan")) { height = "40%"; color = "bg-slate-400"; }
                        if (log.mood.includes("Xafa") || log.mood.includes("Tushkun")) { height = "30%"; color = "bg-blue-400"; }
                        if (log.mood.includes("Asabiy") || log.mood.includes("G'azabda")) { height = "25%"; color = "bg-rose-400"; }

                        return (
                          <div key={log.id} className="flex flex-col items-center gap-2 flex-1 group relative">
                            <div className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white px-2 py-0.5 rounded shadow-md pointer-events-none z-10">
                              {log.mood}
                            </div>
                            <div 
                              className={`w-6 ${color} rounded-t-lg transition-all duration-1000`}
                              style={{ height: height }}
                            ></div>
                            <span className="text-[14px]">{log.moodEmoji}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 italic text-center">Tepada oxirgi 7 ta ruhiy qaydingiz o&apos;zgarish tendentsiyasi ko&apos;rsatilgan.</p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-stone-300 rounded-2xl" id="analytics_empty">
                    Dinamika grafigini ko&apos;rish uchun kamida bitta qayd saqlang.
                  </div>
                )}
              </div>

              {/* Saved lists */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4" id="mood_history_list">
                <h3 className="font-bold text-sm text-slate-900 border-b border-stone-100 pb-3">Sizning kundalik ruhiy tarixingiz</h3>
                {moodLogs.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1" id="mood_logs_scroller">
                    {moodLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-start justify-between gap-4 transition hover:border-stone-300"
                        id={`mood_log_card_${log.id}`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl flex-shrink-0">{log.moodEmoji}</span>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">{log.mood}</h4>
                              <span className="text-[9px] text-slate-400 font-medium">{log.date}</span>
                            </div>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-stone-200/40">
                              {log.notes}
                            </p>
                          )}
                          {log.tags && log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {log.tags.map(t => (
                                <span key={t} className="text-[9px] bg-stone-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          id={`btn_delete_mood_${log.id}`}
                          onClick={() => handleDeleteMoodLog(log.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold px-2 py-1 rounded transition cursor-pointer"
                        >
                          O&apos;chirish
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">Xotiralar mavjud emas. Birinchi xotirani chap tomondan qo&apos;shing.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SCIENTIFIC KNOWLEDGE HUB & RECOMMENDATIONS */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-fade-in" id="tab_info_view">
            <div className="text-center space-y-1.5 max-w-lg mx-auto">
              <h2 className="font-bold text-2xl text-slate-900">Ilmiy Maslahatlar va Psixologiya Hubi</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Platformadagi har bir maslahat va metodlar xalqaro Kognitiv-Xulq-atvor Terapiyasi (CBT), Gumanistik psixologiya va neyrobiologiya qonuniyatlariga tayanadi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="articles_grid">
              {/* Card 1 */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4" id="article_card_1">
                <div className="bg-emerald-50 text-emerald-700 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Kognitiv Xatolar Nima va Ularni Qanday Tuzatish Kerak?</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Bizning ongimiz ko&apos;pincha asossiz xavotirlar yaratadi. Bunday holatlar &quot;kognitiv xatolar&quot; deb ataladi. Masalan, falokatlashtirish (hamma narsani eng yomon tusda ko&apos;rish) yoki zehn o&apos;qish.
                </p>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-slate-500">
                  <strong>CBT Yechimi:</strong> Fikrning haqiqatga mosligini so&apos;roq qiling. &quot;Bunga dalilim bormi?&quot; deb o&apos;zingizdan so&apos;rang.
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4" id="article_card_2">
                <div className="bg-teal-50 text-teal-700 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Hissiy Intellekt (EQ)ni Rivojlantirish Yo&apos;llari</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Hissiy intellekt - bu o&apos;z his-tuyg&apos;ularingizni anglash va ularni oqilona boshqarish qobiliyatidir. Bu boshqalar bilan mustahkam munosabatlar qurishning asosidir.
                </p>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-slate-500">
                  <strong>EQ Amaliyoti:</strong> Har kuni hissiyotlaringizni yozib boring, dilingizni ochiq suhbatlar orqali bo&apos;lishing.
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4" id="article_card_3">
                <div className="bg-amber-50 text-amber-700 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Wind className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Stressni Jismoniy Tinchlantirish Neyrobiologiyasi</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Stress boshlanganda tana adreanalin ajratadi. Biz chuqur nafas olganimizda, adashgan nerv (vagus nerve) faollashib, pulsni sekinlashtiradi va miyaga xavfsizlik signalini yuboradi.
                </p>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-slate-500">
                  <strong>Nafas Yechimi:</strong> 4-7-8 nafas mashqini kuniga 2 marta muntazam takrorlang.
                </div>
              </div>
            </div>

            {/* Practical Resources Box & Hotlines */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 space-y-4 max-w-3xl mx-auto" id="info_hotlines_box">
              <h3 className="font-bold text-base text-emerald-900 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-700" />
                <span>O&apos;zbekiston Ruhiy Ko&apos;mak va Ishonch Telefonlari</span>
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Agar siz doimiy tushkunlik, kuchli nevroz yoki hayotdan charchash kabi og&apos;ir kechinmalarni boshdan kechirayotgan bo&apos;lsangiz, iltimos professional shifokorlar bilan bog&apos;laning. Bu normal va mutlaqo xavfsiz holat. Siz yolg&apos;iz emassiz.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="font-bold text-slate-900 text-sm block">1003</span>
                  <p className="text-[11px] text-slate-500">Sog&apos;liqni saqlash vazirligi tibbiy va ruhiy ko&apos;mak liniyasi (Toshkent va viloyatlar).</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <span className="font-bold text-slate-900 text-sm block">103 / 112</span>
                  <p className="text-[11px] text-slate-500">Favqulodda psixologik yoki tibbiy yordam kerak bo&apos;lganda tunu-kun ochiq liniya.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-stone-200 bg-stone-50 py-8 text-center text-xs text-slate-400 font-medium" id="footer_section">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© 2026 Psixologik Maslahat Platformasi. Barcha huquqlar himoyalangan.</p>
          <p className="max-w-lg mx-auto text-[10px] leading-relaxed text-slate-400">
            Maslahatchi faqat axborot berish va umumiy ruhiy salomatlikni mustahkamlash maqsadida yaratilgan bo&apos;lib, klinik diagnostika yoki rasmiy shifokor retsepti o&apos;rnini bosa olmaydi.
          </p>
        </div>
      </footer>
    </div>
  );
}
