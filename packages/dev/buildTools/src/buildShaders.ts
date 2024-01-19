/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import { checkDirectorySync, checkArgs, getHashOfFile, getHashOfContent } from "./utils.js";
// import * as glob from "glob";
// import * as chokidar from "chokidar";
// import { DevPackageName } from "./packageMapping";
/**
 * This module is used to build shaders.
 * Arguments:
 * * --isCore - defines that the shaders are part of the core library
 * * --package Package name - from which package should the core shaders be loaded. Defaults to @dev/core
 */

/**
 * Template creating hidden ts file containing the shaders.
 * When moving to pure es6 we will need to remove the Shader assignment
 */
const tsShaderTemplate = `// Do not edit.
import { ShaderStore } from "##SHADERSTORELOCATION_PLACEHOLDER##";
##INCLUDES_PLACEHOLDER##
const name = "##NAME_PLACEHOLDER##";
const shader = \`##SHADER_PLACEHOLDER##\`;
// Sideeffect
ShaderStore.##SHADERSTORE_PLACEHOLDER##[name] = shader;
##EXPORT_PLACEHOLDER##
`;

/**
 * Get the shaders name from their path.
 * @param filename
 * @returns the shader name
 */
function getShaderName(filename: string) {
    const parts = filename.split(".");
    if (parts[1] !== "fx") {
        return parts[0] + (parts[1] === "fragment" ? "Pixel" : parts[1] === "compute" ? "Compute" : "Vertex") + "Shader";
    } else {
        return parts[0];
    }
}

/**
 * Get the shaders included in the current one to generate to proper imports.
 * @param sourceCode
 * @returns the includes
 */
function getIncludes(sourceCode: string) {
    const regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
    let match = regex.exec(sourceCode);

    const includes = new Set();

    while (match != null) {
        let includeFile = match[1];

        // Uniform declaration
        if (includeFile.indexOf("__decl__") !== -1) {
            includeFile = includeFile.replace(/__decl__/, "");

            // Add non UBO import
            const noUBOFile = includeFile + "Declaration";
            includes.add(noUBOFile);

            includeFile = includeFile.replace(/Vertex/, "Ubo");
            includeFile = includeFile.replace(/Fragment/, "Ubo");
            const uBOFile = includeFile + "Declaration";
            includes.add(uBOFile);
        } else {
            includes.add(includeFile);
        }

        match = regex.exec(sourceCode);
    }

    return includes;
}

/**
 * Generate a ts file per shader file.
 * @param filePath
 * @param basePackageName
 * @param isCore
 */
export function buildShader(filePath: string, basePackageName: string = "core", isCore?: boolean | string) {
    const isVerbose = checkArgs("--verbose", true);
    isVerbose && console.log("Generating shaders for " + filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const filename = path.basename(filePath);
    const normalized = path.normalize(filePath);
    const directory = path.dirname(normalized);
    const shaderName = getShaderName(filename);
    const tsFilename = filename.replace(".fx", ".ts").replace(".wgsl", ".ts");
    const isWGSL = directory.indexOf("ShadersWGSL") > -1;
    const appendDirName = isWGSL ? "WGSL" : "";
    let fxData = content.toString();

    if (checkArgs("--global", true)) {
        isCore = filePath.includes(path.sep + "core" + path.sep) || filePath.includes("/core/");
    }

    // Remove Trailing whitespace...
    fxData = fxData
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/(\/\/)+.*$/gm, "")
        .replace(/\t+/gm, " ")
        .replace(/^\s+/gm, "")
        // eslint-disable-next-line no-useless-escape
        .replace(/ ([\*\/\=\+\-\>\<]+) /g, "$1")
        .replace(/,[ ]/g, ",")
        .replace(/ {1,}/g, " ")
        // .replace(/;\s*/g, ";")
        .replace(/^#(.*)/gm, "#$1\n")
        .replace(/\{\n([^#])/g, "{$1")
        .replace(/\n\}/g, "}")
        .replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, "")
        .replace(/;\n([^#])/g, ";$1");

    // Generate imports for includes.
    let includeText = "";
    const includes = getIncludes(fxData);
    includes.forEach((entry) => {
        if (isCore) {
            includeText =
                includeText +
                `import "./ShadersInclude/${entry}";
`;
        } else {
            includeText =
                includeText +
                `import "${basePackageName}/Shaders/ShadersInclude/${entry}";
`;
        }
    });

    // Chose shader store.
    const isInclude = directory.indexOf("ShadersInclude") > -1;
    const shaderStore = isInclude ? `IncludesShadersStore${appendDirName}` : `ShadersStore${appendDirName}`;
    let shaderStoreLocation;
    if (isCore) {
        if (isInclude) {
            shaderStoreLocation = "../../Engines/shaderStore";
            includeText = includeText.replace(/ShadersInclude\//g, "");
        } else {
            shaderStoreLocation = "../Engines/shaderStore";
        }
    } else {
        shaderStoreLocation = basePackageName + "/Engines/shaderStore";
    }

    // Fill template in.
    let tsContent = tsShaderTemplate.replace("##SHADERSTORELOCATION_PLACEHOLDER##", shaderStoreLocation);
    tsContent = tsContent.replace("##INCLUDES_PLACEHOLDER##", includeText);
    tsContent = tsContent.replace("##NAME_PLACEHOLDER##", shaderName);
    tsContent = tsContent.replace("##SHADER_PLACEHOLDER##", fxData);
    tsContent = tsContent.replace("##SHADERSTORE_PLACEHOLDER##", shaderStore);
    tsContent = tsContent.replace(
        "##EXPORT_PLACEHOLDER##",
        `/** @internal */
export const ${shaderName} = { name, shader };`
    );

    // Go to disk.
    const tsShaderFilename = path.join(directory /*.replace("src", "dist")*/, tsFilename);
    checkDirectorySync(path.dirname(tsShaderFilename));
    // check hash
    if (fs.existsSync(tsShaderFilename)) {
        const hash = getHashOfFile(tsShaderFilename);
        const newHash = getHashOfContent(tsContent);
        if (hash === newHash) {
            return;
        }
    }
    fs.writeFileSync(tsShaderFilename, tsContent);
    isVerbose && console.log("Generated " + tsShaderFilename);
}

// export const buildShaders = () => {
//     const isCore = checkArgs("--isCore", true);
//     const global = checkArgs("--global", true);
//     // global watch - watch all files in dev
//     const globDirectory = global ? `./packages/dev/**/*.fx` : `./src/**/*.fx`;
//     let basePackageName: DevPackageName = "core";
//     if (!isCore) {
//         const cliPackage = checkArgs("--package", false, true);
//         if (cliPackage) {
//             basePackageName = cliPackage as DevPackageName;
//         }
//     }
//     const files = glob.sync(globDirectory);
//     files.forEach((file: string) => {
//         buildShader(file, basePackageName, isCore);
//     });

//     if (checkArgs("--watch", true)) {
//         chokidar.watch(globDirectory, { ignoreInitial: true, awaitWriteFinish: true }).on("all", (_event, path) => {
//             if (_event === "add") {
//                 // check the date on both compiled and source files
//                 const compiledFile = path.replace(".fx", ".ts");
//                 if (fs.statSync(compiledFile).mtime > fs.statSync(path).mtime) {
//                     return;
//                 }
//             }
//             console.log("file changed", path);
//             buildShader(path, basePackageName, isCore);
//         });
//     }
// };
