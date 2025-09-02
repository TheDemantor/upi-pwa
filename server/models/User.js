const mongoose = require('mongoose');

const PocketSchema = new mongoose.Schema({
	name: { type: String, required: true },
	balance: { type: Number, required: true },
	spent: { type: Number, required: true },
});

const TransactionSchema = new mongoose.Schema({
	pocket: { type: String, required: true },
	type: { type: String, required: true },
	amount: { type: Number, required: true },
	upiId: { type: String, required: true },
	payee: { type: String, required: true },
	message: { type: String },
});

const UserSchema = new mongoose.Schema({
	name: { type: String, required: true },
	pockets: [PocketSchema],
	transactions: [TransactionSchema],
	resetDate: { type: Date, required: true },
});

module.exports = mongoose.model('User', UserSchema);
