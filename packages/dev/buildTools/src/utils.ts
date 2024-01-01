/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as crypto from "crypto";

export function populateEnvironment() {
    dotenv.config({ path: path.resolve(findRootDirectory(), "./.env") });
}

populateEnvironment();

export function checkDirectorySync(directory: string) {
    try {
        fs.statSync(directory);
    } catch (e) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

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

const filterDashes = (str: string) => {
    let index = 0;
    while (str[index] === "-") {
        index++;
    }
    return str.substring(index);
};

export const checkArgs = (testArgument: string | string[], checkOnly: boolean = false, requiredIfSet = false): string | boolean => {
    const args = process.argv.slice(2);
    const index = typeof testArgument === "string" ? args.indexOf(testArgument) : testArgument.map((arg) => args.indexOf(arg)).find((idx) => idx !== -1);
    const envValue =
        typeof testArgument === "string"
            ? process.env[filterDashes(testArgument).toUpperCase().replace(/-/g, "_")]
            : testArgument.map((arg) => process.env[filterDashes(arg).toUpperCase().replace(/-/g, "_")]).filter((str) => !!str)[0];
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

export const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());

export const camelize = (s: string) => s.replace(/-./g, (x: string) => x[1].toUpperCase());

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

export const getHashOfFile = (filePath: string) => {
    const content = fs.readFileSync(filePath, "utf8");
    return getHashOfContent(content);
};

export const getHashOfContent = (content: string) => {
    const md5sum = crypto.createHash("md5");
    md5sum.update(content);
    return md5sum.digest("hex");
};
