
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { db } from '../services/db';
import { financeService } from '../services/financeService';

interface FinanceProps {
  user: User;
}

const Finance: React.FC<FinanceProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const refreshData = () => {
      // Fix: db.getUserById -> db.getUser
      const updatedUser = db.getUser(user.userId);
      if (updatedUser) setUser(updatedUser);
      const allTx = db.getTransactions();
      setTransactions(allTx.filter(t => t.senderId === user.userId || t.receiverId === user.userId).reverse());
    };
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [user.userId]);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const amt = parseFloat(amount);
    const result = financeService.processTransfer(user.userId, receiverId, amt);

    if (result.success) {
      setMessage({ text: "Transfer successful. Commission deducted.", type: "success" });
      setReceiverId('');
      setAmount('');
    } else {
      setMessage({ text: result.error || "Transfer failed", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Wallet Card */}
      <div className="space-y-8">
        <div className="p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12zm-10-7h8v2h-8v-2z" /></svg>
          </div>
          <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Asset Card</p>
                <p className="text-xl font-bold tracking-tight">Kiberone Network</p>
              </div>
              <div className="px-3 py-1 bg-cyan-500 text-slate-900 rounded-lg text-xs font-bold">VIP STATUS</div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400">Card Identifier</p>
              {/* Fix: user.cardId -> user.card.id */}
              <p className="text-2xl font-mono tracking-[0.2em]">{user.card.id.replace(/(.{4})/g, '$1 ')}</p>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 uppercase">Available Funds</p>
                <p className="text-3xl font-mono text-cyan-400">{user.balance.toFixed(2)} KIB</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Status</p>
                <p className="font-bold text-green-400">{user.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
            Instant Transfer
          </h3>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Receiver ID</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none transition-all font-mono"
                  placeholder="USER-XXX"
                  value={receiverId}
                  onChange={e => setReceiverId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (KIB)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none transition-all font-mono"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="p-3 bg-slate-800/50 rounded-lg text-[10px] text-slate-400 leading-tight">
              <span className="text-red-400 font-bold uppercase mr-1">Warning:</span> 
              Platform fee is 5%. For security, commission is deducted twice (Double Secure Surcharge).
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {message.text}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing Protocol...' : 'Confirm Transaction'}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center justify-between">
          <span>Transaction Logs</span>
          <span className="text-xs font-normal text-slate-500">Live Updates</span>
        </h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-20 text-slate-600">
              No recorded activity on this ledger.
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.senderId === user.userId ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {tx.senderId === user.userId ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{tx.senderId === user.userId ? `Sent to ${tx.receiverId}` : `From ${tx.senderId}`}</p>
                    <p className="text-[10px] font-mono text-slate-500">{tx.id} • {new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-mono ${tx.senderId === user.userId ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.senderId === user.userId ? '-' : '+'}{tx.amount} KIB
                  </p>
                  {/* Fix: tx.fee -> tx.totalFee to match Transaction interface */}
                  <p className="text-[10px] text-slate-500">Fee: {tx.totalFee} KIB</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;
