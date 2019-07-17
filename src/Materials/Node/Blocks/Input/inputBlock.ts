import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockConnectionPointMode } from '../../NodeMaterialBlockConnectionPointMode';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';
import { Nullable } from '../../../../types';
import { Effect } from '../../../../Materials/effect';
import { Matrix, Vector2, Vector3 } from '../../../../Maths/math.vector';
import { Scene } from '../../../../scene';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to expose an input value
 */
export class InputBlock extends NodeMaterialBlock {
    private _mode = NodeMaterialBlockConnectionPointMode.Undefined;
    private _associatedVariableName: string;
    private _storedValue: any;
    private _valueCallback: () => any;
    private _type: NodeMaterialBlockConnectionPointTypes;

    /** @hidden */
    public _wellKnownValue: Nullable<NodeMaterialWellKnownValues> = null;

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeMaterialBlockConnectionPointTypes {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            if (this.isUniform && this.value != null) {
                if (!isNaN(this.value)) {
                    return NodeMaterialBlockConnectionPointTypes.Float;
                }

                switch (this.value.getClassName()) {
                    case "Vector2":
                        return NodeMaterialBlockConnectionPointTypes.Vector2;
                    case "Vector3":
                        return NodeMaterialBlockConnectionPointTypes.Vector3;
                    case "Vector4":
                        return NodeMaterialBlockConnectionPointTypes.Vector4;
                    case "Color3":
                        return NodeMaterialBlockConnectionPointTypes.Color3;
                    case "Color4":
                        return NodeMaterialBlockConnectionPointTypes.Color4;
                }
            }

            if (this.isAttribute) {
                switch (this.name) {
                    case "position":
                    case "normal":
                    case "tangent":
                        return NodeMaterialBlockConnectionPointTypes.Vector3;
                    case "uv":
                    case "uv2":
                        return NodeMaterialBlockConnectionPointTypes.Vector2;
                }
            }

            if (this.isWellKnownValue) {
                switch (this._wellKnownValue) {
                    case NodeMaterialWellKnownValues.World:
                    case NodeMaterialWellKnownValues.WorldView:
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                    case NodeMaterialWellKnownValues.View:
                    case NodeMaterialWellKnownValues.ViewProjection:
                    case NodeMaterialWellKnownValues.Projection:
                        return NodeMaterialBlockConnectionPointTypes.Matrix;
                    case NodeMaterialWellKnownValues.CameraPosition:
                        return NodeMaterialBlockConnectionPointTypes.Vector3;
                }
            }
        }

        return this._type;
    }

    /**
     * Creates a new InputBlock
     * @param name defines the block name
     * @param target defines the target of that block (Vertex by default)
     * @param type defines the type of the input (can be set to NodeMaterialBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, target = NodeMaterialBlockTargets.Vertex, type: NodeMaterialBlockConnectionPointTypes = NodeMaterialBlockConnectionPointTypes.AutoDetect) {
        super(name, target, false, true);

        this._type = type;

        this.registerOutput("output", type);
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Set the source of this connection point to a vertex attribute
     * @param attributeName defines the attribute name (position, uv, normal, etc...). If not specified it will take the connection point name
     * @returns the current connection point
     */
    public setAsAttribute(attributeName?: string): InputBlock {
        if (attributeName) {
            this.name = attributeName;
        }
        this._mode = NodeMaterialBlockConnectionPointMode.Attribute;
        return this;
    }

    /**
     * Set the source of this connection point to a well known value
     * @param value define the well known value to use (world, view, etc...) or null to switch to manual value
     * @returns the current connection point
     */
    public setAsWellKnownValue(value: Nullable<NodeMaterialWellKnownValues>): InputBlock {
        this.wellKnownValue = value;
        return this;
    }

    /**
     * Gets or sets the value of that point.
     * Please note that this value will be ignored if valueCallback is defined
     */
    public get value(): any {
        return this._storedValue;
    }

    public set value(value: any) {
        this._storedValue = value;
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;
    }

    /**
     * Gets or sets a callback used to get the value of that point.
     * Please note that setting this value will force the connection point to ignore the value property
     */
    public get valueCallback(): () => any {
        return this._valueCallback;
    }

    public set valueCallback(value: () => any) {
        this._valueCallback = value;
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;
    }

    /**
     * Gets or sets the associated variable name in the shader
     */
    public get associatedVariableName(): string {
        return this._associatedVariableName;
    }

    public set associatedVariableName(value: string) {
        this._associatedVariableName = value;
    }

    /**
     * Gets a boolean indicating that this connection point not defined yet
     */
    public get isUndefined(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Undefined;
    }

    /**
     * Gets or sets a boolean indicating that this connection point is coming from an uniform.
     * In this case the connection point name must be the name of the uniform to use.
     * Can only be set on inputs
     */
    public get isUniform(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Uniform;
    }

    public set isUniform(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Uniform : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets or sets a boolean indicating that this connection point is coming from an attribute.
     * In this case the connection point name must be the name of the attribute to use
     * Can only be set on inputs
     */
    public get isAttribute(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Attribute;
    }

    public set isAttribute(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Attribute : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets or sets a boolean indicating that this connection point is generating a varying variable.
     * Can only be set on exit points
     */
    public get isVarying(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Varying;
    }

    public set isVarying(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Varying : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets a boolean indicating that the current connection point is a well known value
     */
    public get isWellKnownValue(): boolean {
        return this._wellKnownValue != null;
    }

    /**
     * Gets or sets the current well known value or null if not defined as well know value
     */
    public get wellKnownValue(): Nullable<NodeMaterialWellKnownValues> {
        return this._wellKnownValue;
    }

    public set wellKnownValue(value: Nullable<NodeMaterialWellKnownValues>) {
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;
        this.associatedVariableName = "";
        this._wellKnownValue = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InputBlock";
    }

    private _emitDefine(define: string): string {
        if (define[0] === "!") {
            return `#ifndef ${define.substring(1)}\r\n`;
        }

        return `#ifdef ${define}\r\n`;
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                this.value = 0;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                this.value = Vector2.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
                this.value = Vector3.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                this.value = Matrix.Identity();
                break;
        }
    }

    private _emit(state: NodeMaterialBuildState, define?: string) {
        // Uniforms
        if (this.isUniform) {
            if (!this.associatedVariableName) {
                this.associatedVariableName = state._getFreeVariableName("u_" + this.name);
            }

            if (state.uniforms.indexOf(this.associatedVariableName) !== -1) {
                return;
            }

            state.uniforms.push(this.associatedVariableName);
            if (define) {
                state._uniformDeclaration += this._emitDefine(define);
            }
            state._uniformDeclaration += `uniform ${state._getGLType(this.type)} ${this.associatedVariableName};\r\n`;
            if (define) {
                state._uniformDeclaration += `#endif\r\n`;
            }

            // well known
            let hints = state.sharedData.hints;
            if (this._wellKnownValue !== null) {
                switch (this._wellKnownValue) {
                    case NodeMaterialWellKnownValues.WorldView:
                        hints.needWorldViewMatrix = true;
                        break;
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                        hints.needWorldViewProjectionMatrix = true;
                        break;
                }
            }

            return;
        }

        // Attribute
        if (this.isAttribute) {
            this.associatedVariableName = this.name;

            if (this.target === NodeMaterialBlockTargets.Vertex && state._vertexState) { // Attribute for fragment need to be carried over by varyings
                this._emit(state._vertexState, define);
                return;
            }

            if (state.attributes.indexOf(this.associatedVariableName) !== -1) {
                return;
            }

            state.attributes.push(this.associatedVariableName);
            if (define) {
                state._attributeDeclaration += this._emitDefine(define);
            }
            state._attributeDeclaration += `attribute ${state._getGLType(this.type)} ${this.associatedVariableName};\r\n`;
            if (define) {
                state._attributeDeclaration += `#endif\r\n`;
            }
        }
    }

    /** @hidden */
    public _transmitWorld(effect: Effect, world: Matrix, worldView: Matrix, worldViewProjection: Matrix) {
        if (!this._wellKnownValue) {
            return;
        }

        let variableName = this.associatedVariableName;
        switch (this._wellKnownValue) {
            case NodeMaterialWellKnownValues.World:
                effect.setMatrix(variableName, world);
                break;
            case NodeMaterialWellKnownValues.WorldView:
                effect.setMatrix(variableName, worldView);
                break;
            case NodeMaterialWellKnownValues.WorldViewProjection:
                effect.setMatrix(variableName, worldViewProjection);
                break;
        }
    }

    /** @hidden */
    public _transmit(effect: Effect, scene: Scene) {
        if (this.isAttribute) {
            return;
        }

        let variableName = this.associatedVariableName;
        if (this._wellKnownValue) {
            switch (this._wellKnownValue) {
                case NodeMaterialWellKnownValues.World:
                case NodeMaterialWellKnownValues.WorldView:
                case NodeMaterialWellKnownValues.WorldViewProjection:
                    return;
                case NodeMaterialWellKnownValues.View:
                    effect.setMatrix(variableName, scene.getViewMatrix());
                    break;
                case NodeMaterialWellKnownValues.Projection:
                    effect.setMatrix(variableName, scene.getProjectionMatrix());
                    break;
                case NodeMaterialWellKnownValues.ViewProjection:
                    effect.setMatrix(variableName, scene.getTransformMatrix());
                    break;
                case NodeMaterialWellKnownValues.CameraPosition:
                    effect.setVector3(variableName, scene.activeCamera!.globalPosition);
                    break;
                case NodeMaterialWellKnownValues.FogColor:
                    effect.setColor3(variableName, scene.fogColor);
                    break;
            }
            return;
        }

        let value = this._valueCallback ? this._valueCallback() : this._storedValue;

        if (value === null) {
            return;
        }

        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                effect.setFloat(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Int:
                effect.setInt(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                effect.setColor3(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                effect.setDirectColor4(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                effect.setVector2(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                effect.setVector3(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
                effect.setFloat4(variableName, value.r, value.g, value.b, value.a || 1.0);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                effect.setVector4(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                effect.setMatrix(variableName, value);
                break;
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.isUniform || this.isWellKnownValue) {
            state.sharedData.inputBlocks.push(this);
        }

        this._emit(state);
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.type = this.type;
        serializationObject.mode = this._mode;
        serializationObject.wellKnownValue = this._wellKnownValue;

        if (this._storedValue != null && this._mode === NodeMaterialBlockConnectionPointMode.Uniform) {
            if (this._storedValue.asArray) {
                serializationObject.valueType = "BABYLON." + this._storedValue.getClassName();
                serializationObject.value = this._storedValue.asArray();
            } else {
                serializationObject.valueType = "number";
                serializationObject.value = this._storedValue;
            }
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this._type = serializationObject.type;
        this._mode = serializationObject.mode;
        this._wellKnownValue = serializationObject.wellKnownValue;

        if (!serializationObject.valueType) {
            return;
        }

        if (serializationObject.valueType === "number") {
            this._storedValue = serializationObject.value;
        } else {
            let valueType = _TypeStore.GetClass(serializationObject.valueType);

            if (valueType) {
                this._storedValue = valueType.FromArray(serializationObject.value);
            }
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.InputBlock"] = InputBlock;