import { describe, expect, it } from "vitest";
import { VertexBuffer } from "core/Buffers/buffer";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh.pure";
import { Scene } from "core/scene";
import { ApplySkinningToMesh, CreateSkeletonAnimation, CreateSkeletonFromResolved } from "loaders/USD/adapter/skinningAdapter";
import { type IResolvedSkeleton, type IResolvedSkeletonAnimation, type IResolvedSkinning, type Mat4 } from "loaders/USD/resolution/resolvedStage";

const Fps = 24;
const IdentityMatrix: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function createScene(): { engine: NullEngine; scene: Scene } {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    return { engine, scene };
}

function createResolvedSkeleton(): IResolvedSkeleton {
    return {
        name: "Rig",
        joints: ["/Root", "/Root/Child"],
        parentIndices: new Int32Array([-1, 0]),
        bindTransforms: [IdentityMatrix, IdentityMatrix],
        restTransforms: [IdentityMatrix, IdentityMatrix],
    };
}

describe("USD skinning adapter", () => {
    it("creates a Babylon skeleton with resolved joint names and hierarchy", () => {
        const { engine, scene } = createScene();

        const skeleton = CreateSkeletonFromResolved(createResolvedSkeleton(), scene);

        expect(skeleton.name).toBe("Rig");
        expect(skeleton.bones).toHaveLength(2);
        expect(skeleton.bones[0].name).toBe("Root");
        expect(skeleton.bones[1].name).toBe("Child");
        expect(skeleton.bones[0].getParent()).toBeNull();
        expect(skeleton.bones[1].getParent()).toBe(skeleton.bones[0]);
        expect(skeleton.bones[0].children).toContain(skeleton.bones[1]);

        scene.dispose();
        engine.dispose();
    });

    it("binds skinning buffers and skeleton to a mesh", () => {
        const { engine, scene } = createScene();
        const skeleton = CreateSkeletonFromResolved(createResolvedSkeleton(), scene);
        const mesh = new Mesh("SkinnedMesh", scene);
        mesh.setVerticesData(VertexBuffer.PositionKind, new Float32Array([0, 0, 0, 1, 0, 0]));
        const skinning: IResolvedSkinning = {
            skeletonIndex: 0,
            influencesPerVertex: 4,
            jointIndices: new Uint32Array([0, 1, 0, 0, 1, 0, 0, 0]),
            jointWeights: new Float32Array([0.25, 0.75, 0, 0, 1, 0, 0, 0]),
        };

        ApplySkinningToMesh(mesh, skinning, skeleton, scene);

        expect(mesh.skeleton).toBe(skeleton);
        expect(mesh.numBoneInfluencers).toBe(4);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.MatricesIndicesKind)!)).toEqual([0, 1, 0, 0, 1, 0, 0, 0]);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.MatricesWeightsKind)!)).toEqual([0.25, 0.75, 0, 0, 1, 0, 0, 0]);

        scene.dispose();
        engine.dispose();
    });

    it("creates a targeted bone animation for each animated resolved joint", () => {
        const { engine, scene } = createScene();
        const skeleton = CreateSkeletonFromResolved(createResolvedSkeleton(), scene);
        const animation: IResolvedSkeletonAnimation = {
            times: new Float32Array([0, 1]),
            joints: [
                {
                    jointIndex: 1,
                    translations: new Float32Array([0, 0, 0, 0, 1, 0]),
                    rotations: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]),
                    scales: new Float32Array([1, 1, 1, 1, 1, 1]),
                },
            ],
        };

        const group = CreateSkeletonAnimation(animation, skeleton, Fps, scene);

        expect(group.targetedAnimations).toHaveLength(1);
        expect(group.targetedAnimations[0].target).toBe(skeleton.bones[1]);
        expect(group.targetedAnimations[0].animation.targetProperty).toBe("_matrix");
        expect(group.targetedAnimations[0].animation.getKeys().map((key) => key.frame)).toEqual([0, 24]);

        scene.dispose();
        engine.dispose();
    });
});
