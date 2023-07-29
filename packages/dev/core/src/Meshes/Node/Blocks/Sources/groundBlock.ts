import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { CreateGroundVertexData } from "../../../../Meshes/Builders";

/**
 * Defines a block used to generate ground geometry data
 */
export class GroundBlock extends NodeGeometryBlock {
    /**
     * Create a new GroundBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("subdivisionsX", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("subdivisionsY", NodeGeometryBlockConnectionPointTypes.Float, true, 1);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GroundBlock";
    }

    /**
     * Gets the width input component
     */
    public get width(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the height input component
     */
    public get subdivisions(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the height input component
     */
    public get subdivisionsX(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the height input component
     */
    public get subdivisionsY(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }
    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.width.isConnected) {
            const widthInput = new GeometryInputBlock("Width");
            widthInput.value = 1;
            widthInput.output.connectTo(this.width);
        }

        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: { width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number } = {};

        options.width = this.width.getConnectedValue(state);
        options.height = this.height.getConnectedValue(state);
        options.subdivisions = this.subdivisions.getConnectedValue(state);
        options.subdivisionsX = this.subdivisionsX.getConnectedValue(state);
        options.subdivisionsY = this.subdivisionsY.getConnectedValue(state);

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateGroundVertexData(options);
    }
}

RegisterClass("BABYLON.GroundBlock", GroundBlock);
