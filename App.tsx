import React, { useState, useMemo } from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';
import HomeDashboard from './components/features/HomeDashboard';
import PersonalTutor from './components/features/PersonalTutor';
import ExamPrepAssistant from './components/features/ExamPrepAssistant';
import ProfilePage from './components/features/ProfilePage';
import { FEATURES, FeatureId } from './constants';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './components/auth/LandingPage';
import OnboardingModal from './components/auth/OnboardingModal';
import Loader from './components/ui/Loader';
import RamAgent from './components/features/RamAgent';
import StorytellingLesson from './components/features/StorytellingLesson';
import { XCircleIcon } from './components/icons/XCircleIcon';


const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<FeatureId>(FeatureId.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();

  const ActiveComponent = useMemo(() => {
    switch (activeFeature) {
      case FeatureId.HOME: return HomeDashboard;
      case FeatureId.LESSONS: return PersonalTutor;
      case FeatureId.FLASHCARDS: return ExamPrepAssistant;
      case FeatureId.PROFILE: return ProfilePage;
      case FeatureId.STORYTELLING: return StorytellingLesson;
      default: return HomeDashboard;
    }
  }, [activeFeature]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex justify-center items-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans flex selection:bg-indigo-500/30 overflow-x-hidden">
      
      <OnboardingModal />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-screen sticky top-0 z-50">
        <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      </div>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-72 h-full bg-[#0f172a] shadow-2xl animate-in-slide-right">
            <div className="absolute top-4 right-4 z-[160]">
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:text-white">
                <XCircleIcon className="w-8 h-8" />
              </button>
            </div>
            <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col min-h-screen relative z-10 w-full max-w-full lg:max-w-none">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-32 lg:pb-8">
          <Header onNavigate={setActiveFeature} onToggleSidebar={() => setIsSidebarOpen(true)} />
          
          <main className="mt-12 sm:mt-16 animate-in-up">
            <div className="min-h-[70vh]">
              <ActiveComponent onNavigate={setActiveFeature} />
            </div>
          </main>
        </div>

        <RamAgent onNavigate={setActiveFeature} />
        
        {/* Mobile Bottom Nav */}
        <div className="lg:hidden">
          <BottomNav activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
        </div>
      </div>

      <style>{`
        @keyframes in-up {
          from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes in-slide-right {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }
        .animate-in-up { animation: in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-in-slide-right { animation: in-slide-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
