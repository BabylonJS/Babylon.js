import { CreatePlaneVertexData } from "../../../../Meshes/Builders/planeBuilder";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";

/**
 * Defines a block used to generate plane geometry data
 */
export class PlaneBlock extends NodeGeometryBlock {

    /**
     * Create a new PlaneBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("size", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PlaneBlock";
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
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }   

    public autoConfigure() {
        if (this.size.isConnected) {
            return;
        }

        if (!this.width.isConnected && !this.height.isConnected) {
            const sizeInput = new GeometryInputBlock("size");
            sizeInput.value = 1;
            sizeInput.output.connectTo(this.size);
            return;
        }

        if (!this.width.isConnected) {
            const widthInput = new GeometryInputBlock("width");
            widthInput.value = 1;
            widthInput.output.connectTo(this.width);
        }
        
        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }        
    }    

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: { size?: number; width?: number; height?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 } = {};

        if (this.size.isConnected) {
            options.size = this.size.getConnectedValue(state);
        }

        if (this.width.isConnected) {
            options.width = this.width.getConnectedValue(state);
        }

        if (this.height.isConnected) {
            options.height = this.height.getConnectedValue(state);
        }

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreatePlaneVertexData(options);
    }
}


RegisterClass("BABYLON.PlaneBlock", PlaneBlock);
