import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';

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
     * Gets the list of emitted varyings
     */
    public varyings = new Array<string>();
    /**
     * Gets a boolean indicating if this state was emitted for a fragment shader
     */
    public isInFragmentMode = false;

    /** @hidden */
    public _variableNames: { [key: string]: number } = {};

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
        needWorldViewProjectionMatrix: false
    };

    private _attributeDeclaration = "";
    private _uniformDeclaration = "";
    private _samplerDeclaration = "";
    private _varyingDeclaration = "";
    private _varyingTransfer = "";

    /**
     * Gets the emitted compilation strings
     */
    public compilationString = "";

    /**
     * Finalize the compilation strings
     */
    public finalize() {
        this.compilationString = `\r\n//Entry point\r\nvoid main(void) {\r\n${this.compilationString}`;

        if (!this.isInFragmentMode && this.varyings.length > 0) {
            this.compilationString = `${this.compilationString}\r\n${this._varyingTransfer}`;
        }

        this.compilationString = `${this.compilationString}\r\n}`;

        if (this._varyingDeclaration) {
            this.compilationString = `\r\n//Varyings\r\n${this._varyingDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._samplerDeclaration) {
            this.compilationString = `\r\n//Samplers\r\n${this._samplerDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._uniformDeclaration) {
            this.compilationString = `\r\n//Uniforms\r\n${this._uniformDeclaration}\r\n\r\n${this.compilationString}`;
        }

        if (this._attributeDeclaration && !this.isInFragmentMode) {
            this.compilationString = `\r\n//Attributes\r\n${this._attributeDeclaration}\r\n\r\n${this.compilationString}`;
        }
    }

    /** @hidden */
    public _getFreeVariableName(prefix: string): string {
        if (this._variableNames[prefix] === undefined) {
            this._variableNames[prefix] = 0;
        } else {
            this._variableNames[prefix]++;
        }

        return prefix + this._variableNames[prefix];
    }

    /** @hidden */
    private _getGLType(type: NodeMaterialBlockConnectionPointTypes): string {
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
            case NodeMaterialBlockConnectionPointTypes.Texture:
                return "sampler2D";
        }
    }

    /** @hidden */
    public _emitVaryings(point: NodeMaterialConnectionPoint, force = false) {
        if (point.isVarying || force) {
            if (this.varyings.indexOf(point.associatedVariableName) !== -1) {
                return;
            }

            this.varyings.push(point.associatedVariableName);
            this._varyingDeclaration += `varying ${this._getGLType(point.type)} ${point.associatedVariableName};\r\n`;

            if (!this.isInFragmentMode) {
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
            switch (point.name) {
                case "world":
                    this.hints.needWorldMatrix = true;
                    break;
                case "view":
                    this.hints.needViewMatrix = true;
                    break;
                case "projection":
                    this.hints.needProjectionMatrix = true;
                    break;
                case "viewProjection":
                    this.hints.needViewProjectionMatrix = true;
                    break;
                case "worldView":
                    this.hints.needWorldViewMatrix = true;
                    break;
                case "worldViewProjection":
                    this.hints.needWorldViewProjectionMatrix = true;
                    break;
                default:
                    this._uniformConnectionPoints.push(point);
                    break;
            }

            return;
        }

        if (point.isAttribute) {
            if (this.isInFragmentMode) {
                this._vertexState._emitUniformOrAttributes(point);
                point.associatedVariableName = this._getFreeVariableName(point.name);
                this._emitVaryings(point, true);
                this._vertexState._emitVaryings(point, true);
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