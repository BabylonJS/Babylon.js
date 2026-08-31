/* eslint-disable no-console */
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");

const baseDirectory = path.resolve(".");

// The publish pipeline exports GITHUBPAT (and npm/registry tokens) into this
// process so the changelog can be fetched over HTTPS. Child processes started
// here are git/npm invocations that never need those values, and some of them
// run third-party code, so the secrets are stripped from the environment they
// inherit.
const SECRET_ENV_KEYS = ["GITHUBPAT", "GITHUB_TOKEN", "NPM_TOKEN", "NODE_AUTH_TOKEN", "DEPLOY_TOKEN", "SYSTEM_ACCESSTOKEN"];

function sanitizedEnv() {
    const env = { ...process.env };
    for (const key of SECRET_ENV_KEYS) {
        delete env[key];
    }
    return env;
}

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(command);
        exec(command, { env: sanitizedEnv() }, function (error, stdout, stderr) {
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
