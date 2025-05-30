require('dotenv').config();

const express = require('express');
const app = express();
const sequelize = require('./config/db');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const authTestRoutes = require('./routes/auth_test');
const associationRoutes = require('./routes/associations');
const userRoutes = require('./routes/userData');
const paymentRoutes = require('./routes/payments');

// Import models to ensure associations are set up
require('./models');

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth-test', authTestRoutes);
app.use('/api/associations', associationRoutes);
app.use('/api/userData', userRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database synced successfully with force: true (all tables dropped and recreated)');
}).catch((err) => {
  console.error('❌ Error syncing database:', err);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});