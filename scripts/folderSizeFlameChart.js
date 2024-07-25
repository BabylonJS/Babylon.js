"use strict";

/* eslint-disable no-console */

// This script generates an interactive flame chart for file/folder sizes.
// node folderSizeFlameChart.js [pattern=**/*] [outputFile=FoldersSizes]
// Example: node folderSizeFlameChart.js **/*.ts,!**/*.d.ts,!**/test/**

const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const glob = require("glob");
const chalk = require("chalk");

let [scriptPath, folder = ".", pattern = "**", outputFile = "FoldersSizes"] = process.argv.slice(1);

console.log(chalk.bold(`${path.basename(scriptPath)} ${folder} ${pattern} ${outputFile}`));

// Resolve to an absolute path
folder = path.resolve(folder);

// This is the temp path where the flamegraph.pl script will be downloaded
const flameGraphScriptPath = path.join(os.tmpdir(), "flamegraph.pl");

// If the flamegraph.pl script does not exist, download it
if (!fs.existsSync(flameGraphScriptPath)) {
    const downloadUrl = "https://raw.githubusercontent.com/brendangregg/FlameGraph/cd9ee4c4449775a2f867acf31c84b7fe4b132ad5/flamegraph.pl";
    console.log(`Downloading flamegraph.pl from ${downloadUrl}`);
    https.get(downloadUrl, (response) => {
        const file = fs.createWriteStream(flameGraphScriptPath);
        response.pipe(file);
        file.on("finish", () => {
            file.close();
            fs.chmodSync(flameGraphScriptPath, "755");

            // Now generate the flame chart
            generateFlameChart();
        });
    });
} else {
    // Flamegraph.pl script already exists, generate the flame chart
    generateFlameChart();
}

function generateFlameChart() {
    // patterns is a comma separated list
    const patterns = pattern.split(",");

    // glob doesn't directly support the ! operator, so we need to separate positive and negative patterns
    const positivePatterns = patterns.filter((p) => !p.startsWith("!"));
    const negativePatterns = patterns.filter((p) => p.startsWith("!")).map((p) => p.substring(1));

    // Iterate over all files matching the patterns to create a list of "stacks"
    let stacks = [];
    for (const filePath of glob.globIterateSync(positivePatterns, {
        ignore: negativePatterns,
        cwd: folder,
    })) {
        // Get file stats given the absolute file path
        const stats = fs.statSync(path.resolve(folder, filePath));

        // Only process files (folder info is implicit in the flame chart)
        if (stats.isFile()) {
            // The format of each stack is "path/to/file; size"
            stacks.push(`${filePath.replace(/[\/]/g, ";")} ${stats.size}`);
        }
    }

    // Write the stacks to a temp file
    const tempFilePath = path.join(os.tmpdir(), "fileSizeStacks.txt");
    fs.writeFileSync(tempFilePath, stacks.join("\n"));

    // Construct the flamegraph command
    const flameGraphCommand = `${flameGraphScriptPath} --title "File &amp; Folder Sizes" --subtitle "Sizes of files and folders matching glob '${pattern}' under '${folder}'" --width 1800 --height 32 --countname "bytes" --nametype Folder/File ${tempFilePath} > ${outputFile}.svg`;
    console.log(`${chalk.bold(chalk.italic(`Running command`))}: ${chalk.italic(flameGraphCommand)}`);

    // Execute the flamegraph command, waiting for it to finish
    child_process.execSync(flameGraphCommand);

    // Open the svg (will generally open in the default browser, where it can be interacted with)
    child_process.exec(`open ${outputFile}.svg`);
}
