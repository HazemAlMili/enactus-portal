import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import hourRoutes from './routes/hourRoutes';
import userRoutes from './routes/userRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/hours', hourRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Enactus Portal API Running');
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

// Export app for Vercel
export default app;

// Only listen if not running on Vercel (or similar serverless platform)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
