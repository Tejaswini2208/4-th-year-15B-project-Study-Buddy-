import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SparklesIcon } from '../icons/SparklesIcon';

const STUDENT_LEVELS = [
  'Class 1-5',
  'Class 6-10',
  'Intermediate (11-12)',
  'Engineering',
  'Medical',
  'Degree (Arts/Science)',
  'Post Graduation',
  'Other'
];

const TEACHER_LEVELS = [
  'Primary School',
  'High School',
  'Govt School',
  'Professional (Medical)',
  'Professional (Engineering)',
  'University Professor',
  'Private Tutor'
];

const OnboardingModal: React.FC = () => {
  const { user, setOnboardingData } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [level, setLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || (user.role && user.level)) return null;

  const handleSubmit = async () => {
    if (!role || !level) return;
    setIsSubmitting(true);
    await setOnboardingData(role, level);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0f172a]/90 backdrop-blur-xl animate-in">
      <Card className="w-full max-w-md bg-white/[0.03] border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl mb-2">
              <SparklesIcon className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Personalize Your Journey</h2>
            <p className="text-gray-400 text-sm">Help us tailor your AI learning experience</p>
          </div>

          {!role ? (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">I am a...</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('student')}
                  className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all group active:scale-95"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
                  <div className="font-bold text-white">Student</div>
                </button>
                <button
                  onClick={() => setRole('teacher')}
                  className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all group active:scale-95"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👨‍🏫</div>
                  <div className="font-bold text-white">Teacher</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in-up">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">
                  {role === 'student' ? 'What are you studying?' : 'Where do you teach?'}
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {(role === 'student' ? STUDENT_LEVELS : TEACHER_LEVELS).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`p-4 rounded-2xl text-sm font-bold transition-all text-left border ${
                        level === l 
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                          : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { setRole(null); setLevel(''); }}
                  className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!level || isSubmitting}
                  className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Setting Up...' : 'Start Learning'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        .animate-in-up { animation: in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default OnboardingModal;
