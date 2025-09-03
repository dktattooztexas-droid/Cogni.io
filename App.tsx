import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AssistantPanel } from './components/AssistantPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ScreenCaptureView } from './components/ScreenCaptureView';
import { TerminalView } from './components/TerminalView';
import type { ChatMessage } from './types';
import { getAssistance } from './services/geminiService';

// FIX: Add type definition for the ImageCapture API which may not be present in default TypeScript typings.
declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  grabFrame(): Promise<ImageBitmap>;
}

const AUTONOMOUS_ANALYSIS_INTERVAL = 20000; // 20 seconds
const COMMAND_HISTORY_KEY = 'cogni_command_history';

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: "Hello! I'm Cogni. Ask me to perform a task, and I'll generate the command for you to run. Then, paste the output back for analysis.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAutonomousMode, setIsAutonomousMode] = useState(false);
  const [suggestedCommand, setSuggestedCommand] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  
  const autonomousIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(COMMAND_HISTORY_KEY);
      if (storedHistory) {
        setCommandHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load command history from localStorage:", error);
    }
  }, []);

  const takeScreenshot = async (): Promise<string | null> => {
    if (!screenStream) return null;
    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') {
        console.warn("Video track not available or not live.");
        return null;
    }

    try {
      const imageCapture = new ImageCapture(videoTrack);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) return null;
      
      context.drawImage(bitmap, 0, 0);
      return canvas.toDataURL('image/jpeg').split(',')[1];
    } catch (error) {
      console.error("Error taking screenshot:", error);
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      return null;
    }
  };

  const handleSendMessage = useCallback(async (message: string, withScreenshot: boolean = false) => {
    if (isLoading || !message.trim()) return;

    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setSuggestedCommand(null); // Clear previous command

    let screenshotBase64: string | null = null;
    if (withScreenshot && screenStream) {
        screenshotBase64 = await takeScreenshot();
    }
    
    try {
      const fullResponse = await getAssistance(message, screenshotBase64);
      
      const commandRegex = /```bash\n([\s\S]*?)\n```/;
      const match = fullResponse.match(commandRegex);
      const command = match ? match[1].trim() : null;
      const cleanResponse = fullResponse.replace(commandRegex, '').trim();

      if (command) {
        setSuggestedCommand(command);
        setCommandHistory(prevHistory => {
          const newHistory = [command, ...prevHistory.filter(c => c !== command)].slice(0, 50); // Add to front, remove duplicates, limit to 50
          try {
            localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(newHistory));
          } catch (error) {
            console.error("Failed to save command history to localStorage:", error);
          }
          return newHistory;
        });
      }
      
      if(cleanResponse) {
        setChatHistory(prev => [...prev, { role: 'bot', content: cleanResponse }]);
      }

      if(withScreenshot) {
        setAiAnalysis(cleanResponse || "I've analyzed the screen. See my response in the chat.");
      }
    } catch (error) {
      console.error("Error from Gemini API:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setChatHistory(prev => [...prev, { role: 'bot', content: `Sorry, I ran into an issue: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, screenStream]);

  const handleStartScreenShare = async () => {
    if (screenStream) {
        handleStopScreenShare();
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stream.getVideoTracks()[0].addEventListener('ended', handleStopScreenShare);
      setScreenStream(stream);
      setAiAnalysis("Screen sharing started. Ask me a question about what you see!");
    } catch (error) {
      console.error("Error starting screen share:", error);
      setChatHistory(prev => [...prev, { role: 'bot', content: "Could not start screen sharing. Please ensure you've granted permission." }]);
    }
  };

  const handleStopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.removeEventListener('ended', handleStopScreenShare);
        track.stop();
      });
      setScreenStream(null);
      setAiAnalysis(null);
    }
  }, [screenStream]);


  const runProactiveAnalysis = useCallback(async () => {
    if (isLoading) return; 
    console.log("Running proactive analysis...");

    const screenshotBase64 = await takeScreenshot();
    if (!screenshotBase64) return;

    const prompt = `Analyze the attached screenshot of my screen. I have not asked for help, but I want you to be a proactive assistant. Identify if I might be stuck, making an error, or could be doing something more efficiently. If you have a clear, concise, and highly relevant suggestion, provide it. If not, respond with the exact string 'NO_SUGGESTION'. Do not greet me.`;

    try {
      const response = await getAssistance(prompt, screenshotBase64);
      if (response && response.trim() !== 'NO_SUGGESTION') {
        setChatHistory(prev => [...prev, { role: 'bot', content: response, type: 'proactive' }]);
      }
    } catch (error) {
      console.error("Error during proactive analysis:", error);
    }
  }, [isLoading, takeScreenshot]);


  useEffect(() => {
    if (isAutonomousMode && screenStream) {
        if (autonomousIntervalRef.current) {
            clearInterval(autonomousIntervalRef.current);
        }
        autonomousIntervalRef.current = window.setInterval(runProactiveAnalysis, AUTONOMOUS_ANALYSIS_INTERVAL);
        
        setChatHistory(prev => [...prev, {role: 'bot', content: "Autonomous mode activated. I'll keep an eye on your screen and offer suggestions if I see something helpful.", type: 'proactive'}]);

    } else {
        if (autonomousIntervalRef.current) {
            clearInterval(autonomousIntervalRef.current);
            autonomousIntervalRef.current = null;
        }
    }

    return () => {
        if (autonomousIntervalRef.current) {
            clearInterval(autonomousIntervalRef.current);
        }
    };
  }, [isAutonomousMode, screenStream, runProactiveAnalysis]);


  const analyzeDay = useCallback(async () => {
      if (chatHistory.length < 2) {
          setChatHistory(prev => [...prev, {role: 'bot', content: "I need a bit more conversation to analyze your day. Ask me a few more questions or work with me on a task, then try again."}]);
          return;
      }
      const conversation = chatHistory
        .map(msg => `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const prompt = `Based on our conversation below, please provide a summary of my activities and suggest ways to improve my productivity. Analyze the topics I've asked about and the problems I've tried to solve to infer my workflow and challenges. Present it as a "Productivity Analysis" with key takeaways.\n\nConversation History:\n${conversation}`;
      
      const userMessageForHistory = "Can you analyze my day based on our conversation?";
      
      setIsLoading(true);
      setChatHistory(prev => [...prev, { role: 'user', content: userMessageForHistory }]);

      try {
        const response = await getAssistance(prompt, null);
        setChatHistory(prev => [...prev, { role: 'bot', content: response }]);
      } catch (error) {
        console.error("Error from Gemini API during analysis:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setChatHistory(prev => [...prev, { role: 'bot', content: `Sorry, I ran into an issue during the analysis: ${errorMessage}` }]);
      } finally {
        setIsLoading(false);
      }
  }, [chatHistory]);

  const handleFileAnalysis = useCallback(async (fileContent: string) => {
    const prompt = `Please act as a productivity expert. Analyze the following data, which could be an exported browser history or another document, to provide a summary of my recent activities. Identify key themes, topics of interest, and suggest ways I could work more efficiently or learn more effectively based on this data. Format the output clearly.\n\nData:\n${fileContent}`;

    const userMessageForHistory = "I've uploaded a file for analysis. Here are the insights:";

    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: "Analyzing uploaded file..." }]);

    try {
        const response = await getAssistance(prompt, null);
        setChatHistory(prev => {
            const newHistory = [...prev];
            const lastMessageIndex = newHistory.length - 1;
            if(newHistory[lastMessageIndex].role === 'user' && newHistory[lastMessageIndex].content.startsWith("Analyzing")) {
                newHistory.pop(); 
            }
            return [...newHistory, { role: 'user', content: userMessageForHistory }, { role: 'bot', content: response }];
        });
    } catch (error) {
        console.error("Error from Gemini API during file analysis:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setChatHistory(prev => [...prev, { role: 'bot', content: `Sorry, I ran into an issue during the file analysis: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const toggleAutonomousMode = () => {
      if (screenStream) {
        setIsAutonomousMode(prev => !prev);
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header 
        isAutonomousMode={isAutonomousMode}
        onToggleAutonomousMode={toggleAutonomousMode}
        isScreenSharing={!!screenStream}
      />
      <main className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AssistantPanel
            chatHistory={chatHistory}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onStartScreenShare={handleStartScreenShare}
            isSharingScreen={!!screenStream}
            commandHistory={commandHistory}
          />
          {screenStream && (
            <ScreenCaptureView 
                stream={screenStream} 
                analysis={aiAnalysis}
                onStop={handleStopScreenShare}
            />
          )}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          <AnalysisPanel 
            onAnalyzeDay={analyzeDay} 
            isAnalysisDisabled={chatHistory.length < 2}
            onAnalyzeFile={handleFileAnalysis}
          />
          {suggestedCommand && <TerminalView command={suggestedCommand} />}
        </div>
      </main>
    </div>
  );
};

export default App;