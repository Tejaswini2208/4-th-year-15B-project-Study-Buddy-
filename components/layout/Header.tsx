import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';
import { useAuth } from '../../contexts/AuthContext';
import RamAgent from '../features/RamAgent';
import { FeatureId } from '../../constants';
import { Bars3Icon } from '../icons/Bars3Icon';

interface HeaderProps {
    onNavigate: (featureId: FeatureId) => void;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="w-full flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-400"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="hidden lg:flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <SparklesIcon className="text-indigo-400 h-5 w-5" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Study Buddy</h1>
        </div>
        {/* Mobile Logo (only shown when sidebar is hidden) */}
        <div className="lg:hidden flex items-center gap-2">
          <SparklesIcon className="text-indigo-400 h-5 w-5" />
          <h1 className="text-lg font-black text-white tracking-tight">Study Buddy</h1>
        </div>
      </div>
      
      {user && (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate(FeatureId.PROFILE)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-xs">{user.name.charAt(0)}</span>
            )}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
