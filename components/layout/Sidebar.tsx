import React from 'react';
import { FEATURES, FeatureId } from '../../constants';
import { SparklesIcon } from '../icons/SparklesIcon';

interface SidebarProps {
  activeFeature: FeatureId;
  setActiveFeature: (feature: FeatureId) => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature, onClose }) => {
  return (
    <aside className="h-full flex flex-col bg-[#0f172a] border-r border-white/5 p-6 space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <SparklesIcon className="text-indigo-400 h-5 w-5" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">Study Buddy</h1>
      </div>

      <nav className="flex-grow space-y-2">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => {
              setActiveFeature(feature.id);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl group
              ${activeFeature === feature.id 
                ? 'bg-violet-600 text-white border border-white/10 shadow-lg' 
                : 'text-gray-500 border border-transparent'}
            `}
          >
            <div className={`${activeFeature === feature.id ? '' : ''}`}>
              {React.cloneElement(feature.icon as React.ReactElement, { className: "w-5 h-5" })}
            </div>
            <span className="text-sm font-bold tracking-tight">{feature.name}</span>
            {activeFeature === feature.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pro Plan</p>
          <p className="text-xs text-gray-400 leading-relaxed">Unlock advanced AI tutoring and unlimited storage.</p>
          <button className="mt-3 w-full py-2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
