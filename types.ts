
export enum UserRole {
  USER = 'USER',
  COMMISSION = 'COMMISSION'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPICIOUS = 'SUSPICIOUS',
  BLOCKED = 'BLOCKED',
  FROZEN = 'FROZEN'
}

export interface User {
  userId: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  balance: number;
  card: {
    id: string;
    name: string;
    issuedAt: string;
  };
  lastLogin: string | null;
  loginAttempts: number;
  ipAddress?: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  totalFee: number;
  timestamp: string;
  status: 'COMPLETED' | 'REVERTED' | 'FLAGGED';
  type: 'TRANSFER' | 'ADJUSTMENT' | 'REFUND';
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: string;
}

export interface SecurityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ip?: string;
}

export interface AuditEntry {
  id: string;
  adminId: string;
  targetId: string;
  actionType: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}
