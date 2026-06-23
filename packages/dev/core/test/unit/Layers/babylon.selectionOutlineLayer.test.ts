import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { SelectionOutlineLayer } from "core/Layers/selectionOutlineLayer";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { type SubMesh } from "core/Meshes/subMesh";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { type Effect } from "core/Materials/effect";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { VertexBuffer } from "core/Buffers/buffer";

import "core/Engines/AbstractEngine/abstractEngine.states";
import "core/Layers/effectLayerSceneComponent";
import "core/Shaders/depth.fragment";
import "core/Shaders/depth.vertex";

describe("SelectionOutlineLayer", () => {
    let engine: Engine;
    let scene: Scene;

    type ThinSelectionOutlineLayerInternals = {
        bindTexturesForCompose: (effect: Effect) => void;
        _createMergeEffect: () => Effect;
        _renderSubMesh: (subMesh: SubMesh) => void;
    };

    const getThinLayer = (layer: SelectionOutlineLayer) => {
        return (layer as unknown as { _thinEffectLayer: ThinSelectionOutlineLayerInternals })._thinEffectLayer;
    };

    const bindTexturesForCompose = (layer: SelectionOutlineLayer) => {
        const bindings: Record<string, unknown> = {};
        const effect = {
            setTexture: (name: string, texture: unknown) => {
                bindings[name] = texture;
            },
        };
        const thinLayer = getThinLayer(layer);

        thinLayer.bindTexturesForCompose(effect as unknown as Effect);

        return bindings;
    };

    const getMergeEffectOptions = (layer: SelectionOutlineLayer) => {
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue({} as Effect);
        getThinLayer(layer)._createMergeEffect();
        const options = createEffect.mock.calls[createEffect.mock.calls.length - 1][1] as unknown as {
            defines: string;
            uniformsNames: string[];
            samplers: string[];
        };
        createEffect.mockRestore();

        return options;
    };

    const createAlphaTestMaterial = (coordinatesIndex = 0) => {
        const material = new PBRMaterial("alphaTestMaterial", scene);
        const texture = new Texture("alphaTexture.jpg", scene);
        texture.hasAlpha = true;
        texture.coordinatesIndex = coordinatesIndex;
        material.albedoTexture = texture;
        material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;

        return material;
    };

    const getSelectionDefines = (layer: SelectionOutlineLayer, subMesh: SubMesh) => {
        vi.spyOn(engine, "createEffect").mockReturnValue({ dispose: vi.fn(), getEngine: () => engine, isReady: () => true } as unknown as Effect);
        layer.isReady(subMesh, false);

        return subMesh._getDrawWrapper(undefined, true)?.defines as string;
    };

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("should not create a depth renderer when no meshes are selected", () => {
        new SelectionOutlineLayer("outline", scene);

        // The depth renderer should not be created eagerly
        expect(scene._depthRenderer).toBeUndefined();
    });

    it("should enable rendering only after a selection is added", () => {
        const layer = new SelectionOutlineLayer("outline", scene);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        // Before adding any selection, no depth renderer and shouldRender is false
        expect(scene._depthRenderer).toBeUndefined();
        expect(layer.shouldRender()).toBe(false);

        // After adding a selection, shouldRender flips to true
        layer.addSelection(sphere);
        expect(layer.shouldRender()).toBe(true);
    });

    it("should bind a depth renderer for compose by default", () => {
        const layer = new SelectionOutlineLayer("outline", scene);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        layer.addSelection(sphere);

        const bindings = bindTexturesForCompose(layer);

        expect(scene._depthRenderer).toBeDefined();
        expect(bindings.depthSampler).toBe(scene._depthRenderer![scene.activeCamera!.uniqueId].getDepthMap());
    });

    it("should not create a depth renderer when depth occlusion is disabled", () => {
        const layer = new SelectionOutlineLayer("outline", scene, { useDepthOcclusion: false });
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        layer.addSelection(sphere);

        const bindings = bindTexturesForCompose(layer);

        expect(scene._depthRenderer).toBeUndefined();
        expect(bindings.depthSampler).toBeUndefined();
    });

    it("should not create a depth renderer when occlusion strength is zero", () => {
        const layer = new SelectionOutlineLayer("outline", scene);
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        layer.occlusionStrength = 0;
        layer.addSelection(sphere);

        const bindings = bindTexturesForCompose(layer);

        expect(scene._depthRenderer).toBeUndefined();
        expect(bindings.depthSampler).toBeUndefined();
    });

    it("should compile depth occlusion code only when compose depth occlusion is enabled", () => {
        const defaultLayer = new SelectionOutlineLayer("defaultOutline", scene);
        const disabledLayer = new SelectionOutlineLayer("disabledOutline", scene, { useDepthOcclusion: false });
        const zeroStrengthLayer = new SelectionOutlineLayer("zeroStrengthOutline", scene);

        zeroStrengthLayer.occlusionStrength = 0;

        const defaultOptions = getMergeEffectOptions(defaultLayer);
        expect(defaultOptions.defines).toContain("#define OUTLINELAYER_DEPTH_OCCLUSION");
        expect(defaultOptions.samplers).toContain("depthSampler");
        expect(defaultOptions.uniformsNames).toContain("occlusionStrength");
        expect(defaultOptions.uniformsNames).not.toContain("useDepthOcclusion");

        for (const options of [getMergeEffectOptions(disabledLayer), getMergeEffectOptions(zeroStrengthLayer)]) {
            expect(options.defines).not.toContain("OUTLINELAYER_DEPTH_OCCLUSION");
            expect(options.samplers).not.toContain("depthSampler");
            expect(options.uniformsNames).not.toContain("occlusionStrength");
            expect(options.uniformsNames).not.toContain("occlusionThreshold");
            expect(options.uniformsNames).not.toContain("useDepthOcclusion");
        }
    });

    it("should render the selection mask without depth testing when depth occlusion is disabled", () => {
        const layer = new SelectionOutlineLayer("outline", scene, { useDepthOcclusion: false });
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        const subMesh = sphere.subMeshes[0];
        const thinLayer = getThinLayer(layer);
        const effect = {
            setFloat: vi.fn(),
            setFloat2: vi.fn(),
            setMatrix: vi.fn(),
            setTexture: vi.fn(),
        } as unknown as Effect;

        sphere.material = new PBRMaterial("material", scene);
        layer.addSelection(sphere);
        vi.spyOn(thinLayer as any, "_isSubMeshReady").mockReturnValue(true);
        vi.spyOn(subMesh as any, "_getDrawWrapper").mockReturnValue({ effect });
        vi.spyOn(engine, "enableEffect").mockImplementation(() => {});
        vi.spyOn(sphere as any, "_bind").mockImplementation(() => {});
        vi.spyOn(sphere as any, "_processRendering").mockImplementation(() => {});

        engine.setDepthBuffer(true);
        engine.setDepthWrite(true);
        const setDepthBuffer = vi.spyOn(engine, "setDepthBuffer");
        const setDepthWrite = vi.spyOn(engine, "setDepthWrite");

        thinLayer._renderSubMesh(subMesh);

        expect(setDepthBuffer).toHaveBeenCalledWith(false);
        expect(setDepthWrite).toHaveBeenCalledWith(false);
        expect(setDepthBuffer.mock.calls[setDepthBuffer.mock.calls.length - 1][0]).toBe(true);
        expect(setDepthWrite.mock.calls[setDepthWrite.mock.calls.length - 1][0]).toBe(true);
    });

    for (const [engineName, isWebGPU] of [
        ["WebGL2", false],
        ["WebGPU", true],
    ] as const) {
        it(`should not compile alpha-test selection sampling when no alpha-test texture exists on ${engineName}`, () => {
            Object.defineProperty(engine, "isWebGPU", { configurable: true, value: isWebGPU });

            const layer = new SelectionOutlineLayer("outline", scene, { useDepthOcclusion: false });
            const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
            const material = new PBRMaterial("alphaTestMaterial", scene);
            material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
            sphere.material = material;

            layer.addSelection(sphere);

            const subMesh = sphere.subMeshes[0];
            const defines = getSelectionDefines(layer, subMesh);

            expect(defines).toEqual(expect.any(String));
            expect(defines).not.toContain("#define ALPHATEST");
        });

        it(`should not compile alpha-test selection sampling when no UV set is available on ${engineName}`, () => {
            Object.defineProperty(engine, "isWebGPU", { configurable: true, value: isWebGPU });

            const layer = new SelectionOutlineLayer("outline", scene, { useDepthOcclusion: false });
            const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

            sphere.material = createAlphaTestMaterial();
            sphere.removeVerticesData(VertexBuffer.UVKind);
            layer.addSelection(sphere);

            const defines = getSelectionDefines(layer, sphere.subMeshes[0]);

            expect(defines).not.toContain("#define ALPHATEST");
            expect(defines).not.toContain("#define UV1");
            expect(defines).not.toContain("#define UV2");
        });

        it(`should compile alpha-test selection sampling with UV2 when UV1 is unavailable on ${engineName}`, () => {
            Object.defineProperty(engine, "isWebGPU", { configurable: true, value: isWebGPU });

            const layer = new SelectionOutlineLayer("outline", scene, { useDepthOcclusion: false });
            const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
            const uvData = sphere.getVerticesData(VertexBuffer.UVKind);

            expect(uvData).toBeDefined();
            sphere.setVerticesData(VertexBuffer.UV2Kind, uvData!);
            sphere.removeVerticesData(VertexBuffer.UVKind);
            sphere.material = createAlphaTestMaterial();
            layer.addSelection(sphere);

            const defines = getSelectionDefines(layer, sphere.subMeshes[0]);

            expect(defines).toContain("#define ALPHATEST");
            expect(defines).toContain("#define UV2");
            expect(defines).not.toContain("#define UV1");
        });
    }

    it("should serialize and parse the depth occlusion option", () => {
        const layer = new SelectionOutlineLayer("outline", scene);

        layer.useDepthOcclusion = false;

        const serialized = layer.serialize();

        expect(serialized.useDepthOcclusion).toBe(false);
        expect(serialized.options.useDepthOcclusion).toBe(false);

        const parsedLayer = SelectionOutlineLayer.Parse(serialized, scene, "");
        expect(parsedLayer.useDepthOcclusion).toBe(false);
    });
});
