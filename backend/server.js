require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initBlockchain } = require('./utils/blockchain');

const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const voteRoutes = require('./routes/vote');
const blockchainRoutes = require('./routes/blockchain');
const chatbotRoutes = require('./routes/chatbot');
const electionRoutes = require('./routes/election');
const verifierRoutes = require('./routes/verifiers');
const publicRoutes = require('./routes/public');

const app = express();

connectDB().then(async () => {
  await initBlockchain();

  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('🌱 No admin user found in database. Running auto-seed...');
      const { seed } = require('./seed/seedData');
      await seed(true);
    }
  } catch (seedErr) {
    console.error('❌ Database auto-seed check failed:', seedErr);
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'SecureVote API running' }));

app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/verifiers', verifierRoutes);
app.use('/api/public', publicRoutes);

const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SecureVote API listening on port ${PORT}`));
