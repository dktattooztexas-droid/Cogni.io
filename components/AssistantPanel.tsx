

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
// FIX: Replaced non-existent 'ClipboardCheckIcon' with 'ClipboardIcon'.
import { User, Bot, MicIcon, SendIcon, ScreenShareIcon, StopScreenShareIcon, LoadingIcon, AutonomousIcon, ClipboardIcon } from './Icons';

interface AssistantPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, withScreenshot?: boolean) => void;
  onStartScreenShare: () => void;
  isSharingScreen: boolean;
  commandHistory: string[];
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const isProactive = message.type === 'proactive';

    const Icon = isProactive ? AutonomousIcon : (isUser ? User : Bot);
    const iconBg = isProactive ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : isUser ? 'bg-gray-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600';
    const bubbleBg = isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none';
    
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            )}
            <div className={`max-w-lg px-4 py-3 rounded-2xl ${bubbleBg} prose prose-invert prose-sm break-words`}>
                 {isProactive && <p className="text-xs font-bold text-purple-300 mb-1">Proactive Suggestion</p>}
                 <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
            </div>
            {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>}
        </div>
    );
};

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  chatHistory,
  isLoading,
  onSendMessage,
  onStartScreenShare,
  isSharingScreen,
  commandHistory,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSpeechResult = (transcript: string) => {
    setInputValue(transcript);
  };

  const { isListening, isSupported, startListening } = useSpeechRecognition(handleSpeechResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), isSharingScreen);
      setInputValue('');
      setHistoryIndex(-1);
    }
  };

  const handleOutputSubmit = () => {
      if (outputValue.trim()) {
          const message = `Here is the output from the last command I ran:\n\n\`\`\`\n${outputValue.trim()}\n\`\`\``;
          onSendMessage(message, false);
          setOutputValue('');
      }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHistoryIndex(-1); // Reset history navigation when user types
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (commandHistory.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      if (newIndex !== historyIndex) {
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      if (newIndex !== historyIndex) {
        setHistoryIndex(newIndex);
        setInputValue(newIndex === -1 ? '' : commandHistory[newIndex]);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl flex flex-col h-[70vh] overflow-hidden border border-gray-700">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {chatHistory.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <LoadingIcon className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="max-w-lg px-4 py-3 rounded-2xl bg-gray-700 text-gray-400 rounded-bl-none italic">
                    Thinking...
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStartScreenShare}
            className={`flex-shrink-0 p-2 rounded-full transition-colors duration-200 ${
              isSharingScreen 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
            }`}
            title={isSharingScreen ? "Stop Screen Share" : "Start Screen Share"}
          >
            {isSharingScreen ? <StopScreenShareIcon className="w-5 h-5" /> : <ScreenShareIcon className="w-5 h-h-5" />}
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask me anything, or describe a task..."}
            className="flex-1 w-full bg-gray-700 text-gray-200 placeholder-gray-400 border-transparent rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          {isSupported && (
            <button
                type="button"
                onClick={startListening}
                disabled={isListening || isLoading}
                className={`flex-shrink-0 p-2 rounded-full transition-colors duration-200 ${isListening ? 'bg-cyan-500 text-white animate-pulse' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                title="Use Voice Command"
            >
                <MicIcon className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            title="Send Message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center gap-3">
            <textarea
                value={outputValue}
                onChange={(e) => setOutputValue(e.target.value)}
                placeholder="Paste command output here for analysis..."
                className="flex-1 w-full bg-gray-700 text-gray-200 placeholder-gray-400 border-transparent rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={2}
                disabled={isLoading}
            />
            <button
                type="button"
                onClick={handleOutputSubmit}
                disabled={!outputValue.trim() || isLoading}
                className="flex-shrink-0 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                title="Analyze Output"
            >
                {/* FIX: Replaced non-existent 'ClipboardCheckIcon' with 'ClipboardIcon'. */}
                <ClipboardIcon className="w-5 h-5" />
            </button>
        </div>

        {isSharingScreen && <p className="text-xs text-center text-green-400 mt-1">Screen sharing is active. Your next message will include a screenshot.</p>}
      </div>
    </div>
  );
};
