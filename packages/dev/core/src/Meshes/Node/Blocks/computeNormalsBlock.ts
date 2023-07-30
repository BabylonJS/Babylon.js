import { VertexData } from "core/Meshes/mesh.vertexData";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
/**
 * Block used to recompute normals for a geometry
 */
export class ComputeNormalsBlock extends NodeGeometryBlock {
    /**
     * Creates a new ComputeNormalsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ComputeNormalsBlock";
    }

    /**
     * Gets the geometry component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        this.output._storedFunction = (state) => {

            if (!this.geometry.isConnected) {
                return null;
            }

            const vertexData = this.geometry.getConnectedValue(state);

            VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);

            return vertexData;
        }
    }
}

RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
