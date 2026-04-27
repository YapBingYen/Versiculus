'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Toast } from '../../components/ui/Toast';
import { apiUrl } from '../../lib/api';

export default function AdminPage() {
  const [reference, setReference] = useState('');
  const [fullText, setFullText] = useState('');
  const [keyWords, setKeyWords] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [translation, setTranslation] = useState('NIV');
  const [scheduleDate, setScheduleDate] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  
  // Notification States
  const [notifyTitle, setNotifyTitle] = useState('New Verse!');
  const [notifyBody, setNotifyBody] = useState("Play today's Versiculus puzzle.");
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    // Basic client-side check
    const savedToken = localStorage.getItem('versiculus_token');
    setToken(savedToken);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('You must be logged in as admin.');
      return;
    }

    try {
      const payload = {
        reference,
        fullText,
        keyWords: keyWords.split(',').map(w => w.trim()),
        difficulty: parseInt(difficulty),
        translation,
        scheduleDate: scheduleDate || null
      };

      const res = await fetch(apiUrl('/api/admin/verses'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add verse');
      
      showToast('Verse scheduled successfully!');
      // Reset form
      setReference('');
      setFullText('');
      setKeyWords('');
      setScheduleDate('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleNotifyAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsNotifying(true);
    try {
      const res = await fetch(apiUrl('/api/admin/notify-all'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: notifyTitle, body: notifyBody })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send notifications');
      
      showToast(data.message || 'Notifications sent!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsNotifying(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-[#121213] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-playfair text-[#C9A84C] mb-4">Access Denied</h1>
        <p className="font-inter text-[#818384] mb-6">Please log in to access the Admin CMS.</p>
        <Link href="/play" className="text-[#4A90C4] hover:underline">Return to Game</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121213] text-white flex flex-col p-4 sm:p-8">
      <div className="max-w-2xl w-full mx-auto bg-[#1A1A1B] border border-[#3A3A3C] rounded-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-playfair font-bold text-[#C9A84C]">Admin CMS: Schedule Verse</h1>
          <Link href="/play" className="text-[#818384] hover:text-white transition-colors">
            Back to Game
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-inter">
          <div>
            <label className="block text-sm text-[#818384] mb-1">Reference (e.g., John 3:16)</label>
            <input required value={reference} onChange={e => setReference(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>

          <div>
            <label className="block text-sm text-[#818384] mb-1">Full Verse Text</label>
            <textarea required rows={4} value={fullText} onChange={e => setFullText(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>

          <div>
            <label className="block text-sm text-[#818384] mb-1">Key Words (comma separated)</label>
            <input required placeholder="world, Son, believes, perish" value={keyWords} onChange={e => setKeyWords(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[#818384] mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]">
                <option value="1">1 - Easy</option>
                <option value="2">2 - Medium</option>
                <option value="3">3 - Hard</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[#818384] mb-1">Translation</label>
              <select value={translation} onChange={e => setTranslation(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]">
                <option value="NIV">NIV</option>
                <option value="ESV">ESV</option>
                <option value="KJV">KJV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#818384] mb-1">Schedule Date (YYYY-MM-DD)</label>
            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>

          <button type="submit" className="w-full py-3 mt-4 bg-[#2C5F8A] hover:bg-[#4A90C4] text-white rounded font-bold text-lg transition-colors">
            Add Verse
          </button>
        </form>

        <hr className="my-10 border-[#3A3A3C]" />

        <div className="mb-6">
          <h2 className="text-xl font-playfair font-bold text-[#C9A84C]">Broadcast Notification</h2>
          <p className="text-[#818384] text-sm mt-1">Send a push notification and email to all subscribed users.</p>
        </div>

        <form onSubmit={handleNotifyAll} className="flex flex-col gap-4 font-inter">
          <div>
            <label className="block text-sm text-[#818384] mb-1">Notification Title</label>
            <input required value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>
          <div>
            <label className="block text-sm text-[#818384] mb-1">Notification Body</label>
            <textarea required rows={2} value={notifyBody} onChange={e => setNotifyBody(e.target.value)} className="w-full bg-[#121213] border border-[#565758] rounded p-2 text-white focus:outline-none focus:border-[#4A90C4]" />
          </div>
          <button type="submit" disabled={isNotifying} className={`w-full py-3 mt-4 bg-[#538D4E] hover:bg-[#60A05A] text-white rounded font-bold text-lg transition-colors ${isNotifying ? 'opacity-50 cursor-wait' : ''}`}>
            {isNotifying ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>
      <Toast message={toastMsg} />
    </main>
  );
}
