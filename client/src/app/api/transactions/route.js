import { NextResponse } from 'next/server'

// Simple mock API for testing PWA functionality
export async function POST(request) {
  try {
    const body = await request.json()
    const { upiId, amount, note } = body

    // Validate required fields
    if (!upiId || !amount) {
      return NextResponse.json(
        { error: 'UPI ID and amount are required' },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock successful transaction
    const transaction = {
      id: Date.now().toString(),
      upiId,
      amount: parseFloat(amount),
      note: note || '',
      status: 'success',
      timestamp: new Date().toISOString(),
      transactionRef: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
    }

    // console.log('Transaction processed:', transaction)

    return NextResponse.json({
      success: true,
      message: 'Transaction processed successfully',
      transaction
    })

  } catch (error) {
    console.error('Transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return mock transaction history
  const mockTransactions = [
    {
      id: '1',
      upiId: 'test@upi',
      amount: 100,
      note: 'Test transaction',
      status: 'success',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      transactionRef: 'TXN1234567890'
    },
    {
      id: '2',
      upiId: 'demo@upi',
      amount: 50,
      note: 'Demo payment',
      status: 'success',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      transactionRef: 'TXN0987654321'
    }
  ]

  return NextResponse.json({
    success: true,
    transactions: mockTransactions
  })
}
