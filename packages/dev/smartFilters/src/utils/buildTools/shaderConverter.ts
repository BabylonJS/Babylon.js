import { type ShaderCode, type ShaderFunction } from "./shaderCode.types.js";
import { ConnectionPointType } from "../../connection/connectionPointType.js";
import { BlockDisableStrategy } from "../../blockFoundation/blockDisableStrategy.js";
import { type ConstPropertyMetadata } from "../../serialization/v1/shaderBlockSerialization.types.js";
import { DecorateSymbol } from "../shaderCodeUtils.js";
import { log, error } from "./buildToolsLogger.js";

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
 * Describes the supported metadata annotation for a uniform
 */
type UniformMetadataAnnotation = {
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
type UniformMetadata = {
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
    properties?: UniformMetadataAnnotation;
};

/**
 * Describes the supported metadata annotation for a const
 */
type ConstMetadataAnnotation = {
    /**
     * If supplied, the const will be treated as a property which can be set before creating a runtime.
     * Note: in this case, the const will be unique to each instance of this block.
     */
    property?: {
        options?: ConstMetadataAnnotationFloatOptions;
    };
};

type ConstMetadataAnnotationFloatOptions = { [key: string]: number };

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
    namespace: string | null;

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

    /**
     * The set of fragment const values to be exposed as properties
     */
    fragmentConstProperties: ConstPropertyMetadata[];
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
    const uniformGroups = FindDeclarations(fragmentShader, "uniform");
    for (const { annotationJSON, declaration: uniformLine } of uniformGroups) {
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

    // Read the property consts (consts to be exposed as properties)
    const fragmentConstProperties: ConstPropertyMetadata[] = [];
    const constGroups = FindDeclarations(fragmentShader, "const");
    for (const { annotationJSON, declaration: constLine } of constGroups) {
        // If it doesn't have any annotation, treat it as a regular const
        if (!annotationJSON) {
            continue;
        }

        const annotation = JSON.parse(annotationJSON.replace("//", "").trim()) as ConstMetadataAnnotation;

        // If the annotation doesn't have a "property" field, treat it as a regular const
        if (!annotation.property) {
            continue;
        }

        let constDefinition = constLine.trim();
        if (constDefinition.endsWith(";")) {
            constDefinition = constDefinition.slice(0, -1).trimEnd();
        }
        const constLineMatches = /^const[ \t]+(\w+)[ \t]+(\w+)[ \t]*=[ \t]*([^ \t;]+)$/.exec(constDefinition);
        if (!constLineMatches || constLineMatches.length < 4) {
            throw new Error(`Consts must have a name, type, and a default value: '${constLine}'`);
        }
        const type = constLineMatches[1];
        const friendlyName = constLineMatches[2];
        const defaultValue = constLineMatches[3];

        if (!friendlyName) {
            throw new Error(`Consts must have a name: '${constLine}'`);
        }
        if (defaultValue === null) {
            throw new Error(`Consts must have a value: '${constLine}'`);
        }

        const constProperty: ConstPropertyMetadata | null =
            type === "float"
                ? {
                      name: DecorateSymbol(friendlyName),
                      friendlyName,
                      type,
                      defaultValue: parseFloat(defaultValue),
                      options: annotation.property.options as ConstMetadataAnnotationFloatOptions | undefined,
                  }
                : null;

        if (!constProperty) {
            throw new Error(`Unsupported const property type: '${type}'`);
        }
        fragmentConstProperties.push(constProperty);

        // Strip out the definition from the code - it will be added back in when creating the runtime by the CustomShaderBlock
        fragmentShader = fragmentShader.replace(annotationJSON, "");
        fragmentShader = fragmentShader.replace(constLine, "");
    }

    const fragmentShaderWithNoFunctionBodies = RemoveFunctionBodies(fragmentShader);

    // Collect uniform, const, and function names which need to be decorated
    const uniformNames = uniforms.map((uniform) => uniform.name);
    log(`Uniforms found: ${JSON.stringify(uniforms)}`);
    const consts = FindDeclarationNames(fragmentShader, "const");
    log(`Consts found: ${JSON.stringify(consts)}`);
    const constPropertyFriendlyNames = fragmentConstProperties.map((c) => c.friendlyName);
    log(`Const properties found: ${JSON.stringify(constPropertyFriendlyNames)}`);
    const defineNames = [...fragmentShader.matchAll(new RegExp(GetDefineRegExString, GetDefineRegExOptions))].map((match) => match[1]);
    log(`Defines found: ${JSON.stringify(defineNames)}`);
    const functionNames = [...fragmentShaderWithNoFunctionBodies.matchAll(new RegExp(GetFunctionHeaderRegExString, GetFunctionHeaderRegExOptions))].map((match) => match[1]);
    log(`Functions found: ${JSON.stringify(functionNames)}`);

    // Decorate the uniforms, consts, defines, and functions
    const symbolsToDecorate = [...uniformNames, ...consts, ...constPropertyFriendlyNames, ...defineNames, ...functionNames];
    let fragmentShaderWithRenamedSymbols = fragmentShader;
    for (const symbol of symbolsToDecorate) {
        if (!symbol) {
            continue;
        }
        if (ReservedSymbols.indexOf(symbol) !== -1) {
            throw new Error(`Symbol "${symbol}" is reserved and cannot be used`);
        }
        const regex = new RegExp(`(?<=\\W+)${symbol}(?=\\W+)`, "gs");
        fragmentShaderWithRenamedSymbols = fragmentShaderWithRenamedSymbols.replace(regex, DecorateSymbol(symbol));
    }
    log(`${symbolsToDecorate.length} symbol(s) renamed`);

    // Extract all the uniforms
    const finalUniforms = [...fragmentShaderWithRenamedSymbols.matchAll(/^\s*(uniform\s.*)/gm)].map((match) => match[1]);

    // Extract all the consts
    const finalConsts = [...fragmentShaderWithRenamedSymbols.matchAll(/^\s*(const\s.*)/gm)].map((match) => match[1]);

    // Extract all the defines
    const finalDefines = [...fragmentShaderWithRenamedSymbols.matchAll(new RegExp(GetDefineRegExString, GetDefineRegExOptions))].map((match) => match[0]);

    // Find the main input
    const mainInputs = FindMainInputNames(fragmentShaderWithRenamedSymbols);
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

    if (fragmentConstProperties.length > 0) {
        shaderCode.constPerInstance = fragmentConstProperties.map((property) => `const ${property.type} ${property.name} = ${property.defaultValue};`).join("\n");
    }

    return {
        blockType,
        namespace,
        shaderCode,
        uniforms,
        fragmentConstProperties,
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
        error("Unbalanced curly braces in shader code");
    }

    return output;
}

function FindDeclarations(input: string, keyword: "uniform" | "const"): { annotationJSON?: string; declaration: string }[] {
    const declarations: { annotationJSON?: string; declaration: string }[] = [];
    let annotationJSON: string | undefined;

    for (const line of input.split(/\r\n|\r|\n/)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("//")) {
            const annotation = trimmed.slice(2).trim();
            annotationJSON = annotation.startsWith("{") && annotation.endsWith("}") ? trimmed : undefined;
            continue;
        }
        if (trimmed === "") {
            continue;
        }
        if (trimmed.startsWith(`${keyword} `) || trimmed.startsWith(`${keyword}\t`)) {
            declarations.push({ annotationJSON, declaration: trimmed });
        }
        annotationJSON = undefined;
    }

    return declarations;
}

function FindDeclarationNames(input: string, keyword: "const"): string[] {
    const names: string[] = [];
    for (const line of input.split(/\r\n|\r|\n/)) {
        let searchIndex = 0;
        while (searchIndex < line.length) {
            const keywordIndex = line.indexOf(keyword, searchIndex);
            if (keywordIndex === -1) {
                break;
            }
            const match = /^const[ \t]+\w+[ \t]+(\w+)[ \t]*=/.exec(line.slice(keywordIndex));
            if (match) {
                names.push(match[1]);
                break;
            }
            searchIndex = keywordIndex + keyword.length;
        }
    }
    return names;
}

function FindMainInputNames(input: string): string[] {
    const names: string[] = [];
    for (const line of input.split(/\r\n|\r|\n/)) {
        const commentIndex = line.indexOf("//");
        if (
            commentIndex === -1 ||
            !line
                .slice(commentIndex + 2)
                .trimStart()
                .startsWith("main")
        ) {
            continue;
        }
        const declaration = line.slice(0, commentIndex).trim();
        if (declaration.indexOf("uniform") === -1) {
            continue;
        }
        const semicolonIndex = declaration.lastIndexOf(";");
        if (semicolonIndex === -1) {
            continue;
        }
        const match = /(\w+)[ \t]*$/.exec(declaration.slice(0, semicolonIndex));
        if (match) {
            names.push(match[1]);
        }
    }
    return names;
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
    header: GlslHeader | null;

    /**
     * The fragment shader code with the header removed if there was one
     */
    fragmentShaderWithoutHeader: string;
} {
    let startIndex = 0;
    while (startIndex < fragmentShader.length && /\s/.test(fragmentShader[startIndex])) {
        startIndex++;
    }

    if (fragmentShader.startsWith("//", startIndex)) {
        const openingBrace = fragmentShader.indexOf("{", startIndex + 2);
        let lineEnd = openingBrace === -1 ? fragmentShader.length : openingBrace;
        while (lineEnd < fragmentShader.length && !"\n\r\u2028\u2029".includes(fragmentShader[lineEnd])) {
            lineEnd++;
        }
        const closingBrace = fragmentShader.lastIndexOf("}", lineEnd - 1);
        if (openingBrace !== -1 && openingBrace < closingBrace && fragmentShader.slice(startIndex + 2, openingBrace).trim() === "") {
            return {
                header: ParseHeader(fragmentShader.slice(openingBrace, closingBrace + 1).trim()),
                fragmentShaderWithoutHeader: fragmentShader.slice(closingBrace + 1),
            };
        }
    }

    if (fragmentShader.startsWith("/*", startIndex)) {
        const commentEnd = fragmentShader.indexOf("*/", startIndex + 2);
        const openingBrace = fragmentShader.indexOf("{", startIndex + 2);
        const closingBrace = commentEnd === -1 ? -1 : fragmentShader.lastIndexOf("}", commentEnd);
        if (
            commentEnd !== -1 &&
            openingBrace !== -1 &&
            openingBrace < closingBrace &&
            fragmentShader.slice(startIndex + 2, openingBrace).trim() === "" &&
            fragmentShader.slice(closingBrace + 1, commentEnd).trim() === ""
        ) {
            return {
                header: ParseHeader(fragmentShader.slice(openingBrace, closingBrace + 1).trim()),
                fragmentShaderWithoutHeader: fragmentShader.slice(commentEnd + 2),
            };
        }
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
function ParseHeader(header: string): GlslHeader | null {
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
