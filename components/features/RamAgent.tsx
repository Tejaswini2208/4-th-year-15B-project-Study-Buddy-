import React, { useState, useEffect, useRef } from 'react';
import { runRamAgent, generateRamVoice } from '../../services/geminiService';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import Loader from '../ui/Loader';
import { RobotIcon } from '../icons/RobotIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { FeatureId } from '../../constants';
import { decodeBase64, decodeAudioData } from '../../utils/audioUtils';

interface RamAgentProps {
    onNavigate: (featureId: FeatureId) => void;
}

type Emotion = 'happy' | 'thinking' | 'talking' | 'listening' | 'witty';

const RamAgent: React.FC<RamAgentProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [responseText, setResponseText] = useState<string>('');
    const [emotion, setEmotion] = useState<Emotion>('happy');
    
    const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechToText();
    const audioContextRef = useRef<AudioContext | null>(null);

    const emotionMap: Record<Emotion, string> = {
        happy: '😊',
        thinking: '🤔',
        talking: '🗣️',
        listening: '👂',
        witty: '😎'
    };

    const handleAgentInteraction = async () => {
        if (!transcript.trim()) return;
        setIsProcessing(true);
        setEmotion('thinking');
        setResponseText(''); 

        try {
            const result = await runRamAgent(transcript);
            
            const functionCalls = result.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                setEmotion('witty');
                for (const call of functionCalls) {
                    const args = call.args as any;
                    if (call.name === 'play_youtube') {
                        const query = encodeURIComponent(args.query);
                        window.open(`https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ%253D%253D`, '_blank');
                    } 
                    else if (call.name === 'open_system_app') {
                        const { app_id, data } = args;
                        const encodedData = encodeURIComponent(data || '');
                        switch (app_id) {
                            case 'whatsapp': window.open(`whatsapp://send?text=${encodedData}`, '_blank'); break;
                            case 'maps': window.open(`https://www.google.com/maps/search/${encodedData}`, '_blank'); break;
                            case 'calculator': window.location.href = "calc:"; break;
                            case 'calendar': window.open('https://calendar.google.com', '_blank'); break;
                            case 'settings': window.location.href = "ms-settings:"; break;
                        }
                    } 
                    else if (call.name === 'web_browser_search') {
                        const query = encodeURIComponent(args.query);
                        window.open(`https://www.google.com/search?q=${query}`, '_blank');
                    }
                    else if (call.name === 'navigate_to_feature') {
                        const featureIdMap: Record<string, FeatureId> = {
                            'home': FeatureId.HOME,
                            'lessons': FeatureId.LESSONS,
                            'flashcards': FeatureId.FLASHCARDS,
                            'profile': FeatureId.PROFILE,
                            'storytelling': FeatureId.STORYTELLING
                        };
                        if (featureIdMap[args.feature_id]) onNavigate(featureIdMap[args.feature_id]);
                    }
                }
            }

            if (result.text) {
                setResponseText(result.text);
                setEmotion('talking');
                await speakWithGemini(result.text);
            }
        } catch (error) {
            console.error("Ram Agent Error:", error);
            setEmotion('happy');
            setResponseText("Sare Master-u, emaina mistake ayyundachu. Mallee try cheyyi!");
        } finally {
            setIsProcessing(false);
        }
    };

    const prevListening = useRef(isListening);
    useEffect(() => {
        if (prevListening.current && !isListening && transcript) handleAgentInteraction();
        if (isListening) setEmotion('listening');
        prevListening.current = isListening;
    }, [isListening, transcript]);

    const speakWithGemini = async (text: string) => {
        try {
            const base64Audio = await generateRamVoice(text);
            if (!base64Audio) return;
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            
            const audioData = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => setEmotion('happy');
            source.start();
        } catch (err) {
            console.error("TTS error:", err);
            speakFallback(text);
        }
    };

    const speakFallback = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'te-IN';
            utterance.onend = () => setEmotion('happy');
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else {
            setResponseText("Ram ikkade unnadu! Em help cheyyali mama?");
            startListening();
        }
    };

    if (!hasRecognitionSupport) return null;

    return (
        <>
            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-[120] animate-float">
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse-ring"></div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-14 h-14 bg-indigo-600 rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.5)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all ring-4 ring-indigo-500/20"
                >
                    <RobotIcon className="w-8 h-8" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse"></div>
                </button>
            </div>

            {/* Bottom Sheet Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] animate-in-fade"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-[#0f172a] rounded-t-[2.5rem] p-6 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 animate-in-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6"></div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-2xl">
                                    {emotionMap[emotion]}
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xs uppercase tracking-widest">Ram AI Assistant</h3>
                                    <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
                                        {isListening ? 'Listening...' : 'Ready to help'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-500 hover:text-white transition-colors"
                            >
                                <XCircleIcon className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Message Bubble */}
                        <div className="bg-white/5 rounded-3xl p-6 min-h-[100px] mb-6 border border-white/5 shadow-inner">
                            <p className="text-sm leading-relaxed text-indigo-100 font-medium">
                                {isListening ? (
                                    <span className="text-indigo-300 font-bold">"{transcript || 'Listening...'}"</span>
                                ) : (
                                    responseText || "Namaskaram! I'm Ram, your AI study buddy. How can I help you today?"
                                )}
                            </p>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={toggleListening}
                            className={`relative overflow-hidden p-5 rounded-2xl transition-all duration-300 shadow-xl flex items-center gap-3 w-full justify-center group/btn
                                ${isListening 
                                    ? 'bg-red-600 text-white ring-4 ring-red-500/30' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
                                }`}
                        >
                            <MicrophoneIcon className={`w-6 h-6 transition-all duration-300 ${isListening ? 'scale-110' : 'group-hover/btn:scale-110'}`} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                {isListening ? 'STOP' : 'TALK TO RAM'}
                            </span>
                            {isProcessing && (
                                <div className="absolute right-6">
                                    <Loader size="sm" className="text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes in-fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes in-slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-in-fade { animation: in-fade 0.3s ease-out forwards; }
                .animate-in-slide-up { animation: in-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </>
    );
};

export default RamAgent;
