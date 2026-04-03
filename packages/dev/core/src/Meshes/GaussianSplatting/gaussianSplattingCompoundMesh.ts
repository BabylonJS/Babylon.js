import { type Nullable } from "core/types";
import { type Scene } from "core/scene";
import { GaussianSplattingMesh } from "./gaussianSplattingMesh";
import { type GaussianSplattingPartProxyMesh } from "./gaussianSplattingPartProxyMesh";
import { Mesh } from "../mesh";

/**
 * Class used to compose multiple Gaussian Splatting meshes into a single draw call,
 * with per-part world-matrix and visibility control via addPart/addParts/removePart.
 *
 * This is the recommended class for multi-part Gaussian Splatting use cases.
 *
 * Next major version: the compound mesh API (addPart/addParts/removePart) will
 * move exclusively to this class and will be removed from GaussianSplattingMesh.
 */
export class GaussianSplattingCompoundMesh extends GaussianSplattingMesh {
    /**
     * Creates a new GaussianSplattingCompoundMesh
     * @param name the name of the mesh
     * @param url optional URL to load a Gaussian Splatting file from
     * @param scene the hosting scene
     * @param keepInRam whether to keep the raw splat data in RAM after uploading to GPU
     */
    constructor(name: string, url: Nullable<string> = null, scene: Nullable<Scene> = null, keepInRam: boolean = false) {
        super(name, url, scene, keepInRam);
    }

    /**
     * Add another mesh to this compound mesh as a new part.
     * The source mesh's splat data is read directly and copied into the compound's retained source buffers.
     * @param other - The other mesh to add. Must be fully loaded before calling this method.
     * @param disposeOther - Whether to dispose the other mesh after adding it.
     * @returns a placeholder mesh that can be used to manipulate the part transform
     */
    public override addPart(other: GaussianSplattingMesh, disposeOther: boolean = true): GaussianSplattingPartProxyMesh {
        return super.addPart(other, disposeOther);
    }

    /**
     * Add multiple meshes to this compound mesh as new parts in a single operation.
     * Splat data is written into texture arrays while the compound refreshes its retained merged source buffers.
     * @param others - The meshes to add. Each must be fully loaded and must not be a compound.
     * @param disposeOthers - Whether to dispose the other meshes after adding them.
     * @returns an array of placeholder meshes that can be used to manipulate the part transforms
     */
    public addParts(others: GaussianSplattingMesh[], disposeOthers: boolean = true): GaussianSplattingPartProxyMesh[] {
        if (others.length === 0) {
            return [];
        }
        const { proxyMeshes } = this._addPartsInternal(others, disposeOthers);
        return proxyMeshes;
    }

    /**
     * Remove a part from this compound mesh.
     * The remaining parts are rebuilt directly from the compound mesh's retained source buffers.
     * @param index - The index of the part to remove
     */
    public override removePart(index: number): void {
        super.removePart(index);
    }

    /**
     * Serialize current GaussianSplattingMesh
     * @param serializationObject defines the object which will receive the serialization data
     * @param encoding the encoding of binary data, defaults to base64 for json serialize,
     * kept for future internal use like cloning where base64 encoding wastes cycles and memory
     * @returns the serialized object
     */
    public override serialize(serializationObject: any = {}, encoding: string = "base64"): any {
        serializationObject = super.serialize(serializationObject, encoding);
        // Note here, the getClassName() is not overridden,
        // as a lot of code currently depend on `getClassName() === "GaussianSplattingMesh"` check,
        // to not break those code, serialization uses `_isCompound` to mark the type
        serializationObject._isCompound = true;
        return serializationObject;
    }

    /**
     * Parses a serialized GaussianSplattingCompoundMesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the GaussianSplattingCompoundMesh in
     * @returns the created GaussianSplattingCompoundMesh
     */
    public static override Parse(parsedMesh: any, scene: Scene): GaussianSplattingCompoundMesh {
        return GaussianSplattingMesh._ParseInternal(parsedMesh, scene, GaussianSplattingCompoundMesh);
    }
}

Mesh._GaussianSplattingCompoundMeshParser = GaussianSplattingCompoundMesh.Parse;
