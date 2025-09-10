require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require( "./routes/userRoute");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
// CORS configuration with debugging
const corsOptions = {
	origin: function (origin, callback) {
		const allowedOrigins = [
			'http://localhost:3000',
			'https://localhost:3000',
			'http://127.0.0.1:3000',
			'https://127.0.0.1:3000',
			'http://192.168.0.103:3000',
			'https://192.168.0.103:3000',
			'http://192.168.1.8:3000',
			'https://192.168.1.8:3000',
			'https://upi-pwa.vercel.app',
			'https://upi-pwa.onrender.com',
			'http://192.168.1.15:3000',
			'https://192.168.1.15:3000'
		];
		
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		
		console.log('CORS Request from origin:', origin);
		
		if (allowedOrigins.indexOf(origin) !== -1) {
			console.log('CORS: Origin allowed');
			callback(null, true);
		} else {
			console.log('CORS Error: Origin not allowed:', origin);
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Mongoose setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upi-pwa';
mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

console.log( "PORT", process.env.PORT, MONGO_URI);
// Example router
const router = express.Router();

router.get('/', (req, res) => {
	res.json({ message: 'API is working!' });
});

// Mount router
app.use('/api', router);
app.use('/api/user/', userRouter);

// Start server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
