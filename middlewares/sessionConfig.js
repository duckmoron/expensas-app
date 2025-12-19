const session = require('express-session');

module.exports = session({
  secret: 'expensas-secret', // Idealmente usar process.env.SESSION_SECRET
  resave: false,
  saveUninitialized: true
});