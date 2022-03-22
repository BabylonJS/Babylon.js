import * as glob from "glob";
import * as path from "path";
import { copyFile, checkArgs } from "./utils";
import * as chokidar from "chokidar";
import type { DevPackageName } from "./packageMapping";
import { buildShader } from "./buildShaders";

const processFile = (file: string, options: { isCore?: boolean; basePackageName?: DevPackageName } = {}) => {
    if (path.extname(file) === ".fx") {
        buildShader(file, options.basePackageName, options.isCore);
    } else {
        // support windows path with "\\" instead of "/"
        copyFile(file, file.replace(/src([/\\])/, "dist$1"), true);
    }
};

export const processAssets = (options: { extensions: string[] } = { extensions: ["png", "jpg", "jpeg", "gif", "svg", "scss", "css", "html", "json", "fx"] }) => {
    const global = checkArgs("--global", true);
    const fileTypes = checkArgs(["--file-types", "-ft"], false, true);
    const extensions = fileTypes && typeof fileTypes === "string" ? fileTypes.split(",") : options.extensions;
    const globDirectory = global ? `./packages/**/*/src/**/*.+(${extensions.join("|")})` : `./src/**/*.+(${extensions.join("|")})`;
    const isCore = !!checkArgs("--isCore", true);
    let basePackageName: DevPackageName = "core";
    if (!isCore) {
        const cliPackage = checkArgs("--package", false, true);
        if (cliPackage) {
            basePackageName = cliPackage as DevPackageName;
        }
    }
    const processOptions = { isCore, basePackageName };
    // this script copies all assets (anything other than .ts?x) from the "src" folder to the "dist" folder
    console.log(`Processing assets from ${globDirectory}`);
    glob(globDirectory, (err, files) => {
        if (err) {
            console.log(err);
        } else {
            files.forEach((file) => {
                processFile(file, processOptions);
            });
        }
    });

    if (checkArgs("--watch", true)) {
        // support windows path with "\\" instead of "/"
        chokidar.watch(globDirectory, { ignoreInitial: true, awaitWriteFinish: true }).on("all", (_event, file) => {
            processFile(file, processOptions);
        });
        console.log("watching for asset changes...");
    }
};
