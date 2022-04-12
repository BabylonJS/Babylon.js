const path = require("path");
const fs = require("fs");
const exec = require("child_process").exec;

async function runCommand(command) {
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

const friendlyNames = {
    core: "Core",
    gui: "GUI",
    loaders: "Loaders",
    serializers: "Serializers",
    materials: "Materials",
    postProcess: "Post-Process",
    proceduralTextures: "Procedural Textures",
    inspector: "Inspector",
    nodeEditor: "Node Editor",
    guiEditor: "GUI Editor",
    playground: "Playground",
    viewer: "Viewer",
};

const tagNames = {
    bug: "Bug Fix",
    "new feature": "New Feature",
    "breaking change": "Breaking Change",
};

// make sure the file is already there
if (!fs.existsSync(path.resolve("./.build/changelog.json"))) {
    console.log("Generating changelog.json");
    fs.writeFileSync("./.build/changelog.json", `{"fromTag": "5.0.0"}`);
}

const config = require(path.resolve("./.build/changelog.json"));

const githubPatToken = process.env.GITHUBPAT ? `bjsplat:${process.env.GITHUBPAT}` : "bjsplat:GITHUB_PAT_TOKEN";

const forceUpdateFrom = process.argv[2] || config.fromTag || "5.0.0";

const skipJSONGeneration = false;

async function generateChangelog() {
    const versions = {};
    const changelog = {};
    let newFromTag = config.fromTag;

    if (!skipJSONGeneration) {
        // get the latest tag
        const latestTag = "HEAD"; // || (await runCommand("git describe --abbrev=0 --tags"));
        // get all commits since the last major release
        const prs = await runCommand(`git log "--pretty=%h|%D|%s|%cd" ${forceUpdateFrom}..${latestTag.replace("\n", "")}`);
        // split according to version
        let currentTag = "upcoming";
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
                            const matches = [...pr.pr.title.matchAll(/#(\d*)/g)].filter((match) => match[1] !== pr.prNumber);
                            let title = pr.pr.title;
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
    fs.writeFileSync(path.resolve("./.build/changelog.json"), JSON.stringify({ fromTag: newFromTag || config.fromTag, changelog: finalChangelog }, null, 4));
    fs.writeFileSync(path.resolve("./CHANGELOG.md"), generateMarkdown(finalChangelog));
}

function generateMarkdown(finalChangelog) {
    let markdown = "# Changelog\n";
    // Sort versions
    const versions = Object.keys(finalChangelog).sort().reverse();
    // per package
    const versionChangelog = {};
    versions.forEach((version) => {
        versionChangelog[version] = {};
        // markdown += `## ${version}\n`;
        finalChangelog[version].forEach((pr) => {
            // what package was influenced by that change?
            const packageInfluenced = pr.files
                .map((file) => {
                    const parts = file.split("/");
                    return parts[2];
                })
                .filter((package) => {
                    return friendlyNames[package];
                });
            const packagesSet = new Set(packageInfluenced);
            packagesSet.forEach((package) => {
                versionChangelog[version][package] = versionChangelog[version][package] || [];
                versionChangelog[version][package].push(pr);
            });
        });
    });
    Object.keys(versionChangelog).forEach((version) => {
        markdown += `\n## ${version}\n`;
        const sortedPackages = Object.keys(versionChangelog[version]).sort();
        sortedPackages.forEach((package) => {
            const prettyPackage = friendlyNames[package];
            markdown += `\n### ${prettyPackage}\n\n`;
            versionChangelog[version][package].forEach((pr) => {
                const tag = pr.tags.find((tag) => {
                    return tagNames[tag];
                });
                markdown += `- ${pr.title} - ${tag ? `[_${tagNames[tag]}_] ` : ""}by [${pr.author.name}](${pr.author.url}) ([#${
                    pr.pr
                }](https://github.com/BabylonJS/Babylon.js/pull/${pr.pr}))\n`;
            });
        });
    });
    return markdown;
}

generateChangelog();
