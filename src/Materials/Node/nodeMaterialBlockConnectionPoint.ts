import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { Nullable } from '../../types';
import { Effect } from '../effect';
import { NodeMaterialWellKnownValues } from './nodeMaterialWellKnownValues';
import { Scene } from '../../scene';
import { Matrix } from '../../Maths/math';
import { NodeMaterialBlockConnectionPointMode } from './NodeMaterialBlockConnectionPointMode';

declare type NodeMaterialBlock = import("./nodeMaterialBlock").NodeMaterialBlock;

/**
 * Defines a connection point for a block
 */
export class NodeMaterialConnectionPoint {
    /** @hidden */
    public _ownerBlock: NodeMaterialBlock;
    /** @hidden */
    public _connectedPoint: Nullable<NodeMaterialConnectionPoint>;
    private _associatedVariableName: string;
    private _endpoints = new Array<NodeMaterialConnectionPoint>();
    private _storedValue: any;
    private _valueCallback: () => any;
    private _mode = NodeMaterialBlockConnectionPointMode.Undefined;

    /** @hidden */
    public _wellKnownValue: Nullable<NodeMaterialWellKnownValues> = null;

    /** @hidden */
    public _typeConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;

    /** @hidden */
    public _needToEmitVarying = true;

    /** @hidden */
    public _forceUniformInVertexShaderOnly = false;

    private _type = NodeMaterialBlockConnectionPointTypes.Float;
    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeMaterialBlockConnectionPointTypes {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect && this._connectedPoint) {
            return this._connectedPoint.type;
        }

        if (this._type === NodeMaterialBlockConnectionPointTypes.BasedOnInput && this._typeConnectionSource) {
            return this._typeConnectionSource.type;
        }

        return this._type;
    }

    public set type(value: NodeMaterialBlockConnectionPointTypes) {
        this._type = value;
    }

    /**
     * Gets or sets the connection point name
     */
    public name: string;

    /**
     * Gets or sets the swizzle to apply to this connection point when reading or writing
     */
    public swizzle: string;

    /**
     * Gets or sets a boolean indicating that this connection point can be omitted
     */
    public isOptional: boolean;

    /**
     * Gets or sets a string indicating that this uniform must be defined under a #ifdef
     */
    public define: string;

    /** Gets or sets the target of that connection point */
    public target: NodeMaterialBlockTargets = NodeMaterialBlockTargets.VertexAndFragment;

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
        if (!this._associatedVariableName && this._connectedPoint) {
            return this._connectedPoint.associatedVariableName;
        }

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

    /** Get the other side of the connection (if any) */
    public get connectedPoint(): Nullable<NodeMaterialConnectionPoint> {
        return this._connectedPoint;
    }

    /** Get the block that owns this connection point */
    public get ownerBlock(): NodeMaterialBlock {
        return this._ownerBlock;
    }

    /** Get the block connected on the other side of this connection (if any) */
    public get sourceBlock(): Nullable<NodeMaterialBlock> {
        if (!this._connectedPoint) {
            return null;
        }

        return this._connectedPoint.ownerBlock;
    }

    /** Get the block connected on the endpoints of this connection (if any) */
    public get connectedBlocks(): Array<NodeMaterialBlock> {
        if (this._endpoints.length === 0) {
            return [];
        }

        return this._endpoints.map((e) => e.ownerBlock);
    }

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     */
    public constructor(name: string, ownerBlock: NodeMaterialBlock) {
        this._ownerBlock = ownerBlock;
        this.name = name;
    }

    /**
     * Gets the current class name e.g. "NodeMaterialConnectionPoint"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeMaterialConnectionPoint";
    }

    /**
     * Set the source of this connection point to a vertex attribute
     * @param attributeName defines the attribute name (position, uv, normal, etc...). If not specified it will take the connection point name
     * @returns the current connection point
     */
    public setAsAttribute(attributeName?: string): NodeMaterialConnectionPoint {
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
    public setAsWellKnownValue(value: Nullable<NodeMaterialWellKnownValues>): NodeMaterialConnectionPoint {
        this.wellKnownValue = value;
        return this;
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

    private _getTypeLength(type: NodeMaterialBlockConnectionPointTypes) {
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return 1;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return 2;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return 3;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return 3;
        }

        return -1;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @returns the current connection point
     */
    public connectTo(connectionPoint: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
        if ((this.type & connectionPoint.type) === 0 && connectionPoint.type !== NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            let fail = true;
            // Check swizzle
            if (this.swizzle) {
                let swizzleLength = this.swizzle.length;
                let connectionLength = this._getTypeLength(connectionPoint.type);

                if (swizzleLength === connectionLength) {
                    fail = false;
                }
            }

            if (fail) {
                throw "Cannot connect two different connection types.";
            }
        }

        this._endpoints.push(connectionPoint);
        connectionPoint._connectedPoint = this;
        return this;
    }

    /**
     * Disconnect this point from one of his endpoint
     * @param endpoint defines the other connection point
     * @returns the current connection point
     */
    public disconnectFrom(endpoint: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
        let index = this._endpoints.indexOf(endpoint);

        if (index === -1) {
            return this;
        }

        this._endpoints.splice(index, 1);
        endpoint._connectedPoint = null;
        return this;
    }

    /**
     * When connection point is an uniform, this function will send its value to the effect
     * @param effect defines the effect to transmit value to
     * @param world defines the world matrix
     * @param worldView defines the worldxview matrix
     * @param worldViewProjection defines the worldxviewxprojection matrix
     */
    public transmitWorld(effect: Effect, world: Matrix, worldView: Matrix, worldViewProjection: Matrix) {
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

    /**
     * When connection point is an uniform, this function will send its value to the effect
     * @param effect defines the effect to transmit value to
     * @param scene defines the hosting scene
     */
    public transmit(effect: Effect, scene: Scene) {
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
            case NodeMaterialBlockConnectionPointTypes.Texture:
            case NodeMaterialBlockConnectionPointTypes.Texture3D:
                effect.setTexture(variableName, value);
                break;
        }
    }
}