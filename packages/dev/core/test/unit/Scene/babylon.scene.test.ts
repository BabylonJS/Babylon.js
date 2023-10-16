import type { Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes";
import { Scene } from "core/scene";
import { Tags } from "core/Misc";

describe("Babylon Scene", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);
    });

    it("Tags", () => {
        const mesh1 = new Mesh("mesh1", scene);
        Tags.AddTagsTo(mesh1, "tag1 tag2");

        const mesh2 = new Mesh("mesh2", scene);
        Tags.AddTagsTo(mesh2, "tag1 tag3");

        const getByTags1 = scene.getMeshesByTags("tag1");
        expect(getByTags1).toEqual([mesh1, mesh2]);

        const getByTags2 = scene.getMeshesByTags("tag2");
        expect(getByTags2).toEqual([mesh1]);

        const getByTags3 = scene.getMeshesByTags("tag1", (mesh) => mesh.name === "mesh2");
        expect(getByTags3).toEqual([mesh2]);
    })
})