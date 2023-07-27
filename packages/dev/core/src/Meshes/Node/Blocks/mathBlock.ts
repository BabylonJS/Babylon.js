import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { Vector2, Vector3, Vector4 } from "core/Maths";

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
    public operation = MathBlockOperations.Add;

    /**
     * Create a new MathBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[1].acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MathBlock";
    }

    /**
     * Gets the left input component
     */
    public get left(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the positions input component
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

    protected _buildBlock() {
        let func: (state: NodeGeometryBuildState) => any;
        const left = this.left;
        const right = this.right;

        if (!left.isConnected || !right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const isFloat = left.type === NodeGeometryBlockConnectionPointTypes.Float;

        switch (this.operation) {
            case MathBlockOperations.Add: {
                if (isFloat) {
                    func = (state) => {
                        return left.getConnectedValue(state) + right.getConnectedValue(state);
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).add(state.adapt(right, left));
                    };
                }
                break;
            }
            case MathBlockOperations.Subtract: {
                if (isFloat) {
                    func = (state) => {
                        return left.getConnectedValue(state) - right.getConnectedValue(state);
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).subtract(state.adapt(right, left));
                    };
                }
                break;
            }
            case MathBlockOperations.Multiply: {
                if (isFloat) {
                    func = (state) => {
                        return left.getConnectedValue(state) * right.getConnectedValue(state);
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).multiply(state.adapt(right, left));
                    };
                }
                break;
            }
            case MathBlockOperations.Divide: {
                if (isFloat) {
                    func = (state) => {
                        return left.getConnectedValue(state) / right.getConnectedValue(state);
                    };
                } else {
                    func = (state) => {
                        return left.getConnectedValue(state).divide(state.adapt(right, left));
                    };
                }
                break;
            }
            case MathBlockOperations.Min: {
                if (isFloat) {
                    func = (state) => {
                        return Math.min(left.getConnectedValue(state), right.getConnectedValue(state));
                    };
                } else {
                    switch (left.type) {
                        case NodeGeometryBlockConnectionPointTypes.Vector2: {
                            func = (state) => {
                                return Vector2.Minimize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector3: {
                            func = (state) => {
                                return Vector3.Minimize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector4: {
                            func = (state) => {
                                return Vector4.Minimize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                    }
                }
                break;
            }
            case MathBlockOperations.Max: {
                if (isFloat) {
                    func = (state) => {
                        return Math.max(left.getConnectedValue(state), right.getConnectedValue(state));
                    };
                } else {
                    switch (left.type) {
                        case NodeGeometryBlockConnectionPointTypes.Vector2: {
                            func = (state) => {
                                return Vector2.Maximize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector3: {
                            func = (state) => {
                                return Vector3.Maximize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                        case NodeGeometryBlockConnectionPointTypes.Vector4: {
                            func = (state) => {
                                return Vector4.Maximize(left.getConnectedValue(state), state.adapt(right, left));
                            };
                            break;
                        }
                    }
                    break;
                }
            }
        }

        this.output._storedFunction = (state) => {
            return func(state);
        };
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.MathBlockOperations.${MathBlockOperations[this.operation]};\r\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        this.operation = serializationObject.operation;
    }
}

RegisterClass("BABYLON.MathBlock", MathBlock);
