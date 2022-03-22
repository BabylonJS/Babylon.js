import * as glob from "glob";
import * as path from "path";
import type { UMDPackageName } from "./packageMapping";
import { umdPackageMapping } from "./packageMapping";
import { copyFile, findRootDirectory } from "./utils";

export const prepareSnapshot = () => {
    const baseDirectory = findRootDirectory();
    const snapshotDirectory = path.join(baseDirectory, ".snapshot");
    Object.keys(umdPackageMapping).forEach((packageName) => {
        const metadata = umdPackageMapping[packageName as UMDPackageName];
        const corePath = path.join(baseDirectory, "packages", "public", "umd", packageName, "dist");
        const coreUmd = glob.sync(`${corePath}/*.*`);
        for (const file of coreUmd) {
            copyFile(file, path.join(snapshotDirectory, metadata.baseDir, path.basename(file)), true);
        }
    });

    // copy gltf2interface
    {
        const baseLocation = path.join(baseDirectory, "packages", "public");
        const staticFiles = glob.sync(`${baseLocation}/glTF2Interface/*.*`);
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
        const staticFiles = glob.sync(`${baseLocation}/**/*.module.d.ts`);
        for (const file of staticFiles) {
            copyFile(file, file.replace(".module", ""), false);
        }
    }

    // copy all static files
    const baseLocation = path.join(baseDirectory, "packages", "tools", "babylonServer", "public");
    const staticFiles = glob.sync(`${baseLocation}/**/*.*`);
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
    const staticFilesDist = glob.sync(`${baseLocationDist}/**/*.js`);
    for (const file of staticFilesDist) {
        const relative = path.relative(baseLocationDist, file);
        copyFile(file, path.join(snapshotDirectory, relative), true);
    }
};
