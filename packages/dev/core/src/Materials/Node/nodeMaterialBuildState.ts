import { NodeMaterialBlockConnectionPointTypes } from "./Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets";
import type { NodeMaterialBuildStateSharedData } from "./nodeMaterialBuildStateSharedData";
import { ShaderLanguage } from "../shaderLanguage";
import type { NodeMaterialConnectionPoint } from "./nodeMaterialBlockConnectionPoint";
import { ShaderStore as EngineShaderStore } from "../../Engines/shaderStore";
import { Constants } from "../../Engines/constants";

/**
 * Class used to store node based material build state
 */
export class NodeMaterialBuildState {
    /** Gets or sets a boolean indicating if the current state can emit uniform buffers */
    public supportUniformBuffers = false;
    /**
     * Gets the list of emitted attributes
     */
    public attributes: string[] = [];
    /**
     * Gets the list of emitted uniforms
     */
    public uniforms: string[] = [];
    /**
     * Gets the list of emitted constants
     */
    public constants: string[] = [];
    /**
     * Gets the list of emitted samplers
     */
    public samplers: string[] = [];
    /**
     * Gets the list of emitted functions
     */
    public functions: { [key: string]: string } = {};
    /**
     * Gets the list of emitted extensions
     */
    public extensions: { [key: string]: string } = {};
    /**
     * Gets the list of emitted prePass outputs - if using the prepass
     */
    public prePassOutput: { [key: string]: string } = {};

    /**
     * Gets the target of the compilation state
     */
    public target: NodeMaterialBlockTargets;
    /**
     * Gets the list of emitted counters
     */
    public counters: { [key: string]: number } = {};

    /**
     * Shared data between multiple NodeMaterialBuildState instances
     */
    public sharedData: NodeMaterialBuildStateSharedData;

    /** @internal */
    public _vertexState: NodeMaterialBuildState;

    /** @internal */
    public _attributeDeclaration = "";
    /** @internal */
    public _uniformDeclaration = "";
    /** @internal */
    public _constantDeclaration = "";
    /** @internal */
    public _samplerDeclaration = "";
    /** @internal */
    public _varyingTransfer = "";
    /** @internal */
    public _injectAtEnd = "";

    private _repeatableContentAnchorIndex = 0;
    /** @internal */
    public _builtCompilationString = "";

    /**
     * Gets the emitted compilation strings
     */
    public compilationString = "";

    /**
     * Gets the current shader language to use
     */
    public get shaderLanguage() {
        return this.sharedData.nodeMaterial.shaderLanguage;
    }

    /** Gets suffix to add behind type casting */
    public get fSuffix() {
        return this.shaderLanguage === ShaderLanguage.WGSL ? "f" : "";
    }

    /**
     * Finalize the compilation strings
     * @param state defines the current compilation state
     */
    public finalize(state: NodeMaterialBuildState) {
        const emitComments = state.sharedData.emitComments;
        const isFragmentMode = this.target === NodeMaterialBlockTargets.Fragment;

        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            if (isFragmentMode) {
                this.compilationString = `\n${emitComments ? "//Entry point\n" : ""}@fragment\nfn main(input: FragmentInputs) -> FragmentOutputs {\n${this.compilationString}`;
            } else {
                this.compilationString = `\n${emitComments ? "//Entry point\n" : ""}@vertex\nfn main(input: VertexInputs) -> FragmentInputs{\n${this.compilationString}`;
            }
        } else {
            this.compilationString = `\n${emitComments ? "//Entry point\n" : ""}void main(void) {\n${this.compilationString}`;
        }

        if (this._constantDeclaration) {
            this.compilationString = `\n${emitComments ? "//Constants\n" : ""}${this._constantDeclaration}\n${this.compilationString}`;
        }

        let functionCode = "";
        for (const functionName in this.functions) {
            functionCode += this.functions[functionName] + `\n`;
        }
        this.compilationString = `\n${functionCode}\n${this.compilationString}`;

        if (!isFragmentMode && this._varyingTransfer) {
            this.compilationString = `${this.compilationString}\n${this._varyingTransfer}`;
        }

        if (this._injectAtEnd) {
            this.compilationString = `${this.compilationString}\n${this._injectAtEnd}`;
        }

        this.compilationString = `${this.compilationString}\n}`;

        if (this.sharedData.varyingDeclaration) {
            this.compilationString = `\n${emitComments ? "//Varyings\n" : ""}${this.sharedData.varyingDeclaration}\n${this.compilationString}`;
        }

        if (this._samplerDeclaration) {
            this.compilationString = `\n${emitComments ? "//Samplers\n" : ""}${this._samplerDeclaration}\n${this.compilationString}`;
        }

        if (this._uniformDeclaration) {
            this.compilationString = `\n${emitComments ? "//Uniforms\n" : ""}${this._uniformDeclaration}\n${this.compilationString}`;
        }

        if (this._attributeDeclaration && !isFragmentMode) {
            this.compilationString = `\n${emitComments ? "//Attributes\n" : ""}${this._attributeDeclaration}\n${this.compilationString}`;
        }

        if (this.shaderLanguage !== ShaderLanguage.WGSL) {
            this.compilationString = "precision highp float;\n" + this.compilationString;
            this.compilationString = "#if defined(WEBGL2) || defines(WEBGPU)\nprecision highp sampler2DArray;\n#endif\n" + this.compilationString;

            if (isFragmentMode) {
                this.compilationString =
                    "#if defined(PREPASS)\r\n#extension GL_EXT_draw_buffers : require\r\nlayout(location = 0) out highp vec4 glFragData[SCENE_MRT_COUNT];\r\nhighp vec4 gl_FragColor;\r\n#endif\r\n" +
                    this.compilationString;
            }

            for (const extensionName in this.extensions) {
                const extension = this.extensions[extensionName];
                this.compilationString = `\n${extension}\n${this.compilationString}`;
            }
        }

        this._builtCompilationString = this.compilationString;
    }

    /** @internal */
    public get _repeatableContentAnchor(): string {
        return `###___ANCHOR${this._repeatableContentAnchorIndex++}___###`;
    }

    /**
     * @internal
     */
    public _getFreeVariableName(prefix: string): string {
        prefix = prefix.replace(/[^a-zA-Z_]+/g, "");

        if (this.sharedData.variableNames[prefix] === undefined) {
            this.sharedData.variableNames[prefix] = 0;

            // Check reserved words
            if (prefix === "output" || prefix === "texture") {
                return prefix + this.sharedData.variableNames[prefix];
            }

            return prefix;
        } else {
            this.sharedData.variableNames[prefix]++;
        }

        return prefix + this.sharedData.variableNames[prefix];
    }

    /**
     * @internal
     */
    public _getFreeDefineName(prefix: string): string {
        if (this.sharedData.defineNames[prefix] === undefined) {
            this.sharedData.defineNames[prefix] = 0;
        } else {
            this.sharedData.defineNames[prefix]++;
        }

        return prefix + this.sharedData.defineNames[prefix];
    }

    /**
     * @internal
     */
    public _excludeVariableName(name: string) {
        this.sharedData.variableNames[name] = 0;
    }

    /**
     * @internal
     */
    public _emit2DSampler(name: string) {
        if (this.samplers.indexOf(name) < 0) {
            if (this.shaderLanguage === ShaderLanguage.WGSL) {
                this._samplerDeclaration += `var ${name + Constants.AUTOSAMPLERSUFFIX}: sampler;\n`;
                this._samplerDeclaration += `var ${name}: texture_2d<f32>;\n`;
            } else {
                this._samplerDeclaration += `uniform sampler2D ${name};\n`;
            }
            this.samplers.push(name);
        }
    }

    /**
     * @internal
     */
    public _emit2DArraySampler(name: string) {
        if (this.samplers.indexOf(name) < 0) {
            this._samplerDeclaration += `uniform sampler2DArray ${name};\n`;
            this.samplers.push(name);
        }
    }

    /**
     * @internal
     */
    public _getGLType(type: NodeMaterialBlockConnectionPointTypes): string {
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return "float";
            case NodeMaterialBlockConnectionPointTypes.Int:
                return "int";
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return "vec2";
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return "vec3";
            case NodeMaterialBlockConnectionPointTypes.Color4:
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return "vec4";
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return "mat4";
        }

        return "";
    }

    /**
     * @internal
     */
    public _getShaderType(type: NodeMaterialBlockConnectionPointTypes) {
        const isWGSL = this.shaderLanguage === ShaderLanguage.WGSL;

        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return isWGSL ? "f32" : "float";
            case NodeMaterialBlockConnectionPointTypes.Int:
                return isWGSL ? "i32" : "int";
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return isWGSL ? "vec2f" : "vec2";
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return isWGSL ? "vec3f" : "vec3";
            case NodeMaterialBlockConnectionPointTypes.Color4:
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return isWGSL ? "vec4f" : "vec4";
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return isWGSL ? "mat4x4f" : "mat4";
        }

        return "";
    }

    /**
     * @internal
     */
    public _emitExtension(name: string, extension: string, define: string = "") {
        if (this.extensions[name]) {
            return;
        }

        if (define) {
            extension = `#if ${define}\n${extension}\n#endif`;
        }
        this.extensions[name] = extension;
    }

    /**
     * @internal
     */
    public _emitFunction(name: string, code: string, comments: string) {
        if (this.functions[name]) {
            return;
        }

        if (this.sharedData.emitComments) {
            code = comments + `\n` + code;
        }

        this.functions[name] = code;
    }

    /**
     * @internal
     */
    public _emitCodeFromInclude(
        includeName: string,
        comments: string,
        options?: {
            replaceStrings?: { search: RegExp; replace: string }[];
            repeatKey?: string;
            substitutionVars?: string;
        }
    ) {
        if (options && options.repeatKey) {
            return `#include<${includeName}>${options.substitutionVars ? "(" + options.substitutionVars + ")" : ""}[0..${options.repeatKey}]\n`;
        }

        const store = EngineShaderStore.GetIncludesShadersStore(this.shaderLanguage);
        let code = store[includeName] + "\n";

        if (this.sharedData.emitComments) {
            code = comments + `\n` + code;
        }

        if (!options) {
            return code;
        }

        if (options.replaceStrings) {
            for (let index = 0; index < options.replaceStrings.length; index++) {
                const replaceString = options.replaceStrings[index];
                code = code.replace(replaceString.search, replaceString.replace);
            }
        }

        return code;
    }

    /**
     * @internal
     */
    public _emitFunctionFromInclude(
        includeName: string,
        comments: string,
        options?: {
            repeatKey?: string;
            substitutionVars?: string;
            removeAttributes?: boolean;
            removeUniforms?: boolean;
            removeVaryings?: boolean;
            removeIfDef?: boolean;
            replaceStrings?: { search: RegExp; replace: string }[];
        },
        storeKey: string = ""
    ) {
        const key = includeName + storeKey;
        if (this.functions[key]) {
            return;
        }

        if (!options || (!options.removeAttributes && !options.removeUniforms && !options.removeVaryings && !options.removeIfDef && !options.replaceStrings)) {
            if (options && options.repeatKey) {
                this.functions[key] = `#include<${includeName}>${options.substitutionVars ? "(" + options.substitutionVars + ")" : ""}[0..${options.repeatKey}]\n`;
            } else {
                this.functions[key] = `#include<${includeName}>${options?.substitutionVars ? "(" + options?.substitutionVars + ")" : ""}\n`;
            }

            if (this.sharedData.emitComments) {
                this.functions[key] = comments + `\n` + this.functions[key];
            }

            return;
        }

        const store = EngineShaderStore.GetIncludesShadersStore(this.shaderLanguage);

        this.functions[key] = store[includeName];

        if (this.sharedData.emitComments) {
            this.functions[key] = comments + `\n` + this.functions[key];
        }

        if (options.removeIfDef) {
            this.functions[key] = this.functions[key].replace(/^\s*?#ifdef.+$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#endif.*$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#else.*$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#elif.*$/gm, "");
        }

        if (options.removeAttributes) {
            this.functions[key] = this.functions[key].replace(/\s*?attribute .+?;/g, "\n");
        }

        if (options.removeUniforms) {
            this.functions[key] = this.functions[key].replace(/\s*?uniform .*?;/g, "\n");
        }

        if (options.removeVaryings) {
            this.functions[key] = this.functions[key].replace(/\s*?(varying|in) .+?;/g, "\n");
        }

        if (options.replaceStrings) {
            for (let index = 0; index < options.replaceStrings.length; index++) {
                const replaceString = options.replaceStrings[index];
                this.functions[key] = this.functions[key].replace(replaceString.search, replaceString.replace);
            }
        }
    }

    /**
     * @internal
     */
    public _registerTempVariable(name: string) {
        if (this.sharedData.temps.indexOf(name) !== -1) {
            return false;
        }

        this.sharedData.temps.push(name);
        return true;
    }

    /**
     * @internal
     */
    public _emitVaryingFromString(name: string, type: NodeMaterialBlockConnectionPointTypes, define: string = "", notDefine = false) {
        if (this.sharedData.varyings.indexOf(name) !== -1) {
            return false;
        }

        this.sharedData.varyings.push(name);

        if (define) {
            if (define.startsWith("defined(")) {
                this.sharedData.varyingDeclaration += `#if ${define}\n`;
            } else {
                this.sharedData.varyingDeclaration += `${notDefine ? "#ifndef" : "#ifdef"} ${define}\n`;
            }
        }
        const shaderType = this._getShaderType(type);
        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            this.sharedData.varyingDeclaration += `varying ${name}: ${shaderType};\n`;
        } else {
            this.sharedData.varyingDeclaration += `varying ${shaderType} ${name};\n`;
        }
        if (define) {
            this.sharedData.varyingDeclaration += `#endif\n`;
        }

        return true;
    }

    /**
     * @internal
     */
    public _getVaryingName(name: string): string {
        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            return (this.target !== NodeMaterialBlockTargets.Fragment ? "vertexOutputs." : "fragmentInputs.") + name;
        }

        return name;
    }

    /**
     * @internal
     */
    public _emitUniformFromString(name: string, type: NodeMaterialBlockConnectionPointTypes, define: string = "", notDefine = false) {
        if (this.uniforms.indexOf(name) !== -1) {
            return;
        }

        this.uniforms.push(name);

        if (define) {
            if (define.startsWith("defined(")) {
                this._uniformDeclaration += `#if ${define}\n`;
            } else {
                this._uniformDeclaration += `${notDefine ? "#ifndef" : "#ifdef"} ${define}\n`;
            }
        }
        const shaderType = this._getShaderType(type);
        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            this._uniformDeclaration += `uniform ${name}: ${shaderType};\n`;
        } else {
            this._uniformDeclaration += `uniform ${shaderType} ${name};\n`;
        }
        if (define) {
            this._uniformDeclaration += `#endif\n`;
        }
    }

    /**
     * @internal
     */
    public _generateTernary(trueStatement: string, falseStatement: string, condition: string) {
        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            return `select(${falseStatement}, ${trueStatement}, ${condition})`;
        }

        return `${condition} ? ${trueStatement} : ${falseStatement}`;
    }

    /**
     * @internal
     */
    public _emitFloat(value: number) {
        if (value.toString() === value.toFixed(0)) {
            return `${value}.0`;
        }

        return value.toString();
    }

    /**
     * @internal
     */
    public _declareOutput(output: NodeMaterialConnectionPoint, isConst?: boolean): string {
        return this._declareLocalVar(output.associatedVariableName, output.type, isConst);
    }

    /**
     * @internal
     */
    public _declareLocalVar(name: string, type: NodeMaterialBlockConnectionPointTypes, isConst?: boolean): string {
        if (this.shaderLanguage === ShaderLanguage.WGSL) {
            return `${isConst ? "const" : "var"} ${name}: ${this._getShaderType(type)}`;
        } else {
            return `${this._getShaderType(type)} ${name}`;
        }
    }

    private _convertVariableDeclarationToWGSL(type: string, dest: string, source: string): string {
        return source.replace(new RegExp(`(${type})\\s+(\\w+)`, "g"), `var $2: ${dest}`);
    }

    private _convertVariableConstructorsToWGSL(type: string, dest: string, source: string): string {
        return source.replace(new RegExp(`(${type})\\(`, "g"), ` ${dest}(`);
    }

    private _convertOutParametersToWGSL(source: string): string {
        return source.replace(new RegExp(`out\\s+var\\s+(\\w+)\\s*:\\s*(\\w+)`, "g"), `$1: ptr<function, $2>`);
    }

    private _convertTernaryOperandsToWGSL(source: string): string {
        return source.replace(new RegExp(`\\[(.*?)\\?(.*?):(.*)\\]`, "g"), (match, condition, trueCase, falseCase) => `select(${falseCase}, ${trueCase}, ${condition})`);
    }

    private _convertModOperatorsToWGSL(source: string): string {
        return source.replace(new RegExp(`mod\\((.+?),\\s*(.+?)\\)`, "g"), (match, left, right) => `((${left})%(${right}))`);
    }

    private _convertConstToWGSL(source: string): string {
        return source.replace(new RegExp(`const var`, "g"), `const`);
    }

    private _convertInnerFunctionsToWGSL(source: string): string {
        return source.replace(new RegExp(`inversesqrt`, "g"), `inverseSqrt`);
    }

    private _convertFunctionsToWGSL(source: string): string {
        const regex = /var\s+(\w+)\s*:\s*(\w+)\((.*)\)/g;

        let match: RegExpMatchArray | null;
        while ((match = regex.exec(source)) !== null) {
            const funcName = match[1];
            const funcType = match[2];
            const params = match[3]; // All parameters as a single string

            // Processing the parameters to match 'name: type' format
            const formattedParams = params.replace(/var\s/g, "");

            // Constructing the final output string
            source = source.replace(match[0], `fn ${funcName}(${formattedParams}) -> ${funcType}`);
        }
        return source;
    }

    public _babylonSLtoWGSL(code: string) {
        // variable declarations
        code = this._convertVariableDeclarationToWGSL("void", "voidnull", code);
        code = this._convertVariableDeclarationToWGSL("bool", "bool", code);
        code = this._convertVariableDeclarationToWGSL("int", "i32", code);
        code = this._convertVariableDeclarationToWGSL("uint", "u32", code);
        code = this._convertVariableDeclarationToWGSL("float", "f32", code);
        code = this._convertVariableDeclarationToWGSL("vec2", "vec2f", code);
        code = this._convertVariableDeclarationToWGSL("vec3", "vec3f", code);
        code = this._convertVariableDeclarationToWGSL("vec4", "vec4f", code);
        code = this._convertVariableDeclarationToWGSL("mat2", "mat2x2f", code);
        code = this._convertVariableDeclarationToWGSL("mat3", "mat3x3f", code);
        code = this._convertVariableDeclarationToWGSL("mat4", "mat4x4f", code);

        // Type constructors
        code = this._convertVariableConstructorsToWGSL("float", "f32", code);
        code = this._convertVariableConstructorsToWGSL("vec2", "vec2f", code);
        code = this._convertVariableConstructorsToWGSL("vec3", "vec3f", code);
        code = this._convertVariableConstructorsToWGSL("vec4", "vec4f", code);
        code = this._convertVariableConstructorsToWGSL("mat2", "mat2x2f", code);
        code = this._convertVariableConstructorsToWGSL("mat3", "mat3x3f", code);
        code = this._convertVariableConstructorsToWGSL("mat4", "mat4x4f", code);

        // Ternary operands
        code = this._convertTernaryOperandsToWGSL(code);

        // Mod operators
        code = this._convertModOperatorsToWGSL(code);

        // Const
        code = this._convertConstToWGSL(code);

        // Inner functions
        code = this._convertInnerFunctionsToWGSL(code);

        // Out paramters
        code = this._convertOutParametersToWGSL(code);
        code = code.replace(/\[\*\]/g, "*");

        // Functions
        code = this._convertFunctionsToWGSL(code);

        // Remove voidnull
        code = code.replace(/\s->\svoidnull/g, "");

        // Derivatives
        code = code.replace(/dFdx/g, "dpdx");
        code = code.replace(/dFdy/g, "dpdy");

        return code;
    }

    private _convertTernaryOperandsToGLSL(source: string): string {
        return source.replace(new RegExp(`\\[(.+?)\\?(.+?):(.+)\\]`, "g"), (match, condition, trueCase, falseCase) => `${condition} ? ${trueCase} : ${falseCase}`);
    }

    public _babylonSLtoGLSL(code: string) {
        /** Remove BSL specifics */
        code = code.replace(/\[\*\]/g, "");
        code = this._convertTernaryOperandsToGLSL(code);

        return code;
    }
}
