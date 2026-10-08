/* eslint-disable no-console */
import { globSync } from "glob";
import * as path from "path";
import { copyFile, checkArgs } from "./utils.js";
import * as chokidar from "chokidar";
import { type DevPackageName } from "./packageMapping.js";
import { BuildShader } from "./buildShaders.js";

const ProcessFile = (file: string, options: { isCore?: boolean; basePackageName?: DevPackageName; pathPrefix?: string; outputDir?: string } = {}) => {
    file = file.replace(/\\/g, "/");
    if (!options.outputDir) {
        options.outputDir = "dist";
    }
    if (path.extname(file) === ".fx") {
        BuildShader(file, options.basePackageName, options.isCore);
    } else {
        if (options.pathPrefix) {
            const regex = new RegExp(`${options.pathPrefix.replace(/\//g, "\\/")}src([/\\\\])`);
            copyFile(file, file.replace(regex, `${options.outputDir}$1`), true, true);
        } else {
            copyFile(file, file.replace(/src([/\\])/, `${options.outputDir}$1`), true, true);
        }
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const processAssets = (options: { extensions: string[] } = { extensions: ["png", "jpg", "jpeg", "gif", "svg", "scss", "css", "html", "json", "fx"] }) => {
    const global = checkArgs("--global", true);
    const fileTypes = checkArgs(["--file-types", "-ft"], false, true);
    const extensions = fileTypes && typeof fileTypes === "string" ? fileTypes.split(",") : options.extensions;
    const pathPrefix = ((checkArgs("--path-prefix", false, true) as string) || "").replace(/\\/g, "/");
    const globDirectory = global ? `./packages/**/*/src/**/*.+(${extensions.join("|")})` : pathPrefix + `src/**/*.+(${extensions.join("|")})`;
    const isCore = !!checkArgs("--isCore", true);
    const outputDir = checkArgs(["--output-dir"], false, true) as string;
    const verbose = checkArgs("--verbose", true);
    let basePackageName: DevPackageName | undefined;
    if (!isCore) {
        const cliPackage = checkArgs("--package", false, true);
        if (cliPackage) {
            basePackageName = cliPackage as DevPackageName;
        }
    }
    const processOptions = { isCore, basePackageName, pathPrefix, outputDir };
    // this script copies all assets (anything other than .ts?x) from the "src" folder to the "dist" folder
    console.log(`Processing assets from ${globDirectory}`);

    if (checkArgs("--watch", true)) {
        const matchesAsset = (file: string) => {
            const segments = file.replace(/\\/g, "/").split("/");
            return (!global || segments.includes("src")) && extensions.includes(path.extname(file).slice(1));
        };
        // support windows path with "\\" instead of "/"
        chokidar
            .watch(global ? "./packages" : pathPrefix + "src", {
                ignored: (file, stats) => {
                    const segments = file.replace(/\\/g, "/").split("/");
                    if (!segments.includes("src") && (segments.includes("node_modules") || segments.includes("dist"))) {
                        return true;
                    }
                    return !!stats?.isFile() && !matchesAsset(file);
                },
                ignoreInitial: false,
                awaitWriteFinish: {
                    stabilityThreshold: 1000,
                    pollInterval: 300,
                },
                alwaysStat: true,
                interval: 300,
                binaryInterval: 600,
            })
            .on("all", (event, file) => {
                // don't track directory changes
                if ((event !== "add" && event !== "change") || !matchesAsset(file)) {
                    return;
                }
                let verb: string;
                switch (event) {
                    case "add":
                        verb = "Initializing";
                        break;
                    case "change":
                        verb = "Changing";
                        break;
                }
                verbose && console.log(`${verb} asset: ${file}`);
                try {
                    ProcessFile(file, processOptions);
                } catch (e: any) {
                    if (e.code === "ENOENT") {
                        verbose && console.log(`File no longer exists, skipping: ${file}`);
                    } else {
                        console.error(`Error processing asset ${file}:`, e.message);
                    }
                }
            })
            .on("error", (error: unknown) => {
                if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                    verbose && console.log(`Watcher target no longer exists: ${"path" in error ? error.path : error.message}`);
                } else {
                    console.error("Watcher error:", error instanceof Error ? error.message : error);
                }
            });
        console.log("watching for asset changes...");
    } else {
        globSync(globDirectory, {
            windowsPathsNoEscape: true,
        }).forEach((file) => {
            ProcessFile(file, processOptions);
        });
    }
};
