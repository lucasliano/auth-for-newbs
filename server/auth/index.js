const express = require('express');
const Joi = require('joi');   //Format validation middleware (alphanumeric characters, etc.)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db/connection'); //imports the db from ./db/connection.js
                                        //as we are in the auth folder, we want to go up (cd ..) to the server folder and then go into db (cd db).
                                        //thats why we use the ../db/connection

const users = db.get('users');          // Here we are querying the db to get/create a collection

users.createIndex('username', { unique: true });  //Here we are accessing/creating a new unique field 'username' in the collection 'users'

const router = express.Router();    //This creates a mini express app that we are going to add to the main index.js
                                    //ie. any route in here is pre-pended with /auth


const schema = Joi.object().keys({                     // This is the validation we are asking the user to satisfy
  username: Joi.string().regex(/(^[a-zA-Z0-9_]+$)/).min(2).max(30).required(),
  password: Joi.string().trim().min(8).required()     //at least 8 characters in the password
});



function createTokenSendResponse(user, res, next) {
  const payload = {
    _id: user._id,
    username: user.username
  };

  jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: '1d'
  }, (err, token) => {
    if (err) {
      respondErrorEncryption(res, next);
    } else {
      res.json({      // This sends the token to the user as a response to the /signup POST
        token
      });
    }
  });
}

function respondErrorEncryption(res, next) {
  res.status(422);
  const error = new Error('Unable to sign up due to an error during the encryption of the message.');
  next(error);
}

//GET /auth/
router.get('/', (req, res) => {
  res.json({
    message:  '🔐'
  });
});

// POST /auth/signup
router.post('/signup', (req, res, next) => {
  const result = Joi.validate(req.body, schema);    // We validate the req.body (the body is already parsed due to the express.json() in the main index.js)
  if (result.error === null) {
    // When the validation does not raise an error
    users.findOne({  // This queries the db and expects that the answer is only one value.
      username: req.body.username
    }).then(user => { // 'user' is the result of the query, and the content between {} is the function executed within the scope of 'user'
      // if user is undefined, username is not in the db, otherwise, duplicate user detected
      if (user) {
        // there is already a user in the db with this username...
        // respond with an error!auth
        const error = new Error('That username is not available. Please choose another one.');
        res.status(409);
        next(error);
      } else {
        // hash the password
        bcrypt.hash(req.body.password.trim(), 12).then(hashedPassword => {
          // insert the user with the hashed password
          const newUser = {
            username: req.body.username,
            password: hashedPassword
          };

          users.insert(newUser).then(insertedUser => {        //Inserts the newUser element into the db and executes createTokenSendResponse.
            createTokenSendResponse(insertedUser, res, next);
          });
        });
      }
    });
  } else {
    // When the validation does raise an error
    res.status(422);
    next(result.error);   //We pass the error to the Next function 'errorHandler'
  }
});

function respondError422(res, next) {
  res.status(422);
  const error = new Error('Unable to login.');
  next(error);
}

router.post('/login', (req, res, next) => {
  const result = Joi.validate(req.body, schema);
  if (result.error === null) {
    users.findOne({    // This queries the db and expects that the answer is only one value.
      username: req.body.username,
    }).then(user => { // 'user' is the result of the query, and the content between {} is the function executed within the scope of 'user'
      if (user) {  // (user != 0)

        bcrypt
          .compare(req.body.password, user.password)
          .then((result) => {
            if (result) {
              createTokenSendResponse(user, res, next);
            } else {
              respondError422(res, next); // w
            }
          });
      } else {
        // username does not exist in the db
        respondError422(res, next);
      }
    });
  } else {
    respondError422(res, next);
  }
});

module.exports = router;
