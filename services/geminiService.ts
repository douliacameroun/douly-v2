// Ce code est sécurisé : il utilise la variable d'environnement de Vercel
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export const chatWithDoulia = async (message: string, history: any[]) => {
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: message }] }]
      })
    });

    if (!response.ok) throw new Error('Erreur API');

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return { formattedText: text };
  } catch (error) {
    console.error("Erreur Douly:", error);
    return { formattedText: "Désolée, j'ai une petite perturbation. Contactez-nous au 6 56 30 48 18." };
  }
};

export const getChatFromLocal = () => {
  const saved = localStorage.getItem('doulia_chat');
  return saved ? JSON.parse(saved) : [];
};
