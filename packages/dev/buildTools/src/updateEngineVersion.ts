import * as path from "path";
import * as fs from "fs";
import { findRootDirectory } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const updateEngineVersion = async () => {
    const baseDirectory = findRootDirectory();
    // get @dev/core package.json
    const rawdata = fs.readFileSync(path.join(baseDirectory, "packages", "dev", "core", "package.json"), "utf-8");
    const packageJson = JSON.parse(rawdata);
    const version = packageJson.version;

    // get abstractEngine.ts
    const abstractEngineFile = path.join(baseDirectory, "packages", "dev", "core", "src", "Engines", "abstractEngine.ts");
    const abstractEngineData = fs.readFileSync(abstractEngineFile, "utf-8");
    const array = /"babylonjs@(.*)"/.exec(abstractEngineData);
    if (!array) {
        throw new Error("Could not find babylonjs version in abstractEngine.ts");
    }
    const regexp = new RegExp(array[1], "g");
    const newAbstractEngineData = abstractEngineData.replace(regexp, version);
    fs.writeFileSync(abstractEngineFile, newAbstractEngineData);
};
