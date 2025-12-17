import React from 'react';
import { AnalysisResponse } from '../types';

interface ResultCardProps {
  result: AnalysisResponse;
  onEmailSuccess: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onEmailSuccess }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;
  
  const isSelected = result.match === 'YES';
  const colorClass = isSelected ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500';
  const ringColor = isSelected ? 'stroke-green-500' : 'stroke-rose-500';
  const bgBadge = isSelected ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';

  const [email, setEmail] = React.useState(result.candidate_email || '');
  const [isSending, setIsSending] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email || isSending || emailSent) return;
    
    setIsSending(true);
    
    // Simulate sending delay then show success
    setTimeout(() => {
      setIsSending(false);
      setEmailSent(true);
      onEmailSuccess();
    }, 1000);
  };

  const getButtonText = () => {
    if (isSending) return 'Sending…';
    if (emailSent) return 'Sent ✓';
    return 'Send Email';
  };

  return (
    <div className="w-full mt-8 space-y-6 animate-fade-in-up">
      {/* Main Score Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
              <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`${ringColor} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{result.score}%</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Match</span>
            </div>
          </div>

          {/* Header Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {result.candidate_name}
              </h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${bgBadge} ${colorClass}`}>
                {isSelected ? 'RECOMMENDED FOR INTERVIEW' : 'NOT RECOMMENDED'}
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              {result.summary}
            </p>
          </div>
        </div>

        {/* Score Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
           <ScoreItem label="Technical Skills" score={result.analysis_breakdown.technical_score} />
           <ScoreItem label="Experience" score={result.analysis_breakdown.experience_score} />
           <ScoreItem label="Soft Skills" score={result.analysis_breakdown.soft_skills_score} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold text-green-700 dark:text-green-400 mb-4">
            <i className="fi fi-rr-check-circle"></i> Key Match Areas
          </h3>
          <ul className="space-y-2">
            {result.key_skills_matched.length > 0 ? (
              result.key_skills_matched.map((skill, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                  {skill}
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic text-sm">No strong matches identified.</li>
            )}
          </ul>
        </div>

        {/* Missing Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold text-rose-600 dark:text-rose-400 mb-4">
            <i className="fi fi-rr-cross-circle"></i> Missing / To Improve
          </h3>
          <ul className="space-y-2">
             {result.skills_missing.length > 0 ? (
              result.skills_missing.map((skill, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                  {skill}
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic text-sm">No major gaps identified.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Detailed Reasoning & Email */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-md font-bold text-slate-900 dark:text-slate-200 mb-2">Detailed Reasoning</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {result.reasoning}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-500 mb-1">Send full report to candidate</label>
            <input 
              type="email" 
              placeholder="Candidate Email" 
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={isSending || emailSent || !email}
            className={`w-full sm:w-auto mt-5 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              emailSent 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600'
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

const ScoreItem = ({ label, score }: { label: string, score: number }) => (
  <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{score}</span>
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${score}%` }}></div>
    </div>
  </div>
);