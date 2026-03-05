import { watch } from "chokidar";
import { extname } from "path";
import { ConvertShader } from "./convertShaders.js";
import { initLogger, log, error } from "./buildToolsLogger.js";

await initLogger();

const ExternalArguments = process.argv.slice(2);
if (ExternalArguments.length >= 2 && ExternalArguments[0] && ExternalArguments[1]) {
    const shaderPath = ExternalArguments[0];
    const smartFiltersCorePath = ExternalArguments[1];
    const babylonCorePath = ExternalArguments[2];

    watch(shaderPath).on("all", (event, file) => {
        // Only process file changes and added files
        if (event !== "change" && event !== "add") {
            return;
        }

        // Only process .glsl files
        if (extname(file) !== ".glsl") {
            return;
        }

        log(`Change detected. Starting conversion...`);

        // Wrap in try-catch to prevent the watcher from crashing
        // if the new shader changes are invalid
        try {
            ConvertShader(file, smartFiltersCorePath, babylonCorePath);
            log(`Successfully updated shader ${file}`);
        } catch (err) {
            error(`Failed to convert shader ${file}: ${err}`);
        }

        log(`Watching for changes in ${shaderPath}...`);
    });
}
