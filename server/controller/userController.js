const User = require('../models/User');
const mongoose = require('mongoose');


// Get all transactions for a user

exports.getUserTransactions = async (req, res) => {
	try {
		const userId = '68b17ec7b692741c19ed5b3d';
		const objectId = mongoose.Types.ObjectId(userId);
		const user = await User.findById(objectId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		return res.status(200).json({ transactions: user.transactions });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
};

// Get user's name and pockets

exports.getUserNameAndPockets = async (req, res) => {
	try {
		const userId = '68b17ec7b692741c19ed5b3d';
		const objectId = mongoose.Types.ObjectId(userId);
		const user = await User.findById(objectId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		const pockets = user.pockets.map(p => ({
			name: p.name,
			balance: p.balance,
			spent: p.spent
		}));
		return res.status(200).json({ name: user.name, pockets });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
};

// Add transaction and update pocket
exports.addTransaction = async (req, res) => {
	try {
		const userId = '68b17ec7b692741c19ed5b3d';
		const objectId = new mongoose.Types.ObjectId(userId);
		const transaction = req.body;
		// transaction: { pocket, type, amount, upiId, payee, message }

		const user = await User.findById(objectId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Add transaction to user's transactions array
		user.transactions.push(transaction);
		console.log(transaction);

		// Find the pocket to update
		const pocket = user.pockets.find(p => p.name === transaction.pocket);
		if (!pocket) {
			return res.status(400).json({ error: 'Pocket not found' });
		}

		// Update pocket balance and spent based on transaction type
		if (transaction.type === 'credit') {
			pocket.balance += transaction.amount;
		} else if (transaction.type === 'debit') {
			pocket.balance -= transaction.amount;
			pocket.spent += transaction.amount;
		} else {
			return res.status(400).json({ error: 'Invalid transaction type' });
		}

		await user.save();
		// Prepare response with only user name, concerned pocket, and the new transaction
		const response = {
			name: user.name,
			pocket: {
				name: pocket.name,
				balance: pocket.balance,
				spent: pocket.spent
			},
			transaction: transaction
		};
		return res.status(200).json({ message: 'Transaction added', user: response });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
};
