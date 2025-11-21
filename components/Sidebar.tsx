
import React from 'react';
import { Mail, Linkedin, Github, Settings } from 'lucide-react';
import { Profile } from '../types';

interface SidebarProps {
  profile: Profile | null;
  onEditClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ profile, onEditClick }) => {
  return (
    <aside className="hidden md:flex flex-col w-80 h-full bg-surface border-r border-white/10 p-6 relative z-20 shadow-2xl">
      <div className="flex flex-col items-center mb-10">
        
        {/* Avatar Container */}
        <div className="relative w-32 h-32 mb-4 rounded-full p-1 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
          <div className="w-full h-full rounded-full bg-surface overflow-hidden border-4 border-surface">
            <img 
              src={profile?.image_url || "https://picsum.photos/200/200"} 
              alt="Muthusamy" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Muthusamy</h1>
        <p className="text-blue-400 text-sm font-medium">Software Engineer</p>
      </div>

      <div className="space-y-4 flex-1">
        <a 
          href="mailto:muthusamy0624@gmail.com"
          className="flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
        >
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
            <Mail size={20} />
          </div>
          <span className="ml-3 text-gray-300 group-hover:text-white text-sm truncate">muthusamy0624@gmail.com</span>
        </a>

        <a 
          href={profile?.linkedin || '#'}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group ${!profile?.linkedin ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="p-2 rounded-lg bg-blue-700/20 text-blue-500 group-hover:text-white group-hover:bg-blue-700 transition-colors">
            <Linkedin size={20} />
          </div>
          <span className="ml-3 text-gray-300 group-hover:text-white text-sm">LinkedIn Profile</span>
        </a>

        <a 
          href={profile?.github || '#'}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group ${!profile?.github ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="p-2 rounded-lg bg-gray-700/50 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors">
            <Github size={20} />
          </div>
          <span className="ml-3 text-gray-300 group-hover:text-white text-sm">GitHub Profile</span>
        </a>
      </div>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button
          onClick={onEditClick}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all transform hover:scale-[1.02]"
        >
          <Settings size={18} className="mr-2" />
          Build your profile
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
