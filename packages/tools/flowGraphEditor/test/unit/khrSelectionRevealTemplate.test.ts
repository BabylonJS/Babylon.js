import { NullEngine } from "core/Engines/nullEngine";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { CreateKhrSelectionRevealTemplate } from "flow-graph-editor/khrSelectionRevealTemplate";
import { CreateKHRInteractivityDocument } from "loaders/glTF/2.0/Extensions/KHR_interactivity/pure";
import { describe, expect, it } from "vitest";

describe("KHR selection reveal authoring", () => {
    it("uses final glTF node indices and produces a valid graph even when mesh names collide", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const trigger = CreateBox("part", {}, scene);
        const reveal = CreateBox("part", {}, scene);
        const extensions = new Map<string, unknown>();
        const provider = CreateKhrSelectionRevealTemplate(trigger, reveal);

        const result = provider.build({
            getNodeIndex: (node) => (node === trigger ? 7 : node === reveal ? 2 : undefined),
            setNodeExtension: (index, name, value) => extensions.set(`${index}:${name}`, value),
        });
        const document = CreateKHRInteractivityDocument(result, new Set(provider.additionalExtensionsUsed), 8);

        expect(document.diagnostics).toEqual([]);
        expect(document.graphs[0].valid).toBe(true);
        expect(result.graphs[0].nodes[0]).toMatchObject({ configuration: { nodeIndex: { value: [7] } } });
        expect(result.graphs[0].nodes[1]).toMatchObject({ configuration: { pointer: { value: ["/nodes/2/extensions/KHR_node_visibility/visible"] } } });
        expect(extensions).toEqual(
            new Map([
                ["7:KHR_node_selectability", { selectable: true }],
                ["2:KHR_node_visibility", { visible: false }],
            ])
        );
        expect(provider.additionalExtensionsRequired).toEqual(["KHR_node_selectability", "KHR_node_visibility"]);

        scene.dispose();
        engine.dispose();
    });

    it("rejects an unselectable trigger, an ancestor reveal mesh, a disabled target, and omitted nodes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const trigger = CreateBox("trigger", {}, scene);
        const reveal = CreateBox("reveal", {}, scene);

        trigger.isPickable = false;
        expect(() => CreateKhrSelectionRevealTemplate(trigger, reveal)).toThrow("visible, pickable");
        trigger.isPickable = true;
        trigger.parent = reveal;
        expect(() => CreateKhrSelectionRevealTemplate(trigger, reveal)).toThrow("ancestor");
        trigger.parent = null;
        reveal.setEnabled(false);
        expect(() => CreateKhrSelectionRevealTemplate(trigger, reveal)).toThrow("reveal mesh must be enabled");
        reveal.setEnabled(true);
        const provider = CreateKhrSelectionRevealTemplate(trigger, reveal);
        expect(() => provider.build({ getNodeIndex: (node) => (node === trigger ? 0 : undefined), setNodeExtension: () => {} })).toThrow("exported");

        scene.dispose();
        engine.dispose();
    });
});
