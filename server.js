const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const trendsRouter = require('./routes/trends');
const summarizeRouter = require('./routes/summary');
const flashRouter = require('./routes/flash');
const peerRouter = require('./routes/peer');
const newsRoutes = require('./routes/tubesrcipt');
const privotRoutes = require('./routes/privot');
const morgan = require('morgan');
const punycode = require('punycode/');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Routes
app.use('/trends', trendsRouter);
app.use('/summary', summarizeRouter);
app.use('/', flashRouter);
app.use('/peer', peerRouter);
app.use('/api', newsRoutes);
app.use('/privot', privotRoutes);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
