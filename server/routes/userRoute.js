const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// Add transaction and update pocket
router.post('/transaction', userController.addTransaction);

// Get all transactions for a user (hardcoded id)
router.get('/transactions', userController.getUserTransactions);

// Get user's name and pockets (hardcoded id)
router.get('/pockets', userController.getUserNameAndPockets);

module.exports = router;
