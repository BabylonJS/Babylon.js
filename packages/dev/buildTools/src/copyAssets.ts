import * as glob from "glob";
import * as path from "path";
import { copyFile, checkArgs } from "./utils";
import * as chokidar from "chokidar";
import type { DevPackageName } from "./packageMapping";
import { buildShader } from "./buildShaders";

const processFile = (file: string, options: { isCore?: boolean; basePackageName?: DevPackageName; pathPrefix?: string } = {}) => {
    if (path.extname(file) === ".fx") {
        buildShader(file, options.basePackageName, options.isCore);
    } else {
        if (options.pathPrefix) {
            const regex = new RegExp(`${options.pathPrefix.replace(/\//g, "\\/")}./src([/\\\\])`);
            copyFile(file, file.replace(regex, "./dist$1"), true, true);
        } else {
            copyFile(file, file.replace(/src([/\\])/, "dist$1"), true, true);
        }
        // support windows path with "\\" instead of "/"
    }
};

export const processAssets = (options: { extensions: string[] } = { extensions: ["png", "jpg", "jpeg", "gif", "svg", "scss", "css", "html", "json", "fx"] }) => {
    const global = checkArgs("--global", true);
    const fileTypes = checkArgs(["--file-types", "-ft"], false, true);
    const extensions = fileTypes && typeof fileTypes === "string" ? fileTypes.split(",") : options.extensions;
    const pathPrefix = (checkArgs("--path-prefix", false, true) as string) || "";
    const globDirectory = global ? `./packages/**/*/src/**/*.+(${extensions.join("|")})` : pathPrefix + `./src/**/*.+(${extensions.join("|")})`;
    const isCore = !!checkArgs("--isCore", true);
    let basePackageName: DevPackageName = "core";
    if (!isCore) {
        const cliPackage = checkArgs("--package", false, true);
        if (cliPackage) {
            basePackageName = cliPackage as DevPackageName;
        }
    }
    const processOptions = { isCore, basePackageName, pathPrefix };
    // this script copies all assets (anything other than .ts?x) from the "src" folder to the "dist" folder
    console.log(`Processing assets from ${globDirectory}`);

    if (checkArgs("--watch", true)) {
        // support windows path with "\\" instead of "/"
        chokidar
            .watch(globDirectory, {
                ignoreInitial: false,
                awaitWriteFinish: {
                    stabilityThreshold: 1000,
                    pollInterval: 200,
                },
                alwaysStat: true,
                interval: 300,
                binaryInterval: 600,
            })
            .on("all", (_event, file) => {
                processFile(file, processOptions);
            });
        console.log("watching for asset changes...");
    } else {
        glob(globDirectory, (err, files) => {
            if (err) {
                console.log(err);
            } else {
                files.forEach((file) => {
                    processFile(file, processOptions);
                });
            }
        });
    }
};
