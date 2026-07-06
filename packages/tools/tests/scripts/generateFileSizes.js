const { statSync, writeFileSync, readFileSync } = require("fs");
const glob = require("glob");
const path = require("path");

// allow overriding the error and warning thresholds using flags.json
// errorThreshold: 1.1
// warningThreshold: 1.05
const flags = JSON.parse(readFileSync("../../../.build/flags.json", "utf8"));
for (const key in flags) {
    process.env[key] = flags[key];
}

// Absolute per-case growth caps (in bytes) applied in addition to the
// percentage thresholds above. Some cases must stay minimal regardless of
// their percentage headroom, so any single PR that grows them past the cap
// fails the build. The thin engine is the strictest: it may not grow by more
// than 2 KB in a single PR.
const absoluteGrowthCaps = {
    thinEngineOnly: 2000,
};

const sizes = {};
glob.globSync("./dist/*").forEach((file) => {
    // ignore files, only operate on directories
    if (statSync(file).isFile()) {
        return;
    }
    // each directory is a case. each case has a file called "main.js" and "async.js".
    // We want to write down the size of these files in a map with the directory name as a key
    // if the files don't exist, skip the case
    let mainSize = -1;
    let asyncSize = -1;

    try {
        mainSize = statSync(path.join(file, "main.js")).size;
    } catch (e) {
        console.log(`##[error] main.js not found in ${file}`);
        process.exit(1);
    }
    try {
        asyncSize = statSync(path.join(file, "async.js")).size;
    } catch (e) {
        console.log(`##[warn] async.js not found in ${file}`);
    }
    sizes[path.basename(file)] = {
        main: mainSize,
        async: asyncSize,
    };
});

writeFileSync("./dist/fileSizes.json", JSON.stringify(sizes, null, 2));

// download file sizes from the cdn
const https = require("https");
const { read } = require("fs");
https.get("https://cdn.babylonjs.com/fileSizes.json", (res) => {
    let data = "";
    res.on("data", (chunk) => {
        data += chunk;
    });
    res.on("end", () => {
        const fileSizes = JSON.parse(data);
        let error = false;
        // compare file sizes. Therer are two use-cases. One is the legacy case where we have a single file and the key ends in .js
        // The other is the new case where we have two files, one for the main and one for the async. The key is just the test case with two entries: main and async
        for (const filename in fileSizes) {
            const caseName = filename.replace(".js", "");
            if (!sizes[caseName]) {
                console.log(`##[warn] Case ${caseName} not found in the new file sizes`);
                continue;
            }
            const currentMainSize = sizes[caseName].main;
            const currentAsyncSize = sizes[caseName].async;
            let loadedMainSize = -1;
            let loadedAsyncSize = -1;
            if (filename.endsWith(".js")) {
                loadedMainSize = fileSizes[filename];
            } else {
                loadedMainSize = fileSizes[filename].main;
                loadedAsyncSize = fileSizes[filename].async;
            }
            if (loadedMainSize < currentMainSize) {
                const errorThreshold = Number.parseFloat(process.env.errorThreshold || "1.1");
                const warningThreshold = Number.parseFloat(process.env.warningThreshold || "1.05");
                const growth = currentMainSize - loadedMainSize;
                const absoluteCap = absoluteGrowthCaps[caseName];
                if (absoluteCap !== undefined && growth > absoluteCap) {
                    // This case has a hard per-PR byte budget that is stricter than the percentage thresholds.
                    console.log(
                        `##[error] File size for ${filename} has increased from ${loadedMainSize} to ${currentMainSize} - grew ${growth} bytes, more than the ${absoluteCap} byte cap for this case`
                    );
                    error = true;
                } else if (currentMainSize > loadedMainSize * errorThreshold) {
                    console.log(
                        `##[error] File size for ${filename} has increased from ${loadedMainSize} to ${currentMainSize} - more than ${Math.floor((errorThreshold - 1) * 100)}%`
                    );
                    error = true;
                } else if (currentMainSize > loadedMainSize * warningThreshold) {
                    console.log(
                        `##[warn] File size for ${filename} has increased from ${loadedMainSize} to ${currentMainSize} - more than ${Math.floor((warningThreshold - 1) * 100)}%`
                    );
                } else {
                    console.log(`##[info] File size for ${filename} has increased from ${loadedMainSize} to ${currentMainSize}`);
                }
            } else {
                console.log(`##[info] File size for ${filename} has decreased from ${loadedMainSize} to ${currentMainSize}`);
            }
            // just warn about async for now
            if (loadedAsyncSize && currentAsyncSize && loadedAsyncSize !== -1 && loadedAsyncSize < currentAsyncSize) {
                console.log(`##[warn] File size for ${filename} async has increased from ${loadedAsyncSize} to ${currentAsyncSize}`);
            }
        }
        if (error) {
            process.exit(1);
        }
    });
});
