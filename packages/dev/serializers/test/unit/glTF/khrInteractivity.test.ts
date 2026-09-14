import { NullEngine } from "core/Engines/nullEngine";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { GLTF2Export } from "../../../src/glTF/2.0/glTFSerializer";
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
});
