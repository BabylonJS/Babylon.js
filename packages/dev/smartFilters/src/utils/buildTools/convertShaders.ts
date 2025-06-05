import * as fs from "fs";
import * as path from "path";
import { Logger } from "core/Misc/logger.js";
import { ConvertGlslIntoShaderProgram } from "./convertGlslIntoShaderProgram.js";
import { ConvertGlslIntoBlock } from "./convertGlslIntoBlock.js";

/**
 * Converts all GLSL files in a path into blocks for use in the build system.
 * @param shaderPath - The path to the .glsl files to convert.
 * @param importPath - The path to import the ShaderProgram type from.
 */
export function ConvertShaders(shaderPath: string, importPath: string) {
    // Get all files in the path
    const allFiles = fs.readdirSync(shaderPath, { withFileTypes: true, recursive: true });

    // Find all shaders (files with .fragment.glsl or .block.glsl extensions)
    const shaderFiles = allFiles.filter((file) => file.isFile() && (file.name.endsWith(".fragment.glsl") || file.name.endsWith(".block.glsl")));

    // Convert all shaders
    for (const shaderFile of shaderFiles) {
        const fullPathAndFileName = path.join(shaderFile.path, shaderFile.name);
        ConvertShader(fullPathAndFileName, importPath);
    }
}

/**
 * Converts a single GLSL file into a block class or a ShaderProgram for use in the build system.
 * @param fullPathAndFileName - The full path and file name of the .glsl file to convert.
 * @param importPath - The path to import the ShaderProgram type from.
 */
export function ConvertShader(fullPathAndFileName: string, importPath: string): void {
    Logger.Log(`\nProcessing shader: ${fullPathAndFileName}`);

    if (fullPathAndFileName.endsWith(".fragment.glsl")) {
        Logger.Log("Generating a .ts file that exports a ShaderProgram.");
        ConvertGlslIntoShaderProgram(fullPathAndFileName, importPath);
    } else if (fullPathAndFileName.endsWith(".block.glsl")) {
        Logger.Log("Generating a .ts file that exports the block as a class.");
        ConvertGlslIntoBlock(fullPathAndFileName, importPath);
    }
}
