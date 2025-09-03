import React, { useRef } from 'react';
import { SparklesIcon, FileUploadIcon } from './Icons';

interface AnalysisPanelProps {
  onAnalyzeDay: () => void;
  isAnalysisDisabled: boolean;
  onAnalyzeFile: (fileContent: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onAnalyzeDay, isAnalysisDisabled, onAnalyzeFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onAnalyzeFile(content);
      }
    };
    reader.onerror = (e) => {
        console.error("Error reading file:", e);
    }
    reader.readAsText(file);
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };


  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 h-full border border-gray-700 flex flex-col justify-start">
        <h2 className="text-lg font-bold text-gray-100 mb-4">Productivity Tools</h2>
        
        <div className="border-b border-gray-700 pb-6 mb-6">
            <p className="text-sm text-gray-400 mb-4">
            Review your current session's conversation to get a summary and personalized tips.
            </p>
            <button 
                onClick={onAnalyzeDay}
                disabled={isAnalysisDisabled}
                title={isAnalysisDisabled ? "Have a longer conversation for analysis" : "Analyze your session"}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-md hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50">
                <SparklesIcon className="w-5 h-5" />
                Analyze My Day
            </button>
        </div>

        <div>
            <p className="text-sm text-gray-400 mb-4">
                For a deeper analysis, upload your exported browser history (JSON) or other text-based files. Your data is processed locally and is not stored.
            </p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,.txt,.md,.csv"
            />
            <button 
                onClick={handleFileButtonClick}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-gray-500 transition-all duration-200">
                <FileUploadIcon className="w-5 h-5" />
                Upload & Analyze File
            </button>
        </div>
    </div>
  );
};
