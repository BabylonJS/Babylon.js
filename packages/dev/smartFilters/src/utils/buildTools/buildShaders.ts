/* eslint-disable no-console */

/**
 * Converts .glsl files into Smart Filter ShaderBlock .ts files
 * If the first argument is a single file, converts that file.
 * If the first argument is a directory, converts all .glsl files under that directory.
 * @param shaderPath - The path to a single shader file or directory containing shaders to convert
 * @param smartFiltersCorePath - The path to import \@babylonjs/smart-filters from
 * @param babylonCorePath - The path to import \@babylonjs/core from (optional)
 * @example node buildShaders.js <shaderPath> <importPath>
 */

import * as fs from "fs";
import { ConvertShaders, ConvertShader } from "./convertShaders.js";

const ExternalArguments = process.argv.slice(2);
if (ExternalArguments.length >= 2 && ExternalArguments[0] && ExternalArguments[1]) {
    const shaderPath = ExternalArguments[0];
    const smartFiltersCorePath = ExternalArguments[1];
    const babylonCorePath = ExternalArguments[2];

    try {
        const stats = fs.statSync(shaderPath);

        if (stats.isFile()) {
            // Single file - use ConvertShader
            ConvertShader(shaderPath, smartFiltersCorePath, babylonCorePath);
        } else if (stats.isDirectory()) {
            // Directory - use ConvertShaders
            ConvertShaders(shaderPath, smartFiltersCorePath, babylonCorePath);
        } else {
            console.error(`Error: ${shaderPath} is neither a file nor a directory.`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`Error accessing ${shaderPath}: ${error}`);
        process.exit(1);
    }
}
