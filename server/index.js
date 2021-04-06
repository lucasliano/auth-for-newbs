const express = require('express');
const volleyball = require('volleyball');   // Used to log every HTTPS request
const cors = require('cors');

require('dotenv').config();

const app = express();

const middlewares = require('./auth/middlewares');
// const auth = require('./auth/index.js');
// const auth = require('./auth/index');
const auth = require('./auth'); //This requires the router that we've created in the ./auth/index.js file
const notes = require('./api/notes');

app.use(volleyball);
app.use(cors({
  origin: 'http://localhost:8080'
}));
app.use(express.json());    // This is a json parser included in express > v4.16
app.use(middlewares.checkTokenSetUser);


// GET localhost:5000/
app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨Hello World! 🌈✨🦄',
    user: req.user,
  });
});

app.use('/auth', auth); // This redirects every GET request that starts with /auth and send it to the router in ./auth/index.js
app.use('/api/v1/notes', middlewares.isLoggedIn, notes);



function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);  // Next is used to modify the request and let the following middleware execute. In this case notFound lets errorHandler work after the program hits notFound.
}

function errorHandler(err, req, res, next) {  // Por algun motivo hace falta usar next acá también.
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on port', port);
});
