import { AnimationGroup } from "../Animations/animationGroup";
import { BoundingBox } from "../Culling/boundingBox";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "./abstractMesh";

/**
 * Computes the maximum bounding boxes of the given meshes taking animation, skeleton, morph targets into account.
 * @param meshes The meshes to compute
 * @param animationGroup An optional animation group to animate
 * @param animationStep An optional animation step value indicating the amount to iterate while computing bounding boxes
 * @returns An array of bounding boxes corresponding to the input meshes, animation group, and animation step values
 */
export function computeMaxBoundingBoxes(meshes: Array<AbstractMesh>, animationGroup?: AnimationGroup, animationStep = 1 / 6): Array<BoundingBox> {
    const minimums = new Array<Vector3>(meshes.length);
    const maximums = new Array<Vector3>(meshes.length);

    for (let i = 0; i < meshes.length; i++) {
        minimums[i] = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        maximums[i] = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    if (animationGroup) {
        const step = animationGroup.getLength() * animationStep;

        for (let frame = animationGroup.from; frame < animationGroup.to; frame += step) {
            // Must increment the render id such that world matrices are recomputed.
            animationGroup.scene.incrementRenderId();

            animationGroup.goToFrame(frame);

            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];

                mesh.computeWorldMatrix();

                if (mesh.skeleton) {
                    mesh.skeleton.prepare(true);
                }

                mesh.refreshBoundingInfo(true, true);
                const boundingBox = mesh.getBoundingInfo().boundingBox;
                minimums[i].minimizeInPlace(boundingBox.minimumWorld);
                maximums[i].maximizeInPlace(boundingBox.maximumWorld);
            }
        }
    } else {
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            mesh.refreshBoundingInfo(true, true);
            const boundingBox = mesh.getBoundingInfo().boundingBox;
            minimums[i].minimizeInPlace(boundingBox.minimumWorld);
            maximums[i].maximizeInPlace(boundingBox.maximumWorld);
        }
    }

    const boundingBoxes = new Array<BoundingBox>(meshes.length);
    for (let i = 0; i < meshes.length; i++) {
        boundingBoxes[i] = new BoundingBox(minimums[i], maximums[i]);
    }

    return boundingBoxes;
}
