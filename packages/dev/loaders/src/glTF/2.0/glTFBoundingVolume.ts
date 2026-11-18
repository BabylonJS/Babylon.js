import { BoundingInfo } from "core/Culling/boundingInfo";
import { BoundingBox } from "core/Culling/boundingBox";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type TransformNode } from "core/Meshes/transformNode";
import { type IBoundingVolume, type IShape } from "./glTFLoaderInterfaces";

const BoundingVolumes = new WeakMap<TransformNode, GLTFBoundingVolume>();

/**
 * An authored glTF bounding volume. It is not applied to Babylon's automatic mesh culling.
 */
export class GLTFBoundingVolume {
    /** Translation of the volume relative to its node. */
    public readonly translation: Vector3;
    /** Rotation of the volume relative to its node. */
    public readonly rotation: Quaternion;
    /** Scale of the volume relative to its node. */
    public readonly scale: Vector3;

    /** @internal */
    public constructor(
        private readonly _node: TransformNode,
        /** The shared glTF shape definition. */
        public readonly shape: IShape,
        volume: IBoundingVolume
    ) {
        if (shape.type !== "box" && shape.type !== "sphere") {
            throw new Error(`Unsupported glTF bounding volume shape '${shape.type}'`);
        }
        this.translation = Vector3.FromArray(volume.translation ?? [0, 0, 0]);
        this.rotation = Quaternion.FromArray(volume.rotation ?? [0, 0, 0, 1]);
        this.scale = Vector3.FromArray(volume.scale ?? [1, 1, 1]);
    }

    /**
     * Computes conservative world-space Babylon bounds using the current node and volume transforms.
     * @returns The world-space bounds
     */
    public getBoundingInfo(): BoundingInfo {
        const halfSize = this.shape.type === "box" ? Vector3.FromArray(this.shape.box?.size ?? [1, 1, 1]).scale(0.5) : Vector3.One().scale(this.shape.sphere?.radius ?? 0.5);
        const world = Matrix.Compose(this.scale, this.rotation, this.translation).multiply(this._node.computeWorldMatrix(true));
        const box = new BoundingBox(halfSize.scale(-1), halfSize, world);
        return new BoundingInfo(box.minimumWorld, box.maximumWorld);
    }
}

/**
 * Gets the authored glTF bounding volume associated with a loaded node.
 * @param node A Babylon node loaded from glTF
 * @returns The volume, or undefined if the node has no supported bounding volume
 */
export function GetGLTFBoundingVolume(node: TransformNode): GLTFBoundingVolume | undefined {
    return BoundingVolumes.get(node);
}

/** @internal */
export function InitializeGLTFBoundingVolume(node: TransformNode, shape: IShape, volume: IBoundingVolume): void {
    BoundingVolumes.set(node, new GLTFBoundingVolume(node, shape, volume));
}
