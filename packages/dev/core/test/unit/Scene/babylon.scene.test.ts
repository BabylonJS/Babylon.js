import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
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
    });

    describe("isReady with customRenderTargets", () => {
        it("should return false when a custom RTT is not ready for rendering", () => {
            const rtt = new RenderTargetTexture("testRTT", 256, scene);
            vi.spyOn(rtt, "isReadyForRendering").mockReturnValue(false);
            scene.customRenderTargets.push(rtt);

            expect(scene.isReady(true)).toBe(false);
        });

        it("should return true when a custom RTT is ready for rendering", () => {
            const rtt = new RenderTargetTexture("testRTT", 256, scene);
            vi.spyOn(rtt, "isReadyForRendering").mockReturnValue(true);
            scene.customRenderTargets.push(rtt);

            expect(scene.isReady(true)).toBe(true);
        });

        it("should not check custom RTTs when checkRenderTargets is false", () => {
            const rtt = new RenderTargetTexture("testRTT", 256, scene);
            const spy = vi.spyOn(rtt, "isReadyForRendering").mockReturnValue(false);
            scene.customRenderTargets.push(rtt);

            expect(scene.isReady(false)).toBe(true);
            expect(spy).not.toHaveBeenCalled();
        });
    });
})