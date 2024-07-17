"use strict";

// This script generates an interactive flame chart for file/folder sizes.
// node folderSizeFlameChart.js [pattern=**/*] [outputFile=FoldersSizes]
// Example: node folderSizeFlameChart.js **/*.ts,!**/*.d.ts,!**/test/**

const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const glob = require("glob");

let [scriptPath, folder = ".", pattern = "**", outputFile = "FoldersSizes"] = process.argv.slice(1);

console.log(`${path.basename(scriptPath)} ${folder} ${pattern} ${outputFile}`);

folder = path.resolve(folder);

const flameGraphScriptPath = path.join(os.tmpdir(), "flamegraph.pl");

if (!fs.existsSync(flameGraphScriptPath)) {
    const downloadUrl = "https://raw.githubusercontent.com/brendangregg/FlameGraph/cd9ee4c4449775a2f867acf31c84b7fe4b132ad5/flamegraph.pl";
    console.log(`Downloading flamegraph.pl from ${downloadUrl}`);
    https.get(downloadUrl, (response) => {
        const file = fs.createWriteStream(flameGraphScriptPath);
        response.pipe(file);
        file.on("finish", () => {
            file.close();
            fs.chmodSync(flameGraphScriptPath, "755");
            generateFlameGraph();
        });
    });
} else {
    generateFlameGraph();
}

function generateFlameGraph() {
    const patterns = pattern.split(",");
    const positivePatterns = patterns.filter((p) => !p.startsWith("!"));
    const negativePatterns = patterns.filter((p) => p.startsWith("!")).map((p) => p.substring(1));
    let stacks = [];
    for (const filePath of glob.globIterateSync(positivePatterns, {
        ignore: negativePatterns,
        cwd: folder,
    })) {
        const stats = fs.statSync(path.resolve(folder, filePath));
        if (stats.isFile()) {
            stacks.push(`${filePath.replace(/[\/]/g, ";")} ${stats.size}`);
        }
    }

    stacks = stacks.join("\n");

    const tempFilePath = path.join(os.tmpdir(), "fileSizeStacks.txt");
    fs.writeFileSync(tempFilePath, stacks);

    const flameGraphCommand = `${flameGraphScriptPath} --title "File &amp; Folder Sizes" --subtitle "Sizes of files and folders matching glob '${pattern}' under '${folder}'" --width 1800 --height 32 --countname "bytes" --nametype Folder/File ${tempFilePath} > ${outputFile}.svg`;
    console.log(`Running command: ${flameGraphCommand}`);
    child_process.execSync(flameGraphCommand);

    child_process.exec(`open ${outputFile}.svg`);
}
