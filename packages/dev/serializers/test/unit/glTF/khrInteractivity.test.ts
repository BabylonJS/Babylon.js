import { NullEngine } from "core/Engines/nullEngine";
import { TransformNode } from "core/Meshes/transformNode";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Texture } from "core/Materials/Textures/texture";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { GLTF2Export } from "../../../src/glTF/2.0/glTFSerializer";
import { GLTFExporter } from "../../../src/glTF/2.0/glTFExporter";
import { RegisterKHR_interactivity } from "../../../src/glTF/2.0/Extensions/KHR_interactivity.pure";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("KHR_interactivity serializer extension", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        RegisterKHR_interactivity();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("emits the canonical root and companion extensions after node remapping", async () => {
        const node = new TransformNode("interactive", scene);
        const data = await GLTF2Export.GLTFAsync(scene, "interaction", {
            khrInteractivity: {
                required: true,
                additionalExtensionsUsed: ["KHR_node_selectability"],
                additionalExtensionsRequired: ["KHR_node_hoverability"],
                build: (context) => {
                    const nodeIndex = context.getNodeIndex(node);
                    expect(nodeIndex).toBe(0);
                    context.setNodeExtension(nodeIndex!, "KHR_node_selectability", { selectable: true });
                    return {
                        graphs: [{ declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
                    };
                },
            },
        });
        const glTF = JSON.parse(data.files["interaction.gltf"] as string);

        expect(glTF.extensions.KHR_interactivity).toEqual({
            graphs: [{ declarations: [{ op: "event/onStart" }], nodes: [{ declaration: 0 }] }],
        });
        expect(glTF.extensionsUsed).toEqual(["KHR_interactivity", "KHR_node_selectability", "KHR_node_hoverability"]);
        expect(glTF.extensionsRequired).toEqual(["KHR_interactivity", "KHR_node_hoverability"]);
        expect(glTF.nodes[0].extensions.KHR_node_selectability).toEqual({ selectable: true });
    });

    it("does not emit KHR_interactivity without an explicit provider", async () => {
        const data = await GLTF2Export.GLTFAsync(scene, "plain");
        const glTF = JSON.parse(data.files["plain.gltf"] as string);

        expect(glTF.extensions?.KHR_interactivity).toBeUndefined();
        expect(glTF.extensionsUsed).toBeUndefined();
    });

    it("reports an excluded camera as unmapped instead of index -1", async () => {
        const camera = new FreeCamera("excluded", Vector3.Zero(), scene);
        let cameraIndex: number | undefined;
        await GLTF2Export.GLTFAsync(scene, "interaction", {
            shouldExportNode: (node) => node !== camera,
            khrInteractivity: {
                required: false,
                additionalExtensionsUsed: [],
                additionalExtensionsRequired: [],
                build: (context) => {
                    cameraIndex = context.getCameraIndex(camera);
                    return { graphs: [{}] };
                },
            },
        });

        expect(cameraIndex).toBeUndefined();
    });

    it("exposes final root indices for mesh and scene references", async () => {
        const mesh = CreateBox("mesh", {}, scene);
        let meshIndex: number | undefined;
        let sceneIndex: number | undefined;

        await GLTF2Export.GLTFAsync(scene, "interaction", {
            khrInteractivity: {
                required: false,
                additionalExtensionsUsed: [],
                additionalExtensionsRequired: [],
                build: (context) => {
                    meshIndex = context.getRootIndex?.("meshes", mesh);
                    sceneIndex = context.getRootIndex?.("scenes", scene);
                    return { graphs: [{}] };
                },
            },
        });

        expect(meshIndex).toBe(0);
        expect(sceneIndex).toBe(0);
    });

    it("uses a texture source extension when resolving the final image index", () => {
        const exporter = new GLTFExporter(scene);
        const texture = new Texture(null, scene);
        (exporter._materialExporter as any)._textureMap.set(texture.uniqueId, { index: 0 });
        exporter._textures.push({
            source: 0,
            extensions: { KHR_texture_basisu: { source: 1 } },
        });

        expect(exporter._getRootIndex("images", texture)).toBe(1);
        exporter._textures[0].extensions = { EXT_texture_webp: { source: 2 } };
        expect(exporter._getRootIndex("images", texture)).toBe(2);
        delete exporter._textures[0].extensions;
        expect(exporter._getRootIndex("images", texture)).toBe(0);
    });
});
