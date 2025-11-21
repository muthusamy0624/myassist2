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
  resume_text: `MUTHUSAMY M
Software Engineer

CONTACT:
Email: muthusamy0624@gmail.com
Phone: 8072678774
LinkedIn: https://www.linkedin.com/in/muthusamy-m-ba3066258
HackerRank: https://www.hackerrank.com/profile/22it0303
LeetCode: https://leetcode.com/u/710722205030/

OBJECTIVE:
Seeking an entry-level position in Information Technology where I can leverage my technical expertise, problem-solving abilities, and passion for innovation to drive organizational success.

EDUCATION:
- B.TECH [Information Technology] (2022-2026): DR.N.G.P INSTITUTE OF TECHNOLOGY - 84%
- 12th Standard (2022): A.R.CHENNIMALAIGOUNDER MATRIC HR SEC SCHOOL - 90.6%
- 10th Standard (2020): A.R.CHENNIMALAIGOUNDER MATRIC HR SEC SCHOOL - 95%

SKILLS:
- Programming Languages: Java, C
- Web Development: HTML, CSS, JavaScript
- Database Management: SQL
- Tools: Android Studio, Visual Studio Code, Arduino IDE, Canva, NS2

PROJECTS:
1. Restaurant Recommendation System (2023)
   - Tool Used: HTML, CSS, JavaScript
   - Description: Developed a web-based application to recommend restaurants based on user preferences. Designed and implemented the user interface; Integrated and tested recommendation algorithms.

2. Data Dissemination for Traffic Prevention in NS2 Stimulation Using Access Point (2024)
   - Tools Used: NS2
   - Description: This project focuses on data dissemination in Vehicular Ad Hoc Networks (VANET) using access points to prevent traffic congestion. NS2 simulation is utilized to evaluate the effectiveness of the approach in improving traffic flow.

3. Smart Campus Cleanliness Management System (2025)
   - Technologies Used: App Development, IoT
   - Description: Created a digital solution to manage campus cleanliness efficiently. Led the development of the app interface and integrated IoT devices for real-time cleanliness monitoring.

INTERNSHIPS:
- Low Code Platform Intern at Pinesphere Solutions (2024): Gained hands-on experience with low-code platforms using WordPress, rapidly developing and deploying websites with no coding.
- Technical Internship at National Institute of Technology, Tiruchirapalli: Focused on data creation for machine learning applications. Developed and published a dataset of Cowrie Shells on Kaggle.
- Industry Internship at KrishTec in Coimbatore: Focused on IoT fundamentals, developing responsive IoT applications.

CERTIFICATIONS:
- Programming in Java (NPTEL) (60%, April-2024)
- IoT and Web 4.0 (NPTEL) (65%, October-2024)
- DSA Training - Finest Coder & CodingMart Technologies

ACHIEVEMENTS:
- Secured Elite Certification in Introduction to Industry 4.0 and IIoT (NPTEL).
- Won Second Place in Code Debugging and Modelathon, KIT, Coimbatore.
- Won First Place in Classical Group Dance (Oyilattam) District Level Coimbatore.

LEADERSHIP ACTIVITIES:
- Served as Office Bearer of XEMAC (IT Association), leading peers in organizing technical and cultural events.
- Coordinated project presentations and guided juniors in technical tasks.
- Mentored peers during coding/debugging contests.
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