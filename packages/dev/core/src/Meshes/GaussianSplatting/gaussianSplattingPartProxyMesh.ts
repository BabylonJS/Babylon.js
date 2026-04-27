import { type Nullable } from "core/types";
import { type Scene } from "core/scene";
import { Mesh } from "../mesh";
import { BoundingInfo } from "../../Culling/boundingInfo";
import { type GaussianSplattingMesh } from "./gaussianSplattingMesh";
import { type Ray } from "../../Culling/ray.core";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { Vector3 } from "../../Maths/math.vector";

/**
 * Class used as a proxy mesh for a part of a compound Gaussian Splatting mesh
 */
export class GaussianSplattingPartProxyMesh extends Mesh {
    /**
     * Local-space bounds for this part, stored directly on the proxy so it does not
     * need to retain a reference to the original source mesh.
     */
    private _minimum: Vector3;
    private _maximum: Vector3;

    /**
     * The index of the part in the compound mesh (internal storage)
     */
    private _partIndex: number;

    /**
     * Number of splats owned by this part.
     * @internal
     */
    public _vertexCount: number;

    /**
     * Offset of this part in the compound splat ordering.
     * @internal
     */
    public _splatsDataOffset: number;

    /**
     * Texel offset of this part inside the compound SH textures.
     * This matches the splat offset because SH data is stored one texel per splat.
     * @internal
     */
    public _shDataOffset: number;

    /**
     * Gets the index of the part in the compound mesh
     */
    public get partIndex(): number {
        return this._partIndex;
    }

    /**
     * The compound mesh that owns this part proxy
     */
    public readonly compoundSplatMesh: GaussianSplattingMesh;

    /**
     * Backward-compatible alias for the owning compound mesh.
     * @deprecated Use `compoundSplatMesh` instead.
     */
    public get proxiedMesh(): GaussianSplattingMesh {
        return this.compoundSplatMesh;
    }

    /**
     * Creates a new Gaussian Splatting part proxy mesh
     * @param name The name of the proxy mesh
     * @param scene The scene the proxy mesh belongs to
     * @param compoundSplatMesh The compound mesh that owns this part proxy
     * @param partIndex The index of the part in the compound mesh
     * @param boundingInfo Local-space bounds of the part inside the compound mesh
     * @param vertexCount Number of splats owned by the part
     * @param splatsDataOffset Offset of the part in the compound splat ordering
     * @param shDataOffset Offset of the part in the compound SH textures
     */
    constructor(
        name: string,
        scene: Nullable<Scene>,
        compoundSplatMesh: GaussianSplattingMesh,
        partIndex: number,
        boundingInfo: BoundingInfo,
        vertexCount: number,
        splatsDataOffset: number,
        shDataOffset: number = splatsDataOffset
    ) {
        super(name, scene);
        this._partIndex = partIndex;
        this._vertexCount = vertexCount;
        this._splatsDataOffset = splatsDataOffset;
        this._shDataOffset = shDataOffset;
        this._minimum = boundingInfo.minimum.clone();
        this._maximum = boundingInfo.maximum.clone();
        this.compoundSplatMesh = compoundSplatMesh;

        this._applyBoundingInfo();
        this.compoundSplatMesh.setWorldMatrixForPart(this.partIndex, this.getWorldMatrix());

        // Update the compound mesh's part matrix when this proxy's world matrix changes.
        this.onAfterWorldMatrixUpdateObservable.add(() => {
            this.compoundSplatMesh.setWorldMatrixForPart(this.partIndex, this.getWorldMatrix());
        });
    }

    /**
     * Updates the bounding info of this proxy mesh from its stored part metadata.
     */
    public updateBoundingInfoFromPartData(): void {
        this._applyBoundingInfo();
    }

    /**
     * Backward-compatible alias retained while callers move away from source-mesh based semantics.
     */
    public updateBoundingInfoFromProxiedMesh(): void {
        this.updateBoundingInfoFromPartData();
    }

    private _applyBoundingInfo(): void {
        this.setBoundingInfo(new BoundingInfo(this._minimum.clone(), this._maximum.clone()));
    }

    /**
     * Returns the class name
     * @returns "GaussianSplattingPartProxyMesh"
     */
    public override getClassName(): string {
        return "GaussianSplattingPartProxyMesh";
    }

    /**
     * Updates the part index for this proxy mesh.
     * This should only be called internally when parts are removed from the compound mesh.
     * @param newPartIndex the new part index
     * @internal
     */
    public updatePartIndex(newPartIndex: number): void {
        this._partIndex = newPartIndex;
    }

    /**
     * Updates the per-part metadata for this proxy mesh.
     * This is used internally when compound parts are rebuilt and re-indexed.
     * @param vertexCount the number of splats owned by the part
     * @param splatsDataOffset the new splat offset in the compound
     * @param shDataOffset the new SH texel offset in the compound
     * @internal
     */
    public updatePartMetadata(vertexCount: number, splatsDataOffset: number, shDataOffset: number = splatsDataOffset): void {
        this._vertexCount = vertexCount;
        this._splatsDataOffset = splatsDataOffset;
        this._shDataOffset = shDataOffset;
    }

    /**
     * Gets whether the part is visible
     */
    public override get isVisible(): boolean {
        return this.compoundSplatMesh.getPartVisibility(this.partIndex) > 0;
    }

    /**
     * Sets whether the part is visible
     */
    public override set isVisible(value: boolean) {
        this.compoundSplatMesh.setPartVisibility(this.partIndex, value ? 1.0 : 0.0);
    }

    /**
     * Gets the visibility of the part (0.0 to 1.0)
     */
    public override get visibility(): number {
        return this.compoundSplatMesh.getPartVisibility(this.partIndex);
    }

    /**
     * Sets the visibility of the part (0.0 to 1.0)
     */
    public override set visibility(value: number) {
        this.compoundSplatMesh.setPartVisibility(this.partIndex, value);
    }

    /**
     * Checks if a ray intersects with this proxy mesh using only bounding info
     * @param ray defines the ray to test
     * @returns the picking info with this mesh set as pickedMesh if hit
     */
    public override intersects(ray: Ray): PickingInfo {
        const pickingInfo = new PickingInfo();
        const boundingInfo = this.getBoundingInfo();

        if (!boundingInfo) {
            return pickingInfo;
        }

        // Always check against bounding info for proxy meshes
        if (!ray.intersectsSphere(boundingInfo.boundingSphere) || !ray.intersectsBox(boundingInfo.boundingBox)) {
            return pickingInfo;
        }

        // If we hit the bounding volume, report this mesh as picked
        pickingInfo.hit = true;
        pickingInfo.pickedMesh = this;
        pickingInfo.distance = Vector3.Distance(ray.origin, boundingInfo.boundingSphere.center);
        pickingInfo.subMeshId = 0;

        return pickingInfo;
    }

    /**
     * Serialize current GaussianSplattingPartProxyMesh
     * @param serializationObject defines the object which will receive the serialization data
     * @returns the serialized object
     */
    public override serialize(serializationObject: any = {}): any {
        serializationObject = super.serialize(serializationObject);
        // GaussianSplattingPartProxyMesh needs no SubMesh, Geometry, or Material
        serializationObject.subMeshes = [];
        serializationObject.geometryUniqueId = undefined;
        serializationObject.geometryId = undefined;
        serializationObject.materialUniqueId = undefined;
        serializationObject.materialId = undefined;
        serializationObject.instances = [];
        serializationObject.actions = undefined;
        serializationObject.type = this.getClassName();
        serializationObject.compoundSplatMeshId = this.compoundSplatMesh.id;
        // Part metadata is needed to reconnect the proxy to the correct compound segment.
        serializationObject.partIndex = this._partIndex;
        serializationObject.vertexCount = this._vertexCount;
        serializationObject.splatsDataOffset = this._splatsDataOffset;
        serializationObject.shDataOffset = this._shDataOffset;
        const boundingInfo = this.getBoundingInfo();
        serializationObject.boundingInfo = {
            minimum: boundingInfo.minimum.asArray(),
            maximum: boundingInfo.maximum.asArray(),
        };
        return serializationObject;
    }

    /**
     * Parses a serialized GaussianSplattingPartProxyMesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the GaussianSplattingPartProxyMesh in
     * @returns the created GaussianSplattingPartProxyMesh
     */
    public static override Parse(parsedMesh: any, scene: Scene): GaussianSplattingPartProxyMesh {
        const partIndex = parsedMesh.partIndex;
        const compoundSplatMesh =
            (parsedMesh.compoundSplatMesh as GaussianSplattingMesh | undefined) ?? (scene.getLastMeshById(parsedMesh.compoundSplatMeshId) as GaussianSplattingMesh | null);
        if (!compoundSplatMesh) {
            throw new Error(`GaussianSplattingPartProxyMesh: compound mesh not found with ID ${parsedMesh.compoundSplatMeshId}`);
        }
        const minimum = Vector3.FromArray(parsedMesh.boundingInfo.minimum);
        const maximum = Vector3.FromArray(parsedMesh.boundingInfo.maximum);
        const boundingInfo = new BoundingInfo(minimum, maximum);
        const vertexCount = parsedMesh.vertexCount ?? 0;
        const splatsDataOffset = parsedMesh.splatsDataOffset ?? 0;
        const shDataOffset = parsedMesh.shDataOffset ?? splatsDataOffset;
        return new GaussianSplattingPartProxyMesh(parsedMesh.name, scene, compoundSplatMesh, partIndex, boundingInfo, vertexCount, splatsDataOffset, shDataOffset);
    }
}

Mesh._GaussianSplattingPartProxyMeshParser = GaussianSplattingPartProxyMesh.Parse;
