import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
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
  Camera,
  Shield, 
  Info, 
  ArrowRight, 
  Award, 
  PhoneCall,
  Key,
  ChevronDown,
  Trash2,
  Settings,
  Database,
  Download
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
  { id: 4, text: "Kayfiyatingiz tez-tez va o'z-o'zidan o'zgarib turadimi?", category: 'N' },
  { id: 5, text: "O'zingizni ko'pincha baxtsiz yoki siqilgan his qilasizmi?", category: 'N' },
  { id: 6, text: "Arzimas narsalarga ham tez xavotirga tushib qolasizmi?", category: 'N' },
  { id: 7, text: "Odamlar ko'p joyda o'zingizni erkin va quvnoq his qilasizmi?", category: 'E' },
  { id: 8, text: "Sizga yangi odamlar bilan tanishish yoqadimi?", category: 'E' },
  { id: 9, text: "Ba'zida hech qanday sababsiz o'zingizni juda charchagan his qilasizmi?", category: 'N' },
  { id: 10, text: "Tez-tez uxlashingiz qiyinlashadimi (o'y-xayollar sababli)?", category: 'N' },
  { id: 11, text: "Tavakkal qilishni va xavfli ishlarni yaxshi ko'rasizmi?", category: 'E' },
  { id: 12, text: "Ko'pincha hayajonli voqealarning markazida bo'lishni xohlaysizmi?", category: 'E' },
  { id: 13, text: "Siz tez-tez o'zingizni aybdor his qilasizmi?", category: 'N' },
  { id: 14, text: "Ba'zida o'zingizni shunchalik asabiylashganday his qilasizki, joyingizda o'tirolmaysizmi?", category: 'N' },
  { id: 15, text: "Ziyofat yoki bayramlarda qatnashish sizga zavq beradimi?", category: 'E' },
  { id: 16, text: "Biror ishni boshlashdan oldin tez-tez ikkilanib qolasizmi?", category: 'N' },
  { id: 17, text: "Sizni tez-tez 'hissiyotga beriluvchan' deb ta'riflashadimi?", category: 'N' },
  { id: 18, text: "Kutilmagan vaziyatlarda tezda moslashib keta olasizmi?", category: 'E' },
  { id: 19, text: "Qiyin vaziyatlarda xotirjamlikni saqlab qolish siz uchun qiyinmi?", category: 'N' },
  { id: 20, text: "Yolg'izlikdan ko'ra davrada bo'lishni afzal ko'rasizmi?", category: 'E' }
];

const AFFIRMATIONS = [
  "Men o'z hayotimning ijodkoriman, va bugun men baxtni tanlayman.",
  "Mening his-tuyg'ularim muhim va men ularni qabul qilishga tayyorman.",
  "Men qiyinchiliklarni yengib o'tish uchun yetarli kuchga egaman.",
  "Har bir kun menga yangi imkoniyatlar eshigini ochmoqda.",
  "Mening o'tmishim kelajagimni belgilamaydi; men hozirda erkinman.",
  "Men o'zimni qanday bo'lsam, shundayligimcha qabul qilaman va sevaman.",
  "Mening qalbim tinch, aqlim tiniq.",
  "Men hayotimga yaxshiliklarni jalb qilish imkoniyatiga egaman.",
  "Har nafas olganimda menga kuch va yorug'lik kirib keladi.",
  "Men mukammal emasman, va bu butunlay tabiiy. Men o'sishda davom etaman."
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

const LUSCHER_COLORS = [
  { id: 'blue', color: 'bg-blue-600', name: 'Ko\'k' },
  { id: 'green', color: 'bg-emerald-600', name: 'Yashil' },
  { id: 'red', color: 'bg-red-600', name: 'Qizil' },
  { id: 'yellow', color: 'bg-yellow-400', name: 'Sariq' },
  { id: 'violet', color: 'bg-purple-600', name: 'Binafsha' },
  { id: 'brown', color: 'bg-amber-800', name: 'Jigarrang' },
  { id: 'black', color: 'bg-slate-900', name: 'Qora' },
  { id: 'gray', color: 'bg-slate-400', name: 'Kulrang' },
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
  const [activeTab, setActiveTab] = useState<'welcome'|'tests'|'ai-chat'|'practices'|'face'|'mood'|'info'|'settings'>('welcome');
  const [testsSubTab, setTestsSubTab] = useState<'eysenck'|'stress'|'color'|'dashboard'>('eysenck');
  const [practicesSubTab, setPracticesSubTab] = useState<'breathing'|'shredder'|'affirmations'|'gratitude'>('breathing');
  const [moodSubTab, setMoodSubTab] = useState<'log'|'history'>('log');
  const [tempInfoTab, setTempInfoTab] = useState<'sangvinik'|'xolerik'|'flegmatik'|'melanxolik'>('sangvinik');
  const [faceSubTab, setFaceSubTab] = useState<'camera'|'result'>('camera');

  // Helper to load state
  const loadState = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultVal;
  };

  // --- EYSENCK TEST STATE ---
  const [eyQuestionIndex, setEyQuestionIndex] = useState(0);
  const [eyAnswers, setEyAnswers] = useState<boolean[]>([]);
  const [eyCompleted, setEyCompleted] = useState(() => loadState('psixologik_ey_completed', false));
  const [eyResult, setEyResult] = useState<any | null>(() => loadState('psixologik_ey_result', null));

  // --- PSS TEST STATE ---
  const [pssQuestionIndex, setPssQuestionIndex] = useState(0);
  const [pssAnswers, setPssAnswers] = useState<number[]>([]);
  const [pssCompleted, setPssCompleted] = useState(() => loadState('psixologik_pss_completed', false));
  const [pssResult, setPssResult] = useState<any | null>(() => loadState('psixologik_pss_result', null));

  // --- CHAT STATE ---
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>(() => {
    return loadState('psixologik_chat_history', [
      { 
        role: 'assistant', 
        text: "Salom! Men sizning shaxsiy psixologik maslahatchingiz - Ruhshunos Sodiqman. Bu yerda siz o'zingizni xavfsiz his qilishingiz mumkin. Quyidagi testlarni topshirib dilingizdagilarni yozsangiz, tahlillar orqali sizga yanada aniq va shaxsiy tavsiyalar beraman. Nimalar sizni bezovta qilyapti?" 
      }
    ]);
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('VITE_GEMINI_API_KEY') || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('SELECTED_GEMINI_MODEL') || '');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelListLoading, setModelListLoading] = useState<boolean>(false);
  const [modelListError, setModelListError] = useState<string>('');

  const fetchAvailableModels = async () => {
    setModelListLoading(true);
    setModelListError('');
    const apiKey = customApiKey || localStorage.getItem('VITE_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setModelListError("AI Kaliti topilmadi. Avval API Kalitini kiriting.");
      setModelListLoading(false);
      return;
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.list();
      if (response && response.page) {
        const names = response.page.map((m: any) => m.name.replace('models/', ''));
        setAvailableModels(names);
        if (names.length > 0 && !selectedModel) {
          const hasFlash35 = names.some(n => n.includes('gemini-3.5-flash'));
          const defaultModel = hasFlash35 ? names.find(n => n.includes('gemini-3.5-flash')) : names[0];
          setSelectedModel(defaultModel);
          localStorage.setItem('SELECTED_GEMINI_MODEL', defaultModel);
        }
      } else {
        setModelListError("Modellar ro'yxatini olib bo'lmadi.");
      }
    } catch (err: any) {
      setModelListError(err.message || err.toString());
    }
    setModelListLoading(false);
  };

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
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => loadState('psixologik_mood_logs', []));
  const [selectedMood, setSelectedMood] = useState('Sog\'lom & Tinch');
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState('😊');
  const [moodNotes, setMoodNotes] = useState('');
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  // --- BREATHING STATE ---
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingCycles, setBreathingCycles] = useState(0);

  // --- COLOR TEST STATE ---
  const [selectedColors, setSelectedColors] = useState<string[]>(() => loadState('psixologik_colors_selected', []));
  const [colorResult, setColorResult] = useState<string | null>(() => loadState('psixologik_colors_result', null));

  // --- WORRY SHREDDER STATE ---
  const [worryText, setWorryText] = useState('');
  const [isShredding, setIsShredding] = useState(false);
  const [shredderMessage, setShredderMessage] = useState('');

  // --- AFFIRMATIONS STATE ---
  const [currentAffirmation, setCurrentAffirmation] = useState('');

  // --- GRATITUDE STATE ---
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>(() => loadState('psixologik_gratitude', ['', '', '']));
  const [gratitudeSaved, setGratitudeSaved] = useState(() => loadState('psixologik_gratitude_saved', false));

  // --- FACE ANALYSIS STATE ---
  const [faceCameraActive, setFaceCameraActive] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceResult, setFaceResult] = useState<string | null>(() => loadState('psixologik_face_result', null));
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- UI STATE ---
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);

  // --- STORAGE USAGE STATE ---
  const [storageUsage, setStorageUsage] = useState({ bytes: 0, percent: 0 });

  const calculateStorage = () => {
    let _lsTotal = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('psixologik_')) {
        const item = localStorage.getItem(key);
        if (item) {
          _lsTotal += (key.length + item.length) * 2; // UTF-16 characters take 2 bytes
        }
      }
    }
    // Most browsers have a 5MB limit per origin (5242880 bytes)
    const MAX_STORAGE = 5 * 1024 * 1024;
    setStorageUsage({
      bytes: _lsTotal,
      percent: Math.min(100, (_lsTotal / MAX_STORAGE) * 100)
    });
  };

  useEffect(() => {
    // Initial sync
    calculateStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('psixologik_')) {
        calculateStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Mobile keyboard detection
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight - 150;
        setIsKeyboardOpen(isShrunk);
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      // initial check
      handleVisualViewportResize();
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            setIsInputFocused(false);
          }
        }, 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [activeTab, chatHistory, moodLogs, eyResult, pssResult]);

  // Auto-save effects
  useEffect(() => { localStorage.setItem('psixologik_ey_result', JSON.stringify(eyResult)); }, [eyResult]);
  useEffect(() => { localStorage.setItem('psixologik_ey_completed', JSON.stringify(eyCompleted)); }, [eyCompleted]);
  useEffect(() => { localStorage.setItem('psixologik_pss_result', JSON.stringify(pssResult)); }, [pssResult]);
  useEffect(() => { localStorage.setItem('psixologik_pss_completed', JSON.stringify(pssCompleted)); }, [pssCompleted]);
  useEffect(() => { localStorage.setItem('psixologik_chat_history', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('psixologik_mood_logs', JSON.stringify(moodLogs)); }, [moodLogs]);
  useEffect(() => { localStorage.setItem('psixologik_colors_selected', JSON.stringify(selectedColors)); }, [selectedColors]);
  useEffect(() => { localStorage.setItem('psixologik_colors_result', JSON.stringify(colorResult)); }, [colorResult]);
  useEffect(() => { localStorage.setItem('psixologik_gratitude', JSON.stringify(gratitudeEntries)); }, [gratitudeEntries]);
  useEffect(() => { localStorage.setItem('psixologik_gratitude_saved', JSON.stringify(gratitudeSaved)); }, [gratitudeSaved]);
  useEffect(() => { localStorage.setItem('psixologik_face_result', JSON.stringify(faceResult)); }, [faceResult]);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setFaceCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert("Kameraga ulanib bo'lmadi. Ruxsat berilganligini tekshiring.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setFaceCameraActive(false);
  };

  useEffect(() => {
    // If user navigates away from face tab, stop camera
    if (activeTab !== 'face') {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const analyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFaceLoading(true);
    setFaceError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const maxDim = 640;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      stopCamera();

      let success = false;
      let modelErrors: string[] = [];

      // 1. Try to fetch from Express Server side first (runs securely on Vercel backend)
      try {
        const res = await fetch('/api/analyze-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            setFaceResult(data.text);
            setFaceSubTab('result'); // Switch to result tab
            setShowFaceModal(true); // Optional: still show modal to notify
            success = true;
          }
        }
      } catch (err) {
        console.warn("Backend face analysis failed or not available. Falling back to direct client-side Gemini API...");
      }

      // 2. Fallback to direct client-side Gemini API
      if (!success) {
        const apiKey = customApiKey || localStorage.getItem('VITE_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey && apiKey.trim()) {
          const defaultModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
          const models = selectedModel ? [selectedModel, ...defaultModels] : defaultModels;

          for (const modelName of models) {
            let attempts = 3;
            let responseText = '';
            for (let i = 0; i < attempts; i++) {
              try {
                const ai = new GoogleGenAI({ 
                  apiKey,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const result = await ai.models.generateContent({
                  model: modelName,
                  contents: [{
                    role: 'user',
                    parts: [
                      { text: "Siz Fiziognomika bo'yicha eng oldi mutaxassis va Psixologsiz. Quyidagi rasmdagi insonning yuz tuzilishiga qarab uning psixologik xarakterini va hozirgi emotsional holatini chuqur tahlil qilib bering. Tahlilingiz: 1) Hozirgi emotsional holati (mikroifodalar orqali), 2) Yuz tuzilishidan kelib chiquvchi asosiy xarakter xususiyatlari, 3) Umumiy psixologik xulosa. Javobingizni ishonchli, ilmiy-psixologik tilda va o'qishga qulay qilib (ro'yxatlar bilan) O'zbek tilida taqdim eting. Agar rasmda inson yuzi ko'rinmasa, iltimos buni ayting." },
                      { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
                    ]
                  }]
                });
                responseText = result.text || '';
                break;
              } catch (err: any) {
                const errStr = err?.message || err?.toString() || '';
                const isUnavailable = errStr.includes('503') || errStr.includes('UNAVAILABLE');
                if (isUnavailable && i < attempts - 1) {
                  console.warn(`Face analysis: Model ${modelName} returned 503, retrying in 1.5s (attempt ${i + 1}/3)...`);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  continue;
                }
                console.warn(`Face analysis: Model ${modelName} failed: ${errStr}`);
                modelErrors.push(`${modelName}: ${errStr}`);
                break;
              }
            }
            if (responseText) {
              setFaceResult(responseText);
              setFaceSubTab('result'); // Switch to result tab
              setShowFaceModal(true); // Optional: still show modal to notify
              success = true;
              break;
            }
          }

          if (!success) {
            setFaceError(`Yuz tahlilida xatolik yuz berdi. Tafsilotlar:\n${modelErrors.join('\n')}`);
          }
        } else {
          setFaceError("Gemini API kaliti topilmadi. Sozlamalar bo'limiga kiring va API kalitni kiriting.");
        }
      }
    }
    setFaceLoading(false);
  };

  const saveMoodLogs = (logs: MoodLog[]) => {
    setMoodLogs(logs);
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Scroll to top on navigation change
  useEffect(() => {
    const mainContent = document.getElementById('main_content_container');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, testsSubTab, practicesSubTab]);

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

  // --- COLOR TEST LOGIC ---
  const handleColorSelect = (colorId: string) => {
    if (selectedColors.includes(colorId)) return;
    
    const newColors = [...selectedColors, colorId];
    setSelectedColors(newColors);

    if (newColors.length === 3) {
      // Generate result based on the primary color (first choice).
      const primary = newColors[0];
      
      let resultText = '';
      if (primary === 'blue') resultText = "Hissiy ehtiyojlar: Siz chuqur xotirjamlik, tinchlik va o'zaro ishonchga asoslangan munosabatlarga muhtojsiz. Atrofdagi stresslardan charchagansiz va hozircha barcha ziddiyatlardan uzoqlashishni, asab tizimingizga dam berishni xohlayapsiz. Ichki dunyongizda uyg'unlik (garmoniya) va himoyalanganlik hissi hozir birinchi o'rinda.";
      else if (primary === 'green') resultText = "Hissiy ehtiyojlar: Siz o'z imkoniyatlaringizni ko'rsatish, hurmat qozonish va mustaqilligingizni isbotlash bosqichidasiz. O'z qadr-qimmatingizni baland tutish, qat'iyatlik bilan oldinga borish va birovlarning fikriga qaram bo'lmaslik ehtiyoji kuchli. Ba'zida haddan tashqari mukammallikka (perfeksionizmga) intilish va o'jarlik ham kuzatilishi mumkin.";
      else if (primary === 'red') resultText = "Hissiy ehtiyojlar: Sizda hayotiylik, energiya va yutuqlarga erishish ishtiyoqi qaynayapti. Harakat qilish, to'siqlarni yengib o'tish va muvaffaqiyatga erishish istagi juda yuqori. O'z xohish-istaklaringizni tezroq qondirishga urinyapsiz. Ehtiyot bo'ling, bu intensiv holat tez asabiy charchoq yoki tajovuzkorlikka aylanishi mumkin.";
      else if (primary === 'yellow') resultText = "Hissiy ehtiyojlar: Siz kelajakka katta umid bilan qarayapsiz. Hozirgi monoton yoki bosimli vaziyatlardan qutulib, erkinlik, yangilik va kashfiyotlar sari intilmoqdasiz. Optimistik kayfiyatdasiz, qandaydir ijobiy o'zgarishni kutyapsiz. Diqqatingiz bir joyda turmasligi va har narsaga tez qiziqib qolishingiz ehtimoli bor.";
      else if (primary === 'violet') resultText = "Hissiy ehtiyojlar: Siz qandaydir sehrli, noodatiy va estetik sirlarga boy voqelikni istayapsiz. Boshqalar bilan juda nozik va hissiy aloqa o'rnatish, haqiqatning qo'pol tomonlaridan qochib, o'z fantaziyalar olamingizda yashash ehtiyoji mavjud. Sizni o'rab turgan reallik biroz zerikarli tuyulyapti va nozik did bilan muhit yaratishga urinyapsiz.";
      else if (primary === 'brown') resultText = "Hissiy ehtiyojlar: Sizga jismoniy qulaylik, iliqlik va shunchaki xavfsizlik juda zarur. Ehtimol siz kasallikdan, uzoq davom etgan stressdan yoki tushkunlikdan holdan toygan bo'lishingiz mumkin. Hayotning murakkabliklaridan qochib, faqatgina g'amxo'rlik va shinam oilaviy xotirjamlik orqali o'zingizni tiklab olishni istayapsiz.";
      else if (primary === 'black') resultText = "Hissiy ehtiyojlar: Sizning hozirgi holatingizda kuchli norozilik, rad etish va isyonga moyillik bor. Hozirgi vaziyatdan qat'iyan rozi emassiz va hamma narsani keskin o'zgartirishni, mavjud qoidalarni yo'q qilishni xohlayapsiz. Bu shuningdek, hayotdagi qandaydir yo'qotish yoki umidsizlikka nisbatan himoya reaksiyasi ham bo'lishi mumkin.";
      else if (primary === 'gray') resultText = "Hissiy ehtiyojlar: Siz o'zingizni tashqi ta'sirlardan qattiq himoya qilmoqchisiz. Mas'uliyatdan, qaror qabul qilishdan va hissiy bog'lanishlardan qochishni, \"ko'zga tashlanmaslik\"ni afzal ko'ryapsiz. Bu kuchli psixologik charchoq va barcha narsalardan o'zini izolyatsiya qilish (yopib olish) mexanizmi hisoblanadi.";

      resultText += "\n\n💡 (Ushbu xulosa Xalqaro Lüscher Metodikasi tahlilining chuqurlashtirilgan shakli bo'lib, hozirgi hissiy holatingizni va yashirin psixologik ehtiyojlaringizni aks ettiradi).";
      setColorResult(resultText);
    }
  };

  const resetColorTest = () => {
    setSelectedColors([]);
    setColorResult(null);
  };

  // --- WORRY SHREDDER LOGIC ---
  const handleShredWorry = () => {
    if (!worryText.trim()) return;
    setIsShredding(true);
    setTimeout(() => {
      setWorryText('');
      setShredderMessage("Xavotir parchalandi! Bu endi sizga zarar bera olmaydi.");
      setTimeout(() => {
        setIsShredding(false);
        setShredderMessage('');
      }, 3000);
    }, 1500); // 1.5s shredding animation
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
        const apiKey = customApiKey || localStorage.getItem('VITE_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;

        if (apiKey && apiKey.trim()) {
          const defaultModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
          const models = selectedModel ? [selectedModel, ...defaultModels] : defaultModels;
          let modelErrors: string[] = [];
          for (const modelName of models) {
            let attempts = 3;
            let responseText = '';
            for (let i = 0; i < attempts; i++) {
              try {
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const contents = [
                  {
                    role: 'user',
                    parts: [{ text: `Tizim: ${context}\nSiz Ruhshunos Sodiqsiz. Professional psixolog sifatida, foydalanuvchining his-tuyg'ularini tushungan holda ilmiy va amaliy psixologik maslahatlar bering. Javobingiz xushmuomala, qisqa va o'zbek tilida bo'lsin.` }]
                  },
                  ...chatHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                  })),
                  { role: 'user', parts: [{ text: userMsg }] }
                ];
                const response = await ai.models.generateContent({
                  model: modelName,
                  contents,
                  config: { systemInstruction: "Sizning ismingiz - Sodiq. Siz ilmiy-psixologik, o'ta xushmuomala, empatik va tushunadigan AI maslahatchisiz. Kognitiv-bixevioral terapiya (CBT) tamoyillari asosida ilmiy yondashing. O'zbek tilida javob bering." }
                });
                responseText = response.text || '';
                break;
              } catch (modelErr: any) {
                const errStr = modelErr?.message || modelErr?.toString() || '';
                const isUnavailable = errStr.includes('503') || errStr.includes('UNAVAILABLE');
                if (isUnavailable && i < attempts - 1) {
                  console.warn(`Model ${modelName} returned 503, retrying in 1.5s (attempt ${i + 1}/3)...`);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  continue;
                }
                console.warn(`Model ${modelName} failed: ${errStr}`);
                modelErrors.push(`${modelName}: ${errStr}`);
                break;
              }
            }
            if (responseText) {
              assistantText = responseText;
              success = true;
              break;
            }
          }
          if (!success) {
            assistantText = `⚠️ Ruhshunos AIga ulanib bo'lmadi. Tafsilotlar:\n${modelErrors.join('\n')}`;
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
    <div className="flex h-[100dvh] overflow-hidden bg-stone-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900" id="app_root">
      
      {/* DESKTOP SIDEBAR */}
      {activeTab !== 'welcome' && (
        <aside className="hidden md:flex flex-col w-64 border-r border-stone-200 bg-white shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-20 shrink-0" id="desktop_sidebar">
          <div className="p-5 border-b border-stone-100 flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 leading-none">Psixolog AI</h1>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Shaxsiy maslahatchi</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
            <button onClick={() => setActiveTab('tests')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'tests' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <Activity className="w-5 h-5" /> <span>Testlar</span>
            </button>
            <button onClick={() => setActiveTab('ai-chat')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'ai-chat' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <MessageSquare className={`w-5 h-5 ${activeTab === 'ai-chat' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Ruhshunos bilan Chat
            </button>
            <button onClick={() => setActiveTab('practices')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'practices' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <Wind className={`w-5 h-5 ${activeTab === 'practices' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Amaliyotlar
            </button>
            <button onClick={() => setActiveTab('face')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'face' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <Camera className={`w-5 h-5 ${activeTab === 'face' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Yuz Tahlili
            </button>
            <button onClick={() => setActiveTab('mood')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'mood' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <Smile className="w-5 h-5" /> <span>Kundalik</span>
            </button>
            <button onClick={() => setActiveTab('info')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'info' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <BookOpen className="w-5 h-5" /> <span>Maslahatlar</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm cursor-pointer ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-stone-50 hover:text-slate-800'}`}>
              <Settings className="w-5 h-5" /> <span>Sozlamalar</span>
            </button>
          </nav>

          <div className="p-4 border-t border-stone-100 bg-stone-50/50">
            <div className="bg-white border border-stone-200 rounded-2xl p-3 text-center shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
              <span className="text-[10px] text-slate-500 block mb-1">Favqulodda yordam telefoni</span>
              <span className="font-bold text-rose-600 text-sm block">1003 yoki 103</span>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 bg-stone-50/30 relative ${activeTab === 'welcome' ? 'md:bg-white' : ''}`}>
        
        {/* MOBILE HEADER - hidden for chat tab */}
        {activeTab !== 'welcome' && activeTab !== 'ai-chat' && (
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-xs">
                <Brain className="w-4 h-4" />
              </div>
              <h1 className="font-display font-bold text-sm text-slate-900">Psixolog AI</h1>
            </div>
            <a href="tel:1003" className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Yordam</span>
            </a>
          </header>
        )}

        {/* SCROLLABLE MAIN CONTENT */}
        <main
          className={`flex-1 w-full relative ${
            activeTab === 'ai-chat'
              ? 'overflow-hidden p-0'
              : `overflow-y-auto p-3 md:p-6 ${(isKeyboardOpen || isInputFocused) ? 'pb-4' : 'pb-24 md:pb-10'}`
          } custom-scrollbar`}
          id="main_content_container"
        >
          <div className={`mx-auto ${
            activeTab === 'ai-chat' ? 'h-full w-full relative' : 'max-w-4xl'
          }`}>
          
          {/* TAB 0: WELCOME SCREEN */}
          {activeTab === 'welcome' && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in text-center space-y-8" id="tab_welcome_view">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 blur-[80px] opacity-30 rounded-full animate-pulse-ring"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] flex items-center justify-center shadow-2xl mx-auto border-4 border-white/50 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Heart className="w-12 h-12 sm:w-16 sm:h-16 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4 max-w-lg z-10">
                <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tight">
                  Sizning <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Ruhiy</span> Hamrohingiz
                </h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                  Psixologik holatingizni tahlil qiling, stressni yengishni o'rganing va shaxsiy AI Ruhshunos Sodiq bilan sirlaringizni bo'lishing. Barchasi mutlaqo xavfsiz va maxfiy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto mb-8 z-10">
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 text-left">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700"><Shield className="w-4 h-4"/></div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">100%<br/>Maxfiy</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 text-left">
                  <div className="bg-teal-100 p-2 rounded-xl text-teal-700"><Brain className="w-4 h-4"/></div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">Aqlli<br/>Tahlillar</span>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('psixologik_welcomed', 'true');
                  setActiveTab('tests');
                }}
                className="group relative px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 w-full max-w-xs z-10 mx-auto"
              >
                <span>Boshlash</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* TAB 0.5: FACE ANALYSIS */}
          {activeTab === 'face' && (
            <div className="space-y-4 max-w-xl mx-auto animate-slide-up" id="tab_face_view">

              {/* Face Sub-Navigation */}
              <div className="flex bg-stone-100/80 p-1.5 rounded-full w-full mx-auto shadow-inner border border-stone-200/50">
                <button 
                  onClick={() => setFaceSubTab('camera')} 
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 ${faceSubTab === 'camera' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Kamera
                </button>
                <button 
                  onClick={() => setFaceSubTab('result')} 
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 ${faceSubTab === 'result' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Natija {faceResult && <span className="inline-block w-2 h-2 ml-1 rounded-full bg-rose-500 animate-pulse"></span>}
                </button>
              </div>

              {/* Result shown in RESULT tab */}
              {faceSubTab === 'result' && (
                <>
                {faceResult ? (
                  <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-emerald-100 animate-fade-in" id="face_result_card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                        <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Check className="w-4 h-4" /></span>
                        Tahlil Xulosasi
                      </h3>
                      <button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.setFont("helvetica", "bold");
                          doc.setFontSize(16);
                          doc.text("Psixolog AI - Yuz Tahlili", 20, 20);
                          doc.setFont("helvetica", "normal");
                          doc.setFontSize(11);
                          const lines = doc.splitTextToSize(faceResult || "", 170);
                          doc.text(lines, 20, 35);
                          doc.save(`Yuz_Tahlili_${new Date().toISOString().slice(0,10)}.pdf`);
                        }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line custom-scrollbar overflow-y-auto">
                      {faceResult}
                    </div>
                    <button
                      onClick={() => { setFaceResult(null); setFaceSubTab('camera'); }}
                      className="mt-3 text-xs text-slate-400 hover:text-rose-500 transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Yangi tahlil
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-10 bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-auto">
                     <div className="bg-stone-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-300">
                       <Camera className="w-8 h-8" />
                     </div>
                     <p className="text-slate-500 font-medium">Hozircha natijalar yo'q. Iltimos, kamera orqali yuzingizni tahlil qiling.</p>
                     <button onClick={() => setFaceSubTab('camera')} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-100">Kamerani ochish</button>
                  </div>
                )}
                </>
              )}

              {/* Camera shown in CAMERA tab */}
              {faceSubTab === 'camera' && (
                <>
                {faceError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-700 text-sm">Tahlilni amalga oshirib bo'lmadi</p>
                      <p className="text-xs text-rose-600 mt-1 leading-relaxed">{faceError}</p>
                      <button onClick={() => setFaceError(null)} className="text-xs text-rose-500 underline mt-2">Yopish</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-[40px] opacity-60"></div>
                  
                  <div className="text-center space-y-2 mb-4 relative z-10">
                    <div className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-slate-900">Yuz Fiziognomiyasi va Emotsiya</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Kameraga qarab turing. Sun'iy intellekt sizning yuz tuzilishingiz orqali psixologik holatingizni tahlil qiladi.
                    </p>
                  </div>

                  {/* Camera Container */}
                  <div className="relative w-full max-w-[250px] mx-auto aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-inner mb-4 border-2 border-stone-100">
                    {faceCameraActive ? (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 space-y-2 p-4 text-center">
                        <Camera className="w-8 h-8 opacity-30" />
                        <p className="text-[10px] font-medium leading-tight">Tahlilni boshlash uchun kamerani yoqing</p>
                      </div>
                    )}

                    {/* Scanning Overlay Animation */}
                    {faceLoading && (
                      <div className="absolute inset-0 z-10">
                        <div className="w-full h-full bg-emerald-500/20"></div>
                        <div className="w-full h-1 bg-emerald-400 absolute top-0 left-0 shadow-[0_0_15px_rgba(52,211,153,1)] animate-scan"></div>
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex justify-center gap-3">
                    {!faceCameraActive ? (
                      <button 
                        onClick={startCamera}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Kamerani Yoqish
                      </button>
                    ) : (
                      <button 
                        onClick={analyzeFace}
                        disabled={faceLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
                      >
                        {faceLoading ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />Tahlil qilinmoqda...</>
                        ) : (
                          <><Brain className="w-4 h-4" />Tahlil Qilish</>
                        )}
                      </button>
                    )}
                    {faceCameraActive && !faceLoading && (
                      <button 
                        onClick={stopCamera}
                        className="bg-stone-200 hover:bg-stone-300 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                      >
                        Bekor
                      </button>
                    )}
                  </div>
                </div>
                </>
              )}



            </div>
          )}

          {/* TAB 1: TESTS & DIAGNOSTICS */}
          {activeTab === 'tests' && (
            <div className="space-y-4 md:space-y-6" id="tab_tests_view">
              {/* Tests Sub-Navigation */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-stone-100/80 p-1.5 rounded-2xl w-full max-w-2xl mx-auto shadow-inner border border-stone-200/50">
                <button 
                  onClick={() => setTestsSubTab('eysenck')} 
                  className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${testsSubTab === 'eysenck' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Temperament
                </button>
                <button 
                  onClick={() => setTestsSubTab('stress')} 
                  className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${testsSubTab === 'stress' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Stress Testi
                </button>
                <button 
                  onClick={() => setTestsSubTab('color')} 
                  className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${testsSubTab === 'color' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Ranglar
                </button>
                <button 
                  onClick={() => setTestsSubTab('dashboard')} 
                  className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${testsSubTab === 'dashboard' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
                >
                  Natijalar {(eyResult || pssResult || colorResult) && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                </button>
              </div>

            {/* Top diagnostic state */}
            {testsSubTab === 'dashboard' && (
              <div className="animate-fade-in space-y-6">
              {(eyResult || pssResult || colorResult) ? (
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

                {/* Color Test Summary */}
                {colorResult && (
                  <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ranglar Psixologiyasi</span>
                     </div>
                     <p className="text-sm text-slate-700 leading-relaxed">{colorResult}</p>
                  </div>
                )}

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

                    </div>
                  </div>
                )}

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <strong>Muhim eslatma (Tibbiy disclaimer):</strong> Ushbu testlar shaxsiy psixologik tahlil uchun mo'ljallangan va professional tibbiy yoki klinik tashxis hisoblanmaydi. Agar siz o'zingizda jiddiy tushkunlik, kuchli stress yoki nevroz holatlarini sezsangiz mutaxassis psixoterapevtga murojaat qilishni tavsiya qilamiz.
                  </p>
                </div>

              </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto">
                   <div className="bg-stone-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-300">
                     <Award className="w-8 h-8" />
                   </div>
                   <p className="text-slate-500 font-medium">Hozircha natijalar yo&apos;q. Iltimos, testlardan birini yakunlang.</p>
                </div>
              )}
              </div>
            )}

            <div className="max-w-2xl mx-auto w-full">
              {/* EYSENCK TEST INTERFACE */}
              {testsSubTab === 'eysenck' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 flex flex-col justify-between group relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 animate-fade-in" id="eysenck_test_card">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100/80 to-teal-100/50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-125 group-hover:opacity-70 transition-all duration-700"></div>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 p-2.5 rounded-xl shadow-sm border border-emerald-100/50">
                        <Brain className="w-5 h-5" />
                      </div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">1. Temperament Testi</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                      Ushbu test shaxsiyatning 2 ta asosiy ustunini aniqlaydi: Muloqot xulqi (Ekstraversiya/Introversiya) va Hissiy barqarorlik (Neyrotizm). Iltimos, barcha 20 ta savolga faqat "Ha" yoki "Yo'q" shaklida samimiy javob bering.
                    </p>

                    {!eyCompleted ? (
                      <div className="space-y-4 pt-1" id="ey_question_area">
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
                        <div className="p-4 bg-white/80 rounded-xl border border-stone-100 min-h-[80px] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          <p className="font-bold text-sm md:text-base text-slate-800 text-center leading-relaxed">
                            {EYSENCK_QUESTIONS[eyQuestionIndex].text}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                          <button 
                            id="btn_ey_yes"
                            onClick={() => handleEyAnswer(true)}
                            className="py-3 sm:py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm transition-all duration-300 cursor-pointer shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4 hidden sm:block" /> Ha
                          </button>
                          <button 
                            id="btn_ey_no"
                            onClick={() => handleEyAnswer(false)}
                            className="py-3 sm:py-3.5 rounded-2xl bg-white border-2 border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-slate-700 font-bold text-sm transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
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

                {/* TEMPERAMENT INFO TABS */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 animate-fade-in" id="temp_info_box">
                  <h3 className="font-bold text-slate-800 mb-4 text-center">Temperament turlari haqida ma'lumot</h3>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-5 border-b border-stone-100 pb-4">
                    <button onClick={() => setTempInfoTab('sangvinik')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tempInfoTab === 'sangvinik' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'bg-stone-50 text-slate-500 hover:bg-stone-100'}`}>Sangvinik</button>
                    <button onClick={() => setTempInfoTab('xolerik')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tempInfoTab === 'xolerik' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'bg-stone-50 text-slate-500 hover:bg-stone-100'}`}>Xolerik</button>
                    <button onClick={() => setTempInfoTab('flegmatik')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tempInfoTab === 'flegmatik' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'bg-stone-50 text-slate-500 hover:bg-stone-100'}`}>Flegmatik</button>
                    <button onClick={() => setTempInfoTab('melanxolik')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tempInfoTab === 'melanxolik' ? 'bg-rose-100 text-rose-800 shadow-sm' : 'bg-stone-50 text-slate-500 hover:bg-stone-100'}`}>Melanxolik</button>
                  </div>

                  <div className="text-sm text-slate-600 leading-relaxed min-h-[100px] flex items-center justify-center p-2">
                    {tempInfoTab === 'sangvinik' && (
                      <p className="animate-fade-in"><strong>Sangvinik:</strong> Juda harakatchan, quvnoq va ta'sirchan odam. Ular osonlik bilan yangi odamlar bilan tillashib ketadilar, optimistik qarashga ega. Qiyinchiliklarni oson yengib o'tadilar va muloqotni sevishadi.</p>
                    )}
                    {tempInfoTab === 'xolerik' && (
                      <p className="animate-fade-in"><strong>Xolerik:</strong> Tezkor, ba'zan qiziqqon va kuchli emotsional odam. Ular maqsad sari qat'iy harakat qiladilar, ammo asab tizimi tez qo'zg'aluvchan bo'lgani uchun kayfiyati tez-tez o'zgarib turadi.</p>
                    )}
                    {tempInfoTab === 'flegmatik' && (
                      <p className="animate-fade-in"><strong>Flegmatik:</strong> Xotirjam, mulohazali va sabrli insonlar. Ular shoshqaloqlikni yomon ko'rishadi, doim barqaror va ishonchli. Atrofdagi o'zgarishlarga tez moslashishi qiyin, ammo ishni oxiriga yetkazadi.</p>
                    )}
                    {tempInfoTab === 'melanxolik' && (
                      <p className="animate-fade-in"><strong>Melanxolik:</strong> Chuqur hissiyotli, sezgir va ijodkor odamlar. Ular tashqi tomondan tinch ko'rinsada, ichida ko'p narsani his qiladilar. Shovqinni uncha yoqtirmaydi, lekin juda mehribon va e'tiborli bo'lishadi.</p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* STRESS TEST INTERFACE */}
              {testsSubTab === 'stress' && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 flex flex-col justify-between group relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 animate-fade-in" id="stress_test_card">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/80 to-rose-100/50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-125 group-hover:opacity-70 transition-all duration-700"></div>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-rose-400"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 p-2.5 rounded-xl shadow-sm border border-amber-100/50">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">2. Stress Darajasi</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                    Ushbu xalqaro miqyosda tan olingan so&apos;rovnoma (Perceived Stress Scale) orqali oxirgi 1 oy davomidagi hayotiy stress darajangizni o&apos;lchang. Har bir holat uchun qanchalik tez-tez yuz berishini belgilang (0: Hech qachon, 4: Juda tez-tez).
                  </p>

                  {!pssCompleted ? (
                    <div className="space-y-4 pt-1" id="pss_question_area">
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
                      <div className="p-4 bg-white/80 rounded-xl border border-stone-100 min-h-[80px] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <p className="font-bold text-sm md:text-base text-slate-800 text-center leading-relaxed">
                          {PSS_QUESTIONS[pssQuestionIndex].text}
                        </p>
                      </div>

                      {/* 5 Options */}
                      <div className="flex flex-col gap-1.5">
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
                            className="w-full text-left py-2 px-3 rounded-xl bg-white/80 border border-stone-200 hover:border-emerald-400 hover:shadow-sm hover:text-emerald-800 transition-all text-xs font-semibold text-slate-700 cursor-pointer active:scale-95 group flex items-center justify-between"
                          >
                            <span>{opt.label}</span>
                            <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[9px] font-bold text-stone-400 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">{opt.val}</span>
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
              )}
              {/* COLOR PSYCHOLOGY TEST INTERFACE */}
              {testsSubTab === 'color' && (
              <div className="bg-white rounded-3xl p-5 sm:p-7 space-y-5 flex flex-col justify-between group relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 animate-fade-in" id="color_test_card">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/80 to-purple-100/50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:scale-125 group-hover:opacity-70 transition-all duration-700"></div>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 p-2.5 rounded-xl shadow-sm border border-blue-100/50">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">3. Ranglar Psixologiyasi Testi</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                    Ushbu test Maks Lyusher (Max Lüscher) uslubiga asoslangan bo&apos;lib, sizning yashirin ruhiy va hissiy ehtiyojlaringizni aniqlab beradi. Iltimos, o&apos;ylamasdan hozirgi vaqtda o&apos;zingizga eng yoqadigan uchta rangni ketma-ket tanlang.
                  </p>

                  {!colorResult ? (
                    <div className="space-y-4 pt-1" id="color_question_area">
                      {/* Status */}
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                        <span>Tanlangan ranglar: {selectedColors.length} / 3</span>
                      </div>

                      {/* Color grid */}
                      <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-2">
                        {LUSCHER_COLORS.map(colorObj => {
                          const isSelected = selectedColors.includes(colorObj.id);
                          return (
                            <button
                              key={colorObj.id}
                              onClick={() => handleColorSelect(colorObj.id)}
                              disabled={isSelected}
                              className={`w-full aspect-square rounded-2xl ${colorObj.color} flex flex-col items-center justify-center transition-all duration-300 shadow-sm
                                ${isSelected ? 'opacity-20 scale-95 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-emerald-400 cursor-pointer'}
                              `}
                            >
                               {isSelected && <Check className="w-6 h-6 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2" id="color_finished_area">
                      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">Natija:</strong>
                        {colorResult}
                      </div>
                      <button 
                        onClick={resetColorTest}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition pt-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Qaytadan tanlash</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI CONSULTANT CHAT - Full messenger layout */}
        {activeTab === 'ai-chat' && (
          <div className={`absolute inset-0 flex flex-col ${(isKeyboardOpen || isInputFocused) ? 'pb-0' : 'pb-[76px]'} md:pb-0`} id="tab_chat_view">
            <div className="flex flex-col h-full bg-white" id="chat_box_interface">

              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-bold text-base relative shadow">
                    S
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">Sodiq <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold ml-1">AI Ruhshunos</span></h3>
                    <p className="text-[10px] text-emerald-600 font-semibold">Online · Tinglashga tayyor</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowChatInfo(p => !p)}
                    className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <ChevronDown className={`w-3 h-3 transition-transform ${showChatInfo ? 'rotate-180' : ''}`} />
                  </button>
                  {showChatInfo && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-50 space-y-2">
                      <p className="text-[10px] text-slate-500">Test natijalaringizni Sodiqqa yuboring:</p>
                      {eyResult ? (
                        <div className="text-[11px] bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                          <strong className="block text-emerald-800">Temperament:</strong>
                          <span className="text-emerald-700">{eyResult.title}</span>
                        </div>
                      ) : <div className="text-[10px] text-slate-400 bg-stone-50 rounded-xl p-2 border border-dashed border-stone-200">Temperament testi topshirilmagan</div>}
                      {pssResult ? (
                        <div className={`text-[11px] rounded-xl p-2 border ${pssResult.color}`}>
                          <strong className="block">Stress:</strong> {pssResult.level} ({pssResult.score}/40)
                        </div>
                      ) : <div className="text-[10px] text-slate-400 bg-stone-50 rounded-xl p-2 border border-dashed border-stone-200">Stress testi topshirilmagan</div>}
                      {(eyResult || pssResult) && (
                        <button onClick={() => {
                          let t = "Mening natijalarim:\n";
                          if (eyResult) t += `- Temperament: ${eyResult.title}\n`;
                          if (pssResult) t += `- Stress: ${pssResult.level} (${pssResult.score}/40)\n`;
                          t += "Tavsiya bera olasizmi?";
                          setChatInput(t); setShowChatInfo(false);
                        }} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-bold active:scale-95">
                          Maydoniga joylash
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages area - flex-1 scrolls */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#F0F2F5]" id="chat_messages_area">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} id={`chat_msg_${idx}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-white text-slate-800 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                      <span className="text-xs text-slate-500">Sodiq yozmoqda</span>
                      <span className="flex gap-1">
                        {[0, 0.15, 0.3].map((d, i) => (
                          <span key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: `${d}s`}}></span>
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input - always at bottom, keyboard pushes it up naturally via dvh */}
              <form onSubmit={sendChatMessage} className="flex gap-2 px-3 py-2.5 bg-white border-t border-stone-200 shrink-0" id="chat_input_form">
                <input
                  id="input_chat_text"
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Xabar yozing..."
                  autoComplete="off"
                  className="flex-1 bg-stone-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 text-slate-800"
                />
                <button
                  id="btn_chat_send"
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-emerald-600 disabled:opacity-40 text-white w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICES */}
        {activeTab === 'practices' && (
          <div className="max-w-2xl mx-auto space-y-6 w-full animate-slide-up">
            {/* Practices Sub-Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-stone-100/80 p-1.5 rounded-2xl w-full mx-auto shadow-inner border border-stone-200/50">
              <button 
                onClick={() => setPracticesSubTab('breathing')} 
                className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${practicesSubTab === 'breathing' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Nafas Mashqi
              </button>
              <button 
                onClick={() => setPracticesSubTab('shredder')} 
                className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${practicesSubTab === 'shredder' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Xavotirni Parchalash
              </button>
              <button 
                onClick={() => setPracticesSubTab('affirmations')} 
                className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${practicesSubTab === 'affirmations' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Afirmatsiyalar
              </button>
              <button 
                onClick={() => setPracticesSubTab('gratitude')} 
                className={`flex-shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${practicesSubTab === 'gratitude' ? 'bg-white text-emerald-700 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Minnadorchilik
              </button>
            </div>

            {/* Breathing Exercise */}
            {practicesSubTab === 'breathing' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 text-center space-y-4 animate-fade-in relative overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100" id="tab_breathing_view">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full blur-[60px] opacity-60 pointer-events-none"></div>
                <div className="space-y-2 relative z-10">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Wind className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Nafas Mashqi (4-7-8)</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Ushbu mashq asab tizimini tinchlantirish, yurak urishini me'yorga keltirish va o'tkir stress (vahima) holatidan tezda chiqish uchun eng samarali usullardan biridir. 4 soniya nafas oling, 7 soniya ushlab turing va 8 soniya nafas chiqaring.
                  </p>
                </div>

                {/* Breathing Animation Canvas */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center animate-float relative z-10 my-4" id="breathing_visualizer">
                  {/* Outer wave ripples */}
                  <div className={`absolute inset-0 rounded-full border-2 border-emerald-300/30 transition-all duration-1000 ${
                    breathingPhase === 'inhale' ? 'scale-125 opacity-100' : 'scale-90 opacity-0'
                  }`}></div>
                  <div className={`absolute inset-0 rounded-full border border-teal-300/40 transition-all duration-1000 delay-150 ${
                    breathingPhase === 'inhale' ? 'scale-110 opacity-100' : 'scale-90 opacity-0'
                  }`}></div>

                  {/* Breathing Ball */}
                  <div 
                    className={`rounded-full flex flex-col items-center justify-center text-slate-900 transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] ${
                      breathingPhase === 'inhale' ? 'w-36 h-36 bg-gradient-to-tr from-emerald-100 to-teal-50 duration-[4000ms] shadow-[0_0_60px_rgba(16,185,129,0.4)]' :
                      breathingPhase === 'hold' ? 'w-36 h-36 bg-gradient-to-tr from-teal-100 to-emerald-100 duration-[7000ms] shadow-[0_0_50px_rgba(20,184,166,0.5)]' :
                      breathingPhase === 'exhale' ? 'w-24 h-24 bg-gradient-to-br from-emerald-50 to-white duration-[8000ms]' :
                      'w-24 h-24 bg-white border-2 border-emerald-100'
                    }`}
                    id="breathing_ball"
                  >
                    {breathingPhase === 'idle' ? (
                      <div className="space-y-1" id="breath_idle_ui">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Tayyormisiz?</p>
                        <span className="font-bold text-slate-800 text-xs">Boshlash</span>
                      </div>
                    ) : (
                      <div className="space-y-1" id="breath_active_ui">
                        <p className="text-[9px] text-emerald-700 uppercase font-extrabold tracking-widest animate-pulse">
                          {breathingPhase === 'inhale' ? "Nafas oling" :
                           breathingPhase === 'hold' ? "Nafasni ushlang" :
                           "Nafas chiqaring"}
                        </p>
                        <span className="font-black text-2xl text-slate-900 block">{breathingTimer}s</span>
                        <p className="text-[9px] text-slate-500">Sikl: {breathingCycles}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control buttons */}
                <div className="space-y-3 relative z-10 max-w-[200px] mx-auto" id="breathing_controls">
                  {breathingPhase === 'idle' ? (
                    <button
                      id="btn_start_breathing"
                      onClick={startBreathing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer active:scale-98 w-full"
                    >
                      Boshlash
                    </button>
                  ) : (
                    <button
                      id="btn_stop_breathing"
                      onClick={stopBreathing}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-6 py-2.5 rounded-xl text-sm transition border border-rose-200 cursor-pointer active:scale-98 w-full"
                    >
                      To'xtatish
                    </button>
                  )}
                </div>

                {/* Instructions Row */}
                <div className="flex gap-2 justify-center pt-2 relative z-10" id="breathing_instruction_box">
                  <div className="flex-1 bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                    <span className="font-bold text-slate-800 block text-[10px]">1. Olish(4s)</span>
                  </div>
                  <div className="flex-1 bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                    <span className="font-bold text-slate-800 block text-[10px]">2. Ushlash(7s)</span>
                  </div>
                  <div className="flex-1 bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
                    <span className="font-bold text-slate-800 block text-[10px]">3. Chiqarish(8s)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Anxiety Shredder */}
            {practicesSubTab === 'shredder' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 text-center space-y-4 animate-fade-in relative overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100" id="tab_shredder_view">
                <div className="space-y-2 relative z-10">
                  <div className="bg-gradient-to-br from-rose-100 to-orange-100 text-rose-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Xavotirni Parchalash</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Psixologiyada "Kognitiv tozalash" deb ataluvchi bu usul sizga miyangizdagi ortiqcha tashvishlarni jismoniy harakat orqali yo'qotish hissini beradi. Sizni qiynayotgan xavotirlarni yozing va parchalab tashlang.
                  </p>
                </div>

                <div className="relative max-w-sm mx-auto mt-6 pb-10" id="shredder_machine">
                  {/* Paper to be shredded */}
                  <div className={`transition-all duration-700 ease-in-out origin-bottom
                    ${isShredding ? 'opacity-0 scale-y-0 -translate-y-2' : 'opacity-100 scale-y-100'}
                  `}>
                    <textarea
                      value={worryText}
                      onChange={(e) => setWorryText(e.target.value)}
                      disabled={isShredding}
                      placeholder="Men ...dan xavotirdaman."
                      className="w-full h-28 p-4 rounded-t-xl border border-stone-200 bg-[#fffef0] text-stone-800 text-sm shadow-inner focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200 transition-all resize-none custom-scrollbar font-medium leading-relaxed"
                    />
                  </div>

                  {/* Shredder Machine visual */}
                  <div className={`h-10 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-b-xl shadow-lg flex items-center justify-around px-2 border-t-4 border-slate-900 overflow-hidden relative z-20 ${isShredding ? 'animate-vibrate' : ''}`}>
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-0.5 h-6 bg-slate-600 rounded-full" />
                    ))}
                  </div>

                  {/* Paper strips falling out */}
                  {isShredding && (
                    <div className="absolute top-full left-0 right-0 pointer-events-none z-10 flex justify-center gap-0.5 flex-wrap">
                      {[...Array(24)].map((_, i) => {
                        const rx = (Math.random() - 0.5) * 180;
                        const ry = 60 + Math.random() * 120;
                        const rr = (Math.random() - 0.5) * 60;
                        const delay = Math.random() * 0.6;
                        const colors = ['bg-rose-300', 'bg-orange-200', 'bg-amber-100', 'bg-slate-200', 'bg-red-200', 'bg-yellow-200'];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        return (
                          <div
                            key={i}
                            className={`${color} rounded-[1px] animate-shred`}
                            style={{
                              width: '6px',
                              height: `${16 + Math.random() * 20}px`,
                              '--scatter-x': rx + 'px',
                              '--scatter-y': ry + 'px',
                              '--scatter-r': rr + 'deg',
                              animationDelay: `${delay}s`,
                              animationDuration: '1.2s'
                            } as React.CSSProperties}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 max-w-sm mx-auto z-20 relative">
                  {shredderMessage ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 animate-slide-up">
                      <Check className="w-4 h-4" /> {shredderMessage}
                    </div>
                  ) : (
                    <button
                      onClick={handleShredWorry}
                      disabled={!worryText.trim() || isShredding}
                      className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm w-full cursor-pointer flex justify-center items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Yo'q Qilish
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Affirmations */}
            {practicesSubTab === 'affirmations' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 text-center space-y-4 animate-fade-in relative overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100" id="tab_affirmations_view">
                <div className="space-y-2 relative z-10">
                  <div className="bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Star className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Kunlik Afirmatsiyalar</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Ovoz chiqarib o'qib, o'zingizga ishonchni oshiring.
                  </p>
                </div>

                <div className="relative max-w-sm mx-auto min-h-[120px] flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl shadow-sm group">
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                    {currentAffirmation || "Afirmatsiyani olish uchun pastdagi tugmani bosing!"}
                  </p>
                </div>

                <div className="max-w-[200px] mx-auto">
                  <button
                    onClick={() => setCurrentAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)])}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm w-full cursor-pointer flex justify-center items-center gap-2 active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Yangi Afirmatsiya
                  </button>
                </div>
              </div>
            )}

            {/* Gratitude Journal */}
            {practicesSubTab === 'gratitude' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 text-center space-y-4 animate-fade-in relative overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100" id="tab_gratitude_view">
                <div className="space-y-2 relative z-10">
                  <div className="bg-gradient-to-br from-pink-100 to-rose-50 text-pink-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Heart className="w-5 h-5 fill-pink-200" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Minnadorchilik Kundaligi</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Bugun qaysi 3 ta narsa uchun xursandsiz? Minnadorchilik tushkunlikni yengishga yordam beradi.
                  </p>
                </div>

                <div className="max-w-sm mx-auto space-y-2 mt-4 text-left">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center shrink-0 mt-1 sm:mt-0 shadow-sm text-xs sm:text-sm">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={gratitudeEntries[index]}
                        onChange={(e) => {
                          const newEntries = [...gratitudeEntries];
                          newEntries[index] = e.target.value;
                          setGratitudeEntries(newEntries);
                          setGratitudeSaved(false);
                        }}
                        placeholder="Men shuning uchun minnadorman..."
                        className="flex-1 p-2 sm:p-3 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all bg-stone-50"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 max-w-sm mx-auto">
                  {gratitudeSaved ? (
                    <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 text-pink-700 text-xs font-semibold flex items-center justify-center gap-2 animate-slide-up">
                      <Check className="w-4 h-4" /> Saqlandi!
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (gratitudeEntries.some(e => e.trim())) {
                          setGratitudeSaved(true);
                        }
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm w-full cursor-pointer flex justify-center items-center gap-2"
                    >
                      <Heart className="w-4 h-4" /> Kundalikni Saqlash
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* TAB 4: MOOD DIARY */}
        {activeTab === 'mood' && (
          <div className="animate-slide-up max-w-2xl mx-auto space-y-6 w-full" id="tab_mood_view">
            {/* Mood Sub-Navigation */}
            <div className="flex bg-stone-100/80 p-1.5 rounded-2xl sm:rounded-full w-full mx-auto shadow-inner border border-stone-200/50">
              <button 
                onClick={() => setMoodSubTab('log')} 
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-300 ${moodSubTab === 'log' ? 'bg-white text-amber-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Kayfiyat kiritish
              </button>
              <button 
                onClick={() => setMoodSubTab('history')} 
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl sm:rounded-full transition-all duration-300 ${moodSubTab === 'history' ? 'bg-white text-amber-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-stone-200/50'}`}
              >
                Tarix va Dinamika
              </button>
            </div>

            {/* New entry logging */}
            {moodSubTab === 'log' && (
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-6 h-fit relative overflow-hidden animate-fade-in" id="mood_form_box">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -z-10"></div>
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="bg-amber-50 text-amber-600 p-2 rounded-xl">
                  <Smile className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">Bugungi kayfiyatingiz</h3>
              </div>

              {/* Mood Emojis Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">Holatni tanlang:</label>
                <div className="grid grid-cols-3 gap-1.5" id="mood_emoji_selector">
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
                      className={`p-1.5 rounded-xl border text-center transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
                        selectedMood === item.label 
                          ? 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white text-emerald-900 font-bold scale-105 shadow-md ring-1 ring-emerald-500/20' 
                          : 'border-stone-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className="text-2xl filter drop-shadow-sm">{item.emoji}</span>
                      <span className="text-[9px] leading-tight block truncate w-full">{item.label}</span>
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
            )}

            {/* Mood History */}
            {moodSubTab === 'history' && (
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-5 h-fit animate-fade-in" id="mood_history_box">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">Kayfiyat tarixi</h3>
              </div>

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

              {/* Saved lists */}
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-5" id="mood_history_list">
                <h3 className="font-bold text-base text-slate-900 border-b border-stone-100 pb-3">Sizning kundalik ruhiy tarixingiz</h3>
                {moodLogs.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar" id="mood_logs_scroller">
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
            )}
          </div>
        )}

        {/* TAB 5: SCIENTIFIC KNOWLEDGE HUB & RECOMMENDATIONS */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-fade-in max-w-6xl mx-auto" id="tab_info_view">
            
            {/* EMERGENCY TICKER in INFO tab */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 max-w-3xl mx-auto shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 text-rose-600 p-2.5 rounded-full flex-shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-800 text-sm">Shoshilinch Ruhiy Yordam</h3>
                  <p className="text-xs text-rose-600 mt-0.5">O&apos;zingizni yomon his qilayotgan bo&apos;lsangiz yoki tezkor psixologik yordam kerak bo&apos;lsa, mutaxassislarga murojaat qiling.</p>
                </div>
              </div>
              <a href="tel:1003" className="flex items-center justify-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-sm w-full sm:w-auto flex-shrink-0">
                1003 ga qong&apos;iroq qilish
              </a>
            </div>

            <div className="text-center space-y-3 max-w-2xl mx-auto mt-4">
              <h2 className="font-display font-bold text-3xl text-slate-900">Psixologiya Hubi</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Platformadagi har bir maslahat va metodlar xalqaro Kognitiv-Xulq-atvor Terapiyasi (CBT), Gumanistik psixologiya va neyrobiologiya qonuniyatlariga tayanadi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" id="articles_grid">
              {/* Card 1 */}
              <div className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-5 group relative overflow-hidden" id="article_card_1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">Kognitiv Xatolar Nima va Ularni Qanday Tuzatish Kerak?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bizning ongimiz ko&apos;pincha asossiz xavotirlar yaratadi. Bunday holatlar &quot;kognitiv xatolar&quot; deb ataladi. Masalan, falokatlashtirish (hamma narsani eng yomon tusda ko&apos;rish) yoki zehn o&apos;qish.
                </p>
                <div className="pt-4 border-t border-stone-100 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <strong className="text-emerald-700 block mb-1">CBT Yechimi:</strong> Fikrning haqiqatga mosligini so&apos;roq qiling. &quot;Bunga dalilim bormi?&quot; deb o&apos;zingizdan so&apos;rang.
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-5 group relative overflow-hidden" id="article_card_2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="bg-gradient-to-br from-teal-100 to-teal-50 text-teal-700 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">Hissiy Intellekt (EQ)ni Rivojlantirish Yo&apos;llari</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Hissiy intellekt - bu o&apos;z his-tuyg&apos;ularingizni anglash va ularni oqilona boshqarish qobiliyatidir. Bu boshqalar bilan mustahkam munosabatlar qurishning asosidir.
                </p>
                <div className="pt-4 border-t border-stone-100 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <strong className="text-teal-700 block mb-1">EQ Amaliyoti:</strong> Har kuni hissiyotlaringizni yozib boring, dilingizni ochiq suhbatlar orqali bo&apos;lishing.
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 space-y-5 group relative overflow-hidden" id="article_card_3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100">
                  <Wind className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">Stressni Jismoniy Tinchlantirish Neyrobiologiyasi</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Stress boshlanganda tana adreanalin ajratadi. Biz chuqur nafas olganimizda, adashgan nerv (vagus nerve) faollashib, pulsni sekinlashtiradi va miyaga xavfsizlik signalini yuboradi.
                </p>
                <div className="pt-4 border-t border-stone-100 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <strong className="text-amber-700 block mb-1">Nafas Yechimi:</strong> 4-7-8 nafas mashqini kuniga 2 marta muntazam takrorlang.
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

        {/* TAB 6: SETTINGS / STORAGE MANAGEMENT */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 w-full animate-slide-up" id="tab_settings_view">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-stone-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">Xotira va Maxfiylik</h2>
                  <p className="text-xs text-slate-500 mt-1">Sizning ma'lumotlaringiz xavfsizligi</p>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 text-xs sm:text-sm leading-relaxed mb-8 flex gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>100% Maxfiy:</strong> Barcha test natijalaringiz, kundaligingiz va chat xabarlaringiz faqatgina ushbu brauzerning lokal xotirasida (Local Storage) saqlanadi. Ular hech qanday serverga yuborilmaydi. Agar siz boshqa qurilmadan kirsangiz, ma'lumotlarni ko'rmaysiz.
                </p>
              </div>



              <div className="bg-white border border-stone-100 rounded-2xl p-5 mb-8 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Xotira sarfi</h3>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500">
                    Ishlatilgan: {(storageUsage.bytes / 1024).toFixed(1)} KB | Qolgan: {((5 * 1024 * 1024 - storageUsage.bytes) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${storageUsage.percent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.max(2, storageUsage.percent)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400">
                  {storageUsage.percent > 80 
                    ? "Ogohlantirish: Xotira to'lish arafasida. Ba'zi eski ma'lumotlarni o'chirishni maslahat beramiz." 
                    : "Xotira yetarli darajada. Barcha ma'lumotlar xavfsiz saqlanmoqda."}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Ma'lumotlarni boshqarish</h3>
                
                <div className="grid gap-3">
                  <button 
                    onClick={() => {
                      const data = {
                        eyResult, pssResult, moodLogs, chatHistory, gratitudeEntries, selectedColors, colorResult
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `psixologik_malumotlar_${new Date().toISOString().slice(0,10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition group cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-800 block group-hover:text-emerald-700">Ma'lumotlarni yuklab olish</span>
                      <span className="text-[11px] text-slate-500">Barcha natijalaringizni .json fayl shaklida saqlang</span>
                    </div>
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button 
                    onClick={() => {
                      if(window.confirm("Chat tarixini o'chirishga ishonchingiz komilmi? Sodiq AI sizning avvalgi xabarlaringizni unutadi.")) {
                        setChatHistory([{ role: 'assistant', text: "Salom! Men sizning shaxsiy psixologik maslahatchingiz - Ruhshunos Sodiqman. Bu yerda siz o'zingizni xavfsiz his qilishingiz mumkin..." }]);
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50/50 transition group cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-800 block group-hover:text-rose-700">Chat tarixini tozalash</span>
                      <span className="text-[11px] text-slate-500">Sodiq AI bilan bo'lgan suhbatlarni o'chirish</span>
                    </div>
                    <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                  </button>

                  <button 
                    onClick={() => {
                      if(window.confirm("Test natijalarini o'chirishga ishonchingiz komilmi?")) {
                        setEyCompleted(false); setEyResult(null); setEyAnswers([]); setEyQuestionIndex(0);
                        setPssCompleted(false); setPssResult(null); setPssAnswers([]); setPssQuestionIndex(0);
                        setColorResult(null); setSelectedColors([]);
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50/50 transition group cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-800 block group-hover:text-rose-700">Test natijalarini tozalash</span>
                      <span className="text-[11px] text-slate-500">Barcha psixologik test ko'rsatkichlarini nollash</span>
                    </div>
                    <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                  </button>

                  <button 
                    onClick={() => {
                      if(window.confirm("DIQQAT! Ilovadagi barcha ma'lumotlarni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 bg-rose-50/30 hover:bg-rose-100 transition group cursor-pointer text-left mt-2"
                  >
                    <div>
                      <span className="font-bold text-sm text-rose-700 block">Barcha ma'lumotlarni o'chirish</span>
                      <span className="text-[11px] text-rose-600/80">Ilovani to'liq boshlang'ich holatiga qaytarish (Reset App)</span>
                    </div>
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        {activeTab !== 'welcome' && !isKeyboardOpen && !isInputFocused && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 pb-safe z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]" id="mobile_bottom_nav">
          <div className="flex items-center justify-around p-1.5 px-2">
            <button onClick={() => setActiveTab('tests')} className={`flex flex-col items-center justify-center w-16 p-1.5 rounded-xl transition-all ${activeTab === 'tests' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Activity className={`w-5 h-5 mb-1 ${activeTab === 'tests' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-bold">Testlar</span>
            </button>
            <button onClick={() => setActiveTab('ai-chat')} className={`flex flex-col items-center justify-center w-16 p-1.5 rounded-xl transition-all ${activeTab === 'ai-chat' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <MessageSquare className={`w-5 h-5 mb-1 ${activeTab === 'ai-chat' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-bold">Chat</span>
            </button>
            <button onClick={() => setActiveTab('practices')} className={`flex flex-col items-center justify-center w-14 p-1 rounded-xl transition-all ${activeTab === 'practices' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Wind className={`w-5 h-5 mb-1 ${activeTab === 'practices' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-bold">Amaliyot</span>
            </button>
            <button onClick={() => setActiveTab('face')} className={`flex flex-col items-center justify-center w-14 p-1 rounded-xl transition-all ${activeTab === 'face' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Camera className={`w-5 h-5 mb-1 ${activeTab === 'face' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-bold">Yuz</span>
            </button>
            <button onClick={() => setActiveTab('mood')} className={`flex flex-col items-center justify-center w-16 p-1.5 rounded-xl transition-all ${activeTab === 'mood' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Smile className={`w-5 h-5 mb-1 ${activeTab === 'mood' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-bold">Kayfiyat</span>
            </button>
            <button onClick={() => setActiveTab('info')} className={`flex flex-col items-center justify-center w-16 p-1.5 rounded-xl transition-all ${activeTab === 'info' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'info' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-bold">Ma'lumot</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-16 p-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Settings className={`w-5 h-5 mb-1 ${activeTab === 'settings' ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-bold">Sozlamalar</span>
            </button>
          </div>
        </nav>
        )}
        {/* Face Analysis Done Modal at Global Level */}
        {showFaceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">Tahlil Yakunlandi</h3>
                <p className="text-sm text-slate-500">Natija "Natija" bo'limiga yuklandi. Ko'rish uchun quyidagi tugmani bosing.</p>
              </div>
              <button 
                onClick={() => {
                  setShowFaceModal(false);
                  setActiveTab('face');
                  setFaceSubTab('result');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-md active:scale-95"
              >
                Natijani Ko'rish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
