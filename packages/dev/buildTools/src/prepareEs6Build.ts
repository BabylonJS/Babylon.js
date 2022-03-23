import * as mv from "mv";
import * as path from "path";
import * as glob from "glob";
import * as fs from "fs";
import { checkArgs, findRootDirectory, removeDir } from "./utils";

const moveDir = async (from: string, to: string) => {
    return new Promise<void>((resolve, reject) => {
        mv(from, to, { mkdirp: false, clobber: false }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const prepareES6Build = async () => {
    const baseDir = path.resolve(".");
    const constFile = checkArgs(["--constFile", "-cf"], false, true);
    try {
        if (constFile) {
            const constantsContent = fs.readFileSync(path.resolve(baseDir, "dist", constFile as string), "utf8").replace("export { Constants };", "Constants;");
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const Constants = eval(constantsContent);
            const allSourceFiles = glob.sync(path.resolve(baseDir, "dist", "**", "*.js"));
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
        process.exit(1);
    }
    // this script copies all files from dist to ../

    // first move to a temp folder
    const rootDir = findRootDirectory();
    removeDir(path.resolve(rootDir, ".temp"));
    await moveDir(path.resolve(baseDir, "dist"), path.resolve(rootDir, ".temp"));
    // then copy the files
    await moveDir(path.resolve(rootDir, ".temp"), path.resolve(baseDir));
};
