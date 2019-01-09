// Dependecies.
const shelljs = require('shelljs');
const publisher = require('./tasks/main');

// Gets the current npm user.
console.log("Using npm user:");
let loginCheck = shelljs.exec('npm whoami');
// If logged in process.
if (loginCheck.code === 0) {
    publisher(true);
}
// If not logged in error.
else {
    console.log('Not logged in, please log in to npm.');
}