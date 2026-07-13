require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Import routes
const trendsRouter = require("./routes/trends");
const summarizeRouter = require("./routes/summary");
const fullStory = require("./routes/fullstory");
const analystRoute = require("./routes/analyst");
const seoRouter = require("./routes/seo");
const flashRouter = require("./routes/flash");
const peerRouter = require("./routes/peer");
const newsRoutes = require("./routes/tubesrcipt");
const privotRoutes = require("./routes/privot");
const employeeRegister = require("./routes/register");
const employeeLogin = require("./routes/login");
const employeeLogOut = require("./routes/logout");
const opinionRouter = require('./routes/opinion');
const editorialRouter = require('./routes/editorial');
const resetPassword = require('./routes/reset_password');
const translateRouter = require('./routes/translate');
const tubeTwoRoutes = require('./routes/tubetwo');

// Admin Panel Routes (Modified for Supabase)
const userDetail = require("./routes/userDetail");
const userId = require('./routes/userId');
const userDelete = require('./routes/userDelete');
const userAdd = require('./routes/userAdd');
const protectedRoutes = require('./routes/protectedRoute');

// Import Supabase client (instead of mongoose)
const { supabase } = require("./models/supabaseClient");

const app = express();
const PORT = process.env.PORT || 5005;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============ REMOVE MongoDB Connection ============
// ❌ REMOVE THIS BLOCK - No longer needed
// mongoose.connect('mongodb://127.0.0.1:27017/employee', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((err) => {
//   console.error('MongoDB connection error:', err);
// });

// ============ DATABASE CONNECTION CHECK ============
// Verify Supabase connection
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connected to Supabase successfully');
    console.log(`📊 Database: ${process.env.SUPABASE_URL}`);
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
}

// ============ ROUTES ============
// Authentication Routes (Modified for Supabase)
app.use("/register", employeeRegister);
app.use("/logout", employeeLogOut);
app.use("/", employeeLogin);
app.use('/reset-password', resetPassword);

// Content Routes (No changes needed - these are API routes)
app.use("/trends", trendsRouter);
app.use("/summary", summarizeRouter);
app.use("/fullstory", fullStory);
app.use("/analyst", analystRoute);
app.use("/seo", seoRouter);
app.use("/flash", flashRouter);
app.use("/peer", peerRouter);
app.use("/api", newsRoutes);
app.use("/privot", privotRoutes);
app.use('/opinion', opinionRouter);
app.use('/editorial', editorialRouter);
app.use('/tubetwo', tubeTwoRoutes);
app.use('/translate', translateRouter);

// Admin Panel Routes (Modified for Supabase)
app.use("/userDetails", userDetail);
app.use("/userDetails", userId);
app.use('/userDetails', userDelete);
app.use('/userDetails', userAdd);
app.use('/protectRoutes', protectedRoutes);

// ============ HEALTH CHECK ============
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    res.status(200).json({
      status: 'OK',
      database: 'Supabase',
      connected: !error,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Supabase',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============ ERROR HANDLING ============
// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  
  // Handle Supabase specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found',
      error: err.detail
    });
  }
  
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key violation',
      error: err.detail
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============ START SERVER ============
async function startServer() {
  try {
    // Check Supabase connection first
    await checkSupabaseConnection();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Using Supabase as database`);
      console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;