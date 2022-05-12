const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const generateChangelog = require("./generateChangelog");

const branchName = process.argv[2];
const dryRun = process.argv[3];

const config = require(path.resolve("./.build/config.json"));

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

const getNewVersion = () => {
    // get @dev/core package.json
    const rawdata = fs.readFileSync(path.join(baseDirectory, "packages", "public", "umd", "babylonjs", "package.json"), "utf-8");
    const packageJson = JSON.parse(rawdata);
    const version = packageJson.version;
    return version;
};

const updateEngineVersion = async (version) => {
    // get thinEngine.ts
    const thinEngineFile = path.join(baseDirectory, "packages", "dev", "core", "src", "Engines", "thinEngine.ts");
    const thinEngineData = fs.readFileSync(thinEngineFile, "utf-8");
    const array = /"babylonjs@(.*)"/.exec(thinEngineData);
    if (!array) {
        throw new Error("Could not find babylonjs version in thinEngine.ts");
    }

    const regexp = new RegExp(array[1] + "\"", "g");
    const newThinEngineData = thinEngineData.replace(regexp, version + "\"");
    fs.writeFileSync(thinEngineFile, newThinEngineData);
};

async function runTagsUpdate() {
    await runCommand(
        `npx lerna version ${config.versionDefinition} --yes --no-push --conventional-prerelease --force-publish --no-private --no-git-tag-version ${
            config.preid ? "--preid " + config.preid : ""
        }`
    );
    // update package-json
    fs.rmSync("package-lock.json");
    await runCommand("npm install");
    const version = getNewVersion();
    await updateEngineVersion(version);
    await generateChangelog(version);
    if (dryRun) {
        console.log("skipping", `git commit -m "Version update ${version}"`);
        console.log("skipping", `git tag -a ${version} -m ${version}`);
    } else {
        await runCommand("git add .");
        await runCommand(`git commit -m "Version update ${version}"`);
        await runCommand(`git tag -a ${version} -m ${version}`);
    }
}
if (!branchName) {
    console.log("Please provide a branch name");
    process.exit(1);
} else {
    runTagsUpdate();
}
