import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Block used to step a value
 */
export class GeometryStepBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge", NodeGeometryBlockConnectionPointTypes.Float);
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
        return "GeometryStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the edge operand input component
     */
    public get edge(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.value.isConnected || !this.edge.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (value: number, edge: number) => {
            if (value < edge) {
                return 0;
            }

            return 1;
        };

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const edge = this.edge.getConnectedValue(state);
            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func!(source, edge);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func!(source.x, edge), func!(source.y, edge));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func!(source.x, edge), func!(source.y, edge), func!(source.z, edge));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func!(source.x, edge), func!(source.y, edge), func!(source.z, edge), func!(source.w, edge));
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.GeometryStepBlock", GeometryStepBlock);
