/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const exec = require("child_process").exec;

function runCommand(command) {
    return new Promise((resolve, reject) => {
        // console.log(command);
        exec(command, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            // console.log(stderr || stdout);
            return resolve(stderr || stdout);
        });
    });
}

// Maps package directory names (under packages/dev/ or packages/tools/) to changelog
// section headers. Multiple directories can map to the same friendly name and will be
// grouped into a single section. Directories not listed here are excluded from the changelog.
const friendlyNames = {
    // packages/dev (published to npm)
    core: "Core",
    gui: "GUI",
    loaders: "Loaders",
    serializers: "Serializers",
    materials: "Materials",
    postProcesses: "Post Processes",
    proceduralTextures: "Procedural Textures",
    "inspector-v2": "Inspector",
    addons: "Addons",
    smartFilters: "Smart Filters",
    smartFilterBlocks: "Smart Filters",
    lottiePlayer: "Lottie Player",
    // packages/tools (published to npm or deployed as public web apps)
    nodeEditor: "Node Editor",
    nodeGeometryEditor: "Node Geometry Editor",
    nodeParticleEditor: "Node Particle Editor",
    nodeRenderGraphEditor: "Node Render Graph Editor",
    guiEditor: "GUI",
    playground: "Playground",
    sandbox: "Sandbox",
    viewer: "Viewer",
    "viewer-configurator": "Viewer",
    smartFiltersEditor: "Smart Filters",
    smartFiltersEditorControl: "Smart Filters",
};

const tagNames = {
    bug: "Bug Fix",
    "new feature": "New Feature",
    "breaking change": "Breaking Change",
};
const skipChangelogTag = "skip changelog";

// make sure the file is already there
if (!fs.existsSync(path.resolve(__dirname, "..", "./.build/changelog.json"))) {
    console.log("Generating changelog.json");
    fs.writeFileSync(path.resolve(__dirname, "..", "./.build/changelog.json"), `{"fromTag": "5.0.0"}`);
}

const config = require(path.resolve(__dirname, "..", "./.build/changelog.json"));

const githubPatToken = process.env.GITHUBPAT ? `bjsplat:${process.env.GITHUBPAT}` : ""; // bjsplat:GITHUB_PAT_TOKEN

const forceUpdateFrom = config.fromTag || "5.0.0";

const skipJSONGeneration = false;

/**
 * Generate / update the change log file, based on the repository's git pull requests
 * @param {string} nextVersion the next version to update to
 * @returns void, after updating the changelog.json file
 */
async function generateChangelog(nextVersion) {
    if (!githubPatToken) {
        console.log("No github PAT token found, skipping changelog generation");
        return;
    }
    const versions = {};
    const changelog = {};
    console.log(config, nextVersion);
    let newFromTag = config.fromTag;

    if (!skipJSONGeneration) {
        const latestTag = ""; // || (await runCommand("git describe --abbrev=0 --tags"));
        console.log("Generating changelog.json");
        console.log(`git log "--pretty=%h|%D|%s|%cd" ${forceUpdateFrom}..${latestTag.replace("\n", "")}`);
        // get the latest tag
        // get all commits since the last major release
        const prs = await runCommand(`git log "--pretty=%h|%D|%s|%cd" ${forceUpdateFrom}..${latestTag.replace("\n", "")}`);
        console.log(prs);
        nextVersion = nextVersion || "upcoming";
        // split according to version
        let currentTag = nextVersion;
        prs.split("\n").forEach((pr) => {
            const [hash, tagLabel] = pr.split("|");
            if (!hash) {
                return;
            }
            if (tagLabel && tagLabel.indexOf("tag: ") !== -1) {
                console.log(tagLabel, tagLabel.indexOf("tag: "), tagLabel.substring(tagLabel.indexOf("tag: ") + 5));
                currentTag = tagLabel.substring(tagLabel.indexOf("tag: ") + 5).split(",")[0];
                if (!newFromTag || newFromTag === config.fromTag) {
                    newFromTag = currentTag;
                }
            }
            versions[currentTag] = versions[currentTag] || [];
            // only PRs get in here!
            const matches = [...pr.matchAll(/#(\d*)/g)];
            if (matches.length) {
                matches.forEach((match) => {
                    versions[currentTag].push(match[1]);
                });
            }
        });
        console.log(versions);
        await Promise.all(
            Object.keys(versions).map(async (version) => {
                // get the github json for each PR
                const prsJson = await Promise.all(
                    versions[version].map(async (prNumber) => {
                        const prJson = await runCommand(`curl -u ${githubPatToken} -s https://api.github.com/repos/BabylonJS/Babylon.js/pulls/${prNumber}`);
                        const pr = JSON.parse(prJson);
                        if (!pr.user || pr.message === "Not Found") {
                            return null;
                        }
                        const prFilesJson = await runCommand(`curl -u ${githubPatToken} -s https://api.github.com/repos/BabylonJS/Babylon.js/pulls/${prNumber}/files?per_page=100`);
                        return { prNumber, pr: JSON.parse(prJson), files: JSON.parse(prFilesJson) };
                    })
                );
                console.log("version", version);
                changelog[version] = await Promise.all(
                    prsJson
                        .filter((pr) => pr)
                        .map(async (pr) => {
                            const files = pr.files.map((file) => {
                                return file.filename;
                            });
                            const tags = pr.pr.labels.map((label) => {
                                return label.name;
                            });
                            console.log("File changes for PR #" + pr.prNumber);
                            console.log(`Title: ${pr.pr.title}, by ${pr.pr.user.login} (${pr.pr.user.html_url})`);

                            // check if the title has an issue
                            const matches = [...pr.pr.title.matchAll(/#(\d{3,6})/g)].filter((match) => match[1] !== pr.prNumber);
                            let title = pr.pr.title || "Issue title not found";
                            if (matches.length) {
                                // get the title of the issue
                                const issueTitle = await runCommand(`curl -u ${githubPatToken} -s https://api.github.com/repos/BabylonJS/Babylon.js/issues/${matches[0][1]}`);
                                title = JSON.parse(issueTitle).title;
                            }

                            // filter everything inside squared brackets
                            title = title.replace(/\[[^\]]*\]/g, "").trim();

                            // TODO - check the event log to find a connected issue.
                            // Probably can be done using body parsing?

                            return {
                                pr: pr.prNumber,
                                title: title,
                                description: pr.pr.body,
                                author: {
                                    name: pr.pr.user.login,
                                    url: pr.pr.user.html_url,
                                },
                                files,
                                tags,
                            };
                        })
                );
            })
        );

        if (config.changelog) {
            delete config.changelog.upcoming;
        }
    }
    const finalChangelog = { ...changelog, ...config.changelog };
    // write the changelog
    fs.writeFileSync(path.resolve(__dirname, "..", "./.build/changelog.json"), JSON.stringify({ fromTag: newFromTag || config.fromTag, changelog: finalChangelog }, null, 4));
    const { fullMarkdown, latestVersionMarkdown } = generateMarkdown(finalChangelog);
    fs.writeFileSync(path.resolve(__dirname, "..", "./CHANGELOG.md"), fullMarkdown);
    return latestVersionMarkdown;
}

function generateVersionMarkdown(versionPackages) {
    let markdown = "";
    const sortedPackages = Object.keys(versionPackages).sort();
    sortedPackages.forEach((prettyPackage) => {
        const visiblePRs = versionPackages[prettyPackage].filter((pr) => {
            const tags = pr.tags ?? [];
            return tags.indexOf(skipChangelogTag) === -1;
        });
        if (visiblePRs.length === 0) {
            return;
        }
        markdown += `\n### ${prettyPackage}\n\n`;
        visiblePRs.forEach((pr) => {
            const tags = pr.tags ?? [];
            const tag = tags.find((tag) => {
                return tagNames[tag];
            });
            markdown += `- ${pr.title} - ${tag ? `[_${tagNames[tag]}_] ` : ""}by [${pr.author.name}](${pr.author.url}) ([#${
                pr.pr
            }](https://github.com/BabylonJS/Babylon.js/pull/${pr.pr}))\n`;
        });
    });
    return markdown;
}

function generateMarkdown(finalChangelog) {
    let fullMarkdown = "# Changelog\n";
    // Sort versions
    const versions = Object.keys(finalChangelog)
        .sort((a, b) => {
            const sepA = a.split(".");
            const sepB = b.split(".");
            for (let i = 0; i < sepA.length; i++) {
                if (sepA[i] !== sepB[i]) {
                    return sepA[i] - sepB[i];
                }
            }
        })
        .reverse();
    // per package
    const versionChangelog = {};
    versions.forEach((version) => {
        versionChangelog[version] = {};
        finalChangelog[version].forEach((pr) => {
            // Categorize the PR by which packages its changed files belong to.
            // File paths from the GitHub API look like "packages/{dev|tools}/<package>/...",
            // so parts[2] extracts the package directory name (e.g. "core", "viewer").
            // Map to friendly names so that multiple directories sharing the same
            // friendly name (e.g. smartFilters + smartFilterBlocks → "Smart Filters")
            // are grouped into a single changelog section.
            const packageInfluenced = pr.files
                .map((file) => {
                    const parts = file.split("/");
                    return friendlyNames[parts[2]];
                })
                .filter(Boolean);
            const packagesSet = new Set(packageInfluenced);
            packagesSet.forEach((pck) => {
                versionChangelog[version][pck] = versionChangelog[version][pck] || [];
                versionChangelog[version][pck].push(pr);
            });
        });
    });
    let latestVersionMarkdown = "";
    versions.forEach((version, index) => {
        const sectionMarkdown = generateVersionMarkdown(versionChangelog[version]);
        fullMarkdown += `\n## ${version}\n` + sectionMarkdown;
        if (index === 0) {
            latestVersionMarkdown = sectionMarkdown;
        }
    });
    return { fullMarkdown, latestVersionMarkdown };
}

module.exports = generateChangelog;

// generateChangelog();
