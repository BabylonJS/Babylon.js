#!/usr/bin/env node
/* eslint-disable no-console */
import { addJsExtensionsToCompiledFilesCommand } from "./addJSToCompiledFiles.js";
import { generateDeclaration } from "./generateDeclaration.js";
import { transformLtsCommand } from "./ltsTransformer.js";
import { prepareES6Build } from "./prepareEs6Build.js";
import { checkArgs, copyFolder, externalArgs, populateEnvironment } from "./utils.js";
import { devWatch } from "./devWatcher.js";
import { processAssets } from "./copyAssets.js";
import { prepareSnapshot } from "./prepareSnapshot.js";
import { umdPackageMapping } from "./packageMapping.js";
import { updateEngineVersion } from "./updateEngineVersion.js";
import { declarationsEs6 } from "./declarationsEs6.js";
// public API
import transformer from "./pathTransform.js";
import * as webpackTools from "./webpackTools.js";
import * as fs from "fs";
import * as path from "path";

const CliCommand = checkArgs(["-c", "--command"], false, true) as string;
RunCommand(CliCommand);

function ProcessConfigFile() {
    const baseDir = path.resolve(".");
    const configFile = (checkArgs(["-f", "--file"], false, true) as string) || "config.tasks.json";
    if (configFile) {
        console.log(`Processing config file: ${configFile}`);
        // read the json file using fs
        const config = JSON.parse(fs.readFileSync(path.resolve(baseDir, configFile), "utf8"));
        if (config) {
            if (config.commands) {
                for (const command of config.commands as { command: string; args?: string[] }[]) {
                    // populate the args
                    externalArgs.length = 0;
                    if (command.args) {
                        externalArgs.push(...command.args);
                    }
                    RunCommand(command.command);
                }
            }
        }
    }
}

function RunCommand(command: string) {
    if (command) {
        console.log("Babylon.js build tools");
        console.log(`Command: ${command}`);
        switch (command) {
            case "run-tasks":
            case "rt":
                ProcessConfigFile();
                break;
            case "add-js-to-es6":
            case "ajte":
                addJsExtensionsToCompiledFilesCommand();
                break;
            case "process-umd-declaration":
            case "pud":
                generateDeclaration();
                break;
            case "build-shaders":
            case "bs":
                processAssets({ extensions: ["fx"] });
                break;
            case "transform-lts":
            case "tlts":
                transformLtsCommand();
                break;
            case "prepare-es6-build":
            case "peb":
                // eslint-disable-next-line github/no-then
                prepareES6Build().catch((e) => {
                    console.error(e);
                    process.exit(1);
                });
                break;
            case "dev-watch":
            case "dw":
                devWatch();
                break;
            case "process-assets":
            case "pa":
                processAssets();
                break;
            case "prepare-snapshot":
            case "ps":
                prepareSnapshot();
                break;
            case "update-engine-version":
            case "uev":
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                updateEngineVersion();
                break;
            case "declarations-es6":
            case "des6":
                declarationsEs6();
                break;
            case "copy":
            case "cp":
                copyFolder(checkArgs(["-f", "--from"], false, true) as string, checkArgs(["-t", "--to"], false, true) as string);
                break;
            default:
                console.log(`Unknown command: ${command}`);
                break;
        }
    }
}

export { transformer, webpackTools, checkArgs, umdPackageMapping, populateEnvironment };
