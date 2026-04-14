/* eslint-disable no-console */
const { runCommand, getCurrentVersion } = require("./versionUtils");

const branchName = process.argv[2];
const dryRun = process.argv[3];
const skipTag = process.argv.includes("--skip-tag");

async function main() {
    // Gets the current version to update
    const version = getCurrentVersion();

    if (dryRun) {
        console.log("skipping", `git commit -m "Version update ${version}"`);
        if (!skipTag) {
            console.log("skipping", `git tag -a ${version} -m ${version}`);
        }
    } else {
        await runCommand("git add .");
        await runCommand(`git commit -m "Version update ${version}"`);
        if (!skipTag) {
            await runCommand(`git tag -a ${version} -m ${version}`);
        }
    }
}
if (!branchName) {
    console.log("Please provide a branch name");
    process.exit(1);
} else {
    main();
}

/*
  What happened

  PRs merged to master during the ~40min build caused git merge origin/master to create a merge commit after the
  tag. The tag ended up on a parent commit, not master HEAD, so the GitHub Release task couldn't find it.

  Changes needed

   1. scripts/tagVersion.js (done ✅) — Added --skip-tag flag to decouple commit from tag creation.
   2. Pipeline changes (in Azure DevOps classic editor):
    - "Tag the version" step: Change script to node ./scripts/tagVersion.js $(Build.SourceBranchName) --skip-tag
    - Add new Bash step after "pull master", before "push to git": VERSION=$(jq -r '.version' 
  ./packages/public/umd/babylonjs/package.json)
     git tag -a "$VERSION" -m "$VERSION"
*/
