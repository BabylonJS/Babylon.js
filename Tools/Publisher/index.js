// Dependecies.
const publisher = require('./publisher');

// CMD Arguments Management.
const doNotBuild = process.argv.indexOf('--no-build') === -1;
const doNotPublish = process.argv.indexOf('--no-publish') === -1;

/**
 * Main function driving the publication.
 */
function main() {
    // Gets the current npm user.
    console.log("Using npm user:");
    let loginCheck = shelljs.exec('npm whoami');
    // If logged in process.
    if (loginCheck.code === 0) {
        publisher.process(doNotBuild, doNotPublish, true);
    }
    // If not logged in error.
    else {
        console.log('Not logged in, please log in to npm.');
    }
}();