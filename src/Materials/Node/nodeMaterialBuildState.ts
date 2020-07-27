import { NodeMaterialBlockConnectionPointTypes } from './Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from './Enums/nodeMaterialBlockTargets';
import { NodeMaterialBuildStateSharedData } from './nodeMaterialBuildStateSharedData';
import { Effect } from '../effect';
import { StringTools } from '../../Misc/stringTools';

/**
 * Class used to store node based material build state
 */
export class NodeMaterialBuildState {
    /** Gets or sets a boolean indicating if the current state can emit uniform buffers */
    public supportUniformBuffers = false;
    /**
     * Gets the list of emitted attributes
     */
    public attributes = new Array<string>();
    /**
     * Gets the list of emitted uniforms
     */
    public uniforms = new Array<string>();
    /**
    * Gets the list of emitted constants
    */
    public constants = new Array<string>();
    /**
     * Gets the list of emitted samplers
     */
    public samplers = new Array<string>();
    /**
     * Gets the list of emitted functions
     */
    public functions: { [key: string]: string } = {};
    /**
     * Gets the list of emitted extensions
     */
    public extensions: { [key: string]: string } = {};

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

    /** @hidden */
    public _vertexState: NodeMaterialBuildState;

    /** @hidden */
    public _attributeDeclaration = "";
    /** @hidden */
    public _uniformDeclaration = "";
    /** @hidden */
    public _constantDeclaration = "";
    /** @hidden */
    public _samplerDeclaration = "";
    /** @hidden */
    public _varyingTransfer = "";
    /** @hidden */
    public _injectAtEnd = "";

    private _repeatableContentAnchorIndex = 0;
    /** @hidden */
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
        let emitComments = state.sharedData.emitComments;
        let isFragmentMode = (this.target === NodeMaterialBlockTargets.Fragment);

        this.compilationString = `\r\n${emitComments ? "//Entry point\r\n" : ""}void main(void) {\r\n${this.compilationString}`;

        if (this._constantDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Constants\r\n" : ""}${this._constantDeclaration}\r\n${this.compilationString}`;
        }

        let functionCode = "";
        for (var functionName in this.functions) {
            functionCode += this.functions[functionName] + `\r\n`;
        }
        this.compilationString = `\r\n${functionCode}\r\n${this.compilationString}`;

        if (!isFragmentMode && this._varyingTransfer) {
            this.compilationString = `${this.compilationString}\r\n${this._varyingTransfer}`;
        }

        if (this._injectAtEnd) {
            this.compilationString = `${this.compilationString}\r\n${this._injectAtEnd}`;
        }

        this.compilationString = `${this.compilationString}\r\n}`;

        if (this.sharedData.varyingDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Varyings\r\n" : ""}${this.sharedData.varyingDeclaration}\r\n${this.compilationString}`;
        }

        if (this._samplerDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Samplers\r\n" : ""}${this._samplerDeclaration}\r\n${this.compilationString}`;
        }

        if (this._uniformDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Uniforms\r\n" : ""}${this._uniformDeclaration}\r\n${this.compilationString}`;
        }

        if (this._attributeDeclaration && !isFragmentMode) {
            this.compilationString = `\r\n${emitComments ? "//Attributes\r\n" : ""}${this._attributeDeclaration}\r\n${this.compilationString}`;
        }

        for (var extensionName in this.extensions) {
            let extension = this.extensions[extensionName];
            this.compilationString = `\r\n${extension}\r\n${this.compilationString}`;
        }

        this._builtCompilationString = this.compilationString;
    }

    /** @hidden */
    public get _repeatableContentAnchor(): string {
        return `###___ANCHOR${this._repeatableContentAnchorIndex++}___###`;
    }

    /** @hidden */
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

    /** @hidden */
    public _getFreeDefineName(prefix: string): string {
        if (this.sharedData.defineNames[prefix] === undefined) {
            this.sharedData.defineNames[prefix] = 0;
        } else {
            this.sharedData.defineNames[prefix]++;
        }

        return prefix + this.sharedData.defineNames[prefix];
    }

    /** @hidden */
    public _excludeVariableName(name: string) {
        this.sharedData.variableNames[name] = 0;
    }

    /** @hidden */
    public _emit2DSampler(name: string) {
        this._samplerDeclaration += `uniform sampler2D ${name};\r\n`;
        this.samplers.push(name);
    }

    /** @hidden */
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

    /** @hidden */
    public _emitExtension(name: string, extension: string, define: string = "") {
        if (this.extensions[name]) {
            return;
        }

        if (define) {
            extension = `#if ${define}\r\n${extension}\r\n#endif`;
        }
        this.extensions[name] = extension;
    }

    /** @hidden */
    public _emitFunction(name: string, code: string, comments: string) {
        if (this.functions[name]) {
            return;
        }

        if (this.sharedData.emitComments) {
            code = comments + `\r\n` + code;
        }

        this.functions[name] = code;
    }

    /** @hidden */
    public _emitCodeFromInclude(includeName: string, comments: string, options?: {
        replaceStrings?: { search: RegExp, replace: string }[],
        repeatKey?: string
    }) {
        if (options && options.repeatKey) {
            return `#include<${includeName}>[0..${options.repeatKey}]\r\n`;
        }

        let code = Effect.IncludesShadersStore[includeName] + "\r\n";

        if (this.sharedData.emitComments) {
            code = comments + `\r\n` + code;
        }

        if (!options) {
            return code;
        }

        if (options.replaceStrings) {
            for (var index = 0; index < options.replaceStrings.length; index++) {
                let replaceString = options.replaceStrings[index];
                code = code.replace(replaceString.search, replaceString.replace);
            }
        }

        return code;
    }

    /** @hidden */
    public _emitFunctionFromInclude(includeName: string, comments: string, options?: {
        repeatKey?: string,
        removeAttributes?: boolean,
        removeUniforms?: boolean,
        removeVaryings?: boolean,
        removeIfDef?: boolean,
        replaceStrings?: { search: RegExp, replace: string }[],
    }, storeKey: string = "") {
        let key = includeName + storeKey;
        if (this.functions[key]) {
            return;
        }

        if (!options || (!options.removeAttributes && !options.removeUniforms && !options.removeVaryings && !options.removeIfDef && !options.replaceStrings)) {

            if (options && options.repeatKey) {
                this.functions[key] = `#include<${includeName}>[0..${options.repeatKey}]\r\n`;
            } else {
                this.functions[key] = `#include<${includeName}>\r\n`;
            }

            if (this.sharedData.emitComments) {
                this.functions[key] = comments + `\r\n` + this.functions[key];
            }

            return;
        }

        this.functions[key] = Effect.IncludesShadersStore[includeName];

        if (this.sharedData.emitComments) {
            this.functions[key] = comments + `\r\n` + this.functions[key];
        }

        if (options.removeIfDef) {
            this.functions[key] = this.functions[key].replace(/^\s*?#ifdef.+$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#endif.*$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#else.*$/gm, "");
            this.functions[key] = this.functions[key].replace(/^\s*?#elif.*$/gm, "");
        }

        if (options.removeAttributes) {
            this.functions[key] = this.functions[key].replace(/^\s*?attribute.+$/gm, "");
        }

        if (options.removeUniforms) {
            this.functions[key] = this.functions[key].replace(/^\s*?uniform.+$/gm, "");
        }

        if (options.removeVaryings) {
            this.functions[key] = this.functions[key].replace(/^\s*?varying.+$/gm, "");
        }

        if (options.replaceStrings) {
            for (var index = 0; index < options.replaceStrings.length; index++) {
                let replaceString = options.replaceStrings[index];
                this.functions[key] = this.functions[key].replace(replaceString.search, replaceString.replace);
            }
        }
    }

    /** @hidden */
    public _registerTempVariable(name: string) {
        if (this.sharedData.temps.indexOf(name) !== -1) {
            return false;
        }

        this.sharedData.temps.push(name);
        return true;
    }

    /** @hidden */
    public _emitVaryingFromString(name: string, type: string, define: string = "", notDefine = false) {
        if (this.sharedData.varyings.indexOf(name) !== -1) {
            return false;
        }

        this.sharedData.varyings.push(name);

        if (define) {
            if (StringTools.StartsWith(define, "defined(")) {
                this.sharedData.varyingDeclaration += `#if ${define}\r\n`;
            } else {
                this.sharedData.varyingDeclaration += `${notDefine ? "#ifndef" : "#ifdef"} ${define}\r\n`;
            }
        }
        this.sharedData.varyingDeclaration += `varying ${type} ${name};\r\n`;
        if (define) {
            this.sharedData.varyingDeclaration += `#endif\r\n`;
        }

        return true;
    }

    /** @hidden */
    public _emitUniformFromString(name: string, type: string, define: string = "", notDefine = false) {
        if (this.uniforms.indexOf(name) !== -1) {
            return;
        }

        this.uniforms.push(name);

        if (define) {
            if (StringTools.StartsWith(define, "defined(")) {
                this._uniformDeclaration += `#if ${define}\r\n`;
            } else {
                this._uniformDeclaration += `${notDefine ? "#ifndef" : "#ifdef"} ${define}\r\n`;
            }
        }
        this._uniformDeclaration += `uniform ${type} ${name};\r\n`;
        if (define) {
            this._uniformDeclaration += `#endif\r\n`;
        }
    }

    /** @hidden */
    public _emitFloat(value: number) {
        if (value.toString() === value.toFixed(0)) {
            return `${value}.0`;
        }

        return value.toString();
    }
}