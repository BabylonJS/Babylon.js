import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "core/Meshes/instancedMesh";
import "core/Materials/standardMaterial";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { MeshBlendingRadiusClass, PackMeshBlendingTag, UnpackMeshBlendingTag } from "core/Meshes/meshBlendingTag";

describe("Mesh-blending tags", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("packs and unpacks the supported group and radius limits", () => {
        expect(PackMeshBlendingTag(0, 99 as MeshBlendingRadiusClass)).toBe(0);
        expect(UnpackMeshBlendingTag(PackMeshBlendingTag(1, MeshBlendingRadiusClass.Small))).toEqual({
            groupId: 1,
            radiusClass: MeshBlendingRadiusClass.Small,
        });
        expect(UnpackMeshBlendingTag(PackMeshBlendingTag(63, MeshBlendingRadiusClass.ExtraLarge))).toEqual({
            groupId: 63,
            radiusClass: MeshBlendingRadiusClass.ExtraLarge,
        });
    });

    it("keeps one logical group independent of radius class", () => {
        const small = UnpackMeshBlendingTag(PackMeshBlendingTag(12, MeshBlendingRadiusClass.Small));
        const extraLarge = UnpackMeshBlendingTag(PackMeshBlendingTag(12, MeshBlendingRadiusClass.ExtraLarge));

        expect(small.groupId).toBe(extraLarge.groupId);
        expect(small.radiusClass).not.toBe(extraLarge.radiusClass);
    });

    it.each([
        () => PackMeshBlendingTag(-1, MeshBlendingRadiusClass.Small),
        () => PackMeshBlendingTag(64, MeshBlendingRadiusClass.Small),
        () => PackMeshBlendingTag(1.5, MeshBlendingRadiusClass.Small),
        () => PackMeshBlendingTag(1, -1 as MeshBlendingRadiusClass),
        () => PackMeshBlendingTag(1, 4 as MeshBlendingRadiusClass),
        () => UnpackMeshBlendingTag(-1),
        () => UnpackMeshBlendingTag(256),
        () => UnpackMeshBlendingTag(64),
    ])("rejects invalid tag data", (action) => {
        expect(action).toThrow(RangeError);
    });

    it("serializes, parses, and clones the packed tag", () => {
        const mesh = new Mesh("source", scene);
        mesh.meshBlendingTag = PackMeshBlendingTag(17, MeshBlendingRadiusClass.Large);

        const serialized = mesh.serialize();
        const parsedScene = new Scene(engine);
        const parsed = Mesh.Parse(serialized, parsedScene, "");
        const clone = mesh.clone("clone");

        try {
            expect(serialized.meshBlendingTag).toBe(mesh.meshBlendingTag);
            expect(parsed.meshBlendingTag).toBe(mesh.meshBlendingTag);
            expect(clone.meshBlendingTag).toBe(mesh.meshBlendingTag);
        } finally {
            parsedScene.dispose();
        }
    });

    it("uses the source mesh tag for instances", () => {
        const mesh = new Mesh("source", scene);
        mesh.meshBlendingTag = PackMeshBlendingTag(5, MeshBlendingRadiusClass.Medium);
        const instance = mesh.createInstance("instance");

        expect(instance.meshBlendingTag).toBe(mesh.meshBlendingTag);

        instance.meshBlendingTag = PackMeshBlendingTag(6, MeshBlendingRadiusClass.Large);
        expect(instance.meshBlendingTag).toBe(mesh.meshBlendingTag);
    });
});
