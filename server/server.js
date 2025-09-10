require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require('./routes/userRoute');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// apply before routes
app.use(cors());        // allow all origins and preflight



// Mongoose setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upi-pwa';
mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

console.log("PORT", process.env.PORT, MONGO_URI);

// Basic router
const router = express.Router();

router.get('/', (req, res) => {
	res.json({ message: 'API is working!' });
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
	res.json({ 
		message: 'CORS is working!', 
		origin: req.headers.origin,
		timestamp: new Date().toISOString()
	});
});

// Mount routers
app.use('/api', router);
app.use('/api/user', userRouter);

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});