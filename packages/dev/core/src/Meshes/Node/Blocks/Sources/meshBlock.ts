import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Mesh } from "../../../../Meshes/mesh";
import { VertexData } from "../../../../Meshes/mesh.vertexData";
import type { Nullable } from "../../../../types";

/**
 * Defines a block used to generate a user defined mesh geometry data
 */
export class MeshBlock extends NodeGeometryBlock {
    private _mesh: Nullable<Mesh>;
    private _cachedVertexData: Nullable<VertexData> = null;

    /**
     * Gets or sets the mesh to use to get vertex data
     */
    public get mesh() {
        return this._mesh;
    }

    public set mesh(value: Nullable<Mesh>) {
        this._mesh = value;
    }

    /**
     * Create a new MeshBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MeshBlock";
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }   

    protected _buildBlock() {
        if (!this._mesh) {
            if (this._cachedVertexData) {
                this.geometry._storedValue = this._cachedVertexData.clone();
            } else {
                this.geometry._storedValue = null;
            }
            return;
        }

        this.geometry._storedValue = VertexData.ExtractFromMesh(this._mesh, false, true);
        this._cachedVertexData = null;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        if (this._mesh) {
            serializationObject.cachedVertexData = VertexData.ExtractFromMesh(this._mesh, false, true).serialize();
        } else if (this._cachedVertexData) {
            serializationObject.cachedVertexData = this._cachedVertexData.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        if (serializationObject.cachedVertexData) {
            this._cachedVertexData = VertexData.Parse(serializationObject.cachedVertexData);
        }
    }     
}


RegisterClass("BABYLON.MeshBlock", MeshBlock);
