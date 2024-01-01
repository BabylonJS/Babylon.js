/* eslint-disable no-console */
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { checkArgs } from "./utils.js";

function processSource(sourceCode: string, forceMJS: boolean) {
    const extension = forceMJS ? ".mjs" : ".js";
    return sourceCode
        .replace(/((import|export).*["'](@babylonjs\/.*\/|\.{1,2}\/)((?!\.scss|\.svg|\.png|\.jpg).)*)("|');/g, `$1${extension}$5;`)
        .replace(new RegExp(`(${extension}){2,}`, "g"), extension);
}

export function addJsExtensionsToCompiledFiles(files: string[], forceMJS: boolean) {
    const isVerbose = checkArgs("--verbose", true);
    files.forEach((file: string) => {
        isVerbose && console.log(`Processing ${file}`);
        const sourceCode = fs.readFileSync(file, "utf-8");
        const processed = processSource(sourceCode, forceMJS);

        const regex = /import .* from "(\..*)";/g;
        let match;
        while ((match = regex.exec(processed)) !== null) {
            if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) {
                console.log(file, path.resolve(path.dirname(file), match[1]));
                throw new Error(`File ${match[1]} does not exist. Are you importing from an index/directory?`);
            }
        }
        fs.writeFileSync(file, processed);
    });
}

export const addJsExtensionsToCompiledFilesCommand = () => {
    let pathForFiles = checkArgs(["--path-of-sources", "-pos"], false, true);
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
