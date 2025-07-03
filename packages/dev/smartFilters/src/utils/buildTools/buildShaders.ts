/**
 * Builds all .glsl files under <shaderPath>.
 * @param shaderPath - The path to the shaders to watch
 * @param importPath - The path to import the converted shaders
 * @example node buildShaders.js <shaderPath> <importPath>
 */

import { ConvertShaders } from "./convertShaders.js";

const ExternalArguments = process.argv.slice(2);
if (ExternalArguments.length >= 2 && ExternalArguments[0] && ExternalArguments[1]) {
    ConvertShaders(ExternalArguments[0], ExternalArguments[1]);
}
