'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import TransactionCard from '../../components/TransactionCard'
import TransactionFilter from '../../components/TransactionFilter'


export default function HistoryPage() {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    dateRange: 'all',
    amountRange: 'all'
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [transactions, filters])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Fetch using axios
      const response = await axios.get('https://upi-pwa.onrender.com/api/user/transactions')
      console.log(response)
      setTransactions(response.data.transactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Filter by date range (if createdAt exists)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(tx => {
        if (!tx.createdAt) return true;
        const txDate = new Date(tx.createdAt);
        switch (filters.dateRange) {
          case 'today':
            return txDate >= today && txDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return txDate >= weekAgo && txDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return txDate >= monthAgo && txDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }

    // Filter by amount range
    if (filters.amountRange !== 'all') {
      switch (filters.amountRange) {
        case 'low':
          filtered = filtered.filter(tx => tx.amount <= 1000)
          break
        case 'medium':
          filtered = filtered.filter(tx => tx.amount > 1000 && tx.amount <= 5000)
          break
        case 'high':
          filtered = filtered.filter(tx => tx.amount > 5000)
          break
      }
    }

    setFilteredTransactions(filtered)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const refreshTransactions = () => {
    fetchTransactions()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transaction history...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Transactions</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshTransactions}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const totalTransactions = filteredTransactions.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <button
              onClick={refreshTransactions}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total Transactions</div>
              <div className="text-2xl font-bold text-blue-900">{totalTransactions}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-green-900">₹{totalAmount.toFixed(2)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Success Rate</div>
              <div className="text-2xl font-bold text-purple-900">
                {totalTransactions > 0 
                  ? Math.round((filteredTransactions.filter(tx => tx.status === 'completed').length / totalTransactions) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <TransactionFilter 
          filters={filters} 
          onFilterChange={handleFilterChange}
          totalTransactions={totalTransactions}
        />

        {/* Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {transactions.length === 0 
                  ? "You haven't made any transactions yet."
                  : "No transactions match your current filters."
                }
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionCard 
                key={transaction._id} 
                transaction={transaction}
                onStatusUpdate={refreshTransactions}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
