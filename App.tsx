import React, { useState, useRef, useEffect } from 'react';
import { DOULIA_PACKS, DOULIA_LOGO_URL } from './constants';
import { ChatMessage, DouliaVoice } from './types';
import { chatWithDoulia, generateAuditReport, textToSpeech } from './services/geminiService';
import { playClickSound, startAmbientDrone, playHoverSound, playNotificationSound } from './services/audioEffects';
import AuditReport from './components/AuditReport';
import ParticleBackground from './components/ParticleBackground';

const SIGNATURE_VOICE: DouliaVoice = 'Kore';

// CONFIGURATION EMAILJS IDENTIFIANTS FOURNIS
const EMAILJS_PUBLIC_KEY = "xIOqJEltycOgMFQrN";
const EMAILJS_TEMPLATE_ID = "template_jn5hfms";
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "service_doulia_default"; 

interface UserData {
  fullName?: string;
  company?: string;
  sector?: string;
  pains?: string;
  contact?: string; // Téléphone
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
  const recognitionRef = useRef<any>(null);
  const droneStarted = useRef(false);

  // Initialisation EmailJS au démarrage
  useEffect(() => {
    if ((window as any).emailjs) {
      (window as any).emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  // GESTION DE LA MÉMOIRE (LocalStorage)
  useEffect(() => {
    const savedName = localStorage.getItem('doulia_userName');
    const savedCompany = localStorage.getItem('doulia_companyName');
    
    if (savedName && savedCompany) {
      setUserData(prev => ({ ...prev, fullName: savedName, company: savedCompany }));
      setMessages([{
        role: 'model',
        text: `<b>Ravi de vous revoir ${savedName} de chez ${savedCompany} !</b><br/><br/>Comment se porte le développement de votre projet depuis notre dernier échange ? Je suis prête à poursuivre notre audit stratégique.`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        role: 'model',
        text: "Bonjour ! Je suis <b>Douly</b>, votre consultante stratégique chez <b>DOULIA</b>.<br/><br/>Mon but est d'analyser vos processus pour identifier où l'IA peut vous faire gagner du temps et de l'argent. Comment puis-je vous appeler et quelle est votre entreprise ?",
        timestamp: new Date()
      }]);
    }
  }, []);

  // Sauvegarde automatique des données
  useEffect(() => {
    if (userData.fullName) localStorage.setItem('doulia_userName', userData.fullName);
    if (userData.company) localStorage.setItem('doulia_companyName', userData.company);
    
    let count = 0;
    if (userData.fullName) count++;
    if (userData.company) count++;
    if (userData.sector) count++;
    if (userData.pains) count++;
    if (userData.email || emailSent) count++;
    setProgress(Math.min(count * 20, 100));
  }, [userData, emailSent]);

  // LOGIQUE D'ENVOI EMAILJS AUTOMATIQUE
  const triggerEmailJS = async (clientEmail: string) => {
    if (!clientEmail || emailSent) return;

    const chatHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.text.replace(/<[^>]*>?/gm, '')}`).join('\n\n');
    
    const templateParams = {
      to_email: clientEmail, // Destinataire client
      admin_email: "douliacameroun@gmail.com", // Copie admin
      user_name: userData.fullName || "Cher Partenaire",
      company_name: userData.company || "Votre Entreprise",
      user_phone: userData.contact || "Non renseigné",
      audit_content: chatHistory,
      message_confirm: `Cher Partenaire, Nous vous remercions pour la qualité de votre échange avec notre assistante Douly. Vos besoins ont bien été transmis à nos experts.
      
Prochaines étapes :
1. Analyse de vos données : Un consultant senior examine actuellement les points soulevés.
2. Rapport détaillé : Vous recevrez sous peu un audit complet incluant des solutions sur mesure.
3. Suivi : Un membre de l'équipe DOULIA vous recontactera dans les prochaines minutes.

L'intelligence artificielle au service de votre vision.
Bien cordialement,
L'Équipe Technique DOULIA`
    };

    try {
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      setEmailSent(true);
      
      // Message de confirmation immédiat dans le chat
      setMessages(prev => [...prev, {
        role: 'model',
        text: "<b>Vos données ont bien été transmises à contact@douliacameroun.com.</b><br/><br/>Un accusé de réception professionnel vient de vous être envoyé. Nos experts analysent votre dossier et vous rappelleront dans les prochaines minutes.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("EmailJS Error:", error);
    }
  };

  const handleSendMessage = async (customText?: string, packImages?: string[]) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !imageFile) return;

    if (!droneStarted.current) { startAmbientDrone(); droneStarted.current = true; }
    playClickSound();
    
    // Détection d'email
    const emailRegex = /\S+@\S+\.\S+/;
    const detectedEmail = textToSend.match(emailRegex);
    let emailCaptured = "";

    if (detectedEmail && !emailSent) {
      emailCaptured = detectedEmail[0];
      setUserData(prev => ({ ...prev, email: emailCaptured }));
    }

    setMessages(prev => [...prev, {
      role: 'user', text: textToSend, timestamp: new Date(), attachments: previewImage ? [previewImage] : []
    }]);
    
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

    const history = messages.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const contextPrompt = `CONTEXTE_MEMOIRE: ${JSON.stringify(userData)}.`;

    try {
      const response = await chatWithDoulia(`${contextPrompt}\nInput: ${textToSend}`, history, imageParts);
      
      // Mise à jour simplifiée de la mémoire locale
      if (!userData.fullName && progress === 0) setUserData(prev => ({ ...prev, fullName: textToSend }));
      if (progress === 20 && !userData.company) setUserData(prev => ({ ...prev, company: textToSend }));

      setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date(), attachments: packImages }]);
      setIsLoading(false);
      playNotificationSound();

      // Si email détecté, on lance EmailJS
      if (emailCaptured) {
        triggerEmailJS(emailCaptured);
      }

      if (isOnline) {
        const audio = await textToSpeech(response, SIGNATURE_VOICE);
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
      setMessages(prev => [...prev, { role: 'model', text: "Liaison neural instable.", timestamp: new Date() }]);
      setIsLoading(false);
    }
  };

  const performAudit = async () => {
    if (!emailSent && !userData.email) return;
    setIsLoading(true);
    playClickSound();

    const historySummary = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    const context = `Entreprise: ${userData.company}. Historique: ${historySummary}`;
    
    try {
      const report = await generateAuditReport(context);
      setAuditData(report);
      setActivePage('audit');
    } catch (e) {
      console.error("Audit Generation Error", e);
    }
    setIsLoading(false);
  };

  const getMessageIcon = (msg: ChatMessage) => {
    if (msg.role === 'user') return <i className="fas fa-circle-user text-slate-400"></i>;
    const text = msg.text.toLowerCase();
    if (text.includes('table') || text.includes('| --- |')) return <i className="fas fa-file-invoice text-doulia-lime"></i>;
    if (text.includes('sécurité') || text.includes('transmises')) return <i className="fas fa-shield-halved text-doulia-cyan"></i>;
    return <i className="fas fa-robot text-doulia-lime"></i>;
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else {
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.lang = 'fr-FR';
        recognitionRef.current.onresult = (event: any) => {
          let t = '';
          for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript;
          setInput(prev => prev + t);
        };
      }
      recognitionRef.current.start(); setIsListening(true); playClickSound();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030712] text-slate-100 flex p-2 md:p-3 gap-3 font-inter">
      <ParticleBackground />

      <aside className={`
        ${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-[340px] shrink-0 h-full rounded-[2.5rem] 
        bg-slate-950/40 border border-white/5 aura-ai overflow-hidden backdrop-blur-3xl
        transition-all duration-300 absolute md:relative z-[100] md:z-auto left-2 md:left-0 top-2 md:top-0 h-[calc(100%-1rem)] md:h-full
      `}>
        <div className="p-4 flex flex-col h-full bg-gradient-to-b from-slate-950/80 to-slate-900/20 relative">
          <div className="circuit-line top-1/4 opacity-20 animate-circuit-scan"></div>
          
          <div className="flex flex-col mb-4 relative z-10">
            <div className="absolute top-0 right-0 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_12px_#22c55e]"></span>
              <span className="text-[8px] font-black text-green-500 uppercase tracking-widest tracking-widest">Neural Link Active</span>
            </div>

            <div className="flex flex-row items-center gap-6 cursor-pointer group" onClick={() => window.location.reload()}>
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-doulia-lime/30 blur-3xl rounded-full group-hover:bg-doulia-lime/50 transition-all"></div>
                <img 
                  src={DOULIA_LOGO_URL} 
                  className="w-[115px] h-[115px] object-contain animate-scintillate relative z-10 drop-shadow-[0_0_20px_rgba(190,242,100,0.4)] group-hover:scale-105 transition-transform" 
                  alt="DOULIA Logo" 
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black text-doulia-lime italic uppercase tracking-tighter neon-text-glow leading-none">Douly</h1>
                <p className="text-[10px] font-black text-doulia-cyan uppercase tracking-[0.25em] mt-2 opacity-80 animate-pulse tracking-widest">Agent Commercial DOULIA</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 z-10">
            <button onClick={() => setActivePage('chat')} className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activePage === 'chat' ? 'selected-gradient shadow-lg' : 'bg-white/5 text-slate-400 interactive-glow'}`}>Interface</button>
            <button onClick={() => { if(auditData) setActivePage('audit'); }} disabled={!auditData} className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activePage === 'audit' ? 'selected-gradient shadow-lg' : 'bg-white/5 text-slate-400 interactive-glow disabled:opacity-20'}`}>Diagnostic</button>
          </div>
          
          <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1 z-10 font-inter">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-2">Protocoles Actifs</p>
             {DOULIA_PACKS.map(p => (
               <div key={p.id} className="ai-flow-container group" onMouseEnter={playHoverSound}>
                 <div onClick={() => handleSendMessage(`Détails sur ${p.name}`, p.images)} 
                      className="ai-flow-content p-2.5 cursor-pointer hover:bg-slate-900/60 transition-all border border-white/5 group-hover:shadow-[inset_0_0_30px_rgba(34,211,238,0.15)]">
                   <div className="flex items-center gap-4 mb-2">
                     <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-doulia-lime/10 text-doulia-lime text-xl group-hover:bg-doulia-lime group-hover:text-slate-950 transition-all">
                       {p.icon}
                     </div>
                     <span className="text-[15px] font-black uppercase text-doulia-lime tracking-tighter leading-none">{p.name}</span>
                   </div>
                   <ul className="space-y-1 ml-1 pb-1 font-inter">
                      {p.services.map((s, idx) => (
                        <li key={idx} className="text-[13px] font-medium text-slate-200 flex items-center gap-3 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                          <i className={`${s.icon} text-doulia-cyan text-[10px] w-4 text-center`}></i>
                          <span className="truncate">{s.text}</span>
                        </li>
                      ))}
                   </ul>
                 </div>
               </div>
             ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 z-10 px-2">
            <button onClick={() => { if(window.confirm("Réinitialiser mémoire ?")) { localStorage.clear(); window.location.reload(); } }} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 transition-colors">Nettoyer Mémoire</button>
            {(progress >= 80 || emailSent) && (
              <button onClick={performAudit} className="w-full py-5 btn-diagnostic-global rounded-2xl text-[11px] tracking-[0.2em] transition-all uppercase border-2 border-cyan-400/50">LANCER DIAGNOSTIC</button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full flex flex-col min-w-0 rounded-[2.5rem] border border-white/5 bg-slate-900/10 overflow-hidden relative shadow-2xl">
        <header className="h-[72px] shrink-0 border-b border-white/[0.04] bg-slate-950/80 backdrop-blur-xl flex items-center px-6 md:px-10 justify-between z-50">
           <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-doulia-lime md:hidden p-2"><i className="fas fa-bars text-xl"></i></button>
             <div className="flex flex-col">
               <h2 className="text-[12px] font-black tracking-[0.6em] text-doulia-cyan uppercase neon-text-glow">DOULIA_INTERFACE_V4.2</h2>
               <span className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">Status: Cryptage AES-256 Actif</span>
             </div>
           </div>
           <div className="hidden md:flex items-center gap-3 bg-white/5 px-5 py-2 rounded-full border border-white/5">
             <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
             <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{isOnline ? 'Neural Live' : 'Offline'}</span>
           </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 relative bg-gradient-to-b from-transparent to-slate-950/40">
          
          {activePage === 'chat' && (
            <div className="absolute top-0 left-0 w-full h-1 z-[60] bg-white/5">
              <div className="h-full bg-gradient-to-r from-doulia-lime to-doulia-cyan transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
            {activePage === 'chat' ? (
              <div className="max-w-4xl mx-auto w-full space-y-12 pt-10 pb-20">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-4 animate-fade-in-up`}>
                    {msg.role === 'model' && (
                      <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-lg shrink-0 aura-ai shadow-[0_0_15px_rgba(190,242,100,0.1)]">
                         {getMessageIcon(msg)}
                      </div>
                    )}
                    
                    <div className={`
                        max-w-[85%] md:max-w-[75%] p-5 md:p-6 rounded-[2.5rem] border shadow-2xl backdrop-blur-md transition-all interactive-glow neural-bubble
                        ${msg.role === 'user' ? 'bg-doulia-cyan/10 border-doulia-cyan/30 text-white rounded-tr-none' : 'bg-slate-950/90 border-white/10 text-slate-100 rounded-tl-none'}
                      `}>
                      {msg.attachments?.map((att, i) => (
                         <div key={i} className="mb-5 relative group overflow-hidden rounded-3xl">
                           <img src={att} className="max-h-80 w-full object-contain shadow-2xl border border-white/10" alt="Visual" />
                         </div>
                      ))}
                      <div className="text-[13px] md:text-[14.5px] leading-relaxed font-medium tracking-tight" dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-lg shrink-0 shadow-lg">
                        {getMessageIcon(msg)}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-4 text-doulia-lime p-5 animate-pulse">
                    <div className="flex gap-1.5"><div className="w-2.5 h-2.5 bg-doulia-lime rounded-full animate-bounce"></div><div className="w-2.5 h-2.5 bg-doulia-lime rounded-full animate-bounce"></div></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">{THINKING_STATUSES[thinkingIndex]}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            ) : (
               <AuditReport data={auditData} onClose={() => setActivePage('chat')} onExploreMore={() => setActivePage('chat')} />
            )}
          </div>

          {activePage === 'chat' && (
            <footer className="shrink-0 w-full p-3 md:p-4 bg-slate-950/95 border-t border-white/[0.05] backdrop-blur-3xl z-[60]">
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <div className="flex items-end gap-3 bg-slate-900/60 p-2 md:p-3 rounded-[2.5rem] border border-white/10 focus-within:border-doulia-lime/40 shadow-2xl relative overflow-hidden group">
                  <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 flex items-center justify-center rounded-full text-doulia-lime transition-all shrink-0 hover:bg-doulia-lime/10">
                    <i className="fas fa-paperclip text-lg"></i>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file) {
                      setImageFile(file);
                      const r = new FileReader();
                      r.onload = ev => setPreviewImage(ev.target?.result as string);
                      r.readAsDataURL(file);
                    }
                  }} />
                  
                  <textarea 
                    ref={textareaRef}
                    value={input} 
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Paragez vos blocages avec Douly..." 
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[14px] md:text-[15px] px-2 placeholder:text-slate-600 font-medium resize-none max-h-[120px] custom-scrollbar" 
                  />
                  
                  <button onClick={toggleListening} className={`w-11 h-11 flex items-center justify-center rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500/20 text-red-500' : 'text-doulia-cyan'}`}>
                    <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
                  </button>

                  <button onClick={() => handleSendMessage()} disabled={!input.trim() && !imageFile} className="w-11 h-11 md:w-12 md:h-12 send-button-neural text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:scale-105 disabled:opacity-20 transition-all shrink-0 group">
                    <i className="fas fa-bolt text-xl group-hover:animate-scintillate"></i>
                  </button>
                </div>
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
