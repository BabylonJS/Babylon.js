/* eslint-disable no-console */
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

const getCurrentVersion = () => {
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
    const files = glob.globSync(path.join(baseDirectory, "packages", "dev", "**", "*.ts").replace(/\\/g, "/"));
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

// Update the babylon dependencies array (dep, dev, peer...) in place to the new version
const updateDependencies = (version, dependencies) => {
    let changed = false;
    if (dependencies) {
        Object.keys(dependencies).forEach((dependency) => {
            if (dependency.startsWith("babylonjs") || dependency.startsWith("@babylonjs")) {
                dependencies[dependency] = version;
                changed = true;
            }
        });
    }
    return changed;
};

const updatePeerDependencies = (version) => {
    // get all package.json files in the dev folder
    const files = glob.globSync(path.join(baseDirectory, "packages", "public", "**", "package.json").replace(/\\/g, "/"));
    files.forEach((file) => {
        try {
            // check if file contains @since\n
            const data = fs.readFileSync(file, "utf-8").replace(/\r/gm, "");
            const packageJson = JSON.parse(data);
            // check each peer dependency, if it is babylon, update it with the new version
            const changed = updateDependencies(version, packageJson.peerDependencies);
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

const updateVersion = (version) => {
    // get all package.json files in the dev folder
    const files = glob.globSync(path.join(baseDirectory, "packages", "public", "**", "package.json").replace(/\\/g, "/"));
    files.forEach((file) => {
        try {
            // get the package.json as js objects
            const data = fs.readFileSync(file, "utf-8").replace(/\r/gm, "");
            const packageJson = JSON.parse(data);

            const name = packageJson.name;
            if (!packageJson.private && (name.startsWith("babylonjs") || name.startsWith("@babylonjs"))) {
                // if not private bump the revision.
                packageJson.version = version;
            }

            // And lets update the devDependencies/dependencies
            updateDependencies(version, packageJson.devDependencies);
            updateDependencies(version, packageJson.dependencies);

            console.log(`Updating Babylon package json version in ${file} to ${version}`);

            // write file
            fs.writeFileSync(file, JSON.stringify(packageJson, null, 4));
        } catch (e) {
            console.log(e);
        }
    });
};

async function runTagsUpdate() {
    // Gets the current version to update
    const previousVersion = getCurrentVersion();
    let [major, minor, revision] = previousVersion.split(".");

    // Update accordingly
    if (config.versionDefinition === "major") {
        major++;
        minor = 0;
        revision = 0;
    } else if (config.versionDefinition === "minor") {
        minor++;
        revision = 0;
    } else {
        revision++;
    }

    // Gets the new version
    const version = [major, minor, revision].join(".");

    // update package-json
    updateVersion(version);
    // update engine version
    await updateEngineVersion(version);
    // generate changelog
    await generateChangelog(version);
    // update since tags
    updateSinceTag(version);
    // if major, update peer dependencies
    if (config.versionDefinition === "major") {
        updatePeerDependencies(`^${version}`);
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
