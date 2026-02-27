import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";

/**
 * Block used to clamp a float
 */
export class GeometryClampBlock extends NodeGeometryBlock {
    /** Gets or sets the minimum range */
    public get minimum() {
        return this.min.value;
    }

    public set minimum(value: number) {
        this.min.value = value;
    }

    /** Gets or sets the maximum range */
    public get maximum() {
        return this.max.value;
    }

    public set maximum(value: number) {
        this.max.value = value;
    }

    /**
     * Creates a new GeometryClampBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("min", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("max", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
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
    public override getClassName() {
        return "GeometryClampBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the min input component
     */
    public get min(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the max input component
     */
    public get max(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (value: number, min: number, max: number) => {
            return Math.max(min, Math.min(value, max));
        };

        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);
            const min = this.min.isConnected ? this.min.getConnectedValue(state) : this.minimum;
            const max = this.max.isConnected ? this.max.getConnectedValue(state) : this.maximum;

            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(value, min, max);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(value.x, min, max), func(value.y, min, max));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(value.x, min, max), func(value.y, min, max), func(value.z, min, max));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(value.x, min, max), func(value.y, min, max), func(value.z, min, max), func(value.w, min, max));
                }
            }

            return 0;
        };

        return this;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.minimum = serializationObject.minimum;
        this.maximum = serializationObject.maximum;
    }
}

RegisterClass("BABYLON.GeometryClampBlock", GeometryClampBlock);
