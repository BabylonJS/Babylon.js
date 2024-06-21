import type { AnimationGroup } from "../Animations/animationGroup";
import { BoundingInfoHelper } from "../Culling/Helper/boundingInfoHelper";
import { BoundingBox } from "../Culling/boundingBox";
import { Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "./abstractMesh";

/**
 * Computes the maximum bounding boxes of the given meshes taking animation, skeleton, morph targets into account.
 * @param meshes The meshes to compute
 * @param animationGroup An optional animation group to animate
 * @param animationStep An optional animation step value indicating the amount to iterate while computing bounding boxes
 * @returns An array of bounding boxes corresponding to the input meshes, animation group, and animation step values
 */
export async function computeMaxBoundingBoxesAsync(meshes: Array<AbstractMesh>, animationGroup?: AnimationGroup, animationStep = 1 / 6): Promise<Array<BoundingBox>> {
    if (meshes.length === 0) {
        return [];
    }

    const minimums = Array.from({ length: meshes.length }, () => new Vector3().setAll(Number.POSITIVE_INFINITY));
    const maximums = Array.from({ length: meshes.length }, () => new Vector3().setAll(Number.POSITIVE_INFINITY));

    const boundingInfoHelper = new BoundingInfoHelper(meshes[0].getEngine());

    if (animationGroup) {
        const step = animationGroup.getLength() * animationStep;

        for (let frame = animationGroup.from; frame < animationGroup.to; frame += step) {
            // Must increment the render id such that world matrices are recomputed.
            animationGroup.scene.incrementRenderId();

            animationGroup.goToFrame(frame);

            for (const mesh of meshes) {
                mesh.computeWorldMatrix();

                if (mesh.skeleton) {
                    mesh.skeleton.prepare(true);
                }
            }

            await boundingInfoHelper.computeAsync(meshes);

            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                const boundingBox = mesh.getBoundingInfo().boundingBox;
                minimums[i].minimizeInPlace(boundingBox.minimumWorld);
                maximums[i].maximizeInPlace(boundingBox.maximumWorld);
            }
        }
    } else {
        await boundingInfoHelper.computeAsync(meshes);

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
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
