import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from './nodeMaterialBlockTargets';
import { Nullable } from '../../types';
import { InputBlock } from './Blocks/Input/inputBlock';

declare type NodeMaterialBlock = import("./nodeMaterialBlock").NodeMaterialBlock;

/**
 * Defines a connection point for a block
 */
export class NodeMaterialConnectionPoint {
    /** @hidden */
    public _ownerBlock: NodeMaterialBlock;
    /** @hidden */
    public _connectedPoint: Nullable<NodeMaterialConnectionPoint> = null;

    private _endpoints = new Array<NodeMaterialConnectionPoint>();
    private _associatedVariableName: string;

    /** @hidden */
    public _typeConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;

    private _type = NodeMaterialBlockConnectionPointTypes.Float;

    /** @hidden */
    public _enforceAssociatedVariableName = false;

    /**
     * Gets or sets the associated variable name in the shader
     */
    public get associatedVariableName(): string {
        if (this._ownerBlock.isInput) {
            return (this._ownerBlock as InputBlock).associatedVariableName;
        }

        if (!this._enforceAssociatedVariableName && this._connectedPoint) {
            return this._connectedPoint.associatedVariableName;
        }

        return this._associatedVariableName;
    }

    public set associatedVariableName(value: string) {
        this._associatedVariableName = value;
    }

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeMaterialBlockConnectionPointTypes {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return (this._ownerBlock as InputBlock).type;
            }

            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }
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
     * Gets a boolean indicating that the current point is connected
     */
    public get isConnected(): boolean {
        return this.connectedPoint !== null;
    }

    /**
     * Gets a boolean indicating that the current point is connected to an input block
     */
    public get isConnectedToInput(): boolean {
        return this.connectedPoint !== null && this.connectedPoint.ownerBlock.isInput;
    }

    /**
     * Gets a the connected input block (if any)
     */
    public get connectInputBlock(): Nullable<InputBlock> {
        if (!this.isConnectedToInput) {
            return null;
        }

        return this.connectedPoint!.ownerBlock as InputBlock;
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

    /** Gets the list of connected endpoints */
    public get endpoints() {
        return this, this._endpoints;
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
     * Gets an boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns true if the connection is possible
     */
    public canConnectTo(connectionPoint: NodeMaterialConnectionPoint) {
        if ((this.type & connectionPoint.type) === 0 && connectionPoint.type !== NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            let fail = true;
            // Check swizzle
            if (this.swizzle) {
                let swizzleLength = this.swizzle.length;
                let connectionLength = NodeMaterialConnectionPoint._GetTypeLength(connectionPoint.type);

                if (swizzleLength === connectionLength) {
                    fail = false;
                }
            }

            return !fail;
        }

        return true;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @returns the current connection point
     */
    public connectTo(connectionPoint: NodeMaterialConnectionPoint): NodeMaterialConnectionPoint {
        if (!this.canConnectTo(connectionPoint)) {
            throw "Cannot connect two different connection types.";
        }

        this._endpoints.push(connectionPoint);
        connectionPoint._connectedPoint = this;

        this._enforceAssociatedVariableName = false;
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
        this._enforceAssociatedVariableName = false;
        return this;
    }

    /**
     * Serializes this point in a JSON representation
     * @returns the serialized point object
     */
    public serialize(): any {
        let serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.swizzle = this.swizzle;

        if (this.connectedPoint) {
            serializationObject.inputName = this.name;
            serializationObject.targetBlockId = this.connectedPoint.ownerBlock.uniqueId;
            serializationObject.targetConnectionName = this.connectedPoint.name;
        }

        return serializationObject;
    }

    // Statics
    private static _GetTypeLength(type: NodeMaterialBlockConnectionPointTypes) {
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
}