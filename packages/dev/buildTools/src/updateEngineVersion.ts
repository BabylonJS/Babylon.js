import * as path from "path";
import * as fs from "fs";
import { findRootDirectory } from "./utils";

export const updateEngineVersion = async () => {
    const baseDirectory = findRootDirectory();
    // get @dev/core package.json
    const rawdata = fs.readFileSync(path.join(baseDirectory, "packages", "dev", "core", "package.json"), "utf-8");
    const packageJson = JSON.parse(rawdata);
    const version = packageJson.version;

    // get thinEngine.ts
    const thinEngineFile = path.join(baseDirectory, "packages", "dev", "core", "src", "Engines", "thinEngine.ts");
    const thinEngineData = fs.readFileSync(thinEngineFile, "utf-8");
    const array = /"babylonjs@(.*)"/.exec(thinEngineData);
    if (!array) {
        throw new Error("Could not find babylonjs version in thinEngine.ts");
    }
    const regexp = new RegExp(array[1], "g");
    const newThinEngineData = thinEngineData.replace(regexp, version);
    fs.writeFileSync(thinEngineFile, newThinEngineData);
};
