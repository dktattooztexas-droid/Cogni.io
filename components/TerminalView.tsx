import React, { useState } from 'react';
import { TerminalIcon, ClipboardIcon, CheckIcon } from './Icons';

interface TerminalViewProps {
  command: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ command }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-black/80 rounded-lg shadow-2xl border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 rounded-t-lg border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-300">Generated Command</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 font-semibold py-1 px-2 rounded-md transition-colors duration-200"
                    title="Copy to clipboard"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-4 font-mono text-sm text-green-300 bg-black/50 overflow-x-auto">
                <pre><code className="language-bash">{command}</code></pre>
            </div>
        </div>
    );
};
