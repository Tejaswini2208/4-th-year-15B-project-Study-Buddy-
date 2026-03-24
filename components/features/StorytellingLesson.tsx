import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import { SparklesIcon } from '../icons/SparklesIcon';
import { GEMINI_MODEL, AI_VOICES, GEMINI_API_KEY } from '../../constants';
import { generateTutorVoice } from '../../services/geminiService';
import { decodeBase64, decodeAudioData } from '../../utils/audioUtils';

const LANGUAGES = [
  { code: 'te', name: 'Telugu', label: 'తెలుగు' },
  { code: 'en', name: 'English', label: 'English' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी' }
];

const StorytellingLesson: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]); // Default Telugu
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const storyPlayerRef = useRef<HTMLDivElement>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const prefetchAudio = async () => {
    if (!story) return;
    setIsAudioReady(false);
    setIsAudioLoading(true);
    audioBufferRef.current = null;

    try {
      const voiceName = language.code === 'te' ? 'Kore' : language.code === 'hi' ? 'Fenrir' : 'Zephyr';
      const base64Audio = await generateTutorVoice(story, voiceName);
      
      if (!base64Audio) {
        setIsAudioLoading(false);
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
      
      audioBufferRef.current = audioBuffer;
      setIsAudioReady(true);
    } catch (err) {
      console.error("Audio pre-fetch error:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  React.useEffect(() => {
    prefetchAudio();
  }, [story, language]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Global click listener to stop audio when clicking outside the player
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (isSpeaking && storyPlayerRef.current && !storyPlayerRef.current.contains(e.target as Node)) {
        stopAudio();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isSpeaking]);

  const generateStory = async () => {
    if (!topic || !user) return;
    setIsLoading(true);
    setStory('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `
        You are a master storyteller and educator. 
        Explain the topic: "${topic}" as a narrative story.
        
        User Context:
        Role: ${user.role}
        Level: ${user.level}
        
        Guidelines:
        1. Do not use plain facts. Tell a story with characters, a setting, and a plot.
        2. Use analogies appropriate for a ${user.level} ${user.role}. 
           - If they are a Medical student, use professional medical analogies but in a story format.
           - If they are a Primary student, use fairy-tale or simple adventure analogies.
        3. Language: ${language.name}.
        4. Keep the story engaging, educational, and concise (about 200-300 words).
        5. Use a friendly and encouraging tone.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      setStory(response.text || 'Failed to generate story.');
    } catch (error) {
      console.error("Story generation error:", error);
      setStory('Sorry, I encountered an error while weaving your story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }

    if (!audioBufferRef.current) return;

    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };
      
      audioSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error("TTS playback error:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in-up">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl mb-2">
          <MagicWandIcon className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter">Storytelling Studio</h2>
        <p className="text-gray-400 font-medium">Transform any topic into a magical narrative</p>
      </div>

      {/* Input Section */}
      <Card className="bg-white/[0.03] border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang)}
                className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${
                  language.code === lang.code 
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg' 
                    : 'bg-white/5 text-gray-500 border-white/5'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should we learn today?"
              className="w-full bg-black/40 border border-white/20 rounded-3xl px-8 py-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500 shadow-inner font-medium"
              onKeyPress={(e) => e.key === 'Enter' && generateStory()}
            />
            <button
              onClick={generateStory}
              disabled={isLoading || !topic}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-violet-600 text-white rounded-2xl disabled:opacity-50 border border-white/20"
            >
              {isLoading ? <Loader size="sm" /> : <SparklesIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Story Display */}
      {(story || isLoading) && (
        <Card 
          ref={storyPlayerRef}
          className="bg-white/[0.03] border-white/10 p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden animate-in-up"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <BookIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">The Tale of {topic}</h3>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Narrated for {user?.level}</p>
              </div>
            </div>
            
            <button
              onClick={handleSpeak}
              disabled={!isAudioReady || isLoading}
              className={`p-4 rounded-2xl flex items-center gap-2 border border-white/10 ${
                isSpeaking 
                  ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                  : !isAudioReady 
                  ? 'bg-white/5 text-gray-400 cursor-not-allowed opacity-40'
                  : 'bg-white/10 text-gray-200'
              }`}
              title={isSpeaking ? "Stop Reading" : isAudioLoading ? "Loading Audio..." : "Read Aloud"}
            >
              {isAudioLoading ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Loading...</span>
                </div>
              ) : (
                isSpeaking ? <StopIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="relative z-10">
            {isLoading ? (
              <div className="space-y-4 py-8">
                <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded-full w-[90%] animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded-full w-[95%] animate-pulse"></div>
                <div className="h-4 bg-white/5 rounded-full w-[85%] animate-pulse"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed text-lg font-medium whitespace-pre-wrap italic">
                  {story}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <style>{`
        .animate-in-up { animation: in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes in-up { from { opacity: 0; transform: translateY(30px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      `}</style>
    </div>
  );
};

const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
  </svg>
);

const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

export default StorytellingLesson;
