import * as fs from "fs";
import { globSync } from "glob";
import * as path from "path";
import type { UMDPackageName } from "./packageMapping.js";
import { umdPackageMapping } from "./packageMapping.js";
import { copyFile, findRootDirectory } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const prepareSnapshot = () => {
    const baseDirectory = findRootDirectory();
    const snapshotDirectory = path.join(baseDirectory, ".snapshot");
    Object.keys(umdPackageMapping).forEach((packageName) => {
        const metadata = umdPackageMapping[packageName as UMDPackageName];
        const corePath = path.join(baseDirectory, "packages", "public", "umd", metadata.sourceDir ?? packageName);
        const coreUmd = globSync(`${corePath}/*+(.js|.d.ts|.map)`).filter((file) => path.basename(file) !== "webpack.config.js");
        for (const file of coreUmd) {
            copyFile(file, path.join(snapshotDirectory, metadata.baseDir, path.basename(file)), true);
        }
    });

    // copy gltf2interface
    {
        const baseLocation = path.join(baseDirectory, "packages", "public");
        const staticFiles = globSync(`${baseLocation}/glTF2Interface/*.*`);
        for (const file of staticFiles) {
            // ignore package.json files
            if (path.basename(file) === "package.json") {
                continue;
            }
            const relative = path.relative(baseLocation, file);
            copyFile(file, path.join(snapshotDirectory, relative), false);
        }
    }

    // make sure the .d.ts files are also available, clone the .module.d.ts files
    {
        const baseLocation = path.join(baseDirectory, ".snapshot");
        const staticFiles = globSync(`${baseLocation}/**/*.module.d.ts`);
        for (const file of staticFiles) {
            // check if the file already exists. if it isn't, copy it
            if (!fs.existsSync(file.replace(".module", ""))) {
                copyFile(file, file.replace(".module", ""), false);
            }
        }
    }

    // copy all static files
    const baseLocation = path.join(baseDirectory, "packages", "tools", "babylonServer", "public");
    const staticFiles = globSync(`${baseLocation}/**/*.*`);
    for (const file of staticFiles) {
        // ignore package.json files
        if (path.basename(file) === "package.json") {
            continue;
        }
        const relative = path.relative(baseLocation, file);
        copyFile(file, path.join(snapshotDirectory, relative), true);
    }
    // copy dist from babylon server
    const baseLocationDist = path.join(baseDirectory, "packages", "tools", "babylonServer", "dist");
    const staticFilesDist = globSync(`${baseLocationDist}/**/*.js`);
    for (const file of staticFilesDist) {
        const relative = path.relative(baseLocationDist, file);
        copyFile(file, path.join(snapshotDirectory, relative), true);
    }

    // generate timestamp.js, which contains the current timestamp
    const timestamp = Date.now();
    const timestampFile = path.join(snapshotDirectory, "timestamp.js");
    fs.writeFileSync(timestampFile, `if(typeof globalThis !== "undefined") globalThis.__babylonSnapshotTimestamp__ = ${timestamp};`);

    // if fileSizes.json exists, copy it as well
    const fileSizesPath = path.join(baseDirectory, "packages", "tools", "tests", "dist", "fileSizes.json");
    if (fs.existsSync(fileSizesPath)) {
        copyFile(fileSizesPath, path.join(snapshotDirectory, "fileSizes.json"), true);
    }

    // copy the es6 builds
    // removed for now
    // {
    //     const baseLocationDist = path.join(baseDirectory, "packages", "public", "@babylonjs");
    //     const staticFilesDist = glob.sync(`${baseLocationDist}/**/*.*`);
    //     for (const file of staticFilesDist) {
    //         // ignore directories
    //         if (fs.lstatSync(file).isDirectory()) {
    //             continue;
    //         }
    //         const relative = path.relative(baseLocationDist, file);
    //         copyFile(file, path.join(snapshotDirectory, "es6", relative), true);
    //     }
    // }
};
