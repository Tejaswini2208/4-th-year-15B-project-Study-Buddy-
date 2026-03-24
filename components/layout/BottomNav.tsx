import React from 'react';
import { FEATURES, FeatureId } from '../../constants';

interface BottomNavProps {
  activeFeature: FeatureId;
  setActiveFeature: (feature: FeatureId) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeFeature, setActiveFeature }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/80 backdrop-blur-3xl border-t border-white/5 p-4 pb-8 z-[100] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto flex justify-between items-center px-4">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(feature.id)}
            className={`flex flex-col items-center gap-1.5 relative group
              ${activeFeature === feature.id ? 'text-indigo-400' : 'text-gray-500'}
            `}
          >
            {activeFeature === feature.id && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            )}
            <div className={`p-2 rounded-2xl ${activeFeature === feature.id ? 'bg-violet-600 text-white' : ''}`}>
              {React.cloneElement(feature.icon as React.ReactElement, { className: `w-6 h-6 ${activeFeature === feature.id ? 'text-white' : ''}` })}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{feature.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
