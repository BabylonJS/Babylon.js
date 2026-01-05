/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";

// Get package.json path from command line argument or default to current directory
const packageJsonDirectory = process.argv[2] || ".";
const packageJsonFullPath = path.resolve(path.join(packageJsonDirectory, "package.json"));

console.log("Reading package.json from:", packageJsonFullPath);

const PackageText = fs.readFileSync(packageJsonFullPath);
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
