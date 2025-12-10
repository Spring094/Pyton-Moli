import React, { useState } from 'react';
import { Tab } from '../types';

interface NavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800 p-3 pb-8 md:pb-3 flex justify-around items-center z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.04)] transition-colors duration-300">
      <button
        onClick={() => setActiveTab(Tab.CHAT)}
        className={`group flex flex-col items-center gap-1.5 px-6 py-2 rounded-2xl transition-all duration-300 ${
          activeTab === Tab.CHAT
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-105'
            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-400'
        }`}
      >
        <div className={`transition-transform duration-300 ${activeTab === Tab.CHAT ? '-translate-y-0.5' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={activeTab === Tab.CHAT ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === Tab.CHAT ? "fill-blue-600/20" : ""}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <span className={`text-[10px] font-bold tracking-wide transition-opacity duration-300 ${activeTab === Tab.CHAT ? 'opacity-100' : 'opacity-70'}`}>MOLİ</span>
      </button>

      <button
        onClick={() => setActiveTab(Tab.EDITOR)}
        className={`group flex flex-col items-center gap-1.5 px-6 py-2 rounded-2xl transition-all duration-300 ${
          activeTab === Tab.EDITOR
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 scale-105'
            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-400'
        }`}
      >
         <div className={`transition-transform duration-300 ${activeTab === Tab.EDITOR ? '-translate-y-0.5' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <span className={`text-[10px] font-bold tracking-wide transition-opacity duration-300 ${activeTab === Tab.EDITOR ? 'opacity-100' : 'opacity-70'}`}>KODLAMA</span>
      </button>
    </div>
  );
};