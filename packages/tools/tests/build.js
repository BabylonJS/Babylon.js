// read all files in src, use the filenames without extension as environment variable to execute webpack command

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const files = fs.readdirSync(path.join(__dirname, "src"));
files.forEach((file) => {
    execSync(`webpack --env entry=${path.basename(file, ".ts")}`, { stdio: "inherit" });
});
