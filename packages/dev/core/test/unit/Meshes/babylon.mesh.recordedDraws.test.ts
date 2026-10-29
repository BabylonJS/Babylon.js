import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene, type SceneOptions } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import "core/Meshes/thinInstanceMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MaterialDefines } from "core/Materials/materialDefines";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type Effect } from "core/Materials/effect";
import { type Mesh } from "core/Meshes/mesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Light } from "core/Lights/light";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";
// the shaders a shadow generator imports when it is created: an import still pending at teardown fails the run
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/depthBoxBlur.fragment";
import "core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";

/**
 * What a draw recorded by a snapshot is checked against before it is encoded again without binding (Mesh._isRecordedDrawUnchanged):
 * everything outside of its per-draw values, which the engine compares (stubbed here: a NullEngine has no leftover uniform buffer).
 */
describe("Mesh recorded draws", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;
    let subMesh: SubMesh;
    let material: StandardMaterial;
    let light: Light;
    let drawWrapper: DrawWrapper;
    let sameValues: boolean;

    // a full draw of the frame: the lights are bound and the draw is kept as recorded
    function fullDraw(): void {
        light._renderId = scene.getRenderId();
        mesh._keepRecordedDraw(drawWrapper, subMesh, material, mesh, true);
    }

    function unchanged(): boolean {
        return mesh._isRecordedDrawUnchanged(drawWrapper, subMesh, material, mesh, true);
    }

    function nextFrame(): void {
        engine.endFrame();
        scene.incrementRenderId();
    }

    // a textured box lit by a hemispheric light, and the draw wrapper of its recorded draw
    function createScene(options?: SceneOptions): void {
        scene = new Scene(engine, options);
        new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        mesh = MeshBuilder.CreateBox("box", {}, scene);
        material = new StandardMaterial("material", scene);
        material.diffuseTexture = RawTexture.CreateRGBATexture(new Uint8Array(4), 1, 1, scene);
        mesh.material = material;
        subMesh = mesh.subMeshes[0];
        drawWrapper = new DrawWrapper(engine);
        drawWrapper.effect = {} as any;
    }

    beforeEach(() => {
        engine = new NullEngine();
        createScene();
        sameValues = true;
        vi.spyOn(engine, "_canKeepRecordedDraw").mockReturnValue(true);
        vi.spyOn(engine, "_hasSameDrawValues").mockImplementation(() => sameValues);
        fullDraw();
    });

    afterEach(() => {
        engine.dispose();
    });

    it("is unchanged when nothing changed", () => {
        expect(unchanged()).toBe(true);
    });

    it("sees the per-draw values the engine compares", () => {
        sameValues = false;
        expect(unchanged()).toBe(false);
    });

    it("needs a full draw of the same material and effect in the frame", () => {
        nextFrame();
        light._renderId = scene.getRenderId();
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
    });

    it("sees a moved mesh and a changed visibility", () => {
        mesh.position.x = 1;
        mesh.computeWorldMatrix(true);
        expect(unchanged()).toBe(false);
        fullDraw();
        mesh.visibility = 0.5;
        expect(unchanged()).toBe(false);
    });

    it("sees a dirty material", () => {
        material.markAsDirty(StandardMaterial.TextureDirtyFlag);
        expect(unchanged()).toBe(false);
    });

    it("is not encoded again through a shader hot swap, and is again once the new effect is drawn in full", () => {
        // the defines as the full draw left them: processed
        const defines = new MaterialDefines();
        defines.markAsProcessed();
        subMesh.materialDefines = defines;
        expect(unchanged()).toBe(true);

        // a frame of hot swapping (StandardMaterial.isReadyForSubMesh): the previous effect draws in full while the new one
        // compiles, and the defines stay unprocessed
        nextFrame();
        defines.markAsUnprocessed();
        fullDraw();
        expect(unchanged()).toBe(false);

        // the new effect compiled: the defines are processed and the sub mesh gets the new effect. Another draw of the material,
        // still on the previous effect, keeps its reference of the frame, which is not the new effect's
        nextFrame();
        light._renderId = scene.getRenderId();
        material._keepRecordedDrawReference(drawWrapper.effect!, new DrawWrapper(engine));
        defines.markAsProcessed();
        drawWrapper.setEffect({} as Effect);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
    });

    it("sees a texture that swaps its GPU texture without dirtying the material", () => {
        // a later frame: another draw of the material binds (the reference of the frame) and the lights are bound
        const reference = new DrawWrapper(engine);
        reference.effect = drawWrapper.effect;
        const laterFrame = () => {
            nextFrame();
            light._renderId = scene.getRenderId();
            material._keepRecordedDrawReference(drawWrapper.effect!, reference);
        };
        laterFrame();
        expect(unchanged()).toBe(true);
        const texture = material.diffuseTexture as RawTexture;
        const other = RawTexture.CreateRGBATexture(new Uint8Array(4), 1, 1, scene);
        expect(texture._texture).not.toBe(other._texture);
        const internal = texture._texture;
        texture._texture = other._texture;
        other._texture = internal;
        laterFrame();
        expect(unchanged()).toBe(false);
    });

    it("sees replaced geometry and a changed index range", () => {
        mesh.setVerticesData(
            VertexBuffer.PositionKind,
            mesh.getVerticesData(VertexBuffer.PositionKind)!.map((v) => v * 2),
            false
        );
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        subMesh.indexCount -= 3;
        expect(unchanged()).toBe(false);
    });

    it("needs its lights bound in the frame", () => {
        scene.incrementRenderId();
        expect(unchanged()).toBe(false);
        light._renderId = scene.getRenderId();
        expect(unchanged()).toBe(true);
    });

    it("is not kept when the engine cannot compare its per-draw values", () => {
        vi.spyOn(engine, "_canKeepRecordedDraw").mockReturnValue(false);
        fullDraw();
        expect(unchanged()).toBe(false);
    });

    it("is not kept in floating origin mode, where a bind writes the world matrix minus the eye", () => {
        createScene({ useFloatingOrigin: true });
        fullDraw();
        expect(unchanged()).toBe(false);
        scene.dispose();
    });

    describe("with a cascaded shadow generator", () => {
        let sun: DirectionalLight;
        let generator: CascadedShadowGenerator;

        // the shadow map computes the cascades when it binds, for the camera rendering at that moment
        const computeCascades = () => generator.getShadowMap()!.onBeforeBindObservable.notifyObservers(generator.getShadowMap()!);

        // a full draw of a WGSL receiver compiled with the sun's cascades buffer: the generator binds the buffer of its camera
        const receiverDraw = () => {
            const index = mesh.lightSources.indexOf(sun);
            const effect = { shaderLanguage: ShaderLanguage.WGSL, _uniformBuffersNames: { ["cascades" + index]: 0 }, setTexture: vi.fn(), bindUniformBuffer: vi.fn() };
            generator.bindShadowLight(index.toString(), effect as unknown as Effect);
            sun._renderId = scene.getRenderId();
            fullDraw();
        };

        // a later frame, where another draw of the material binds (the reference of the frame) and the lights are bound
        const laterFrame = () => {
            nextFrame();
            light._renderId = sun._renderId = scene.getRenderId();
            const reference = new DrawWrapper(engine);
            reference.effect = drawWrapper.effect;
            material._keepRecordedDrawReference(drawWrapper.effect!, reference);
        };

        beforeEach(() => {
            engine._features.supportCSM = true;
            // NullEngine cannot allocate the depth texture of the shadow map, and WGSL receivers only exist with uniform buffers
            vi.spyOn(engine, "_createDepthStencilTexture").mockImplementation(() => new InternalTexture(engine, InternalTextureSource.DepthStencil));
            vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(true);
            sun = new DirectionalLight("sun", new Vector3(0, -1, 0), scene);
            generator = new CascadedShadowGenerator(1024, sun);
            receiverDraw();
        });

        it("binds again when its receivers get the cascades buffer of another camera", () => {
            laterFrame();
            expect(unchanged()).toBe(true);
            scene.activeCamera = new FreeCamera("second", new Vector3(20, 5, -10), scene);
            laterFrame();
            computeCascades();
            expect(unchanged()).toBe(false);
            receiverDraw();
            expect(unchanged()).toBe(true);
        });
    });

    describe("with thin instances", () => {
        const matrices = (count: number) => {
            const data = new Float32Array(16 * count);
            for (let i = 0; i < count; i++) {
                Matrix.Translation(i * 2, 0, 0).copyToArray(data, i * 16);
            }
            return data;
        };

        beforeEach(() => {
            mesh.thinInstanceSetBuffer("matrix", matrices(10), 16, false);
            fullDraw();
        });

        it("follows matrices changed in the same buffer", () => {
            mesh._thinInstanceDataStorage.matrixData![13] = 5;
            mesh.thinInstanceBufferUpdated("matrix");
            expect(unchanged()).toBe(true);
        });

        it("sees a changed instance count", () => {
            mesh.thinInstanceCount = 5;
            expect(unchanged()).toBe(false);
        });

        it("sees a new instance buffer", () => {
            mesh.thinInstanceSetBuffer("matrix", matrices(20), 16, false);
            expect(unchanged()).toBe(false);
            fullDraw();
            expect(unchanged()).toBe(true);
        });

        it("is not recorded when its previous matrices are written from the current ones after each draw", () => {
            expect(mesh._canRecordThinInstances()).toBe(true);
            scene.needsPreviousWorldMatrices = true;
            expect(mesh._canRecordThinInstances()).toBe(false);
            mesh.thinInstanceSetBuffer("previousMatrix", matrices(10), 16, false);
            expect(mesh._canRecordThinInstances()).toBe(true);
        });
    });
});
