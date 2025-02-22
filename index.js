const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'inventory_secret',
    resave: false,
    saveUninitialized: true
}));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const transactionRoutes01 = require('./routes/transactionRoutes01');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const editRoutes = require('./routes/editRoutes');
const alertRoutes = require('./routes/alertRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reportRoutes = require('./routes/reportRoutes');
// Use routes
app.use('/', userRoutes);
app.use('/', dashboardRoutes); 
app.use('/', transactionRoutes);
app.use('/', transactionRoutes01);
app.use('/', editRoutes);
app.use('/', adjustmentRoutes);
app.use('/', alertRoutes);
app.use('/', profileRoutes);
app.use('/', reportRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
 