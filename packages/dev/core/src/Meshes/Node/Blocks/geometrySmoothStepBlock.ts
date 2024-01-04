import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
/**
 * Block used to smooth step a value
 */
export class GeometrySmoothStepBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometrySmoothStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge0", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerInput("edge1", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometrySmoothStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the first edge operand input component
     */
    public get edge0(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the second edge operand input component
     */
    public get edge1(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.value.isConnected || !this.edge0.isConnected || !this.edge1.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (value: number, edge0: number, edge1: number) => {
            const x = Math.max(0, Math.min((value - edge0) / (edge1 - edge0), 1));

            // Smoothstep formula: 3x^2 - 2x^3
            return x * x * (3 - 2 * x);
        };

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const edge0 = this.edge0.getConnectedValue(state);
            const edge1 = this.edge1.getConnectedValue(state);
            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func!(source, edge0, edge1);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func!(source.x, edge0, edge1), func!(source.y, edge0, edge1));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func!(source.x, edge0, edge1), func!(source.y, edge0, edge1), func!(source.z, edge0, edge1));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func!(source.x, edge0, edge1), func!(source.y, edge0, edge1), func!(source.z, edge0, edge1), func!(source.w, edge0, edge1));
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.GeometrySmoothStepBlock", GeometrySmoothStepBlock);
