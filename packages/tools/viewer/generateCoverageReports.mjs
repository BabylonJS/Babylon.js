"use strict";

/* eslint-disable no-console */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";
import open from "open";
import chalk from "chalk";
import { generateFlameChart } from "../../../scripts/folderSizeFlameChart.mjs";

const [scriptPath, analyzeDirectory, coverageDirectory, originalDirectory, rawDirectory] = process.argv.slice(1);

const reportsDirectory = path.join(coverageDirectory, "reports");

// Generate coverage reports (full html + json summary), and open the html report
const nycCommand = `npx nyc report --reporter html --reporter json-summary -t ${rawDirectory} --report-dir ${reportsDirectory}`;
console.log(`${chalk.bold(chalk.italic(`Running command`))}: ${chalk.italic(nycCommand)}`);
console.log();
execSync(nycCommand);
open(`${path.join(reportsDirectory, "index.html")}`);

// Load the coverage summary and coerce file sizes based on coverage
const coverageSummaryPath = path.join(reportsDirectory, "coverage-summary.json");
const coverageSummary = JSON.parse(readFileSync(coverageSummaryPath, "utf8"));
const coerceFileSize = (file, size) => {
    // Coverage is generated from non-minified files so we can get more useful information like line counts,
    // but we should calculate unused bytes based on the minified files to make it easier to relate to the raw bundle size flame chart.
    file = file.replace(analyzeDirectory, originalDirectory);
    const percentCovered = coverageSummary[file]?.statements?.pct ?? 0;
    return size * (1 - percentCovered / 100);
};

// Generate a flame chart of unused bytes in the analyze bundle, and open the svg
const pattern = "**/*.js";
const outputFile = "dist/coverage/reports/flameChart";
generateFlameChart(
    analyzeDirectory,
    pattern,
    outputFile,
    `Approximate unused bytes in files and folders matching glob '${pattern}' under '${analyzeDirectory}' given coverage summary '${coverageSummaryPath}'`,
    coerceFileSize
).then(() => {
    open(`${outputFile}.svg`);
});
