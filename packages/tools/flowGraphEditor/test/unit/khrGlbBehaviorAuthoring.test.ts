import { NullEngine } from "core/Engines/nullEngine";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { GetGlbNodeIndex, PatchKhrSelectionRevealGlb, ReadGlbDocument } from "flow-graph-editor/khrGlbBehaviorAuthoring";
import { CreateKHRInteractivityDocument } from "loaders/glTF/2.0/Extensions/KHR_interactivity/pure";
import { describe, expect, it } from "vitest";

const JsonChunk = 0x4e4f534a;
const BinChunk = 0x004e4942;

function BuildGlb(document: Record<string, unknown>, chunks: Array<{ type: number; data: Uint8Array }> = []): Uint8Array {
    const json = new TextEncoder().encode(JSON.stringify(document));
    const paddedJson = new Uint8Array(Math.ceil(json.length / 4) * 4).fill(0x20);
    paddedJson.set(json);
    const totalLength = 12 + 8 + paddedJson.length + chunks.reduce((length, chunk) => length + 8 + chunk.data.length, 0);
    const result = new Uint8Array(totalLength);
    const view = new DataView(result.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, totalLength, true);
    view.setUint32(12, paddedJson.length, true);
    view.setUint32(16, JsonChunk, true);
    result.set(paddedJson, 20);
    let offset = 20 + paddedJson.length;
    for (const chunk of chunks) {
        view.setUint32(offset, chunk.data.length, true);
        view.setUint32(offset + 4, chunk.type, true);
        result.set(chunk.data, offset + 8);
        offset += 8 + chunk.data.length;
    }
    return result;
}

function SuffixAfterJson(glb: Uint8Array): Uint8Array {
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    return glb.slice(20 + view.getUint32(12, true));
}

function RichSourceDocument() {
    return {
        asset: { version: "2.0", generator: "asset-pipeline" },
        scene: 0,
        scenes: [{ name: "Training assembly", nodes: [0] }],
        nodes: [
            { name: "assembly", children: [1, 2], extras: { stableId: "assembly-01" } },
            { name: "part", mesh: 0, translation: [1, 2, 3], extras: { stableId: "trigger-17" }, extensions: { EXT_vendor_meta: { code: 17 } } },
            { name: "part", mesh: 0, translation: [4, 5, 6], extras: { stableId: "target-23" } },
        ],
        meshes: [
            {
                name: "service part",
                primitives: [{ attributes: { POSITION: 0 }, material: 0, extensions: { KHR_materials_variants: { mappings: [{ material: 1, variants: [0] }] } } }],
            },
        ],
        buffers: [{ byteLength: 36 }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
        materials: [{ name: "Base" }, { name: "Service" }],
        images: [{ name: "untouched-image", uri: "data:image/png;base64,iVBORw0KGgo=" }],
        animations: [{ name: "inspection", samplers: [], channels: [] }],
        extensionsUsed: ["KHR_materials_variants", "EXT_vendor_meta"],
        extensionsRequired: ["KHR_materials_variants"],
        extensions: { KHR_materials_variants: { variants: [{ name: "Service" }] }, EXT_vendor_meta: { opaque: [1, 2, 3] } },
        extras: { stableAssetId: "maintenance-asset-9" },
    };
}

describe("lossless GLB selection behavior authoring", () => {
    it("changes only the behavior fields and preserves names, IDs, hierarchy, materials, variants, resources, BIN, and unknown chunks", () => {
        const sourceDocument = RichSourceDocument();
        const bin = new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
        const vendorChunk = new Uint8Array([10, 20, 30, 40]);
        const source = BuildGlb(sourceDocument, [
            { type: BinChunk, data: bin },
            { type: 0x31525458, data: vendorChunk },
        ]);
        const sourceCopy = source.slice();

        const result = PatchKhrSelectionRevealGlb(source, 1, 2);
        const authored = ReadGlbDocument(result);
        const graph = authored.extensions!.KHR_interactivity as any;
        const validation = CreateKHRInteractivityDocument(graph, new Set(authored.extensionsUsed), authored.nodes!.length);

        expect(source).toEqual(sourceCopy);
        expect(SuffixAfterJson(result)).toEqual(SuffixAfterJson(source));
        expect(validation.diagnostics).toEqual([]);
        expect(validation.graphs[0].valid).toBe(true);
        expect(graph.graphs[0].nodes[0].configuration.nodeIndex.value).toEqual([1]);
        expect(graph.graphs[0].nodes[1].configuration.pointer.value).toEqual(["/nodes/2/extensions/KHR_node_visibility/visible"]);
        expect(authored.nodes![1].extensions!.KHR_node_selectability).toEqual({ selectable: true });
        expect(authored.nodes![2].extensions!.KHR_node_visibility).toEqual({ visible: false });
        expect(authored.extensionsUsed).toEqual([...sourceDocument.extensionsUsed, "KHR_interactivity", "KHR_node_selectability", "KHR_node_visibility"]);
        expect(authored.extensionsRequired).toEqual([...sourceDocument.extensionsRequired, "KHR_interactivity", "KHR_node_selectability", "KHR_node_visibility"]);

        delete authored.extensions!.KHR_interactivity;
        delete authored.nodes![1].extensions!.KHR_node_selectability;
        delete authored.nodes![2].extensions!.KHR_node_visibility;
        delete authored.nodes![2].extensions;
        authored.extensionsUsed = sourceDocument.extensionsUsed;
        authored.extensionsRequired = sourceDocument.extensionsRequired;
        expect(authored).toEqual(sourceDocument);
    });

    it("rejects existing behavior data, conflicting node extensions, ancestor targets, and invalid indices", () => {
        const document = RichSourceDocument();
        const source = BuildGlb(document);
        expect(() => PatchKhrSelectionRevealGlb(source, 1, 1)).toThrow("different glTF nodes");
        expect(() => PatchKhrSelectionRevealGlb(source, 2, 0)).toThrow("ancestor");
        expect(() => PatchKhrSelectionRevealGlb(source, 1, 99)).toThrow("outside");

        const khrSource = BuildGlb({ ...document, extensions: { ...document.extensions, KHR_interactivity: { graphs: [] } } });
        expect(() => PatchKhrSelectionRevealGlb(khrSource, 1, 2)).toThrow("already has a behavior graph");
        const nullKhrSource = BuildGlb({ ...document, extensions: { ...document.extensions, KHR_interactivity: null } });
        expect(() => PatchKhrSelectionRevealGlb(nullKhrSource, 1, 2)).toThrow("already has a behavior graph");
        const customSource = BuildGlb({ ...document, extensions: { ...document.extensions, BABYLON_flow_graph: { flowGraph: {} } } });
        expect(() => PatchKhrSelectionRevealGlb(customSource, 1, 2)).toThrow("already has a behavior graph");
        const conflictingSource = BuildGlb({
            ...document,
            nodes: [document.nodes[0], { ...document.nodes[1], extensions: { KHR_node_selectability: { selectable: false } } }, document.nodes[2]],
        });
        expect(() => PatchKhrSelectionRevealGlb(conflictingSource, 1, 2)).toThrow("selectability");
        expect(() => PatchKhrSelectionRevealGlb(BuildGlb({ ...document, extensionsUsed: "KHR_materials_variants" }), 1, 2)).toThrow("malformed");
        expect(() => PatchKhrSelectionRevealGlb(BuildGlb({ ...document, nodes: [document.nodes[0], { ...document.nodes[1], extensions: [] }, document.nodes[2]] }), 1, 2)).toThrow(
            "malformed"
        );
        expect(source).toEqual(BuildGlb(document));
    });

    it("rejects malformed GLB framing before writing output", () => {
        const source = BuildGlb(RichSourceDocument());
        const wrongLength = source.slice();
        new DataView(wrongLength.buffer).setUint32(8, wrongLength.length + 4, true);
        expect(() => ReadGlbDocument(wrongLength)).toThrow("length");
        const wrongChunk = source.slice();
        new DataView(wrongChunk.buffer).setUint32(16, BinChunk, true);
        expect(() => ReadGlbDocument(wrongChunk)).toThrow("JSON chunk");
        const truncated = source.subarray(0, 18);
        expect(() => ReadGlbDocument(truncated)).toThrow("header");
        const badTrailingChunk = BuildGlb(RichSourceDocument(), [{ type: 0x31525458, data: new Uint8Array([1, 2, 3, 4]) }]);
        new DataView(badTrailingChunk.buffer).setUint32(badTrailingChunk.length - 12, 8, true);
        expect(() => ReadGlbDocument(badTrailingChunk)).toThrow("chunk length");
    });

    it("resolves nested meshes by loader source pointers rather than names or Babylon IDs", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const parent = new TransformNode("part", scene);
        const primitive = CreateBox("part", {}, scene);
        primitive.parent = parent;
        (parent as any)._internalMetadata = { gltf: { pointers: ["/nodes/2"] } };
        (primitive as any)._internalMetadata = { gltf: { pointers: ["/meshes/0/primitives/0"] } };

        expect(GetGlbNodeIndex(primitive, 3)).toBe(2);
        (primitive as any)._internalMetadata.gltf.pointers.push("/nodes/1");
        expect(GetGlbNodeIndex(primitive, 3)).toBe(1);
        (primitive as any)._internalMetadata.gltf.pointers.push("/nodes/2");
        expect(GetGlbNodeIndex(primitive, 3)).toBeUndefined();
        expect(GetGlbNodeIndex(parent, 2)).toBeUndefined();

        scene.dispose();
        engine.dispose();
    });
});
