/* eslint-disable no-console */
/**
 * Watches all .glsl files under <shaderPath> and rebuilds them when changed.
 * @param shaderPath - The path to the shaders to watch
 * @param importPath - The path to import the converted shaders
 * @example node watchShaders.js <shaderPath> <importPath>
 */

import { watch } from "chokidar";
import { extname } from "path";
import { ConvertShader } from "./convertShaders";

const ExternalArguments = process.argv.slice(2);
if (ExternalArguments.length >= 2 && ExternalArguments[0] && ExternalArguments[1]) {
    const shaderPath = ExternalArguments[0];
    const importPath = ExternalArguments[1];

    watch(shaderPath).on("all", (event, file) => {
        // Only process file changes and added files
        if (event !== "change" && event !== "add") {
            return;
        }

        // Only process .glsl files
        if (extname(file) !== ".glsl") {
            return;
        }

        console.log(`Change detected. Starting conversion...`);

        // Wrap in try-catch to prevent the watcher from crashing
        // if the new shader changes are invalid
        try {
            ConvertShader(file, importPath);
            console.log(`Successfully updated shader ${file}`);
        } catch (error) {
            console.error(`Failed to convert shader ${file}: ${error}`);
        }

        console.log(`Watching for changes in ${shaderPath}...`);
    });
}
