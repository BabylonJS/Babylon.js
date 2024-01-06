import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
/**
 * Block used to get the value of the first parameter raised to the power of the second
 */
export class GeometryPowBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryPowBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("power", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);

        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryPowBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the power operand input component
     */
    public get power(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.value.isConnected || !this.power.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (value: number, power: number) => {
            return Math.pow(value, power);
        };

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const power = this.power.getConnectedValue(state);
            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func!(source, power);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func!(source.x, power), func!(source.y, power));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func!(source.x, power), func!(source.y, power), func!(source.z, power));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func!(source.x, power), func!(source.y, power), func!(source.z, power), func!(source.w, power));
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.GeometryPowBlock", GeometryPowBlock);
