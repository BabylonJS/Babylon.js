"use strict";

/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */

// This script generates an interactive flame chart for file/folder sizes.
// node folderSizeFlameChart.js [pattern=**/*] [outputFile=FoldersSizes]
// Example: node folderSizeFlameChart.js . "**/*.ts,!**/*.d.ts,!**/test/**"

import child_process from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import { glob } from "glob";
import chalk from "chalk";
import open from "open";

async function downloadFlameGraphScript(tempDirectory) {
    const flameGraphScriptPath = path.join(tempDirectory, "flamegraph.pl");

    return new Promise((resolve, reject) => {
        const downloadUrl = "https://raw.githubusercontent.com/brendangregg/FlameGraph/cd9ee4c4449775a2f867acf31c84b7fe4b132ad5/flamegraph.pl";
        console.log(`Downloading flamegraph.pl from ${downloadUrl}`);
        https.get(downloadUrl, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Failed to download flamegraph.pl script. Status code: ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(flameGraphScriptPath);
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve(flameGraphScriptPath);
            }).on("error", (err) => {
                fs.rmSync(flameGraphScriptPath, { force: true });
                reject(err);
            });
        });
    });
}

/**
 * Generates a flame chart for file/folder sizes.
 * @param {string} folder The folder to search for files in.
 * @param {string} pattern The glob pattern to match files against.
 * @param {string} outputFile The name of the output file (without extension).
 * @param {string} chartSubtitle The subtitle of the flame chart.
 * @param {function} coerceSize A function to coerce the size of a file. If not provided, the actual size is used.
 * @returns {Promise<void>} A promise that resolves when the flame chart has been generated.
 */
export async function generateFlameChart(folder, pattern, outputFile, chartSubtitle, coerceSize) {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "folder-size-flame-chart-"));

    try {
        const flameGraphScriptPath = await downloadFlameGraphScript(tempDirectory);

        // Resolve to an absolute path
        folder = path.resolve(folder);

        // patterns is a comma separated list
        const patterns = pattern.split(",");

        // glob doesn't directly support the ! operator, so we need to separate positive and negative patterns
        const positivePatterns = patterns.filter((p) => !p.startsWith("!"));
        const negativePatterns = patterns.filter((p) => p.startsWith("!")).map((p) => p.substring(1));

        // Iterate over all files matching the patterns to create a list of "stacks"
        const stacks = [];
        for (const filePath of glob.globIterateSync(positivePatterns, {
            ignore: negativePatterns,
            cwd: folder,
        })) {
            // Get file stats given the absolute file path
            const absolutePath = path.resolve(folder, filePath);
            const stats = fs.statSync(absolutePath);

            // Only process files (folder info is implicit in the flame chart)
            if (stats.isFile()) {
                let size = stats.size;
                if (coerceSize) {
                    size = coerceSize(absolutePath, size);
                }

                // The format of each stack is "path/to/file; size"
                stacks.push(`${filePath.replace(/\//g, ";")} ${size}`);
            }
        }

        // Write the stacks to a temp file
        const tempFilePath = path.join(tempDirectory, "fileSizeStacks.txt");
        fs.writeFileSync(tempFilePath, stacks.join("\n"));

        const flameGraphArgs = [
            flameGraphScriptPath,
            "--title",
            "File &amp; Folder Sizes",
            "--subtitle",
            chartSubtitle,
            "--width",
            "1800",
            "--height",
            "32",
            "--countname",
            "bytes",
            "--nametype",
            "Folder/File",
            tempFilePath,
        ];
        console.log(`${chalk.bold(chalk.italic("Running command"))}: ${chalk.italic(`perl ${flameGraphArgs.join(" ")}`)}`);

        const outputPath = `${outputFile}.svg`;
        const outputDescriptor = fs.openSync(outputPath, "w");
        try {
            const result = child_process.spawnSync("perl", flameGraphArgs, {
                stdio: ["ignore", outputDescriptor, "inherit"],
            });
            if (result.error) {
                throw result.error;
            }
            if (result.status !== 0) {
                throw new Error(`Flame graph generation failed with exit code ${result.status}.`);
            }
        } finally {
            fs.closeSync(outputDescriptor);
        }
    } finally {
        fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const [scriptPath, folder = ".", pattern = "**", outputFile = "FoldersSizes"] = process.argv.slice(1);

    console.log(chalk.bold(`${path.basename(scriptPath)} ${folder} ${pattern} ${outputFile}`));

    generateFlameChart(folder, pattern, outputFile, `Sizes of files and folders matching glob '${pattern}' under '${folder}'`).then(() => {
        // Open the svg (will generally open in the default browser, where it can be interacted with)
        open(`${outputFile}.svg`);
    });
}
