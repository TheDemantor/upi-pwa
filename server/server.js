require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require('./routes/userRoute');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://127.0.0.1:3000",
      "https://127.0.0.1:3000",
      "http://192.168.0.103:3000",
      "https://192.168.0.103:3000",
      "http://192.168.1.8:3000",
      "https://192.168.1.8:3000",
      "http://192.168.1.15:3000",
      "https://192.168.1.15:3000",
      "https://upi-pwa.vercel.app",
      "https://upi-pwa.vercel.app/"
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
};

// apply before routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // allow preflight requests


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