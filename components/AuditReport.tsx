import React from 'react';
import { playHoverSound } from '../services/audioEffects';

interface AuditReportProps {
  data: any;
  onClose: () => void;
  onExploreMore: () => void;
}

const AuditReport: React.FC<AuditReportProps> = ({ data, onClose }) => {
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-pulse">
      <div className="text-doulia-lime text-5xl mb-4"><i className="fas fa-brain"></i></div>
      <p className="text-slate-400 font-black uppercase tracking-widest">Initialisation du Diagnostic Stratégique...</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 animate-fade-in-up custom-scrollbar bg-slate-950/20">
      {/* Section 1 : En-tête */}
      <div className="bg-slate-950/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-doulia-lime/5 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <span className="text-[10px] font-black text-doulia-cyan uppercase tracking-[0.5em] block mb-2">Diagnostic Stratégique : DOULIA x {data.companyName || "Entreprise"}</span>
          <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase leading-none tracking-tighter">
            {data.title || "Plan de Transformation IA"}
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="bg-doulia-lime/10 px-4 py-1.5 rounded-full border border-doulia-lime/20 text-[9px] font-black text-doulia-lime uppercase tracking-widest">
              Secteur : {data.sector || "Analyse en cours"}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2 : Analyse des Points de Douleur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 space-y-5 shadow-xl hover:border-red-500/20 transition-all">
          <h3 className="text-[11px] font-black text-red-400 uppercase tracking-widest flex items-center gap-3">
            <i className="fas fa-shield-virus"></i> Facteurs de Risque & Blocages
          </h3>
          <ul className="space-y-4">
            {(data.pains || ["Collecte des données..."]).map((pain: string, idx: number) => (
              <li key={idx} className="text-[14px] font-medium text-slate-300 flex gap-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span> {pain}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 4 : ROI (Simplifié et mis en avant) */}
        <div className="bg-doulia-lime text-slate-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-2 opacity-70">Impact Rentabilité Estimé</h3>
              <div className="text-5xl font-black tracking-tighter mb-4 leading-none animate-pulse">
                {data.roiEstimate || "+35% ROI"}
              </div>
            </div>
            <p className="text-[12px] font-bold leading-relaxed opacity-90 border-t border-slate-900/10 pt-4">
              Projection basée sur l'optimisation des flux opérationnels et la réduction des coûts de traitement manuel.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 : Solutions Préconisées */}
      <div className="bg-slate-950/40 backdrop-blur-md p-8 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
           <h3 className="text-[11px] font-black text-doulia-lime uppercase tracking-widest">Architecture Solution IA</h3>
           <i className="fas fa-microchip text-doulia-lime opacity-30"></i>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(data.solutions || []).map((sol: any, idx: number) => (
            <div key={idx} className="p-7 rounded-3xl bg-white/5 border border-white/5 hover:border-doulia-cyan/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-[8px] font-black text-white/10 uppercase tracking-widest">{sol.type || "Neural Solution"}</div>
              <div className="w-12 h-12 rounded-xl bg-doulia-cyan/10 flex items-center justify-center text-doulia-cyan mb-5 group-hover:bg-doulia-cyan group-hover:text-slate-950 transition-all duration-500 shadow-inner">
                <i className={idx === 0 ? "fas fa-bolt-lightning" : "fas fa-brain-circuit"}></i>
              </div>
              <h4 className="text-[16px] font-black text-white uppercase mb-3 tracking-tight">{sol.pack || "Module IA"}</h4>
              <p className="text-[13px] font-medium text-slate-400 mb-5 leading-relaxed">{sol.benefit}</p>
              <div className="text-[11px] font-bold text-doulia-cyan p-4 bg-doulia-cyan/5 rounded-2xl border border-doulia-cyan/10 backdrop-blur-sm">
                <span className="block mb-1 text-[8px] opacity-50 uppercase tracking-widest">Analyse de Profitabilité</span>
                {sol.profitAnalysis}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / CTA Final */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-gradient-to-r from-slate-950 to-slate-900 rounded-[3rem] border border-white/10 shadow-inner">
        <div className="max-w-md">
          <p className="text-[14px] font-medium text-slate-300 italic mb-1">
            "{data.nextSteps || "Prêt à transformer vos opérations avec DOULIA ?"}"
          </p>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VALIDÉ PAR LE COMITÉ STRATÉGIQUE</span>
        </div>
        <button 
          onClick={onClose} 
          onMouseEnter={playHoverSound}
          className="w-full md:w-auto px-10 py-5 bg-doulia-lime text-slate-950 font-black rounded-2xl uppercase text-[12px] tracking-widest shadow-[0_0_30px_rgba(190,242,100,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Confirmer & Finaliser
        </button>
      </div>
      
      <p className="text-center text-[8px] text-slate-700 uppercase tracking-[0.5em] font-black opacity-30 select-none pb-12">
        Neural Report v4.2 • Propriété de DOULIA IA Agency
      </p>
    </div>
  );
};

export default AuditReport;