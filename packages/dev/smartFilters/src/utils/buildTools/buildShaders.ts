/**
 * Builds all .glsl files under <shaderPath>.
 * @param shaderPath - The path to the shaders to watch
 * @param smartFiltersCorePath - The path to import the Smart Filters core from
 * @param babylonCorePath - The path to import the Babylon core from (optional)
 * @example node buildShaders.js <shaderPath> @babylonjs/smart-filters
 */

import { ConvertShaders } from "./convertShaders.js";

const ExternalArguments = process.argv.slice(2);
if (ExternalArguments.length >= 2 && ExternalArguments[0] && ExternalArguments[1]) {
    ConvertShaders(ExternalArguments[0], ExternalArguments[1], ExternalArguments[2]);
}
