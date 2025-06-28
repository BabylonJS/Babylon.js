/* eslint-disable no-console */
import * as fs from "fs";

const PackageText = fs.readFileSync("package.json");
const PackageJSON = JSON.parse(PackageText.toString());

const PackageName = PackageJSON.name;
console.log("Processing package:", PackageName);
console.log("Current package.json version:", PackageJSON.version);

// Write out to version.ts
const VersionTsText = `/**
 * The version of the SmartFilter core. During publish, this file is overwritten by recordVersionNumber.ts with the same version that is used for the NPM publish.
 */
export const SmartFilterCoreVersion = "${PackageJSON.version}";\n`;
fs.writeFileSync("src/version.ts", VersionTsText);
console.log("Wrote version.ts with version:", PackageJSON.version);
