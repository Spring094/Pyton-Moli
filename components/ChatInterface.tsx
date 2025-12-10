import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { sendMessageStream } from '../services/geminiService';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  toggleTheme: () => void;
  isDark: boolean;
}

const ANALOGIES = [
  { concept: "Değişken (Variable)", analogy: "Deney Kabı / Beher ⚗️", desc: "İçine veri (sıvı/madde) koyduğumuz ve üzerine etiket yapıştırdığımız kap." },
  { concept: "Fonksiyon (Function)", analogy: "Kimyasal Tepkime 💥", desc: "Giren maddeleri (parametreleri) alıp, yeni bir ürün (return) oluşturan işlem." },
  { concept: "Print (Yazdır)", analogy: "Gözlem Raporu 📝", desc: "Deney sonucunda ne olduğunu laboratuvar defterine not etmek." },
  { concept: "Hata (Error)", analogy: "Sızıntı / Patlama ⚠️", desc: "Deney düzeneğinde bir sorun olması. Panik yok, temizleyip tekrar deneriz!" },
  { concept: "Döngü (Loop)", analogy: "Santrifüj / Karıştırıcı 🔄", desc: "Bir işlemi belirli bir süre veya şart sağlanana kadar tekrar tekrar yapmak." },
  { concept: "Liste (List)", analogy: "Tüp Standı 🧪", desc: "Birden fazla maddeyi sırayla dizdiğimiz raf." },
  { concept: "If / Else (Koşul)", analogy: "Turnusol Kağıdı 🏳️‍🌈", desc: "Duruma göre (Asit mi Baz mı?) farklı işlem yapmaya karar vermek." },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages, toggleTheme, isDark }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalogies, setShowAnalogies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the model response
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const stream = sendMessageStream(userMsg.text);
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          // Ensure we are updating the model's message
          if (lastMsg.role === 'model') {
            lastMsg.text = fullText;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error receiving stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300 relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[40%] bg-indigo-100/40 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <span className="text-xl">🧪</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight transition-colors">Moli 🧪</h1>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider transition-colors">Kimyager Kod Arkadaşın</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalogies(true)}
            className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            title="Analoji Sözlüğü"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
      </div>

      {/* Analogies Modal */}
      {showAnalogies && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAnalogies(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-[zoomIn_0.2s_ease-out]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span>📘</span> Moli'nin El Kitabı
              </h3>
              <button 
                onClick={() => setShowAnalogies(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {ANALOGIES.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{item.concept}</span>
                    <span className="text-xs font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 shadow-sm border border-slate-100 dark:border-slate-600">{item.analogy}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center">
              <p className="text-[10px] text-slate-400">Kod yazarken bu terimleri hatırla! 🧪</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-36 z-10 scroll-smooth">
        {messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full opacity-40">
              <span className="text-4xl mb-2">👋</span>
              <p className="text-slate-500 dark:text-slate-400">Sohbeti başlatmak için bekle...</p>
           </div>
        )}
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.text === '' && (
          <div className="flex justify-start mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-white dark:from-slate-700 dark:to-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-center mr-2 shadow-sm shrink-0 mt-1">
              <span className="text-lg">🧪</span>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[4.5rem] md:bottom-16 left-0 w-full px-4 md:px-6 pb-4 pt-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 z-20 transition-colors duration-300">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
          <div className="relative flex gap-2 items-end bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Moli'ye bir şeyler sor..."
              className="flex-1 max-h-32 min-h-[48px] bg-transparent border-none focus:ring-0 resize-none py-3 px-3 text-slate-700 dark:text-slate-200 placeholder-slate-400 leading-relaxed"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-xl mb-0.5 transition-all duration-200 ${
                input.trim() 
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 transform' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};