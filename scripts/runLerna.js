const exec = require("child_process").exec;
const path = require("path");

const config = require(path.resolve("./.build/config.json"));

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(command);
        exec(command, { shell: true }, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            console.log(stderr || stdout);
            return resolve(stderr || stdout);
        });
    });
}

const run = async () => {
    // next version
    await runCommand(
        `npx lerna version ${config.versionDefinition} --yes --no-push --conventional-prerelease --force-publish --force-git-tag --no-private ${
            config.preid ? "--preid " + config.preid : ""
        }`
    );
};

run();
