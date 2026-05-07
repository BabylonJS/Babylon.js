/* eslint-disable no-console */
import * as fs from "fs";
import { globSync } from "glob";
import * as path from "path";
import { checkArgs } from "./utils.js";

function ProcessSource(sourceCode: string, forceMJS: boolean) {
    const extension = forceMJS ? ".mjs" : ".js";
    const addExtension = (specifier: string) => {
        if (!/^(?:@babylonjs\/.*\/|\.{1,2}\/)/.test(specifier) || /\.(?:scss|svg|png|jpg)$/i.test(specifier)) {
            return specifier;
        }

        return `${specifier}${extension}`.replace(new RegExp(`(${extension}){2,}`, "g"), extension);
    };

    return (
        sourceCode
            // replace imports from directories with index.js (mixins are generating them)
            .replace(/import\("([./]+)"\)/g, `import("$1/index${extension}")`)
            // replace imports and exports with js extensions
            .replace(/((?:import|export)\s+(?:(?!;)[\s\S])*?\bfrom\s*["'])([^"']+)(["'];)/g, (_match, prefix, specifier, suffix) => `${prefix}${addExtension(specifier)}${suffix}`)
            .replace(/(import\s*["'])([^"']+)(["'];)/g, (_match, prefix, specifier, suffix) => `${prefix}${addExtension(specifier)}${suffix}`)
            .replace(/((?:import|export)\(["'])([^"']+)(["']\))/g, (_match, prefix, specifier, suffix) => `${prefix}${addExtension(specifier)}${suffix}`)
            // also declare module imports
            .replace(/(declare module ["'])([^"']+)(["'])/g, (_match, prefix, specifier, suffix) => `${prefix}${addExtension(specifier)}${suffix}`)
            .replace(new RegExp(`(${extension}){2,}`, "g"), extension)
    );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function addJsExtensionsToCompiledFiles(files: string[], forceMJS: boolean) {
    const isVerbose = checkArgs("--verbose", true);
    files.forEach((file: string) => {
        isVerbose && console.log(`Processing ${file}`);
        const sourceCode = fs.readFileSync(file, "utf-8");
        const processed = ProcessSource(sourceCode, forceMJS);

        const regex = /(?:import|export)\s+(?:(?!;)[\s\S])*?\bfrom\s*"(\..*?)";/g;
        let match;
        while ((match = regex.exec(processed)) !== null) {
            if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) {
                console.log(file, path.resolve(path.dirname(file), match[1]));
                throw new Error(`File ${match[1]} does not exist. Are you importing from an index/directory?`);
            }
        }
        const dynamicRegex = /import\("(\..*?)"\)/g;
        while ((match = dynamicRegex.exec(processed)) !== null) {
            if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) {
                console.log(file, path.resolve(path.dirname(file), match[1]));
                throw new Error(`File ${match[1]} does not exist. Are you dynamically importing from an index/directory?`);
            }
        }
        fs.writeFileSync(file, processed);
    });
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const addJsExtensionsToCompiledFilesCommand = () => {
    let pathForFiles = checkArgs(["--path-of-sources", "-pos"], false, true);
    const forceMJS = !!checkArgs("--mjs", true);
    if (!pathForFiles) {
        pathForFiles = "./**/*.{js,d.ts}";
        console.log("No path specified, using default: " + pathForFiles);
    }
    if (typeof pathForFiles === "string") {
        console.log(`Adding .js extensions to files in ${pathForFiles}`);
        addJsExtensionsToCompiledFiles(globSync(pathForFiles), forceMJS);
    }
};
