import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateIcoSphereVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate icosphere geometry data
 */
export class IcoSphereBlock extends NodeGeometryBlock {
    /**
     * Create a new IcoSphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true, 1) ;
        this.registerInput("radiusX", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("radiusY", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("radiusZ", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Float, true, 4);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "IcoSphereBlock";
    }

    /**
     * Gets the radius input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the radius input component
     */
    public get radiusX(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the radius input component
     */
    public get radiusY(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the radius input component
     */
    public get radiusZ(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[4];
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
            radiusX?: number;
            radiusY?: number;
            radiusZ?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};

        options.radius = this.radius.getConnectedValue(state);
        options.subdivisions = this.subdivisions.getConnectedValue(state);
        options.radiusX = this.radiusX.getConnectedValue(state);
        options.radiusX = this.radiusX.getConnectedValue(state);
        options.radiusX = this.radiusX.getConnectedValue(state);
        options.radiusX = this.radiusX.getConnectedValue(state);

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateIcoSphereVertexData(options);
    }
}

RegisterClass("BABYLON.IcoSphereBlock", IcoSphereBlock);
