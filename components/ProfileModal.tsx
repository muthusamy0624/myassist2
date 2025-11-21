import React, { useState } from 'react';
import { X, Upload, Lock, CheckCircle, AlertCircle, FileText, Loader2, Camera, Database } from 'lucide-react';
import { extractTextFromPDF } from '../services/pdf';
import { supabase, TABLE_NAME, BUCKET_NAME as DEFAULT_BUCKET_NAME, PROFILE_ID, isSupabaseConfigured } from '../services/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [bucketName, setBucketName] = useState(DEFAULT_BUCKET_NAME);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setResumeFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a PDF file for the resume.');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setImageFile(selectedFile);
        setImagePreview(URL.createObjectURL(selectedFile));
        setError('');
      } else {
        setError('Please upload an image file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!isSupabaseConfigured) {
        // Demo mode: Simulate upload success
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (resumeFile) await extractTextFromPDF(resumeFile); // Still parse to show we can
        
        setSuccessMsg('Demo Mode: Profile updated successfully (simulation)!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
        return;
      }

      let resumeUrl = '';
      let resumeText = '';
      let imageUrl = '';

      // 1. Handle Image Upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `profile_pic_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
          
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Handle Resume Upload & Parsing
      if (resumeFile) {
        // Extract text (Client-side simulation of server extraction)
        resumeText = await extractTextFromPDF(resumeFile);
        
        // Upload to Supabase Storage
        const fileName = `owner_resume_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
          
        resumeUrl = publicUrlData.publicUrl;
      }

      // 3. Update Database
      const updates: any = {
        id: PROFILE_ID,
        updated_at: new Date().toISOString(),
      };
      if (linkedin) updates.linkedin = linkedin;
      if (github) updates.github = github;
      if (resumeUrl) updates.resume_url = resumeUrl;
      if (resumeText) updates.resume_text = resumeText;
      if (imageUrl) updates.image_url = imageUrl;

      const { error: dbError } = await supabase
        .from(TABLE_NAME)
        .upsert(updates);

      if (dbError) throw dbError;

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      // Check if it's a fetch error likely due to bad config
      if (err.message === 'Failed to fetch' || !err.message) {
         setError('Connection failed. DB writes are disabled in demo mode.');
      } else if (err.message.includes('Bucket not found')) {
         setError(`Bucket "${bucketName}" not found. Please create it in Supabase or check the name.`);
      } else {
         setError(err.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white">Build Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isAuthenticated ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock size={24} />
                </div>
                <p className="text-gray-400 text-sm">Enter admin password to access</p>
              </div>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Unlock Access
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {successMsg ? (
                <div className="flex flex-col items-center justify-center py-8 text-green-400 animate-pulse">
                  <CheckCircle size={48} className="mb-2" />
                  <p>{successMsg}</p>
                </div>
              ) : (
                <>
                  {/* Profile Image Upload */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 overflow-hidden group cursor-pointer hover:border-blue-500 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-400">
                          <Camera size={24} />
                          <span className="text-[10px] mt-1">Photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Camera size={20} className="text-white" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2">Tap to change profile photo</span>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2">GitHub URL</label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Resume (PDF)</label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleResumeChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`
                        border-2 border-dashed rounded-xl p-6 text-center transition-colors
                        ${resumeFile ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 bg-white/5 group-hover:border-blue-500/50 group-hover:bg-blue-500/10'}
                      `}>
                         {resumeFile ? (
                           <div className="flex items-center justify-center text-green-400">
                             <FileText size={20} className="mr-2" />
                             <span className="text-sm truncate max-w-[200px]">{resumeFile.name}</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center text-gray-400">
                             <Upload size={24} className="mb-2" />
                             <span className="text-xs">Click to upload PDF</span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Bucket Name Configuration */}
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-bold mb-2 flex items-center gap-2">
                      <Database size={12} /> Storage Bucket Name
                    </label>
                    <input
                      type="text"
                      value={bucketName}
                      onChange={(e) => setBucketName(e.target.value)}
                      placeholder="e.g. resumes"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Must match your Supabase Storage bucket name exactly.</p>
                  </div>

                  {error && (
                    <div className="flex items-center text-red-400 text-xs bg-red-400/10 p-3 rounded-lg">
                      <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Save & Update Agent'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;