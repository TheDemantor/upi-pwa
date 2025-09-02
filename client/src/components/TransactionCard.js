'use client'

import { useState } from 'react'


export default function TransactionCard({ transaction, onStatusUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status ) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'pending':
        return '⏳'
      case 'failed':
        return '❌'
      default:
        return '❓'
    }
  }

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{transaction.upiId}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
              {getStatusIcon(transaction.status)} {transaction.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-500 mb-2">
            Transaction ID: {transaction.transactionId}
          </div>
          
          {transaction.note && (
            <p className="text-gray-600 text-sm mb-3">{transaction.note}</p>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{transaction.amount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {transaction.status === 'pending' && (
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => handleStatusUpdate('completed')}
            disabled={isUpdating}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Mark Complete'}
          </button>
          <button
            onClick={() => handleStatusUpdate('failed')}
            disabled={isUpdating}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Mark Failed'}
          </button>
        </div>
      )}

      {/* Status-specific actions */}
      {transaction.status === 'completed' && (
        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm text-green-600 font-medium">
            ✓ Transaction completed successfully
          </div>
        </div>
      )}

      {transaction.status === 'failed' && (
        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm text-red-600 font-medium">
            ✗ Transaction failed
          </div>
        </div>
      )}
    </div>
  )
}
