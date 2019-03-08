import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialWellKnownValues } from './nodeMaterialWellKnownValues';
import { NodeMaterialBlockTargets } from './nodeMaterialBlock';

/**
 * Class used to store shared data between 2 NodeMaterialCompilationState
 */
export class NodeMaterialCompilationStateSharedData {
    /**
     * Gets the list of emitted varyings
     */
    public varyings = new Array<string>();

    /**
     * Gets the varying declaration string
     */
    public varyingDeclaration = "";

    /**
     * Build Id used to avoid multiple recompilations
     */
    public buildId: number;

    /** List of emitted variables */
    public variableNames: { [key: string]: number } = {};

    /** Should emit comments? */
    public emitComments: boolean;
}

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

    /**
     * Gets the compilation hints emitted at compilation time
     */
    public hints = {
        needWorldMatrix: false,
        needViewMatrix: false,
        needProjectionMatrix: false,
        needViewProjectionMatrix: false,
        needWorldViewMatrix: false,
        needWorldViewProjectionMatrix: false,
        needFogColor: false,
        needFogParameters: false
    };

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
            this.compilationString = `\r\n${emitComments ? "//Varyings\r\n" : ""}${this.sharedData.varyingDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._samplerDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Samplers\r\n" : ""}${this._samplerDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._uniformDeclaration) {
            this.compilationString = `\r\n${emitComments ? "//Uniforms\r\n" : ""}${this._uniformDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._attributeDeclaration && !isFragmentMode) {
            this.compilationString = `\r\n${emitComments ? "//Attributes\r\n" : ""}${this._attributeDeclaration}\r\n\r\n${this.compilationString}`;
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
            if (point._wellKnownValue !== null) {
                switch (point._wellKnownValue) {
                    case NodeMaterialWellKnownValues.World:
                        this.hints.needWorldMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.View:
                        this.hints.needViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.Projection:
                        this.hints.needProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.ViewProjection:
                        this.hints.needViewProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldView:
                        this.hints.needWorldViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                        this.hints.needWorldViewProjectionMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.FogColor:
                        this.hints.needFogColor = true;
                        break;
                    case NodeMaterialWellKnownValues.FogParameters:
                        this.hints.needFogParameters = true;
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