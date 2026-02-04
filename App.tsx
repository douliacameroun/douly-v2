import React, { useState, useEffect, useRef } from 'react';
import { DOULIA_PACKS, DOULIA_LOGO_URL } from './constants';
import { chatWithDoulia, getChatFromLocal } from './services/geminiService';
import ParticleBackground from './components/ParticleBackground';

const App: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('doulia_name') || '');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = getChatFromLocal();
    if (history.length > 0) {
      setMessages(history.map((m: any) => ({ role: m.role, text: m.parts[0].text })));
    } else {
      setMessages([{ role: 'model', text: userName ? `Ravi de vous revoir, <b>${userName}</b> ! En quoi puis-je aider <b>DOULIA</b> aujourd'hui ?` : "Bonjour ! Je suis <b>Douly</b>, votre consultante stratégique chez <b>DOULIA</b>. Comment puis-je vous appeler ?" }]);
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    
    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Extraction du nom simplifiée
    if (!userName && msg.toLowerCase().includes("appelle")) {
      const name = msg.split("appelle")[1]?.trim();
      if (name) { setUserName(name); localStorage.setItem('doulia_name', name); }
    }

    try {
      const historyForAI = newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithDoulia(msg, historyForAI);
      setMessages([...newMessages, { role: 'model', text: response.formattedText }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'model', text: "Liaison perturbée. Contactez-nous au 6 56 30 48 18." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#030712] text-slate-100 flex flex-col md:flex-row p-2 gap-3 font-sans overflow-hidden">
      <ParticleBackground />
      
      {/* Sidebar - Packs */}
      <aside className="w-full md:w-[350px] bg-slate-950/80 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <img src={DOULIA_LOGO_URL} className="w-12 h-12" alt="Logo" />
          <h1 className="text-xl font-black text-[#CBEF43] uppercase italic">Douly</h1>
        </div>
        <div className="space-y-4">
          {DOULIA_PACKS.map((p: any) => (
            <div key={p.id} onClick={() => handleSend(`Parle-moi du pack ${p.name}`)} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#CBEF43]/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#CBEF43]">{p.icon}</span>
                <span className="font-bold text-xs uppercase">{p.name}</span>
              </div>
              <p className="text-[10px] text-slate-400">{p.description}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 bg-slate-900/20 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/20' : 'bg-slate-950/90 border border-white/5'}`}>
                <div dangerouslySetInnerHTML={{ __html: m.text }} className="text-sm leading-relaxed" />
              </div>
            </div>
          ))}
          {isLoading && <div className="text-[#CBEF43] text-[10px] animate-pulse font-bold">DOULY ANALYSE...</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4">
          <div className="max-w-3xl mx-auto flex gap-2 bg-slate-900 border border-white/10 rounded-2xl p-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Discuter avec Douly..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2"
            />
            <button onClick={() => handleSend()} className="bg-[#CBEF43] text-black px-4 py-2 rounded-xl font-bold text-xs uppercase hover:scale-105 transition-all">Envoyer</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
