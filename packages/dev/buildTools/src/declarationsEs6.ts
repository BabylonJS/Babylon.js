import { checkArgs } from "./utils.js";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const declarationsEs6 = () => {
    const root = checkArgs(["--root", "-r"]) as string;
    const appendToFile = checkArgs(["--append-to-file", "-atf"]) as string;
    const constEnumToEnum = checkArgs(["--const-enum-to-enum", "-cete"]) as boolean;
    // eslint-disable-next-line no-console
    console.log(`Declarations ES6: root: ${root}`, appendToFile ? `append to file: ${appendToFile}` : "");

    const fileContent = fs.readFileSync(path.join(".", appendToFile), "utf8");
    const mixins = globSync(path.join(root, "**/*.d.ts"), {
        windowsPathsNoEscape: true,
    })
        .map((file) => {
            return fs.readFileSync(file, "utf8");
        })
        .join("\n")
        .replace(/declare /g, "");
    const newContent = `
${fileContent}
// Mixins
declare global{
${mixins}
}`;
    fs.writeFileSync(path.join(".", appendToFile), newContent);

    if (constEnumToEnum) {
        // iterate over all files in the current directory and change const enum to enum
        // This can be done since we are exporting the enums to js as well
        const files = globSync(path.join("./**/*.d.ts"), {
            windowsPathsNoEscape: true,
        });

        files.forEach((file) => {
            let content = fs.readFileSync(file, "utf8");
            content = content.replace(/const enum/g, "enum");
            fs.writeFileSync(file, content);
        });
    }
};
