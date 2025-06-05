/**
 * Builds all .glsl files under <shaderPath>.
 * @param shaderPath - The path to the shaders to watch
 * @param importPath - The path to import the converted shaders
 * @example node buildShaders.js <shaderPath> <importPath>
 */

import { convertShaders } from "./convertShaders.js";

const externalArguments = process.argv.slice(2);
if (externalArguments.length >= 2 && externalArguments[0] && externalArguments[1]) {
    convertShaders(externalArguments[0], externalArguments[1]);
}
