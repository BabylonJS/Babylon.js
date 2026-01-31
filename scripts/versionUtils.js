/* eslint-disable no-console */
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");

const baseDirectory = path.resolve(".");

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(command);
        exec(command, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            console.log(stderr || stdout);
            return resolve(stderr || stdout);
        });
    });
}

function getCurrentVersion() {
    // get @dev/core package.json
    const rawdata = fs.readFileSync(path.join(baseDirectory, "packages", "public", "umd", "babylonjs", "package.json"), "utf-8");
    const packageJson = JSON.parse(rawdata);
    const version = packageJson.version;
    return version;
}

module.exports = {
    runCommand,
    getCurrentVersion,
};
