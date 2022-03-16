const exec = require("child_process").exec;

const branchName = process.argv[2];

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(command);
        exec(command, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            return resolve(stderr || stdout);
        });
    });
}

async function runTagsUpdate() {
    const unfiltered = await runCommand("git show-ref --tags");
    const localTags = unfiltered.split("\n").map((line) => line.split("refs/tags/")[1]);
    const fromRemote = await runCommand("git ls-remote --tags origin");
    const remoteTags = fromRemote
        .split("\n")
        .map((line) => line.split("refs/tags/")[1])
        .map((tag) => tag && tag.replace("^{}", ""));
    const tagsToUpdate = localTags.filter((tag) => !remoteTags.includes(tag));
    await runCommand("git reset --soft HEAD~1");
    await runCommand("git add .");
    await runCommand('git commit -m "Version update"');
    for (const tag of tagsToUpdate) {
        console.log(`Updating tag ${tag}`);
        await runCommand(`git tag -f ${tag}`);
    }

    await runCommand(`git fetch origin`);
    await runCommand(`git pull`);
    await runCommand(`git push origin ${branchName} --tags`);
}

runTagsUpdate();
