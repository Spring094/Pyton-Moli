import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <div key={i} className="min-h-[1.2em]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={j} className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[0.9em] mx-0.5">{part.slice(1, -1)}</code>;
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start items-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-white dark:from-slate-700 dark:to-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-center mr-2 shadow-sm shrink-0 mt-1 transition-colors">
          <span className="text-lg">🧪</span>
        </div>
      )}
      
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm relative transition-colors duration-300 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 text-white rounded-br-sm shadow-blue-500/20'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-slate-200/50 dark:shadow-none'
        }`}
      >
        <div className={`text-[15px] leading-relaxed ${isUser ? '' : 'prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2'}`}>
          {formatText(message.text)}
        </div>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center ml-2 shadow-sm shrink-0 mt-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      )}
    </div>
  );
};