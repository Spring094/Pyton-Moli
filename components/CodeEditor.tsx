import React, { useState, useRef, useEffect } from 'react';
import { simulatePythonRun, analyzeError, explainCode } from '../services/geminiService';

// Python keywords for autocompletion
const PYTHON_KEYWORDS = [
  'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return',
  'import', 'from', 'as', 'print', 'True', 'False', 'None',
  'try', 'except', 'finally', 'with', 'pass', 'break', 'continue',
  'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'bool',
  'and', 'or', 'not', 'is', 'in', 'global', 'lambda', 'yield'
];

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, toggleTheme, isDark }) => {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [caretCoords, setCaretCoords] = useState({ top: 0, left: 0 });

  // Auto-save visual state
  const [saved, setSaved] = useState(true);
  const isMounted = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null); // For syntax highlighting
  const mirrorRef = useRef<HTMLDivElement>(null); // For caret positioning

  // Effect to handle save status visual
  useEffect(() => {
    if (isMounted.current) {
      setSaved(false);
      const timer = setTimeout(() => {
        setSaved(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [code]);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Çalıştırılıyor...');
    
    // Run the code
    const result = await simulatePythonRun(code);
    
    // Check if there is an error in the output
    const hasError = result.includes("Traceback") || result.includes("Error") || result.includes("Exception");

    if (hasError) {
      setOutput(result + "\n\n🔍 Hata İnceleniyor...");
      const explanation = await analyzeError(code, result);
      if (explanation) {
        setOutput(result + "\n\n-------------------\n🧪 Moli'nin Notu:\n" + explanation);
      } else {
        setOutput(result);
      }
    } else {
      // Success case: Show result immediately, then fetch explanation
      setOutput(result + "\n\n👀 Moli deney sonucunu inceliyor...");
      
      // Automatically explain what happened using existing service logic (Chemistry analogies)
      const explanation = await explainCode(code);
      
      setOutput(result + "\n\n-------------------\n🧪 Moli'nin Analizi:\n" + explanation);
    }
    
    setIsRunning(false);
  };

  const handleExplain = async () => {
    if (!code.trim()) return;
    setIsExplaining(true);
    setOutput('🔬 Kod inceleniyor, moleküller ayrıştırılıyor...');
    
    const explanation = await explainCode(code);
    setOutput(explanation);
    setIsExplaining(false);
  };

  // Extract variables defined in the code to add to autocomplete
  const getVariables = (sourceCode: string) => {
    const vars = new Set<string>();
    // Match variable assignments: variable = ...
    const assignRegex = /^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm;
    let match;
    while ((match = assignRegex.exec(sourceCode)) !== null) {
      if (!PYTHON_KEYWORDS.includes(match[2])) {
        vars.add(match[2]);
      }
    }
    // Match function definitions
    const defRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = defRegex.exec(sourceCode)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  };

  const updateCaretCoordinates = (cursorIndex: number) => {
    if (!textareaRef.current || !mirrorRef.current) return;
    
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    
    // Copy essential styles to mirror to mimic text layout
    const computed = window.getComputedStyle(textarea);
    mirror.style.width = computed.width;
    mirror.style.font = computed.font;
    mirror.style.fontFamily = computed.fontFamily;
    mirror.style.fontSize = computed.fontSize;
    mirror.style.lineHeight = computed.lineHeight;
    mirror.style.padding = computed.padding;
    mirror.style.letterSpacing = computed.letterSpacing;
    
    // Text before caret
    const textBefore = code.substring(0, cursorIndex);
    mirror.textContent = textBefore;
    
    // Add a marker to find position
    const span = document.createElement('span');
    span.textContent = '.';
    mirror.appendChild(span);
    
    const top = span.offsetTop - textarea.scrollTop;
    const left = span.offsetLeft;
    
    // Adjust coordinates relative to the container
    setCaretCoords({ top: top + 24, left: left }); 
  };

  const updateSuggestions = (text: string, cursorIndex: number) => {
    // Find word currently being typed (backwards from cursor)
    let i = cursorIndex - 1;
    while (i >= 0 && /[a-zA-Z0-9_]/.test(text[i])) {
      i--;
    }
    const wordStart = i + 1;
    const currentWord = text.substring(wordStart, cursorIndex);

    if (currentWord.length > 0) {
      const allOptions = [...PYTHON_KEYWORDS, ...getVariables(text)];
      const filtered = Array.from(new Set(allOptions))
        .filter(opt => opt.startsWith(currentWord) && opt !== currentWord)
        .sort();
      
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setSuggestionIndex(0);
        setShowSuggestions(true);
        updateCaretCoordinates(cursorIndex);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    let i = cursor - 1;
    while (i >= 0 && /[a-zA-Z0-9_]/.test(code[i])) {
      i--;
    }
    const wordStart = i + 1;
    
    const before = code.substring(0, wordStart);
    const after = code.substring(cursor);
    
    const newCode = before + suggestion + after;
    setCode(newCode);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = wordStart + suggestion.length;
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete Navigation
    if (showSuggestions) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Existing Tab Indentation Logic
    if (e.key === 'Tab' && !showSuggestions) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const spaces = "    ";
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      
      setCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + spaces.length;
        }
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setCode(newVal);
    updateSuggestions(newVal, e.target.selectionStart);
  };

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current && highlightRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    // Hide suggestions on scroll to avoid misalignment
    setShowSuggestions(false);
  };

  // Basic Syntax Highlighting Logic
  const highlightCode = (input: string) => {
    // Escape HTML characters to prevent XSS and rendering issues
    let formatted = input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 1. Strings (single and double quoted)
    formatted = formatted.replace(
      /(['"])(?:(?=(\\?))\2.)*?\1/g,
      '<span class="text-amber-600 dark:text-amber-400">$0</span>'
    );

    // 2. Comments - IMPORTANT: Highlight comments distinctly
    const lines = formatted.split('\n');
    const processedLines = lines.map(line => {
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
          const openTags = (line.slice(0, commentIndex).match(/<span/g) || []).length;
          const closeTags = (line.slice(0, commentIndex).match(/<\/span>/g) || []).length;
          
          if (openTags === closeTags) {
              const before = line.slice(0, commentIndex);
              const comment = line.slice(commentIndex);
              return `${before}<span class="text-green-600 dark:text-green-400 italic opacity-90">${comment}</span>`;
          }
      }
      return line;
    });
    
    formatted = processedLines.join('\n');

    // 3. Keywords
    const keywordsRegex = new RegExp(`\\b(${PYTHON_KEYWORDS.join('|')})\\b`, 'g');
    formatted = formatted.replace(keywordsRegex, (match) => {
        return `<span class="text-purple-600 dark:text-purple-400 font-bold">${match}</span>`;
    });
    
    return formatted;
  };
  
  // Revised Syntax Highlighter (Simpler, Safer pipeline)
  const getHighlightedCode = () => {
    const tokens = code.split(/((?:#.*)|(?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*')|\b(?:\w+)\b|[^\w\s"']+|[\s]+)/g);
    
    return tokens.map((token, index) => {
      if (token.startsWith('#')) {
         return <span key={index} className="text-green-600 dark:text-green-400 italic">{token}</span>;
      }
      if (token.startsWith('"') || token.startsWith("'")) {
         return <span key={index} className="text-amber-600 dark:text-amber-400">{token}</span>;
      }
      if (PYTHON_KEYWORDS.includes(token)) {
         return <span key={index} className="text-purple-600 dark:text-purple-400 font-bold">{token}</span>;
      }
      return <span key={index}>{token}</span>;
    });
  };

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#1e1e2e] text-slate-800 dark:text-slate-300 transition-colors duration-300">
      {/* Toolbar */}
      <div className="bg-white dark:bg-[#181825] border-b border-slate-200 dark:border-white/5 p-3 px-4 flex justify-between items-center shadow-lg z-10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center border border-yellow-200 dark:border-yellow-500/20">
             <span className="text-lg">⚗️</span>
          </div>
          <div className="flex flex-col justify-center">
             <div className="flex items-center gap-2">
               <h2 className="font-bold text-slate-700 dark:text-slate-100 text-sm tracking-wide">main.py</h2>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] text-slate-500 font-mono">Python 3.10</span>
               <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide transition-all duration-300 ${saved ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
                 {saved ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     <span>KAYDEDİLDİ</span>
                   </>
                 ) : (
                   <>
                     <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                     <span className="animate-pulse">KAYDEDİLİYOR...</span>
                   </>
                 )}
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={toggleTheme}
            title={isDark ? "Aydınlık Mod'a Geç" : "Karanlık Mod'a Geç"}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          
           {/* Explain Code Button */}
           <button
            onClick={handleExplain}
            disabled={isExplaining || isRunning || !code.trim()}
            title="Kodu Açıkla"
            className={`p-2 rounded-lg transition-colors border border-transparent ${
                isExplaining 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-200 dark:hover:border-purple-500/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isExplaining ? 'animate-pulse' : ''}>
                <path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M12 2v2"></path><path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="m4.93 19.07 1.41-1.41"></path><path d="m17.66 6.34 1.41-1.41"></path>
                <circle cx="12" cy="12" r="7"></circle>
            </svg>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
              isRunning 
                ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-400 text-white dark:text-[#1e1e2e] shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transform hover:scale-[1.02]'
            }`}
          >
            {isRunning ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
            {isRunning ? '...' : 'ÇALIŞTIR'}
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 relative bg-white dark:bg-[#1e1e2e] overflow-hidden transition-colors duration-300 group">
        {/* Mirror div for caret calculation - Invisible */}
        <div 
           ref={mirrorRef}
           className="absolute top-0 left-0 p-4 pl-12 font-mono text-sm md:text-base leading-7 whitespace-pre-wrap pointer-events-none text-transparent z-[-1]"
        ></div>

        {/* Syntax Highlighter Layer - Visible but not editable */}
        <pre
            ref={highlightRef}
            aria-hidden="true"
            className="absolute top-0 left-0 w-full h-full p-4 pl-12 font-mono text-sm md:text-base leading-7 whitespace-pre pointer-events-none code-font overflow-hidden z-0"
        >
            {getHighlightedCode()}
        </pre>

        {/* Autocomplete Popup */}
        {showSuggestions && (
          <div 
            className="absolute z-50 bg-white dark:bg-[#11111b] border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg overflow-hidden flex flex-col min-w-[140px] max-h-[200px] overflow-y-auto"
            style={{ top: caretCoords.top, left: caretCoords.left }} 
          >
             {suggestions.map((s, i) => (
                <button 
                  key={s}
                  onClick={() => insertSuggestion(s)}
                  className={`px-3 py-1.5 text-left text-xs font-mono transition-colors ${i === suggestionIndex ? 'bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="opacity-50 mr-2">{PYTHON_KEYWORDS.includes(s) ? '🔑' : '📦'}</span>
                  {s}
                </button>
             ))}
          </div>
        )}

        {/* Line numbers gutter */}
        <div 
          ref={gutterRef}
          className="absolute left-0 top-0 bottom-0 w-10 bg-slate-50 dark:bg-[#181825] border-r border-slate-200 dark:border-white/5 pt-4 text-slate-400 dark:text-slate-600 font-mono text-xs select-none transition-colors duration-300 overflow-hidden z-20"
        >
          {lines.map((line) => (
             <div key={line} className="h-7 leading-7 text-center">{line}</div>
          ))}
        </div>

        {/* Actual Input Textarea - Transparent text but visible caret */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onClick={() => setShowSuggestions(false)}
          className="w-full h-full bg-transparent text-transparent caret-slate-800 dark:caret-white p-4 pl-12 font-mono text-sm md:text-base outline-none resize-none code-font leading-7 selection:bg-blue-100/50 dark:selection:bg-slate-500/30 transition-colors duration-300 whitespace-pre z-10"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          placeholder="Kodunu buraya yaz..."
        />
      </div>

      {/* Output Terminal */}
      <div className="h-[40%] min-h-[180px] bg-slate-100 dark:bg-[#11111b] border-t border-slate-200 dark:border-white/10 flex flex-col pb-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.3)] transition-colors duration-300">
        <div className="px-4 py-2 bg-slate-200/50 dark:bg-[#181825] border-b border-slate-200 dark:border-white/5 flex justify-between items-center transition-colors duration-300">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400">
               <polyline points="4 17 10 11 4 5"></polyline>
               <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Terminal</span>
          </div>
          <button onClick={() => setOutput('')} className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors bg-white/50 dark:bg-white/5 px-2 py-1 rounded">TEMİZLE</button>
        </div>
        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap selection:bg-green-200 dark:selection:bg-green-500/30">
          {output ? (
             // Markdown rendering for explanation is complex, so we stick to simple text for now,
             // but we style it nicely if it's not an error.
            <div className={`leading-relaxed ${output.includes("Error") || output.includes("Hata") ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
               {output.split('\n').map((line, i) => (
                   <div key={i}>{line}</div>
               ))}
            </div>
          ) : (
            <div className="text-slate-400 dark:text-slate-600/50 italic flex flex-col gap-1">
              <span>$ python main.py</span>
              <span>...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};