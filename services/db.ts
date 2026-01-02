
import { User, Message, Transaction, SecurityLog, AuditEntry, UserRole, AccountStatus } from '../types';
import { INITIAL_BALANCE, MAX_LOGIN_ATTEMPTS } from '../constants';

class LocalDB {
  private keys = {
    users: 'cyber_users_v2',
    txs: 'cyber_txs_v2',
    msgs: 'cyber_msgs_v2',
    logs: 'cyber_logs_v2',
    audit: 'cyber_audit_v2'
  };

  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getUsers(): User[] { return this.get(this.keys.users); }
  getUser(id: string): User | undefined { return this.getUsers().find(u => u.userId === id); }
  updateUser(user: User) {
    const all = this.getUsers().map(u => u.userId === user.userId ? user : u);
    this.set(this.keys.users, all);
  }

  register(id: string, name: string, pass: string): User {
    if (this.getUser(id)) throw new Error("ID already exists in registry");
    const newUser: User = {
      userId: id,
      username: name,
      passwordHash: pass, 
      role: UserRole.USER,
      status: AccountStatus.ACTIVE,
      balance: INITIAL_BALANCE,
      card: {
        id: 'KB-' + Math.floor(Math.random() * 90000000 + 10000000).toString(),
        name: 'Kiberone Standard',
        issuedAt: new Date().toISOString()
      },
      lastLogin: null,
      loginAttempts: 0,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255)
    };
    const all = this.getUsers();
    all.push(newUser);
    this.set(this.keys.users, all);
    this.log({ userId: id, action: 'REGISTER', details: 'Node initialized', severity: 'INFO' });
    return newUser;
  }

  login(id: string, pass: string): User {
    const user = this.getUser(id);
    if (!user) throw new Error("Unknown credentials");
    if (user.status === AccountStatus.BLOCKED) throw new Error("ACCESS FORBIDDEN: NODE BLOCKED");
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
       user.status = AccountStatus.BLOCKED;
       this.updateUser(user);
       this.log({ userId: id, action: 'BRUTE_FORCE_DETECTED', details: 'Auto-blocking node', severity: 'CRITICAL' });
       throw new Error("EXCESSIVE LOGIN ATTEMPTS: NODE LOCKED");
    }

    if (user.passwordHash === pass) {
      user.loginAttempts = 0;
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);
      this.log({ userId: id, action: 'LOGIN_SUCCESS', details: 'Session established', severity: 'INFO' });
      return user;
    } else {
      user.loginAttempts++;
      this.updateUser(user);
      this.log({ userId: id, action: 'LOGIN_FAILURE', details: `Attempt ${user.loginAttempts}`, severity: 'WARNING' });
      throw new Error(`Access Denied. Attempt ${user.loginAttempts}/${MAX_LOGIN_ATTEMPTS}`);
    }
  }

  getTransactions(): Transaction[] { return this.get(this.keys.txs); }
  saveTransaction(tx: Transaction) {
    const all = this.getTransactions();
    all.push(tx);
    this.set(this.keys.txs, all);
  }
  updateTransaction(tx: Transaction) {
    const all = this.getTransactions().map(t => t.id === tx.id ? tx : t);
    this.set(this.keys.txs, all);
  }

  getMessages(): Message[] { return this.get(this.keys.msgs); }
  sendMessage(from: string, to: string, content: string) {
    const msg: Message = { id: 'MSG-' + Date.now(), fromId: from, toId: to, content, timestamp: new Date().toISOString() };
    const all = this.getMessages();
    all.push(msg);
    this.set(this.keys.msgs, all);
  }

  getLogs(): SecurityLog[] { return this.get(this.keys.logs); }
  log(payload: Omit<SecurityLog, 'id' | 'timestamp'>) {
    const newLog: SecurityLog = { ...payload, id: 'LOG-' + Math.random().toString(36).substr(2, 5), timestamp: new Date().toISOString() };
    const all = this.getLogs();
    all.push(newLog);
    this.set(this.keys.logs, all);
  }

  getAudit(): AuditEntry[] { return this.get(this.keys.audit); }
  audit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    const newAudit: AuditEntry = { ...entry, id: 'AUD-' + Date.now(), timestamp: new Date().toISOString() };
    const all = this.getAudit();
    all.push(newAudit);
    this.set(this.keys.audit, all);
  }
}

export const db = new LocalDB();
