import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene, type SceneOptions } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import "core/Meshes/thinInstanceMesh";
import "core/Meshes/instancedMesh";
import { VertexBuffer } from "core/Buffers/buffer";
// the alignment of vertex buffers to 4 bytes, which WebGPU uses (effectiveBuffer, effectiveByteOffset, effectiveByteStride)
import "core/Buffers/buffer.align";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MaterialDefines } from "core/Materials/materialDefines";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { type Material } from "core/Materials/material";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type AbstractEngine } from "core/Engines/abstractEngine";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { type Effect } from "core/Materials/effect";
import { type Mesh } from "core/Meshes/mesh";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Light } from "core/Lights/light";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphGeometryRendererTask } from "core/FrameGraph/Tasks/Rendering/geometryRendererTask";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";

import "core/Engines/AbstractEngine/abstractEngine.alpha";
import "core/Engines/Extensions/engine.multiRender";
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

    // a full draw of the frame: the engine's states kept before the bind, the lights bound and the draw kept as recorded
    function fullDraw(): void {
        engine._keepInheritedState(drawWrapper);
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

    it("needs that full draw in its own pass and view, whose scene uniform buffer it binds, without any domain", () => {
        expect(unchanged()).toBe(true);
        // another render target with the same material and effect: its object renderer binds its own scene uniform buffer, whose
        // values (its camera's) the full draw of the first one did not bind. Its draw needs a full draw of its own in the frame
        const firstView = scene.getSceneUniformBuffer();
        scene.setSceneUniformBuffer(scene.createSceneUniformBuffer("second render target"));
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        // and the first render target, rendered again (another camera order, say), needs one again too
        scene.setSceneUniformBuffer(firstView);
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

    it("sees a texture that swaps its GPU texture without dirtying the material, even between two passes of a frame", () => {
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
        expect(unchanged()).toBe(false);
        // a texture set in the frame is listed at once
        material.diffuseTexture = other;
        fullDraw();
        expect(unchanged()).toBe(true);
        other._texture = texture._texture;
        expect(unchanged()).toBe(false);
    });

    it("sees the sampler of a texture of the material, which a bind sets and whose changes do not dirty the material", () => {
        const texture = material.diffuseTexture!;
        const internal = texture.getInternalTexture()!;
        const changes: Array<() => () => void> = [
            () => {
                const wrapU = texture.wrapU;
                texture.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
                return () => (texture.wrapU = wrapU);
            },
            () => {
                const wrapV = texture.wrapV;
                texture.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
                return () => (texture.wrapV = wrapV);
            },
            () => {
                const wrapR = texture.wrapR;
                texture.wrapR = Constants.TEXTURE_MIRROR_ADDRESSMODE;
                return () => (texture.wrapR = wrapR);
            },
            () => {
                const level = texture.anisotropicFilteringLevel;
                texture.anisotropicFilteringLevel = level + 4;
                return () => (texture.anisotropicFilteringLevel = level);
            },
            // the filtering of its GPU texture, as updateSamplingMode sets it
            () => {
                const samplingMode = internal.samplingMode;
                internal.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
                return () => (internal.samplingMode = samplingMode);
            },
        ];
        for (const change of changes) {
            fullDraw();
            expect(unchanged()).toBe(true);
            const restore = change();
            expect(unchanged()).toBe(false);
            restore();
        }
    });

    it("sees a texture a shader material sets or removes in the frame, which only changes its dictionary of textures", () => {
        const shaderMaterial = new ShaderMaterial("shader", scene, "default", { shaderLanguage: ShaderLanguage.WGSL });
        const texture = RawTexture.CreateRGBATexture(new Uint8Array(4), 1, 1, scene);
        shaderMaterial.setTexture("diffuseSampler", texture);
        mesh.material = shaderMaterial;
        const shaderFullDraw = () => {
            engine._keepInheritedState(drawWrapper);
            light._renderId = scene.getRenderId();
            mesh._keepRecordedDraw(drawWrapper, subMesh, shaderMaterial, mesh, true);
        };
        const shaderUnchanged = () => mesh._isRecordedDrawUnchanged(drawWrapper, subMesh, shaderMaterial, mesh, true);
        // the full draw of the frame lists the material's textures
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);

        // replaced in the same frame: the draw binds the material again
        const other = RawTexture.CreateRGBATexture(new Uint8Array(4), 1, 1, scene);
        shaderMaterial.setTexture("diffuseSampler", other);
        expect(shaderUnchanged()).toBe(false);
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);
        // set again with the texture it has: nothing changed
        shaderMaterial.setTexture("diffuseSampler", other);
        expect(shaderUnchanged()).toBe(true);
        shaderMaterial.removeTexture("diffuseSampler");
        expect(shaderUnchanged()).toBe(false);
    });

    it("sees a value or a define a shader material sets in the frame, after the full draw it is compared with", () => {
        const shaderMaterial = new ShaderMaterial("shader", scene, "default", { shaderLanguage: ShaderLanguage.WGSL });
        shaderMaterial.setFloat("value", 1);
        mesh.material = shaderMaterial;
        const shaderFullDraw = () => {
            engine._keepInheritedState(drawWrapper);
            light._renderId = scene.getRenderId();
            mesh._keepRecordedDraw(drawWrapper, subMesh, shaderMaterial, mesh, true);
        };
        const shaderUnchanged = () => mesh._isRecordedDrawUnchanged(drawWrapper, subMesh, shaderMaterial, mesh, true);
        // the frame's full draw of the material, whose values the draw's equal
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);

        // a callback of another draw of the frame sets the value again: the draw's values are compared with a full draw that bound the
        // old one, so it binds the material again
        shaderMaterial.setFloat("value", 2);
        expect(shaderUnchanged()).toBe(false);
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);
        shaderMaterial.setDefine("VALUE", true);
        expect(shaderUnchanged()).toBe(false);
    });

    it("needs a full draw after a draw of its material that is not recorded, whose observer can change the material", () => {
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        // the full draws stop at once: their effects are not built here
        vi.spyOn(material, "isReadyForSubMesh").mockReturnValue(false);
        expect(unchanged()).toBe(true);
        // another mesh of the material, whose render observer changes a value of the material without dirtying it: it is not recorded
        const observed = mesh.clone("observed")!;
        observed.onBeforeRenderObservable.add(() => material.diffuseColor.set(1, 0, 0));
        observed.render(observed.subMeshes[0], false);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
    });

    it("sees the step mode of a vertex buffer, which instanceDivisor changes in its hash code and the pipeline's vertex layout only", () => {
        const vertexBuffer = mesh.getVertexBuffer(VertexBuffer.NormalKind)!;
        fullDraw();
        expect(unchanged()).toBe(true);
        // the same wrapper, buffer, offset and stride
        vertexBuffer.instanceDivisor = 1;
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        vertexBuffer.instanceDivisor = 0;
        expect(unchanged()).toBe(false);
    });

    it("sees an update that creates again the GPU buffer of a vertex buffer aligned to 4 bytes, not a content update of a GPU buffer kept", () => {
        // as WebGPU does: a vertex buffer whose stride or offset is not a multiple of 4 bytes binds an aligned copy of its data
        engine._features.forceVertexBufferStrideAndOffsetMultiple4Bytes = true;
        const vertices = mesh.getTotalVertices();
        const colors = new VertexBuffer(engine, new Uint8Array(3 * vertices), "colors3", {
            updatable: true,
            stride: 3,
            size: 3,
            type: VertexBuffer.UNSIGNED_BYTE,
            normalized: true,
            useBytes: true,
        });
        const weights = new VertexBuffer(engine, new Float32Array(vertices), "weights", { updatable: true, size: 1 });
        mesh.setVerticesBuffer(colors);
        mesh.setVerticesBuffer(weights);
        fullDraw();
        expect(unchanged()).toBe(true);

        // a three-byte stride: the update creates the aligned copy again, a new GPU buffer the recorded commands do not bind
        const aligned = colors.effectiveBuffer;
        colors.update(new Uint8Array(3 * vertices));
        expect(colors.effectiveBuffer).not.toBe(aligned);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);

        // a stride of 4 bytes: the update writes the same GPU buffer, which the recorded commands bind
        const kept = weights.effectiveBuffer;
        weights.update(new Float32Array(vertices));
        expect(weights.effectiveBuffer).toBe(kept);
        expect(unchanged()).toBe(true);
    });

    it("sees the instance count the draw uses, which overridenInstanceCount sets for a mesh with instanced buffers on its geometry", () => {
        mesh.overridenInstanceCount = 8;
        fullDraw();
        expect(unchanged()).toBe(true);
        mesh.overridenInstanceCount = 3;
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
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

    it("sees a mesh switched to unindexed, which only dirties the defines of its sub meshes, which a shader material does not have", () => {
        const shaderMaterial = new ShaderMaterial("shader", scene, "default", { shaderLanguage: ShaderLanguage.WGSL });
        mesh.material = shaderMaterial;
        const shaderFullDraw = () => {
            engine._keepInheritedState(drawWrapper);
            light._renderId = scene.getRenderId();
            mesh._keepRecordedDraw(drawWrapper, subMesh, shaderMaterial, mesh, true);
        };
        const shaderUnchanged = () => mesh._isRecordedDrawUnchanged(drawWrapper, subMesh, shaderMaterial, mesh, true);
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);
        // the same index buffer stays on the geometry: the draw it records is not indexed
        mesh.isUnIndexed = true;
        expect(subMesh.materialDefines).toBeFalsy();
        expect(shaderUnchanged()).toBe(false);
        shaderFullDraw();
        expect(shaderUnchanged()).toBe(true);
        mesh.isUnIndexed = false;
        expect(shaderUnchanged()).toBe(false);
    });

    it("sees a changed vertex range, which unindexed and point draws use", () => {
        subMesh.verticesCount -= 1;
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        subMesh.verticesStart += 1;
        expect(unchanged()).toBe(false);
    });

    it("sees the pipeline state its material sets from plain fields, which do not mark it dirty", () => {
        const changes = [
            () => (material.disableDepthWrite = true),
            () => (material.disableColorWrite = true),
            () => (material.forceDepthWrite = true),
            () => (material.depthFunction = Constants.LEQUAL),
            () => (material.zOffset = 1),
            () => (material.zOffsetUnits = 1),
        ];
        for (const change of changes) {
            change();
            expect(unchanged()).toBe(false);
            fullDraw();
            expect(unchanged()).toBe(true);
        }
    });

    it("sees the engine's color writes, which the depth prepass turns off for the same draw wrapper", () => {
        engine.setColorWrite(false);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        engine.setColorWrite(true);
        expect(unchanged()).toBe(false);
    });

    it("sees the states it inherits from the engine without setting them: depth, the stencil of both faces and the blend", () => {
        const changes: Array<[() => void, () => void]> = [
            [() => engine.setDepthWrite(false), () => engine.setDepthWrite(true)],
            [() => engine.setDepthBuffer(false), () => engine.setDepthBuffer(true)],
            [() => engine.setDepthFunction(Constants.ALWAYS), () => engine.setDepthFunction(Constants.LEQUAL)],
            [() => engine.setStencilBuffer(true), () => engine.setStencilBuffer(false)],
            [() => engine.setStencilFunction(Constants.EQUAL), () => engine.setStencilFunction(Constants.ALWAYS)],
            [() => engine.setStencilFunctionReference(2), () => engine.setStencilFunctionReference(1)],
            [() => engine.setStencilMask(0x0f), () => engine.setStencilMask(0xff)],
            [() => engine.setStencilBackFunction(Constants.EQUAL), () => engine.setStencilBackFunction(Constants.ALWAYS)],
            [() => engine.setStencilBackOperationPass(Constants.REPLACE), () => engine.setStencilBackOperationPass(Constants.KEEP)],
            [() => engine.setAlphaMode(Constants.ALPHA_ADD, true), () => engine.setAlphaMode(Constants.ALPHA_DISABLE, true)],
        ];
        for (const [change, restore] of changes) {
            restore();
            fullDraw();
            expect(unchanged()).toBe(true);
            change();
            expect(unchanged()).toBe(false);
            restore();
        }
    });

    it("sees the blend equations it inherits, which the alpha mode does not tell (ALPHA_ONEONE_ONEONE under MAX and ADD)", () => {
        engine.setAlphaMode(Constants.ALPHA_ONEONE_ONEONE, true);
        engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
        fullDraw();
        expect(unchanged()).toBe(true);
        engine.setAlphaEquation(Constants.ALPHA_EQUATION_ADD);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        // an alpha mode that changes resets the equations of the alpha state (AlphaState.setAlphaMode) without the engine's last
        // setAlphaEquation: the pipeline reads the alpha state
        engine.setAlphaEquation(Constants.ALPHA_EQUATION_MAX);
        fullDraw();
        engine._alphaState.setAlphaMode(Constants.ALPHA_ONEONE_ONEONE, 0);
        expect(engine.getAlphaEquation()).toBe(Constants.ALPHA_EQUATION_MAX);
        expect(unchanged()).toBe(false);
    });

    it("sees the blend it inherits for each target, not only the first one (multiple render targets)", () => {
        engine._alphaState.setAlphaBlend(true, 1);
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        engine._alphaState.setAlphaMode(Constants.ALPHA_ADD, 1);
        expect(unchanged()).toBe(false);
    });

    it("sees the effective side orientation, from the material or from the mesh, which do not mark the material dirty", () => {
        const opposite = (orientation: number) =>
            orientation === Constants.MATERIAL_CounterClockWiseSideOrientation ? Constants.MATERIAL_ClockWiseSideOrientation : Constants.MATERIAL_CounterClockWiseSideOrientation;
        material.sideOrientation = opposite(material._getEffectiveOrientation(mesh));
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        material.sideOrientation = null;
        fullDraw();
        expect(unchanged()).toBe(true);
        mesh.sideOrientation = opposite(mesh.sideOrientation);
        expect(unchanged()).toBe(false);
    });

    it("sees the culling the geometry rendering of its pass reverses, which the task's setter only changes in the pass's configuration", () => {
        // the task's depth peeling renderer builds texture layouts, which a NullEngine does not
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const task = new FrameGraphGeometryRendererTask("geometry", new FrameGraph(scene), scene);
        const renderPassId = task.objectRenderer.renderPassId;
        // the configuration of the pass, as the task records it (FrameGraphGeometryRendererTask.record)
        MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        const mainPassId = engine.currentRenderPassId;
        engine.currentRenderPassId = renderPassId;
        try {
            fullDraw();
            expect(unchanged()).toBe(true);
            task.reverseCulling = true;
            expect(unchanged()).toBe(false);
            fullDraw();
            expect(unchanged()).toBe(true);
            task.reverseCulling = false;
            expect(unchanged()).toBe(false);
        } finally {
            engine.currentRenderPassId = mainPassId;
            MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        }
    });

    it("sees the per-mesh values the geometry rendering of its pass writes, which their setters and providers do not invalidate", () => {
        // a pass with object ID and mesh-blending tag textures, as the task records them (FrameGraphGeometryRendererTask.record)
        const renderPassId = engine.createRenderPassId("geometry");
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        configuration.defines["PREPASS_MESH_BLEND_TAG_INDEX"] = 0;
        configuration.defines["PREPASS_OBJECT_ID_INDEX"] = 1;
        let objectId = 1;
        configuration.objectIdProvider = () => objectId;
        const mainPassId = engine.currentRenderPassId;
        engine.currentRenderPassId = renderPassId;
        // two meshes of one material with the same values: the first one's full draw is the frame's reference for the other one
        const other = mesh.clone("other")!;
        const otherSubMesh = other.subMeshes[0];
        const otherDrawWrapper = new DrawWrapper(engine);
        otherDrawWrapper.effect = drawWrapper.effect;
        const draw = (target: Mesh, targetSubMesh: SubMesh, wrapper: DrawWrapper) => {
            engine._keepInheritedState(wrapper);
            light._renderId = scene.getRenderId();
            target._keepRecordedDraw(wrapper, targetSubMesh, material, target, true);
        };
        const otherUnchanged = () => other._isRecordedDrawUnchanged(otherDrawWrapper, otherSubMesh, material, other, true);
        try {
            draw(mesh, subMesh, drawWrapper);
            draw(other, otherSubMesh, otherDrawWrapper);
            nextFrame();
            draw(mesh, subMesh, drawWrapper);
            expect(otherUnchanged()).toBe(true);
            other.meshBlendingTag = 1;
            expect(otherUnchanged()).toBe(false);
            draw(other, otherSubMesh, otherDrawWrapper);
            expect(otherUnchanged()).toBe(true);
            objectId = 2;
            expect(otherUnchanged()).toBe(false);
        } finally {
            engine.currentRenderPassId = mainPassId;
            MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        }
    });

    it("sees the effective fill mode, which a mesh's overrideRenderingFillMode sets without invalidating anything (a wireframe draws lines)", () => {
        mesh.overrideRenderingFillMode = Constants.MATERIAL_WireFrameFillMode;
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        mesh.overrideRenderingFillMode = null;
        expect(unchanged()).toBe(false);
    });

    it("sees the culled faces the engine forces over the material's (cullBackFaces), which the culling of a full draw follows", () => {
        engine.cullBackFaces = false;
        expect(unchanged()).toBe(false);
        fullDraw();
        expect(unchanged()).toBe(true);
        engine.cullBackFaces = null;
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

    describe("with the shared uniform buffers tracked in the frame, as in WebGPU", () => {
        // another draw of the material, the frame's reference when it is kept
        let other: DrawWrapper;
        const effect = { bindUniformBuffer: vi.fn() } as unknown as Effect;

        // a pass of the frame: its first full draw binds the light (written again for each pass, in a new buffer if its values changed
        // since a draw bound it in the frame)
        const pass = () => {
            scene.incrementRenderId();
            light._bindLight(0, scene, effect, false);
        };
        const keep = (wrapper: DrawWrapper) => {
            engine._keepInheritedState(wrapper);
            mesh._keepRecordedDraw(wrapper, subMesh, material, mesh, true);
        };

        beforeEach(() => {
            vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(true);
            engine._features.trackUbosInFrame = true;
            createScene();
            other = new DrawWrapper(engine);
            other.effect = drawWrapper.effect;
            // a frame of two passes with the same light: the draw of the second one is kept with the light's first buffer
            engine.endFrame();
            pass();
            keep(other);
            pass();
            keep(drawWrapper);
            // the next frame: the first pass keeps the frame's reference, and the draw is checked in the second pass
            engine.endFrame();
            pass();
            keep(other);
        });

        it("is encoded again in a later pass of the frame while its light stays on its first buffer", () => {
            pass();
            expect(light._uniformBuffer._isFirstBufferBound()).toBe(true);
            expect(unchanged()).toBe(true);
        });

        it("is not encoded again in a later pass of the frame that wrote its light again, whose full draws bind the new buffer", () => {
            light.intensity = 0.5;
            pass();
            expect(light._uniformBuffer._isFirstBufferBound()).toBe(false);
            expect(unchanged()).toBe(false);
            // a full draw there is not kept, and is not the frame's reference for the draws after it
            keep(other);
            expect(other._recordedMaterial).toBeNull();
            expect(material._getRecordedDrawReference(drawWrapper.effect!)).toBeNull();
        });

        it("is not encoded again for a camera whose view moved off the first buffer when the order of two cameras of a pass changes", () => {
            // a camera of the pass: its view is written to the scene's uniform buffer, in a new buffer if another camera used it
            const cameraA = Matrix.Translation(1, 0, 0);
            const cameraB = Matrix.Translation(-1, 0, 0);
            const view = (matrix: Matrix) => {
                scene.setTransformMatrix(matrix, Matrix.Identity());
                scene.finalizeSceneUbo();
            };
            const frame = (first: Matrix) => {
                engine.endFrame();
                pass();
                view(first);
            };
            // cameras A then B: A's draw is recorded with A's view on the first buffer
            frame(cameraA);
            keep(drawWrapper);
            expect(drawWrapper._recordedMaterial).toBe(material);
            view(cameraB);
            expect(scene.getSceneUniformBuffer()._isFirstBufferBound()).toBe(false);
            // the same order again: A's view is on the first buffer, and its draw is encoded again
            frame(cameraA);
            keep(other);
            expect(unchanged()).toBe(true);
            // B then A: B's view takes the first buffer, which A's recorded commands bind, and A's draw is not encoded again
            frame(cameraB);
            keep(other);
            view(cameraA);
            expect(scene.getSceneUniformBuffer()._isFirstBufferBound()).toBe(false);
            expect(unchanged()).toBe(false);
        });

        it("is not encoded again in a later pass of the frame that wrote the scene's uniform buffer again", () => {
            pass();
            // the scene's uniform buffer, used in the frame, gets another view
            scene.finalizeSceneUbo();
            scene.setTransformMatrix(Matrix.Translation(1, 0, 0), Matrix.Identity());
            expect(scene.getSceneUniformBuffer()._isFirstBufferBound()).toBe(false);
            expect(unchanged()).toBe(false);
        });
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

        it("shares the frame's reference between the cascades of its shadow map, each cascade drawing with its own matrix, while its bias stays", () => {
            vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
            // two cascades with different matrices (their frustum split is not what this checks): the generator writes each one in the
            // scene uniform buffer of its cascade when the cascade renders
            vi.spyOn(generator, "getCascadeViewMatrix").mockImplementation((layer) => Matrix.Translation(layer + 1, 2 * layer, 0));
            vi.spyOn(generator, "getCascadeProjectionMatrix").mockImplementation(() => Matrix.Identity());
            vi.spyOn(generator, "getCascadeTransformMatrix").mockImplementation((layer) => Matrix.Translation(layer + 1, 2 * layer, 0));
            // the full draws go through with an effect that takes any value and buffer: the depth effect is not built here
            vi.spyOn(generator, "isReady").mockReturnValue(true);
            const members: Record<string, unknown> = { getEngine: () => engine };
            const effect = new Proxy(members, {
                get: (target, key) => (typeof key === "string" && /^(set|bind)/.test(key) ? (target[key] ??= vi.fn()) : target[key as string]),
            }) as unknown as Effect;
            // two casters of the same material and effect, with a draw wrapper for each cascade: each cascade has its own pass
            const shadowMap = generator.getShadowMap()!;
            const passes = shadowMap.renderPassIds;
            const casters = [subMesh, mesh.clone("second")!.subMeshes[0]];
            for (const caster of casters) {
                for (const pass of passes) {
                    caster._getDrawWrapper(pass, true)!.effect = effect;
                }
            }
            // a draw encoded again binds the scene uniform buffer its cascade bound when it was recorded: the view of the cascade, whose
            // matrix the generator wrote there
            const replays: string[] = [];
            vi.spyOn(engine, "_replayRecordedDraw").mockImplementation((wrapper) => {
                const layer = passes.indexOf(engine.currentRenderPassId);
                const caster = casters.findIndex((candidate) => candidate._getDrawWrapper(passes[layer]) === wrapper);
                const view = scene.getSceneUniformBuffer() as any;
                const ownView = view === (generator as any)._sceneUBOs[layer];
                const offset = view._uniformLocations["viewProjection"];
                const written = Matrix.FromArray(Array.from(view._bufferData.subarray(offset, offset + 16)));
                const ownMatrix = written.equals(generator.getCascadeTransformMatrix(layer)!);
                replays.push(`caster ${caster} in cascade ${layer}${ownView && ownMatrix ? "" : " with another view"}`);
                return true;
            });
            // a cascade as the shadow map renders it: its pass, the generator's setup of the cascade (its scene uniform buffer, written
            // with its matrices), then the casters
            const frame = () => {
                nextFrame();
                computeCascades();
                for (const layer of [0, 1]) {
                    // as the render target renders each layer: a fresh render id, so that the pass draws each sub mesh once
                    scene.incrementRenderId();
                    engine.currentRenderPassId = passes[layer];
                    shadowMap.onBeforeRenderObservable.notifyObservers(layer);
                    for (const caster of casters) {
                        (generator as any)._renderSubMeshForShadowMap(caster, false);
                    }
                }
            };
            frame();
            expect(replays).toEqual([]);
            expect(generator.getCascadeTransformMatrix(0)!.equalsWithEpsilon(generator.getCascadeTransformMatrix(1)!)).toBe(false);

            // the first caster's draw in the first cascade is the frame's reference of the generator, for both cascades
            frame();
            expect(replays).toEqual(["caster 1 in cascade 0", "caster 0 in cascade 1", "caster 1 in cascade 1"]);

            // the bias changed for the second cascade only (by an observer of the shadow map), which the generator writes in each draw:
            // that cascade needs a full draw of its own
            shadowMap.onBeforeRenderObservable.add((layer) => (generator.bias = layer === 1 ? 0.001 : 0.00005));
            replays.length = 0;
            frame();
            expect(replays).toEqual(["caster 1 in cascade 0", "caster 1 in cascade 1"]);
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

    describe("what a draw needs around it to be encoded again without rendering the mesh", () => {
        function recorded() {
            return (mesh as any)._canRecordDraw(subMesh, mesh._getInstancesRenderList(subMesh._id)) ? (mesh as any)._getUnchangedRecordedDraw(subMesh) : null;
        }

        beforeEach(() => {
            vi.spyOn(material, "_canReplayRecordedDraw").mockReturnValue(true);
            vi.spyOn(mesh, "_isRecordedDrawUnchanged").mockReturnValue(true);
        });

        it("encodes again an unchanged draw nothing runs around", () => {
            expect(recorded()).toBe(subMesh._drawWrapper);
        });

        it("renders a mesh with an outline or an overlay, which the outline renderer draws around its full draw", () => {
            mesh.renderOutline = true;
            expect(recorded()).toBeNull();
            mesh.renderOutline = false;
            mesh.renderOverlay = true;
            expect(recorded()).toBeNull();
        });

        it("encodes the draw between the scene's steps before and after rendering a mesh, as a full draw", () => {
            vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
            vi.spyOn(engine, "_canEncodeRecordedDraw").mockReturnValue(true);
            const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
            const component = { name: "steps" } as any;
            const before = vi.fn();
            const after = vi.fn();
            scene._beforeRenderingMeshStage.registerStep(0, component, before);
            scene._afterRenderingMeshStage.registerStep(0, component, after);

            mesh.render(subMesh, false);
            expect(replay).toHaveBeenCalledTimes(1);
            expect(before).toHaveBeenCalledTimes(1);
            expect(after).toHaveBeenCalledTimes(1);
            expect(before.mock.invocationCallOrder[0]).toBeLessThan(replay.mock.invocationCallOrder[0]);
            expect(after.mock.invocationCallOrder[0]).toBeGreaterThan(replay.mock.invocationCallOrder[0]);
        });

        it("marks the buffer of the mesh's uniform buffer as used in the frame when it encodes the draw, as a full draw's update does", () => {
            vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
            vi.spyOn(engine, "_canEncodeRecordedDraw").mockReturnValue(true);
            const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
            const mark = vi.spyOn(mesh._uniformBuffer, "_markBufferUsed");
            mesh.render(subMesh, false);
            expect(replay).toHaveBeenCalledTimes(1);
            expect(mark).toHaveBeenCalledTimes(1);
            expect(mark.mock.invocationCallOrder[0]).toBeGreaterThan(replay.mock.invocationCallOrder[0]);
        });

        it("renders a mesh with draw observers", () => {
            mesh.onBeforeDrawObservable.add(() => {});
            expect(recorded()).toBeNull();
        });

        it("reads an undefined occlusionType (without the occlusion queries module) as no occlusion query", () => {
            Object.defineProperty(mesh, "occlusionType", { value: undefined, configurable: true, writable: true });
            expect(recorded()).toBe(subMesh._drawWrapper);
            mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
            expect(recorded()).toBeNull();
        });
    });

    it("is not encoded again in a shadow map for a mesh with draw observers, which a full draw notifies there too", () => {
        const generator = new ShadowGenerator(256, new DirectionalLight("sun", new Vector3(0, -1, 0), scene));
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        vi.spyOn(subMesh, "_getDrawWrapper").mockReturnValue(drawWrapper);
        vi.spyOn(mesh, "_isRecordedDrawUnchanged").mockReturnValue(true);
        const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
        // the full path stops at once: its depth effect is not built here
        vi.spyOn(generator, "isReady").mockReturnValue(false);

        const mark = vi.spyOn(mesh._uniformBuffer, "_markBufferUsed");

        // a new frame for each draw: a sub mesh is drawn once per frame in a shadow map
        scene.incrementRenderId();
        (generator as any)._renderSubMeshForShadowMap(subMesh, false);
        expect(replay).toHaveBeenCalledTimes(1);
        // the draw encoded again marks the buffer of the mesh's uniform buffer as used in the frame, as a full draw's update does
        expect(mark).toHaveBeenCalledTimes(1);
        mesh.onBeforeDrawObservable.add(() => {});
        scene.incrementRenderId();
        (generator as any)._renderSubMeshForShadowMap(subMesh, false);
        expect(replay).toHaveBeenCalledTimes(1);
    });

    it("is not encoded again in a shadow map for an instance drawn as a regular mesh (mirrored), whose full draw binds its source's buffer", () => {
        const generator = new ShadowGenerator(256, new DirectionalLight("sun", new Vector3(0, -1, 0), scene));
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        const instance = mesh.createInstance("mirrored");
        instance.scaling.x = -1;
        // as InstancedMesh._activate sets it for an instance whose determinant has another sign than its source's
        instance._internalAbstractMeshDataInfo._actAsRegularMesh = true;
        const instanceSubMesh = instance.subMeshes[0];
        expect(instanceSubMesh.getEffectiveMesh()).toBe(instance);
        expect(instanceSubMesh.getRenderingMesh()).toBe(mesh);
        for (const caster of [subMesh, instanceSubMesh]) {
            vi.spyOn(caster, "_getDrawWrapper").mockReturnValue(drawWrapper);
        }
        vi.spyOn(mesh, "_isRecordedDrawUnchanged").mockReturnValue(true);
        const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
        // the full path stops at once: its depth effect is not built here
        vi.spyOn(generator, "isReady").mockReturnValue(false);

        scene.incrementRenderId();
        (generator as any)._renderSubMeshForShadowMap(subMesh, false);
        expect(replay).toHaveBeenCalledTimes(1);
        scene.incrementRenderId();
        (generator as any)._renderSubMeshForShadowMap(instanceSubMesh, false);
        expect(replay).toHaveBeenCalledTimes(1);
    });

    it("never encodes again without binding a material that forces the depth writes, which a full draw leaves on", () => {
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        material.forceDepthWrite = true;
        expect(material._canReplayRecordedDraw()).toBe(false);
    });

    it("never encodes again without binding a WGSL shader material with custom buffers or textures, whose setters only change dictionaries", () => {
        const shaderMaterial = new ShaderMaterial("shader", scene, "default", { shaderLanguage: ShaderLanguage.WGSL });
        // what a WebGPU engine sets when it creates the material's uniform buffer
        (shaderMaterial as any)._shaderLanguage = ShaderLanguage.WGSL;
        expect(shaderMaterial._canReplayRecordedDraw()).toBe(true);
        shaderMaterial.setUniformBuffer("custom", new UniformBuffer(engine));
        expect(shaderMaterial._canReplayRecordedDraw()).toBe(false);
        const withStorage = new ShaderMaterial("storage", scene, "default", { shaderLanguage: ShaderLanguage.WGSL });
        (withStorage as any)._shaderLanguage = ShaderLanguage.WGSL;
        withStorage.setStorageBuffer("custom", {} as any);
        expect(withStorage._canReplayRecordedDraw()).toBe(false);
    });

    it("compares a shadow map draw only to the frame's reference of its own shadow generator", () => {
        // two generators with the same caster material and effect: only the second one's bias changed
        const first = {};
        const second = {};
        const other = new DrawWrapper(engine);
        other.effect = drawWrapper.effect;
        engine._keepInheritedState(other);
        mesh._keepRecordedDraw(other, subMesh, material, mesh, false, second);
        nextFrame();
        engine._keepInheritedState(drawWrapper);
        mesh._keepRecordedDraw(drawWrapper, subMesh, material, mesh, false, first);
        // the first generator's full draw is the frame's reference: the second one's draw is bound again
        expect(mesh._isRecordedDrawUnchanged(other, subMesh, material, mesh, false, second)).toBe(false);
        expect(mesh._isRecordedDrawUnchanged(drawWrapper, subMesh, material, mesh, false, first)).toBe(true);
    });

    it("never encodes again without binding a material with unbind observers", () => {
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        expect(material._canReplayRecordedDraw()).toBe(true);
        material.onUnBindObservable.add(() => {});
        expect(material._canReplayRecordedDraw()).toBe(false);
    });

    it("never encodes again without binding a material with an active plugin that binds values of the mesh, as a user plugin may, but does with the built-in PBR plugins", () => {
        // a user plugin that binds a value of the mesh of the sub mesh (its metadata)
        class MetadataPlugin extends MaterialPluginBase {
            public constructor(material: Material) {
                super(material, "Metadata", 200, {}, true, true);
            }
            public override bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, sub: SubMesh): void {
                uniformBuffer.updateFloat("metadataValue", sub.getMesh().metadata?.value ?? 0);
            }
            public override getClassName(): string {
                return "MetadataPlugin";
            }
            public override isCompatible(): boolean {
                return true;
            }
        }
        const pbr = new PBRMaterial("pbr", scene);
        (pbr as any)._shaderLanguage = ShaderLanguage.WGSL;
        pbr.clearCoat.isEnabled = true;
        pbr.sheen.isEnabled = true;
        pbr.iridescence.isEnabled = true;
        pbr.anisotropy.isEnabled = true;
        pbr.detailMap.isEnabled = true;
        expect(pbr._canReplayRecordedDraw()).toBe(true);
        new MetadataPlugin(pbr);
        expect(pbr._canReplayRecordedDraw()).toBe(false);

        // A and B share the material, with the same values until only B's metadata changes: B's draw, whose recorded values still
        // equal those of A's full draw (the plugin does not run when a draw is encoded again), is bound
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        vi.spyOn(engine, "_canEncodeRecordedDraw").mockReturnValue(true);
        const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
        // the full draws stop at once: their effects are not built here
        vi.spyOn(pbr, "isReadyForSubMesh").mockReturnValue(false);
        const a = mesh;
        const b = mesh.clone("B")!;
        a.metadata = { value: 1 };
        b.metadata = { value: 1 };
        for (const drawn of [a, b]) {
            drawn.material = pbr;
            vi.spyOn(drawn, "_isRecordedDrawUnchanged").mockReturnValue(true);
        }
        b.metadata.value = 2;
        a.render(a.subMeshes[0], false);
        b.render(b.subMeshes[0], false);
        expect(replay).not.toHaveBeenCalled();
    });

    it("checks nothing in Mesh.render unless a snapshot records with the recorded draws switched on", () => {
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        const check = vi.spyOn(mesh as any, "_getUnchangedRecordedDraw");
        // snapshot rendering with the recorded draws off: a recording costs what it did before them
        vi.spyOn(engine, "snapshotRendering", "get").mockReturnValue(true);
        mesh.render(subMesh, false);
        expect(check).not.toHaveBeenCalled();
        // with them on, the draw is checked first
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        mesh.render(subMesh, false);
        expect(check).toHaveBeenCalledTimes(1);
    });

    it("never encodes again without binding a material the depth prepass draws with another effect through the same draw wrapper", () => {
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        material.needDepthPrePass = true;
        expect(material._canReplayRecordedDraw()).toBe(false);
    });

    it("neither checks nor keeps in Mesh.render a draw whose material cannot be encoded again, and drops what was recorded for it", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        const check = vi.spyOn(mesh as any, "_getUnchangedRecordedDraw");
        const keep = vi.spyOn(mesh, "_keepRecordedDraw");
        const keepState = vi.spyOn(engine, "_keepInheritedState");
        subMesh._drawWrapper._recordedMaterial = material;
        // a GLSL material is never encoded again
        mesh.render(subMesh, false);
        expect(check).not.toHaveBeenCalled();
        expect(keep).not.toHaveBeenCalled();
        expect(keepState).not.toHaveBeenCalled();
        expect(subMesh._drawWrapper._recordedMaterial).toBeNull();
    });

    it("neither checks nor keeps in Mesh.render a draw that writes velocity, whose bind keeps the previous world matrix of its mesh", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        const check = vi.spyOn(mesh as any, "_getUnchangedRecordedDraw");
        const keep = vi.spyOn(mesh, "_keepRecordedDraw");
        for (const velocity of ["PREPASS_VELOCITY", "PREPASS_VELOCITY_LINEAR"]) {
            const defines = new MaterialDefines();
            defines[velocity] = true;
            subMesh.materialDefines = defines;
            subMesh._drawWrapper._recordedMaterial = material;
            mesh.render(subMesh, false);
            expect(check).not.toHaveBeenCalled();
            expect(keep).not.toHaveBeenCalled();
            expect(subMesh._drawWrapper._recordedMaterial).toBeNull();
        }
    });

    it("neither checks nor keeps in Mesh.render a draw of a mesh with render observers, and records it again once they are removed", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        const keepState = vi.spyOn(engine, "_keepInheritedState");
        const replay = vi.spyOn(engine, "_replayRecordedDraw");
        // a draw recorded before
        subMesh._drawWrapper._recordedMaterial = material;

        // an observer can set states around the full draw, which its commands would keep: the draw is neither checked nor kept (the
        // states it inherits are kept first), and what was recorded for it is dropped
        const observer = mesh.onBeforeRenderObservable.add(() => {});
        mesh.render(subMesh, false);
        expect(keepState).not.toHaveBeenCalled();
        expect(subMesh._drawWrapper._recordedMaterial).toBeNull();

        // removed: the draw is recorded again before it can be encoded again
        mesh.onBeforeRenderObservable.remove(observer);
        mesh.render(subMesh, false);
        expect(keepState).toHaveBeenCalledTimes(1);
        expect(replay).not.toHaveBeenCalled();
    });

    it("keeps the states a draw inherits where its recorded draw is checked, before its mesh sets its alpha mode", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        // the full draw goes as far as the alpha mode: its effect is not built here
        vi.spyOn(material, "isReadyForSubMesh").mockReturnValue(true);
        const keepState = vi.spyOn(engine, "_keepInheritedState");
        const setAlphaMode = vi.spyOn(engine, "setAlphaMode");
        mesh.render(subMesh, true);
        expect(keepState).toHaveBeenCalledTimes(1);
        expect(setAlphaMode).toHaveBeenCalledTimes(1);
        expect(keepState.mock.invocationCallOrder[0]).toBeLessThan(setAlphaMode.mock.invocationCallOrder[0]);
    });

    it("sets the alpha mode of its material when it encodes a draw again, as a full draw does for the draws after it", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        vi.spyOn(mesh as any, "_getUnchangedRecordedDraw").mockReturnValue(subMesh._drawWrapper);
        vi.spyOn(engine, "_canEncodeRecordedDraw").mockReturnValue(true);
        const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
        material.alphaMode = Constants.ALPHA_ADD;
        engine.setAlphaMode(Constants.ALPHA_DISABLE);
        mesh.render(subMesh, true);
        expect(replay).toHaveBeenCalledTimes(1);
        expect(engine.getAlphaMode()).toBe(Constants.ALPHA_ADD);
        // a mesh that does not set its alpha mode leaves the engine's
        engine.setAlphaMode(Constants.ALPHA_DISABLE);
        mesh.render(subMesh, false);
        expect(replay).toHaveBeenCalledTimes(2);
        expect(engine.getAlphaMode()).toBe(Constants.ALPHA_DISABLE);
    });

    it("sets the stencil of its material when it encodes a draw again, as its full draw does, not the one a draw in between left (A, B, C)", () => {
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        (material as any)._shaderLanguage = ShaderLanguage.WGSL;
        vi.spyOn(engine, "_canEncodeRecordedDraw").mockReturnValue(true);
        // A and C draw with the material, which has no stencil, and are encoded again
        const a = mesh;
        const c = mesh.clone("C")!;
        for (const drawn of [a, c]) {
            vi.spyOn(drawn as any, "_getUnchangedRecordedDraw").mockImplementation((sub: any) => sub._drawWrapper);
        }
        // the stencil the engine gives the render pass at a draw: the material's set by the last setState while it is enabled, else
        // the global one (a NullEngine keeps no state: here it keeps the material's stencil, as the other engines do)
        const composer = engine.stencilStateComposer;
        vi.spyOn(engine, "setState").mockImplementation((_culling, _zOffset, _force, _reverse, _cullBackFaces, stencil) => {
            composer.stencilMaterial = stencil;
        });
        const stencils: unknown[] = [];
        vi.spyOn(engine, "_replayRecordedDraw").mockImplementation(() => {
            stencils.push(composer.stencilMaterial);
            return true;
        });
        // the global stencil test with reference 1, and B drawn in full between A and C with a stencil of reference 2
        engine.setStencilBuffer(true);
        engine.setStencilFunctionReference(1);
        const b = new StandardMaterial("B", scene);
        b.stencil.enabled = true;
        b.stencil.funcRef = 2;

        a.render(a.subMeshes[0], false);
        // what the full draw of B sets before it binds (Material._preBind)
        engine.setState(b.backFaceCulling, b.zOffset, false, false, b.cullBackFaces, b.stencil, b.zOffsetUnits);
        c.render(c.subMeshes[0], false);
        expect(stencils).toEqual([material.stencil, material.stencil]);
        expect(stencils[1]).not.toBe(b.stencil);
    });

    it("draws in full the shadow map casters recorded before forceBackFacesOnly or useOpacityTextureForTransparentShadow changed, which the full draw sets", () => {
        const generator = new ShadowGenerator(256, new DirectionalLight("sun", new Vector3(0, -1, 0), scene));
        vi.spyOn(engine, "_recordsDraws", "get").mockReturnValue(true);
        const replay = vi.spyOn(engine, "_replayRecordedDraw").mockReturnValue(true);
        // the full draws go through with an effect that takes any value (without uniform buffers, the mesh's values are set on the
        // effect too): the depth effect is not built here
        vi.spyOn(generator, "isReady").mockReturnValue(true);
        const setters: Record<string, unknown> = {};
        const effect = new Proxy(setters, {
            get: (target, key) => (typeof key === "string" && key.startsWith("set") ? (target[key] ??= vi.fn()) : target[key as string]),
        }) as unknown as Effect;
        // two casters of the same material and effect: the first one's full draw is the frame's reference for the second one
        const casters = [subMesh, mesh.clone("second")!.subMeshes[0]];
        for (const caster of casters) {
            const wrapper = new DrawWrapper(engine);
            wrapper.effect = effect;
            vi.spyOn(caster, "_getDrawWrapper").mockReturnValue(wrapper);
        }
        const frame = () => {
            nextFrame();
            for (const caster of casters) {
                (generator as any)._renderSubMeshForShadowMap(caster, false);
            }
        };
        frame();
        frame();
        expect(replay).toHaveBeenCalledTimes(1);
        generator.forceBackFacesOnly = true;
        frame();
        expect(replay).toHaveBeenCalledTimes(1);
        frame();
        expect(replay).toHaveBeenCalledTimes(2);
        // and back: the casters recorded with back faces only are drawn in full again, then encoded again
        generator.forceBackFacesOnly = false;
        frame();
        expect(replay).toHaveBeenCalledTimes(2);
        frame();
        expect(replay).toHaveBeenCalledTimes(3);
        // useOpacityTextureForTransparentShadow chooses the texture the full draw binds for the alpha test: the second caster, whose
        // values equal the first one's, is not encoded again with the texture of the other choice
        generator.useOpacityTextureForTransparentShadow = true;
        frame();
        expect(replay).toHaveBeenCalledTimes(3);
        frame();
        expect(replay).toHaveBeenCalledTimes(4);
    });
});
