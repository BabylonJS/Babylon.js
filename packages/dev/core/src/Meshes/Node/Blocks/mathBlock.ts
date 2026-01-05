import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import type { Observer } from "core/Misc/observable";

/**
 * Operations supported by the Math block
 */
export enum MathBlockOperations {
    /** Add */
    Add,
    /** Subtract */
    Subtract,
    /** Multiply */
    Multiply,
    /** Divide */
    Divide,
    /** Max */
    Max,
    /** Min */
    Min,
}

/**
 * Block used to apply math functions
 */
export class MathBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Add", value: MathBlockOperations.Add },
            { label: "Subtract", value: MathBlockOperations.Subtract },
            { label: "Multiply", value: MathBlockOperations.Multiply },
            { label: "Divide", value: MathBlockOperations.Divide },
            { label: "Max", value: MathBlockOperations.Max },
            { label: "Min", value: MathBlockOperations.Min },
        ],
    })
    public operation = MathBlockOperations.Add;

    private readonly _connectionObservers: Observer<NodeGeometryConnectionPoint>[];

    /**
     * Create a new MathBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this.left;

        const excludedConnectionPointTypes = [
            NodeGeometryBlockConnectionPointTypes.Matrix,
            NodeGeometryBlockConnectionPointTypes.Geometry,
            NodeGeometryBlockConnectionPointTypes.Texture,
        ] as const;

        this.left.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);
        this.right.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);

        this._linkConnectionTypes(0, 1);

        this._connectionObservers = [
            this.left.onConnectionObservable.add(() => this._updateInputOutputTypes()),
            this.left.onDisconnectionObservable.add(() => this._updateInputOutputTypes()),
            this.right.onConnectionObservable.add(() => this._updateInputOutputTypes()),
            this.right.onDisconnectionObservable.add(() => this._updateInputOutputTypes()),
        ];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "MathBlock";
    }

    /**
     * Gets the left input component
     */
    public get left(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right input component
     */
    public get right(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        let func: (state: NodeGeometryBuildState) => any;
        const left = this.left;
        const right = this.right;

        if (!left.isConnected || !right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const leftIsScalar = left.type === NodeGeometryBlockConnectionPointTypes.Float || left.type === NodeGeometryBlockConnectionPointTypes.Int;
        const rightIsScalar = right.type === NodeGeometryBlockConnectionPointTypes.Float || right.type === NodeGeometryBlockConnectionPointTypes.Int;

        // If both input types are scalars, then this is a scalar operation.
        const isScalar = leftIsScalar && rightIsScalar;

        switch (this.operation) {
            case MathBlockOperations.Add: {
                if (isScalar) {
                    func = (state) => {
                        return left.getConnectedValue(state) + right.getConnectedValue(state);
                    };
                } else if (leftIsScalar) {
                    func = (state) => {
                        return state.adapt(left, right.type).add(right.getConnectedValue(state));
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).add(state.adapt(right, left.type));
                    };
                }
                break;
            }
            case MathBlockOperations.Subtract: {
                if (isScalar) {
                    func = (state) => {
                        return left.getConnectedValue(state) - right.getConnectedValue(state);
                    };
                } else if (leftIsScalar) {
                    func = (state) => {
                        return state.adapt(left, right.type).subtract(right.getConnectedValue(state));
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).subtract(state.adapt(right, left.type));
                    };
                }
                break;
            }
            case MathBlockOperations.Multiply: {
                if (isScalar) {
                    func = (state) => {
                        return left.getConnectedValue(state) * right.getConnectedValue(state);
                    };
                } else if (leftIsScalar) {
                    func = (state) => {
                        return state.adapt(left, right.type).multiply(right.getConnectedValue(state));
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).multiply(state.adapt(right, left.type));
                    };
                }
                break;
            }
            case MathBlockOperations.Divide: {
                if (isScalar) {
                    func = (state) => {
                        return left.getConnectedValue(state) / right.getConnectedValue(state);
                    };
                } else if (leftIsScalar) {
                    func = (state) => {
                        return state.adapt(left, right.type).divide(right.getConnectedValue(state));
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).divide(state.adapt(right, left.type));
                    };
                }
                break;
            }
            case MathBlockOperations.Min: {
                if (isScalar) {
                    func = (state) => {
                        return Math.min(left.getConnectedValue(state), right.getConnectedValue(state));
                    };
                } else {
                    const [vector, scalar] = leftIsScalar ? [right, left] : [left, right];

                    switch (vector.type) {
                        case NodeGeometryBlockConnectionPointTypes.Vector2: {
                            func = (state) => {
                                return Vector2.Minimize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector3: {
                            func = (state) => {
                                return Vector3.Minimize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector4: {
                            func = (state) => {
                                return Vector4.Minimize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                    }
                }
                break;
            }
            case MathBlockOperations.Max: {
                if (isScalar) {
                    func = (state) => {
                        return Math.max(left.getConnectedValue(state), right.getConnectedValue(state));
                    };
                } else {
                    const [vector, scalar] = leftIsScalar ? [right, left] : [left, right];

                    switch (vector.type) {
                        case NodeGeometryBlockConnectionPointTypes.Vector2: {
                            func = (state) => {
                                return Vector2.Maximize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector3: {
                            func = (state) => {
                                return Vector3.Maximize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector4: {
                            func = (state) => {
                                return Vector4.Maximize(vector.getConnectedValue(state), state.adapt(scalar, vector.type));
                            };
                            break;
                        }
                    }
                    break;
                }
            }
        }

        this.output._storedFunction = (state) => {
            if (left.type === NodeGeometryBlockConnectionPointTypes.Int) {
                return func(state) | 0;
            }
            return func(state);
        };
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.MathBlockOperations.${MathBlockOperations[this.operation]};\n`;
        return codeString;
    }

    private _updateInputOutputTypes() {
        // First update the output type with the initial assumption that we'll base it on the left input.
        this.output._typeConnectionSource = this.left;

        if (this.left.isConnected && this.right.isConnected) {
            // Both inputs are connected, so we need to determine the output type based on the input types.
            if (
                this.left.type === NodeGeometryBlockConnectionPointTypes.Int ||
                (this.left.type === NodeGeometryBlockConnectionPointTypes.Float && this.right.type !== NodeGeometryBlockConnectionPointTypes.Int)
            ) {
                this.output._typeConnectionSource = this.right;
            }
        } else if (this.left.isConnected !== this.right.isConnected) {
            // Only one input is connected, so we need to determine the output type based on the connected input.
            this.output._typeConnectionSource = this.left.isConnected ? this.left : this.right;
        }

        // Next update the accepted connection point types for the inputs based on the current input connection state.
        if (this.left.isConnected || this.right.isConnected) {
            for (const [first, second] of [
                [this.left, this.right],
                [this.right, this.left],
            ]) {
                // Always allow Ints and Floats.
                first.acceptedConnectionPointTypes = [NodeGeometryBlockConnectionPointTypes.Int, NodeGeometryBlockConnectionPointTypes.Float];

                if (second.isConnected) {
                    // The same types as the connected input are always allowed.
                    first.acceptedConnectionPointTypes.push(second.type);

                    // If the other input is a scalar, then we also allow Vector types.
                    if (second.type === NodeGeometryBlockConnectionPointTypes.Int || second.type === NodeGeometryBlockConnectionPointTypes.Float) {
                        first.acceptedConnectionPointTypes.push(
                            NodeGeometryBlockConnectionPointTypes.Vector2,
                            NodeGeometryBlockConnectionPointTypes.Vector3,
                            NodeGeometryBlockConnectionPointTypes.Vector4
                        );
                    }
                }
            }
        }
    }

    /**
     * Release resources
     */
    public override dispose() {
        super.dispose();
        for (const observer of this._connectionObservers) {
            observer.remove();
        }
        this._connectionObservers.length = 0;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.operation = serializationObject.operation;
    }
}

RegisterClass("BABYLON.MathBlock", MathBlock);
