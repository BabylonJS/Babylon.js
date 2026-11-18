import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import { type IGLTF } from "loaders/glTF/2.0/glTFLoaderInterfaces";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/KHR_lights_punctual";
import "loaders/glTF/2.0/Extensions/KHR_node_visibility";
import "loaders/glTF/2.0/Extensions/EXT_lights_area";
import "loaders/glTF/2.0/Extensions/EXT_lights_ies";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";

describe("glTF 2.1 node visibility", () => {
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

    it("hides descendant meshes and lights but not cameras, and preserves local visibility when toggled", async () => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(values.buffer);
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["KHR_lights_punctual", "EXT_lights_area"],
                extensions: { KHR_lights_punctual: { lights: [{ type: "point" }] }, EXT_lights_area: { lights: [{ type: "rect" }] } },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "parent", visible: false, children: [1, 2, 3, 4] },
                    { name: "mesh", visible: true, mesh: 0 },
                    { name: "light", extensions: { KHR_lights_punctual: { light: 0 } } },
                    { name: "camera", camera: 0 },
                    { name: "area", extensions: { EXT_lights_area: { light: 0 } } },
                ],
                cameras: [{ type: "perspective", perspective: { yfov: 1, znear: 0.1 } }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: bytes.byteLength }],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((entry) => entry.name === "mesh")!;
        const light = container.lights[0];
        const area = container.lights[1];
        const camera = container.cameras[0];
        expect(mesh.isVisible).toBe(false);
        expect(light.isEnabled()).toBe(false);
        expect(area.isEnabled()).toBe(false);
        expect(camera.isEnabled()).toBe(true);

        const converter = GetPathToObjectConverter(data.json as IGLTF);
        const parent = converter.convert("/nodes/0/visible");
        const child = converter.convert("/nodes/1/visible");
        expect(parent.info.get(parent.object)).toBe(false);
        expect(child.info.get(child.object)).toBe(true);
        parent.info.set!(true, parent.object);
        expect(mesh.isVisible).toBe(true);
        expect(light.isEnabled()).toBe(true);
        expect(area.isEnabled()).toBe(true);
        child.info.set!(false, child.object);
        parent.info.set!(false, parent.object);
        parent.info.set!(true, parent.object);
        expect(child.info.get(child.object)).toBe(false);
        expect(mesh.isVisible).toBe(false);
        expect(light.isEnabled()).toBe(true);
        expect(camera.isEnabled()).toBe(true);
        light.setEnabled(false);
        parent.info.set!(false, parent.object);
        parent.info.set!(true, parent.object);
        expect(light.isEnabled()).toBe(false);
    });

    it("uses the core property ahead of the extension and keeps their pointers in sync", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["KHR_node_visibility"],
                scene: 0,
                scenes: [{ nodes: [0, 1] }],
                nodes: [{ visible: true, extensions: { KHR_node_visibility: { visible: false } } }, { extensions: { KHR_node_visibility: { visible: false } } }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        expect(container.transformNodes.map((node) => node.isVisible)).toEqual([true, false]);
        const converter = GetPathToObjectConverter(data.json as IGLTF);
        const core = converter.convert("/nodes/0/visible");
        const extension = converter.convert("/nodes/0/extensions/KHR_node_visibility/visible");
        expect(core.info.get(core.object)).toBe(true);
        expect(extension.info.get(extension.object)).toBe(true);
        extension.info.set!(false, extension.object);
        expect(core.info.get(core.object)).toBe(false);
        expect(container.transformNodes[0].isVisible).toBe(false);
    });

    it("ignores a disabled visibility extension", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["KHR_node_visibility"],
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ extensions: { KHR_node_visibility: { visible: false } } }],
            },
        };
        const loader = new GLTFFileLoader();
        loader.extensionOptions.KHR_node_visibility = { enabled: false };
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        expect(container.transformNodes[0].isVisible).toBe(true);
    });

    it("uses the glTF hierarchy for skinned meshes reparented to a skeleton", async () => {
        const bytes = new Uint8Array(96);
        new Float32Array(bytes.buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        new Float32Array(bytes.buffer, 48, 12).set([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0, 2] }],
                nodes: [{ name: "parent", visible: false, children: [1] }, { name: "skinned", mesh: 0, skin: 0 }, { name: "joint" }],
                skins: [{ joints: [2], skeleton: 2 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }] }],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5121, count: 3, type: "VEC4" },
                    { bufferView: 2, componentType: 5126, count: 3, type: "VEC4" },
                ],
                bufferViews: [
                    { buffer: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 12 },
                    { buffer: 0, byteOffset: 48, byteLength: 48 },
                ],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((entry) => entry.name === "skinned")!;
        expect(mesh.isVisible).toBe(false);
        const parent = GetPathToObjectConverter(data.json as IGLTF).convert("/nodes/0/visible");
        parent.info.set!(true, parent.object);
        expect(mesh.isVisible).toBe(true);
    });

    it("hides every primitive without overriding a mesh hidden by the application", async () => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(values.buffer);
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "parent", visible: false, children: [1] },
                    { name: "mesh", mesh: 0 },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }, { attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: bytes.byteLength }],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const loader = new GLTFFileLoader();
        loader.onMeshLoadedObservable.add((mesh) => {
            if (mesh.name.startsWith("mesh_primitive")) {
                mesh.inheritVisibility = true;
            }
            if (mesh.name === "mesh_primitive0") {
                mesh.isVisible = false;
            }
        });
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const first = container.meshes.find((mesh) => mesh.name === "mesh_primitive0")!;
        const second = container.meshes.find((mesh) => mesh.name === "mesh_primitive1")!;
        expect(first.isVisible).toBe(false);
        expect(second.isVisible).toBe(false);
        const parent = GetPathToObjectConverter(data.json as IGLTF).convert("/nodes/0/visible");
        parent.info.set!(true, parent.object);
        expect(first.isVisible).toBe(false);
        expect(second.isVisible).toBe(true);
        second.isVisible = false;
        parent.info.set!(false, parent.object);
        expect(first.isVisible).toBe(false);
        expect(second.isVisible).toBe(false);
        parent.info.set!(true, parent.object);
        expect(first.isVisible).toBe(false);
        expect(second.isVisible).toBe(false);
    });

    it("hides and restores photometric lights", async () => {
        const profile = btoa(["IESNA:LM-63-2002", "TILT=NONE", "1 1000 1 2 2 1 1 1 1 1", "1 1 1", "0 180", "0 360", "1 1", "1 1"].join("\n"));
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["EXT_lights_ies"],
                extensions: { EXT_lights_ies: { lights: [{ uri: `data:application/octet-stream;base64,${profile}` }] } },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ visible: false, children: [1] }, { extensions: { EXT_lights_ies: { light: 0 } } }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        expect(container.lights[0].isEnabled()).toBe(false);
        const parent = GetPathToObjectConverter(data.json as IGLTF).convert("/nodes/0/visible");
        parent.info.set!(true, parent.object);
        expect(container.lights[0].isEnabled()).toBe(true);
    });

    it("restores local visibility under an application-hidden parent", async () => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(values.buffer);
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "parent", mesh: 0, children: [1] },
                    { name: "child", mesh: 0, visible: false },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: bytes.byteLength }],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const loader = new GLTFFileLoader();
        loader.onMeshLoadedObservable.add((mesh) => {
            if (mesh.name === "parent") {
                mesh.isVisible = false;
            } else if (mesh.name === "child") {
                mesh.inheritVisibility = true;
            }
        });
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const parent = container.meshes.find((mesh) => mesh.name === "parent")!;
        const child = container.meshes.find((mesh) => mesh.name === "child")!;
        const visibility = GetPathToObjectConverter(data.json as IGLTF).convert("/nodes/1/visible");
        visibility.info.set!(true, visibility.object);
        expect(child.isVisible).toBe(false);
        parent.isVisible = true;
        expect(child.isVisible).toBe(true);
    });

    it.each(["core", "extension"])("animates %s visibility through the glTF hierarchy", async (form) => {
        const bytes = new Uint8Array(64);
        new Float32Array(bytes.buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        new Float32Array(bytes.buffer, 36, 3).set([0, 1, 2]);
        bytes.set([1, 0, 2], 48);
        const pointer = form === "core" ? "/nodes/0/visible" : "/nodes/0/extensions/KHR_node_visibility/visible";
        const data = {
            json: {
                asset: { version: form === "core" ? "2.1" : "2.0" },
                extensionsUsed: ["KHR_animation_pointer", "KHR_lights_punctual", ...(form === "extension" ? ["KHR_node_visibility"] : [])],
                extensions: { KHR_lights_punctual: { lights: [{ type: "point" }] } },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "parent", children: [1, 2], ...(form === "extension" ? { extensions: { KHR_node_visibility: { visible: true } } } : {}) },
                    { name: "mesh", mesh: 0 },
                    { extensions: { KHR_lights_punctual: { light: 0 } } },
                ],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                buffers: [{ byteLength: bytes.byteLength }],
                bufferViews: [
                    { buffer: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 12 },
                    { buffer: 0, byteOffset: 48, byteLength: 3 },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5126, count: 3, type: "SCALAR", min: [0], max: [2] },
                    { bufferView: 2, componentType: 5121, count: 3, type: "SCALAR" },
                ],
                animations: [
                    {
                        samplers: [{ input: 1, output: 2, interpolation: "STEP" }],
                        channels: [{ sampler: 0, target: { path: "pointer", extensions: { KHR_animation_pointer: { pointer } } } }],
                    },
                ],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const loader = new GLTFFileLoader();
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((entry) => entry.name === "mesh")!;
        const light = container.lights[0];
        const group = container.animationGroups[0];
        const path = GetPathToObjectConverter(data.json as IGLTF).convert(pointer);
        group.play();
        group.goToFrame(60);
        expect(path.info.get(path.object)).toBe(false);
        expect(mesh.isVisible).toBe(false);
        expect(light.isEnabled()).toBe(false);
        group.goToFrame(120);
        expect(path.info.get(path.object)).toBe(true);
        expect(mesh.isVisible).toBe(true);
        expect(light.isEnabled()).toBe(true);
    });
});
