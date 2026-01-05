/* eslint-disable no-console */
/**
 * Watches all .glsl files under <shaderPath> and rebuilds them when changed.
 * @param shaderPath - The path to the shaders to watch
 * @param smartFiltersCorePath - The path to import the Smart Filters core from
 * @param babylonCorePath - The path to import the Babylon core from (optional)
 * @example node watchShaders.js <shaderPath> @babylonjs/smart-filters
 */

import { watch } from "chokidar";
import { extname } from "path";
import { ConvertShader } from "./convertShaders.js";

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

        console.log(`Change detected. Starting conversion...`);

        // Wrap in try-catch to prevent the watcher from crashing
        // if the new shader changes are invalid
        try {
            ConvertShader(file, smartFiltersCorePath, babylonCorePath);
            console.log(`Successfully updated shader ${file}`);
        } catch (error) {
            console.error(`Failed to convert shader ${file}: ${error}`);
        }

        console.log(`Watching for changes in ${shaderPath}...`);
    });
}
