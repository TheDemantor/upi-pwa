'use client'

export default function TransactionFilter({ filters, onFilterChange, totalTransactions }) {
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      dateRange: 'all',
      amountRange: 'all'
    })
  }

  const hasActiveFilters = filters.status !== 'all' || filters.dateRange !== 'all' || filters.amountRange !== 'all'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="text-sm text-gray-500">
          {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Date Range Filter */}

        {/* Date Range Filter */}
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            id="date-filter"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Amount Range Filter */}
        <div>
          <label htmlFor="amount-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Amount Range
          </label>
          <select
            id="amount-filter"
            value={filters.amountRange}
            onChange={(e) => handleFilterChange('amountRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Amounts</option>
            <option value="low">Low (≤ ₹1,000)</option>
            <option value="medium">Medium (₹1,000 - ₹5,000)</option>
            <option value="high">High (&gt; ₹5,000)</option>
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all filters
          </button>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Date: {filters.dateRange === 'today' ? 'Today' : filters.dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                <button
                  onClick={() => handleFilterChange('dateRange', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.amountRange !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Amount: {filters.amountRange === 'low' ? 'Low' : filters.amountRange === 'medium' ? 'Medium' : 'High'}
                <button
                  onClick={() => handleFilterChange('amountRange', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
