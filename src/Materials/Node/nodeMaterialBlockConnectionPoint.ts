import { NodeMaterialBlockConnectionPointTypes } from './Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from './Enums/nodeMaterialBlockTargets';
import { Nullable } from '../../types';
import { InputBlock } from './Blocks/Input/inputBlock';
import { Observable } from '../../Misc/observable';

declare type NodeMaterialBlock = import("./nodeMaterialBlock").NodeMaterialBlock;

/**
 * Enum used to define the compatibility state between two connection points
 */
export enum NodeMaterialConnectionPointCompatibilityStates {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because of their targets (vertex vs fragment) */
    TargetIncompatible
}

/**
 * Defines the direction of a connection point
 */
export enum NodeMaterialConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output
}

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
    private _direction: NodeMaterialConnectionPointDirection;

    /** @hidden */
    public _typeConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;

    /** @hidden */
    public _linkedConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;

    private _type = NodeMaterialBlockConnectionPointTypes.Float;

    /** @hidden */
    public _enforceAssociatedVariableName = false;

    /** Gets the direction of the point */
    public get direction() {
        return this._direction;
    }

    /** Indicates that this connection point needs dual validation before being connected to another point */
    public needDualDirectionValidation: boolean = false;

    /**
     * Gets or sets the additional types supported by this connection point
     */
    public acceptedConnectionPointTypes = new Array<NodeMaterialBlockConnectionPointTypes>();

    /**
     * Gets or sets the additional types excluded by this connection point
     */
    public excludedConnectionPointTypes = new Array<NodeMaterialBlockConnectionPointTypes>();

    /**
     * Observable triggered when this point is connected
     */
    public onConnectionObservable = new Observable<NodeMaterialConnectionPoint>();

    /**
     * Gets or sets the associated variable name in the shader
     */
    public get associatedVariableName(): string {
        if (this._ownerBlock.isInput) {
            return (this._ownerBlock as InputBlock).associatedVariableName;
        }

        if ((!this._enforceAssociatedVariableName || !this._associatedVariableName) && this._connectedPoint) {
            return this._connectedPoint.associatedVariableName;
        }

        return this._associatedVariableName;
    }

    public set associatedVariableName(value: string) {
        this._associatedVariableName = value;
    }

    /** Get the inner type (ie AutoDetect for instance instead of the inferred one) */
    public get innerType() {
        if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected) {
            return this.type;
        }
        return this._type;
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

            if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected) {
                return this._linkedConnectionSource.type;
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
     * Gets or sets the connection point name
     */
    public displayName: string;

    /**
     * Gets or sets a boolean indicating that this connection point can be omitted
     */
    public isOptional: boolean;

    /**
     * Gets or sets a boolean indicating that this connection point is exposed on a frame
     */
    public isExposedOnFrame: boolean =  false;

    /**
     * Gets or sets a string indicating that this uniform must be defined under a #ifdef
     */
    public define: string;

    /** @hidden */
    public _prioritizeVertex = false;

    private _target: NodeMaterialBlockTargets = NodeMaterialBlockTargets.VertexAndFragment;

    /** Gets or sets the target of that connection point */
    public get target(): NodeMaterialBlockTargets {
        if (!this._prioritizeVertex || !this._ownerBlock) {
            return this._target;
        }

        if (this._target !== NodeMaterialBlockTargets.VertexAndFragment) {
            return this._target;
        }

        if (this._ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            return NodeMaterialBlockTargets.Fragment;
        }

        return NodeMaterialBlockTargets.Vertex;
    }

    public set target(value: NodeMaterialBlockTargets) {
        this._target = value;
    }

    /**
     * Gets a boolean indicating that the current point is connected to another NodeMaterialBlock
     */
    public get isConnected(): boolean {
        return this.connectedPoint !== null || this.hasEndpoints;
    }

    /**
     * Gets a boolean indicating that the current point is connected to an input block
     */
    public get isConnectedToInputBlock(): boolean {
        return this.connectedPoint !== null && this.connectedPoint.ownerBlock.isInput;
    }

    /**
     * Gets a the connected input block (if any)
     */
    public get connectInputBlock(): Nullable<InputBlock> {
        if (!this.isConnectedToInputBlock) {
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
        return this._endpoints;
    }

    /** Gets a boolean indicating if that output point is connected to at least one input */
    public get hasEndpoints(): boolean {
        return this._endpoints && this._endpoints.length > 0;
    }

    /** Gets a boolean indicating that this connection will be used in the vertex shader */
    public get isConnectedInVertexShader(): boolean {
        if (this.target === NodeMaterialBlockTargets.Vertex) {
            return true;
        }

        if (!this.hasEndpoints) {
            return false;
        }

        for (var endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }

            if (endpoint.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }

            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.outputs.some((o) => o.isConnectedInVertexShader)) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Gets a boolean indicating that this connection will be used in the fragment shader */
    public get isConnectedInFragmentShader(): boolean {
        if (this.target === NodeMaterialBlockTargets.Fragment) {
            return true;
        }

        if (!this.hasEndpoints) {
            return false;
        }

        for (var endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
                return true;
            }

            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.outputs.some((o) => o.isConnectedInFragmentShader)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Creates a block suitable to be used as an input for this input point.
     * If null is returned, a block based on the point type will be created.
     * @returns The returned string parameter is the name of the output point of NodeMaterialBlock (first parameter of the returned array) that can be connected to the input
     */
    public createCustomInputBlock(): Nullable<[NodeMaterialBlock, string]> {
        return null;
    }

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    public constructor(name: string, ownerBlock: NodeMaterialBlock, direction: NodeMaterialConnectionPointDirection) {
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }

    /**
     * Gets the current class name e.g. "NodeMaterialConnectionPoint"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeMaterialConnectionPoint";
    }

    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    public canConnectTo(connectionPoint: NodeMaterialConnectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === NodeMaterialConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    public checkCompatibilityState(connectionPoint: NodeMaterialConnectionPoint): NodeMaterialConnectionPointCompatibilityStates {
        const ownerBlock = this._ownerBlock;

        if (ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            // Let's check we are not going reverse
            const otherBlock = connectionPoint.ownerBlock;

            if (otherBlock.target === NodeMaterialBlockTargets.Vertex) {
                return NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible;
            }

            for (var output of otherBlock.outputs) {
                if (output.isConnectedInVertexShader) {
                    return NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible;
                }
            }
        }

        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            // Equivalents
            switch (this.type) {
                case NodeMaterialBlockConnectionPointTypes.Vector3: {
                    if (connectionPoint.type === NodeMaterialBlockConnectionPointTypes.Color3) {
                        return NodeMaterialConnectionPointCompatibilityStates.Compatible;
                    }
                    break;
                }
                case NodeMaterialBlockConnectionPointTypes.Vector4: {
                    if (connectionPoint.type === NodeMaterialBlockConnectionPointTypes.Color4) {
                        return NodeMaterialConnectionPointCompatibilityStates.Compatible;
                    }
                    break;
                }
                case NodeMaterialBlockConnectionPointTypes.Color3: {
                    if (connectionPoint.type === NodeMaterialBlockConnectionPointTypes.Vector3) {
                        return NodeMaterialConnectionPointCompatibilityStates.Compatible;
                    }
                    break;
                }
                case NodeMaterialBlockConnectionPointTypes.Color4: {
                    if (connectionPoint.type === NodeMaterialBlockConnectionPointTypes.Vector4) {
                        return NodeMaterialConnectionPointCompatibilityStates.Compatible;
                    }
                    break;
                }
            }

            // Accepted types
            if (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) {
                return NodeMaterialConnectionPointCompatibilityStates.Compatible;
            } else {
                return NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible;
            }
        }

        // Excluded
        if ((connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1)) {
            return 1;
        }

        return NodeMaterialConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
     * @returns the current connection point
     */
    public connectTo(connectionPoint: NodeMaterialConnectionPoint, ignoreConstraints = false): NodeMaterialConnectionPoint {
        if (!ignoreConstraints && !this.canConnectTo(connectionPoint)) {
            throw "Cannot connect these two connectors.";
        }

        this._endpoints.push(connectionPoint);
        connectionPoint._connectedPoint = this;

        this._enforceAssociatedVariableName = false;

        this.onConnectionObservable.notifyObservers(connectionPoint);
        connectionPoint.onConnectionObservable.notifyObservers(this);

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
        endpoint._enforceAssociatedVariableName = false;
        return this;
    }

    /**
     * Serializes this point in a JSON representation
     * @param isInput defines if the connection point is an input (default is true)
     * @returns the serialized point object
     */
    public serialize(isInput = true): any {
        let serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.displayName = this.displayName;

        if (isInput && this.connectedPoint) {
            serializationObject.inputName = this.name;
            serializationObject.targetBlockId = this.connectedPoint.ownerBlock.uniqueId;
            serializationObject.targetConnectionName = this.connectedPoint.name;
        }

        if (this.isExposedOnFrame) {
            serializationObject.isExposedOnFrame = this.isExposedOnFrame;
        }

        return serializationObject;
    }

    /**
     * Release resources
     */
    public dispose() {
        this.onConnectionObservable.clear();
    }
}