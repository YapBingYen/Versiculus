import React from 'react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded font-inter font-bold shadow-2xl z-[60] animate-fade-in whitespace-nowrap">
      {message}
    </div>
  );
}
