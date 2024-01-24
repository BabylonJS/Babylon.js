import type { Nullable } from "../../types";
import type { NodeGeometryBlock } from "./nodeGeometryBlock";
import { Observable } from "../../Misc/observable";
import { NodeGeometryBlockConnectionPointTypes } from "./Enums/nodeGeometryConnectionPointTypes";
import type { GeometryInputBlock } from "./Blocks/geometryInputBlock";
import type { NodeGeometryBuildState } from "./nodeGeometryBuildState";

/**
 * Enum used to define the compatibility state between two connection points
 */
export enum NodeGeometryConnectionPointCompatibilityStates {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because they are in the same hierarchy **/
    HierarchyIssue,
}

/**
 * Defines the direction of a connection point
 */
export enum NodeGeometryConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

/**
 * Defines a connection point for a block
 */
export class NodeGeometryConnectionPoint {
    /** @internal */
    public _ownerBlock: NodeGeometryBlock;
    /** @internal */
    public _connectedPoint: Nullable<NodeGeometryConnectionPoint> = null;
    /** @internal */
    public _storedValue: any = null;
    /** @internal */
    public _storedFunction: Nullable<(state: NodeGeometryBuildState) => any> = null;

    /** @internal */
    public _acceptedConnectionPointType: Nullable<NodeGeometryConnectionPoint> = null;

    private _endpoints = new Array<NodeGeometryConnectionPoint>();
    private _direction: NodeGeometryConnectionPointDirection;
    private _type = NodeGeometryBlockConnectionPointTypes.Geometry;

    /** @internal */
    public _linkedConnectionSource: Nullable<NodeGeometryConnectionPoint> = null;

    /** @internal */
    public _typeConnectionSource: Nullable<NodeGeometryConnectionPoint> = null;

    /** @internal */
    public _defaultConnectionPointType: Nullable<NodeGeometryBlockConnectionPointTypes> = null;

    /** Gets the direction of the point */
    public get direction() {
        return this._direction;
    }

    /**
     * Gets or sets the additional types supported by this connection point
     */
    public acceptedConnectionPointTypes: NodeGeometryBlockConnectionPointTypes[] = [];

    /**
     * Gets or sets the additional types excluded by this connection point
     */
    public excludedConnectionPointTypes: NodeGeometryBlockConnectionPointTypes[] = [];

    /**
     * Observable triggered when this point is connected
     */
    public onConnectionObservable = new Observable<NodeGeometryConnectionPoint>();

    /**
     * Gets or sets a boolean indicating that this connection point is exposed on a frame
     */
    public isExposedOnFrame: boolean = false;

    /**
     * Gets or sets number indicating the position that the port is exposed to on a frame
     */
    public exposedPortPosition: number = -1;

    /**
     * Gets the default value used for this point at creation time
     */
    public defaultValue: Nullable<any> = null;

    /**
     * Gets or sets the default value used for this point if nothing is connected
     */
    public value: Nullable<any> = null;

    /**
     * Gets or sets the min value accepted for this point if nothing is connected
     */
    public valueMin: Nullable<any> = null;

    /**
     * Gets or sets the max value accepted for this point if nothing is connected
     */
    public valueMax: Nullable<any> = null;

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeGeometryBlockConnectionPointTypes {
        if (this._type === NodeGeometryBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return (this._ownerBlock as GeometryInputBlock).type;
            }

            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }

            if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected) {
                return this._linkedConnectionSource.type;
            }
        }

        if (this._type === NodeGeometryBlockConnectionPointTypes.BasedOnInput) {
            if (this._typeConnectionSource) {
                if (!this._typeConnectionSource.isConnected && this._defaultConnectionPointType) {
                    return this._defaultConnectionPointType;
                }
                return this._typeConnectionSource.type;
            } else if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }

        return this._type;
    }

    public set type(value: NodeGeometryBlockConnectionPointTypes) {
        this._type = value;
    }

    /**
     * Gets or sets the connection point name
     */
    public name: string;

    /**
     * Gets or sets the connection point display name
     */
    public displayName: string;

    /**
     * Gets or sets a boolean indicating that this connection point can be omitted
     */
    public isOptional: boolean;

    /**
     * Gets a boolean indicating that the current point is connected to another NodeMaterialBlock
     */
    public get isConnected(): boolean {
        return this.connectedPoint !== null || this.hasEndpoints;
    }

    /** Get the other side of the connection (if any) */
    public get connectedPoint(): Nullable<NodeGeometryConnectionPoint> {
        return this._connectedPoint;
    }

    /** Get the block that owns this connection point */
    public get ownerBlock(): NodeGeometryBlock {
        return this._ownerBlock;
    }

    /** Get the block connected on the other side of this connection (if any) */
    public get sourceBlock(): Nullable<NodeGeometryBlock> {
        if (!this._connectedPoint) {
            return null;
        }

        return this._connectedPoint.ownerBlock;
    }

    /** Get the block connected on the endpoints of this connection (if any) */
    public get connectedBlocks(): Array<NodeGeometryBlock> {
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

    /** Get the inner type (ie AutoDetect for instance instead of the inferred one) */
    public get innerType() {
        if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected) {
            return this.type;
        }
        return this._type;
    }

    /** @internal */
    public _callCount = 0;

    /** @internal */
    public _executionCount = 0;

    /** @internal */
    public _resetCounters() {
        this._callCount = 0;
        this._executionCount = 0;
    }

    /**
     * Gets the number of times this point was called
     */
    public get callCount() {
        return this._callCount;
    }

    /**
     * Gets the number of times this point was executed
     */
    public get executionCount() {
        return this._executionCount;
    }

    /**
     * Gets the value represented by this connection point
     * @param state current evaluation state
     * @returns the connected value or the value if nothing is connected
     */
    public getConnectedValue(state: NodeGeometryBuildState) {
        if (this.isConnected) {
            if (this._connectedPoint?._storedFunction) {
                this._connectedPoint!._callCount++;
                this._connectedPoint!._executionCount++;
                return this._connectedPoint!._storedFunction(state);
            }
            this._connectedPoint!._callCount++;
            this._connectedPoint!._executionCount = 1;
            return this._connectedPoint!._storedValue;
        }
        this._callCount++;
        this._executionCount = 1;
        return this.value;
    }

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    public constructor(name: string, ownerBlock: NodeGeometryBlock, direction: NodeGeometryConnectionPointDirection) {
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }

    /**
     * Gets the current class name e.g. "NodeMaterialConnectionPoint"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeGeometryConnectionPoint";
    }

    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    public canConnectTo(connectionPoint: NodeGeometryConnectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === NodeGeometryConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    public checkCompatibilityState(connectionPoint: NodeGeometryConnectionPoint): NodeGeometryConnectionPointCompatibilityStates {
        const ownerBlock = this._ownerBlock;
        const otherBlock = connectionPoint.ownerBlock;

        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeGeometryBlockConnectionPointTypes.AutoDetect) {
            // Accepted types
            if (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) {
                return NodeGeometryConnectionPointCompatibilityStates.Compatible;
            } else {
                return NodeGeometryConnectionPointCompatibilityStates.TypeIncompatible;
            }
        }

        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return NodeGeometryConnectionPointCompatibilityStates.TypeIncompatible;
        }

        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === NodeGeometryConnectionPointDirection.Input) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }

        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return NodeGeometryConnectionPointCompatibilityStates.HierarchyIssue;
        }

        return NodeGeometryConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
     * @returns the current connection point
     */
    public connectTo(connectionPoint: NodeGeometryConnectionPoint, ignoreConstraints = false): NodeGeometryConnectionPoint {
        if (!ignoreConstraints && !this.canConnectTo(connectionPoint)) {
            // eslint-disable-next-line no-throw-literal
            throw "Cannot connect these two connectors.";
        }

        this._endpoints.push(connectionPoint);
        connectionPoint._connectedPoint = this;

        this.onConnectionObservable.notifyObservers(connectionPoint);
        connectionPoint.onConnectionObservable.notifyObservers(this);

        return this;
    }

    /**
     * Disconnect this point from one of his endpoint
     * @param endpoint defines the other connection point
     * @returns the current connection point
     */
    public disconnectFrom(endpoint: NodeGeometryConnectionPoint): NodeGeometryConnectionPoint {
        const index = this._endpoints.indexOf(endpoint);

        if (index === -1) {
            return this;
        }

        this._endpoints.splice(index, 1);
        endpoint._connectedPoint = null;
        return this;
    }

    /**
     * Fill the list of excluded connection point types with all types other than those passed in the parameter
     * @param mask Types (ORed values of NodeMaterialBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
     */
    public addExcludedConnectionPointFromAllowedTypes(mask: number): void {
        let bitmask = 1;
        while (bitmask < NodeGeometryBlockConnectionPointTypes.All) {
            if (!(mask & bitmask)) {
                this.excludedConnectionPointTypes.push(bitmask);
            }
            bitmask = bitmask << 1;
        }
    }

    /**
     * Serializes this point in a JSON representation
     * @param isInput defines if the connection point is an input (default is true)
     * @returns the serialized point object
     */
    public serialize(isInput = true): any {
        const serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.displayName = this.displayName;
        if (this.value !== undefined && this.value !== null) {
            if (this.value.asArray) {
                serializationObject.valueType = "BABYLON." + this.value.getClassName();
                serializationObject.value = this.value.asArray();
            } else {
                serializationObject.valueType = "number";
                serializationObject.value = this.value;
            }
        }

        if (isInput && this.connectedPoint) {
            serializationObject.inputName = this.name;
            serializationObject.targetBlockId = this.connectedPoint.ownerBlock.uniqueId;
            serializationObject.targetConnectionName = this.connectedPoint.name;
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
