
import React, { useState, useEffect } from 'react';
// Added AccountStatus to imports
import { User, UserRole, SecurityLog, AccountStatus } from '../types';
import Messenger from './Messenger';
import Finance from './Finance';
import CommissionPanel from './CommissionPanel';
import { db } from '../services/db';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'finance' | 'messenger' | 'commission'>('finance');
  const [alerts, setAlerts] = useState<SecurityLog[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    const checkAlerts = () => {
      if (user.role === UserRole.COMMISSION) {
        const critical = db.getLogs().filter(l => l.severity === 'CRITICAL' || l.severity === 'WARNING').slice(0, 10);
        setAlerts(critical);
      }
    };
    checkAlerts();
    const inv = setInterval(checkAlerts, 5000);
    return () => clearInterval(inv);
  }, [user.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050810]">
      {/* Dynamic Sidebar */}
      <div className="w-20 md:w-72 bg-slate-900/20 border-r border-slate-800/50 flex flex-col items-center py-10 backdrop-blur-3xl">
        <div className="mb-14 px-6 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-2xl shadow-cyan-500/20 mb-4 group cursor-pointer hover:rotate-3 transition-transform">
             <div className="w-full h-full bg-slate-950 rounded-[1.9rem] flex items-center justify-center font-black text-2xl tracking-tighter text-cyan-400">
               C<span className="text-white">1</span>
             </div>
          </div>
          <p className="hidden md:block text-[9px] font-black text-slate-500 tracking-[0.4em] uppercase">Enterprise Mesh v4.9</p>
        </div>

        <nav className="flex-1 w-full px-6 space-y-6">
          {(['finance', 'messenger', 'commission'] as const).map(tab => {
             if (tab === 'commission' && user.role !== UserRole.COMMISSION) return null;
             
             const config = {
               finance: { label: 'Treasury', icon: <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'cyan' },
               messenger: { label: 'Comms', icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />, color: 'cyan' },
               commission: { label: 'Override', icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, color: 'purple' }
             }[tab];

             const isActive = activeTab === tab;
             return (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`w-full p-5 rounded-3xl flex items-center space-x-4 transition-all duration-500 relative ${
                   isActive ? (tab === 'commission' ? 'bg-purple-600/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400') : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {isActive && <div className={`absolute left-0 w-1.5 h-8 rounded-full ${tab === 'commission' ? 'bg-purple-600' : 'bg-cyan-600'}`} />}
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{config.icon}</svg>
                 <span className="hidden md:block font-black uppercase text-[10px] tracking-widest">{config.label}</span>
               </button>
             );
          })}
        </nav>

        <div className="mt-auto px-6 w-full">
           <button 
            onClick={onLogout}
            className="w-full p-5 rounded-3xl flex items-center space-x-4 text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden md:block font-black uppercase text-[10px] tracking-widest">Terminate</span>
          </button>
        </div>
      </div>

      {/* Main Framework */}
      <div className="flex-1 flex flex-col bg-slate-950/20 backdrop-blur-lg overflow-hidden relative">
        <header className="h-24 border-b border-slate-800/50 flex items-center justify-between px-10 bg-slate-900/20">
          <div className="flex items-center space-x-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center font-black text-xl text-cyan-400 shadow-inner">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">{user.username}</h2>
              <div className="flex items-center space-x-2">
                 <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Node ID: {user.userId}</p>
                 <span className="text-slate-700">|</span>
                 <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{user.ipAddress}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Cleared Balance</p>
              <p className="text-2xl font-black font-mono text-cyan-400 italic">{user.balance.toFixed(2)} KIB</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user.role === UserRole.COMMISSION && (
                <div className="relative">
                  <button onClick={() => setIsAlertOpen(!isAlertOpen)} className={`p-3 rounded-2xl border transition-all ${alerts.length > 0 ? 'bg-red-600/10 border-red-600/50 text-red-500 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[8px] font-black text-white rounded-full flex items-center justify-center">{alerts.length}</span>}
                  </button>
                  {isAlertOpen && (
                    <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 z-50">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">High-Risk Alerts</h4>
                       <div className="space-y-2 max-h-60 overflow-auto pr-2">
                          {alerts.length === 0 ? <p className="text-xs text-slate-600 px-2 italic">No critical events detected.</p> : alerts.map(l => (
                            <div key={l.id} className="p-3 bg-red-600/5 border border-red-600/10 rounded-xl">
                               <p className="text-[10px] font-black uppercase text-red-400">{l.action}</p>
                               <p className="text-[11px] text-slate-400 truncate">{l.details}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                user.status === AccountStatus.ACTIVE ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                user.status === AccountStatus.SUSPICIOUS ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-red-500/10 border-red-600/30 text-red-400'
              }`}>
                {user.status}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-10">
          {activeTab === 'finance' && <Finance user={user} />}
          {activeTab === 'messenger' && <Messenger user={user} />}
          {activeTab === 'commission' && user.role === UserRole.COMMISSION && <CommissionPanel user={user} />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
