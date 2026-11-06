import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { CreateLines } from "core/Meshes/Builders/linesBuilder";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Mesh } from "core/Meshes/mesh";
import { IsWrapper } from "core/Materials/drawWrapper.functions";
import { type Effect } from "core/Materials/effect";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "core/Maths/math.vector";
import { type Nullable } from "core/types";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";
// the shader modules ShadowGenerator imports when it is built, loaded before the test ends
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/color.fragment";
import "core/Shaders/color.vertex";

/**
 * SubMesh.setIndirectDrawBuffer: the draw of a sub mesh in a render pass reads its arguments from the application's buffer, filled on
 * the GPU. The binding belongs to the pass and reaches each draw of the sub mesh in that pass, through whatever draw context the draw
 * uses; a draw without a binding clears it, so a draw context shared between sub meshes never keeps another's.
 */
describe("SubMesh.setIndirectDrawBuffer", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;
    let subMesh: SubMesh;
    // what the draw context holds when the engine draws
    let draws: Array<{ context: WebGPUDrawContext; buffer: Nullable<DataBuffer>; byteOffset: number; passId: number }>;
    const buffer = { underlyingResource: {} } as DataBuffer;
    const other = { underlyingResource: {} } as DataBuffer;
    const context = (passId: number, target = subMesh) => target._getDrawWrapper(passId, true)!.drawContext as WebGPUDrawContext;
    // a draw of the sub mesh in a pass, through a draw context
    const draw = (passId: number, drawContext = context(passId), target = subMesh) => {
        engine.currentRenderPassId = passId;
        engine._currentDrawContext = drawContext;
        const renderingMesh = target.getRenderingMesh();
        renderingMesh._processRendering(renderingMesh, target, null as any, 0, renderingMesh._getInstancesRenderList(target._id), false, () => {});
        return draws[draws.length - 1];
    };

    beforeEach(() => {
        engine = new NullEngine();
        // the draw contexts the WebGPU engine creates, and made current by enableEffect as it does (a NullEngine has none)
        vi.spyOn(engine, "createDrawContext").mockImplementation(() => new WebGPUDrawContext({} as any, {} as any));
        const enableEffect = engine.enableEffect;
        vi.spyOn(engine, "enableEffect").mockImplementation((effect) => {
            enableEffect.call(engine, effect);
            if (effect && IsWrapper(effect)) {
                engine._currentDrawContext = effect.drawContext!;
            }
        });
        draws = [];
        const drawn = () => {
            const drawContext = engine._currentDrawContext as WebGPUDrawContext;
            draws.push({
                context: drawContext,
                buffer: drawContext._externalIndirectDrawBuffer,
                byteOffset: drawContext._externalIndirectDrawByteOffset,
                passId: engine.currentRenderPassId,
            });
        };
        vi.spyOn(engine, "drawElementsType").mockImplementation(drawn);
        vi.spyOn(engine, "drawArraysType").mockImplementation(drawn);
        scene = new Scene(engine);
        mesh = MeshBuilder.CreateBox("box", {}, scene);
        subMesh = mesh.subMeshes[0];
    });

    afterEach(() => {
        engine.dispose();
    });

    it("reaches the draws of its pass only", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        expect(draw(3)).toMatchObject({ buffer, byteOffset: 20 });
        expect(draw(5)).toMatchObject({ buffer: null, byteOffset: 0 });
    });

    it("clears the draw context of a draw without a binding, so a shared draw context never keeps another sub mesh's", () => {
        const shared = context(3);
        const unbound = MeshBuilder.CreateBox("unbound", {}, scene).subMeshes[0];
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        expect(draw(3, shared)).toMatchObject({ buffer, byteOffset: 20 });
        expect(draw(3, shared, unbound)).toMatchObject({ buffer: null, byteOffset: 0 });
        expect(draw(3, shared)).toMatchObject({ buffer, byteOffset: 20 });
    });

    it("outlives resetDrawCache, and is cleared with null", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 4);
        subMesh.resetDrawCache();
        expect(draw(4)).toMatchObject({ buffer, byteOffset: 20 });
        subMesh.setIndirectDrawBuffer(null, 0, 4);
        expect(draw(4)).toMatchObject({ buffer: null, byteOffset: 0 });
    });

    it("goes with its render pass id when the id is released, and with the sub mesh when it is disposed", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        subMesh.setIndirectDrawBuffer(buffer, 40, 4);
        engine.releaseRenderPassId(3);
        expect(subMesh._indirectDrawBuffers!.has(3)).toBe(false);
        expect(draw(4)).toMatchObject({ buffer, byteOffset: 40 });
        subMesh.dispose();
        expect(subMesh._indirectDrawBuffers).toBeUndefined();
    });

    it("records the draw's bundle again on a new buffer or offset, not on the same binding", () => {
        const ctx = context(3);
        const recorded = () => {
            ctx.fastBundle = {} as GPURenderBundle;
            ctx.resetIsDirty(0);
        };
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        draw(3);
        recorded();
        draw(3);
        expect(ctx.fastBundle).toBeDefined();
        expect(ctx.isDirty(0)).toBe(false);

        subMesh.setIndirectDrawBuffer(buffer, 40, 3);
        draw(3);
        expect(ctx.fastBundle).toBeUndefined();
        expect(ctx.isDirty(0)).toBe(true);

        recorded();
        subMesh.setIndirectDrawBuffer(other, 40, 3);
        draw(3);
        expect(ctx.fastBundle).toBeUndefined();
        expect(ctx.isDirty(0)).toBe(true);
    });

    it("keeps the binding through a reset of the draw context, which a new effect does", () => {
        subMesh.setIndirectDrawBuffer(buffer, 20, 3);
        draw(3);
        context(3).reset();
        expect(context(3)._externalIndirectDrawBuffer).toBe(buffer);
    });

    it("reaches the shadow map draws of a material with a ShadowDepthWrapper, through the wrapper's draw context of the pass", () => {
        const material = new StandardMaterial("material", scene);
        mesh.material = material;
        const wrapper = new ShadowDepthWrapper(material, scene);
        material.shadowDepthWrapper = wrapper;
        const generator = new ShadowGenerator(64, new DirectionalLight("light", new Vector3(0, -1, 0), scene));
        // the material's effect for the sub mesh, ready and without code: the wrapper builds the draw wrappers of its passes
        const effect = { isReady: () => true, getUniformNames: () => [] } as unknown as Effect;
        material.onEffectCreatedObservable.notifyObservers({ effect, subMesh });
        wrapper.isReadyForSubMesh(subMesh, [], generator, false, 7);
        wrapper.isReadyForSubMesh(subMesh, [], generator, false, 8);
        // the depth effect the wrapper would build from the material's shader code, which the fake effect has not
        const depthEffect = engine.createEffect({ vertexSource: "void main(void) {}", fragmentSource: "void main(void) {}" }, ["position"], [], [], "");
        wrapper.getEffect(subMesh, generator, 7)!.setEffect(depthEffect);
        wrapper.getEffect(subMesh, generator, 8)!.setEffect(depthEffect);
        vi.spyOn(generator, "isReady").mockReturnValue(true);
        subMesh.setIndirectDrawBuffer(buffer, 20, 7);

        const shadowDraw = (passId: number) => {
            engine.currentRenderPassId = passId;
            scene.incrementRenderId();
            (generator as any)._renderSubMeshForShadowMap(subMesh);
            return draws[draws.length - 1];
        };
        expect(shadowDraw(7)).toMatchObject({ context: wrapper.getEffect(subMesh, generator, 7)!.drawContext, buffer, byteOffset: 20 });
        expect(shadowDraw(8)).toMatchObject({ context: wrapper.getEffect(subMesh, generator, 8)!.drawContext, buffer: null });

        // a binding that changes after the wrapper's draw contexts exist, then cleared
        subMesh.setIndirectDrawBuffer(other, 40, 7);
        expect(shadowDraw(7)).toMatchObject({ buffer: other, byteOffset: 40 });
        subMesh.setIndirectDrawBuffer(null, 0, 7);
        expect(shadowDraw(7)).toMatchObject({ buffer: null, byteOffset: 0 });
    });

    it("reaches the draws of a material that draws all its meshes through one draw context, and leaves none to the next mesh", () => {
        const material = new ShaderMaterial(
            "shader",
            scene,
            { vertexSource: "void main(void) { gl_Position = vec4(0.); }", fragmentSource: "void main(void) { gl_FragColor = vec4(1.); }" },
            { attributes: ["position"] },
            false
        );
        const unbound = MeshBuilder.CreateBox("unbound", {}, scene);
        mesh.material = material;
        unbound.material = material;
        const passId = engine.currentRenderPassId;
        subMesh.setIndirectDrawBuffer(buffer, 20, passId);
        for (let i = 0; i < 10 && !material.isReady(mesh); i++) {
            material.isReady(mesh);
        }
        expect(material.isReady(mesh)).toBe(true);

        mesh.render(subMesh, false);
        unbound.render(unbound.subMeshes[0], false);
        const shared = material._getDrawWrapper().drawContext;
        expect(draws).toHaveLength(2);
        expect(draws[0]).toMatchObject({ context: shared, buffer, byteOffset: 20 });
        expect(draws[1]).toMatchObject({ context: shared, buffer: null, byteOffset: 0 });
    });

    it("reaches the draws of a LinesMesh, which draws through its own _draw and its default material's one draw context", async () => {
        const lines = CreateLines("lines", { points: [Vector3.Zero(), new Vector3(1, 1, 0)] }, scene);
        const material = lines.material!;
        await material.forceCompilationAsync(lines);
        expect(material.isReady(lines)).toBe(true);
        lines.subMeshes[0].setIndirectDrawBuffer(buffer, 20, engine.currentRenderPassId);
        lines.render(lines.subMeshes[0], false);
        expect(draws).toHaveLength(1);
        expect(draws[0]).toMatchObject({ context: material._getDrawWrapper().drawContext, buffer, byteOffset: 20 });
    });
});
