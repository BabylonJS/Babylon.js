// Dependecies.
const shelljs = require('shelljs');
const colorConsole = require("../../NodeHelpers/colorConsole");

/**
 * Publish a package to npm.
 */
function publish(version, packageName, publishPath, public) {
    colorConsole.log('    Publishing ' + packageName.blue.bold + " from " + publishPath.cyan);

    let tag = "";
    // check for alpha or beta
    if (version.indexOf('alpha') !== -1 || version.indexOf('beta') !== -1 || version.indexOf('rc') !== -1) {
        tag = ' --tag preview';
    }

    //publish the respected package
    var cmd = 'npm publish "' + publishPath + '"' + tag;
    if (public) {
        cmd += " --access public";
    }

    if (process.env.BABYLONJSREALPUBLISH === "true") {
        colorConsole.log("    Executing: " + cmd.yellow);
        shelljs.exec(cmd);
    }
    else {
        colorConsole.log("    If publishing enabled: " + cmd.yellow);
    }

    colorConsole.success('    Publishing ' + "OK".green);
}

module.exports = publish;