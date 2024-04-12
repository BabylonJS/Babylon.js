import { NodeMaterialBlockConnectionPointTypes } from "./Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets";
import type { NodeMaterialBuildStateSharedData } from "./nodeMaterialBuildStateSharedData";
import { Effect } from "../effect";

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
     * Finalize the compilation strings
     * @param state defines the current compilation state
     */
    public finalize(state: NodeMaterialBuildState) {
        const emitComments = state.sharedData.emitComments;
        const isFragmentMode = this.target === NodeMaterialBlockTargets.Fragment;

        this.compilationString = `\n${emitComments ? "//Entry point\n" : ""}void main(void) {\n${this.compilationString}`;

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

        this.compilationString = "precision highp float;\n" + this.compilationString;
        this.compilationString = "#if defined(WEBGL2) || defined(WEBGPU)\nprecision highp sampler2DArray;\n#endif\n" + this.compilationString;

        if (isFragmentMode) {
            this.compilationString =
                "#if defined(PREPASS)\r\n#extension GL_EXT_draw_buffers : require\r\nlayout(location = 0) out highp vec4 glFragData[SCENE_MRT_COUNT];\r\nhighp vec4 gl_FragColor;\r\n#endif\r\n" +
                this.compilationString;
        }

        for (const extensionName in this.extensions) {
            const extension = this.extensions[extensionName];
            this.compilationString = `\n${extension}\n${this.compilationString}`;
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
            this._samplerDeclaration += `uniform sampler2D ${name};\n`;
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

        let code = Effect.IncludesShadersStore[includeName] + "\n";

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

        this.functions[key] = Effect.IncludesShadersStore[includeName];

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
    public _emitVaryingFromString(name: string, type: string, define: string = "", notDefine = false) {
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
        this.sharedData.varyingDeclaration += `varying ${type} ${name};\n`;
        if (define) {
            this.sharedData.varyingDeclaration += `#endif\n`;
        }

        return true;
    }

    /**
     * @internal
     */
    public _emitUniformFromString(name: string, type: string, define: string = "", notDefine = false) {
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
        this._uniformDeclaration += `uniform ${type} ${name};\n`;
        if (define) {
            this._uniformDeclaration += `#endif\n`;
        }
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
}
