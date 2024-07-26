const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const path = require("path");
const open = require("open");
const { generateFlameChart } = require("../../../scripts/folderSizeFlameChart");

const coverageDirectory = "dist/coverage";
const rawDirectory = path.join(coverageDirectory, "raw");
const reportsDirectory = path.join(coverageDirectory, "reports");

// Generate coverage reports (full html + json summary), and open the html report
execSync(`npx nyc report --reporter html --reporter json-summary -t ${rawDirectory} --report-dir ${reportsDirectory}`);
open(`${path.join(reportsDirectory, "index.html")}`);

// Generate a flame chart of unused bytes in the analyze bundle, and open the svg
const coverageSummaryPath = path.join(reportsDirectory, "coverage-summary.json");
const coverageSummary = JSON.parse(readFileSync(coverageSummaryPath, "utf8"));
const coerceFileSize = (file, size) => {
    file = file.replace("analyze", "coverage/original");
    const percentCovered = coverageSummary[file]?.statements?.pct ?? 0;
    return size * (1 - percentCovered / 100);
};

const folder = "dist/analyze";
const pattern = "**/*.js";
const outputFile = "dist/coverage/reports/flameChart";
generateFlameChart(
    folder,
    pattern,
    outputFile,
    `Unused bytes in files and folders matching glob '${pattern}' under '${folder}' given coverage summary '${coverageSummaryPath}'`,
    coerceFileSize
).then(() => {
    open(`${outputFile}.svg`);
});
