import React, { useState, useRef, useEffect } from 'react';
import { DOULIA_PACKS, DOULIA_LOGO_URL } from './constants';
import { ChatMessage, DouliaVoice } from './types';
import { chatWithDoulia, generateAuditReport, textToSpeech, getChatFromLocal } from './services/geminiService';
import { playClickSound, startAmbientDrone, playHoverSound, playNotificationSound } from './services/audioEffects';
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
  sector?: string;
  pains?: string;
  contact?: string;
  email?: string;
}

const THINKING_STATUSES = [
  "Analyse du contexte métier...",
  "Simulation du ROI prévisionnel...",
  "Architecture des agents cognitifs..."
];

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'chat' | 'audit'>('chat');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [auditData, setAuditData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  
  const [userData, setUserData] = useState<UserData>({});
  const [progress, setProgress] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const droneStarted = useRef(false);

  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }, []);

  // Hydratation de la mémoire locale
  useEffect(() => {
    const savedName = localStorage.getItem('doulia_userName');
    const savedCompany = localStorage.getItem('doulia_companyName');
    const savedEmail = localStorage.getItem('doulia_userEmail');
    const savedHistory = getChatFromLocal(); 
    
    if (savedName) setUserData(prev => ({ ...prev, fullName: savedName }));
    if (savedCompany) setUserData(prev => ({ ...prev, company: savedCompany }));
    if (savedEmail) setUserData(prev => ({ ...prev, email: savedEmail }));

    if (savedHistory.length > 0) {
      const displayHistory: ChatMessage[] = savedHistory.map(m => ({
        role: m.role,
        text: m.parts[0].text,
        timestamp: new Date()
      }));
      setMessages(displayHistory);
    } else {
      setMessages([{
        role: 'model',
        text: "Bonjour ! Je suis <b>Douly</b>, votre consultante stratégique chez <b>DOULIA</b>.<br/><br/>Pour commencer notre analyse, comment puis-je vous appeler et quelle est votre entreprise ?",
        timestamp: new Date()
      }]);
    }
  }, []);

  // Mise à jour de la mémoire et du score de complétion
  useEffect(() => {
    if (userData.fullName) localStorage.setItem('doulia_userName', userData.fullName);
    if (userData.company) localStorage.setItem('doulia_companyName', userData.company);
    if (userData.email) localStorage.setItem('doulia_userEmail', userData.email);
    
    let count = 0;
    if (userData.fullName) count++;
    if (userData.company) count++;
    if (userData.sector) count++;
    if (userData.pains) count++;
    if (userData.email || emailSent) count++;
    setProgress(Math.min(count * 20, 100));
  }, [userData, emailSent]);

  // FONCTION D'ENVOI EMAIL (Option B : Déclenchée par le bouton Audit)
  const handleGenerateAudit = async () => {
    playClickSound();
    
    // 1. Préparer le contenu pour l'email
    const chatHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.text.replace(/<[^>]*>?/gm, '')}`).join('\n\n');
    
    const templateParams = {
      to_email: userData.email || "client@doulia.com", // Email du client si capturé
      admin_email: "doualiacameroun@gmail.com",
      user_name: userData.fullName || "Cher Partenaire",
      company_name: userData.company || "Votre Entreprise",
      audit_content: chatHistory,
    };

    try {
      // 2. Envoyer via EmailJS
      if (!emailSent) {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        setEmailSent(true);
      }

      // 3. Message de confirmation (consigne respectée)
      setMessages(prev => [...prev, {
        role: 'model',
        text: "<b>Vos données ont bien été transmises à contact@douliacameroun.com.</b><br/><br/>Un expert DOULIA va vous rappeler dans les prochaines minutes pour approfondir votre projet.",
        timestamp: new Date()
      }]);

      // 4. Basculer sur la page Audit
      setActivePage('audit');
      
    } catch (error) {
      console.error("EmailJS Error:", error);
      // En cas d'erreur, on affiche quand même l'audit mais on prévient
      setActivePage('audit');
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !imageFile) return;

    if (!droneStarted.current) { startAmbientDrone(); droneStarted.current = true; }
    playClickSound();
    
    // Capture d'email fluide
    const emailRegex = /\S+@\S+\.\S+/;
    const detectedEmail = textToSend.match(emailRegex);
    if (detectedEmail) {
      setUserData(prev => ({ ...prev, email: detectedEmail[0] }));
    }

    const userMessage: ChatMessage = {
      role: 'user', text: textToSend, timestamp: new Date(), attachments: previewImage ? [previewImage] : []
    };
    setMessages(prev => [...prev, userMessage]);
    
    setInput('');
    setIsLoading(true);

    let imageParts: any[] = [];
    if (imageFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>(r => { 
        reader.onload = e => r(e.target?.result as string); 
        reader.readAsDataURL(imageFile); 
      });
      imageParts = [{ inlineData: { data: base64.split(',')[1], mimeType: imageFile.type } }];
    }
    setPreviewImage(null); setImageFile(null);

    const historyForAI = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const contextPrompt = `Client: ${userData.fullName || 'Inconnu'} de ${userData.company || 'Entreprise inconnue'}.`;

    try {
      const { formattedText, updatedHistory } = await chatWithDoulia(`${contextPrompt}\nMessage: ${textToSend}`, historyForAI, imageParts);
      
      if (!userData.fullName && textToSend.length < 40) setUserData(prev => ({ ...prev, fullName: textToSend }));

      setMessages(updatedHistory.map(m => ({
        role: m.role,
        text: m.parts[0].text,
        timestamp: new Date()
      })));
      
      setIsLoading(false);
      playNotificationSound();

      if (isOnline) {
        const audio = await textToSpeech(formattedText, SIGNATURE_VOICE);
        if (audio) {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const binaryString = atob(audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
          const dataInt16 = new Int16Array(bytes.buffer);
          const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start();
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Liaison perturbée. Veuillez contacter nos experts au 6 56 30 48 18 ou par email à contact@douliacameroun.com.", 
        timestamp: new Date() 
      }]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex p-2 md:p-3 gap-3 font-inter">
      <ParticleBackground />

      {activePage === 'audit' ? (
        <div className="flex-1 h-full overflow-y-auto z-[200] bg-slate-950 rounded-[2rem] p-4">
            <button onClick={() => setActivePage('chat')} className="mb-4 text-doulia-lime font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <i className="fas fa-arrow-left"></i> Retour au chat
            </button>
            <AuditReport data={auditData} />
        </div>
      ) : (
        <>
          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'} md:translate-x-0
            flex flex-col w-[320px] shrink-0 h-full rounded-[2rem] 
            bg-slate-950/80 border border-white/10 aura-ai overflow-hidden backdrop-blur-3xl
            transition-all duration-300 absolute md:relative z-[100] md:z-auto left-2 top-2 bottom-2 md:top-0 md:left-0 md:h-full
          `}>
            <div className="p-4 flex flex-col h-full relative">
              <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>

              <div className="flex flex-col mb-6 pt-4">
                <div className="flex flex-row items-center gap-4">
                  <img src={DOULIA_LOGO_URL} className="w-[80px] h-[80px] object-contain" alt="Logo" />
                  <div>
                    <h1 className="text-2xl font-black text-doulia-lime italic uppercase leading-none">Douly</h1>
                    <p className="text-[9px] font-bold text-doulia-cyan uppercase tracking-widest mt-1">Expert Doulia</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Solutions IA</p>
                  {DOULIA_PACKS.map(p => (
                    <div key={p.id} onClick={() => { handleSendMessage(`Détails sur ${p.name}`); if(window.innerWidth < 768) setSidebarOpen(false); }} 
                        className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-doulia-lime/10 cursor-pointer transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-doulia-lime text-lg">{p.icon}</span>
                        <span className="text-sm font-bold uppercase tracking-tighter">{p.name}</span>
                      </div>
                    </div>
                  ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-2 text-[9px] font-black text-slate-500 hover:text-red-400 uppercase">Réinitialiser la mémoire</button>
                
                {/* BOUTON GENERER AUDIT MODIFIÉ SELON OPTION B */}
                {progress >= 60 && (
                  <button 
                    onClick={handleGenerateAudit} 
                    className="w-full py-4 bg-doulia-lime text-slate-950 rounded-xl font-black text-[11px] uppercase shadow-[0_0_20px_rgba(190,242,100,0.3)] animate-pulse"
                  >
                    Générer Audit & Envoyer Rapport
                  </button>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1 h-full flex flex-col min-w-0 rounded-[2rem] border border-white/5 bg-slate-900/20 overflow-hidden relative">
            <header className="h-[64px] shrink-0 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center px-4 md:px-8 justify-between z-50">
               <button onClick={() => setSidebarOpen(true)} className="md:hidden text-doulia-lime"><i className="fas fa-bars text-xl"></i></button>
               <h2 className="text-[10px] font-black tracking-[0.4em] text-doulia-cyan uppercase">Doulia Interface v4.2</h2>
               <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                 <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">{isOnline ? 'Online' : 'Offline'}</span>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8 pt-4 pb-32 md:pb-24">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}>
                      {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-slate-900 border border-doulia-lime/30 flex items-center justify-center shrink-0"><i className="fas fa-robot text-doulia-lime"></i></div>}
                      <div className={`p-4 md:p-5 rounded-[1.5rem] text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-doulia-cyan/10 border border-doulia-cyan/20 rounded-tr-none' : 'bg-slate-950/80 border border-white/5 rounded-tl-none'}`}>
                        <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                      </div>
                    </div>
                  ))}
                  {isLoading && <div className="text-doulia-lime text-[10px] font-black animate-pulse uppercase tracking-widest">{THINKING_STATUSES[thinkingIndex]}</div>}
                  <div ref={chatEndRef} />
                </div>
            </div>

            <footer className="fixed md:absolute bottom-0 left-0 w-full p-2 md:p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-[60]">
              <div className="max-w-3xl mx-auto relative">
                {previewImage && (
                  <div className="absolute -top-16 left-2">
                    <img src={previewImage} className="w-12 h-12 rounded-lg border-2 border-doulia-lime object-cover" alt="preview" />
                  </div>
                )}
                <div className="flex items-end gap-2 bg-slate-900/95 border border-white/10 rounded-[2rem] p-2 md:p-3 shadow-2xl backdrop-blur-lg focus-within:border-doulia-lime/50 transition-all">
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 md:w-10 md:h-10 text-slate-400 hover:text-doulia-lime flex items-center justify-center shrink-0">
                    <i className="fas fa-paperclip text-lg"></i>
                  </button>
                  <textarea 
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="Un besoin ? Douly vous répond..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[16px] py-3 px-1 resize-none max-h-40 custom-scrollbar" 
                    rows={1}
                  />
                  <button onClick={() => handleSendMessage()} disabled={!input.trim() && !imageFile} className="w-12 h-12 md:w-10 md:h-10 bg-doulia-lime text-slate-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shrink-0 shadow-lg shadow-doulia-lime/20">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }} />
              </div>
            </footer>
          </main>
        </>
      )}
    </div>
  );
};

export default App;