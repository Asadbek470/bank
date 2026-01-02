
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole } from '../types';
import { db } from '../services/db';

interface MessengerProps {
  user: User;
}

const Messenger: React.FC<MessengerProps> = ({ user }) => {
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isCommission = user.role === UserRole.COMMISSION;

  useEffect(() => {
    const load = () => {
      const all = db.getUsers().filter(u => u.userId !== user.userId);
      setContacts(all);
      
      if (selectedId) {
        let history = db.getMessages();
        if (!isCommission) {
          history = history.filter(m => 
            (m.fromId === user.userId && m.toId === selectedId) ||
            (m.fromId === selectedId && m.toId === user.userId)
          );
        } else {
           // Commission sees full context of this user
           history = history.filter(m => m.fromId === selectedId || m.toId === selectedId);
        }
        setMessages(history);
      }
    };
    load();
    const inv = setInterval(load, 2000);
    return () => clearInterval(inv);
  }, [selectedId, user.userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedId) return;
    
    db.sendMessage(user.userId, selectedId, input);
    setInput('');
  };

  const filteredContacts = contacts.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) || 
    c.userId.includes(search)
  );

  return (
    <div className="flex h-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50">
      <div className="w-80 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <input 
            type="text"
            placeholder="Search User ID / Name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-cyan-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {filteredContacts.map(c => (
            <button 
              key={c.userId}
              onClick={() => setSelectedId(c.userId)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-slate-800/50 transition-all ${selectedId === c.userId ? 'bg-cyan-500/10 border-r-2 border-r-cyan-500' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700">
                {c.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{c.username}</p>
                <p className="text-[10px] font-mono text-slate-500">{c.userId}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-950/30">
        {selectedId ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{contacts.find(c => c.userId === selectedId)?.username}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Secure Terminal Connection</p>
              </div>
              {isCommission && <span className="text-[10px] font-bold text-purple-400 animate-pulse uppercase">[ Commission View ]</span>}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.fromId === user.userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    m.fromId === user.userId ? 'bg-cyan-500 text-slate-950 rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    {isCommission && <p className="text-[9px] font-bold opacity-50 mb-1">FROM: {m.fromId}</p>}
                    <p className="text-sm">{m.content}</p>
                    <p className="text-[8px] mt-1 opacity-40">{new Date(m.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/20 flex space-x-3">
              <input 
                type="text"
                placeholder="Encrypted payload..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-all"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 active:scale-95 transition-all">
                SEND
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic">
            <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Select node to start transmission</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
