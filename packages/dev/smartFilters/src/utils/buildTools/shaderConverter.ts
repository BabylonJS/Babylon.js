import type { Nullable } from "core/types.js";
import { Logger } from "core/Misc/logger.js";
import type { ShaderCode, ShaderFunction } from "./shaderCode.types.js";
import { ConnectionPointType } from "../../connection/connectionPointType.js";
import { BlockDisableStrategy } from "../../blockFoundation/disableableShaderBlock.js";

// Note: creating a global RegExp object is risky, because it holds state (e.g. lastIndex) that has to be
// cleared at the right time to ensure correctness, which is easy to forget to do.
// Instead, for regular expressions used in multiple places, we define the string and options once, and create
// a new RegExp object from them when needed, to ensure state isn't accidentally reused.

// Matches a function's name and its parameters
const GetFunctionHeaderRegExString = `\\S*\\w+\\s+(\\w+)\\s*\\((.*?)\\)\\s*\\{`;
const GetFunctionHeaderRegExOptions = "g";

// Matches a #define statement line, capturing its name
const GetDefineRegExString = `^\\S*#define\\s+(\\w+).*$`;
const GetDefineRegExOptions = "gm";

const ReservedSymbols = ["main"];

/**
 * Describes the supported metadata properties for a uniform
 */
export type UniformMetadataProperties = {
    /**
     * If supplied, the default value to use for the corresponding input connection point
     */
    default?: any;

    /**
     * If supplied, the input will be automatically bound to this value, instead of creating an input connection point
     * @see InputAutoBindV1 for possible values.
     */
    autoBind?: string;
};

/**
 * Describes a uniform in a shader
 */
export type UniformMetadata = {
    /**
     * The original name of the uniform (not renamed)
     */
    name: string;

    /**
     * The type string of the uniform
     */
    type: ConnectionPointType;

    /**
     * Optional properties of the uniform
     */
    properties?: UniformMetadataProperties;
};

/**
 * Information about a fragment shader
 */
export type FragmentShaderInfo = {
    /**
     * If supplied, the blockType to use for the block
     */
    blockType?: string;

    /**
     * If supplied, the namespace of the block
     */
    namespace: Nullable<string>;

    /**
     * If true, optimization should be disabled for this shader
     */
    disableOptimization?: boolean;

    /**
     * If supplied, the strategy to use for making this block disableable
     */
    blockDisableStrategy?: BlockDisableStrategy;

    /**
     * The shader code
     */
    shaderCode: ShaderCode;

    /**
     * The set of uniforms
     */
    uniforms: UniformMetadata[];
};

/**
 * Parses a fragment shader
 * @param fragmentShader - The fragment shader to process
 * @returns The processed fragment shader
 */
export function ParseFragmentShader(fragmentShader: string): FragmentShaderInfo {
    const { header, fragmentShaderWithoutHeader } = ReadHeader(fragmentShader);
    fragmentShader = fragmentShaderWithoutHeader;
    const blockType = header?.[SmartFilterBlockTypeKey] || undefined;
    const namespace = header?.namespace || null;

    // Read the uniforms
    const uniforms: UniformMetadata[] = [];
    const uniformRegExp = new RegExp(/(\/\/\s*\{.*\}\s*(?:\r\n|\r|\n)+)?(uniform .*)/gm);
    const uniformGroups = fragmentShader.matchAll(uniformRegExp);
    for (const matches of uniformGroups) {
        const annotationJSON = matches[1];
        const uniformLine = matches[2];

        if (!uniformLine) {
            throw new Error("Uniform line not found");
        }

        const uniformLineMatches = new RegExp(/^uniform\s+(\w+)\s+(\w+)\s*;?/gm).exec(uniformLine);
        if (!uniformLineMatches || uniformLineMatches.length < 3) {
            throw new Error(`Uniforms must have a type and a name: '${uniformLine}'`);
        }
        const uniformTypeString = uniformLineMatches[1];
        const uniformName = uniformLineMatches[2];

        if (!uniformTypeString) {
            throw new Error(`Uniforms must have a type: '${uniformLine}'`);
        }
        if (!uniformName) {
            throw new Error(`Uniforms must have a name: '${uniformLine}'`);
        }

        // Convert to ConnectionPointType
        let type: ConnectionPointType;
        switch (uniformTypeString) {
            case "float":
                type = ConnectionPointType.Float;
                break;
            case "sampler2D":
                type = ConnectionPointType.Texture;
                break;
            case "vec3":
                type = ConnectionPointType.Color3;
                break;
            case "vec4":
                type = ConnectionPointType.Color4;
                break;
            case "bool":
                type = ConnectionPointType.Boolean;
                break;
            case "vec2":
                type = ConnectionPointType.Vector2;
                break;
            default:
                throw new Error(`Unsupported uniform type: '${uniformTypeString}'`);
        }

        uniforms.push({
            name: uniformName,
            type,
            properties: annotationJSON ? JSON.parse(annotationJSON.replace("//", "").trim()) : undefined,
        });

        if (annotationJSON) {
            // Strip out any annotation so it isn't mistaken for function bodies
            fragmentShader = fragmentShader.replace(annotationJSON, "");
        }
    }

    const fragmentShaderWithNoFunctionBodies = RemoveFunctionBodies(fragmentShader);

    // Collect uniform, const, and function names which need to be decorated
    // eslint-disable-next-line prettier/prettier
    const uniformNames = uniforms.map((uniform) => uniform.name);
    Logger.Log(`Uniforms found: ${JSON.stringify(uniforms)}`);
    const consts = [...fragmentShader.matchAll(/\S*const\s+\w*\s+(\w*)\s*=.*;/g)].map((match) => match[1]);
    Logger.Log(`Consts found: ${JSON.stringify(consts)}`);
    const defineNames = [...fragmentShader.matchAll(new RegExp(GetDefineRegExString, GetDefineRegExOptions))].map((match) => match[1]);
    Logger.Log(`Defines found: ${JSON.stringify(defineNames)}`);
    const functionNames = [...fragmentShaderWithNoFunctionBodies.matchAll(new RegExp(GetFunctionHeaderRegExString, GetFunctionHeaderRegExOptions))].map((match) => match[1]);
    Logger.Log(`Functions found: ${JSON.stringify(functionNames)}`);

    // Decorate the uniforms, consts, defines, and functions
    const symbolsToDecorate = [...uniformNames, ...consts, ...defineNames, ...functionNames];
    let fragmentShaderWithRenamedSymbols = fragmentShader;
    for (const symbol of symbolsToDecorate) {
        if (!symbol) {
            continue;
        }
        if (ReservedSymbols.indexOf(symbol) !== -1) {
            throw new Error(`Symbol "${symbol}" is reserved and cannot be used`);
        }
        const regex = new RegExp(`(?<=\\W+)${symbol}(?=\\W+)`, "gs");
        fragmentShaderWithRenamedSymbols = fragmentShaderWithRenamedSymbols.replace(regex, `_${symbol}_`);
    }
    Logger.Log(`${symbolsToDecorate.length} symbol(s) renamed`);

    // Extract all the uniforms
    const finalUniforms = [...fragmentShaderWithRenamedSymbols.matchAll(/^\s*(uniform\s.*)/gm)].map((match) => match[1]);

    // Extract all the consts
    const finalConsts = [...fragmentShaderWithRenamedSymbols.matchAll(/^\s*(const\s.*)/gm)].map((match) => match[1]);

    // Extract all the defines
    const finalDefines = [...fragmentShaderWithRenamedSymbols.matchAll(new RegExp(GetDefineRegExString, GetDefineRegExOptions))].map((match) => match[0]);

    // Find the main input
    const mainInputs = [...fragmentShaderWithRenamedSymbols.matchAll(/\S*uniform.*\s(\w*);\s*\/\/\s*main/gm)].map((match) => match[1]);
    if (mainInputs.length > 1) {
        throw new Error("Shaders may have no more than 1 main input");
    }
    const mainInputTexture = mainInputs[0];

    // Extract all the functions
    const { extractedFunctions, mainFunctionName } = ExtractFunctions(fragmentShaderWithRenamedSymbols);

    const shaderCode: ShaderCode = {
        uniform: finalUniforms.join("\n"),
        mainFunctionName,
        mainInputTexture,
        functions: extractedFunctions,
        defines: finalDefines,
    };

    if (finalConsts.length > 0) {
        shaderCode.const = finalConsts.join("\n");
    }

    return {
        blockType,
        namespace,
        shaderCode,
        uniforms,
        disableOptimization: !!header?.disableOptimization,
        blockDisableStrategy: header?.blockDisableStrategy,
    };
}

/**
 * Extracts all functions from the shader
 * @param fragment - The shader code to process
 * @returns A list of functions
 */
function ExtractFunctions(fragment: string): {
    /**
     * The extracted functions
     */
    extractedFunctions: ShaderFunction[];

    /**
     * The name of the main function
     */
    mainFunctionName: string;
} {
    const extractedFunctions: ShaderFunction[] = [];
    let mainFunctionName: string | undefined;
    let pos = 0;

    const getFunctionHeaderRegEx = new RegExp(GetFunctionHeaderRegExString, GetFunctionHeaderRegExOptions);

    while (pos < fragment.length) {
        // Match the next available function header in the fragment code
        getFunctionHeaderRegEx.lastIndex = pos;
        const match = getFunctionHeaderRegEx.exec(fragment);
        if (!match) {
            break;
        }

        const functionName = match[1];
        if (!functionName) {
            throw new Error("No function name found in shader code");
        }

        const functionParams = match[2] || "";

        // Store start index of the function definition
        const startIndex = match.index;

        // Balance braces to find end of function, starting just after the opening `{`
        let endIndex = match.index + match[0].length;
        let depth = 1;
        while (depth > 0 && endIndex < fragment.length) {
            if (fragment[endIndex] === "{") {
                depth++;
            } else if (fragment[endIndex] === "}") {
                depth--;
            }
            endIndex++;
        }

        if (depth !== 0) {
            throw new Error(`Mismatched curly braces found near: ${functionName}`);
        }

        // Finally, process the function code
        let functionCode = fragment.substring(startIndex, endIndex).trim();

        // Check if this function is the main function
        if (functionCode.includes("// main")) {
            if (mainFunctionName) {
                throw new Error("Multiple main functions found in shader code");
            }
            mainFunctionName = functionName;
            functionCode = functionCode.replace("// main", "");
        }

        extractedFunctions.push({
            name: functionName,
            code: functionCode,
            params: functionParams.trim(),
        });

        pos = endIndex;
    }

    if (!mainFunctionName) {
        throw new Error("No main function found in shader code");
    }

    return { extractedFunctions, mainFunctionName };
}

/**
 * Removes all function bodies from the shader code, leaving just curly braces behind at the top level
 * @param input - The shader code to process
 * @returns The shader code with all function bodies removed
 */
function RemoveFunctionBodies(input: string): string {
    let output: string = "";
    let depth: number = 0;

    for (let pos = 0; pos < input.length; pos++) {
        if (input[pos] === "{") {
            depth++;
            // Special case - if we just hit the first { then include it
            if (depth === 1) {
                output += "{";
            }
        } else if (input[pos] === "}") {
            depth--;
            // Special case - if we just hit the last } then include it
            if (depth === 0) {
                output += "}";
            }
        } else if (depth === 0) {
            output += input[pos];
        }
    }

    if (depth !== 0) {
        Logger.Error("Unbalanced curly braces in shader code");
    }

    return output;
}

const SmartFilterBlockTypeKey = "smartFilterBlockType";

/**
 * The format of the header we expect in a GLSL shader
 */
type GlslHeader = {
    /**
     * The block type to use for the shader, required when converting to a
     * SerializedBlockDefinition, but not when exporting to a .ts file
     * to be included in a hardcoded block definition
     */
    [SmartFilterBlockTypeKey]: string;

    /**
     * The namespace to use for the block
     */
    namespace?: string;

    /**
     * If true, optimization should be disabled for this shader
     */
    disableOptimization?: boolean;

    /**
     * If supplied, this will be an instance of DisableableShaderBlock, with this BlockDisableStrategy
     * In the GLSL file, use the string key of the BlockDisableStrategy (e.g. "AutoSample").
     */
    blockDisableStrategy?: BlockDisableStrategy;
};

/**
 * Reads the GlslHeader from the shader code
 * @param fragmentShader - The shader code to read
 * @returns - The GlslHeader if found, otherwise null
 */
function ReadHeader(fragmentShader: string): {
    /**
     * The glsl header, or null if there wasn't one
     */
    header: Nullable<GlslHeader>;

    /**
     * The fragment shader code with the header removed if there was one
     */
    fragmentShaderWithoutHeader: string;
} {
    const singleLineHeaderMatch = new RegExp(/^\n*\s*\/\/\s*(\{.*\})/g).exec(fragmentShader);
    if (singleLineHeaderMatch && singleLineHeaderMatch[1]) {
        return {
            header: ParseHeader(singleLineHeaderMatch[1].trim()),
            fragmentShaderWithoutHeader: fragmentShader.replace(singleLineHeaderMatch[0], ""),
        };
    }

    const multiLineHeaderMatch = new RegExp(/^\n*\s*\/\*\s*(\{.*\})\s*\*\//gs).exec(fragmentShader);
    if (multiLineHeaderMatch && multiLineHeaderMatch[1]) {
        return {
            header: ParseHeader(multiLineHeaderMatch[1].trim()),
            fragmentShaderWithoutHeader: fragmentShader.replace(multiLineHeaderMatch[0], ""),
        };
    }

    return {
        header: null,
        fragmentShaderWithoutHeader: fragmentShader,
    };
}

/**
 * Parses the header from a string into a GlslHeader object
 * @param header - The header string to parse
 * @returns - The GlslHeader if the header is valid, otherwise null
 */
function ParseHeader(header: string): Nullable<GlslHeader> {
    const parsedObject = JSON.parse(header);

    if (!parsedObject || typeof parsedObject !== "object") {
        return null;
    }

    // Check for required properties
    if (!parsedObject[SmartFilterBlockTypeKey]) {
        throw new Error("Missing required property: " + SmartFilterBlockTypeKey);
    }

    const glslHeader = parsedObject as GlslHeader;

    // Fix up the disableStrategy to be a BlockDisableStrategy
    if (glslHeader.blockDisableStrategy) {
        const rawStrategyValue = glslHeader.blockDisableStrategy;
        switch (rawStrategyValue as unknown as string) {
            case "Manual":
                glslHeader.blockDisableStrategy = BlockDisableStrategy.Manual;
                break;
            case "AutoSample":
                glslHeader.blockDisableStrategy = BlockDisableStrategy.AutoSample;
                break;
            default:
                throw new Error(`Invalid disableStrategy: ${rawStrategyValue}`);
        }
    }

    return glslHeader;
}

/**
 * Determines if a fragment shader has the GLSL header required for parsing
 * @param fragmentShader - The fragment shader to check
 * @returns True if the fragment shader has the GLSL header
 */
export function HasGlslHeader(fragmentShader: string): boolean {
    return fragmentShader.indexOf(SmartFilterBlockTypeKey) !== -1;
}
