// Transaction History Management
export class TransactionHistory {
  constructor() {
    this.storageKey = 'upi_transaction_history'
  }

  // Get all transactions from localStorage
  getTransactions() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading transaction history:', error)
      return []
    }
  }

  // Add a new transaction to history
  addTransaction(transaction) {
    try {
      const transactions = this.getTransactions()
      const newTransaction = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'completed',
        ...transaction
      }
      
      transactions.unshift(newTransaction) // Add to beginning
      
      // Keep only last 100 transactions
      if (transactions.length > 100) {
        transactions.splice(100)
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(transactions))
      return newTransaction
    } catch (error) {
      console.error('Error saving transaction:', error)
      throw error
    }
  }

  // Mark a pending transaction as failed
  markTransactionFailed(transactionId) {
    try {
      const transactions = this.getTransactions()
      const transaction = transactions.find(t => t.id === transactionId)
      if (transaction) {
        transaction.status = 'failed'
        transaction.failedAt = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(transactions))
      }
    } catch (error) {
      console.error('Error updating transaction status:', error)
    }
  }

  // Get transaction statistics
  getStats() {
    const transactions = this.getTransactions()
    const successful = transactions.filter(t => t.status === 'completed')
    const failed = transactions.filter(t => t.status === 'failed')
    
    const totalAmount = successful.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    
    return {
      total: transactions.length,
      successful: successful.length,
      failed: failed.length,
      totalAmount: totalAmount.toFixed(2)
    }
  }

  // Clear all history (useful for testing)
  clearHistory() {
    localStorage.removeItem(this.storageKey)
  }
}

// Export singleton instance
export const transactionHistory = new TransactionHistory()
