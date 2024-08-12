// get a list of files in the current directory
const fs = require("fs");
const path = require("path");

const directoryPath = path.join(".");
const files = fs.readdirSync(directoryPath);

// check there are no files that start with number or dev_core
let hasError = false;
files.forEach((file) => {
    if (file.startsWith("dev_core") || !isNaN(file.charAt(0))) {
        if (file.startsWith("dev_core")) {
            // eslint-disable-next-line no-console
            console.error(`##[error] Chunk was generated from the following file/directory: ${file.replace(/_/g, "/").replace(".babylon.max.js", "")}`);
        }
        hasError = true;
    }
    return hasError;
});

if (hasError) {
    // eslint-disable-next-line no-console
    console.error(`##[error] Chunks were introduced to UMD in this build.`);
    process.exit(1);
}
