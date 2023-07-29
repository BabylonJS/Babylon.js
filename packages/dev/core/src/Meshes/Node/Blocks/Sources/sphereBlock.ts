import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateSphereVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate sphere geometry data
 */
export class SphereBlock extends NodeGeometryBlock {
    /**
     * Create a new SphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("segments", NodeGeometryBlockConnectionPointTypes.Float, true, 32);
        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterX", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterY", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterZ", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("slice", NodeGeometryBlockConnectionPointTypes.Float, true, 1);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SphereBlock";
    }

    /**
     * Gets the segments input component
     */
    public get segments(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the diameter input component
     */
    public get diameter(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the diameterX input component
     */
    public get diameterX(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the diameterY input component
     */
    public get diameterY(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the diameterZ input component
     */
    public get diameterZ(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the arc input component
     */
    public get arc(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the slice input component
     */
    public get slice(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.diameter.isConnected) {
            const diameterInput = new GeometryInputBlock("Diameter");
            diameterInput.value = 1;
            diameterInput.output.connectTo(this.diameter);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            segments?: number;
            diameter?: number;
            diameterX?: number;
            diameterY?: number;
            diameterZ?: number;
            arc?: number;
            slice?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            dedupTopBottomIndices?: boolean;
        } = {};

        options.segments = this.segments.getConnectedValue(state);
        options.diameter = this.diameter.getConnectedValue(state);
        options.diameterX = this.diameterX.getConnectedValue(state);
        options.diameterY = this.diameterY.getConnectedValue(state);
        options.diameterZ = this.diameterZ.getConnectedValue(state);
        options.arc = this.arc.getConnectedValue(state);
        options.slice = this.slice.getConnectedValue(state);

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateSphereVertexData(options);
    }
}

RegisterClass("BABYLON.SphereBlock", SphereBlock);
