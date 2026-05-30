import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  User, 
  BookOpen, 
  Home, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw,
  Loader2,
  Send,
  Wand2,
  Smile,
  Clock,
  Heart,
  Sparkles,
  TreePine,
  ArrowRight,
  Copy,
  CheckCheck
} from 'lucide-react';

const apiKey = "";

// ─── BRUTALIST BUTTON ────────────────────────────────────────────────────────
const BrutalButton = ({ children, onClick, className = "", variant = "primary", disabled = false, icon: Icon }) => {
  const themes = {
    primary: "bg-[#FF3B00] text-white border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    secondary: "bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    accent: "bg-[#FFED00] text-black border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:-translate-x-[2px] hover:-translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    ghost: "bg-transparent text-black border-[3px] border-black hover:bg-black hover:text-white"
  };

  return (
    <button
      className={`transition-all duration-100 flex items-center justify-center gap-2 font-black uppercase tracking-widest py-4 px-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 ${themes[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ fontFamily: "'Arial Black', 'Haettenschweiler', 'Impact', sans-serif", letterSpacing: '0.1em' }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('landing');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    style: 'safe',
    target: { personality: '', relationship: '' }
  });
  
  const [generatedExcuse, setGeneratedExcuse] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const categories = [
    { id: 'Work', icon: <Briefcase size={18} />, tag: '01' },
    { id: 'Personal', icon: <User size={18} />, tag: '02' },
    { id: 'College', icon: <BookOpen size={18} />, tag: '03' },
    { id: 'Home', icon: <Home size={18} />, tag: '04' },
    { id: 'Other', icon: <MessageSquare size={18} />, tag: '05' }
  ];

  const fetchGemini = async (prompt, systemInstruction = "") => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) {
      throw e;
    }
  };

  const generateExcuse = async () => {
    setLoading(true);
    setError(null);
    const systemPrompt = `You are "I Can Explain". Create a believable first-person alibi. 
    Format: The alibi text first. 
    Then exactly one line break.
    Then "TIP: [One short tactical sentence]". 
    No long explanations.`;
    
    const query = `Cat: ${formData.category}, Situation: ${formData.description}, Mode: ${formData.style}, Target: ${formData.target.relationship} (${formData.target.personality}).`;
    
    try {
      const result = await fetchGemini(query, systemPrompt);
      setGeneratedExcuse(result);
      setStep(5);
    } catch (err) {
      setError("Failed to generate alibi. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const morphTone = async (tone) => {
    setLoading(true);
    const prompt = `Rewrite this excuse to sound ${tone}: "${generatedExcuse}". Keep facts, change vibe. Follow original format (excuse + short tip).`;
    try {
      const result = await fetchGemini(prompt, "You are a master of social tone.");
      setGeneratedExcuse(result);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    const simulationPrompt = `Roleplay as: ${formData.target.relationship || 'target'}. You just heard the excuse: "${generatedExcuse.split('TIP:')[0]}". 
    Respond shortly as this character would. Use simple language.`;

    try {
      const result = await fetchGemini(`${chatHistory.map(m=>m.text).join('\n')}\nMe: ${userMsg}`, simulationPrompt);
      setChatHistory(prev => [...prev, { role: 'target', text: result }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'target', text: "Target is silent..." }]);
    }
  };

  const reset = () => {
    setStep(1);
    setFormData({ category: '', description: '', style: 'safe', target: { personality: '', relationship: '' } });
    setGeneratedExcuse(null);
    setIsSimulating(false);
    setChatHistory([]);
  };

  const copyAlibi = () => {
    const text = generatedExcuse.split('TIP:')[0].trim();
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── LANDING PAGE ─────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#E7E3DB] text-black overflow-hidden" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
        
        {/* Top ticker */}
        <div className="bg-black text-[#FFED00] py-2 overflow-hidden border-b-[3px] border-black">
          <div className="whitespace-nowrap animate-marquee inline-block">
            {Array(6).fill("★ CALM YOUR MIND ★ BUILD YOUR ALIBI ★ PSYCHOLOGICAL CLARITY ★ TACTICAL LOGIC ★ ").join("")}
          </div>
        </div>

        {/* NAV */}
        <nav className="border-b-[3px] border-black flex items-center justify-between px-8 py-4 bg-[#E7E3DB]">
          <div className="text-2xl font-black tracking-tight uppercase">I CAN <span className="text-[#FF3B00]">EXPLAIN.</span></div>
          <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-black">
            <span className="opacity-40">Psychological Clarity</span>
            <span className="opacity-40">Tactical Logic</span>
            <span className="opacity-40">v3.0</span>
          </div>
        </nav>

        {/* HERO — full width */}
        <div className="border-b-[3px] border-black px-8 md:px-16 pt-14 pb-10 flex flex-col items-start relative overflow-hidden">
          {/* decorative oversized background text */}
          <div className="absolute right-0 top-0 text-[clamp(180px,28vw,320px)] font-black leading-none opacity-[0.04] select-none pointer-events-none" style={{ fontFamily: "Impact, sans-serif" }}>ICE</div>

          <div className="inline-block bg-[#FF3B00] text-white text-[10px] uppercase tracking-[0.3em] font-black px-3 py-1 mb-8 border-[2px] border-black shadow-[3px_3px_0_#000]">
            Stress Meeting Strategy
          </div>

          <h1
            className="font-black uppercase leading-[0.88] tracking-tighter mb-8 w-full"
            style={{ fontFamily: "'Arial Black', Impact, 'Haettenschweiler', sans-serif", fontSize: "clamp(80px, 16vw, 180px)" }}
          >
            I CAN<br /><span className="text-[#FF3B00] italic">EXPLAIN.</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <p className="text-sm uppercase tracking-widest opacity-50 max-w-sm leading-relaxed" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>
              Where stress meets strategy. Build your alibi in 4 steps. No judgment — only logic.
            </p>
            <div className="sm:ml-auto w-full sm:w-auto">
              <BrutalButton onClick={() => setView('app')} className="w-full sm:w-64 text-base py-5" icon={ArrowRight}>
                Enter Sanctuary
              </BrutalButton>
            </div>
          </div>
        </div>

        {/* STEPS — horizontal strip */}
        <div className="grid grid-cols-4 border-b-[3px] border-black">
          {[
            { n: "01", title: "Context", desc: "Pick your battlefield." },
            { n: "02", title: "Breakdown", desc: "Spill the situation." },
            { n: "03", title: "Strategy", desc: "Safe or risky?" },
            { n: "04", title: "Recipient", desc: "Who needs convincing?" },
          ].map((s, i) => (
            <div key={i} className={`p-6 bg-white hover:bg-[#FFED00] transition-colors group cursor-default ${i < 3 ? 'border-r-[3px] border-black' : ''}`}>
              <div className="text-[10px] font-black text-[#FF3B00] mb-3 opacity-70">{s.n}</div>
              <div className="text-xl font-black uppercase tracking-tight mb-1">{s.title}</div>
              <div className="text-[11px] uppercase tracking-widest opacity-40" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* BOTTOM STRIP */}
        <div className="grid grid-cols-3 text-center">
          {["Psychological Clarity", "Tactical Logic", "Inner Stillness"].map((t, i) => (
            <div key={i} className={`py-5 text-[10px] uppercase tracking-[0.3em] font-black opacity-40 hover:opacity-100 transition-opacity ${i < 2 ? 'border-r-[3px] border-black' : ''}`}>{t}</div>
          ))}
        </div>

        <style>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 20s linear infinite; }
        `}</style>
      </div>
    );
  }

  // ─── APP SHELL ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#E7E3DB] text-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
      
      {/* Top ticker */}
      <div className="bg-black text-[#FFED00] py-1.5 overflow-hidden border-b-[3px] border-black text-[10px]">
        <div className="whitespace-nowrap animate-marquee inline-block">
          {Array(6).fill("★ BUILDING ALIBI ★ TACTICAL MODE ACTIVE ★ CALM YOUR MIND ★ PEACE THROUGH LOGIC ★ ").join("")}
        </div>
      </div>

      {/* Header */}
      <header className="border-b-[3px] border-black flex items-center justify-between px-6 py-4 bg-[#E7E3DB]">
        <div className="flex items-center gap-4">
          {step > 1 && !isSimulating && (
            <button onClick={handleBack} className="w-10 h-10 border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all bg-white">
              <ChevronLeft size={20} />
            </button>
          )}
          <button onClick={() => setView('landing')} className="text-xl font-black uppercase tracking-tight">
            I CAN <span className="text-[#FF3B00]">EXPLAIN.</span>
          </button>
        </div>
        {step > 1 && (
          <button onClick={reset} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black opacity-50 hover:opacity-100 transition-opacity" style={{ fontFamily: "Arial, sans-serif" }}>
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </header>

      {/* Progress Bar */}
      {step < 5 && (
        <div className="flex border-b-[3px] border-black">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 transition-all duration-500 ${step >= s ? 'bg-[#FF3B00]' : 'bg-white'}`}
              style={{ borderRight: s < 4 ? '2px solid black' : 'none' }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6 md:p-10">

        {/* ── STEP 1: CATEGORY ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-[#FF3B00] font-black text-sm uppercase tracking-widest">01/04</span>
              <h2 className="text-4xl font-black uppercase tracking-tight">Context.</h2>
            </div>
            <div className="space-y-0 border-[3px] border-black shadow-[6px_6px_0_#000]">
              {categories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => { setFormData({ ...formData, category: cat.id }); handleNext(); }}
                  className={`w-full flex items-center gap-6 p-5 bg-white hover:bg-[#FFED00] transition-colors group ${i < categories.length - 1 ? 'border-b-[3px] border-black' : ''}`}
                >
                  <span className="text-[10px] text-black/30 font-black w-6">{cat.tag}</span>
                  <div className="p-2 border-[2px] border-black bg-white group-hover:bg-black group-hover:text-white transition-colors">
                    {cat.icon}
                  </div>
                  <span className="text-2xl font-black uppercase tracking-tight flex-1 text-left">{cat.id}</span>
                  <ChevronRight size={18} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: DESCRIPTION ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-[#FF3B00] font-black text-sm uppercase tracking-widest">02/04</span>
              <h2 className="text-4xl font-black uppercase tracking-tight">Breakdown.</h2>
            </div>
            <div className="border-[3px] border-black shadow-[6px_6px_0_#000]">
              <div className="bg-black text-[#FFED00] text-[10px] uppercase tracking-[0.3em] font-black px-4 py-2 border-b-[3px] border-black">
                Situation Report
              </div>
              <textarea
                autoFocus
                className="w-full h-48 bg-white p-6 text-black outline-none resize-none text-base leading-relaxed"
                placeholder="Spill everything. The goal is clarity."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}
              />
            </div>
            <BrutalButton onClick={handleNext} disabled={!formData.description} className="w-full text-base py-5" icon={ArrowRight}>
              Continue
            </BrutalButton>
          </div>
        )}

        {/* ── STEP 3: STRATEGY ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-[#FF3B00] font-black text-sm uppercase tracking-widest">03/04</span>
              <h2 className="text-4xl font-black uppercase tracking-tight">Strategy.</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* SAFE */}
              <button
                onClick={() => { setFormData({ ...formData, style: 'safe' }); handleNext(); }}
                className="border-[3px] border-black bg-white shadow-[6px_6px_0_#000] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all p-8 text-left group"
              >
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6 group-hover:bg-[#FF3B00] transition-colors">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-2xl font-black uppercase tracking-tight mb-2">Safe</div>
                <div className="text-xs uppercase tracking-widest opacity-50" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>Low risk. Mundane. Reliable.</div>
              </button>
              {/* RISKY */}
              <button
                onClick={() => { setFormData({ ...formData, style: 'risky' }); handleNext(); }}
                className="border-[3px] border-black bg-black text-white shadow-[6px_6px_0_#FF3B00] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all p-8 text-left group"
              >
                <div className="w-12 h-12 bg-[#FF3B00] text-white flex items-center justify-center mb-6">
                  <Zap size={22} />
                </div>
                <div className="text-2xl font-black uppercase tracking-tight mb-2">Risky</div>
                <div className="text-xs uppercase tracking-widest opacity-50" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>Memorable. High-impact logic.</div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: RECIPIENT ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-[#FF3B00] font-black text-sm uppercase tracking-widest">04/04</span>
              <h2 className="text-4xl font-black uppercase tracking-tight">The Recipient.</h2>
            </div>
            <div className="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white">
              <div className="p-6 border-b-[3px] border-black">
                <label className="text-[10px] uppercase tracking-[0.3em] font-black opacity-50 block mb-2">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Boss, Mom, Best Friend..."
                  className="w-full bg-transparent text-2xl font-black uppercase tracking-tight outline-none placeholder:opacity-20"
                  value={formData.target.relationship}
                  onChange={(e) => setFormData({ ...formData, target: { ...formData.target, relationship: e.target.value } })}
                />
              </div>
              <div className="p-6">
                <label className="text-[10px] uppercase tracking-[0.3em] font-black opacity-50 block mb-2">Personality</label>
                <input
                  type="text"
                  placeholder="e.g. Suspicious, Chill, Strict..."
                  className="w-full bg-transparent text-2xl font-black uppercase tracking-tight outline-none placeholder:opacity-20"
                  value={formData.target.personality}
                  onChange={(e) => setFormData({ ...formData, target: { ...formData.target, personality: e.target.value } })}
                />
              </div>
            </div>
            {error && (
              <div className="border-[3px] border-[#FF3B00] bg-[#FF3B00]/10 p-4 text-sm font-black uppercase tracking-widest text-[#FF3B00]">{error}</div>
            )}
            <BrutalButton onClick={generateExcuse} disabled={loading} className="w-full text-base py-5">
              {loading ? <span className="flex items-center gap-3"><Loader2 className="animate-spin" size={18} /> Building Alibi...</span> : <span className="flex items-center gap-3"><ArrowRight size={18} /> Build Alibi</span>}
            </BrutalButton>
          </div>
        )}

        {/* ── STEP 5: RESULT ── */}
        {step === 5 && !isSimulating && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-4xl font-black uppercase tracking-tight">Your Alibi.</h2>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#FF3B00] border-[2px] border-[#FF3B00] px-2 py-1">{formData.category} / {formData.style}</span>
            </div>

            {/* Alibi Box */}
            <div className="border-[3px] border-black shadow-[8px_8px_0_#000] bg-white">
              <div className="bg-[#FFED00] border-b-[3px] border-black px-5 py-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black">Alibi Constructed</span>
                <Sparkles size={14} />
              </div>
              <div className="p-6 md:p-8">
                <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>
                  {generatedExcuse?.split('TIP:')[0]}
                </p>
                <div className="border-t-[3px] border-black pt-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black block mb-2">Tactical Tip</span>
                  <p className="text-sm italic" style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}>
                    {generatedExcuse?.split('TIP:')[1] || "Deliver with calm eye contact."}
                  </p>
                </div>
              </div>
            </div>

            {/* Tone Controls */}
            <div className="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white">
              <div className="bg-black text-white text-[10px] uppercase tracking-[0.3em] font-black px-5 py-2 border-b-[3px] border-black">Morph Tone</div>
              <div className="grid grid-cols-3">
                {[
                  { tone: 'urgent', icon: Clock, label: 'Urgent' },
                  { tone: 'casual', icon: Smile, label: 'Casual' },
                  { tone: 'professional', icon: Heart, label: 'Sincere' },
                ].map((t, i) => (
                  <button
                    key={t.tone}
                    onClick={() => morphTone(t.tone)}
                    disabled={loading}
                    className={`p-4 flex flex-col items-center gap-2 hover:bg-[#FFED00] transition-colors group disabled:opacity-40 ${i < 2 ? 'border-r-[3px] border-black' : ''}`}
                  >
                    <t.icon size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-black">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <BrutalButton onClick={() => setIsSimulating(true)} variant="accent" icon={Wand2} className="w-full py-4 text-sm">
                Pressure Test
              </BrutalButton>
              <BrutalButton onClick={copyAlibi} variant="secondary" className="w-full py-4 text-sm">
                {copied ? <span className="flex items-center gap-2"><CheckCheck size={16} /> Copied!</span> : <span className="flex items-center gap-2"><Copy size={16} /> Copy Alibi</span>}
              </BrutalButton>
            </div>
          </div>
        )}

        {/* ── SIMULATOR ── */}
        {isSimulating && (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center gap-3 mb-6 border-b-[3px] border-black pb-5">
              <button
                onClick={() => setIsSimulating(false)}
                className="w-10 h-10 border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">Simulator.</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Target: {formData.target.relationship || "Unknown"}</p>
              </div>
              <div className="ml-auto bg-[#FF3B00] text-white text-[9px] uppercase tracking-widest font-black px-2 py-1 border-[2px] border-black">
                ● Live
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
              <div className="border-[2px] border-black bg-[#FFED00] p-4 text-[11px] uppercase tracking-widest font-black leading-relaxed">
                System: You've delivered your story. Prepare for their reaction.
              </div>

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] uppercase tracking-widest font-black opacity-40 mb-1 px-1">
                    {msg.role === 'user' ? 'You' : (formData.target.relationship || 'Target')}
                  </span>
                  <div
                    className={`max-w-[88%] p-4 text-sm leading-relaxed border-[3px] border-black ${
                      msg.role === 'user'
                        ? 'bg-black text-white shadow-[-4px_4px_0_#FF3B00]'
                        : 'bg-white shadow-[4px_4px_0_#000]'
                    }`}
                    style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-0 border-[3px] border-black shadow-[6px_6px_0_#000]">
              <input
                type="text"
                placeholder="Reply..."
                className="flex-1 bg-white p-4 text-sm outline-none"
                value={chatInput}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ fontFamily: "Arial, sans-serif", fontWeight: 400 }}
              />
              <button
                onClick={sendMessage}
                className="bg-black text-white px-5 hover:bg-[#FF3B00] transition-colors border-l-[3px] border-black"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t-[3px] border-black mt-10 py-4 text-center text-[10px] uppercase tracking-[0.3em] font-black opacity-30">
        Peace through logic • v3.0
      </footer>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 0; }
      `}</style>
    </div>
  );
}