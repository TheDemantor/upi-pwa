const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require( "./routes/userRoute");

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://192.168.1.12:3000', // Change if your frontend runs on a different port
    credentials: true
}));

// Mongoose setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upi-pwa';
mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
	.then(() => console.log('MongoDB connected'))
	.catch((err) => console.error('MongoDB connection error:', err));

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
