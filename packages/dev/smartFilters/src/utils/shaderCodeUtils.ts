import type { Effect } from "core/Materials/effect.js";
import type { ShaderCode } from "./buildTools/shaderCode.types.js";

/**
 * The shader code decorator.
 * Used to decorate the names of uniform, function and const variables for easier parsing.
 */
export const DecorateChar = "_";

/**
 * Describes a shader program.
 */
export type ShaderProgram = {
    /**
     * The vertex shader code.
     */
    vertex?: string | undefined;

    /**
     * The fragment shader code.
     */
    fragment: ShaderCode;
};

/**
 * The list of options required to create a shader block.
 * It mainly contains the shader code to execute and its associated parameters.
 */
export type ShaderCreationOptions = {
    /**
     * A friendly name for the shader visible in Spector or in logs.
     */
    name: string;
    /**
     * Fragment shader source code.
     */
    fragmentShader: string;
    /**
     * Vertex shader source code.
     */
    vertexShader?: string;
    /**
     * Attributes to use in the shader
     */
    attributeNames?: Array<string>;
    /**
     * Uniforms to use in the shader
     */
    uniformNames?: Array<string>;
    /**
     * Texture sampler names to use in the shader
     */
    samplerNames?: Array<string>;
    /**
     * Defines to use in the shader
     */
    defines?: Array<string>;
    /**
     * Callback when the effect is compiled
     */
    onCompiled?: (effect: Effect) => void;
};

export const AutoDisableMainInputColorName = "autoMainInputColor";
export const DisableUniform = "disabled";

/**
 * Injects the disable uniform and adds a check for it at the beginning of the main function
 * @param shaderProgram - The shader program to inject the disable feature into
 */
export function InjectAutoSampleDisableCode(shaderProgram: ShaderProgram) {
    const shaderFragment = shaderProgram.fragment;

    // Inject the disable uniform
    shaderFragment.uniform += `\nuniform bool ${DecorateSymbol(DisableUniform)};`;

    // Find the main function
    const mainFunction = shaderFragment.functions.find((f) => f.name === shaderFragment.mainFunctionName);
    if (!mainFunction) {
        throw new Error(`Main function not found when trying to inject auto disable into ${shaderFragment.mainFunctionName}`);
    }

    // Ensure the shader has a main input texture
    if (!shaderFragment.mainInputTexture) {
        throw new Error(`Main input texture not found when trying to inject auto disable into ${shaderFragment.mainFunctionName}`);
    }

    // Inject the code
    const autoDisableVariableName = DecorateSymbol(AutoDisableMainInputColorName);
    mainFunction.code = mainFunction.code.replace(
        "{",
        `{\n    vec4 ${autoDisableVariableName} = texture2D(${shaderFragment.mainInputTexture}, vUV);\n
                if (${DecorateSymbol(DisableUniform)}) return ${autoDisableVariableName};\n`
    );
}

/**
 * Gets the shader fragment code.
 * @param shaderProgram - The shader program to extract the code from.
 * @param mainCodeOnly - If true, only the main function code will be returned.
 * @returns The shader fragment code.
 */
export function GetShaderFragmentCode(shaderProgram: ShaderProgram, mainCodeOnly = false): string {
    const shaderFragment = shaderProgram.fragment;

    const declarations = (shaderFragment.const ?? "") + "\n" + shaderFragment.uniform + "\n" + (shaderFragment.uniformSingle ?? "") + "\n";

    let mainFunctionCode = "";
    let otherFunctionsCode = "";
    for (let i = 0; i < shaderFragment.functions.length; ++i) {
        const func = shaderFragment.functions[i]!;
        if (func.name === shaderFragment.mainFunctionName) {
            mainFunctionCode += func.code + "\n";
            if (mainCodeOnly) {
                break;
            }
        } else {
            otherFunctionsCode += func.code + "\n";
        }
    }

    return mainCodeOnly ? mainFunctionCode : declarations + otherFunctionsCode + mainFunctionCode;
}

/**
 * Gets the shader creation options from a shader program.
 * @param shaderProgram - The shader program to build the create options from.
 * @returns The shader creation options.
 */
export function GetShaderCreateOptions(shaderProgram: ShaderProgram): ShaderCreationOptions {
    const shaderFragment = shaderProgram.fragment;

    let code = GetShaderFragmentCode(shaderProgram);

    const uniforms = shaderFragment.uniform + "\n" + (shaderFragment.uniformSingle ?? "");
    const uniformNames = [];
    const samplerNames = [];

    const rx = new RegExp(`uniform\\s+(\\S+)\\s+(\\w+)\\s*;`, "g");

    let match = rx.exec(uniforms);
    while (match !== null) {
        const varType = match[1]!;
        const varName = match[2]!;

        if (varType === "sampler2D" || varType === "sampler3D") {
            samplerNames.push(varName);
        } else {
            uniformNames.push(varName);
        }

        match = rx.exec(uniforms);
    }

    code = "varying vec2 vUV;\n" + code + "\nvoid main(void) {\ngl_FragColor = " + shaderFragment.mainFunctionName + "(vUV);\n}";

    const options: ShaderCreationOptions = {
        name: shaderFragment.mainFunctionName,
        fragmentShader: code,
        uniformNames: uniformNames,
        samplerNames: samplerNames,
        defines: shaderFragment.defines,
    };

    if (shaderProgram.vertex) {
        options.vertexShader = shaderProgram.vertex;
    }

    return options;
}

/**
 * Decorates a symbol (uniform, function or const) name.
 * @param symbol - The symbol to decorate.
 * @returns The decorated symbol.
 */
export function DecorateSymbol(symbol: string): string {
    return DecorateChar + symbol + DecorateChar;
}

/**
 * Undecorates a symbol (uniform, function or const) name.
 * @param symbol - The symbol to undecorate.
 * @returns The undecorated symbol. Throws an error if the symbol is not decorated.
 */
export function UndecorateSymbol(symbol: string): string {
    if (symbol.charAt(0) !== DecorateChar || symbol.charAt(symbol.length - 1) !== DecorateChar) {
        throw new Error(`undecorateSymbol: Invalid symbol name "${symbol}"`);
    }

    return symbol.substring(1, symbol.length - 1);
}
