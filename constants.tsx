import React from 'react';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { UserCircleIcon } from './components/icons/UserCircleIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';

export enum FeatureId {
    HOME = 'home',
    LESSONS = 'lessons',
    FLASHCARDS = 'flashcards',
    PROFILE = 'profile',
    STORYTELLING = 'storytelling'
}

export const FEATURES = [
  { id: FeatureId.HOME, name: 'Home', icon: <HomeIcon /> },
  { id: FeatureId.LESSONS, name: 'Lessons', icon: <BookOpenIcon /> },
  { id: FeatureId.STORYTELLING, name: 'Stories', icon: <SparklesIcon /> },
  { id: FeatureId.FLASHCARDS, name: 'Nora', icon: <ClipboardListIcon /> },
  { id: FeatureId.PROFILE, name: 'Profile', icon: <UserCircleIcon /> },
];

export const TUTOR_LANGUAGES = [
    { value: 'English', label: 'English' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Mandarin', label: 'Mandarin' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Telugu', label: 'Telugu' },
];

export const AI_VOICES = [
    { value: 'Zephyr', label: 'Voice: Zephyr (M)' },
    { value: 'Puck', label: 'Voice: Puck (M)' },
    { value: 'Charon', label: 'Voice: Charon (M)' },
    { value: 'Kore', label: 'Voice: Kore (F)' },
    { value: 'Fenrir', label: 'Voice: Fenrir (F)' },
];

export const CODING_LANGUAGES = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'Java', label: 'Java' },
    { value: 'Go', label: 'Go' },
    { value: 'Rust', label: 'Rust' },
    { value: 'C++', label: 'C++' },
    { value: 'C#', label: 'C#' },
    { value: 'Ruby', label: 'Ruby' },
    { value: 'PHP', label: 'PHP' },
    { value: 'Swift', label: 'Swift' },
    { value: 'Kotlin', label: 'Kotlin' },
    { value: 'SQL', label: 'SQL' },
    { value: 'HTML', label: 'HTML' },
    { value: 'CSS', label: 'CSS' },
];

export const GEMINI_MODEL = 'gemini-3-flash-preview';

// Safely access environment variables with fallback
const getGeminiApiKey = (): string => {
  const fallbackKey = "AIzaSyATS0DDpWbPXRfnKY-zB5K7Gr12Ka5h1Co";
  
  try {
    // Check process.env (Next.js style or Vite define)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
    }

    // Check import.meta.env (Vite style)
    // @ts-ignore - import.meta.env is Vite specific
    if (import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
      // @ts-ignore
      if (import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY) return import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing environment variables for Gemini API key:", e);
  }

  return fallbackKey;
};

export const GEMINI_API_KEY = getGeminiApiKey();
