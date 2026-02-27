/* eslint-disable no-console */
const { runCommand, getCurrentVersion } = require("./versionUtils");

const branchName = process.argv[2];
const dryRun = process.argv[3];

async function main() {
    // Gets the current version to update
    const version = getCurrentVersion();

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
    main();
}
