import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import { GetGLTFValueByUniqueId } from "loaders/glTF/2.0/glTFUniqueIds";
import "loaders/glTF/2.0/glTFLoader";

describe("glTF 2.1 unique IDs", () => {
    it("resolves case-sensitive IDs to arbitrary JSON values", () => {
        const node = { name: "node", extras: { "a/b": { "~value": null } } };
        const gltf = {
            nodes: [node],
            uniqueIds: {
                Node: { pointer: "/nodes/0" },
                name: { pointer: "/nodes/0/name" },
                nested: { pointer: "/nodes/0/extras/a~1b/~0value" },
                "also-node": { pointer: "/nodes/0" },
            },
        };
        expect(GetGLTFValueByUniqueId(gltf, "Node")).toBe(node);
        expect(GetGLTFValueByUniqueId(gltf, "also-node")).toBe(node);
        expect(GetGLTFValueByUniqueId(gltf, "name")).toBe("node");
        expect(GetGLTFValueByUniqueId(gltf, "nested")).toBeNull();
        expect(GetGLTFValueByUniqueId(gltf, "node")).toBeUndefined();
        expect(GetGLTFValueByUniqueId(gltf, "toString")).toBeUndefined();
        expect(GetGLTFValueByUniqueId({}, "missing")).toBeUndefined();
    });

    it.each(["", "nodes/0", "/uniqueIds/id", "/nodes/00", "/nodes/1", "/nodes/0/~2", "/nodes/0/toString"])("rejects an invalid or unresolved pointer %s", (pointer) => {
        const gltf = { nodes: [{}], uniqueIds: { id: { pointer } } };
        expect(() => GetGLTFValueByUniqueId(gltf, "id")).toThrow();
    });

    it("resolves IDs from the loader's parsed document", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new GLTFFileLoader();
        const node = { name: "target" };
        let target: unknown;
        loader.onParsedObservable.add((data) => {
            target = GetGLTFValueByUniqueId(data.json, "stable-id");
        });
        try {
            await loader.loadAsync(scene, { json: { asset: { version: "2.1" }, nodes: [node], uniqueIds: { "stable-id": { pointer: "/nodes/0" } } }, bin: null }, "");
            expect(target).toBe(node);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
