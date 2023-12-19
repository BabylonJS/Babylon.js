/* eslint-disable no-console */
import * as path from "path";
import * as glob from "glob";
import * as fs from "fs-extra";
import { checkArgs } from "./utils.js";

export const prepareES6Build = async () => {
    const baseDir = path.resolve(".");
    const constFile = checkArgs(["--constFile", "-cf"], false, true);
    try {
        if (constFile) {
            const constantsContent = fs.readFileSync(path.resolve(baseDir, constFile as string), "utf8").replace("export class Constants", "const Constants = ");
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const Constants = eval(constantsContent + "\nConstants;");
            const allSourceFiles = glob.sync(path.resolve(baseDir, "**", "*.js"));
            allSourceFiles.forEach((file) => {
                if (file.endsWith(constFile as string)) {
                    return;
                }
                const fileContent = fs.readFileSync(file, "utf8");
                const regexImport = /import { Constants } from .*;/g;
                let sourceCode = fileContent.replace(regexImport, "");

                const regexConstant = /(?<![_0-9a-zA-Z])Constants\.([_0-9a-zA-Z]*)/g;
                let match = regexConstant.exec(sourceCode);
                const constantList = [];
                while (match) {
                    const constantName = match[1];
                    if (constantName && constantName.length > 1) {
                        constantList.push(constantName);
                    }
                    match = regexConstant.exec(sourceCode);
                }

                for (const constant of constantList) {
                    const regex = new RegExp(`(?<![_0-9a-zA-Z])Constants\.${constant}(?![_0-9a-zA-Z])`, "g");
                    const value = Constants[constant];
                    if (typeof value === "string") {
                        sourceCode = sourceCode.replace(regex, "`" + value + "`");
                    } else {
                        sourceCode = sourceCode.replace(regex, value);
                    }
                }
                fs.writeFileSync(file, sourceCode);
            });
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
