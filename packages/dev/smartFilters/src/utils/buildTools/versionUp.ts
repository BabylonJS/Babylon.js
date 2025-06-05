/* eslint-disable no-console */
import * as fs from "fs";
import { exec, type ExecException } from "child_process";
import { compareVersions, determineVersion, getNpmVersion, type VersionType } from "./determineVersion.js";
import type { Nullable } from "publishedBabylonCore/types.js";

const alpha = process.argv.includes("--alpha");
const packageText = fs.readFileSync("package.json");
const packageJSON = JSON.parse(packageText.toString());

const packageName = packageJSON.name;
console.log("Processing package:", packageName);
console.log("Alpha flag:", alpha);
console.log("Current package.json version:", packageJSON.version);

/**
 * Queries the NPM registry for the specified version type
 * @param versionType - The type of version to query
 * @param callback - The callback to call with the NPM version
 */
function queryNpmFeed(versionType: VersionType, callback: (npmVersion: Nullable<string>) => void) {
    exec(`npm view ${packageName} dist-tags.${versionType}`, (err: Nullable<ExecException>, stdout) => {
        let npmVersion = getNpmVersion(versionType, err, stdout);
        if (npmVersion !== null) {
            npmVersion = npmVersion.trim();
            console.log(`NPM Registry ${versionType} version:`, npmVersion);
        }
        callback(npmVersion);
    });
}

queryNpmFeed("preview", (npmPreviewVersion) => {
    queryNpmFeed("latest", (npmLatestVersion) => {
        let highestNpmVersion: Nullable<string> = npmLatestVersion;
        if (npmPreviewVersion && (!highestNpmVersion || compareVersions(npmPreviewVersion, highestNpmVersion) === 1)) {
            highestNpmVersion = npmPreviewVersion;
        }

        console.log("Highest NPM Registry version:", highestNpmVersion);

        const versionToUse = determineVersion(highestNpmVersion, packageJSON.version, alpha);

        console.log("Version to use:", versionToUse);

        // Update package.json if needed
        if (packageJSON.version !== versionToUse) {
            packageJSON.version = versionToUse;
            fs.writeFileSync("package.json", JSON.stringify(packageJSON, null, 4));
            console.log("Version updated in package.json");
        } else {
            console.log("No need to update package.json");
        }

        // Write out to version.ts
        const versionTsText = `/**
 * The version of the SmartFilter core. During publish, this file is overwritten by versionUp.ts with the same version that is used for the NPM publish.
 */
export const SmartFilterCoreVersion = "${versionToUse}";\n`;
        fs.writeFileSync("src/version.ts", versionTsText);
    });
});
