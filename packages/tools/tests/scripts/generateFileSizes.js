const { statSync, writeFileSync } = require("fs-extra");
const glob = require("glob");
const path = require("path");

const sizes = {};
glob.globSync("./dist/**/*.js").forEach((file) => {
    const stats = statSync(file);
    console.log(`${file} - ${stats.size}`);
    const filename = path.basename(file);
    sizes[filename] = stats.size;
});

writeFileSync("./dist/fileSizes.json", JSON.stringify(sizes, null, 2));

// download file sizes from the cdn
const https = require("https");
https.get("https://cdn.babylonjs.com/fileSizes.json", (res) => {
    let data = "";
    res.on("data", (chunk) => {
        data += chunk;
    });
    res.on("end", () => {
        const fileSizes = JSON.parse(data);
        let error = false;
        // compare file sizes
        for (const filename in fileSizes) {
            if (fileSizes[filename] < sizes[filename]) {
                // check if increase is more than 10%
                const errorThreshold = Number.parseFloat(process.env.errorThreshold || "1.1");
                const warningThreshold = Number.parseFloat(process.env.warningThreshold || "1.05");
                if (sizes[filename] > fileSizes[filename] * errorThreshold) {
                    console.log(`##[error] File size for ${filename} has increased from ${fileSizes[filename]} to ${sizes[filename]} - more than 10%`);
                    error = true;
                } else if (sizes[filename] > fileSizes[filename] * warningThreshold) {
                    console.log(`##[warning] File size for ${filename} has increased from ${fileSizes[filename]} to ${sizes[filename]} - more than 5%`);
                } else {
                    console.log(`##[info] File size for ${filename} has increased from ${fileSizes[filename]} to ${sizes[filename]}`);
                }
            }
        }
        if (error) {
            process.exit(1);
        }
    });
});
