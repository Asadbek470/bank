
import React, { useState } from 'react';
import { db } from '../services/db';
import { User, UserRole, AccountStatus } from '../types';
import { 
  INITIAL_BALANCE, 
  SECRET_COMMISSION_USERNAME, 
  SECRET_COMMISSION_CODE 
} from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'COMMISSION'>('LOGIN');
  const [formData, setFormData] = useState({ id: '', user: '', pass: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'REGISTER') {
        const newUser = db.register(formData.id, formData.user, formData.pass);
        onLogin(newUser);
      } else if (mode === 'COMMISSION') {
        if (formData.user === SECRET_COMMISSION_USERNAME && formData.pass === SECRET_COMMISSION_CODE) {
          // Grant Commission access
          let comm = db.getUsers().find(u => u.role === UserRole.COMMISSION);
          if (!comm) {
             comm = db.register('COMM-ROOT', 'COMMISSION_OFFICER', 'ROOT');
             comm.role = UserRole.COMMISSION;
             db.updateUser(comm);
          }
          onLogin(comm);
        } else {
          setError("CREDENTIAL REJECTED BY PROTOCOL");
        }
      } else {
        const user = db.login(formData.id, formData.pass);
        onLogin(user);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md space-y-8 p-10 cyber-card rounded-[32px] border border-slate-800 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            CyberONE
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">Integrated Financial Mesh</p>
        </div>

        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
          {(['LOGIN', 'REGISTER', 'COMMISSION'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all rounded-xl ${
                mode === m ? (m === 'COMMISSION' ? 'bg-purple-600 text-white' : 'bg-cyan-500 text-slate-950') : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'COMMISSION' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Secure Node ID</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition-all font-mono"
                placeholder="ID-0000"
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">
              {mode === 'COMMISSION' ? 'Clearance Handle' : 'Username'}
            </label>
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition-all"
              placeholder="..."
              value={formData.user}
              onChange={e => setFormData({...formData, user: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">
              {mode === 'COMMISSION' ? 'Secure Protocol Code' : 'Access Password'}
            </label>
            <input 
              type="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 transition-all"
              placeholder="••••••••"
              value={formData.pass}
              onChange={e => setFormData({...formData, pass: e.target.value})}
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase animate-pulse">{error}</p>}

          <button className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
            mode === 'COMMISSION' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
          }`}>
            {mode === 'COMMISSION' ? 'Request Override Access' : 'Establish Connection'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
