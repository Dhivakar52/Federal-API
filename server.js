const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const trendsRouter = require('./routes/trends');
const summarizeRouter = require('./routes/summary');
const flashRouter = require('./routes/flash');
const peerRouter = require('./routes/peer');
const morgan = require('morgan');
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
