import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlock } from './nodeMaterialBlock';
import { Nullable } from '../../types';
import { Effect } from '../effect';

/**
 * Defines a connection point for a block
 */
export class NodeMaterialConnectionPoint {
    private _ownerBlock: NodeMaterialBlock;
    private _connectedPoint: Nullable<NodeMaterialConnectionPoint>;
    private _associatedVariableName: string;

    private _storedValue: any;

    /**
     * Gets or sets the connection point type (default is float)
     */
    public type: NodeMaterialBlockConnectionPointTypes = NodeMaterialBlockConnectionPointTypes.Float;

    /**
     * Gets or sets the connection point name
     */
    public name: string;

    /**
     * Gets or sets the value of that point (when defined as isUniform === true)
     */
    public get value(): any {
        return this._storedValue;
    }

    public set value(value: any) {
        this._storedValue = value;
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
     * Gets or sets a boolean indicating that this connection point is coming from an uniform.
     * In this case the connection point name must be the name of the uniform to use.
     * Can only be set on entry points
     */
    public isUniform: boolean;

    /**
     * Gets or sets a boolean indicating that this connection point is coming from an attribute.
     * In this case the connection point name must be the name of the attribute to use
     * Can only be set on entry points
     */
    public isAttribute: boolean;

    /**
     * Gets or sets a boolean indicating that this connection point is generating a varying variable.
     * Can only be set on exit points
     */
    public isVarying: boolean;

    /** Get the other side of the connection (if any) */
    public get connectedPoint(): Nullable<NodeMaterialConnectionPoint> {
        return this._connectedPoint;
    }

    /** Get the block that owns this connection point */
    public get ownerBlock(): NodeMaterialBlock {
        return this._ownerBlock;
    }

    /** Get the block connected on the other side of this connection (if any) */
    public get connectedBlock(): Nullable<NodeMaterialBlock> {
        if (!this._connectedPoint) {
            return null;
        }

        return this._connectedPoint.ownerBlock;
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
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     */
    public connectTo(connectionPoint: NodeMaterialConnectionPoint) {
        this._connectedPoint = connectionPoint;
        connectionPoint._connectedPoint = this;
    }

    /**
     * When connection point is an uniform, this function will send its value to the effect
     * @param effect defines the effect to transmit value to
     */
    public transmit(effect: Effect) {
        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                effect.setFloat(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Int:
                effect.setInt(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                effect.setColor3(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                effect.setDirectColor4(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                effect.setVector2(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                effect.setVector3(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                effect.setVector4(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                effect.setMatrix(this.name, this.value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Texture:
                effect.setTexture(this.name, this.value);
                break;
        }
    }
}