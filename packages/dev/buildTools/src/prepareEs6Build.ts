/* eslint-disable no-console */
// During the ES6 build this function inlines all Constants values directly into the JS files
// This is an optimization to avoid shipping our Constants.ts file, which has a significant size (20+KB)
// This function only handles dot access and assumes no dynamic property access (Constants["X"]);

import * as path from "path";
import { globSync } from "glob";
import * as fs from "fs-extra";
import { checkArgs } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax, jsdoc/require-jsdoc
export const prepareES6Build = async (): Promise<void> => {
    const baseDir = path.resolve(".");

    // Parse command line args for an optional constants file path (our Constants.ts)
    const constFile = checkArgs(["--constFile", "-cf"], false, true);

    try {
        if (constFile && typeof constFile === "string") {
            // Transform our Constants class into an object literal and eval it
            const constFilePath = path.resolve(baseDir, constFile);
            const constantsContent = fs.readFileSync(constFilePath, "utf8").replace("export class Constants", "const Constants = ");
            const constantsObject = eval(constantsContent + "\nConstants;");

            // Gather all .js source files so we can inline constant values
            const allSourceFiles = globSync(path.resolve(baseDir, "**", "*.js"), {
                windowsPathsNoEscape: true,
            });

            allSourceFiles.forEach((file) => {
                // Skip the constants file itself
                if (path.resolve(file) === constFilePath) {
                    return;
                }

                // Read file content and remove any import of Constants since we will inline Constants usages
                const fileContent = fs.readFileSync(file, "utf8");
                const regexImport = /import { Constants } from .*;/g;
                let sourceCode = fileContent.replace(regexImport, "");

                // Locate all occurrences of Constants.<NAME> using a negative lookbehind to avoid matching to something like MyConstants.<NAME>
                const regexConstant = /(?<![_0-9a-zA-Z])Constants\.([_0-9a-zA-Z]*)/g;
                let match = regexConstant.exec(sourceCode);
                const constantList: string[] = [];
                while (match) {
                    const constantName = match[1];
                    if (constantName && constantName.length > 1) {
                        constantList.push(constantName);
                    }
                    match = regexConstant.exec(sourceCode);
                }

                // Replace each reference with its literal value
                // Strings become template literals to handle quotes, backslashes, and other special characters
                for (const constant of constantList) {
                    // Same regex again, but this time with the exact constant name to replace
                    const regex = new RegExp(`(?<![_0-9a-zA-Z])Constants.${constant}(?![_0-9a-zA-Z])`, "g");
                    const value = constantsObject[constant];
                    if (typeof value === "string") {
                        sourceCode = sourceCode.replace(regex, "`" + value + "`");
                    } else {
                        sourceCode = sourceCode.replace(regex, String(value));
                    }
                }

                // Write back the modified source file
                fs.writeFileSync(file, sourceCode);
            });
        }
    } catch (e) {
        // Log and exit on errors so upstream build scripts can detect failure
        console.log(e);
        process.exit(1);
    }
};
