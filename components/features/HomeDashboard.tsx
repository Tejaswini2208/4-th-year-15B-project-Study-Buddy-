import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SparklesIcon } from '../icons/SparklesIcon';
import { FeatureId } from '../../constants';

interface HomeDashboardProps {
  onNavigate?: (featureId: FeatureId) => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in-up">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Hi, {user?.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Ready to learn something new today?</p>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <SparklesIcon className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      {/* Recent Course Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <SparklesIcon className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Recent Activity</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white leading-tight">
              Continue Learning: <br />
              <span className="text-indigo-200">Modern Web Architecture</span>
            </h3>
            <p className="text-indigo-100/70 text-sm mt-2">You were studying "Server-side Rendering" last time.</p>
          </div>
          <button 
            onClick={() => onNavigate?.(FeatureId.LESSONS)}
            className="bg-violet-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
          >
            Continue Now
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">About Study Buddy</h3>
        <p className="text-sm text-gray-400 leading-relaxed font-medium">
          Study Buddy is your <span className="text-white">AI-powered personalized learning assistant</span>, designed to help you master any subject through interactive lessons and Nora.
        </p>
      </div>
    </div>
  );
};

export default HomeDashboard;
