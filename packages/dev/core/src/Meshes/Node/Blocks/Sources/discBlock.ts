import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateDiscVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate disc geometry data
 */
export class DiscBlock extends NodeGeometryBlock {
    /**
     * Create a new DiscBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "DiscBlock";
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the subdivisions input component
     */
    public get arc(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.radius.isConnected) {
            const radiusInput = new GeometryInputBlock("Radius");
            radiusInput.value = 0.2;
            radiusInput.output.connectTo(this.radius);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            radius?: number;
            tessellation?: number;
            arc?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};

        if (this.radius.isConnected) {
            options.radius = this.radius.getConnectedValue(state);
        }

        if (this.tessellation.isConnected) {
            options.tessellation = this.tessellation.getConnectedValue(state);
        }

        if (this.arc.isConnected) {
            options.arc = this.arc.getConnectedValue(state);
        }

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateDiscVertexData(options);
    }
}

RegisterClass("BABYLON.DiscBlock", DiscBlock);
