import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialWellKnownValues } from './nodeMaterialWellKnownValues';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { NodeMaterialCompilationStateSharedData } from './nodeMaterialCompilationStateSharedData';
import { Effect } from '../../Materials/effect';

/**
 * Class used to store node based material compilation state
 */
export class NodeMaterialCompilationState {
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
     * Shared data between multiple NodeMaterialCompilationState instances
     */
    public sharedData: NodeMaterialCompilationStateSharedData;

    /** @hidden */
    public _uniformConnectionPoints = new Array<NodeMaterialConnectionPoint>();

    /** @hidden */
    public _vertexState: NodeMaterialCompilationState;

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
    public finalize(state: NodeMaterialCompilationState) {
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
    public _emitFunctionFromInclude(name: string, includeName: string, options?: {
        removeUniforms?: boolean,
        removeVaryings?: boolean,
        removeifDef?: boolean,
        replaceString?: string[],
    }) {
        if (this.functions[name]) {
            return;
        }

        this.functions[name] = Effect.IncludesShadersStore[includeName];

        if (!options) {
            return;
        }

        if (options.removeifDef) {
            this.functions[name] = this.functions[name].replace(/^\s*?#.+$/gm, "");
        }

        if (options.removeUniforms) {
            this.functions[name] = this.functions[name].replace(/^\s*?uniform.+$/gm, "");
        }

        if (options.removeVaryings) {
            this.functions[name] = this.functions[name].replace(/^\s*?varying.+$/gm, "");
        }

        if (options.replaceString) {
            for (var index = 0; index < options.replaceString.length; index += 2) {
                this.functions[name] = this.functions[name].replace(options.replaceString[index], options.replaceString[index + 1]);
            }
        }
    }

    /** @hidden */
    public _emitVaryings(point: NodeMaterialConnectionPoint, force = false, fromFragment = false) {
        if (point.isVarying || force) {
            if (this.sharedData.varyings.indexOf(point.associatedVariableName) !== -1) {
                return;
            }

            this.sharedData.varyings.push(point.associatedVariableName);
            this.sharedData.varyingDeclaration += `varying ${this._getGLType(point.type)} ${point.associatedVariableName};\r\n`;

            if (this.target === NodeMaterialBlockTargets.Vertex && fromFragment) {
                this._varyingTransfer += `${point.associatedVariableName} = ${point.name};\r\n`;
            }
        }
    }

    /** @hidden */
    public _emitUniformOrAttributes(point: NodeMaterialConnectionPoint) {
        // Samplers
        if (point.type === NodeMaterialBlockConnectionPointTypes.Texture) {
            point.name = this._getFreeVariableName(point.name);
            point.associatedVariableName = point.name;

            if (this.samplers.indexOf(point.name) !== -1) {
                return;
            }

            this.samplers.push(point.name);
            this._samplerDeclaration += `uniform ${this._getGLType(point.type)} ${point.name};\r\n`;
            this._uniformConnectionPoints.push(point);
            return;
        }

        if (!point.isUniform && !point.isAttribute) {
            return;
        }

        point.associatedVariableName = point.name;

        // Uniforms
        if (point.isUniform) {
            if (this.uniforms.indexOf(point.name) !== -1) {
                return;
            }

            this.uniforms.push(point.name);
            this._uniformDeclaration += `uniform ${this._getGLType(point.type)} ${point.name};\r\n`;

            // well known
            let hints = this.sharedData.hints;
            if (point._wellKnownValue !== null) {
                switch (point._wellKnownValue) {
                    case NodeMaterialWellKnownValues.World:
                        hints.needWorldMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.View:
                        hints.needViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.Projection:
                        hints.needProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.ViewProjection:
                        hints.needViewProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldView:
                        hints.needWorldViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                        hints.needWorldViewProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.FogColor:
                        hints.needFogColor = true;
                        break;
                    case NodeMaterialWellKnownValues.FogParameters:
                        hints.needFogParameters = true;
                        break;
                }
            } else {
                this._uniformConnectionPoints.push(point);
            }

            return;
        }

        if (point.isAttribute) {
            if (this.target === NodeMaterialBlockTargets.Fragment) { // Attribute for fragment need to be carried over by varyings
                this._vertexState._emitUniformOrAttributes(point);
                point.associatedVariableName = this._getFreeVariableName(point.name);
                this._emitVaryings(point, true);
                this._vertexState._emitVaryings(point, true, true);
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