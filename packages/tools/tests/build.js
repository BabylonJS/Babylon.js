// read all files in src, use the filenames without extension as environment variable to execute webpack command

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { execSync } = require("child_process");

const files = fs.readdirSync(path.join(__dirname, "src"));
files.forEach((file) => {
    // TODO: Figure out why WebPack uses so much memory when bundling sceneWithInspector.js
    if (file !== "sceneWithInspector.ts") {
        console.log();
        console.log(chalk.bold(chalk.blue(`===== Building ${file} =====`)));
        execSync(`webpack --env entry=${path.basename(file, ".ts")}`, { stdio: "inherit" });
    }
});
