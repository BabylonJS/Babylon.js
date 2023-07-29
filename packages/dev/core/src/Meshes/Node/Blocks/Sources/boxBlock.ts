import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import type { Color4 } from "../../../../Maths/math.color";
import { CreateBoxVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate box geometry data
 */
export class BoxBlock extends NodeGeometryBlock {
    /**
     * Create a new BoxBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("size", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("depth", NodeGeometryBlockConnectionPointTypes.Float, true, 0);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "BoxBlock";
    }

    /**
     * Gets the size input component
     */
    public get size(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the width input component
     */
    public get width(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the height input component
     */
    public get height(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the depth input component
     */
    public get depth(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (this.size.isConnected) {
            return;
        }

        if (!this.width.isConnected && !this.height.isConnected && !this.depth.isConnected) {
            const sizeInput = new GeometryInputBlock("Size");
            sizeInput.value = 1;
            sizeInput.output.connectTo(this.size);
            return;
        }

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

        if (!this.depth.isConnected) {
            const depthInput = new GeometryInputBlock("Depth");
            depthInput.value = 1;
            depthInput.output.connectTo(this.depth);
        }
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            size?: number;
            width?: number;
            height?: number;
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            wrap?: boolean;
            topBaseAt?: number;
            bottomBaseAt?: number;
        } = {};

        options.size = this.size.getConnectedValue(state);
        options.width = this.width.getConnectedValue(state);
        options.height = this.height.getConnectedValue(state);
        options.depth = this.depth.getConnectedValue(state);

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateBoxVertexData(options);
    }
}

RegisterClass("BABYLON.BoxBlock", BoxBlock);
