/* eslint-disable no-console */
// Fetch the release notes for the upcoming version.
//
// This script exists so the GitHub token never has to be present in the job that
// installs and runs the repository's dependencies. It is executed by the
// FetchReleaseNotes job in .azure-pipelines/cd-publish.yml, which checks the
// repository out but never runs `npm ci`, so nothing outside this repository
// executes while the token is in the environment.
//
// It requires only Node built-ins (through ./versionUtils and ./generateChangelog),
// which is what makes running it without node_modules possible.
//
// Output: .build/changelog.json and .build/release-notes.md, published as a
// pipeline artifact and consumed by the credential-free build job.
const path = require("path");
const fs = require("fs");
const generateChangelog = require("./generateChangelog");
const { getNextVersion } = require("./versionUtils");

async function main() {
    if (!process.env.GITHUBPAT) {
        throw new Error("GITHUBPAT is required to fetch release notes");
    }

    const version = getNextVersion();
    console.log(`Fetching release notes for ${version}`);

    const latestVersionMarkdown = await generateChangelog(version);

    const releaseNotesPath = path.resolve(__dirname, "../.build/release-notes.md");
    if (latestVersionMarkdown) {
        fs.writeFileSync(releaseNotesPath, latestVersionMarkdown);
        console.log(`Release notes written to ${releaseNotesPath}`);
    } else {
        throw new Error("No release notes were generated");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
