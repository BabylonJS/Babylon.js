/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
import { globSync } from "glob";

// eslint-disable-next-line @typescript-eslint/naming-convention
export function populateEnvironment() {
    dotenv.config({ path: path.resolve(findRootDirectory(), "./.env") });
}

populateEnvironment();

// eslint-disable-next-line @typescript-eslint/naming-convention
export function checkDirectorySync(directory: string) {
    try {
        fs.statSync(directory);
    } catch (e) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function removeDir(path: string) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);

        if (files.length > 0) {
            files.forEach(function (filename: string) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename);
                } else {
                    fs.unlinkSync(path + "/" + filename);
                }
            });
        } else {
            console.log("No files found in the directory.");
        }
    } else {
        console.log("Directory path not found.");
    }
}

const FilterDashes = (str: string) => {
    let index = 0;
    while (str[index] === "-") {
        index++;
    }
    return str.substring(index);
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const externalArgs: string[] = [];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const checkArgs = (testArgument: string | string[], checkOnly: boolean = false, requiredIfSet = false): string | boolean => {
    const args = externalArgs.length ? externalArgs : process.argv.slice(2);
    const index = typeof testArgument === "string" ? args.indexOf(testArgument) : testArgument.map((arg) => args.indexOf(arg)).find((idx) => idx !== -1);
    const envValue =
        typeof testArgument === "string"
            ? process.env[FilterDashes(testArgument).toUpperCase().replace(/-/g, "_")]
            : testArgument.map((arg) => process.env[FilterDashes(arg).toUpperCase().replace(/-/g, "_")]).filter((str) => !!str)[0];
    if (index === -1 || index === undefined) {
        // is it defined in the .env file?
        if (envValue) {
            return envValue;
        }
        return checkOnly ? false : "";
    } else {
        if (!checkOnly) {
            const returnValue = args[index + 1] && args[index + 1][0] !== "-" ? args[index + 1] : "";
            if (requiredIfSet && !returnValue) {
                return false;
            } else {
                return returnValue || true;
            }
        } else {
            return true;
        }
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function copyFile(from: string, to: string, silent?: boolean, checkHash?: boolean) {
    checkDirectorySync(path.dirname(to));
    if (checkHash) {
        // check if file exists
        if (fs.existsSync(to)) {
            const hash = getHashOfFile(to);
            const newHash = getHashOfFile(from);
            if (hash === newHash) {
                if (!silent) {
                    console.log(`${from} is up to date.`);
                }
                return;
            }
        }
    }
    fs.copyFileSync(from, to);
    if (!silent) {
        console.log("File copied: " + from);
    }
}

/**
 * This function will copy a folder from one location to another, independent of the OS.
 * @param from directory to copy from
 * @param to directory to copy to
 * @param silent if true, will not log anything
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function copyFolder(from: string, to: string, silent?: boolean) {
    checkDirectorySync(to);
    // check if from is a folder
    let isDirectory = false;
    try {
        isDirectory = fs.lstatSync(from).isDirectory();
    } catch (e) {}
    const files = isDirectory
        ? fs.readdirSync(from)
        : globSync(from, {
              windowsPathsNoEscape: true,
          });
    const baseDir = isDirectory ? from : "";
    for (const file of files) {
        const basename = isDirectory ? file : path.basename(file);
        const current = fs.lstatSync(path.join(baseDir, file));
        if (current.isDirectory()) {
            copyFolder(path.join(baseDir, file), path.join(to, basename), silent);
        } else if (current.isSymbolicLink()) {
            const symlink = fs.readlinkSync(path.join(baseDir, file));
            fs.symlinkSync(symlink, path.join(to, basename));
        }
        copyFile(path.join(baseDir, file), path.join(to, basename), silent);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());

// eslint-disable-next-line @typescript-eslint/naming-convention
export const camelize = (s: string) => s.replace(/-./g, (x: string) => x[1].toUpperCase());

// eslint-disable-next-line @typescript-eslint/naming-convention
export const debounce = <T extends (...args: any[]) => any>(callback: T, waitFor: number) => {
    let timeout: NodeJS.Timeout | number;
    return (...args: Parameters<T>): ReturnType<T> => {
        let result: any;
        clearTimeout(timeout as number);
        timeout = setTimeout(() => {
            result = callback(...args);
        }, waitFor);
        return result;
    };
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function findRootDirectory(): string {
    let localPackageJSON = { name: "" };
    let basePath: string = process.cwd();
    let currentRoot = basePath;
    do {
        try {
            localPackageJSON = JSON.parse(fs.readFileSync(path.join(basePath, "./package.json")).toString());
        } catch (e) {}
        currentRoot = basePath;
        // console.log(localPackageJSON);
        basePath = path.resolve(basePath, "..");
        // process.chdir("..");
        if (basePath === currentRoot) {
            throw new Error("Could not find the root package.json");
        }
    } while (localPackageJSON.name !== "@babylonjs/root");
    return path.resolve(currentRoot);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getHashOfFile = (filePath: string) => {
    const content = fs.readFileSync(filePath, "utf8");
    return getHashOfContent(content);
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getHashOfContent = (content: string) => {
    const md5sum = crypto.createHash("md5");
    md5sum.update(content);
    return md5sum.digest("hex");
};
