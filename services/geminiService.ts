const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export const chatWithDoulia = async (message: string, history: any[]) => {
  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [...history, { role: "user", parts: [{ text: message }] }]
    })
  });
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return { formattedText: text };
};

export const getChatFromLocal = () => {
  const saved = localStorage.getItem('doulia_chat');
  return saved ? JSON.parse(saved) : [];
};
