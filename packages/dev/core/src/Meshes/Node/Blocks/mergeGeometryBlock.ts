import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { VertexData } from "../../../Meshes/mesh.vertexData";

/**
 * Block used to merge several geometries
 */
export class MergeGeometryBlock extends NodeGeometryBlock {
    /**
     * Create a new MergeGeometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry2", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry3", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry4", NodeGeometryBlockConnectionPointTypes.Geometry, true);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MergeGeometryBlock";
    }

    /**
     * Gets the geometry0 input component
     */
    public get geometry0(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the geometry1 input component
     */
    public get geometry1(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry2 input component
     */
    public get geometry2(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry3 input component
     */
    public get geometry3(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry4 input component
     */
    public get geometry4(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        this.output._storedFunction = (state) => {
            let vertexData = this.geometry0.getConnectedValue(state) as VertexData;
            const additionalVertexData: VertexData[] = [];

            if (this.geometry1.isConnected) {
                additionalVertexData.push(this.geometry1.getConnectedValue(state));
            }
            if (this.geometry2.isConnected) {
                additionalVertexData.push(this.geometry2.getConnectedValue(state));
            }
            if (this.geometry3.isConnected) {
                additionalVertexData.push(this.geometry3.getConnectedValue(state));
            }
            if (this.geometry4.isConnected) {
                additionalVertexData.push(this.geometry4.getConnectedValue(state));
            }

            if (additionalVertexData.length) {
                vertexData = vertexData.merge(additionalVertexData, true);
            }

            return vertexData;
        };
    }
}

RegisterClass("BABYLON.MergeGeometryBlock", MergeGeometryBlock);
