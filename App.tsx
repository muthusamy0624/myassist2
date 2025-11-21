import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ProfileModal from './components/ProfileModal';
import { Message, Profile, ChatSession } from './types';
import { supabase, TABLE_NAME, PROFILE_ID, isSupabaseConfigured } from './services/supabase';
import { generateAssistantResponse } from './services/gemini';
import { Menu } from 'lucide-react';

const MOCK_PROFILE: Profile = {
  id: PROFILE_ID,
  linkedin: 'https://www.linkedin.com/in/muthusamy-m-ba3066258/',
  github: 'https://github.com/muthusamy0624',
  image_url: 'https://picsum.photos/200/200',
  resume_url: '',
  resume_text: `Muthusamy
Software Engineer

Summary:
I am a passionate and dedicated Software Engineer with a robust background in Full Stack Development. I specialize in building scalable, high-performance web applications using modern technologies like React, Node.js, and TypeScript. My journey in tech has been driven by a curiosity to solve complex problems and a desire to create user-centric digital experiences. I have a strong aptitude for integrating Artificial Intelligence into web platforms, as demonstrated by my work with the Gemini API and Supabase.

Skills:
- Frontend: JavaScript (ES6+), TypeScript, React.js, HTML5, CSS3, Tailwind CSS, Redux.
- Backend: Node.js, Express.js, Python.
- Database: SQL, PostgreSQL, Supabase, MongoDB.
- Tools: Git, GitHub, VS Code, Android Studio, Arduino IDE, Canva, NS2.
- Concepts: RESTful APIs, Agile Methodologies, Data Structures & Algorithms, IoT, Cloud Computing.

Education:
B.Tech in Information Technology from Dr. N.G.P Institute of Technology (Expected 2026). I have maintained a strong academic record, focusing on core computer science principles.
Completed 12th Standard in 2022 with 90.6%.
Completed 10th Standard in 2020 with 95%.

Experience:
Intern at Pinesphere Solutions: I gained hands-on experience during a 15-day Low Code Platform Internship where I worked with WordPress to build responsive websites.
Freelance Projects: Developed custom web solutions for various clients, focusing on performance optimization and SEO.

Projects:
1. AI Voice Assistant (Personal Portfolio): A cutting-edge 3D personal assistant website. It features a conversational AI powered by Google's Gemini model, voice synthesis, and a dynamic React frontend.
2. Data Dissemination for Traffic Prevention: A research-based project using NS2 simulation to analyze Vehicular Ad Hoc Networks (VANETs) for mitigating traffic congestion.
3. Smart Campus Cleanliness Management System: An IoT solution utilizing Arduino and cloud connectivity to monitor and manage waste disposal on campus in real-time.

Certifications:
- Programming in Java (NPTEL)
- IoT and Web 4.0 (NPTEL)
- Introduction to Industry 4.0 and IIoT (NPTEL)
- DSA Training
`,
  updated_at: new Date().toISOString()
};

const HISTORY_KEY = 'muthusamy_chat_history';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
    
    // Load History
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const fetchProfile = async () => {
    // Avoid "Failed to fetch" error if keys are missing
    if (!isSupabaseConfigured) {
      setProfile(MOCK_PROFILE);
      return;
    }

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', PROFILE_ID)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
      } else {
        setProfile(MOCK_PROFILE);
      }
    } catch (error) {
      console.log("Using fallback profile due to connection error:", error);
      // Fallback to mock profile so the app doesn't look broken
      setProfile(MOCK_PROFILE);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // Get latest resume text or fallback
      const resumeContext = profile?.resume_text || MOCK_PROFILE.resume_text;

      // Call Gemini
      const responseText = await generateAssistantResponse(text, resumeContext);

      // Add Assistant Message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // NOTE: Auto-TTS removed per request. 
      // The assistant will respond in text, but will NOT speak automatically.
      // speakResponse(responseText); 

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Sorry, I encountered an error processing your request.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayIntro = async () => {
    setIsProcessing(true);
    try {
       const resumeContext = profile?.resume_text || MOCK_PROFILE.resume_text;
       // Specific prompt to trigger the 'intro' behavior in the system prompt
       // Explicitly asking not to read URLs and start with specific phrase
       const prompt = "Generate a spoken introduction script. It MUST start with exactly these words: 'This is Muthusamy'. Then, continue to describe my role, key skills, and passion for technology based on the resume in a storytelling format. Do NOT mention any URLs or links.";
       
       const responseText = await generateAssistantResponse(prompt, resumeContext);
       
       // Audio-only intro: We do not add text to chat, just speak it.
       speakResponse(responseText);
    } catch (error) {
      console.error("Intro error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    // Remove Markdown-like chars for cleaner speech
    const cleanText = text.replace(/[*#_-]/g, '').replace(/\n/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // --- Chat History Handlers ---

  const handleResetChat = () => {
    if (messages.length === 0) return;

    // Auto-save current session before resetting
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.text.slice(0, 30) : 'Assistant Session';
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: title + (title.length >= 30 ? '...' : ''),
      date: Date.now(),
      messages: [...messages]
    };

    const updatedHistory = [newSession, ...chatHistory];
    setChatHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    
    // Clear current
    setMessages([]);
  };

  const handleLoadSession = (session: ChatSession) => {
    setMessages(session.messages);
  };
  
  const handleDeleteSession = (sessionId: string) => {
    const updated = chatHistory.filter(s => s.id !== sessionId);
    setChatHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark text-white font-sans selection:bg-blue-500/30">
      {/* Mobile Menu Button */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-surface border border-white/10 rounded-lg text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar (Responsive wrapper) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          profile={profile || MOCK_PROFILE} 
          onEditClick={() => {
            setIsMobileMenuOpen(false);
            setIsModalOpen(true);
          }} 
        />
      </div>

      {/* Main Chat Area */}
      <ChatInterface 
        messages={messages} 
        isProcessing={isProcessing}
        onSendMessage={handleSendMessage}
        onPlayIntro={handlePlayIntro}
        onStopSpeaking={handleStopSpeaking}
        onResetChat={handleResetChat}
        chatHistory={chatHistory}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Modal */}
      <ProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProfile}
      />

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;