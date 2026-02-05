import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import { Mesh } from "../mesh";
import { BoundingInfo } from "../../Culling/boundingInfo";
import type { GaussianSplattingMesh } from "./gaussianSplattingMesh";
import type { Ray } from "../../Culling/ray.core";
import { PickingInfo } from "../../Collisions/pickingInfo";
import { Vector3 } from "../../Maths/math.vector";

/**
 * Class used as a proxy mesh for a part of a compound Gaussian Splatting mesh
 */
export class GaussianSplattingPartProxyMesh extends Mesh {
    /**
     * The Gaussian Splatting mesh that this proxy represents a part of
     */
    public readonly proxiedMesh: GaussianSplattingMesh;

    /**
     * The index of the part in the compound mesh (internal storage)
     */
    private _partIndex: number;

    /**
     * Gets the index of the part in the compound mesh
     */
    public get partIndex(): number {
        return this._partIndex;
    }

    /**
     * The original Gaussian Splatting mesh that was merged into the compound
     */
    public readonly compoundSplatMesh: GaussianSplattingMesh;

    /**
     * Creates a new Gaussian Splatting part proxy mesh
     * @param name The name of the proxy mesh
     * @param scene The scene the proxy mesh belongs to
     * @param compoundSplatMesh The original Gaussian Splatting mesh that was merged into the compound
     * @param proxiedMesh The Gaussian Splatting mesh that this proxy represents a part of
     * @param partIndex The index of the part in the compound mesh
     */
    constructor(name: string, scene: Nullable<Scene>, compoundSplatMesh: GaussianSplattingMesh, proxiedMesh: GaussianSplattingMesh, partIndex: number) {
        super(name, scene);
        this.proxiedMesh = proxiedMesh;
        this._partIndex = partIndex;
        this.compoundSplatMesh = compoundSplatMesh;

        // Set bounding info based on the source mesh's bounds
        this.updateBoundingInfoFromProxiedMesh();
        this.compoundSplatMesh.setWorldMatrixForPart(this.partIndex, this.getWorldMatrix());

        // Update the proxied mesh's part matrix when this proxy's world matrix changes
        this.onAfterWorldMatrixUpdateObservable.add(() => {
            this.compoundSplatMesh.setWorldMatrixForPart(this.partIndex, this.getWorldMatrix());
            this.updateBoundingInfoFromProxiedMesh();
        });
    }

    /**
     * Updates the bounding info of this proxy mesh from the proxied mesh
     */
    public updateBoundingInfoFromProxiedMesh(): void {
        const boundingInfo = this.proxiedMesh.getBoundingInfo();
        this.setBoundingInfo(new BoundingInfo(boundingInfo.minimum.clone(), boundingInfo.maximum.clone()));
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
}
