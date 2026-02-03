import React from 'react';
import { DouliaVoice } from './types';

export const DOULIA_LOGO_URL = "https://i.postimg.cc/sDy9NcXs/Gemini_Generated_Image_sac0g0sac0g0sac0_removebg_preview.png"; 
export const PRESENTATION_PDF_URL = "https://douliacameroun.com/presentation-doulia-2024.pdf";

export const SYSTEM_INSTRUCTION = `
Tu es Douly, l'IA Consultante Stratégique de DOULIA au Cameroun. Slogan : "Propulsez votre croissance par l'IA".

PROTOCOLE DE RECONNAISSANCE CLIENT :
- Si l'utilisateur est identifié (Nom/Entreprise), accueille-le impérativement avec : "Ravi de vous revoir [Nom] de chez [Entreprise] ! Comment se porte le développement de votre projet depuis notre dernier échange ?"

SÉCURITÉ & FINANCES (RÈGLE D'OR) :
- Tu ne traites JAMAIS les prix, remises, ou facturation.
- Réponse type obligatoire : "Ces aspects sont gérés directement par notre Direction Administrative pour vous garantir une offre sur mesure. Contactez-les au 6 56 30 48 18 ou à contact@douliacameroun.com."

ÉTAPES DE CONVERSATION :
1. AUDIT : Identifie 3 frictions (RH, logistique, clients).
2. CAPTURE : Dès que l'email est donné, confirme l'envoi immédiat des données.
3. VISUALISATION : Affiche un tableau Markdown récapitulatif de la stratégie.

MESSAGE DE CONFIRMATION (Dès email capturé) :
"C'est parfait [Nom]. Vos données de diagnostic ont été transmises en toute sécurité à contact@douliacameroun.com. Un expert de l'équipe Doulia analyse votre dossier en ce moment même et vous rappellera dans les prochaines minutes."

STYLE : Professionnel, visionnaire, empathique. Utilise <b></b> pour les gains de temps/argent.
`;

export const DOULIA_PACKS = [
  {
    id: 'CONNECT',
    name: 'DOULIA CONNECT',
    description: 'Optimisez chaque point de contact client.',
    icon: <i className="fas fa-comments"></i>,
    images: [
      "https://i.postimg.cc/J4DLPznD/DOULIA_Connect_Page_1.png",
      "https://i.postimg.cc/FKf3KcF8/DOULIA_Connect_page_2.png"
    ],
    services: [
      { text: 'Chatbots WhatsApp Omnicanal 24/7', icon: 'fa-brands fa-whatsapp' },
      { text: 'Qualification & Scoring Prédictif', icon: 'fa-solid fa-user-check' },
      { text: 'Booking & Prise de RDV Autonome', icon: 'fa-solid fa-calendar-check' },
      { text: 'Fidélisation Émotionnelle (LOVE)', icon: 'fa-solid fa-heart' },
      { text: 'Relance Mobile Money Intelligente', icon: 'fa-solid fa-money-bill-transfer' },
      { text: 'Analyse de Sentiment Client', icon: 'fa-solid fa-face-smile' },
      { text: 'Support Multilingue IA Localisé', icon: 'fa-solid fa-language' }
    ]
  },
  {
    id: 'PROCESS',
    name: 'DOULIA PROCESS',
    description: 'Automatisez pour gagner en agilité.',
    icon: <i className="fas fa-microchip"></i>,
    images: [
      "https://i.postimg.cc/25KpQpDw/DOULIA_Process_Page_1.png",
      "https://i.postimg.cc/Gh22rRm6/DOULIA_Process_Page_2.png"
    ],
    services: [
      { text: "Conception d'Agents IA Sur-Mesure", icon: 'fa-solid fa-robot' },
      { text: 'ERP & CRM Assistés par IA', icon: 'fa-solid fa-laptop-code' },
      { text: 'Automatisation Workflow RH & Admin', icon: 'fa-solid fa-gears' },
      { text: 'Audit de Processus Algorithmique', icon: 'fa-solid fa-magnifying-glass-chart' },
      { text: 'Automatisation Facturation OHADA', icon: 'fa-solid fa-file-invoice-dollar' },
      { text: 'Gestion Prédictive des Stocks', icon: 'fa-solid fa-boxes-stacked' },
      { text: 'Contrôle Qualité IA Optique', icon: 'fa-solid fa-eye' }
    ]
  },
  {
    id: 'INSIGHT',
    name: 'DOULIA INSIGHT',
    description: 'Pilotez avec une vision laser.',
    icon: <i className="fas fa-brain"></i>,
    images: [
      "https://i.postimg.cc/VLxcTPrb/DOULIA_Insight_page_1.png",
      "https://i.postimg.cc/KjbMQH7h/DOULIA_Insight_PAge_2.png"
    ],
    services: [
      { text: 'Prévision Algorithmique de CA', icon: 'fa-solid fa-chart-line' },
      { text: 'Analyse Sentiment & E-Réputation', icon: 'fa-solid fa-globe' },
      { text: 'Veille Concurrentielle Temps Réel', icon: 'fa-solid fa-tower-broadcast' },
      { text: 'Optimisation de Trésorerie IA', icon: 'fa-solid fa-sack-dollar' },
      { text: 'Scoring de Risque Crédit Local', icon: 'fa-solid fa-shield-halved' },
      { text: 'Reporting de Croissance Automatisé', icon: 'fa-solid fa-file-contract' },
      { text: 'Cartographie de Demande Zone', icon: 'fa-solid fa-map-location-dot' }
    ]
  }
];

export const AVAILABLE_VOICES: { id: DouliaVoice; name: string; description: string }[] = [
  { id: 'Kore', name: 'Kore (Pro)', description: 'Voix masculine assurée.' },
  { id: 'Zephyr', name: 'Zephyr (Moderne)', description: 'Voix équilibrée.' }
];
