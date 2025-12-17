import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { DropzoneArea } from './components/Dropzone';
import { ResultCard } from './components/ResultCard';
import { ToastContainer } from './components/Toast';
import { analyzeJDResume } from './utils/analyze';
import { AnalysisResponse, AnalysisStatus, FileData, ToastMessage } from './types';

const App: React.FC = () => {
  const [jdData, setJdData] = useState<FileData | null>(null);
  const [resumeData, setResumeData] = useState<FileData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Theme State - Default to light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    }
    return 'light';
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const addToast = useCallback((type: 'success' | 'error', message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#22c55e', '#ffffff'], // Primary, Success, White
      disableForReducedMotion: true
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleAnalyze = useCallback(async () => {
    if (!jdData || !resumeData) return;

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStatus(AnalysisStatus.ANALYZING);
    setResult(null);

    try {
      const response = await analyzeJDResume(
        jdData.text,
        resumeData.text,
        undefined,
        abortController.signal
      );
      
      console.log("Analysis Result:", response); // Debug log

      setResult(response);
      setStatus(AnalysisStatus.SUCCESS);
      addToast('success', 'Analysis complete!');

      if (response.score >= 90) {
        triggerConfetti();
      }
    } catch (error: any) {
      if (error.message === 'Request cancelled') return;
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
      addToast('error', error.message || "Something went wrong during analysis");
    } finally {
      abortControllerRef.current = null;
    }
  }, [jdData, resumeData, addToast]);

  // Keyboard shortcut Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (jdData && resumeData && status !== AnalysisStatus.ANALYZING) {
          handleAnalyze();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jdData, resumeData, status, handleAnalyze]);

  const canAnalyze = jdData && resumeData && status !== AnalysisStatus.ANALYZING;

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans flex flex-col items-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all hover:scale-105"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <i className="fi fi-rr-brightness text-xl flex items-center justify-center"></i>
          ) : (
            <i className="fi fi-rs-moon-stars text-xl flex items-center justify-center"></i>
          )}
        </button>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Hero */}
      <header className="max-w-4xl w-full text-center mb-10 mt-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 transition-colors">
          Recruit <span className="text-primary">AI</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed transition-colors">
          Instantly evaluate candidate fit. Upload a Job Description and a Resume to get an AI-powered match score and summary.
        </p>
      </header>

      <main className="max-w-5xl w-full">
        {/* Drop Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="h-full">
            <DropzoneArea 
              label="1. Job Description" 
              fileData={jdData} 
              onFileLoaded={setJdData} 
              onError={(msg) => addToast('error', msg)}
            />
          </div>
          <div className="h-full">
            <DropzoneArea 
              label="2. Candidate Resume" 
              fileData={resumeData} 
              onFileLoaded={setResumeData} 
              onError={(msg) => addToast('error', msg)}
            />
          </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center justify-center gap-4 sticky bottom-6 z-20">
           {status === AnalysisStatus.ANALYZING ? (
             <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl flex items-center justify-center gap-4 transition-colors">
                <div className="relative">
                  <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-600 rounded-full"></div>
                  <div className="w-6 h-6 border-t-2 border-primary rounded-full absolute top-0 left-0 animate-spin"></div>
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium animate-pulse">AI is thinking...</span>
             </div>
           ) : (
             <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`
                group relative w-full max-w-md py-4 px-8 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform
                ${canAnalyze 
                  ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'}
              `}
            >
              Analyze Match
              {canAnalyze && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-normal bg-white/20 px-2 py-1 rounded">
                  Ctrl + Enter
                </span>
              )}
            </button>
           )}
        </div>

        {/* Results */}
        <div className="mb-20">
          {result && (
            <ResultCard 
              result={result} 
              onEmailSuccess={() => {
                // Frontend-only success flow - show toast for 60 seconds
                addToast('success', 'Email sent successfully.', 60000);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;