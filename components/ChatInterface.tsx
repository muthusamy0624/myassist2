
import React, { useState, useEffect, useRef } from 'react';
import { Send, Play, Loader2, Palette, Zap, Globe, Code, RotateCcw, History, Trash2, MessageSquare, X, Lock, Square } from 'lucide-react';
import { Message, Theme, ChatSession } from '../types';
import Assistant3D from './Assistant3D';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
  onSendMessage: (text: string) => void;
  onPlayIntro: () => void;
  onStopSpeaking: () => void;
  onResetChat: () => void;
  chatHistory: ChatSession[];
  onLoadSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
}

const CyberParticles = () => {
  const particles = Array.from({ length: 25 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const animDuration = 5 + Math.random() * 10;
        const delay = Math.random() * 5;
        const size = 2 + Math.random() * 4;
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-pink-500/40 blur-[1px] animate-float-particle"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${animDuration}s`,
              animationDelay: `-${delay}s`,
              bottom: '-10px'
            }}
          />
        );
      })}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,#000_120%)]" />
      {/* Grid floor illusion */}
      <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[50vh] bg-[linear-gradient(transparent_0%,rgba(236,72,153,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(236,72,153,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] opacity-50 origin-bottom" />
    </div>
  );
};

const MatrixRainEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = new Array(columns).fill(1);
    const chars = '0123456789ABCDEF';

    const draw = () => {
      // Black with opacity for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Matrix Green
      ctx.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isProcessing, 
  onSendMessage,
  onPlayIntro,
  onStopSpeaking,
  onResetChat,
  chatHistory,
  onLoadSession,
  onDeleteSession
}) => {
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('cosmic');
  
  // History Logic
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryUnlocked, setIsHistoryUnlocked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Monitor Speech Synthesis for animation
  useEffect(() => {
    const checkSpeaking = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 100);
    return () => clearInterval(checkSpeaking);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    
    if (isHistoryUnlocked) {
      setShowHistory(true);
    } else {
      setShowAuthModal(true);
      setAuthError('');
      setAuthPassword('');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === 'old@0624') {
      setIsHistoryUnlocked(true);
      setShowAuthModal(false);
      setShowHistory(true);
      setAuthError('');
    } else {
      setAuthError('Access Denied: Incorrect Password');
    }
  };

  // --- Text Formatting Utility ---
  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-blue-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const formatMessage = (text: string) => {
    // CLEANING: Replace literal "\n" strings (which sometimes come from raw JSON) with real newlines
    const cleanText = text.replace(/\\n/g, '\n');

    // Split by double newlines to create blocks (paragraphs, lists, headers)
    const blocks = cleanText.split(/\n\n+/);
    
    return blocks.map((block, idx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // 1. Header Detection (### or ##)
      if (trimmedBlock.startsWith('###') || trimmedBlock.startsWith('##')) {
         const cleanHeader = trimmedBlock.replace(/^[#]+\s*/, '');
         return (
           <h3 key={idx} className="text-lg font-bold text-blue-200 mt-5 mb-2 border-b border-white/10 pb-1">
             {formatBold(cleanHeader)}
           </h3>
         );
      }

      // 2. List Detection (starts with *, -, or •)
      // Also handles cases where the block is just multiple lines of bullets
      if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('• ')) {
        const listItems = trimmedBlock.split(/\n/).filter(line => line.trim().length > 0);
        return (
          <ul key={idx} className="mb-4 pl-5 space-y-2">
            {listItems.map((item, i) => (
              <li key={i} className="list-disc ml-2 text-white/90 text-[15px] leading-relaxed">
                {formatBold(item.replace(/^[*•-]\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      // 3. Standard Paragraph
      // indent-8 adds the requested indentation to the first line
      // text-justify distributes text evenly for a clean look
      return (
        <p key={idx} className="mb-4 text-[15px] leading-7 indent-8 text-justify text-white/95 last:mb-0">
          {formatBold(trimmedBlock)}
        </p>
      );
    });
  };

  // Theme Configs
  const themes = {
    cosmic: {
      bg: 'bg-[#0f172a]',
      gradient: 'from-blue-600 to-indigo-600',
      accent: 'text-blue-400',
      bubbleUser: 'bg-blue-600',
      bubbleAi: 'bg-[#1e293b]/90',
      effects: (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e1b4b]"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(to right, rgba(79, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 70, 229, 0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px', maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', transform: 'perspective(1000px) rotateX(60deg) translateY(0) scale(2.5)', transformOrigin: '50% 100%' }} />
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        </>
      )
    },
    cyber: {
      bg: 'bg-[#13001a]',
      gradient: 'from-pink-600 to-purple-600',
      accent: 'text-pink-400',
      bubbleUser: 'bg-pink-600',
      bubbleAi: 'bg-[#2d1b4e]/90',
      effects: <CyberParticles />
    },
    matrix: {
      bg: 'bg-[#000000]',
      gradient: 'from-green-600 to-emerald-600',
      accent: 'text-green-400',
      bubbleUser: 'bg-green-700',
      bubbleAi: 'bg-[#052e16]/90',
      effects: <MatrixRainEffect />
    }
  };

  const t = themes[currentTheme];

  return (
    <main className={`flex-1 flex flex-col h-full relative overflow-hidden ${t.bg} transition-colors duration-700`}>
      
      {/* --- DYNAMIC BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {t.effects}
        {currentTheme !== 'matrix' && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>}
      </div>

      {/* TOP RIGHT CONTROLS */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-4">
        
        {/* Chat Controls */}
        <div className="flex gap-2 bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button 
            onClick={onResetChat}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Reset & Save Chat"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={handleToggleHistory}
            className={`p-2 rounded-full transition-all ${showHistory ? 'text-white bg-white/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Chat History"
          >
            {isHistoryUnlocked ? <History size={16} /> : <Lock size={16} />}
          </button>
        </div>

        {/* Theme Switcher */}
        <div className="flex gap-2 bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button onClick={() => setCurrentTheme('cosmic')} className={`p-2 rounded-full transition-all ${currentTheme === 'cosmic' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`} title="Cosmic">
            <Globe size={16} />
          </button>
          <button onClick={() => setCurrentTheme('cyber')} className={`p-2 rounded-full transition-all ${currentTheme === 'cyber' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'}`} title="Cyberpunk">
            <Zap size={16} />
          </button>
          <button onClick={() => setCurrentTheme('matrix')} className={`p-2 rounded-full transition-all ${currentTheme === 'matrix' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Matrix">
            <Code size={16} />
          </button>
        </div>
      </div>

      {/* HISTORY AUTH MODAL */}
      {showAuthModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-xs animate-[float_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Lock size={18} className="text-blue-400" />
                Protected History
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter Password" 
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm mb-3 focus:border-blue-500 outline-none"
                autoFocus
              />
              {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Unlock Access
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY SIDEBAR (Overlay) */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-40 transform transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-white flex items-center gap-2"><History size={18} /> Old Chats</h3>
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3">
          {chatHistory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">No saved chats yet.<br/>Reset a chat to save it here.</p>
          ) : (
            chatHistory.map(session => (
              <div key={session.id} className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-all border border-white/5">
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    onLoadSession(session);
                    setShowHistory(false);
                  }}
                >
                  <p className={`text-sm font-medium ${t.accent} truncate mb-1`}>{session.title}</p>
                  <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate opacity-60">{session.messages.length} messages</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Container - Full Height */}
      <div className="relative z-10 flex-1 flex flex-col xl:flex-row items-center justify-center xl:justify-between p-4 lg:p-6 gap-4 h-full overflow-hidden">
        
        {/* Left: 3D Visual & Status */}
        <div className="flex flex-col items-center justify-center space-y-6 flex-shrink-0 xl:w-1/3 mt-10 xl:mt-0">
          <div className="relative">
             <Assistant3D isSpeaking={isSpeaking} />
          </div>
          
          <div className="flex flex-col items-center gap-4">
             {/* Play/Stop Intro Button */}
             <button 
                onClick={isSpeaking ? onStopSpeaking : onPlayIntro}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
                  isProcessing 
                    ? 'bg-gray-700 opacity-50' 
                    : isSpeaking 
                      ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                      : `bg-gradient-to-r ${t.gradient} text-white`
                }`}
             >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" /> 
                ) : isSpeaking ? (
                  <Square size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
                {isProcessing ? 'Generating...' : isSpeaking ? 'Stop Intro' : 'Play Intro'}
             </button>
             
             <div className="flex items-center gap-2 px-4 py-1 bg-black/30 rounded-full border border-white/5">
               <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-ping' : 'bg-green-400'}`}></div>
               <p className={`text-xs font-mono ${t.accent} opacity-80`}>
                 {isSpeaking ? "SPEAKING..." : isProcessing ? "PROCESSING..." : "ONLINE"}
               </p>
             </div>
          </div>
        </div>

        {/* Right: Chat Panel - FULL HEIGHT, NO GAP */}
        <div className="w-full xl:w-2/3 max-w-5xl flex flex-col h-full bg-black/40 backdrop-blur-xl border-l border-t border-r border-white/10 rounded-t-3xl xl:rounded-3xl shadow-2xl overflow-hidden relative transition-all">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className={`w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-float ${t.accent}`}>
                   <MessageSquare size={32} />
                </div>
                <p className="text-lg font-medium text-white mb-2">System Ready</p>
                <p className={`text-sm ${t.accent} opacity-70 max-w-xs leading-relaxed`}>
                  Connected to neural profile. Select a topic or ask a question to begin interaction.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg text-white ${
                    msg.role === 'user' 
                      ? `${t.bubbleUser} rounded-br-none` 
                      : `${t.bubbleAi} border border-white/10 rounded-bl-none`
                  }`}
                >
                  {formatMessage(msg.text)}
                </div>
              </div>
            ))}
            
            {isProcessing && (
               <div className="flex justify-start animate-pulse">
                 <div className={`${t.bubbleAi} border border-white/5 p-4 rounded-2xl rounded-bl-none flex items-center space-x-3`}>
                    <Loader2 size={18} className={`animate-spin ${t.accent}`} />
                    <span className={`text-xs ${t.accent} tracking-wide uppercase`}>Computing...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-[#000000]/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command or query..."
                  className="w-full bg-white/5 text-white placeholder-gray-500 rounded-2xl py-4 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 text-base border border-white/5 transition-all"
                />
              </div>

              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isProcessing}
                className={`p-4 bg-gradient-to-r ${t.gradient} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg transform hover:scale-105 active:scale-95`}
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatInterface;
