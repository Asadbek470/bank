
import { db } from './db';
import { User, Transaction, AccountStatus } from '../types';
// Fix: Correct constant names from constants.ts
import { FEE_RATE, THRESHOLD_SUSPICIOUS, THRESHOLD_BLOCK } from '../constants';

export const financeService = {
  processTransfer: (senderId: string, receiverId: string, amount: number): { success: boolean, error?: string } => {
    // Fix: db.getUserById -> db.getUser
    const sender = db.getUser(senderId);
    const receiver = db.getUser(receiverId);

    if (!sender || !receiver) return { success: false, error: "User not found" };
    if (sender.status === AccountStatus.BLOCKED) return { success: false, error: "Your account is blocked" };
    if (amount <= 0) return { success: false, error: "Invalid amount" };

    // COMMISSION IS DEDUCTED TWICE
    // Fix: FEE_PERCENTAGE -> FEE_RATE
    const feePerEvent = amount * FEE_RATE;
    const totalDeduction = amount + (feePerEvent * 2);

    if (sender.balance < totalDeduction) return { success: false, error: "Insufficient balance (including double fee)" };

    // Update Sender
    sender.balance -= totalDeduction;
    financeService.securityScan(sender);

    // Update Receiver
    receiver.balance += amount;
    financeService.securityScan(receiver);

    db.updateUser(sender);
    db.updateUser(receiver);

    // Record Transaction
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      senderId,
      receiverId,
      amount,
      // Fix: fee -> totalFee to match Transaction interface
      totalFee: feePerEvent * 2,
      type: 'TRANSFER',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };
    db.saveTransaction(tx);

    // Fix: db.saveLog -> db.log and remove auto-generated id/timestamp fields
    db.log({
      userId: senderId,
      action: 'TRANSFER_OUT',
      details: `Sent ${amount} KIB to ${receiverId}. Total fee: ${feePerEvent * 2}`,
      severity: 'INFO'
    });

    return { success: true };
  },

  securityScan: (user: User) => {
    // Fix: BLOCK_THRESHOLD -> THRESHOLD_BLOCK
    if (user.balance >= THRESHOLD_BLOCK) {
      user.status = AccountStatus.BLOCKED;
      // Fix: db.saveLog -> db.log and remove auto-generated id/timestamp fields
      db.log({
        userId: user.userId,
        action: 'AUTO_BLOCK',
        details: `Balance ${user.balance} exceeds block limit.`,
        severity: 'CRITICAL'
      });
    // Fix: SUSPICIOUS_THRESHOLD -> THRESHOLD_SUSPICIOUS
    } else if (user.balance >= THRESHOLD_SUSPICIOUS) {
      user.status = AccountStatus.SUSPICIOUS;
      // Fix: db.saveLog -> db.log and remove auto-generated id/timestamp fields
      db.log({
        userId: user.userId,
        action: 'SECURITY_ALERT',
        details: `Balance ${user.balance} flagged as suspicious.`,
        severity: 'WARNING'
      });
    } else if (user.status !== AccountStatus.BLOCKED) {
       user.status = AccountStatus.ACTIVE;
    }
  },

  refundTransaction: (txId: string): { success: boolean, error?: string } => {
    const tx = db.getTransactions().find(t => t.id === txId);
    // Fix: CANCELLED -> REVERTED to match Transaction.status type
    if (!tx || tx.status === 'REVERTED') return { success: false, error: "Invalid transaction" };

    // Fix: db.getUserById -> db.getUser
    const sender = db.getUser(tx.senderId);
    const receiver = db.getUser(tx.receiverId);

    if (!sender || !receiver) return { success: false, error: "Parties not found" };

    // Logic: Receiver returns the amount. Fee is not returned (platform kept it).
    if (receiver.balance < tx.amount) return { success: false, error: "Receiver has insufficient funds for refund" };

    receiver.balance -= tx.amount;
    sender.balance += tx.amount;

    // Fix: CANCELLED -> REVERTED to match Transaction.status type
    tx.status = 'REVERTED';
    db.updateTransaction(tx);
    db.updateUser(sender);
    db.updateUser(receiver);

    return { success: true };
  }
};
