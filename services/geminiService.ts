import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { DouliaVoice } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
};

const formatVoiceflowText = (text: string): string => {
  let formatted = text;
  
  // Gestion améliorée des tableaux Markdown (V8.0)
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

  // Nettoyage Markdown standard vers HTML stylisé Doulia
  formatted = formatted
    .replace(/\*\*\*(.*?)\*\*\*/g, '<b>$1</b>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^- (.*)$/gm, '• $1')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  // Application des styles Doulia sur les tags <b>
  formatted = formatted.replace(/<b>(.*?)<\/b>/g, '<span class="text-doulia-lime font-extrabold shadow-sm">$1</span>');

  // Stylisation des listes numérotées
  formatted = formatted.replace(/^(\d+)\.\s/gm, (match, num) => {
    return `<span class="inline-flex items-center justify-center w-5 h-5 mr-2 text-[10px] font-black bg-doulia-lime text-doulia-navy rounded-full shadow-[0_0_8px_rgba(190,242,100,0.4)]">${num}</span> `;
  });

  // Stylisation des liens
  formatted = formatted.replace(/<a (.*?)>(.*?)<\/a>/g, '<a $1 class="text-cyan-400 underline font-black hover:text-white transition-colors">$2</a>');

  return formatted;
};

export const chatWithDoulia = async (
  message: string,
  history: any[],
  imageParts: any[] = []
): Promise<string> => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';

  try {
    const contents = [...history];
    const currentParts: any[] = [{ text: message }];
    
    if (imageParts && imageParts.length > 0) {
      imageParts.forEach(p => {
        if (p.inlineData) {
          currentParts.push({ inlineData: p.inlineData });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        topP: 0.9,
      },
    });

    return formatVoiceflowText(response.text || "Erreur de synchronisation.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Liaison neural interrompue. <b>Contactez-nous</b> sur contact@douliacameroun.com.";
  }
};

export const generateAuditReport = async (context: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Génère un rapport d'audit JSON ultra-détaillé basé sur le contexte suivant pour une entreprise au Cameroun : "${context}". 
    Le rapport doit être hautement professionnel et prêt pour une présentation.
    
    RÈGLES DU CONTENU JSON :
    - Identifie l'entreprise dans "companyName".
    - Identifie 3 à 5 points de douleur réels liés au secteur.
    - Pour les solutions, propose impérativement une "Automatisation" (gain de temps) et un "Agent IA" (cerveau décisionnel).
    - Explique précisément le profit financier ou opérationnel pour chaque solution.`,
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
                type: { type: Type.STRING, description: "Automatisation ou Agent IA" },
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
      model: "gemini-2.5-flash-preview-tts",
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