/* eslint-disable no-console */
import type { Nullable } from "publishedBabylonCore/types";
import type { ExecException } from "child_process";

/**
 * Determines if the major and minor versions of two semver strings match
 * @param version1 - The first semver string
 * @param version2 - The second semver string
 * @returns True if the major and minor versions match, false otherwise
 */
function majorAndMinorVersionsMatch(version1: string, version2: string): boolean {
    const version1split = version1.split(".");
    const version2split = version2.split(".");
    return version1split[0] === version2split[0] && version1split[1] === version2split[1];
}

/**
 * Takes in a semver string (e.g. "0.1.0") and increments the patch version.
 * Note: it does not preserve any prerelease flags in the patch version.
 * @param version - The semver string to operate on
 * @returns The incremented version string
 */
function incrementPatchVersion(version: string): string {
    const spl = version.split(".");
    if (spl.length < 3) {
        throw new Error("version string must have at least 3 parts");
    }
    spl[spl.length - 1] = (Number.parseInt(spl[spl.length - 1]!) + 1).toString();
    return spl.join(".");
}

/**
 * Takes in a semver string (e.g. "0.1.0" or "0.1.0-alpha") and removes any prerelease flag.
 * @param version - The semver string to operate on
 * @returns The version string with the prerelease flag removed
 */
export function removePrereleaseFlags(version: string): string {
    const spl = version.split(".");
    if (spl.length < 3) {
        throw new Error("version string must have at least 3 parts");
    }
    spl[spl.length - 1] = Number.parseInt(spl[spl.length - 1]!).toString();
    return spl.join(".");
}

/**
 * Given the npmVersion, packageJSONVersion, and alpha flag, determines the version to use
 * @param npmVersion - The version from the NPM registry
 * @param packageJSONVersion - The version from the package.json file
 * @param alpha - A flag to indicate if the version should have an alpha prerelease flag
 * @returns The version to use
 */
export function determineVersion(npmVersion: Nullable<string>, packageJSONVersion: string, alpha: boolean): string {
    packageJSONVersion = removePrereleaseFlags(packageJSONVersion);
    npmVersion = npmVersion === null ? null : removePrereleaseFlags(npmVersion);

    let versionToUse;
    if (npmVersion === null || !majorAndMinorVersionsMatch(npmVersion, packageJSONVersion)) {
        console.log("Major & minor versions do not match: using the current package.json version");
        versionToUse = packageJSONVersion;
    } else {
        console.log("Major & minor versions match: using the NPM registry version with an incremented patch version.");
        versionToUse = incrementPatchVersion(npmVersion);
    }

    if (alpha) {
        console.log("Ensuring -alpha prerelease flag is present");
        versionToUse += "-alpha";
    }

    return versionToUse;
}

/**
 * The supported version types
 */
export type VersionType = "preview" | "latest";

/**
 * Handles error cases and returns the JSON of the package versions
 * @param versionType - The type of version to get
 * @param err - The error object
 * @param stdout - The stdout string
 * @returns The JSON of the package versions
 */
export function getNpmVersion(versionType: VersionType, err: Nullable<ExecException>, stdout: string): Nullable<string> {
    let npmVersion = null;
    if (err?.message && err.message.indexOf("E404") !== -1) {
        console.warn(`NPM registry does not have any ${versionType} version`);
    } else if (err) {
        console.error(err);
        throw err;
    } else {
        npmVersion = stdout;
    }
    return npmVersion;
}

/**
 * Compares two semver strings, returning -1 if version1 is less than version2, 1 if version1 is greater than version2, and 0 if they are equal
 * @param version1 - The first semver string
 * @param version2 - The second semver string
 * @returns -1 if version1 is less than version2, 1 if version1 is greater than version2, and 0 if they are equal
 */
export function compareVersions(version1: string, version2: string): number {
    const version1split = removePrereleaseFlags(version1).split(".");
    const version2split = removePrereleaseFlags(version2).split(".");

    if (version1split.length !== 3 || version2split.length !== 3) {
        throw new Error("version strings must have 3 parts");
    }

    for (let i = 0; i < 3; i++) {
        const v1 = Number.parseInt(version1split[i]!);
        const v2 = Number.parseInt(version2split[i]!);

        if (v1 < v2) {
            return -1;
        } else if (v1 > v2) {
            return 1;
        }
    }
    return 0;
}
