const monk = require('monk');   //mongoDB connection
const db = monk('localhost/auth-for-noobs');  // localhost is needed to let mongoDB know that the db is running on this machine.

module.exports = db;
