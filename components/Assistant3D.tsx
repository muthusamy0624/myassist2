import React from 'react';

interface Assistant3DProps {
  isSpeaking: boolean;
}

const Assistant3D: React.FC<Assistant3DProps> = ({ isSpeaking }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Ring */}
      <div className={`absolute w-full h-full border-4 border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite] ${isSpeaking ? 'border-purple-500/50' : ''}`}></div>
      
      {/* Middle Ring */}
      <div className="absolute w-48 h-48 border-4 border-cyan-400/40 rounded-full animate-[spin_7s_linear_reverse_infinite]"></div>
      
      {/* Inner Ring */}
      <div className="absolute w-32 h-32 border-2 border-white/20 rounded-full animate-[spin_15s_linear_infinite]"></div>

      {/* Core Orb */}
      <div 
        className={`
          relative z-10 w-24 h-24 rounded-full 
          bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-900
          shadow-[0_0_50px_rgba(59,130,246,0.6)]
          flex items-center justify-center
          transition-all duration-500
          ${isSpeaking ? 'animate-pulse-glow scale-110' : 'animate-float'}
        `}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-blue-200 tracking-widest uppercase mb-1">AI</div>
          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden mx-auto">
            {isSpeaking && (
              <div className="h-full bg-white animate-pulse w-full"></div>
            )}
          </div>
        </div>
      </div>

      {/* Particle effects (CSS circles) */}
      <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full blur-sm animate-ping"></div>
      <div className="absolute bottom-10 right-10 w-1 h-1 bg-purple-400 rounded-full blur-sm animate-pulse"></div>
    </div>
  );
};

export default Assistant3D;