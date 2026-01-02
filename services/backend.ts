
import { db } from './db';
import { User, Transaction, AccountStatus, UserRole } from '../types';
import { 
  FEE_RATE, 
  THRESHOLD_BLOCK, 
  THRESHOLD_SUSPICIOUS, 
  SECOND_COMMISSION_PASSWORD,
  RISK_SCORE_HIGH_TRANSFER
} from '../constants';

/**
 * ENTERPRISE BACKEND LOGIC CORE
 */
export const Backend = {
  // --- FINANCIAL SECURITY LAYER ---
  
  processTransfer: (senderId: string, receiverId: string, amount: number) => {
    const sender = db.getUser(senderId);
    const receiver = db.getUser(receiverId);

    if (!sender || !receiver) throw new Error("Invalid transfer route");
    if (sender.status === AccountStatus.BLOCKED || sender.status === AccountStatus.FROZEN) 
       throw new Error("Financial access restricted");
    
    if (amount <= 0) throw new Error("Non-positive value transfer rejected");

    // Double Surcharge Policy
    const singleFee = amount * FEE_RATE;
    const totalDeduction = amount + (singleFee * 2);

    if (sender.balance < totalDeduction) throw new Error("Insufficient cleared funds (incl. double fee)");

    // Anti-Fraud Pre-check
    const riskScore = (amount / sender.balance) * 100;
    const isHighRisk = riskScore > RISK_SCORE_HIGH_TRANSFER;

    sender.balance -= totalDeduction;
    receiver.balance += amount;

    const tx: Transaction = {
      id: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      senderId,
      receiverId,
      amount,
      totalFee: singleFee * 2,
      timestamp: new Date().toISOString(),
      status: isHighRisk ? 'FLAGGED' : 'COMPLETED',
      type: 'TRANSFER',
      metadata: { riskScore: riskScore.toFixed(2) }
    };

    db.saveTransaction(tx);
    
    Backend.securityScan(sender);
    Backend.securityScan(receiver);

    db.updateUser(sender);
    db.updateUser(receiver);

    db.log({
      userId: senderId,
      action: 'TRANSACTION',
      details: `Transfer ${amount} KIB to ${receiverId}. Fee: ${singleFee * 2}. Risk: ${tx.status}`,
      severity: isHighRisk ? 'WARNING' : 'INFO'
    });

    return tx;
  },

  securityScan: (user: User) => {
    if (user.balance >= THRESHOLD_BLOCK) {
      user.status = AccountStatus.BLOCKED;
      db.log({
        userId: user.userId,
        action: 'AUTO_SENTINEL_BLOCK',
        details: `Critical balance limit breach: ${user.balance}`,
        severity: 'CRITICAL'
      });
    } else if (user.balance >= THRESHOLD_SUSPICIOUS) {
      user.status = AccountStatus.SUSPICIOUS;
      db.log({
        userId: user.userId,
        action: 'RISK_ADVISORY',
        details: `High balance threshold reached: ${user.balance}`,
        severity: 'WARNING'
      });
    } else if (user.status === AccountStatus.SUSPICIOUS) {
      user.status = AccountStatus.ACTIVE;
    }
  },

  // --- COMMISSION AUTHORIZATION ---

  validateSecondCommission: (password: string): boolean => {
    return password === SECOND_COMMISSION_PASSWORD;
  },

  performAdminAction: (adminId: string, secondPass: string, action: () => void, auditParams: any) => {
    if (!Backend.validateSecondCommission(secondPass)) {
      db.log({ userId: adminId, action: 'SEC_COMM_FAILURE', details: 'Unauthorized attempt to bypass secondary auth', severity: 'CRITICAL' });
      throw new Error("SECONDARY COMMISSION AUTHENTICATION REJECTED");
    }
    
    action();
    db.audit({
      adminId,
      targetId: auditParams.targetId,
      actionType: auditParams.actionType,
      oldValue: auditParams.oldValue,
      newValue: auditParams.newValue
    });
  }
};
