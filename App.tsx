import React, { useState, useRef, useEffect } from 'react';
import { DOULIA_PACKS, DOULIA_LOGO_URL } from './constants';
import { ChatMessage, DouliaVoice } from './types';
import { chatWithDoulia, textToSpeech, getChatFromLocal } from './services/geminiService';
import { playClickSound, startAmbientDrone, playNotificationSound } from './services/audioEffects';
import AuditReport from './components/AuditReport';
import ParticleBackground from './components/ParticleBackground';
import emailjs from '@emailjs/browser';

const SIGNATURE_VOICE: DouliaVoice = 'Kore';
const EMAILJS_PUBLIC_KEY = "xIOqJEltycOgMFQrN";
const EMAILJS_TEMPLATE_ID = "template_jn5hfms";
const EMAILJS_SERVICE_ID = "service_doulia_default"; 

interface UserData {
  fullName?: string;
  company?: string;
  email?: string;
}

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'chat' | 'audit'>('chat');
  const [isOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [userData, setUserData] = useState<UserData>({});
  const [progress, setProgress] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const droneStarted = useRef(false);

  useEffect(() => { emailjs.init(EMAILJS_PUBLIC_KEY); }, []);

  // Restauration de la mémoire LocalStorage
  useEffect(() => {
    const savedName = localStorage.getItem('doulia_userName');
    const savedCompany = localStorage.getItem('doulia_companyName');
    const savedEmail = localStorage.getItem('doulia_userEmail');
    const savedHistory = getChatFromLocal(); 
    
    if (savedName) setUserData(prev => ({ ...prev, fullName: savedName }));
    if (savedCompany) setUserData(prev => ({ ...prev, company: savedCompany }));
    if (savedEmail) setUserData(prev => ({ ...prev, email: savedEmail }));

    if (savedHistory.length > 0) {
      setMessages(savedHistory.map(m => ({
        role: m.role,
        text: m.parts[0].text,
        timestamp: new Date()
      })));
    } else {
      setMessages([{
        role: 'model',
        text: "Bonjour ! Je suis <b>Douly</b>, votre consultante stratégique chez <b>DOULIA</b>.<br/><br/>Comment puis-je vous appeler et quelle est votre entreprise ?",
        timestamp: new Date()
      }]);
    }
  }, []);

  // Calcul du score de complétion
  useEffect(() => {
    let count = 0;
    if (userData.fullName) count++;
    if (userData.company) count++;
    if (userData.email) count++;
    setProgress(Math.min(count * 34, 100));
  }, [userData]);

  const handleGenerateAudit = async () => {
    playClickSound();
    const chatHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.text.replace(/<[^>]*>?/gm, '')}`).join('\n\n');
    const templateParams = {
      to_email: userData.email || "contact@douliacameroun.com",
      admin_email: "doualiacameroun@gmail.com",
      user_name: userData.fullName || "Client",
      company_name: userData.company || "Non spécifiée",
      audit_content: chatHistory,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      setEmailSent(true);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "<b>Rapport transmis avec succès !</b><br/>Vos données ont été envoyées à contact@douliacameroun.com. Nos experts vous rappelleront sous peu.",
        timestamp: new Date()
      }]);
    } catch (error) { console.error(error); }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    if (!droneStarted.current) { startAmbientDrone(); droneStarted.current = true; }
    playClickSound();
    
    // Détection auto d'email
    const detectedEmail = textToSend.match(/\S+@\S+\.\S+/);
    if (detectedEmail) {
        setUserData(prev => ({ ...prev, email: detectedEmail[0] }));
        localStorage.setItem('doulia_userEmail', detectedEmail[0]);
    }

    const userMessage: ChatMessage = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const contextPrompt = `Client: ${userData.fullName || 'Inconnu'} de ${userData.company || 'Entreprise inconnue'}.`;

    try {
      const { formattedText, updatedHistory } = await chatWithDoulia(`${contextPrompt}\nMessage: ${textToSend}`, historyForAI);
      
      // Extraction auto du nom si message court
      if (!userData.fullName && textToSend.length < 25) {
          setUserData(prev => ({ ...prev, fullName: textToSend }));
          localStorage.setItem('doulia_userName', textToSend);
      }

      setMessages(updatedHistory.map(m => ({
        role: m.role,
        text: m.parts[0].text,
        timestamp: new Date()
      })));
      
      setIsLoading(false);
      playNotificationSound();

      const audio = await textToSpeech(formattedText, SIGNATURE_VOICE);
      if (audio) {
          const audioCtx = new AudioContext();
          const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
          const dataInt16 = new Int16Array(bytes.buffer);
          const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
          buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768));
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start();
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Liaison perturbée. Contactez le 6 56 30 48 18.", timestamp: new Date() }]);
      setIsLoading(false);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex p-2 md:p-3 gap-3 font-inter">
      <ParticleBackground />

      {/* SIDEBAR AVEC DESIGN ORIGINAL DES PACKS */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col w-[350px] shrink-0 h-full rounded-[2rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl transition-all duration-300 absolute md:relative z-[100]`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-8">
            <img src={DOULIA_LOGO_URL} className="w-16 h-16" alt="Logo" />
            <div>
              <h1 className="text-2xl font-black text-doulia-lime italic uppercase">Douly</h1>
              <p className="text-[10px] font-bold text-doulia-cyan tracking-widest uppercase">Expert Stratégique</p>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nos Services</p>
            {DOULIA_PACKS.map(p => (
              <div key={p.id} onClick={() => handleSendMessage(`Détails sur le pack : ${p.name}`)} 
                   className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-doulia-lime/10 cursor-pointer transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-doulia-lime text-xl">{p.icon}</span>
                  <span className="font-bold text-sm uppercase tracking-tight">{p.name}</span>
                </div>
                <ul className="text-[10px] text-slate-400 space-y-1">
                  {p.features.slice(0, 3).map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10">
            {progress >= 60 && (
              <button onClick={handleGenerateAudit} className="w-full py-4 bg-doulia-lime text-slate-950 rounded-xl font-black text-xs uppercase animate-pulse shadow-lg shadow-doulia-lime/20">
                Générer Audit & Envoyer
              </button>
            )}
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full mt-2 py-2 text-[9px] font-black text-slate-500 hover:text-red-400 uppercase">Réinitialiser</button>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 h-full flex flex-col min-w-0 rounded-[2rem] border border-white/5 bg-slate-900/20 overflow-hidden relative">
        <header className="h-[64px] border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center px-8 justify-between z-50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-doulia-lime"><i className="fas fa-bars"></i></button>
          <h2 className="text-[10px] font-black tracking-[0.4em] text-doulia-cyan uppercase">Doulia Interface v4.2</h2>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{isOnline ? 'Connecté' : 'Hors-ligne'}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-doulia-cyan/10 border border-doulia-cyan/20' : 'bg-slate-950/80 border border-white/5'}`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
              </div>
            ))}
            {isLoading && <div className="text-doulia-lime text-[10px] font-black animate-pulse uppercase">Douly analyse votre demande...</div>}
            <div ref={chatEndRef} />
          </div>
        </div>

        <footer className="absolute bottom-6 left-0 w-full px-4 z-[60]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-900/95 border border-white/10 rounded-3xl p-2 shadow-2xl backdrop-blur-lg focus-within:border-doulia-lime/50 transition-all">
              <textarea 
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Discuter avec Douly..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[16px] py-3 px-4 resize-none max-h-40"
                rows={1}
              />
              <button onClick={() => handleSendMessage()} disabled={!input.trim()} className="w-12 h-12 bg-doulia-lime text-slate-950 rounded-2xl flex items-center justify-center hover:scale-105 transition-all shrink-0">
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;