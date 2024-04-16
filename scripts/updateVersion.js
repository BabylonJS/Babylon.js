const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const glob = require("glob");
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
    const abstractEngineFile = path.join(baseDirectory, "packages", "dev", "core", "src", "Engines", "abstractEngine.ts");
    const abstractEngineData = fs.readFileSync(abstractEngineFile, "utf-8");
    const array = /"babylonjs@(.*)"/.exec(abstractEngineData);
    if (!array) {
        throw new Error("Could not find babylonjs version in abstractEngine.ts");
    }

    const regexp = new RegExp(array[1] + '"', "g");
    const newAbstractEngineData = abstractEngineData.replace(regexp, version + '"');
    fs.writeFileSync(abstractEngineFile, newAbstractEngineData);
};

const updateSinceTag = (version) => {
    // get all typescript files in the dev folder
    const files = glob.sync(path.join(baseDirectory, "packages", "dev", "**", "*.ts"));
    files.forEach((file) => {
        try {
            // check if file contains @since\n
            const data = fs.readFileSync(file, "utf-8").replace(/\r/gm, "");
            if (data.indexOf("* @since\n") !== -1) {
                console.log(`Updating @since tag in ${file} to ${version}`);
                // replace @since with @since version
                const newData = data.replace(
                    /\* @since\n/gm,
                    `* @since ${version}
`
                );

                // write file
                fs.writeFileSync(file, newData);
            }
        } catch (e) {
            console.log(e);
        }
    });
    // run formatter to make sure the package.json files are formatted
    runCommand("npx prettier --write packages/public/**/package.json");
};

const updatePeerDependencies = async (version) => {
    // get all package.json files in the dev folder
    const files = glob.sync(path.join(baseDirectory, "packages", "public", "**", "package.json"));
    files.forEach((file) => {
        try {
            // check if file contains @since\n
            const data = fs.readFileSync(file, "utf-8").replace(/\r/gm, "");
            const packageJson = JSON.parse(data);
            // check each peer dependency, if it is babylon, update it with the new version
            let changed = false;
            if (packageJson.peerDependencies) {
                Object.keys(packageJson.peerDependencies).forEach((dependency) => {
                    if (dependency.startsWith("babylonjs") || dependency.startsWith("@babylonjs")) {
                        packageJson.peerDependencies[dependency] = version;
                        changed = true;
                    }
                });
            }
            if (changed) {
                console.log(`Updating Babylon peerDependencies in ${file} to ${version}`);
                // write file
                fs.writeFileSync(file, JSON.stringify(packageJson, null, 4));
            }
        } catch (e) {
            console.log(e);
        }
    });
};

async function runTagsUpdate() {
    await runCommand(
        `npx lerna version ${config.versionDefinition} --yes --no-push --conventional-prerelease --force-publish --no-private --no-git-tag-version ${
            config.preid ? "--preid " + config.preid : ""
        }`
    );
    // update package-json
    const version = getNewVersion();
    // // update engine version
    await updateEngineVersion(version);
    // generate changelog
    await generateChangelog(version);
    // update since tags
    updateSinceTag(version);
    // if major, update peer dependencies
    if (config.versionDefinition === "major") {
        await updatePeerDependencies(`^${version}`);
    }
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
