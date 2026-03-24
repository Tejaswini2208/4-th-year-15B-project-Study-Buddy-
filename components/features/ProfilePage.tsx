
import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SparklesIcon } from '../icons/SparklesIcon';
import { compressImage } from '../../utils/imageUtils';

const ProfilePage: React.FC = () => {
  const { user, stats, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          // Compress the image to ensure it's under the 1MB Firestore limit
          const compressed = await compressImage(base64, 400, 400, 0.7);
          setAvatar(compressed);
        } catch (error) {
          console.error("Image compression failed", error);
          setAvatar(base64); // Fallback to original if compression fails
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(name, avatar);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      console.error("Save failed", error);
      // If it's a size limit error, we should inform the user
      if (error.message?.includes('exceeds the maximum allowed size')) {
        alert("The profile image is too large. Please try uploading a smaller image or resetting it.");
      } else {
        alert("Failed to save profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const studyHours = useMemo(() => {
    return (stats.totalMinutes / 60).toFixed(1);
  }, [stats.totalMinutes]);

  const aiAccuracy = useMemo(() => {
    if (stats.quizTotal === 0) return "100%"; // Default for new users
    return Math.round((stats.quizCorrect / stats.quizTotal) * 100) + "%";
  }, [stats.quizCorrect, stats.quizTotal]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 animate-in-up">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-40 animate-pulse"></div>
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-gray-900 flex items-center justify-center">
                {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-6xl font-black text-white/20 uppercase">{user.name.charAt(0)}</span>
                )}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-xs uppercase"
                >
                    <CameraIcon className="h-5 w-5" />
                    Change Photo
                </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
        </div>
        <div className="text-center">
            <h2 className="text-3xl font-black text-white tracking-tighter">{user.name}</h2>
            <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2rem] space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                        <SparklesIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Identity Studio</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Display Username</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-700"
                            placeholder="Your Buddy Handle"
                        />
                    </div>
                    <button 
                        onClick={() => setAvatar('')}
                        className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1 hover:text-red-300 transition-colors"
                    >
                        Reset Avatar Image
                    </button>
                </div>
            </div>
            <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full py-4 bg-violet-600 text-white font-black uppercase tracking-widest rounded-2xl"
            >
                {isSaving ? 'Synchronizing...' : 'Save Preferences'}
            </Button>
        </Card>

        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-white flex items-center gap-4">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                    <BookOpenIcon className="h-5 w-5 text-purple-400" />
                </div>
                Platform Stats
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-500 font-bold uppercase">Study Hours</span>
                    <span className="text-xl font-black text-white">{studyHours} hrs</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-500 font-bold uppercase">AI Accuracy</span>
                    <span className="text-xl font-black text-white">{aiAccuracy}</span>
                </div>
            </div>
        </Card>
      </div>

      {/* Logout Section */}
      <div className="pt-8 border-t border-white/5 flex justify-center">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-8 py-4 bg-red-500/10 text-red-400 rounded-2xl font-black uppercase tracking-widest border border-red-500/20"
        >
          <LogoutIcon className="h-5 w-5" />
          Sign Out of Buddy
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-2xl animate-in-up z-50">
            Profile Saved Successfully!
        </div>
      )}

      <style>{`
        .animate-in-up {
            animation: in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

export default ProfilePage;
