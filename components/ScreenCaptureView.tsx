
import React, { useEffect, useRef } from 'react';
import { StopScreenShareIcon } from './Icons';

interface ScreenCaptureViewProps {
  stream: MediaStream;
  analysis: string | null;
  onStop: () => void;
}

export const ScreenCaptureView: React.FC<ScreenCaptureViewProps> = ({ stream, analysis, onStop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700 relative">
      <video ref={videoRef} autoPlay muted className="w-full h-auto rounded-t-lg" />
      <div className="absolute top-2 right-2">
        <button
          onClick={onStop}
          className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
          title="Stop Sharing"
        >
          <StopScreenShareIcon className="w-5 h-5" />
        </button>
      </div>
      {analysis && (
        <div className="p-4 bg-black/50 backdrop-blur-sm">
          <h3 className="font-bold text-cyan-400 mb-2">AI Analysis</h3>
          <p className="text-sm text-gray-300">{analysis}</p>
        </div>
      )}
    </div>
  );
};
