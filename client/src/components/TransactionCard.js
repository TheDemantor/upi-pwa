'use client'

import { useState } from 'react'


export default function TransactionCard({ transaction, onStatusUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false)

  // ...existing code...

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleStatusUpdate = async (newStatus) => {
    if (transaction.status === newStatus) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/transactions/${transaction._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        onStatusUpdate()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('An error occurred while updating status')
    } finally {
      setIsUpdating(false)
    }
  }

  // Color for credit/debit
  const typeColor = transaction.type === 'credit'
    ? 'text-green-700 bg-green-50 border-green-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-bold border ${typeColor}`}>{transaction.type === 'credit' ? 'Credit' : 'Debit'}</span>
          </div>
          <div className="text-sm text-gray-700 mb-1 font-semibold">Pocket: <span className="font-bold text-blue-700">{transaction.pocket}</span></div>
          <div className="text-sm text-gray-500 mb-1">Payee: <span className="font-semibold text-gray-700">{transaction.payee}</span></div>
          <div className="text-sm text-gray-500 mb-1">UPI ID: <span className="font-semibold text-gray-700">{transaction.upiId}</span></div>
          <div className="text-sm text-gray-500 mb-1">Message: <span className="font-semibold text-gray-700">{transaction.message}</span></div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold mb-1 ${transaction.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>₹{transaction.amount}</div>
        </div>
      </div>
    </div>
  )
}
