// Dependecies.
const publisher = require('./publisher');

// CMD Arguments Management.
const doNotBuild = true;
const doNotPublish = true;

/**
 * Main function driving the publication.
 */
function main() {
    publisher.process(doNotBuild, doNotPublish, false);
}();