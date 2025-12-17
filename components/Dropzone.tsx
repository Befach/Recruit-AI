import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FileData } from '../types';
import { extractText } from '../utils/extractText';

interface DropzoneAreaProps {
  label: string;
  fileData: FileData | null;
  onFileLoaded: (data: FileData | null) => void;
  onError: (msg: string) => void;
}

export const DropzoneArea: React.FC<DropzoneAreaProps> = ({ label, fileData, onFileLoaded, onError }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onError("File too large (max 5MB)");
      return;
    }

    setIsProcessing(true);
    try {
      const text = await extractText(file);
      onFileLoaded({
        file,
        text,
        parsed: true
      });
    } catch (err: any) {
      onFileLoaded(null);
      onError(err.message || "Failed to parse file");
    } finally {
      setIsProcessing(false);
    }
  }, [onFileLoaded, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileLoaded(null);
    setIsExpanded(false);
    setMode('upload');
    setPastedText('');
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    
    // Create a dummy file object for display purposes
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], "Pasted Text.txt", { type: "text/plain" });
    
    onFileLoaded({
        file,
        text: pastedText,
        parsed: true
    });
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors">{label}</h3>
      
      {!fileData ? (
        mode === 'upload' ? (
            <div className="flex flex-col h-full">
                <div
                {...getRootProps()}
                className={`
                    flex-1 min-h-[200px] flex flex-col items-center justify-center 
                    border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200
                    ${isDragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
                >
                <input {...getInputProps()} />
                <DocumentTextIcon className={`w-10 h-10 mb-3 ${isDragActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`} />
                {isProcessing ? (
                    <p className="text-sm text-slate-500 dark:text-slate-300 animate-pulse">Extracting text...</p>
                ) : (
                    <>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
                        {isDragActive ? "Drop it here!" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOCX, TXT (Max 5MB)</p>
                    </>
                )}
                </div>
                <div className="flex justify-center mt-2">
                    <button 
                        onClick={() => setMode('paste')}
                        className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <i className="fi fi-tr-paste text-lg leading-none"></i>
                        Or paste text directly
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex-1 min-h-[200px] flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-fade-in transition-colors">
                <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste ${label.toLowerCase().includes('resume') ? 'resume' : 'job description'} text here...`}
                    className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-3 transition-colors"
                    autoFocus
                />
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => { setMode('upload'); setPastedText(''); }}
                        className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePasteSubmit}
                        disabled={!pastedText.trim()}
                        className="bg-primary hover:bg-primary-hover disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Use Text
                    </button>
                </div>
            </div>
        )
      ) : (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-4 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 bg-green-500/20 p-2 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{fileData.file.name}</p>
                <p className="text-xs text-slate-500">{(fileData.file.size / 1024).toFixed(0)} KB • {fileData.text.length} chars</p>
              </div>
            </div>
            <button 
              onClick={clearFile}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span>{isExpanded ? 'Hide' : 'Show'} parsed text</span>
              {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            
            {isExpanded && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 max-h-[200px] overflow-y-auto border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {fileData.text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};