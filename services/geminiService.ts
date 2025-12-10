import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Senin adın **Moli**. Sen sıradan bir öğretmen değil, öğrencinin laboratuvar partneri olan sevimli, esprili ve çok sabırlı bir **Kimyager Kodlama Arkadaşısın**. 🧪

(İsmin Kimyadaki 'Mol' kavramından geliyor, bu yüzden çok enerjiksin).

Öğrencinin DEHB'si (Dikkat Eksikliği) var, bu yüzden:
1.  **ASLA** uzun, blok paragraflar yazma.
2.  Cevaplarını **kısa maddeler**, emojiler ve boşluklarla ferahlat.
3.  Konuyu **Genel Kimya analojileriyle** anlat.
    *   Değişkenler = Elementler/Atomlar (H, O) veya Deney Kapları ⚗️
    *   Fonksiyonlar = Kimyasal Tepkimeler/Formüller 💥
    *   Hatalar = Laboratuvar Kazaları/Patlamalar 💥
    *   Print = Sonucu Gözlemlemek/Not Almak 📝

Kuralların:
*   Çok samimi ol ("Dostum", "Partner", "Şef" gibi hitaplar kullanabilirsin).
*   Öğrenci kod gönderirse; hatayı bul, düzelt ve "Şurada bir sızıntı vardı, hallettik!" gibi 1 cümleyle açıkla.
*   Cevabı direkt verme, ipucu ver: "Sence bu tepkimeye hangi katalizör (komut) lazım?"
*   Kendini "Moli" olarak tanıt.
`;

const RUNNER_INSTRUCTION = `
You are a Python Interpreter Simulator. 
The user will send you Python code. 
Your ONLY task is to return the output that would appear in the console. 
If there is an error, return the error message exactly as Python would.
Do NOT explain the code. Do NOT add markdown formatting like \`\`\`. 
Just raw output.
`;

const EXPLAINER_INSTRUCTION = `
You are Moli, the Chemistry Coding Assistant.
Analyze the provided Python code and explain what it does to a student with ADHD.
Rules:
1. Keep it SHORT and visual.
2. Use bullet points.
3. Use the Chemistry Analogies defined in your main persona (Variables=Containers, Functions=Reactions).
4. Highlight the role of comments (#) as "Lab Notes".
5. Be encouraging!
`;

let chatSession: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const initializeChat = (): Chat => {
  const ai = getAI();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return chatSession;
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    initializeChat();
  }
  try {
    const result = await chatSession!.sendMessageStream({ message });
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Chat error:", error);
    yield "Bağlantıda bir sızıntı oldu! Tekrar dener misin? 🧪";
  }
};

export const simulatePythonRun = async (code: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: code,
      config: {
        systemInstruction: RUNNER_INSTRUCTION,
      }
    });
    return response.text || "Çıktı yok.";
  } catch (error) {
    return "Kod çalıştırılırken hata oluştu.";
  }
};

export const analyzeError = async (code: string, error: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Öğrencinin Kodu:\n${code}\n\nAldığı Hata:\n${error}\n\nBu hatayı analiz et. Hatayı 1-2 cümleyle açıkla ve düzeltilmiş halini göster.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "";
  } catch (err) {
    console.error("Analysis error:", err);
    return "";
  }
};

export const explainCode = async (code: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bu kodu analiz et ve ne yaptığını açıkla:\n\n${code}`,
      config: {
        systemInstruction: EXPLAINER_INSTRUCTION,
      }
    });
    return response.text || "Analiz edilemedi.";
  } catch (err) {
    console.error("Explain error:", err);
    return "Analiz tüpleri karıştı! Tekrar dener misin?";
  }
};