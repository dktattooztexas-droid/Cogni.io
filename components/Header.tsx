import React from 'react';
import { LogoIcon, AutonomousIcon } from './Icons';

interface HeaderProps {
    isAutonomousMode: boolean;
    onToggleAutonomousMode: () => void;
    isScreenSharing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isAutonomousMode, onToggleAutonomousMode, isScreenSharing }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-10 w-10 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-gray-100 tracking-wider">
                Cogni
              </h1>
              <p className="text-xs text-gray-400">Powered by Google Cloud & Hugging Face</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${isAutonomousMode && isScreenSharing ? 'text-cyan-400' : 'text-gray-400'}`}>Autonomous Mode</span>
              <button
                onClick={onToggleAutonomousMode}
                disabled={!isScreenSharing}
                title={isScreenSharing ? (isAutonomousMode ? 'Disable Autonomous Mode' : 'Enable Autonomous Mode') : 'Start screen sharing to enable autonomous mode'}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
                  isAutonomousMode && isScreenSharing ? 'bg-cyan-500' : 'bg-gray-600'
                } ${!isScreenSharing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                    isAutonomousMode && isScreenSharing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};