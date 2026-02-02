import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import { Mesh } from "../mesh";
import { BoundingInfo } from "../../Culling/boundingInfo";
import type { GaussianSplattingMesh } from "./gaussianSplattingMesh";

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
     * @param name defines the name of the mesh
     * @param proxiedMesh the Gaussian Splatting mesh that this proxy represents a part of
     * @param partIndex the index of the part in the compound mesh
     * @param compoundSplatMesh the original Gaussian Splatting mesh that was merged into the compound
     * @param scene defines the hosting scene
     */
    constructor(name: string, proxiedMesh: GaussianSplattingMesh, partIndex: number, compoundSplatMesh: GaussianSplattingMesh, scene: Nullable<Scene>) {
        super(name, scene);
        this.proxiedMesh = proxiedMesh;
        this._partIndex = partIndex;
        this.compoundSplatMesh = compoundSplatMesh;

        // Set bounding info based on the source mesh's bounds
        this.updateBoundingInfoFromProxiedMesh();

        // Update the proxied mesh's part matrix when this proxy's world matrix changes
        this.onAfterWorldMatrixUpdateObservable.add(() => {
            this.proxiedMesh.setWorldMatrixForPart(this.partIndex, this.getWorldMatrix());
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
}
