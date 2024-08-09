// get a list of files in the current directory
const fs = require("fs");
const path = require("path");

const directoryPath = path.join(".");
const files = fs.readdirSync(directoryPath);

// check there are no files that start with number or dev_core
let hasError = false;
files.some((file) => {
    if (file.startsWith("dev_core") || !isNaN(file.charAt(0))) {
        // eslint-disable-next-line no-console
        console.error(`#error Chunks were introduced to UMD in this build.`);
        hasError = true;
    }
    return hasError;
});

if (hasError) {
    process.exit(1);
}
