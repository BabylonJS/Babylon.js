import { NodeMaterialBlockConnectionPointTypes } from "./Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets";
import type { Nullable } from "../../types";
import type { InputBlock } from "./Blocks/Input/inputBlock";
import { Observable } from "../../Misc/observable";
import type { Observer } from "../../Misc/observable";
import type { NodeMaterialBlock } from "./nodeMaterialBlock";

/**
 * Enum used to define the compatibility state between two connection points
 */
export enum NodeMaterialConnectionPointCompatibilityStates {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because of their targets (vertex vs fragment) */
    TargetIncompatible,
    /** Points are incompatible because they are in the same hierarchy **/
    HierarchyIssue,
}

/**
 * Defines the direction of a connection point
 */
export enum NodeMaterialConnectionPointDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

/**
 * Defines a connection point for a block
 */
export class NodeMaterialConnectionPoint {
    /**
     * Checks if two types are equivalent
     * @param type1 type 1 to check
     * @param type2 type 2 to check
     * @returns true if both types are equivalent, else false
     */
    public static AreEquivalentTypes(type1: number, type2: number): boolean {
        switch (type1) {
            case NodeMaterialBlockConnectionPointTypes.Vector3: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Color3) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Vector4: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Color4) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Color3: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Vector3) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Vector4) {
                    return true;
                }
                break;
            }
        }

        return false;
    }

    /** @internal */
    public readonly _ownerBlock: NodeMaterialBlock;

    private _connectedPoint: Nullable<NodeMaterialConnectionPoint> = null;
    private _connectedPointTypeChangedObserver: Nullable<Observer<NodeMaterialBlockConnectionPointTypes>>;

    private _endpoints = new Array<NodeMaterialConnectionPoint>();
    private _associatedVariableName: string;
    private readonly _direction: NodeMaterialConnectionPointDirection;

    private _typeConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;
    private _typeConnectionSourceConnectedObservable: Nullable<Observer<NodeMaterialConnectionPoint>>;
    private _typeConnectionSourceDisconnectedObservable: Nullable<Observer<NodeMaterialConnectionPoint>>;
    private _typeConnectionSourceTypeChangedObservable: Nullable<Observer<NodeMaterialBlockConnectionPointTypes>>;

    private _defaultConnectionPointType: Nullable<NodeMaterialBlockConnectionPointTypes> = null;

    private _linkedConnectionSource: Nullable<NodeMaterialConnectionPoint> = null;
    private _linkedConnectionSourceConnectedObservable: Nullable<Observer<NodeMaterialConnectionPoint>>;
    private _linkedConnectionSourceDisconnectedObservable: Nullable<Observer<NodeMaterialConnectionPoint>>;
    private _linkedConnectionSourceTypeChangedObservable: Nullable<Observer<NodeMaterialBlockConnectionPointTypes>>;

    /** @internal */
    public _acceptedConnectionPointType: Nullable<NodeMaterialConnectionPoint> = null;

    private _type = NodeMaterialBlockConnectionPointTypes.Float;

    /** @internal */
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
    public acceptedConnectionPointTypes: NodeMaterialBlockConnectionPointTypes[] = [];

    /**
     * Gets or sets the additional types excluded by this connection point
     */
    public excludedConnectionPointTypes: NodeMaterialBlockConnectionPointTypes[] = [];

    /**
     * Observable triggered when this point is connected
     */
    public readonly onConnectionObservable = new Observable<NodeMaterialConnectionPoint>();

    /**
     * Observable triggered when this point is disconnected
     */
    public readonly onDisconnectionObservable = new Observable<NodeMaterialConnectionPoint>();

    public readonly onTypeChangedObservable = new Observable<NodeMaterialBlockConnectionPointTypes>();
    private _isTypeChangeObservableNotifying = false;

    private _updateConnectionPoint(value: Nullable<NodeMaterialConnectionPoint>) {
        if (this._connectedPoint === value) {
            return;
        }

        if (this._connectedPoint) {
            this._connectedPoint.onTypeChangedObservable.remove(this._connectedPointTypeChangedObserver);
        }

        this._updateTypeDependentState(() => (this._connectedPoint = value));

        if (this._connectedPoint) {
            this._connectedPointTypeChangedObserver = this._connectedPoint.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }

    public get linkedConnectionSource(): Nullable<NodeMaterialConnectionPoint> {
        return this._linkedConnectionSource;
    }

    public set linkedConnectionSource(value: Nullable<NodeMaterialConnectionPoint>) {
        if (this._linkedConnectionSource === value) {
            return;
        }

        if (this._linkedConnectionSource) {
            this._linkedConnectionSource.onConnectionObservable.remove(this._linkedConnectionSourceConnectedObservable);
            this._linkedConnectionSource.onDisconnectionObservable.remove(this._linkedConnectionSourceDisconnectedObservable);
            this._linkedConnectionSource.onTypeChangedObservable.remove(this._linkedConnectionSourceTypeChangedObservable);
        }

        this._updateTypeDependentState(() => (this._linkedConnectionSource = value));

        if (this._linkedConnectionSource) {
            this._linkedConnectionSourceConnectedObservable = this._linkedConnectionSource.onConnectionObservable.add(() => {
                this._notifyTypeChanged();
            });

            this._linkedConnectionSourceDisconnectedObservable = this._linkedConnectionSource.onDisconnectionObservable.add(() => {
                this._notifyTypeChanged();
            });

            this._linkedConnectionSourceTypeChangedObservable = this._linkedConnectionSource.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }

    public get typeConnectionSource(): Nullable<NodeMaterialConnectionPoint> {
        return this._typeConnectionSource;
    }

    public set typeConnectionSource(value: Nullable<NodeMaterialConnectionPoint>) {
        if (this._typeConnectionSource === value) {
            return;
        }

        if (this._typeConnectionSource) {
            this._typeConnectionSource.onConnectionObservable.remove(this._typeConnectionSourceConnectedObservable);
            this._typeConnectionSource.onDisconnectionObservable.remove(this._typeConnectionSourceDisconnectedObservable);
            this._typeConnectionSource.onTypeChangedObservable.remove(this._typeConnectionSourceTypeChangedObservable);
        }

        this._updateTypeDependentState(() => (this._typeConnectionSource = value));

        if (this._typeConnectionSource) {
            this._typeConnectionSourceConnectedObservable = this._typeConnectionSource.onConnectionObservable.add(() => {
                this._notifyTypeChanged();
            });

            this._typeConnectionSourceDisconnectedObservable = this._typeConnectionSource.onDisconnectionObservable.add(() => {
                this._notifyTypeChanged();
            });

            this._typeConnectionSourceTypeChangedObservable = this._typeConnectionSource.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }

    public get defaultConnectionPointType(): Nullable<NodeMaterialBlockConnectionPointTypes> {
        return this._defaultConnectionPointType;
    }

    public set defaultConnectionPointType(value: Nullable<NodeMaterialBlockConnectionPointTypes>) {
        this._updateTypeDependentState(() => (this._defaultConnectionPointType = value));
    }

    /**
     * Gets the declaration variable name in the shader
     */
    public get declarationVariableName(): string {
        if (this._ownerBlock.isInput) {
            return (this._ownerBlock as InputBlock).declarationVariableName;
        }

        if ((!this._enforceAssociatedVariableName || !this._associatedVariableName) && this._connectedPoint) {
            return this._connectedPoint.declarationVariableName;
        }

        return this._associatedVariableName;
    }

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
        return this._getEvaluatedType();
    }

    public set type(value: NodeMaterialBlockConnectionPointTypes) {
        this._updateTypeDependentState(() => (this._type = value));
    }

    /**
     * Gets or sets the connection point name
     */
    public readonly name: string;

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
    public isExposedOnFrame: boolean = false;

    /**
     * Gets or sets number indicating the position that the port is exposed to on a frame
     */
    public exposedPortPosition: number = -1;

    /**
     * Gets or sets a string indicating that this uniform must be defined under a #ifdef
     */
    public define: string;

    /** @internal */
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

    /** Gets a boolean indicating that this connection has a path to the vertex output*/
    public get isDirectlyConnectedToVertexOutput(): boolean {
        if (!this.hasEndpoints) {
            return false;
        }

        for (const endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }

            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.outputs.some((o) => o.isDirectlyConnectedToVertexOutput)) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Gets a boolean indicating that this connection will be used in the vertex shader */
    public get isConnectedInVertexShader(): boolean {
        if (this.target === NodeMaterialBlockTargets.Vertex) {
            return true;
        }

        if (!this.hasEndpoints) {
            return false;
        }

        for (const endpoint of this._endpoints) {
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

        for (const endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
                return true;
            }

            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.isConnectedInFragmentShader()) {
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
        const otherBlock = connectionPoint.ownerBlock;

        if (ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            // Let's check we are not going reverse

            if (otherBlock.target === NodeMaterialBlockTargets.Vertex) {
                return NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible;
            }

            for (const output of otherBlock.outputs) {
                if (output.ownerBlock.target != NodeMaterialBlockTargets.Neutral && output.isConnectedInVertexShader) {
                    return NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible;
                }
            }
        }

        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            // Equivalents
            if (NodeMaterialConnectionPoint.AreEquivalentTypes(this.type, connectionPoint.type)) {
                return NodeMaterialConnectionPointCompatibilityStates.Compatible;
            }

            // Accepted types
            if (
                (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) ||
                (connectionPoint._acceptedConnectionPointType && NodeMaterialConnectionPoint.AreEquivalentTypes(connectionPoint._acceptedConnectionPointType.type, this.type))
            ) {
                return NodeMaterialConnectionPointCompatibilityStates.Compatible;
            } else {
                return NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible;
            }
        }

        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible;
        }

        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === NodeMaterialConnectionPointDirection.Input) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }

        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue;
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
            // eslint-disable-next-line no-throw-literal
            throw "Cannot connect these two connectors.";
        }

        this._endpoints.push(connectionPoint);
        connectionPoint._updateConnectionPoint(this);

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
        const index = this._endpoints.indexOf(endpoint);

        if (index === -1) {
            return this;
        }

        this._endpoints.splice(index, 1);
        endpoint._updateConnectionPoint(null);
        this._enforceAssociatedVariableName = false;
        endpoint._enforceAssociatedVariableName = false;

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
        while (bitmask < NodeMaterialBlockConnectionPointTypes.All) {
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

    private _getEvaluatedType() {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return (this._ownerBlock as InputBlock).type;
            }

            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }

            if (this.linkedConnectionSource && this.linkedConnectionSource.isConnected) {
                return this.linkedConnectionSource.type;
            }
        }

        if (this._type === NodeMaterialBlockConnectionPointTypes.BasedOnInput) {
            if (this.typeConnectionSource) {
                if (!this.typeConnectionSource.isConnected && this.defaultConnectionPointType) {
                    return this.defaultConnectionPointType;
                }
                return this.typeConnectionSource.type;
            } else if (this.defaultConnectionPointType) {
                return this.defaultConnectionPointType;
            }
        }

        return this._type;
    }

    private _updateTypeDependentState(updater: () => void) {
        const previousType = this.type;
        updater();
        if (this.type !== previousType) {
            this._notifyTypeChanged();
        }
    }

    private _notifyTypeChanged() {
        if (this._isTypeChangeObservableNotifying) {
            return;
        }

        this._isTypeChangeObservableNotifying = true;
        this.onTypeChangedObservable.notifyObservers(this.type);
        this._isTypeChangeObservableNotifying = false;
    }

    // TODO
    // 1) Re-test Playground locally with opening NME from material
    // 2) Test what happens now when the output type of one Multiply block changes where that output flows into another Multiply block
    // 3) Add code to unregister all new observers upon dispose

    // private _updateEvaluatedType() {
    //     const evaluatedType = this._getEvaluatedType();
    //     if (this._evaluatedType !== evaluatedType) {
    //         this._evaluatedType = evaluatedType;
    //         this.onTypeChangedObservable.notifyObservers(this.type);
    //     }
    // }
}
