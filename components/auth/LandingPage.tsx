import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowsPointingOutIcon } from '../icons/ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from '../icons/ArrowsPointingInIcon';
import Loader from '../ui/Loader';

const LandingPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email' | 'signup' | 'phone'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, sendOtp, verifyOtp, loginAsGuest } = useAuth();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (authMode === 'email') {
        await loginWithEmail(email, password);
      } else if (authMode === 'signup') {
        if (!name) throw new Error("Name is required");
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      alert("Password reset email sent!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter a phone number");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await sendOtp(phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyOtp(otp);
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Floating Fullscreen Toggle */}
      <div className="fixed top-6 right-6 z-[100]">
        <button
          onClick={toggleFullscreen}
          className="p-3 text-gray-500 hover:text-white bg-black/40 hover:bg-white/5 rounded-2xl backdrop-blur-2xl border border-white/10 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[180px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
        
        {/* Floating Logo Badge */}
        <div className="mb-8 animate-float">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-5 bg-[#0f172a] rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl">
              <SparklesIcon className="h-10 w-10 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 mb-12 animate-in-up">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Study Buddy
          </h1>
          <p className="text-indigo-400 font-bold uppercase tracking-[0.4em] text-[10px] sm:text-xs">
            The Next-Gen AI Learning Platform
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent mx-auto mt-6"></div>
          <p className="text-xl sm:text-2xl text-gray-400 font-medium tracking-tight">
            Study Smarter, <span className="text-white italic">Not Harder</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full animate-in-up-delay bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 sm:p-12 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {authMode === 'google' ? 'Welcome Back' : authMode === 'email' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Phone Login'}
              </h2>
              <p className="text-gray-400">
                {authMode === 'google' ? 'Sign in to access your personalized learning dashboard' : 'Enter your details to continue your learning journey'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {authMode === 'google' ? (
              <div className="space-y-4">
                <p className="text-center text-gray-500 text-sm font-medium">
                  Authentication is currently disabled. You are logged in as a guest.
                </p>
                <Button
                  onClick={loginAsGuest}
                  className="w-full py-5 text-sm rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em]"
                >
                  Enter as Guest
                </Button>
              </div>
            ) : authMode === 'phone' ? (
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <div className="space-y-4">
                    <input
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-500"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 text-sm rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest"
                    >
                      {isSubmitting ? <Loader size="sm" /> : 'Send OTP'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-500 text-center text-2xl tracking-[0.5em]"
                      maxLength={6}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 text-sm rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest"
                    >
                      {isSubmitting ? <Loader size="sm" /> : 'Verify OTP'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      Change Phone Number
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAuthMode('google')}
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors pt-2 border-t border-white/5 w-full"
                >
                  &larr; Back to Google Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-500"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder:text-gray-500"
                  required
                />
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-sm rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader size="sm" /> : (authMode === 'email' ? 'Sign In' : 'Sign Up')}
                </Button>

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'email' ? 'signup' : 'email')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {authMode === 'email' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                  {authMode === 'email' && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAuthMode('google')}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors pt-2 border-t border-white/5"
                  >
                    &larr; Back to Google Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <p className="mt-12 text-gray-600 text-[9px] uppercase tracking-[0.5em] font-bold">
          Encrypted &bull; AI Powered &bull; Realtime
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes in-up {
          from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-in-up { animation: in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-in-up-delay { animation: in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

export default LandingPage;