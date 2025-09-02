import * as fs from "fs";
import { Logger } from "core/Misc/logger.js";
import { ParseFragmentShader, type FragmentShaderInfo } from "./shaderConverter.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
const TYPE_IMPORT_PATH = "@TYPE_IMPORT_PATH@";
// eslint-disable-next-line @typescript-eslint/naming-convention
const VERTEX_SHADER = "@VERTEX_SHADER@";
const UNIFORMS = "@UNIFORMS@";
const CONSTS_VALUE = "@CONSTS@";
// eslint-disable-next-line @typescript-eslint/naming-convention
const CONSTS_PROPERTY = "@CONSTS_PROPERTY@";
const MAIN_INPUT_NAME = "@MAIN_INPUT_NAME@";
const MAIN_FUNCTION_NAME = "@MAIN_FUNCTION_NAME@";
const FUNCTIONS = "@FUNCTIONS@";
const FUNCTION_NAME = "@FUNCTION_NAME@";
const FUNCTION_PARAMS = "@FUNCTION_PARAMS@";
const FUNCTION_CODE = "@FUNCTION_CODE@";
const UNIFORM_NAMES = "@UNIFORM_NAMES@";
const EXPORT = "@EXPORT_SHADER_PROGRAM@";
const IMPORTS = "@IMPORT@";

const ConstsTemplate = `
        const: \`${CONSTS_VALUE}\`,`;

const FunctionTemplate = `
            {
                name: "${FUNCTION_NAME}",
                code: \`
${FUNCTION_CODE}
                    \`,
                params: "${FUNCTION_PARAMS}",
            },`;

const CodeLinePrefix = "                    ";
const UniformLinePrefix = "            ";
const ConstLinePrefix = "            ";

const ImportTemplate = `import type { ShaderProgram } from "${TYPE_IMPORT_PATH}";`;
const ShaderTemplate = `${IMPORTS}

/**
 * The shader program for the block.
 */
const BlockShaderProgram: ShaderProgram = {
    vertex: ${VERTEX_SHADER},
    fragment: {
        uniform: \`${UNIFORMS}\`,${CONSTS_PROPERTY}
        mainInputTexture: "${MAIN_INPUT_NAME}",
        mainFunctionName: "${MAIN_FUNCTION_NAME}",
        functions: [${FUNCTIONS}
        ],
    },
};

/**
 * The uniform names for this shader, to be used in the shader binding so
 * that the names are always in sync.
 */
const Uniforms = {
${UNIFORM_NAMES}
};

${EXPORT}`;

const UniformNameLinePrefix = "    ";

/**
 * Converts a single shader to a .ts file which exports a ShaderProgram which can be imported by a hardcoded block
 * @param fragmentShaderPath - The path to the fragment file for the shader
 * @param importPath - The path to import the Smart Filters core from
 */
export function ConvertGlslIntoShaderProgram(fragmentShaderPath: string, importPath: string): void {
    const { shaderProgramCode } = ExtractShaderProgramFromGlsl(fragmentShaderPath, importPath, true, true);
    const shaderFile = fragmentShaderPath.replace(".glsl", ".ts");
    fs.writeFileSync(shaderFile, shaderProgramCode);
}

/**
 * Extracts the shader program from a glsl file(s) and returns it as a string which can be written to a .ts file
 * @param fragmentShaderPath - The path to the fragment file for the shader
 * @param smartFiltersCorePath - The path to import the Smart Filters core from
 * @param exportObjects - Whether to export the shaderProgram and uniforms objects
 * @param includeImports - Whether to include the imports in the output
 * @returns The string to write to the .ts file
 */
export function ExtractShaderProgramFromGlsl(
    fragmentShaderPath: string,
    smartFiltersCorePath: string,
    exportObjects: boolean,
    includeImports: boolean
): {
    /**
     * The shader program code
     */
    shaderProgramCode: string;

    /**
     * The FragmentShaderInfo
     */
    fragmentShaderInfo: FragmentShaderInfo;
} {
    // See if there is a corresponding vertex shader
    let vertexShader: string | undefined = undefined;
    let extensionToFind: string;
    if (fragmentShaderPath.endsWith(".block.glsl")) {
        extensionToFind = ".block.glsl";
    } else if (fragmentShaderPath.endsWith(".fragment.glsl")) {
        extensionToFind = ".fragment.glsl";
    } else {
        throw new Error("The shader file must end with .fragment.glsl or .block.glsl");
    }
    const vertexShaderPath = fragmentShaderPath.replace(extensionToFind, ".vertex.glsl");
    if (fs.existsSync(vertexShaderPath)) {
        vertexShader = fs.readFileSync(vertexShaderPath, "utf8");
    }
    if (vertexShader) {
        Logger.Log("Found vertex shader");
    }

    // Read the fragment shader
    const fragmentShader = fs.readFileSync(fragmentShaderPath, "utf8");
    const fragmentShaderInfo = ParseFragmentShader(fragmentShader);

    // Generate the shader program code
    const functionsSection: string[] = [];
    for (const shaderFunction of fragmentShaderInfo.shaderCode.functions) {
        functionsSection.push(
            FunctionTemplate.replace(FUNCTION_NAME, shaderFunction.name)
                .replace(FUNCTION_PARAMS, shaderFunction.params || "")
                .replace(FUNCTION_CODE, AddLinePrefixes(shaderFunction.code, CodeLinePrefix))
        );
    }
    const imports = includeImports ? ImportTemplate.replace(TYPE_IMPORT_PATH, smartFiltersCorePath) : "";
    const finalContents = ShaderTemplate.replace(VERTEX_SHADER, vertexShader ? `\`${vertexShader}\`` : "undefined")
        .replace(IMPORTS, imports)
        .replace(UNIFORMS, "\n" + AddLinePrefixes(fragmentShaderInfo.shaderCode.uniform || "", UniformLinePrefix))
        .replace(MAIN_FUNCTION_NAME, fragmentShaderInfo.shaderCode.mainFunctionName)
        .replace(MAIN_INPUT_NAME, fragmentShaderInfo.shaderCode.mainInputTexture || "")
        .replace(
            CONSTS_PROPERTY,
            fragmentShaderInfo.shaderCode.const ? ConstsTemplate.replace(CONSTS_VALUE, AddLinePrefixes(fragmentShaderInfo.shaderCode.const, ConstLinePrefix)) : ""
        )
        .replace(FUNCTIONS, functionsSection.join(""))
        .replace(UNIFORM_NAMES, AddLinePrefixes(fragmentShaderInfo.uniforms.map((u) => `${u.name}: "${u.name}",`).join("\n"), UniformNameLinePrefix))
        .replace(
            new RegExp(EXPORT, "g"),
            exportObjects
                ? `export { BlockShaderProgram, Uniforms };
// Back compat for when camelCase was used
export { BlockShaderProgram as shaderProgram, Uniforms as uniforms };
`
                : ""
        );

    return {
        shaderProgramCode: finalContents,
        fragmentShaderInfo,
    };
}

/**
 * Prefixes each line in the input
 * @param input - The input string
 * @param prefix - The prefix to add to each line
 * @returns The input with each line prefixed
 */
function AddLinePrefixes(input: string, prefix: string): string {
    return input
        .split("\n")
        .map((line) => prefix + line)
        .join("\n");
}
