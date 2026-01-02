
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, SecurityLog, AccountStatus, AuditEntry } from '../types';
import { db } from '../services/db';
import { Backend } from '../services/backend';

interface CommissionPanelProps {
  user: User;
}

const CommissionPanel: React.FC<CommissionPanelProps> = ({ user }) => {
  const [data, setData] = useState({ users: [] as User[], txs: [] as Transaction[], logs: [] as SecurityLog[], audit: [] as AuditEntry[] });
  const [tab, setTab] = useState<'users' | 'ledger' | 'security' | 'audit' | 'analytics'>('users');
  const [filter, setFilter] = useState('');
  
  const [auth, setAuth] = useState({ active: false, pass: '', action: null as any, params: null as any });

  const refresh = () => setData({
    users: db.getUsers(),
    txs: db.getTransactions().reverse(),
    logs: db.getLogs().reverse(),
    audit: db.getAudit().reverse()
  });

  useEffect(() => {
    refresh();
    const inv = setInterval(refresh, 5000);
    return () => clearInterval(inv);
  }, []);

  const trigger = (action: () => void, params: any) => setAuth({ active: true, pass: '', action, params });

  const confirm = () => {
    try {
      Backend.performAdminAction(user.userId, auth.pass, auth.action, auth.params);
      setAuth({ active: false, pass: '', action: null, params: null });
      refresh();
    } catch (e: any) { alert(e.message); }
  };

  const stats = useMemo(() => {
    const totalVolume = data.txs.reduce((sum, tx) => sum + (tx.status === 'COMPLETED' ? tx.amount : 0), 0);
    const totalFees = data.txs.reduce((sum, tx) => sum + tx.totalFee, 0);
    const blockedNodes = data.users.filter(u => u.status === AccountStatus.BLOCKED).length;
    return { totalVolume, totalFees, blockedNodes };
  }, [data.txs, data.users]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-1 p-6 rounded-[2rem] bg-purple-500/10 border border-purple-500/20 backdrop-blur-md">
           <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1">Override Status</h4>
           <p className="text-xl font-black italic">LEVEL 7</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800">
           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Mesh Volume</h4>
           <p className="text-xl font-mono text-cyan-400">{stats.totalVolume.toLocaleString()} KIB</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800">
           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Treasury Fees</h4>
           <p className="text-xl font-mono text-pink-500">{stats.totalFees.toLocaleString()} KIB</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-slate-800">
           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Locked Nodes</h4>
           <p className="text-xl font-mono text-red-500">{stats.blockedNodes}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800">
          {(['users', 'ledger', 'security', 'audit', 'analytics'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider ${tab === t ? 'bg-purple-600 text-white shadow-2xl shadow-purple-500/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Global Scan (UID/Name/TXID)..." 
          className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:border-purple-500 outline-none w-64"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {/* Dynamic Views */}
      <div className="min-h-[500px]">
        {tab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.users.filter(u => u.username.includes(filter) || u.userId.includes(filter)).map(u => (
              <div key={u.userId} className="p-6 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 hover:border-purple-500/40 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-black text-slate-400 group-hover:text-purple-400 border border-slate-700">
                      {u.username[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{u.username}</h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">{u.userId} • {u.ipAddress}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.status === 'BLOCKED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {u.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Ledger Value</p>
                    <p className="text-xl font-mono text-cyan-400 font-black">{u.balance.toFixed(2)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => {
                        const amt = prompt("New balance?");
                        if (amt) trigger(() => { u.balance = parseFloat(amt); db.updateUser(u); }, { targetId: u.userId, actionType: 'BALANCE_ADJUST', oldValue: u.balance, newValue: amt });
                    }} className="p-2 rounded-lg bg-slate-800 hover:bg-purple-600/20 text-slate-400 hover:text-purple-400 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                    </button>
                    <button onClick={() => trigger(() => { u.status = u.status === 'BLOCKED' ? AccountStatus.ACTIVE : AccountStatus.BLOCKED; db.updateUser(u); }, { targetId: u.userId, actionType: 'STATUS_TOGGLE', oldValue: u.status, newValue: u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' })} 
                       className={`p-2 rounded-lg transition-all ${u.status === 'BLOCKED' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'ledger' && (
           <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden">
             <table className="w-full text-left text-xs">
               <thead className="bg-slate-950/50 text-slate-500 uppercase font-black tracking-widest text-[9px]">
                 <tr>
                    <th className="px-8 py-6">Reference ID</th>
                    <th className="px-8 py-6">Entities (Src/Dst)</th>
                    <th className="px-8 py-6">Value (KIB)</th>
                    <th className="px-8 py-6">Commission</th>
                    <th className="px-8 py-6">State</th>
                    <th className="px-8 py-6">Force Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {data.txs.map(t => (
                   <tr key={t.id} className="hover:bg-purple-500/5 transition-colors">
                     <td className="px-8 py-4 font-mono text-purple-400">{t.id}</td>
                     <td className="px-8 py-4 font-medium">{t.senderId} <span className="text-slate-600 mx-2">→</span> {t.receiverId}</td>
                     <td className="px-8 py-4 font-black text-slate-200">{t.amount}</td>
                     <td className="px-8 py-4 text-slate-500">{t.totalFee}</td>
                     <td className="px-8 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${t.status === 'REVERTED' ? 'text-red-500 border border-red-500/30' : t.status === 'FLAGGED' ? 'text-yellow-500 border border-yellow-500/30' : 'text-green-500 border border-green-500/30'}`}>
                          {t.status}
                        </span>
                     </td>
                     <td className="px-8 py-4">
                        {t.status === 'COMPLETED' && (
                          <button onClick={() => trigger(() => {
                             const s = db.getUser(t.senderId); const r = db.getUser(t.receiverId);
                             if(s && r) { r.balance -= t.amount; s.balance += t.amount; t.status = 'REVERTED'; db.updateUser(s); db.updateUser(r); db.updateTransaction(t); }
                          }, { targetId: t.id, actionType: 'TX_ROLLBACK', oldValue: 'COMPLETED', newValue: 'REVERTED' })} className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase underline tracking-tighter transition-all">Rollback</button>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-3">
             {data.audit.map(a => (
               <div key={a.id} className="p-5 rounded-3xl bg-slate-900/30 border border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                     <div className="w-1.5 h-12 bg-purple-500 rounded-full"></div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-200">{a.actionType} <span className="text-slate-500 lowercase mx-2">on</span> {a.targetId}</p>
                        <p className="text-[10px] text-slate-500">Admin: <span className="text-purple-400 font-mono">{a.adminId}</span> • {new Date(a.timestamp).toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] text-slate-600 uppercase font-black">Mutation</p>
                     <p className="text-xs font-mono"><span className="text-red-400">{String(a.oldValue)}</span> <span className="text-slate-500 mx-2">→</span> <span className="text-green-400">{String(a.newValue)}</span></p>
                  </div>
               </div>
             ))}
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-2">
            {data.logs.map(l => (
              <div key={l.id} className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all hover:translate-x-1 ${
                l.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/30' : 
                l.severity === 'WARNING' ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-slate-900/30 border-slate-800'
              }`}>
                <div className={`w-3 h-3 rounded-full ${l.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse shadow-[0_0_15px_red]' : l.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-cyan-500'}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-[10px] uppercase tracking-wider text-slate-300">{l.action} <span className="text-slate-600 mx-2">@</span> {l.userId}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{l.details}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
             <svg className="w-24 h-24 mb-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
             <h3 className="text-2xl font-black italic uppercase tracking-tighter">Enterprise Intelligence Feed</h3>
             <p className="text-xs uppercase tracking-[0.3em] mt-2">Connecting to Deep Analytics Grid...</p>
          </div>
        )}
      </div>

      {/* SECONDARY AUTH OVERLAY */}
      {auth.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl animate-in zoom-in duration-300">
          <div className="w-full max-w-sm p-10 rounded-[3rem] bg-slate-900 border-2 border-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.3)]">
            <div className="text-center mb-10">
               <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               </div>
               <h3 className="text-2xl font-black italic uppercase text-purple-400 tracking-tighter mb-2">Double Auth</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protocol Override Required</p>
            </div>
            
            <input 
              type="password"
              placeholder="ENTER MASTER KEY..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 mb-8 focus:border-purple-500 outline-none text-center font-mono tracking-[0.5em] text-lg text-purple-400"
              value={auth.pass}
              onChange={e => setAuth({...auth, pass: e.target.value})}
              autoFocus
            />

            <div className="flex space-x-4">
              <button 
                onClick={() => setAuth({ active: false, pass: '', action: null, params: null })}
                className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 transition-all border border-slate-800 rounded-2xl"
              >Abort</button>
              <button 
                onClick={confirm}
                className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl shadow-purple-600/50 hover:bg-purple-500 active:scale-95 transition-all tracking-widest"
              >Authenticate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPanel;
