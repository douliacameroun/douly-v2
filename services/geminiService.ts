import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { DouliaVoice } from "../types";

// --- LOGIQUE MÉTIER & PERSONNALITÉ DOUALA ---
const BUSINESS_LOGIC = `
[CONSIGNES FINANCIÈRES ET STRATÉGIQUES]
1. AUCUN PRIX FIXE : Si on te demande "combien ça coûte ?", explique qu'il n'y a pas de facturation standard. Le prix dépend de : la complexité des flux de données, le volume de traitement de l'IA et le niveau de personnalisation requis.
2. FOCUS SUR LE ROI : Rassure toujours le client sur le Retour Sur Investissement. L'IA de DOULIA n'est pas une dépense, c'est un investissement qui réduit les coûts opérationnels et les erreurs humaines tout en travaillant 24h/24.
3. SERVICES ADDITIONNELS (UPSELLING SUBTIL) : Si le besoin se présente, propose que DOULIA peut aussi :
   - Former le staff et les dirigeants à l'adoption des meilleurs outils IA.
   - Réaliser des audits approfondis des processus internes.
4. REDIRECTION EXPERTE : Pour toute question complexe ou financière, après avoir rassuré sur le ROI, redirige vers : 6 56 30 48 18 / 6 73 04 31 27 ou contact@douliacameroun.com.
5. RAPPORT DE CONVERSATION : Rappelle que tu transmets les données à doualiacameroun@gmail.com et que l'équipe les rappellera dans les minutes suivantes.
`;

const MEMORY_KEY = 'doulia_chat_memory';

export const saveChatToLocal = (history: any[]) => {
  const historyToSave = history.map(item => ({
    role: item.role,
    parts: item.parts.filter((p: any) => p.text) 
  })).slice(-20);
  
  localStorage.setItem(MEMORY_KEY, JSON.stringify(historyToSave));
};

export const getChatFromLocal = (): any[] => {
  const saved = localStorage.getItem(MEMORY_KEY);
  return saved ? JSON.parse(saved) : [];
};

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
};

const formatVoiceflowText = (text: string): string => {
  let formatted = text;
  
  if (text.includes('|') && text.includes('---')) {
    const lines = text.split('\n');
    let inTable = false;
    let tableHtml = '<div class="overflow-x-auto my-6 border border-white/10 rounded-2xl shadow-2xl bg-slate-950/40"><table class="w-full border-collapse text-[13px]">';
    
    const processedLines = lines.map(line => {
      const isTableRow = line.includes('|') && (line.includes('---') || line.trim().startsWith('|') || line.match(/\|.*\|/));
      if (isTableRow) {
        if (!inTable) { 
          inTable = true; 
          if (!line.includes('---')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
            return tableHtml + `<thead class="bg-slate-900"><tr class="font-black uppercase tracking-widest text-[10px] text-doulia-cyan">${cells.map(c => `<th class="p-4 border border-white/5 text-left">${c}</th>`).join('')}</tr></thead><tbody>`;
          }
          return tableHtml + '<tbody>';
        }
        if (line.includes('---')) return '';
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cells.length === 0) return '';
        return `<tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">${cells.map(c => `<td class="p-4 border-r border-white/5 last:border-r-0">${c}</td>`).join('')}</tr>`;
      } else {
        if (inTable) { 
          inTable = false; 
          return '</tbody></table></div>' + line; 
        }
        return line;
      }
    });
    formatted = processedLines.join('\n');
    if (inTable) formatted += '</tbody></table></div>';
  }

  formatted = formatted
    .replace(/\*\*\*(.*?)\*\*\*/g, '<b>$1</b>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^- (.*)$/gm, '• $1')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  formatted = formatted.replace(/<b>(.*?)<\/b>/g, '<span class="text-doulia-lime font-extrabold shadow-sm">$1</span>');

  formatted = formatted.replace(/^(\d+)\.\s/gm, (match, num) => {
    return `<span class="inline-flex items-center justify-center w-5 h-5 mr-2 text-[10px] font-black bg-doulia-lime text-doulia-navy rounded-full shadow-[0_0_8px_rgba(190,242,100,0.4)]">${num}</span> `;
  });

  formatted = formatted.replace(/<a (.*?)>(.*?)<\/a>/g, '<a $1 class="text-cyan-400 underline font-black hover:text-white transition-colors">$2</a>');

  return formatted;
};

export const chatWithDoulia = async (
  message: string,
  history: any[],
  imageParts: any[] = []
): Promise<{ formattedText: string; updatedHistory: any[] }> => {
  const ai = getAIClient();
  const model = 'gemini-1.5-flash'; 

  try {
    let currentHistory = history.length === 0 ? getChatFromLocal() : [...history];

    const currentParts: any[] = [{ text: message }];
    if (imageParts && imageParts.length > 0) {
      imageParts.forEach(p => { if (p.inlineData) currentParts.push({ inlineData: p.inlineData }); });
    }

    currentHistory.push({ role: 'user', parts: currentParts });

    const response = await ai.models.generateContent({
      model,
      contents: currentHistory,
      config: {
        // ON COMBINE L'INSTRUCTION GLOBALE AVEC LA LOGIQUE MÉTIER
        systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + BUSINESS_LOGIC,
        temperature: 0.6,
        topP: 0.9,
      },
    });

    const aiText = response.text || "Erreur de synchronisation.";
    
    currentHistory.push({ role: 'model', parts: [{ text: aiText }] });

    saveChatToLocal(currentHistory);

    return {
      formattedText: formatVoiceflowText(aiText),
      updatedHistory: currentHistory
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      formattedText: "Liaison neurale interrompue. <b>Contactez-nous</b>.",
      updatedHistory: history
    };
  }
};

// ... (reste du code inchangé pour generateAuditReport et textToSpeech)
export const generateAuditReport = async (context: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Génère un rapport d'audit JSON ultra-détaillé...`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            companyName: { type: Type.STRING },
            sector: { type: Type.STRING },
            pains: { type: Type.ARRAY, items: { type: Type.STRING } },
            solutions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  pack: { type: Type.STRING },
                  type: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  profitAnalysis: { type: Type.STRING },
                  impactScore: { type: Type.INTEGER }
                }
              } 
            },
            costAnalysis: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                current: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                projected: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ["labels", "current", "projected"]
            },
            roiProjection: {
              type: Type.OBJECT,
              properties: {
                months: { type: Type.ARRAY, items: { type: Type.STRING } },
                values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ["months", "values"]
            },
            roiEstimate: { type: Type.STRING },
            nextSteps: { type: Type.STRING }
          },
          required: ["title", "companyName", "sector", "pains", "solutions", "costAnalysis", "roiProjection", "roiEstimate", "nextSteps"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  };
  
  export const textToSpeech = async (text: string, voice: DouliaVoice = 'Kore'): Promise<string | undefined> => {
    const ai = getAIClient();
    try {
      const cleanText = text.replace(/<[^>]*>?/gm, '');
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      return undefined;
    }
  };