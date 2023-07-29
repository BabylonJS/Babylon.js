import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateCylinderVertexData } from "core/Meshes/Builders";
import type { Color4 } from "../../../../Maths/math.color";

/**
 * Defines a block used to generate cylinder geometry data
 */
export class CylinderBlock extends NodeGeometryBlock {
    /**
     * Create a new SphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 25);
        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterTop", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("diameterBottom", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 24);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true, 1.0);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CylinderBlock";
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the diameter input component
     */
    public get diameter(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the diameterTop input component
     */
    public get diameterTop(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the diameterBottom input component
     */
    public get diameterBottom(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the subdivisions input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the arc input component
     */
    public get arc(): NodeGeometryConnectionPoint {
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

        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            height?: number;
            diameterTop?: number;
            diameterBottom?: number;
            diameter?: number;
            tessellation?: number;
            subdivisions?: number;
            arc?: number;
            faceColors?: Color4[];
            faceUV?: Vector4[];
            hasRings?: boolean;
            enclose?: boolean;
            cap?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        } = {};

        options.height = this.height.getConnectedValue(state);
        options.diameter = this.diameter.getConnectedValue(state);
        if (!options.diameter) {
            options.diameterTop = this.diameterTop.getConnectedValue(state);
            options.diameterBottom = this.diameterBottom.getConnectedValue(state);
        }
        options.tessellation = this.tessellation.getConnectedValue(state);
        options.subdivisions = this.subdivisions.getConnectedValue(state);
        options.arc = this.arc.getConnectedValue(state);

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateCylinderVertexData(options);
    }
}

RegisterClass("BABYLON.CylinderBlock", CylinderBlock);
