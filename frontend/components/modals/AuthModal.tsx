import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any, token: string) => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, username, password } : { email, password };

    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 max-w-sm w-full text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-bold">{isRegister ? 'Create Account' : 'Log In'}</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm font-inter">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-inter">
          <div>
            <label className="block text-sm text-[#818384] mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" 
            />
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-sm text-[#818384] mb-1">Username</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" 
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-[#818384] mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-2 bg-[#2C5F8A] hover:bg-[#4A90C4] disabled:opacity-50 transition-colors text-white rounded font-bold text-lg"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-inter text-[#818384]">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-[#4A90C4] hover:underline font-bold">
            {isRegister ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
