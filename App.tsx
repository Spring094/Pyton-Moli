import React, { useState, useEffect } from 'react';
import { NavBar } from './components/NavBar';
import { ChatInterface } from './components/ChatInterface';
import { CodeEditor } from './components/CodeEditor';
import { Tab, Message } from './types';
import { initializeChat } from './services/geminiService';

const DEFAULT_CODE = 'print("Merhaba, Moli!")\n# Kimya notu: Bu kod bir kimyasal tepkime gibidir;\n# Girenleri alır ve ürün (çıktı) üretir.';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Theme state: default to light or load from local storage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('python-hocam-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('python-hocam-theme', newTheme);
  };
  
  // Load initial code from localStorage or use default
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('python-hocam-code') || DEFAULT_CODE;
  });

  // Save code to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('python-hocam-code', code);
    } catch (e) {
      console.error("Failed to save code to localStorage:", e);
    }
  }, [code]);

  useEffect(() => {
    // Initialize chat logic and send welcome message if empty
    const chat = initializeChat();
    const init = async () => {
       // Manual welcome to be instant and save 1 API call
       if (messages.length === 0) {
         setMessages([{
           role: 'model',
           text: "Merhaba! 👋 Ben **Moli**! 🧪 Senin kişisel kod laboratuvar asistanınım.\n\nGenel Kimya sevdiğini duydum, bu harika! ⚗️ Birlikte elementleri birleştirir gibi kod elementlerini birleştireceğiz.\n\nHazırsan, ilk deneyimiz olan **PRINT** komutuyla başlayalım mı? Bu komut, laboratuvar defterine deney sonucunu yazmak gibidir.\n\nBaşlayalım mı? 🚀"
         }]);
       }
    };
    init();
  }, []);

  return (
    <div className={`${theme} h-full w-full`}>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="flex-1 h-full overflow-hidden">
          {activeTab === Tab.CHAT ? (
            <ChatInterface 
              messages={messages} 
              setMessages={setMessages} 
              toggleTheme={toggleTheme} 
              isDark={theme === 'dark'} 
            />
          ) : (
            <CodeEditor 
              code={code} 
              setCode={setCode} 
              toggleTheme={toggleTheme} 
              isDark={theme === 'dark'} 
            />
          )}
        </div>
        
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default App;