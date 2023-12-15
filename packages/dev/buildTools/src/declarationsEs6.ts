import { checkArgs } from "./utils.js";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

export const declarationsEs6 = () => {
    const root = checkArgs(["--root", "-r"]) as string;
    const appendToFile = checkArgs(["--append-to-file", "-atf"]) as string;
    // eslint-disable-next-line no-console
    console.log(`Declarations ES6: root: ${root}`, appendToFile ? `append to file: ${appendToFile}` : "");

    const fileContent = fs.readFileSync(path.join(".", appendToFile), "utf8");
    const mixins = glob
        .sync(path.join(root, "**/*.d.ts"))
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
};
