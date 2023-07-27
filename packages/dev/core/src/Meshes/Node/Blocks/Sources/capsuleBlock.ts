import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector3 } from "../../../../Maths/math.vector";
import { CreateCapsuleVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate capsule geometry data
 */
export class CapsuleBlock extends NodeGeometryBlock {
    /**
     * Create a new CapsuleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Float, true);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CapsuleBlock";
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
        if (!this.radius.isConnected) {
            const radiusInput = new GeometryInputBlock("Radius");
            radiusInput.value = 0.2;
            radiusInput.output.connectTo(this.radius);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            orientation?: Vector3;
            subdivisions?: number;
            tessellation?: number;
            height?: number;
            radius?: number;
            capSubdivisions?: number;
            radiusTop?: number;
            radiusBottom?: number;
            topCapSubdivisions?: number;
            bottomCapSubdivisions?: number;
            updatable?: boolean;
        } = {};

        if (this.height.isConnected) {
            options.height = this.height.getConnectedValue(state);
        }

        if (this.radius.isConnected) {
            options.radius = this.radius.getConnectedValue(state);
        }

        if (this.tessellation.isConnected) {
            options.tessellation = this.tessellation.getConnectedValue(state);
        }

        if (this.subdivisions.isConnected) {
            options.subdivisions = this.subdivisions.getConnectedValue(state);
        }

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateCapsuleVertexData(options);
    }
}

RegisterClass("BABYLON.CapsuleBlock", CapsuleBlock);
