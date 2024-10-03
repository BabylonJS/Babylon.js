import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import type { Nullable } from "../../../types";

/**
 * Block used to generate the final geometry
 */
export class GeometryOutputBlock extends NodeGeometryBlock {
    private _vertexData: Nullable<VertexData> = null;

    /**
     * Gets the current vertex data if the graph was successfully built
     */
    public get currentVertexData() {
        return this._vertexData;
    }

    /**
     * Create a new GeometryOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryOutputBlock";
    }
    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        state.vertexData = this.geometry.getConnectedValue(state);
        this._vertexData = state.vertexData;
    }
}
