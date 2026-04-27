import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardMode: boolean;
  setHardMode: (val: boolean) => void;
  translation: string;
  setTranslation: (val: string) => void;
  onOpenAuth?: () => void;
}

export function SettingsModal({ isOpen, onClose, hardMode, setHardMode, translation, setTranslation, onOpenAuth }: SettingsModalProps) {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, isEmailSubscribed, isEmailLoading, toggleEmailSubscription } = useNotifications();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 max-w-sm w-full text-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold">Settings</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex flex-col gap-6 font-inter">
          {/* Hard Mode Toggle */}
          <div className="flex justify-between items-center border-b border-[#3A3A3C] pb-6">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-lg">Hard Mode</h3>
              <p className="text-sm text-[#818384] mt-1">Requires stricter spelling and removes some pre-revealed words.</p>
            </div>
            <button 
              onClick={() => setHardMode(!hardMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${hardMode ? 'bg-[#538D4E]' : 'bg-[#565758]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${hardMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>

          {/* Translation Select */}
          <div className="flex justify-between items-center border-b border-[#3A3A3C] pb-6">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-lg">Bible Translation</h3>
              <p className="text-sm text-[#818384] mt-1">Select your preferred version for the daily verse.</p>
            </div>
            <select 
              value={translation}
              onChange={e => setTranslation(e.target.value)}
              className="bg-[#121213] border border-[#565758] rounded p-2 text-white font-bold focus:outline-none focus:border-[#4A90C4] cursor-pointer"
            >
              <option value="NIV">NIV</option>
              <option value="ESV">ESV</option>
              <option value="KJV">KJV</option>
            </select>
          </div>

          {/* Notifications Toggle */}
          {isSupported && (
            <div className="flex justify-between items-center border-b border-[#3A3A3C] pb-6">
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-lg">Push Notifications</h3>
                <p className="text-sm text-[#818384] mt-1">Get device notifications when a new verse is available to play.</p>
              </div>
              <button 
                onClick={() => {
                  if (!isSubscribed) {
                    subscribe();
                  } else {
                    unsubscribe();
                  }
                }}
                disabled={permission === 'denied'}
                className={`w-12 h-6 rounded-full transition-colors relative ${isSubscribed ? 'bg-[#538D4E]' : 'bg-[#565758]'} ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
          )}

          {/* Email Notifications Toggle */}
          <div className="flex justify-between items-center border-b border-[#3A3A3C] pb-6">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-lg">Email Reminders</h3>
              <p className="text-sm text-[#818384] mt-1">Receive an email when a new daily puzzle is ready.</p>
              {showLoginPrompt && !user && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#C9A84C] animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <div className="flex-1">
                    You must log in to enable email reminders.
                  </div>
                  {onOpenAuth && (
                    <button 
                      onClick={() => { 
                        setShowLoginPrompt(false);
                        onClose(); 
                        onOpenAuth(); 
                      }} 
                      className="underline font-bold hover:text-white transition-colors shrink-0 ml-2 text-right whitespace-nowrap"
                    >
                      Log In
                    </button>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (!user) {
                  setShowLoginPrompt(true);
                  return;
                }
                toggleEmailSubscription();
              }}
              disabled={isEmailLoading}
              className={`w-12 h-6 rounded-full transition-colors relative ${isEmailSubscribed ? 'bg-[#538D4E]' : 'bg-[#565758]'} ${isEmailLoading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isEmailSubscribed ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
