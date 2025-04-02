import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { extractMinAndMax } from "../../../Maths/math.functions";

/**
 * Block used to get the bounding info of a geometry
 */
export class BoundingBlock extends NodeGeometryBlock {
    /**
     * Create a new BoundingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);

        this.registerOutput("min", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("max", NodeGeometryBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BoundingBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the min output component
     */
    public get min(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the max output component
     */
    public get max(): NodeGeometryConnectionPoint {
        return this._outputs[1];
    }

    protected override _buildBlock() {
        this.min._storedFunction = (state) => {
            const geometry = this.geometry.getConnectedValue(state);

            if (!geometry) {
                return null;
            }

            const boundingInfo = extractMinAndMax(geometry.positions, 0, geometry.positions!.length / 3);
            return boundingInfo.minimum;
        };

        this.max._storedFunction = (state) => {
            const geometry = this.geometry.getConnectedValue(state);

            if (!geometry) {
                return null;
            }

            const boundingInfo = extractMinAndMax(geometry.positions, 0, geometry.positions!.length / 3);
            return boundingInfo.maximum;
        };
    }
}

RegisterClass("BABYLON.BoundingBlock", BoundingBlock);
