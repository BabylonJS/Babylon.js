#!/usr/bin/env node
import { addJsExtensionsToCompiledFilesCommand } from "./addJSToCompiledFiles";
// import { buildShaders } from "./buildShaders";
import { generateDeclaration } from "./generateDeclaration";
import { transformLtsCommand } from "./ltsTransformer";
import { prepareES6Build } from "./prepareEs6Build";
import { checkArgs, populateEnvironment } from "./utils";
import { devWatch } from "./devWatcher";
import { processAssets } from "./copyAssets";
import { prepareSnapshot } from "./prepareSnapshot";
import { umdPackageMapping } from "./packageMapping";
import { updateEngineVersion } from "./updateEngineVersion";

runCommand();

function runCommand() {
    const command = checkArgs(["-c", "--command"], false, true);
    if (command) {
        console.log("Babylon.js build tools");
        console.log(`Command: ${command}`);
        switch (command) {
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
                prepareES6Build();
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
                updateEngineVersion();
                break;
            default:
                console.log(`Unknown command: ${command}`);
                break;
        }
    }
}

// public API
import transformer from "./pathTransform";
import * as webpackTools from "./webpackTools";
export { transformer, webpackTools, checkArgs, umdPackageMapping, populateEnvironment };
