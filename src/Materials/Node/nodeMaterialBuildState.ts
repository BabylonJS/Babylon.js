import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialWellKnownValues } from './nodeMaterialWellKnownValues';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { NodeMaterialBuildStateSharedData } from './NodeMaterialBuildStateSharedData';
import { Effect } from '../effect';

/**
 * Class used to store node based material build state
 */
export class NodeMaterialBuildState {
    /**
     * Gets the list of emitted attributes
     */
    public attributes = new Array<string>();
    /**
     * Gets the list of emitted uniforms
     */
    public uniforms = new Array<string>();
    /**
     * Gets the list of emitted samplers
     */
    public samplers = new Array<string>();
    /**
     * Gets the list of emitted functions
     */
    public functions: { [key: string]: string } = {};
    /**
     * Gets the target of the compilation state
     */
    public target: NodeMaterialBlockTargets;

    /**
     * Shared data between multiple NodeMaterialBuildState instances
     */
    public sharedData: NodeMaterialBuildStateSharedData;

    /** @hidden */
    public _vertexState: NodeMaterialBuildState;

    private _attributeDeclaration = "";
    private _uniformDeclaration = "";
    private _samplerDeclaration = "";
    private _varyingTransfer = "";

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

        for (var functionName in this.functions) {
            let functionCode = this.functions[functionName];
            this.compilationString = `\r\n${functionCode}\r\n${this.compilationString}`;
        }

        if (!isFragmentMode && this._varyingTransfer) {
            this.compilationString = `${this.compilationString}\r\n${this._varyingTransfer}`;
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
    }

    /** @hidden */
    public _getFreeVariableName(prefix: string): string {
        if (this.sharedData.variableNames[prefix] === undefined) {
            this.sharedData.variableNames[prefix] = 0;
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
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
                return "vec3";
            case NodeMaterialBlockConnectionPointTypes.Color4:
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Vector4OrColor4:
                return "vec4";
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return "mat4";
            case NodeMaterialBlockConnectionPointTypes.Texture:
                return "sampler2D";
        }

        return "";
    }

    /** @hidden */
    public _emitFunction(name: string, code: string) {
        if (this.functions[name]) {
            return;
        }

        this.functions[name] = code;
    }

    /** @hidden */
    public _emitCodeFromInclude(includeName: string, options?: {
        replaceStrings?: { search: RegExp, replace: string }[],
    }) {
        let code = Effect.IncludesShadersStore[includeName] + "\r\n";

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
    public _emitFunctionFromInclude(name: string, includeName: string, options?: {
        removeAttributes?: boolean,
        removeUniforms?: boolean,
        removeVaryings?: boolean,
        removeifDef?: boolean,
        replaceStrings?: { search: RegExp, replace: string }[],
    }) {
        if (this.functions[name]) {
            return;
        }

        this.functions[name] = Effect.IncludesShadersStore[includeName];

        if (!options) {
            return;
        }

        if (options.removeifDef) {
            this.functions[name] = this.functions[name].replace(/^\s*?#ifdef.+$/gm, "");
            this.functions[name] = this.functions[name].replace(/^\s*?#endif.*$/gm, "");
            this.functions[name] = this.functions[name].replace(/^\s*?#else.*$/gm, "");
            this.functions[name] = this.functions[name].replace(/^\s*?#elif.*$/gm, "");
        }

        if (options.removeAttributes) {
            this.functions[name] = this.functions[name].replace(/^\s*?attribute.+$/gm, "");
        }

        if (options.removeUniforms) {
            this.functions[name] = this.functions[name].replace(/^\s*?uniform.+$/gm, "");
        }

        if (options.removeVaryings) {
            this.functions[name] = this.functions[name].replace(/^\s*?varying.+$/gm, "");
        }

        if (options.replaceStrings) {
            for (var index = 0; index < options.replaceStrings.length; index++) {
                let replaceString = options.replaceStrings[index];
                this.functions[name] = this.functions[name].replace(replaceString.search, replaceString.replace);
            }
        }
    }

    /** @hidden */
    public _emitVaryings(point: NodeMaterialConnectionPoint, define: string = "", force = false, fromFragment = false, replacementName: string = "") {
        let name = replacementName || point.associatedVariableName;
        if (point.isVarying || force) {
            if (this.sharedData.varyings.indexOf(name) !== -1) {
                return;
            }

            this.sharedData.varyings.push(name);

            if (define) {
                this.sharedData.varyingDeclaration += `#ifdef ${define}\r\n`;
            }
            this.sharedData.varyingDeclaration += `varying ${this._getGLType(point.type)} ${name};\r\n`;
            if (define) {
                this.sharedData.varyingDeclaration += `#endif\r\n`;
            }

            if (this.target === NodeMaterialBlockTargets.Vertex && fromFragment) {
                if (define) {
                    this.sharedData.varyingDeclaration += `#ifdef ${define}\r\n`;
                }
                this._varyingTransfer += `${name} = ${point.name};\r\n`;
                if (define) {
                    this.sharedData.varyingDeclaration += `#endif\r\n`;
                }
            }
        }
    }

    /** @hidden */
    public _emitUniformOrAttributes(point: NodeMaterialConnectionPoint, define?: string) {
        // Samplers
        if (point.type === NodeMaterialBlockConnectionPointTypes.Texture) {
            point.name = this._getFreeVariableName(point.name);
            point.associatedVariableName = point.name;

            if (this.samplers.indexOf(point.name) !== -1) {
                return;
            }

            this.samplers.push(point.name);
            if (define) {
                this._uniformDeclaration += `#ifdef ${define}\r\n`;
            }
            this._samplerDeclaration += `uniform ${this._getGLType(point.type)} ${point.name};\r\n`;
            if (define) {
                this._uniformDeclaration += `#endif\r\n`;
            }
            this.sharedData.uniformConnectionPoints.push(point);
            return;
        }

        if (!point.isUniform && !point.isAttribute) {
            return;
        }

        if (!point.associatedVariableName) {
            point.associatedVariableName = point.name;
        }

        // Uniforms
        if (point.isUniform) {
            if (this.uniforms.indexOf(point.associatedVariableName) !== -1) {
                return;
            }

            this.uniforms.push(point.associatedVariableName);
            if (define) {
                this._uniformDeclaration += `#ifdef ${define}\r\n`;
            }
            this._uniformDeclaration += `uniform ${this._getGLType(point.type)} ${point.associatedVariableName};\r\n`;
            if (define) {
                this._uniformDeclaration += `#endif\r\n`;
            }

            // well known
            let hints = this.sharedData.hints;
            if (point._wellKnownValue !== null) {
                switch (point._wellKnownValue) {
                    case NodeMaterialWellKnownValues.WorldView:
                        hints.needWorldViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                        hints.needWorldViewProjectionMatrix = true;
                        break;
                }
            }

            this.sharedData.uniformConnectionPoints.push(point);

            return;
        }

        if (point.isAttribute) {
            if (this.target === NodeMaterialBlockTargets.Fragment) { // Attribute for fragment need to be carried over by varyings
                this._vertexState._emitUniformOrAttributes(point);
                if (point.associatedVariableName) {
                    return;
                }
                point.associatedVariableName = this._getFreeVariableName(point.name);
                this._emitVaryings(point, "", true);
                this._vertexState._emitVaryings(point, "", true, true);
                return;
            }

            if (this.attributes.indexOf(point.name) !== -1) {
                return;
            }

            this.attributes.push(point.name);
            this._attributeDeclaration += `attribute ${this._getGLType(point.type)} ${point.name};\r\n`;
        }
    }
}