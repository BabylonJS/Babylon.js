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
import { declarationsEs6 } from "./declarationsEs6";
// public API
import transformer from "./pathTransform";
import * as webpackTools from "./webpackTools";

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
                updateEngineVersion();
                break;
            case "declarations-es6":
            case "des6":
                declarationsEs6();
                break;
            default:
                console.log(`Unknown command: ${command}`);
                break;
        }
    }
}

export { transformer, webpackTools, checkArgs, umdPackageMapping, populateEnvironment };
