import type { Nullable } from "../types";
import type { FrameGraphBlock } from "./frameGraphBlock";
import { Observable } from "../Misc/observable";
import { FrameGraphBlockConnectionPointTypes } from "./Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphInputBlock } from "./Blocks/frameGraphInputBlock";

/**
 * Enum used to define the compatibility state between two connection points
 */
export const enum FrameGraphConnectionPointCompatibilityStates {
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
export const enum FrameGraphConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

/**
 * Defines a connection point for a block
 */
export class FrameGraphConnectionPoint {
    /** @internal */
    public _ownerBlock: FrameGraphBlock;
    /** @internal */
    public _connectedPoint: Nullable<FrameGraphConnectionPoint> = null;

    /** @internal */
    public _acceptedConnectionPointType: Nullable<FrameGraphConnectionPoint> = null;

    private _endpoints = new Array<FrameGraphConnectionPoint>();
    private _direction: FrameGraphConnectionPointDirection;
    private _type = FrameGraphBlockConnectionPointTypes.Undefined;

    /** @internal */
    public _linkedConnectionSource: Nullable<FrameGraphConnectionPoint> = null;

    /** @internal */
    public _typeConnectionSource: Nullable<FrameGraphConnectionPoint> = null;

    /** @internal */
    public _defaultConnectionPointType: Nullable<FrameGraphBlockConnectionPointTypes> = null;

    /** Gets the direction of the point */
    public get direction() {
        return this._direction;
    }

    /**
     * The value stored in this connection point
     */
    public value: FrameGraphInputBlock;

    /**
     * Gets or sets the additional types supported by this connection point
     */
    public acceptedConnectionPointTypes: FrameGraphBlockConnectionPointTypes[] = [];

    /**
     * Gets or sets the additional types excluded by this connection point
     */
    public excludedConnectionPointTypes: FrameGraphBlockConnectionPointTypes[] = [];

    /**
     * Observable triggered when this point is connected
     */
    public onConnectionObservable = new Observable<FrameGraphConnectionPoint>();

    /**
     * Observable triggered when this point is disconnected
     */
    public onDisconnectionObservable = new Observable<FrameGraphConnectionPoint>();

    /**
     * Gets or sets a boolean indicating that this connection point is exposed on a frame
     */
    public isExposedOnFrame: boolean = false;

    /**
     * Gets or sets number indicating the position that the port is exposed to on a frame
     */
    public exposedPortPosition: number = -1;

    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    public get type(): FrameGraphBlockConnectionPointTypes {
        if (this._type === FrameGraphBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return (this._ownerBlock as FrameGraphInputBlock).type;
            }

            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }

            if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected) {
                return this._linkedConnectionSource.type;
            }
        }

        if (this._type === FrameGraphBlockConnectionPointTypes.BasedOnInput) {
            if (this._typeConnectionSource) {
                if (!this._typeConnectionSource.isConnected) {
                    return this._defaultConnectionPointType ?? this._typeConnectionSource.type;
                }
                return this._typeConnectionSource._connectedPoint!.type;
            } else if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }

        return this._type;
    }

    public set type(value: FrameGraphBlockConnectionPointTypes) {
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
     * Gets a boolean indicating that the current point is connected to another FrameGraphlBlock
     */
    public get isConnected(): boolean {
        return this.connectedPoint !== null || this.hasEndpoints;
    }

    /** Get the other side of the connection (if any) */
    public get connectedPoint(): Nullable<FrameGraphConnectionPoint> {
        return this._connectedPoint;
    }

    /** Get the block that owns this connection point */
    public get ownerBlock(): FrameGraphBlock {
        return this._ownerBlock;
    }

    /** Get the block connected on the other side of this connection (if any) */
    public get sourceBlock(): Nullable<FrameGraphBlock> {
        if (!this._connectedPoint) {
            return null;
        }

        return this._connectedPoint.ownerBlock;
    }

    /** Get the block connected on the endpoints of this connection (if any) */
    public get connectedBlocks(): Array<FrameGraphBlock> {
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

    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    public constructor(name: string, ownerBlock: FrameGraphBlock, direction: FrameGraphConnectionPointDirection) {
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }

    /**
     * Gets the current class name e.g. "FrameGraphConnectionPoint"
     * @returns the class name
     */
    public getClassName(): string {
        return "FrameGraphConnectionPoint";
    }

    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    public canConnectTo(connectionPoint: FrameGraphConnectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === FrameGraphConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    public checkCompatibilityState(connectionPoint: FrameGraphConnectionPoint): FrameGraphConnectionPointCompatibilityStates {
        const ownerBlock = this._ownerBlock;
        const otherBlock = connectionPoint.ownerBlock;

        if (this.type !== connectionPoint.type && connectionPoint.innerType !== FrameGraphBlockConnectionPointTypes.AutoDetect) {
            // Accepted types
            if (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) {
                return FrameGraphConnectionPointCompatibilityStates.Compatible;
            } else {
                return FrameGraphConnectionPointCompatibilityStates.TypeIncompatible;
            }
        }

        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return FrameGraphConnectionPointCompatibilityStates.TypeIncompatible;
        }

        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === FrameGraphConnectionPointDirection.Input) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }

        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return FrameGraphConnectionPointCompatibilityStates.HierarchyIssue;
        }

        return FrameGraphConnectionPointCompatibilityStates.Compatible;
    }

    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
     * @returns the current connection point
     */
    public connectTo(connectionPoint: FrameGraphConnectionPoint, ignoreConstraints = false): FrameGraphConnectionPoint {
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
    public disconnectFrom(endpoint: FrameGraphConnectionPoint): FrameGraphConnectionPoint {
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
     * Fills the list of excluded connection point types with all types other than those passed in the parameter
     * @param mask Types (ORed values of FrameGraphBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
     */
    public addExcludedConnectionPointFromAllowedTypes(mask: number): void {
        let bitmask = 1;
        while (bitmask < FrameGraphBlockConnectionPointTypes.All) {
            if (!(mask & bitmask)) {
                this.excludedConnectionPointTypes.push(bitmask);
            }
            bitmask = bitmask << 1;
        }
    }

    /**
     * Adds accepted connection point types
     * @param mask Types (ORed values of FrameGraphBlockConnectionPointTypes) that are allowed to connect to this point
     */
    public addAcceptedConnectionPointTypes(mask: number): void {
        let bitmask = 1;
        while (bitmask < FrameGraphBlockConnectionPointTypes.All) {
            if (mask & bitmask && this.acceptedConnectionPointTypes.indexOf(bitmask) === -1) {
                this.acceptedConnectionPointTypes.push(bitmask);
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
