import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { type Effect } from "core/Materials/effect";
import { type ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { type Mesh } from "core/Meshes/mesh";

/**
 * Asynchronous pipeline creation: the draw contexts of all the passes of a mesh share the mesh's wait state, so that its passes wait
 * together for their render pipelines; a draw context that does not belong to a mesh (a post-process, particles...) has none, and
 * its pipelines are always created synchronously.
 */
describe("Sub mesh draw contexts and the pipeline wait state", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;

    beforeEach(() => {
        engine = new NullEngine();
        // a draw context, as the WebGPU engine creates (a NullEngine has none)
        vi.spyOn(engine, "createDrawContext").mockImplementation(() => ({ _pipelineWait: null, reset: () => {}, dispose: () => {} }) as any);
        scene = new Scene(engine);
        mesh = MeshBuilder.CreateBox("box", {}, scene);
    });

    afterEach(() => {
        engine.dispose();
    });

    it("shares the mesh's wait state between the draw contexts of all its passes", () => {
        const subMesh = mesh.subMeshes[0];
        const mainPass = subMesh._getDrawWrapper(0, true)!;
        const shadowPass = subMesh._getDrawWrapper(5, true)!;

        expect(mainPass.drawContext!._pipelineWait).toBe(mesh._internalAbstractMeshDataInfo);
        expect(shadowPass.drawContext!._pipelineWait).toBe(mesh._internalAbstractMeshDataInfo);
    });

    it("shares it with the shadow map draws of a material's ShadowDepthWrapper, in the first pass too", () => {
        const subMesh = mesh.subMeshes[0];
        const material = new StandardMaterial("material", scene);
        const wrapper = new ShadowDepthWrapper(material, scene);
        // the material's effect for the sub mesh, ready and without code: the depth effect is not built, only its draw wrappers
        const effect = { isReady: () => true, getUniformNames: () => [] } as unknown as Effect;
        material.onEffectCreatedObservable.notifyObservers({ effect, subMesh });
        // a single shadow generator (here only the key of its depth effects)
        const generator = {} as ShadowGenerator;
        wrapper.isReadyForSubMesh(subMesh, [], generator, false, 5);

        // the wrapper the first pass created, and the one of another pass
        expect(wrapper.getEffect(subMesh, generator, 5)!.drawContext!._pipelineWait).toBe(mesh._internalAbstractMeshDataInfo);
        expect(wrapper.getEffect(subMesh, generator, 6)!.drawContext!._pipelineWait).toBe(mesh._internalAbstractMeshDataInfo);
    });

    it("gives no wait state to a draw context that is not a mesh's", () => {
        expect(new DrawWrapper(engine).drawContext!._pipelineWait).toBeNull();
    });
});
