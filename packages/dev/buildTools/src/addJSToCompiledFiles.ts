import * as fs from "fs";
import { checkArgs } from "./utils";
import * as glob from "glob";

function processSource(sourceCode: string, forceMJS: boolean) {
    const extension = forceMJS ? ".mjs" : ".js";
    return sourceCode.replace(/((import|export).*["'](@babylonjs\/.*\/|\.{1,2}\/).*)("|');/g, `$1${extension}$4;`).replace(new RegExp(`(${extension}){2,}`, "g"), extension);
}

export function addJsExtensionsToCompiledFiles(files: string[], forceMJS: boolean) {
    const isVerbose = checkArgs("--verbose", true);
    files.forEach((file: string) => {
        isVerbose && console.log(`Processing ${file}`);
        const sourceCode = fs.readFileSync(file, "utf-8");
        fs.writeFileSync(file, processSource(sourceCode, forceMJS));
    });
}

export const addJsExtensionsToCompiledFilesCommand = () => {
    let pathForFiles = checkArgs("--path", false, true);
    const forceMJS = !!checkArgs("--mjs", true);
    if (!pathForFiles) {
        pathForFiles = "./**/*.js";
        console.log("No path specified, using default: " + pathForFiles);
    }
    if (typeof pathForFiles === "string") {
        console.log(`Adding .js extensions to files in ${pathForFiles}`);
        addJsExtensionsToCompiledFiles(glob.sync(pathForFiles), forceMJS);
    }
};
