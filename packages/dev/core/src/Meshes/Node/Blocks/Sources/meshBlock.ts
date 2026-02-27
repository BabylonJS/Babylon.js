import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Mesh } from "../../../../Meshes/mesh";
import { VertexData } from "../../../../Meshes/mesh.vertexData";
import type { Nullable } from "../../../../types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";

/**
 * Defines a block used to generate a user defined mesh geometry data
 */
export class MeshBlock extends NodeGeometryBlock {
    private _mesh: Nullable<Mesh>;
    private _cachedVertexData: Nullable<VertexData> = null;

    /**
     * Gets or sets a boolean indicating that winding order needs to be reserved
     */
    public reverseWindingOrder = false;

    /**
     * Gets or sets a boolean indicating that this block should serialize its cached data
     */
    @editableInPropertyPage("Serialize cached data", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public serializedCachedData = false;

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
    public override getClassName() {
        return "MeshBlock";
    }

    /**
     * Gets a boolean indicating if the block is using cached data
     */
    public get isUsingCachedData() {
        return !this.mesh && !!this._cachedVertexData;
    }

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Remove stored data
     */
    public cleanData() {
        this._mesh = null;
        this._cachedVertexData = null;
    }

    protected override _buildBlock() {
        if (!this._mesh) {
            if (this._cachedVertexData) {
                this.geometry._storedValue = this._cachedVertexData.clone();
            } else {
                this.geometry._storedValue = null;
            }
            return;
        }

        const vertexData = VertexData.ExtractFromMesh(this._mesh, false, true);
        this._cachedVertexData = null;

        if (this.reverseWindingOrder && vertexData.indices) {
            for (let index = 0; index < vertexData.indices.length; index += 3) {
                const tmp = vertexData.indices[index];
                vertexData.indices[index] = vertexData.indices[index + 2];
                vertexData.indices[index + 2] = tmp;
            }
        }

        this.geometry._storedFunction = () => {
            return vertexData.clone();
        };
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.serializedCachedData = this.serializedCachedData;

        if (this.serializedCachedData) {
            if (this._mesh) {
                serializationObject.cachedVertexData = VertexData.ExtractFromMesh(this._mesh, false, true).serialize();
            } else if (this._cachedVertexData) {
                serializationObject.cachedVertexData = this._cachedVertexData.serialize();
            }
        }

        serializationObject.reverseWindingOrder = this.reverseWindingOrder;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.cachedVertexData) {
            this._cachedVertexData = VertexData.Parse(serializationObject.cachedVertexData);
        }

        this.serializedCachedData = !!serializationObject.serializedCachedData;
        this.reverseWindingOrder = serializationObject.reverseWindingOrder;
    }
}

RegisterClass("BABYLON.MeshBlock", MeshBlock);
