export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'student' | 'teacher';
  level?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  isPartial?: boolean;
  sources?: { title: string; uri: string }[];
  isAudioReady?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface CodeExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
}

export interface NoraSession {
    id: string;
    name: string;
    notes: string;
    history: ChatMessage[];
}