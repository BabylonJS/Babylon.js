/**
 * Builds all .glsl files under <shaderPath>.
 * @param shaderPath - The path to the shaders to watch
 * @param smartFiltersCorePath - The path to import the Smart Filters core from
 * @param babylonCorePath - The path to import the Babylon core from (optional)
 * @example node buildShaders.js <shaderPath> @babylonjs/smart-filters
 */

import { ConvertShaders } from "./convertShaders.js";
import { initLogger } from "./buildToolsLogger.js";

await (async () => {
    await initLogger();

    const externalArguments = process.argv.slice(2);
    if (externalArguments.length >= 2 && externalArguments[0] && externalArguments[1]) {
        ConvertShaders(externalArguments[0], externalArguments[1], externalArguments[2]);
    }
})();
