/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import { checkDirectorySync, checkArgs, getHashOfFile, getHashOfContent } from "./utils.js";
import { type DevPackageName } from "./packageMapping.js";

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
 * Template for ShadersInclude files.
 * These self-register into ShaderStore (backwards compat for bare imports)
 * AND export { name, shader } as a named binding (for explicit named imports from main shaders).
 */
const TsShaderIncludeTemplate = `// Do not edit.
import { ShaderStore } from "##SHADERSTORELOCATION_PLACEHOLDER##";
##NESTED_INCLUDES_PLACEHOLDER##const name = "##NAME_PLACEHOLDER##";
const shader = \`##SHADER_PLACEHOLDER##\`;
// Sideeffect
if (!ShaderStore.##INCLUDESSTORE_PLACEHOLDER##[name]) {
    ShaderStore.##INCLUDESSTORE_PLACEHOLDER##[name] = shader;
}
##EXPORT_PLACEHOLDER##
`;

/**
 * Template for main shader files (fragment/vertex/compute).
 * Uses named imports for all transitively-needed includes and registers them explicitly.
 */
const TsShaderTemplate = `// Do not edit.
import { ShaderStore } from "##SHADERSTORELOCATION_PLACEHOLDER##";
##INCLUDES_PLACEHOLDER##
const name = "##NAME_PLACEHOLDER##";
const shader = \`##SHADER_PLACEHOLDER##\`;
// Sideeffect
if (!ShaderStore.##SHADERSTORE_PLACEHOLDER##[name]) {
    ShaderStore.##SHADERSTORE_PLACEHOLDER##[name] = shader;
}
##REGISTER_INCLUDES_PLACEHOLDER##
##EXPORT_PLACEHOLDER##
`;

/**
 * Get the shaders name from their path.
 * @param filename
 * @returns the shader name
 */
function GetShaderName(filename: string) {
    const parts = filename.split(".");
    if (parts[1] !== "fx") {
        return parts[0] + (parts[1] === "fragment" ? "Pixel" : parts[1] === "compute" ? "Compute" : "Vertex") + "Shader";
    } else {
        return parts[0];
    }
}

/**
 * Get the direct shader includes referenced in the source code.
 * @param sourceCode
 * @returns the includes (set of include names)
 */
function GetIncludes(sourceCode: string) {
    const regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
    let match = regex.exec(sourceCode);

    const includes = new Set<string>();

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
 * Resolve all transitive includes for a shader file by recursively scanning shader include source files.
 * Returns the full closure of include names needed (in dependency order — deps before dependents).
 * Checks both a local ShadersInclude directory and a core ShadersInclude directory.
 * @param directIncludes - direct includes from the main shader
 * @param localShadersIncludeDir - absolute path to the local ShadersInclude directory
 * @param coreShadersIncludeDir - absolute path to the core ShadersInclude directory (for cross-package resolution)
 * @param isWGSL - whether this is a WGSL shader
 * @returns ordered array of all transitive include names (original names, possibly with "core/" prefix)
 */
function GetTransitiveIncludesMultiDir(directIncludes: Set<string>, localShadersIncludeDir: string, coreShadersIncludeDir: string, isWGSL: boolean): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const extensions = isWGSL ? [".fx", ".wgsl"] : [".fx"];

    function resolveIncludeFilePath(includeName: string): string | undefined {
        for (const includeDir of [localShadersIncludeDir, coreShadersIncludeDir]) {
            if (!includeDir) {
                continue;
            }
            for (const extension of extensions) {
                const includeFilePath = path.join(includeDir, includeName + extension);
                if (fs.existsSync(includeFilePath)) {
                    return includeFilePath;
                }
            }
        }
        return undefined;
    }

    function visit(includeName: string) {
        // Strip any "core/" prefix for file resolution
        const resolvedName = includeName.replace(/^core\//, "");
        if (visited.has(resolvedName)) {
            return;
        }
        visited.add(resolvedName);

        // Try to read the source file for this include to find nested includes.
        // Check local directory first, then core.
        const includeFilePath = resolveIncludeFilePath(resolvedName);

        if (includeFilePath) {
            const includeSource = fs.readFileSync(includeFilePath, "utf8");
            const nestedIncludes = GetIncludes(includeSource);
            for (const nested of nestedIncludes) {
                visit(nested);
            }
        }

        // Add after visiting deps so dependencies come first
        result.push(includeName);
    }

    for (const inc of directIncludes) {
        visit(inc);
    }

    return result;
}

function IsFromPackage(packageName: DevPackageName, filePath: string): boolean {
    return filePath.includes(path.sep + packageName + path.sep) || filePath.includes(`/${packageName}/`);
}

function DetermineBasePackageNameForShaderInclude(shaderFilePath: string): string | undefined {
    // Handle addons package:
    // * Shaders for a given <addon> exist in "addons/src/<addon>/Shaders/" e.g., "addons/src/<addon>/Shaders/foo.fragment.fx"
    // * Corresponding include files exist in "addons/src/<addon>/Shaders/ShadersInclude/" e.g., "addons/src/<addon>/Shaders/ShadersInclude/fooFunctions.fx"
    // To ensure the generated imports have the correct path to their includes,
    // the final import used from the generated "foo.fragment.ts" is `import "../Shaders/ShadersInclude/fooFunctions";`
    // That resolves to "addons/src/<addon>/Shaders" + "../Shaders/ShadersInclude/fooFunctions", keeping the path relative to the addon itself.
    // Therefore, the final base package name for these addon includes can be ".."
    const isAddonShader = IsFromPackage("addons", shaderFilePath);
    if (isAddonShader) {
        return "..";
    }

    // Otherwise fallback to core for the base package name.
    return "core";
}

/**
 * Generate a ts file per shader file.
 * @param filePath
 * @param basePackageName
 * @param isCore
 */
export function BuildShader(filePath: string, basePackageName: string | undefined, isCore?: boolean | string) {
    const isVerbose = checkArgs("--verbose", true);
    isVerbose && console.log("Generating shaders for " + filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const filename = path.basename(filePath);
    const normalized = path.normalize(filePath);
    const directory = path.dirname(normalized);
    // Treat a shader as WGSL if any path segment is exactly "wgsl" (case-insensitive,
    // covering the per-material `wgsl/` convention) or contains the uppercase "WGSL"
    // marker (covering the legacy `ShadersWGSL/` convention). Substring-only matching
    // would also pick up unrelated folders such as `twgsl/`.
    const isWGSL = directory.split(/[/\\]/).some((segment) => segment.toLowerCase() === "wgsl" || segment.indexOf("WGSL") > -1);
    const tsFilename = filename.replace(".fx", ".ts").replace(".wgsl", ".ts");
    const shaderName = GetShaderName(filename);
    const appendDirName = isWGSL ? "WGSL" : "";
    let fxData = content.toString();

    if (checkArgs("--global", true)) {
        isCore = IsFromPackage("core", filePath);
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

    // Determine if this is an include file or a main shader file.
    const isInclude = directory.indexOf("ShadersInclude") > -1;

    if (isInclude) {
        // === INCLUDE FILE: Self-registers (backwards compat) + exports pure data (named imports from main shaders) ===

        // Generate bare side-effect imports for any nested #include directives.
        // This ensures nested includes get registered at runtime (e.g. ltcHelperFunctions inside lightsFragmentFunctions).
        const nestedIncludes = GetIncludes(fxData);
        let nestedIncludeImports = "";
        for (const entry of nestedIncludes) {
            const isCoreInclude = entry.startsWith("core/");
            const actualEntry = entry.replace(/^core\//, "");
            if (isCore) {
                nestedIncludeImports += `import "./${actualEntry}";\n`;
            } else {
                const basePackageNameForImport = isCoreInclude ? "core" : basePackageName === undefined ? DetermineBasePackageNameForShaderInclude(filePath) : basePackageName;
                nestedIncludeImports += `import "${basePackageNameForImport}/Shaders${appendDirName}/ShadersInclude/${actualEntry}";\n`;
            }
        }

        // Strip "core/" prefix from #include directives in the shader content.
        // The .fx source uses core/ as a build-time directive for cross-package resolution,
        // but at runtime the shader processor looks up includes by bare name.
        fxData = fxData.replace(/#include<core\/([^>]+)>/g, "#include<$1>");

        const exportName = shaderName + (isWGSL ? "WGSL" : "");
        const appendDirNameInclude = isWGSL ? "WGSL" : "";
        const includesStore = `IncludesShadersStore${appendDirNameInclude}`;

        // Determine ShaderStore import path for include files.
        let includeStoreLocation;
        if (isCore) {
            includeStoreLocation = "../../Engines/shaderStore";
        } else {
            includeStoreLocation = "core/Engines/shaderStore";
        }

        let tsContent = TsShaderIncludeTemplate;
        tsContent = tsContent
            .replace("##SHADERSTORELOCATION_PLACEHOLDER##", includeStoreLocation)
            .replace("##NESTED_INCLUDES_PLACEHOLDER##", nestedIncludeImports)
            .replace("##NAME_PLACEHOLDER##", shaderName)
            .replace("##SHADER_PLACEHOLDER##", fxData)
            .replace(new RegExp("##INCLUDESSTORE_PLACEHOLDER##", "g"), includesStore)
            .replace("##EXPORT_PLACEHOLDER##", `/** @internal */\nexport const ${exportName} = { name, shader };`);

        // Go to disk.
        const tsShaderFilename = path.join(directory, tsFilename);
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
    } else {
        // === MAIN SHADER FILE: Named imports + explicit include registration ===

        // Get direct includes and resolve transitive closure.
        const directIncludes = GetIncludes(fxData);

        // Find the ShadersInclude directory relative to this shader.
        // For core shaders: directory is Shaders/, includes are in Shaders/ShadersInclude/
        // For non-core: includes may be in core's ShadersInclude or a local one
        const localShadersIncludeDir = path.join(directory, "ShadersInclude");

        // Find the core ShadersInclude directory for resolving core includes in non-core packages.
        // Walk up to find the core package.
        let coreShadersIncludeDir = "";
        const normalizedFilePath = path.normalize(filePath);
        const coreIdx = normalizedFilePath.indexOf(path.join("packages", "dev", "core", "src"));
        if (coreIdx !== -1) {
            const coreRoot = normalizedFilePath.substring(0, coreIdx + path.join("packages", "dev", "core", "src").length);
            coreShadersIncludeDir = path.join(coreRoot, isWGSL ? "ShadersWGSL" : "Shaders", "ShadersInclude");
        } else {
            // For non-core packages, try to find core relative to the workspace
            const packagesIdx = normalizedFilePath.indexOf(path.join("packages", "dev"));
            if (packagesIdx !== -1) {
                const workspaceRoot = normalizedFilePath.substring(0, packagesIdx);
                coreShadersIncludeDir = path.join(workspaceRoot, "packages", "dev", "core", "src", isWGSL ? "ShadersWGSL" : "Shaders", "ShadersInclude");
            }
        }

        // Resolve transitive includes. For non-core packages, we need to check both local and core ShadersInclude dirs.
        // We'll resolve each include trying local first, then core.
        const allIncludes = GetTransitiveIncludesMultiDir(directIncludes, localShadersIncludeDir, coreShadersIncludeDir, isWGSL);

        // Generate named imports and registration code.
        let includeText = "";
        const includeVarNames: string[] = [];

        for (const entry of allIncludes) {
            // Entry may have been something like #include<core/helperFunctions> where "core" is intended to override the basePackageName.
            const isCoreInclude = entry.startsWith("core/");

            // Currently only "core/" is supported for the include path.
            if (!isCoreInclude && entry.includes("/")) {
                throw new Error("Currently only specifying 'core' in path includes (e.g. #include<core/helperFunctions.fx>) is supported.");
            }

            const actualEntry = entry.replace(/^core\//, "");
            const exportName = actualEntry + (isWGSL ? "WGSL" : "");

            if (isCore) {
                // If this shader is already from core, consider #include<core/...> as an error since it's not necessary.
                if (isCoreInclude) {
                    throw new Error("Unnecessary core include");
                }

                includeText += `import { ${exportName} } from "./ShadersInclude/${actualEntry}";\n`;
            } else {
                const basePackageNameForImport = isCoreInclude ? "core" : basePackageName === undefined ? DetermineBasePackageNameForShaderInclude(filePath) : basePackageName;
                includeText += `import { ${exportName} } from "${basePackageNameForImport}/Shaders${appendDirName}/ShadersInclude/${actualEntry}";\n`;

                // The shader code itself also needs to be updated by replacing `#include<core/helperFunctions>` with `#include<helperFunctions>`
                if (isCoreInclude) {
                    fxData = fxData.replace(new RegExp(`#include<${entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>`, "g"), `#include<${actualEntry}>`);
                }
            }

            includeVarNames.push(exportName);
        }

        // Generate include registration code.
        let registerIncludesText = "";
        if (includeVarNames.length > 0) {
            const includesShadersStore = `IncludesShadersStore${appendDirName}`;
            registerIncludesText = `const includes = [${includeVarNames.join(", ")}];\n`;
            registerIncludesText += `for (const inc of includes) {\n`;
            registerIncludesText += `    if (!ShaderStore.${includesShadersStore}[inc.name]) {\n`;
            registerIncludesText += `        ShaderStore.${includesShadersStore}[inc.name] = inc.shader;\n`;
            registerIncludesText += `    }\n`;
            registerIncludesText += `}\n`;
        }

        // Chose shader store.
        const shaderStore = `ShadersStore${appendDirName}`;
        let shaderStoreLocation;
        if (isCore) {
            shaderStoreLocation = "../Engines/shaderStore";
        } else {
            shaderStoreLocation = "core/Engines/shaderStore";
        }

        // Fill template in.
        let tsContent = TsShaderTemplate.replace("##SHADERSTORELOCATION_PLACEHOLDER##", shaderStoreLocation);
        tsContent = tsContent
            .replace("##INCLUDES_PLACEHOLDER##", includeText)
            .replace("##NAME_PLACEHOLDER##", shaderName)
            .replace("##SHADER_PLACEHOLDER##", fxData)
            .replace(new RegExp("##SHADERSTORE_PLACEHOLDER##", "g"), shaderStore)
            .replace("##REGISTER_INCLUDES_PLACEHOLDER##", registerIncludesText)
            .replace(
                "##EXPORT_PLACEHOLDER##",
                `/** @internal */
export const ${shaderName + (isWGSL ? "WGSL" : "")} = { name, shader };`
            );

        // Go to disk.
        const tsShaderFilename = path.join(directory, tsFilename);
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
}
