import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ImportMeshAsync, SceneLoader } from "core/Loading/sceneLoader";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { registerBuiltInLoaders } from "loaders/dynamic";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Animation } from "core/Animations/animation";
import { Texture } from "core/Materials/Textures/texture";
import { Material } from "core/Materials/material";
import { type IGLTF as ILoadedGLTF, type IMaterial } from "loaders/glTF/2.0/glTFLoaderInterfaces";
import { _GetMaterialTexture, GetMappingForKey, GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { _RegisterKHRAnimationPointerData } from "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data.pure";
import { OpenPBRMaterialLoadingAdapter } from "loaders/glTF/2.0/openpbrMaterialLoadingAdapter";
import { Color3, Color4 } from "core/Maths/math.color";
import { type IGLTF, MaterialAlphaMode, AccessorType, AnimationSamplerInterpolation, AnimationChannelTargetPath } from "babylonjs-gltf2interface";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type ITransmissionHelperHolder } from "loaders/glTF/2.0/Extensions/transmissionHelper";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import { Vector2 } from "core/Maths/math.vector";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { _AddInteractivityObjectModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity";

registerBuiltInLoaders();

function getProperty(target: object, path: string): unknown {
    let value: unknown = target;
    for (const part of path.split(".")) {
        if (value === null || typeof value !== "object") {
            throw new Error(`Missing parent for ${path}`);
        }
        value = Reflect.get(value, part);
    }
    return value;
}

function prepareTexture(material: Material, path: string, scene: Scene): void {
    const parts = path.split(".");
    const member = parts.pop();
    if (!["uScale", "vScale", "uOffset", "vOffset", "wAng", "level"].includes(member!)) {
        return;
    }
    const textureProperty = parts.pop()!;
    const parent = parts.length ? getProperty(material, parts.join(".")) : material;
    if (parent === null || typeof parent !== "object" || !(textureProperty in parent)) {
        throw new Error(`Missing texture property ${path}`);
    }
    Reflect.set(parent, textureProperty, new Texture(null, scene));
}

function buildAnimatedMaterialsGltf(
    pointer: string,
    values: number[],
    type: "SCALAR" | "VEC2" | "VEC3" | "VEC4",
    materialExtensions: Record<string, unknown> = {},
    cubicSpline = false
): string {
    const buffer = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, ...values]);
    return JSON.stringify({
        asset: { version: "2.0" },
        extensionsUsed: ["KHR_animation_pointer", "KHR_texture_transform", "KHR_materials_retroreflection", ...Object.keys(materialExtensions)],
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [{ mesh: 0 }, { mesh: 1 }],
        meshes: [0, 1].map((material) => ({ primitives: [{ attributes: { POSITION: 0 }, material }] })),
        materials: [true, false].map((retroreflection) => ({
            name: retroreflection ? "retro" : "ordinary",
            alphaMode: "BLEND",
            pbrMetallicRoughness: {
                metallicFactor: 0,
                roughnessFactor: 0.2,
                baseColorFactor: [1, 1, 1, 1],
                baseColorTexture: { index: 0, extensions: { KHR_texture_transform: {} } },
                metallicRoughnessTexture: { index: 0, extensions: { KHR_texture_transform: {} } },
            },
            extensions: { ...materialExtensions, ...(retroreflection ? { KHR_materials_retroreflection: { retroreflectionFactor: 0.75 } } : {}) },
        })),
        textures: [{ source: 0 }],
        images: [{ uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l4pZ3wAAAABJRU5ErkJggg==" }],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] },
            { bufferView: 1, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
            { bufferView: 2, componentType: 5126, count: cubicSpline ? 6 : 2, type },
        ],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 8 },
            { buffer: 0, byteOffset: 44, byteLength: values.length * 4 },
        ],
        buffers: [{ byteLength: buffer.byteLength, uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...new Uint8Array(buffer.buffer)))}` }],
        animations: [
            {
                samplers: [{ input: 1, output: 2, interpolation: cubicSpline ? "CUBICSPLINE" : "LINEAR" }],
                channels: [0, 1].map((material) => ({
                    sampler: 0,
                    target: { path: "pointer", extensions: { KHR_animation_pointer: { pointer: `/materials/${material}/${pointer}` } } },
                })),
            },
        ],
    });
}

describe("KHR_animation_pointer material implementations", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it.each(["roughnessFactor", "metallicFactor", "baseColorFactor"])("imports and plays %s on mixed OpenPBR and PBR materials", async (pointer) => {
        const isColor = pointer === "baseColorFactor";
        const result = await ImportMeshAsync(
            `data:${buildAnimatedMaterialsGltf(`pbrMetallicRoughness/${pointer}`, isColor ? [1, 1, 1, 1, 0.2, 0.4, 0.6, 0.8] : [0.2, 0.8], isColor ? "VEC4" : "SCALAR")}`,
            scene,
            {
                pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } },
            }
        );
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
        expect(retro).toBeInstanceOf(OpenPBRMaterial);
        expect(ordinary).toBeInstanceOf(PBRMaterial);
        expect(result.animationGroups).toHaveLength(1);

        const group = result.animationGroups[0];
        expect(group.isStarted).toBe(true);
        group.pause();
        group.goToFrame(30);
        if (isColor) {
            expect(retro.baseColor.asArray()).toEqual(ordinary.albedoColor.asArray());
            expect(retro.baseColor.r).toBeCloseTo(0.6);
            expect(retro.baseColor.g).toBeCloseTo(0.7);
            expect(retro.baseColor.b).toBeCloseTo(0.8);
            expect(retro.geometryOpacity).toBeCloseTo(0.9);
            expect(ordinary.alpha).toBeCloseTo(0.9);
        } else {
            expect(pointer === "roughnessFactor" ? retro.specularRoughness : retro.baseMetalness).toBeCloseTo(0.5);
            expect(pointer === "roughnessFactor" ? ordinary.roughness : ordinary.metallic).toBeCloseTo(0.5);
        }
    });

    it("imports and plays a clearcoat texture transform after merging attenuating transmission", async () => {
        // NullEngine cannot render the texture-processing passes; keep their real output textures and conversion flow.
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const setMatrix = vi.spyOn(ProceduralTexture.prototype, "setMatrix");
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", [0, 0, 0.8, 0.6], "VEC2", {
                KHR_materials_clearcoat: { clearcoatFactor: 0.5, clearcoatTexture: { index: 0, extensions: { KHR_texture_transform: {} } } },
                KHR_materials_transmission: { transmissionFactor: 1 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
            })
        ) as IGLTF;
        for (const material of gltf.materials!) {
            material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
            delete material.pbrMetallicRoughness!.baseColorTexture;
        }
        const result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
        const group = result.animationGroups[0];
        expect(group.isStarted).toBe(true);
        await vi.waitFor(() => {
            expect(retro.coatColorTexture).not.toBeNull();
            expect(retro.coatRoughnessTexture).not.toBeNull();
        });
        render.mockClear();
        setMatrix.mockClear();
        group.pause().goToFrame(30);
        const source = group.targetedAnimations.find(({ target }) => target instanceof Texture)!.target as Texture;
        expect(source.uOffset).toBeCloseTo(0.4);
        expect(source.vOffset).toBeCloseTo(0.3);
        expect(ordinary.clearCoat.texture!.uOffset).toBeCloseTo(0.4);
        expect(ordinary.clearCoat.texture!.vOffset).toBeCloseTo(0.3);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(setMatrix).toHaveBeenCalledWith("textureTMatrix", source.getTextureMatrix());
        expect(render.mock.contexts).toContain(retro.coatColorTexture);
        expect(render.mock.contexts).toContain(retro.coatRoughnessTexture);
        expect(retro.coatColorTexture!.getTextureMatrix().equals(new Texture(null, scene).getTextureMatrix())).toBe(true);
        const renders = render.mock.calls.length;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(render).toHaveBeenCalledTimes(renders);
    });

    it.each([true, false])("retains runtime texture access after conversion with interactivity enabled=%s", async (enabled) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", [0, 0, 0.8, 0.6], "VEC2", {
                KHR_materials_clearcoat: { clearcoatFactor: 0.5, clearcoatTexture: { index: 0, extensions: { KHR_texture_transform: {} } } },
                KHR_materials_transmission: { transmissionFactor: 1 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
            })
        ) as IGLTF;
        gltf.extensionsUsed!.push("KHR_interactivity");
        delete gltf.animations;
        for (const material of gltf.materials!) {
            material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
            delete material.pbrMetallicRoughness!.baseColorTexture;
        }
        let parsed: IGLTF | undefined;
        const activation = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as IGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, {
                pluginOptions: { gltf: { useOpenPBR: false, extensionOptions: { KHR_interactivity: { enabled } } } },
            });
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(activation);
        }
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        await vi.waitFor(() => expect(retro.coatRoughnessTexture).not.toBeNull());
        const accessor = GetPathToObjectConverter(parsed!).convert("/materials/0/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset");
        render.mockClear();
        accessor.info.set!(new Vector2(0.4, 0.3), accessor.object);
        expect(accessor.info.get!(accessor.object)).toEqual(new Vector2(0.4, 0.3));
        scene.onBeforeRenderObservable.notifyObservers(scene);
        if (enabled) {
            expect(render.mock.contexts).toContain(retro.coatRoughnessTexture);
        } else {
            expect(render).not.toHaveBeenCalled();
        }
    });

    it.each(["clearcoatTexture", "clearcoatRoughnessTexture"])("builds runtime interpolation from retained %s after conversion", async (slot) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const pointer = `extensions/KHR_materials_clearcoat/${slot}/extensions/KHR_texture_transform/offset`;
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf(pointer, [0, 0, 0.8, 0.6], "VEC2", {
                KHR_materials_clearcoat: {
                    clearcoatFactor: 0.5,
                    clearcoatRoughnessFactor: 0.6,
                    [slot]: { index: 0, extensions: { KHR_texture_transform: {} } },
                },
                KHR_materials_transmission: { transmissionFactor: 1 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
            })
        ) as IGLTF;
        delete gltf.animations;
        for (const material of gltf.materials!) {
            material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
            delete material.pbrMetallicRoughness!.baseColorTexture;
        }
        let parsed: IGLTF | undefined;
        const activation = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as IGLTF;
                });
            }
        });
        try {
            await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false } } });
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(activation);
        }
        await scene.whenReadyAsync();
        const converter = GetPathToObjectConverter(parsed!, (mapping) => _AddInteractivityObjectModel(scene, 60, mapping));
        const accessor = converter.convert(`/materials/0/${pointer}`);
        const parser = new InteractivityGraphToFlowGraphParser(
            {
                declarations: [{ op: "pointer/interpolate" }, { op: "event/onStart" }],
                types: [{ signature: "float2" }, { signature: "float" }],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { pointer: { value: [`/materials/0/${pointer}`] }, type: { value: [0] } },
                        values: { value: { value: [0.8, 0.6], type: 0 }, duration: { value: [1], type: 1 } },
                    },
                    { declaration: 1, flows: { out: { node: 0, socket: "in" } } },
                ],
            },
            parsed!
        );
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: converter });
        try {
            coordinator.start();
            await vi.waitFor(() => expect(scene.animationGroups).toHaveLength(1));
            const group = scene.animationGroups[0];
            expect(group.targetedAnimations.every(({ target }) => target instanceof Texture)).toBe(true);
            group.pause().goToFrame(30);
            const value = accessor.info.get!(accessor.object) as Vector2;
            expect(value.x).toBeCloseTo(0.4);
            expect(value.y).toBeCloseTo(0.3);
        } finally {
            coordinator.dispose();
        }
    });

    it.each([false, true])("retains the staged diffuse transmission color texture with volumetric=%s", async (volumetric) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const pointer = "extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/offset";
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf(pointer, [0, 0, 0.8, 0.6], "VEC2", {
                KHR_materials_diffuse_transmission: {
                    diffuseTransmissionFactor: 0.5,
                    diffuseTransmissionColorTexture: { index: 0, extensions: { KHR_texture_transform: {} } },
                },
                ...(volumetric ? { KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] } } : {}),
            })
        ) as IGLTF;
        delete gltf.animations;
        gltf.extensionsUsed!.push("KHR_interactivity");
        let parsed: IGLTF | undefined;
        let completion: Promise<void> | undefined;
        const activation = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as IGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false } } });
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(activation);
        }
        await completion;
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const source = _GetMaterialTexture(retro, "subSurface", "translucencyColorTexture") as Texture;
        expect(source).toBeInstanceOf(Texture);
        const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
        render.mockClear();
        accessor.info.set!(new Vector2(0.4, 0.3), accessor.object);
        expect(source.uOffset).toBeCloseTo(0.4);
        expect(source.vOffset).toBeCloseTo(0.3);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        if (volumetric) {
            expect(render.mock.contexts).toContain(retro.coatColorTexture);
        } else {
            expect(retro.subsurfaceColorTexture).toBe(source);
        }
    });

    it.each(
        ["normalTexture/scale", "extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale"].flatMap((pointer) => [false, true].map((diffuse) => [pointer, diffuse] as const))
    )("propagates animated and runtime %s into the converted coat normal with diffuse transmission=%s", async (pointer, diffuse) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const setColor4 = vi.spyOn(ProceduralTexture.prototype, "setColor4");
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf(pointer, [0.5, 0], "SCALAR", {
                KHR_materials_clearcoat: { clearcoatFactor: 0.5, clearcoatNormalTexture: { index: 0, scale: 0.5 } },
                KHR_materials_transmission: { transmissionFactor: 1 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionColorFactor: [0.8, 0.6, 0.4] } } : {}),
            })
        ) as IGLTF;
        for (const material of gltf.materials!) {
            material.normalTexture = { index: 0, scale: 0.5 };
            material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
            delete material.pbrMetallicRoughness!.baseColorTexture;
        }
        let parsed: IGLTF | undefined;
        let completion: Promise<void> | undefined;
        const activation = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as IGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(activation);
        }
        await completion;
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        expect(retro.geometryCoatNormalTexture).toBeInstanceOf(ProceduralTexture);
        expect(retro.geometryCoatNormalTexture!.level).toBe(1);
        expect(setColor4.mock.calls.some(([name, value]) => name === "factorB" && value.r === 0.5 && value.b === 1)).toBe(true);
        const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
        const group = result.animationGroups[0];
        group.pause();
        for (const frame of [30, 60]) {
            render.mockClear();
            setColor4.mockClear();
            group.goToFrame(frame);
            expect(accessor.info.get!(accessor.object)).toBeCloseTo(frame === 30 ? 0.25 : 0);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(render.mock.contexts).toContain(retro.geometryCoatNormalTexture);
            expect(setColor4.mock.calls.some(([name, value]) => name === "factorB" && value.r === (frame === 30 ? 0.25 : 0) && value.b === 1)).toBe(true);
            const count = render.mock.calls.length;
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(render).toHaveBeenCalledTimes(count);
        }
        group.stop();
        render.mockClear();
        accessor.info.set!(0.75, accessor.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(render.mock.contexts).toContain(retro.geometryCoatNormalTexture);
        expect(accessor.info.get!(accessor.object)).toBeCloseTo(0.75);
        const normalPasses = scene.textures.filter((texture) => texture.name.startsWith("scaledNormal") || texture.name.startsWith("newCoatNormal"));
        retro.dispose();
        render.mockClear();
        accessor.info.set!(0.25, accessor.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(render.mock.contexts.some((texture) => normalPasses.includes(texture))).toBe(false);
    });

    it.each(
        ["color", "weight"].flatMap((property) =>
            [false, true].flatMap((textured) =>
                [false, true].flatMap((diffuse) => (property === "color" ? [false, true] : [false]).map((initiallyWhite) => ({ property, textured, diffuse, initiallyWhite })))
            )
        )
    )(
        "updates converted volumetric surface $property with textures=$textured, diffuse transmission=$diffuse and initially white=$initiallyWhite",
        async ({ property, textured, diffuse, initiallyWhite }) => {
            vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
                callback(this);
            });
            const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
            const setColor4 = vi.spyOn(ProceduralTexture.prototype, "setColor4");
            const pointer = property === "color" ? "pbrMetallicRoughness/baseColorFactor" : "extensions/KHR_materials_transmission/transmissionFactor";
            const initialColor = initiallyWhite ? [1, 1, 1, 1] : [0.8, 0.6, 0.4, 1];
            const gltf = JSON.parse(
                buildAnimatedMaterialsGltf(pointer, property === "color" ? [...initialColor, 0.2, 0.4, 0.6, 1] : [0.5, 1], property === "color" ? "VEC4" : "SCALAR", {
                    KHR_materials_clearcoat: { clearcoatFactor: 0.5 },
                    KHR_materials_transmission: { transmissionFactor: 0.5 },
                    KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                    ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionColorFactor: [0.8, 0.6, 0.4] } } : {}),
                })
            ) as IGLTF;
            for (const material of gltf.materials!) {
                material.pbrMetallicRoughness!.baseColorFactor = initialColor;
                if (!textured) {
                    delete material.pbrMetallicRoughness!.baseColorTexture;
                }
            }
            let parsed: IGLTF | undefined;
            let completion: Promise<void> | undefined;
            const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                if (plugin instanceof GLTFFileLoader) {
                    completion = plugin.whenCompleteAsync();
                    plugin.onParsedObservable.addOnce((data) => {
                        parsed = data.json as IGLTF;
                    });
                }
            });
            let result;
            try {
                result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
                await completion;
            } finally {
                SceneLoader.OnPluginActivatedObservable.remove(observer);
            }
            const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
            const group = result.animationGroups[0].pause();
            const check = () => {
                scene.onBeforeRenderObservable.notifyObservers(scene);
                if (textured) {
                    expect(render.mock.contexts).toContain(material.coatColorTexture);
                    const index = setColor4.mock.calls.findIndex(
                        ([name, value], i) =>
                            setColor4.mock.contexts[i].name === "lerpSurfaceColor" &&
                            name === (property === "color" ? "factorB" : "factorT") &&
                            value.r === (property === "color" ? material.baseColor.r : material.transmissionWeight)
                    );
                    expect(index).toBeGreaterThanOrEqual(0);
                } else {
                    expect(material.coatColor.r).toBeCloseTo((1 - material.transmissionWeight + material.transmissionWeight * material.baseColor.r) * (diffuse ? 0.9 : 1));
                    expect(material.coatColor.g).toBeCloseTo((1 - material.transmissionWeight + material.transmissionWeight * material.baseColor.g) * (diffuse ? 0.8 : 1));
                }
                const count = render.mock.calls.length;
                scene.onBeforeRenderObservable.notifyObservers(scene);
                expect(render).toHaveBeenCalledTimes(count);
            };
            render.mockClear();
            setColor4.mockClear();
            group.goToFrame(30);
            check();
            group.stop();
            render.mockClear();
            setColor4.mockClear();
            accessor.info.set!(property === "color" ? new Color4(0.3, 0.2, 0.7, 1) : 0.25, accessor.object);
            check();
        }
    );

    it.each([false, true])("initializes zero-weight transmission dependencies with thin=%s", async (thin) => {
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("pbrMetallicRoughness/baseColorFactor", [1, 1, 1, 1, 0.2, 0.4, 0.6, 1], "VEC4", {
                KHR_materials_transmission: { transmissionFactor: 0 },
                ...(!thin ? { KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] } } : {}),
            })
        ) as ILoadedGLTF;
        for (const material of gltf.materials!) {
            delete material.pbrMetallicRoughness!.baseColorTexture;
            delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
        }
        const weights = new Float32Array([0, 1]);
        gltf.buffers!.push({
            index: 1,
            byteLength: weights.byteLength,
            uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...new Uint8Array(weights.buffer)))}`,
        });
        gltf.bufferViews!.push({ index: 3, buffer: 1, byteOffset: 0, byteLength: weights.byteLength });
        gltf.accessors!.push({ index: 3, bufferView: 3, componentType: 5126, count: 2, type: AccessorType.SCALAR });
        gltf.animations![0].samplers.push({ index: 1, input: 1, output: 3, interpolation: AnimationSamplerInterpolation.LINEAR });
        gltf.animations![0].channels.push({
            index: 2,
            sampler: 1,
            target: {
                path: AnimationChannelTargetPath.POINTER,
                extensions: { KHR_animation_pointer: { pointer: "/materials/0/extensions/KHR_materials_transmission/transmissionFactor" } },
            },
        });
        let parsed: ILoadedGLTF | undefined;
        let completion: Promise<void> | undefined;
        const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as ILoadedGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            await completion;
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(observer);
        }
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        expect(!!material.geometryThinWalled).toBe(thin);
        expect(material.transmissionWeight).toBe(0);
        const mesh = result.meshes.find((mesh) => mesh.material === material)!;
        const target = (scene as Scene & ITransmissionHelperHolder)._transmissionHelper!.getOpaqueTarget();
        if (!(target instanceof RenderTargetTexture)) {
            throw new Error("Missing transmission background target");
        }
        await vi.waitFor(() => expect(target.renderList).toContain(mesh));
        const group = result.animationGroups[0].pause();
        group.goToFrame(30);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.transmissionWeight).toBeCloseTo(0.5);
        expect(material.backgroundRefractionTexture).toBe(target);
        expect(target.renderList).not.toContain(mesh);
        expect(thin ? material.transmissionColor.r : material.coatColor.r).toBeCloseTo(thin ? 0.6 : 0.8);
        group.stop();
        const converter = GetPathToObjectConverter(parsed!);
        const color = converter.convert("/materials/0/pbrMetallicRoughness/baseColorFactor");
        const weight = converter.convert("/materials/0/extensions/KHR_materials_transmission/transmissionFactor");
        color.info.set!(new Color4(0.3, 0.2, 0.7, 1), color.object);
        weight.info.set!(0.25, weight.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(thin ? material.transmissionColor.r : material.coatColor.r).toBeCloseTo(thin ? 0.3 : 0.825);
        weight.info.set!(0, weight.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(target.renderList).toContain(mesh);
    });

    it.each([false, true])("retains textured converted base roughness with metallic texture=%s", async (metallicTexture) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("pbrMetallicRoughness/roughnessFactor", [0.2, 0.8], "SCALAR", {
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionTexture: { index: 0 } },
            })
        ) as ILoadedGLTF;
        for (const material of gltf.materials!) {
            delete material.pbrMetallicRoughness!.baseColorTexture;
            if (!metallicTexture) {
                delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
            }
        }
        let parsed: ILoadedGLTF | undefined;
        let completion: Promise<void> | undefined;
        const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as ILoadedGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            await completion;
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(observer);
        }
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        expect(material.specularRoughnessTexture).toBeInstanceOf(ProceduralTexture);
        expect(material._useRoughnessFromMetallicTextureGreen).toBe(false);
        expect(!!material.baseMetalnessTexture).toBe(metallicTexture);
        const accessor = GetPathToObjectConverter(parsed!).convert("/materials/0/pbrMetallicRoughness/roughnessFactor");
        const group = result.animationGroups[0].pause();
        group.goToFrame(30);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(accessor.info.get!(accessor.object)).toBeCloseTo(0.5);
        expect(material.specularRoughness).toBe(1);
        group.stop();
        accessor.info.set!(0.8, accessor.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(accessor.info.get!(accessor.object)).toBeCloseTo(0.8);
        expect(material.specularRoughness).toBe(1);
    });

    it.each(["roughness", "ior"].flatMap((property) => [false, true].map((diffuse) => ({ property, diffuse }))))(
        "keeps converted surface $property live with consecutive conversions=$diffuse",
        async ({ property, diffuse }) => {
            const pointer = property === "roughness" ? "pbrMetallicRoughness/roughnessFactor" : "extensions/KHR_materials_ior/ior";
            const gltf = JSON.parse(
                buildAnimatedMaterialsGltf(pointer, property === "roughness" ? [0.2, 0.8] : [1.5, 1.9], "SCALAR", {
                    KHR_materials_transmission: { transmissionFactor: 1 },
                    KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                    KHR_materials_ior: { ior: 1.5 },
                    ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionColorFactor: [0.8, 0.6, 0.4] } } : {}),
                })
            ) as ILoadedGLTF;
            for (const material of gltf.materials!) {
                material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
                delete material.pbrMetallicRoughness!.baseColorTexture;
                delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
            }
            let parsed: ILoadedGLTF | undefined;
            let completion: Promise<void> | undefined;
            const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                if (plugin instanceof GLTFFileLoader) {
                    completion = plugin.whenCompleteAsync();
                    plugin.onParsedObservable.addOnce((data) => {
                        parsed = data.json as ILoadedGLTF;
                    });
                }
            });
            let result;
            try {
                result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
                await completion;
            } finally {
                SceneLoader.OnPluginActivatedObservable.remove(observer);
            }
            const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
            const group = result.animationGroups[0].pause();
            group.goToFrame(30);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(property === "roughness" ? material.coatRoughness : material.coatIor).toBeCloseTo(property === "roughness" ? 0.5 : 1.7);
            expect(accessor.info.get!(accessor.object)).toBeCloseTo(property === "roughness" ? 0.5 : 1.7);
            group.stop();
            accessor.info.set!(property === "roughness" ? 0.7 : 1.8, accessor.object);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(property === "roughness" ? material.coatRoughness : material.coatIor).toBeCloseTo(property === "roughness" ? 0.7 : 1.8);
            expect(accessor.info.get!(accessor.object)).toBeCloseTo(property === "roughness" ? 0.7 : 1.8);
            if (property === "roughness") {
                expect(material.specularRoughness).toBeCloseTo(diffuse ? 0.85 : 0.7);
            }
        }
    );

    it.each([false, true])("keeps an unauthored neutral coat inactive with consecutive conversions=%s", async (diffuse) => {
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("pbrMetallicRoughness/baseColorFactor", [1, 1, 1, 1, 0.2, 0.4, 0.6, 1], "VEC4", {
                KHR_materials_clearcoat: { clearcoatFactor: 0 },
                KHR_materials_transmission: { transmissionFactor: 0.5 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5 } } : {}),
            })
        ) as ILoadedGLTF;
        for (const material of gltf.materials!) {
            delete material.pbrMetallicRoughness!.baseColorTexture;
            delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
        }
        let parsed: ILoadedGLTF | undefined;
        let completion: Promise<void> | undefined;
        const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as ILoadedGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            await completion;
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(observer);
        }
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const converter = GetPathToObjectConverter(parsed!);
        const color = converter.convert("/materials/0/pbrMetallicRoughness/baseColorFactor");
        const coat = converter.convert("/materials/0/extensions/KHR_materials_clearcoat/clearcoatFactor");
        const group = result.animationGroups[0].pause();
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(0);
        group.goToFrame(30);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(1);
        expect(material.coatColor.r).toBeCloseTo(0.8);
        group.stop();
        material.transmissionWeight = 0;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(0);
        material.transmissionWeight = 0.5;
        color.info.set!(new Color4(1, 1, 1, 1), color.object);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(0);
        coat.info.set!(0.5, coat.object);
        expect(material.coatWeight).toBe(1);
        coat.info.set!(0, coat.object);
        expect(material.coatWeight).toBe(0);
        if (diffuse) {
            const tint = converter.convert("/materials/0/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor");
            tint.info.set!(new Color3(0.8, 0.6, 0.4), tint.object);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(material.coatWeight).toBe(1);
            expect(material.coatColor.r).toBeCloseTo(0.9);
            tint.info.set!(Color3.White(), tint.object);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(material.coatWeight).toBe(0);
        }
    });

    it.each([false, true])("keeps a zero-weight textured conversion coat inactive with consecutive conversions=%s", async (diffuse) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("extensions/KHR_materials_transmission/transmissionFactor", [0, 1], "SCALAR", {
                KHR_materials_clearcoat: { clearcoatFactor: 0 },
                KHR_materials_transmission: { transmissionFactor: 0 },
                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0, diffuseTransmissionColorTexture: { index: 0 } } } : {}),
            })
        ) as ILoadedGLTF;
        let parsed: ILoadedGLTF | undefined;
        let completion: Promise<void> | undefined;
        const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
                plugin.onParsedObservable.addOnce((data) => {
                    parsed = data.json as ILoadedGLTF;
                });
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            await completion;
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(observer);
        }
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const texture = material.coatColorTexture;
        const group = result.animationGroups[0].pause();
        const converter = GetPathToObjectConverter(parsed!);
        const coat = converter.convert("/materials/0/extensions/KHR_materials_clearcoat/clearcoatFactor");
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(texture).not.toBeNull();
        expect(material.coatWeight).toBe(0);
        group.goToFrame(30);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(1);
        group.goToFrame(0);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(material.coatWeight).toBe(0);
        expect(material.coatColorTexture).toBe(texture);
        coat.info.set!(0.5, coat.object);
        expect(material.coatWeight).toBe(1);
        coat.info.set!(0, coat.object);
        expect(material.coatWeight).toBe(0);
        if (diffuse) {
            const weight = converter.convert("/materials/0/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor");
            weight.info.set!(0.5, weight.object);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(material.coatWeight).toBe(1);
            weight.info.set!(0, weight.object);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(material.coatWeight).toBe(0);
        }
    });

    it.each(
        [false, true].flatMap((thin) =>
            [false, true].flatMap((textured) => [false, true].flatMap((initiallyWhite) => [false, true].map((transmission) => ({ thin, textured, initiallyWhite, transmission }))))
        )
    )(
        "retains diffuse transmission color with thin=$thin, textures=$textured, initially white=$initiallyWhite and specular transmission=$transmission",
        async ({ thin, textured, initiallyWhite, transmission }) => {
            vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
                callback(this);
            });
            const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
            const setColor4 = vi.spyOn(ProceduralTexture.prototype, "setColor4");
            const initial = initiallyWhite ? [1, 1, 1] : [0.8, 0.6, 0.4];
            const pointer = "extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor";
            const gltf = JSON.parse(
                buildAnimatedMaterialsGltf(pointer, [...initial, 0.2, 0.4, 0.6], "VEC3", {
                    KHR_materials_diffuse_transmission: {
                        diffuseTransmissionFactor: 0.5,
                        diffuseTransmissionColorFactor: initial,
                        ...(textured ? { diffuseTransmissionColorTexture: { index: 0 } } : {}),
                    },
                    ...(!thin ? { KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] } } : {}),
                    ...(transmission ? { KHR_materials_transmission: { transmissionFactor: 0.5 } } : {}),
                })
            ) as IGLTF;
            for (const material of gltf.materials!) {
                material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
                delete material.pbrMetallicRoughness!.baseColorTexture;
                delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
            }
            let parsed: ILoadedGLTF | undefined;
            let completion: Promise<void> | undefined;
            const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                if (plugin instanceof GLTFFileLoader) {
                    completion = plugin.whenCompleteAsync();
                    plugin.onParsedObservable.addOnce((data) => {
                        parsed = data.json as ILoadedGLTF;
                    });
                }
            });
            let result;
            try {
                result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
                await completion;
            } finally {
                SceneLoader.OnPluginActivatedObservable.remove(observer);
            }
            const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
            const group = result.animationGroups[0].pause();
            const initialRead = accessor.info.get!(accessor.object) as Color3;
            expect(initialRead.r).toBeCloseTo(initial[0]);
            expect(initialRead.g).toBeCloseTo(initial[1]);
            expect(initialRead.b).toBeCloseTo(initial[2]);
            const scatterColor = new Color3(0.1, 0.2, 0.3);
            if (!thin) {
                material.subsurfaceColor = scatterColor;
            }
            const check = (expected: Color3) => {
                scene.onBeforeRenderObservable.notifyObservers(scene);
                const actual = accessor.info.get!(accessor.object) as Color3;
                expect(actual.r).toBeCloseTo(expected.r);
                expect(actual.g).toBeCloseTo(expected.g);
                expect(actual.b).toBeCloseTo(expected.b);
                if (thin) {
                    expect(material.subsurfaceColor.asArray()).toEqual(actual.asArray());
                } else {
                    expect(material.subsurfaceColor).toBe(scatterColor);
                    if (textured) {
                        expect(render.mock.contexts).toContain(material.coatColorTexture);
                        expect(
                            setColor4.mock.calls.some(([name, value], i) => {
                                const texture = setColor4.mock.contexts[i];
                                return name === "factorB" && texture instanceof ProceduralTexture && texture.name === "lerpSurfaceColor" && Math.abs(value.r - expected.r) < 1e-6;
                            })
                        ).toBe(true);
                    } else {
                        expect(material.coatColor.r).toBeCloseTo((0.5 + 0.5 * expected.r) * (transmission ? 0.9 : 1));
                        expect(material.coatColor.g).toBeCloseTo((0.5 + 0.5 * expected.g) * (transmission ? 0.8 : 1));
                    }
                }
            };
            render.mockClear();
            setColor4.mockClear();
            group.goToFrame(30);
            check(new Color3((initial[0] + 0.2) / 2, (initial[1] + 0.4) / 2, (initial[2] + 0.6) / 2));
            group.stop();
            render.mockClear();
            setColor4.mockClear();
            accessor.info.set!(new Color3(0.3, 0.2, 0.7), accessor.object);
            check(new Color3(0.3, 0.2, 0.7));
        }
    );

    it.each(["clearcoatFactor", "clearcoatRoughnessFactor"].flatMap((property) => ["LINEAR", "STEP", "constant"].map((interpolation) => ({ property, interpolation }))))(
        "does not redraw converted textures for repeated $property $interpolation samples",
        async ({ property, interpolation }) => {
            vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
                callback(this);
            });
            const render = vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
            const gltf = JSON.parse(
                buildAnimatedMaterialsGltf(`extensions/KHR_materials_clearcoat/${property}`, [0.5, 0], "SCALAR", {
                    KHR_materials_clearcoat: {
                        clearcoatFactor: 0.5,
                        clearcoatRoughnessFactor: 0.5,
                        clearcoatTexture: { index: 0 },
                        clearcoatRoughnessTexture: { index: 0 },
                    },
                    KHR_materials_transmission: { transmissionFactor: 1 },
                    KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                })
            ) as IGLTF;
            if (interpolation === "STEP") {
                gltf.animations![0].samplers[0].interpolation = "STEP";
            } else if (interpolation === "constant") {
                const values = JSON.parse(buildAnimatedMaterialsGltf("", [0.5, 0.5], "SCALAR")) as IGLTF;
                gltf.buffers = values.buffers;
            }
            const result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            await vi.waitFor(() => expect(material.coatRoughnessTexture).not.toBeNull());
            const group = result.animationGroups[0].pause();
            render.mockClear();
            group.goToFrame(interpolation === "STEP" ? 60 : 30);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            if (interpolation === "constant") {
                expect(render).not.toHaveBeenCalled();
            } else {
                expect(render.mock.contexts).toContain(material.coatRoughnessTexture);
            }
            if (property === "clearcoatRoughnessFactor") {
                expect(render.mock.contexts).not.toContain(material.coatColorTexture);
            }
            render.mockClear();
            group.goToFrame(interpolation === "STEP" ? 60 : 30);
            scene.onBeforeRenderObservable.notifyObservers(scene);
            expect(render).not.toHaveBeenCalled();
        }
    );

    it("does not retain transient runtime texture animations after group disposal", () => {
        _RegisterKHRAnimationPointerData();
        const material = new OpenPBRMaterial("runtime", scene);
        const texture = new Texture(null, scene);
        texture.animations.push(new Animation("persistent", "uScale", 60, Animation.ANIMATIONTYPE_FLOAT));
        material.baseColorTexture = texture;
        const target: IMaterial = { index: 0, _data: { 0: { babylonMaterial: material, babylonMeshes: [], promise: Promise.resolve() } } };
        const infos = GetMappingForKey("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset")!.interpolation!;
        const original = [...texture.animations];
        for (let iteration = 0; iteration < 10; iteration++) {
            const group = new AnimationGroup("runtime", scene);
            for (const info of infos) {
                for (const { babylonAnimation, babylonAnimatable } of info.buildAnimations(target, "runtime", 60, [
                    { frame: 0, value: 0 },
                    { frame: 60, value: 1 },
                ])) {
                    group.addTargetedAnimation(babylonAnimation, babylonAnimatable);
                }
            }
            group.start().pause().goToFrame(30);
            group.dispose();
            expect(texture.animations).toEqual(original);
        }
    });

    it.each(["clearcoatFactor", "clearcoatRoughnessFactor"].flatMap((property) => [false, true].map((diffuse) => [property, diffuse] as const)))(
        "preserves authored %s through converted reads, writes and playback with diffuse transmission=%s",
        async (property, diffuse) => {
            const pointer = `extensions/KHR_materials_clearcoat/${property}`;
            const gltf = JSON.parse(
                buildAnimatedMaterialsGltf(pointer, [0.5, 0], "SCALAR", {
                    KHR_materials_clearcoat: { clearcoatFactor: 0.5, clearcoatRoughnessFactor: 0.5 },
                    KHR_materials_transmission: { transmissionFactor: 1 },
                    KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
                    ...(diffuse ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5 } } : {}),
                })
            ) as IGLTF;
            for (const material of gltf.materials!) {
                material.pbrMetallicRoughness!.baseColorFactor = [0.8, 0.6, 0.4, 1];
                delete material.pbrMetallicRoughness!.baseColorTexture;
                delete material.pbrMetallicRoughness!.metallicRoughnessTexture;
            }
            let parsed: IGLTF | undefined;
            const activation = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                if (plugin instanceof GLTFFileLoader) {
                    plugin.onParsedObservable.addOnce((data) => {
                        parsed = data.json as IGLTF;
                    });
                }
            });
            let result;
            try {
                result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false } } });
            } finally {
                SceneLoader.OnPluginActivatedObservable.remove(activation);
            }
            const material = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            await vi.waitFor(() => expect(material.coatRoughness).toBeCloseTo(0.35));
            const accessor = GetPathToObjectConverter(parsed!).convert(`/materials/0/${pointer}`);
            const group = result.animationGroups[0].pause().goToFrame(0);
            expect(accessor.info.get!(accessor.object)).toBeCloseTo(0.5);
            expect(material.coatWeight).toBe(1);
            accessor.info.set!(0, accessor.object);
            expect(accessor.info.get!(accessor.object)).toBe(0);
            expect(material.coatWeight).toBe(1);
            expect(material.coatRoughness).toBeCloseTo(property === "clearcoatFactor" ? 0.2 : 0.1);
            group.goToFrame(30);
            expect(accessor.info.get!(accessor.object)).toBeCloseTo(0.25);
            expect(material.coatRoughness).toBeCloseTo(property === "clearcoatFactor" ? 0.275 : 0.225);
        }
    );

    it.each(
        [undefined, MaterialAlphaMode.OPAQUE, MaterialAlphaMode.MASK, MaterialAlphaMode.BLEND].flatMap((alphaMode) =>
            [false, true].map((withTexture) => ({ alphaMode, withTexture }))
        )
    )("preserves $alphaMode with texture=$withTexture during import and base-color playback", async ({ alphaMode, withTexture }) => {
        const gltf = JSON.parse(buildAnimatedMaterialsGltf("pbrMetallicRoughness/baseColorFactor", [1, 1, 1, 0.25, 1, 0, 0, 0.75], "VEC4")) as IGLTF;
        for (const material of gltf.materials!) {
            material.alphaMode = alphaMode;
            material.pbrMetallicRoughness!.baseColorFactor = [1, 1, 1, 0.25];
            if (!withTexture) {
                delete material.pbrMetallicRoughness!.baseColorTexture;
            }
        }
        gltf.materials![0].extensions!["KHR_materials_retroreflection"] = { retroreflectionFactor: 0 };
        const result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
        const retroMesh = result.meshes.find((mesh) => mesh.material?.name === "retro")!;
        const ordinaryMesh = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!;
        const retro = retroMesh.material as OpenPBRMaterial;
        const ordinary = ordinaryMesh.material as PBRMaterial;
        expect(retro).toBeInstanceOf(OpenPBRMaterial);
        expect(ordinary).toBeInstanceOf(PBRMaterial);
        const opaque = alphaMode === undefined || alphaMode === MaterialAlphaMode.OPAQUE;
        expect(retro.geometryOpacity).toBeCloseTo(opaque ? 1 : 0.25);
        expect(ordinary.alpha).toBeCloseTo(opaque ? 1 : 0.25);

        const group = result.animationGroups[0];
        expect(group.isStarted).toBe(true);
        group.pause();
        for (const frame of [0, 30, 60]) {
            group.goToFrame(frame);
            expect(retro.baseColor.asArray()).toEqual(ordinary.albedoColor.asArray());
            expect(retro.geometryOpacity).toBeCloseTo(opaque ? 1 : 0.25 + frame / 120);
            for (const mesh of [retroMesh, ordinaryMesh]) {
                expect(mesh.material!.needAlphaBlendingForMesh(mesh)).toBe(alphaMode === MaterialAlphaMode.BLEND);
                expect(mesh.material!.needAlphaTestingForMesh(mesh)).toBe(alphaMode === MaterialAlphaMode.MASK);
            }
        }
        expect(retro.transparencyMode).toBe(opaque ? Material.MATERIAL_OPAQUE : alphaMode === MaterialAlphaMode.MASK ? Material.MATERIAL_ALPHATEST : Material.MATERIAL_ALPHABLEND);
    });

    it.each([
        { name: "thin-walled transmission", transmissionFactor: 1, volume: undefined, derivedTint: true },
        { name: "volume without attenuation", transmissionFactor: 1, volume: { thicknessFactor: 1 }, derivedTint: true },
        {
            name: "attenuating volume",
            transmissionFactor: 1,
            volume: { thicknessFactor: 1, attenuationDistance: 1, attenuationColor: [0.2, 0.4, 0.6] },
            derivedTint: false,
        },
        { name: "zero transmission", transmissionFactor: 0, volume: undefined, derivedTint: true },
    ])("preserves converted transmission tint during $name playback", async ({ transmissionFactor, volume, derivedTint }) => {
        vi.spyOn(ProceduralTexture.prototype, "executeWhenReady").mockImplementation(function (this: ProceduralTexture, callback) {
            callback(this);
        });
        vi.spyOn(ProceduralTexture.prototype, "render").mockImplementation(() => {});
        const gltf = JSON.parse(
            buildAnimatedMaterialsGltf("pbrMetallicRoughness/baseColorFactor", [1, 1, 1, 1, 1, 0, 0, 1], "VEC4", {
                KHR_materials_transmission: { transmissionFactor },
                ...(volume ? { KHR_materials_volume: volume } : {}),
            })
        ) as IGLTF;
        for (const material of gltf.materials!) {
            delete material.pbrMetallicRoughness!.baseColorTexture;
        }
        let completion: Promise<void> | undefined;
        const observer = SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            if (plugin instanceof GLTFFileLoader) {
                completion = plugin.whenCompleteAsync();
            }
        });
        let result;
        try {
            result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
            await completion;
        } finally {
            SceneLoader.OnPluginActivatedObservable.remove(observer);
        }
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
        expect(retro).toBeInstanceOf(OpenPBRMaterial);
        expect(ordinary).toBeInstanceOf(PBRMaterial);
        expect(retro.transmissionWeight).toBe(transmissionFactor);
        const initialTint = retro.transmissionColor.clone();
        const group = result.animationGroups[0];
        expect(group.isStarted).toBe(true);
        group.pause();
        for (const frame of [0, 15, 30, 60]) {
            group.goToFrame(frame);
            expect(retro.baseColor.asArray()).toEqual(ordinary.albedoColor.asArray());
            expect(retro.baseColor.r).toBeCloseTo(1);
            expect(retro.baseColor.g).toBeCloseTo(1 - frame / 60);
            expect(retro.baseColor.b).toBeCloseTo(1 - frame / 60);
            expect(retro.transmissionColor.asArray()).toEqual((derivedTint ? retro.baseColor : initialTint).asArray());
        }
    });

    it.each(["baseColorTexture", "metallicRoughnessTexture"])("plays every %s transform on mixed OpenPBR and PBR materials", async (textureName) => {
        for (const transform of ["offset", "scale", "rotation"]) {
            const rotation = transform === "rotation";
            const values = rotation ? [0, 1] : transform === "scale" ? [1, 1, 2, 3] : [0, 0, 0.5, 0.75];
            const pointer = `pbrMetallicRoughness/${textureName}/extensions/KHR_texture_transform/${transform}`;
            const result = await ImportMeshAsync(`data:${buildAnimatedMaterialsGltf(pointer, values, rotation ? "SCALAR" : "VEC2")}`, scene, {
                pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } },
            });
            const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
            const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
            const group = result.animationGroups[0];
            expect(group.isStarted).toBe(true);
            group.pause();
            group.goToFrame(30);

            const retroTexture = textureName === "baseColorTexture" ? retro.baseColorTexture! : retro.baseMetalnessTexture!;
            const ordinaryTexture = textureName === "baseColorTexture" ? ordinary.albedoTexture! : ordinary.metallicTexture!;
            const properties = rotation ? (["wAng"] as const) : transform === "scale" ? (["uScale", "vScale"] as const) : (["uOffset", "vOffset"] as const);
            for (let index = 0; index < properties.length; index++) {
                const property = properties[index];
                const expected = rotation ? -0.5 : (values[index] + values[index + 2]) / 2;
                expect(retroTexture[property]).toBeCloseTo(expected);
                expect(ordinaryTexture[property]).toBeCloseTo(expected);
                if (textureName === "metallicRoughnessTexture") {
                    expect(retro.specularRoughnessTexture![property]).toBeCloseTo(expected);
                }
            }
            group.dispose();
        }
    });

    it.each([
        ["normalTexture/scale", "bumpTexture.level", "geometryNormalTexture.level"],
        ["occlusionTexture/strength", "ambientTextureStrength", "ambientOcclusionTexture.level"],
        ["extensions/KHR_materials_anisotropy/anisotropyStrength", "anisotropy.intensity", "specularRoughnessAnisotropy"],
        ["extensions/KHR_materials_anisotropy/anisotropyRotation", "anisotropy.angle", "geometryTangentAngle"],
        ["extensions/KHR_materials_clearcoat/clearcoatFactor", "clearCoat.intensity", "coatWeight"],
        ["extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor", "clearCoat.roughness", "coatRoughness"],
        ["extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale", "clearCoat.bumpTexture.level", "geometryCoatNormalTexture.level"],
        ["extensions/KHR_materials_dispersion/dispersion", "subSurface.dispersion", "transmissionDispersionScale"],
        ["extensions/KHR_materials_emissive_strength/emissiveStrength", "emissiveIntensity", "emissionLuminance"],
        ["extensions/KHR_materials_ior/ior", "indexOfRefraction", "specularIor"],
        ["extensions/KHR_materials_iridescence/iridescenceFactor", "iridescence.intensity", "thinFilmWeight"],
        ["extensions/KHR_materials_iridescence/iridescenceIor", "iridescence.indexOfRefraction", "thinFilmIor"],
        ["extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "iridescence.minimumThickness", "thinFilmThicknessMin"],
        ["extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "iridescence.maximumThickness", "thinFilmThickness"],
        ["extensions/KHR_materials_sheen/sheenRoughnessFactor", "sheen.roughness", "fuzzRoughness"],
        ["extensions/KHR_materials_specular/specularFactor", "metallicF0Factor", "specularWeight"],
        ["extensions/KHR_materials_transmission/transmissionFactor", "subSurface.refractionIntensity", "transmissionWeight"],
        ["extensions/KHR_materials_volume/attenuationDistance", "subSurface.tintColorAtDistance", "transmissionDepth"],
        ["extensions/KHR_materials_volume/thicknessFactor", "subSurface.maximumThickness", "geometryThickness"],
        ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor", "subSurface.translucencyIntensity", "subsurfaceWeight"],
    ])("selects scalar paths and spline units for %s per loaded material", (pointer, pbrPath, openPbrPath) => {
        _RegisterKHRAnimationPointerData();
        const openPbr = new OpenPBRMaterial("retro", scene);
        const pbr = new PBRMaterial("ordinary", scene);
        prepareTexture(openPbr, openPbrPath, scene);
        prepareTexture(pbr, pbrPath, scene);
        const target: IMaterial = {
            index: 0,
            _data: {
                0: { babylonMaterial: openPbr, babylonMeshes: [], promise: Promise.resolve() },
                1: { babylonMaterial: pbr, babylonMeshes: [], promise: Promise.resolve() },
            },
        };
        const info = GetMappingForKey(`/materials/{}/${pointer}`)!.interpolation![0];
        const isRotation = pointer.endsWith("anisotropyRotation");
        const keys = [
            { frame: 0, value: isRotation ? 0.2 : 200, inTangent: 0.4, outTangent: 0.4 },
            { frame: 60, value: isRotation ? 0.8 : 800, inTangent: 0.4, outTangent: 0.4 },
        ];
        const animations = info.buildAnimations(target, "material", 60, keys);
        expect(animations.map(({ babylonAnimation }) => babylonAnimation.targetProperty)).toEqual([openPbrPath.endsWith(".level") ? "level" : openPbrPath, pbrPath]);
        const scale = pointer.includes("iridescenceThickness") ? 0.001 : 1;
        expect(animations[0].babylonAnimation.getKeys()[0].outTangent).toBeCloseTo(0.4 * scale);
        expect(animations[1].babylonAnimation.getKeys()[0].outTangent).toBeCloseTo(0.4);
        expect(keys[0].value).toBe(isRotation ? 0.2 : 200);

        const group = new AnimationGroup("mapping", scene);
        for (const { babylonAnimation, babylonAnimatable } of animations) {
            group.addTargetedAnimation(babylonAnimation, babylonAnimatable);
        }
        group.start().pause().goToFrame(30);
        expect(getProperty(openPbr, openPbrPath)).toBeCloseTo((isRotation ? 0.5 : 500) * scale);
        expect(getProperty(pbr, pbrPath)).toBeCloseTo(isRotation ? 0.5 : 500);
    });

    it.each([
        ["normalTexture", "bumpTexture", "geometryNormalTexture"],
        ["occlusionTexture", "ambientTexture", "ambientOcclusionTexture"],
        ["emissiveTexture", "emissiveTexture", "emissionColorTexture"],
        ["extensions/KHR_materials_anisotropy/anisotropyTexture", "anisotropy.texture", "geometryTangentTexture"],
        ["extensions/KHR_materials_clearcoat/clearcoatTexture", "clearCoat.texture", "coatWeightTexture"],
        ["extensions/KHR_materials_clearcoat/clearcoatNormalTexture", "clearCoat.bumpTexture", "geometryCoatNormalTexture"],
        ["extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture", "clearCoat.textureRoughness", "coatRoughnessTexture"],
        ["extensions/KHR_materials_iridescence/iridescenceTexture", "iridescence.texture", "thinFilmWeightTexture"],
        ["extensions/KHR_materials_iridescence/iridescenceThicknessTexture", "iridescence.thicknessTexture", "thinFilmThicknessTexture"],
        ["extensions/KHR_materials_sheen/sheenColorTexture", "sheen.texture", "fuzzColorTexture"],
        ["extensions/KHR_materials_sheen/sheenRoughnessTexture", "sheen.textureRoughness", "fuzzRoughnessTexture"],
        ["extensions/KHR_materials_specular/specularTexture", "metallicReflectanceTexture", "specularWeightTexture"],
        ["extensions/KHR_materials_specular/specularColorTexture", "reflectanceTexture", "specularColorTexture"],
        ["extensions/KHR_materials_transmission/transmissionTexture", "subSurface.refractionIntensityTexture", "transmissionWeightTexture"],
        ["extensions/KHR_materials_volume/thicknessTexture", "subSurface.thicknessTexture", "geometryThicknessTexture"],
        ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture", "subSurface.translucencyIntensityTexture", "subsurfaceWeightTexture"],
        ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture", "subSurface.translucencyColorTexture", "subsurfaceColorTexture"],
    ])("selects texture transform paths for %s per loaded material", (pointer, pbrPath, openPbrPath) => {
        _RegisterKHRAnimationPointerData();
        const openPbr = new OpenPBRMaterial("retro", scene);
        const pbr = new PBRMaterial("ordinary", scene);
        prepareTexture(openPbr, `${openPbrPath}.uOffset`, scene);
        prepareTexture(pbr, `${pbrPath}.uOffset`, scene);
        const target: IMaterial = {
            index: 0,
            _data: {
                0: { babylonMaterial: openPbr, babylonMeshes: [], promise: Promise.resolve() },
                1: { babylonMaterial: pbr, babylonMeshes: [], promise: Promise.resolve() },
            },
        };
        const group = new AnimationGroup("texture mapping", scene);
        for (const transform of ["scale", "offset", "rotation"]) {
            const infos = GetMappingForKey(`/materials/{}/${pointer}/extensions/KHR_texture_transform/${transform}`)!.interpolation!;
            for (const info of infos) {
                const source = new Float32Array([0.2, 0.4, 0.8, 1]);
                const keys = [
                    { frame: 0, value: info.getValue(target, source, 0, 1) },
                    { frame: 60, value: info.getValue(target, source, info.getStride(target), 1) },
                ];
                for (const { babylonAnimation, babylonAnimatable } of info.buildAnimations(target, "texture", 60, keys)) {
                    group.addTargetedAnimation(babylonAnimation, babylonAnimatable);
                }
            }
        }
        group.start().pause().goToFrame(30);
        for (const [property, expected] of [
            ["uScale", 0.5],
            ["vScale", 0.7],
            ["uOffset", 0.5],
            ["vOffset", 0.7],
            ["wAng", -0.3],
        ] as const) {
            expect(getProperty(openPbr, `${openPbrPath}.${property}`)).toBeCloseTo(expected);
            expect(getProperty(pbr, `${pbrPath}.${property}`)).toBeCloseTo(expected);
        }
    });

    it.each(["iridescenceThicknessMinimum", "iridescenceThicknessMaximum"])("loads and plays %s with cubic spline unit conversion", async (property) => {
        const gltf = buildAnimatedMaterialsGltf(
            `extensions/KHR_materials_iridescence/${property}`,
            [0, 200, 24, 12, 800, 0],
            "SCALAR",
            { KHR_materials_iridescence: { iridescenceFactor: 1 } },
            true
        );
        const result = await ImportMeshAsync(`data:${gltf}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
        result.animationGroups[0].pause().goToFrame(30);
        expect(property === "iridescenceThicknessMinimum" ? retro.thinFilmThicknessMin : retro.thinFilmThickness).toBeCloseTo(0.5015);
        expect(property === "iridescenceThicknessMinimum" ? ordinary.iridescence.minimumThickness : ordinary.iridescence.maximumThickness).toBeCloseTo(501.5);
    });

    it("loads and animates specular textures that share an image", async () => {
        const textureInfo = { index: 0, extensions: { KHR_texture_transform: {} } };
        const gltf = buildAnimatedMaterialsGltf("extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", [0, 0, 1, 0.5], "VEC2", {
            KHR_materials_specular: { specularTexture: textureInfo, specularColorTexture: textureInfo },
        });
        const result = await ImportMeshAsync(`data:${gltf}`, scene, { pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } } });
        const retro = result.meshes.find((mesh) => mesh.material?.name === "retro")!.material as OpenPBRMaterial;
        const ordinary = result.meshes.find((mesh) => mesh.material?.name === "ordinary")!.material as PBRMaterial;
        result.animationGroups[0].pause().goToFrame(30);
        expect(retro.specularWeightTexture!.uOffset).toBeCloseTo(0.5);
        expect(retro.specularWeightTexture!.vOffset).toBeCloseTo(0.25);
        expect(ordinary.metallicReflectanceTexture!.uOffset).toBeCloseTo(0.5);
        expect(ordinary.metallicReflectanceTexture!.vOffset).toBeCloseTo(0.25);
    });

    it("animates specular weight when the adapter packs it into the specular-color texture", () => {
        _RegisterKHRAnimationPointerData();
        const material = new OpenPBRMaterial("retro", scene);
        const adapter = new OpenPBRMaterialLoadingAdapter(material);
        const texture = new Texture(null, scene);
        adapter.specularWeightTexture = texture;
        adapter.specularColorTexture = texture;
        expect(material._useSpecularWeightFromSpecularColorTexture).toBe(true);
        expect(material.specularWeightTexture).toBeNull();
        const target: IMaterial = { index: 0, _data: { 0: { babylonMaterial: material, babylonMeshes: [], promise: Promise.resolve() } } };
        const info = GetMappingForKey("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset")!.interpolation![0];
        const [{ babylonAnimation, babylonAnimatable }] = info.buildAnimations(target, "packed", 60, [
            { frame: 0, value: 0 },
            { frame: 60, value: 1 },
        ]);
        const group = new AnimationGroup("packed", scene);
        group.addTargetedAnimation(babylonAnimation, babylonAnimatable);
        group.start().pause().goToFrame(30);
        expect(babylonAnimation.targetProperty).toBe("uOffset");
        expect(material.specularColorTexture!.uOffset).toBeCloseTo(0.5);
    });

    it.each([
        ["emissiveFactor", "emissiveColor", "emissionColor"],
        ["extensions/KHR_materials_sheen/sheenColorFactor", "sheen.color", "fuzzColor"],
        ["extensions/KHR_materials_specular/specularColorFactor", "metallicReflectanceColor", "specularColor"],
        ["extensions/KHR_materials_volume/attenuationColor", "subSurface.tintColor", "transmissionColor"],
        ["extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor", "subSurface.translucencyColor", "subsurfaceColor"],
    ])("plays color animation for %s per loaded material", (pointer, pbrPath, openPbrPath) => {
        _RegisterKHRAnimationPointerData();
        const openPbr = new OpenPBRMaterial("retro", scene);
        const pbr = new PBRMaterial("ordinary", scene);
        const target: IMaterial = {
            index: 0,
            _data: {
                0: { babylonMaterial: openPbr, babylonMeshes: [], promise: Promise.resolve() },
                1: { babylonMaterial: pbr, babylonMeshes: [], promise: Promise.resolve() },
            },
        };
        const info = GetMappingForKey(`/materials/{}/${pointer}`)!.interpolation![0];
        const source = new Float32Array([0.2, 0.4, 0.6, 0.8, 1, 0.2]);
        const keys = [
            { frame: 0, value: info.getValue(target, source, 0, 1) },
            { frame: 60, value: info.getValue(target, source, 3, 1) },
        ];
        const group = new AnimationGroup("color mapping", scene);
        for (const { babylonAnimation, babylonAnimatable } of info.buildAnimations(target, "color", 60, keys)) {
            group.addTargetedAnimation(babylonAnimation, babylonAnimatable);
        }
        group.start().pause().goToFrame(30);
        const actualOpenPbr = getProperty(openPbr, openPbrPath);
        const actualPbr = getProperty(pbr, pbrPath);
        expect(actualOpenPbr).toBeInstanceOf(Color3);
        expect(actualPbr).toBeInstanceOf(Color3);
        if (!(actualOpenPbr instanceof Color3) || !(actualPbr instanceof Color3)) {
            throw new Error("Expected color animation values");
        }
        expect(actualOpenPbr.asArray()).toEqual(actualPbr.asArray());
        expect(actualOpenPbr.r).toBeCloseTo(0.5);
        expect(actualOpenPbr.g).toBeCloseTo(0.7);
        expect(actualOpenPbr.b).toBeCloseTo(0.4);
    });
});
