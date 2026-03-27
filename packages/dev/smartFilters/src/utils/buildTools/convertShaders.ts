import * as fs from "fs";
import * as path from "path";
import { ConvertGlslIntoShaderProgram } from "./convertGlslIntoShaderProgram.js";
import { ConvertGlslIntoBlock } from "./convertGlslIntoBlock.js";
import { log, error } from "./buildToolsLogger.js";

/**
 * Converts all GLSL files in a path into blocks for use in the build system.
 * @param shaderPath - The path to the .glsl files to convert, or a single .glsl file.
 * @param smartFiltersCorePath - The path to import the Smart Filters core from.
 * @param babylonCorePath - The path to import the Babylon core from (optional).

 */
export function ConvertShaders(shaderPath: string, smartFiltersCorePath: string, babylonCorePath?: string) {
    const stats = fs.statSync(shaderPath);

    let shaderFiles: fs.Dirent[];

    if (stats.isFile()) {
        // If it's a file, create a Dirent-like object for consistency
        const fileName = path.basename(shaderPath);
        const dirPath = path.dirname(shaderPath);
        shaderFiles = [
            {
                name: fileName,
                parentPath: dirPath,
                isFile: () => true,
                isDirectory: () => false,
            } as unknown as fs.Dirent,
        ];
    } else if (stats.isDirectory()) {
        // Get all files in the directory
        const allFiles = fs.readdirSync(shaderPath, { withFileTypes: true, recursive: true });

        // Find all shaders (files with .fragment.glsl or .block.glsl extensions)
        shaderFiles = allFiles.filter((file) => file.isFile() && (file.name.endsWith(".fragment.glsl") || file.name.endsWith(".block.glsl")));
    } else {
        error(`Error: ${shaderPath} is neither a file nor a directory.`);
        return;
    }

    // Convert all shaders
    for (const shaderFile of shaderFiles) {
        const fullPathAndFileName = path.join(shaderFile.parentPath, shaderFile.name);
        ConvertShader(fullPathAndFileName, smartFiltersCorePath, babylonCorePath);
    }
}

/**
 * Converts a single GLSL file into a block class or a ShaderProgram for use in the build system.
 * @param fullPathAndFileName - The full path and file name of the .glsl file to convert.
 * @param smartFiltersCorePath - The path to import the Smart Filters core from.
 * @param babylonCorePath - The path to import the Babylon core from (optional).
 */
export function ConvertShader(fullPathAndFileName: string, smartFiltersCorePath: string, babylonCorePath?: string): void {
    log(`\nProcessing shader: ${fullPathAndFileName}`);

    if (fullPathAndFileName.endsWith(".fragment.glsl")) {
        log("Generating a .ts file that exports a ShaderProgram.");
        ConvertGlslIntoShaderProgram(fullPathAndFileName, smartFiltersCorePath);
    } else if (fullPathAndFileName.endsWith(".block.glsl")) {
        log("Generating a .ts file that exports the block as a class.");
        ConvertGlslIntoBlock(fullPathAndFileName, smartFiltersCorePath, babylonCorePath);
    }
}
