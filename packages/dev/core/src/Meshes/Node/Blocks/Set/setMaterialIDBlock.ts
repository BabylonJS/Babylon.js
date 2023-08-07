import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { VertexDataMaterialInfo, type VertexData } from "../../../../Meshes/mesh.vertexData";

/**
 * Block used to affect a material ID to a geometry
 */
export class SetMaterialIDBlock extends NodeGeometryBlock {
    /**
     * Create a new SetMaterialIDBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("id", NodeGeometryBlockConnectionPointTypes.Int, true, 0);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.id.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SetMaterialIDBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the id input component
     */
    public get id(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.geometry.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const vertexData = this.geometry.getConnectedValue(state) as VertexData;
            if (!vertexData || !vertexData.indices || !vertexData.positions) {
                return vertexData;
            }

            const materialInfo = new VertexDataMaterialInfo();
            materialInfo.materialIndex = this.id.getConnectedValue(state) | 0;
            materialInfo.indexStart = 0;
            materialInfo.indexCount = vertexData.indices.length;
            materialInfo.verticesStart = 0;
            materialInfo.verticesCount = vertexData.positions.length / 3;

            vertexData.materialInfos = [materialInfo];

            return vertexData;
        };
    }
}

RegisterClass("BABYLON.SetMaterialIDBlock", SetMaterialIDBlock);
