
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { explainCode, generateTutorVoice, generateCodingMentorChatStream } from '../../services/geminiService';
import { CodeExplanation, ChatMessage } from '../../types';
import { CODING_LANGUAGES } from '../../constants';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Loader from '../ui/Loader';
import Card from '../ui/Card';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { SpeakerWaveIcon } from '../icons/SpeakerWaveIcon';
// Import CodeIcon to fix the reference error on line 325
import { CodeIcon } from '../icons/CodeIcon';

const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const CodingMentor: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(CODING_LANGUAGES[0].value);
  const [explanation, setExplanation] = useState<CodeExplanation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Chat specific state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello. I am your Coding Mentor. Paste code on the right to explain it or ask me to write some for you here." }
  ]);
  const [chatInput, setChatInput] = useState('');

  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechToText();
  const initialChatInputRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /**
   * Utility to remove prohibited special characters: ! @ # $ % ^ & * ( )
   */
  const cleanText = useCallback((text: string): string => {
    if (!text) return '';
    return text.replace(/[!@#$%^&*()]/g, '');
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      initialChatInputRef.current = chatInput;
      startListening();
    }
  };

  useEffect(() => {
    if (isListening) {
      setChatInput(initialChatInputRef.current + (initialChatInputRef.current ? ' ' : '') + transcript);
    }
  }, [transcript, isListening]);

  const handleExplain = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const result = await explainCode(code, language);
      // Clean character data from explanations
      const sanitized = result.map(item => ({
        ...item,
        explanation: cleanText(item.explanation)
      }));
      setExplanation(sanitized);
    } catch (err) {
      console.error(err);
      setError('Failed to get explanation. The code might be invalid or the model is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userPrompt = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    
    setChatHistory(prev => [...prev, { role: 'user', text: userPrompt }, { role: 'model', text: '', isPartial: true }]);

    try {
        const stream = await generateCodingMentorChatStream(userPrompt, code, language, chatHistory);
        let fullText = '';
        for await (const chunk of stream) {
            fullText += chunk;
            setChatHistory(prev => {
                const newHistory = [...prev];
                const last = newHistory[newHistory.length - 1];
                if (last.role === 'model') {
                    // We clean the text for display, but wait until it's final or handle partials carefully
                    // For a better experience, we clean as we go
                    last.text = cleanText(fullText);
                }
                return newHistory;
            });
        }
        
        // Finalize
        setChatHistory(prev => {
            const newHistory = [...prev];
            const last = newHistory[newHistory.length - 1];
            if (last.role === 'model') last.isPartial = false;
            return newHistory;
        });

    } catch (err) {
        console.error("Chat error:", err);
        setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I had trouble processing that request." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleApplyToEditor = (text: string) => {
    // We don't clean the code blocks for editor application as code needs special characters to run
    const codeMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
        setCode(codeMatch[1].trim());
    } else {
        setCode(text.trim());
    }
  };

  const handlePlayVoice = async (text: string, index: number) => {
    if (playingIndex !== null) return;
    setPlayingIndex(index);

    try {
        const base64Audio = await generateTutorVoice(text, 'Zephyr');
        if (!base64Audio) {
            setPlayingIndex(null);
            return;
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const ctx = audioContextRef.current;
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingIndex(null);
        source.start();
    } catch (err) {
        console.error("TTS generation error:", err);
        setPlayingIndex(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Coding Mentor</h2>
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-widest">Enhanced Pair Programmer</p>
        </div>
        <div className="flex gap-2">
           <Select 
            value={language}
            onChange={e => setLanguage(e.target.value)}
            options={CODING_LANGUAGES}
            className="w-44 bg-gray-800/80 border-indigo-500/20 text-indigo-100 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
        {/* Chat Pane */}
        <div className="flex flex-col h-full">
            <Card className="flex flex-col h-full bg-slate-900/60 border-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6">
                <div className="flex-grow overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-[1.5rem] max-w-[90%] text-[13px] leading-relaxed shadow-lg transition-all hover:shadow-xl
                                ${msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none' 
                                    : 'bg-gray-800/80 text-gray-200 border border-white/5 rounded-tl-none backdrop-blur-sm'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.role === 'model' && !msg.isPartial && msg.text?.includes('```') && (
                                    <button 
                                            onClick={() => handleApplyToEditor(msg.text!)}
                                            className="mt-4 w-full text-[9px] font-black text-cyan-400 hover:text-white uppercase tracking-[0.2em] border border-cyan-400/20 px-3 py-2 rounded-xl bg-cyan-950/20 hover:bg-cyan-500 transition-all"
                                    >
                                        Apply Code to Editor
                                    </button>
                                )}
                            </div>
                            <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">
                                {msg.role === 'user' ? 'You' : 'Mentor'}
                            </span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                
                <div className="flex gap-3 relative group">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleChatSend()}
                            placeholder="Describe what you want to build..."
                            className="flex-grow bg-gray-800/80 border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-md"
                            disabled={isChatLoading}
                        />
                        <div className="absolute right-20 top-1/2 -translate-y-1/2 flex items-center">
                            {hasRecognitionSupport && (
                                <button
                                    onClick={handleToggleListening}
                                    className={`p-2 rounded-full text-gray-500 hover:text-white transition-all ${isListening ? 'text-red-400 animate-pulse bg-red-400/10' : 'hover:bg-white/5'}`}
                                >
                                    <MicrophoneIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <Button onClick={handleChatSend} disabled={isChatLoading || !chatInput.trim()} className="rounded-2xl px-8 bg-white text-indigo-950 font-black hover:bg-indigo-50 shadow-indigo-500/10 active:scale-95 transition-all">
                            {isChatLoading ? <Loader size="sm" /> : 'ASK'}
                        </Button>
                </div>
            </Card>
        </div>

        {/* Editor & Explanation Pane */}
        <div className="flex flex-col h-full space-y-6">
          <div className="relative flex-grow flex flex-col min-h-0">
            <TextArea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// Write or paste code here...`}
              className="flex-grow font-mono text-[12px] bg-slate-950 border-white/5 resize-none rounded-[2rem] p-6 leading-relaxed shadow-2xl custom-scrollbar placeholder:opacity-20"
              disabled={isLoading}
            />
            <div className="flex gap-3 mt-4">
                 <Button onClick={handleExplain} disabled={isLoading || !code.trim()} className="flex-grow py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-sm font-black tracking-widest uppercase shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all">
                    {isLoading ? <div className="flex items-center justify-center gap-3"><Loader size="sm" /><span>Analyzing...</span></div> : 'Analyze Logic'}
                </Button>
                <Button onClick={() => setCode('')} variant="secondary" className="px-8 rounded-2xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 border-white/5 font-black uppercase tracking-widest transition-all">
                    Clear
                </Button>
            </div>
          </div>

          <Card className="h-72 flex flex-col bg-gray-900/40 border-white/5 rounded-[2rem] backdrop-blur-md shadow-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Line Logic Breakdown</h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase">Prohibited Chars Removed</span>
            </div>
            <div className="flex-grow overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                {explanation ? (
                <div className="font-mono text-[11px] space-y-6">
                    {explanation.map((item, index) => (
                    <div key={index} className="relative pl-5 border-l-2 border-indigo-500/20 group animate-fadeIn">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase">Line {item.lineNumber}</span>
                            <pre className="text-purple-300 opacity-40 truncate flex-grow"><code>{item.code}</code></pre>
                        </div>
                        <div className="pr-12">
                            <p className="text-gray-400 leading-relaxed font-sans">{item.explanation}</p>
                        </div>
                        <button 
                            onClick={() => handlePlayVoice(item.explanation, index)}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 
                                ${playingIndex === index 
                                    ? 'text-indigo-400 animate-pulse bg-indigo-400/10 shadow-lg' 
                                    : 'text-gray-600 hover:text-indigo-300 hover:bg-white/5 opacity-0 group-hover:opacity-100'}`}
                            disabled={playingIndex !== null}
                        >
                            {playingIndex === index ? <Loader size="sm" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                        </button>
                    </div>
                    ))}
                </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
                        <CodeIcon className="h-8 w-8 opacity-10" />
                        <p className="italic text-xs tracking-wide">Analysis output will be displayed here.</p>
                    </div>
                )}
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CodingMentor;
