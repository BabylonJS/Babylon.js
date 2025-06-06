import type { Nullable } from "../../types";
import { Observable } from "../../Misc/observable";
import type { NodeParticleBlock } from "./nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "./Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleBuildState } from "./nodeParticleBuildState";
import type { ParticleInputBlock } from "./Blocks/particleInputBlock";

/**
 * Enum used to define the compatibility state between two connection points
 */
export const enum NodeParticleConnectionPointCompatibilityStates {
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
export const enum NodeParticleConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

/**
 * Defines a connection point for a block
 */
export class NodeParticleConnectionPoint {
    /** @internal */
    public _ownerBlock: NodeParticleBlock;
    /** @internal */
    public _connectedPoint: Nullable<NodeParticleConnectionPoint> = null;

    /** @internal */
    public _storedValue: any = null;
    /** @internal */
    public _storedFunction: Nullable<(state: NodeParticleBuildState) => any> = null;

    /** @internal */
    public _acceptedConnectionPointType: Nullable<NodeParticleConnectionPoint> = null;

    private _endpoints = new Array<NodeParticleConnectionPoint>();
    private _direction: NodeParticleConnectionPointDirection;
    private _type = NodeParticleBlockConnectionPointTypes.Particle;

    /** @internal */
    public _linkedConnectionSource: Nullable<NodeParticleConnectionPoint> = null;

    /** @internal */
    public _typeConnectionSource: Nullable<NodeParticleConnectionPoint> = null;

    /** @internal */
    public _typeConnectionSourceTranslation: Nullable<(source: NodeParticleBlockConnectionPointTypes) => NodeParticleBlockConnectionPointTypes> = null;

    /** @internal */
    public _defaultConnectionPointType: Nullable<NodeParticleBlockConnectionPointTypes> = null;

    /** @internal */
    public _isMainLinkSource = false;

    /** Gets the direction of the point */
    public get direction() {
        return this._direction;
    }

    /**
     * Gets or sets the additional types supported by this connection point
     */
    public acceptedConnectionPointTypes: NodeParticleBlockConnectionPointTypes[] = [];

    /**
     * Gets or sets the additional types excluded by this connection point
     */
    public excludedConnectionPointTypes: NodeParticleBlockConnectionPointTypes[] = [];

    /**
     * Observable triggered when this point is connected
     */
    public onConnectionObservable = new Observable<NodeParticleConnectionPoint>();

    /**
     * Observable triggered when this point is disconnected
     */
    public onDisconnectionObservable = new Observable<NodeParticleConnectionPoint>();

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
    public get type(): NodeParticleBlockConnectionPointTypes {
        if (this._type === NodeParticleBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return (this._ownerBlock as ParticleInputBlock).type;
            }

            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }

            if (this._linkedConnectionSource) {
                if (this._linkedConnectionSource.isConnected) {
                    return this._linkedConnectionSource.type;
                }
                if (this._linkedConnectionSource._defaultConnectionPointType) {
                    return this._linkedConnectionSource._defaultConnectionPointType;
                }
            }

            if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }

        if (this._type === NodeParticleBlockConnectionPointTypes.BasedOnInput) {
            if (this._typeConnectionSource) {
                if (!this._typeConnectionSource.isConnected && this._defaultConnectionPointType) {
                    return this._defaultConnectionPointType;
                }
                if (this._typeConnectionSourceTranslation) {
                    return this._typeConnectionSourceTranslation(this._typeConnectionSource.type);
                }
                return this._typeConnectionSource.type;
            } else if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }

        return this._type;
    }

    public set type(value: NodeParticleBlockConnectionPointTypes) {
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
    public get connectedPoint(): Nullable<NodeParticleConnectionPoint> {
        return this._connectedPoint;
    }

    /** Get the block that owns this connection point */
    public get ownerBlock(): NodeParticleBlock {
        return this._ownerBlock;
    }

    /** Get the block connected on the other side of this connection (if any) */
    public get sourceBlock(): Nullable<NodeParticleBlock> {
        if (!this._connectedPoint) {
            return null;
        }

        return this._connectedPoint.ownerBlock;
    }

    /** Get the block connected on the endpoints of this connection (if any) */
    public get connectedBlocks(): Array<NodeParticleBlock> {
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
        if (this._linkedConnectionSource && !this._isMainLinkSource && this._linkedConnectionSource.isConnected) {
            return this.type;
        }
        return this._type;
    }

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    public constructor(name: string, ownerBlock: NodeParticleBlock, direction: NodeParticleConnectionPointDirection) {
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }

    /**
     * Gets the current class name e.g. "NodeMaterialConnectionPoint"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeParticleConnectionPoint";
    }

    /**
     * Gets the value represented by this connection point
     * @param state current evaluation state
     * @returns the connected value or the value if nothing is connected
     */
    public getConnectedValue(state: NodeParticleBuildState) {
        if (this.isConnected) {
            if (this._connectedPoint?._storedFunction) {
                return this._connectedPoint._storedFunction(state);
            }
            return this._connectedPoint!._storedValue;
        }
        return this.value;
    }

    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    public canConnectTo(connectionPoint: NodeParticleConnectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === NodeParticleConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    public checkCompatibilityState(connectionPoint: NodeParticleConnectionPoint): NodeParticleConnectionPointCompatibilityStates {
        const ownerBlock = this._ownerBlock;
        const otherBlock = connectionPoint.ownerBlock;

        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeParticleBlockConnectionPointTypes.AutoDetect) {
            // Accepted types
            if (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) {
                return NodeParticleConnectionPointCompatibilityStates.Compatible;
            } else {
                return NodeParticleConnectionPointCompatibilityStates.TypeIncompatible;
            }
        }

        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return NodeParticleConnectionPointCompatibilityStates.TypeIncompatible;
        }

        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === NodeParticleConnectionPointDirection.Input) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }

        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return NodeParticleConnectionPointCompatibilityStates.HierarchyIssue;
        }

        return NodeParticleConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
     * @returns the current connection point
     */
    public connectTo(connectionPoint: NodeParticleConnectionPoint, ignoreConstraints = false): NodeParticleConnectionPoint {
        if (!ignoreConstraints && !this.canConnectTo(connectionPoint)) {
            // eslint-disable-next-line no-throw-literal
            throw `Cannot connect these two connectors. source: "${this.ownerBlock.name}".${this.name}, target: "${connectionPoint.ownerBlock.name}".${connectionPoint.name}`;
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
    public disconnectFrom(endpoint: NodeParticleConnectionPoint): NodeParticleConnectionPoint {
        const index = this._endpoints.indexOf(endpoint);

        if (index === -1) {
            return this;
        }

        this._endpoints.splice(index, 1);
        endpoint._connectedPoint = null;

        this.onDisconnectionObservable.notifyObservers(endpoint);
        endpoint.onDisconnectionObservable.notifyObservers(this);

        return this;
    }

    /**
     * Fill the list of excluded connection point types with all types other than those passed in the parameter
     * @param mask Types (ORed values of NodeMaterialBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
     */
    public addExcludedConnectionPointFromAllowedTypes(mask: number): void {
        let bitmask = 1;
        while (bitmask < NodeParticleBlockConnectionPointTypes.All) {
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
            serializationObject.isExposedOnFrame = true;
            serializationObject.exposedPortPosition = this.exposedPortPosition;
        }

        if (this.isExposedOnFrame || this.exposedPortPosition >= 0) {
            serializationObject.isExposedOnFrame = true;
            serializationObject.exposedPortPosition = this.exposedPortPosition;
        }

        return serializationObject;
    }

    /**
     * Release resources
     */
    public dispose() {
        this.onConnectionObservable.clear();
        this.onDisconnectionObservable.clear();
    }
}
