import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { OBJFileLoader } from "loaders/OBJ/objFileLoader.pure";
import { OBJFileLoaderMetadata } from "loaders/OBJ/objFileLoader.metadata";

describe("OBJ character encoding", () => {
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

    it("registers OBJ files for binary loading", () => {
        expect(OBJFileLoaderMetadata.extensions[".obj"].isBinary).toBe(true);
    });

    it("decodes a UTF-8 object name by default", async () => {
        const data = new TextEncoder().encode("o \u4e2d\u6587\u7269\u4f53\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n");

        const result = await new OBJFileLoader().importMeshAsync(null, scene, data.buffer, "");

        expect(result.meshes[0].name).toBe("\u4e2d\u6587\u7269\u4f53");
    });

    it("automatically detects a GB18030 object name", async () => {
        const prefix = new TextEncoder().encode("o ");
        // "Chinese object" (four Chinese characters) encoded as GB18030/GBK.
        const encodedName = new Uint8Array([0xd6, 0xd0, 0xce, 0xc4, 0xce, 0xef, 0xcc, 0xe5]);
        const geometry = new TextEncoder().encode("\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n");
        const data = new Uint8Array(prefix.length + encodedName.length + geometry.length);
        data.set(prefix);
        data.set(encodedName, prefix.length);
        data.set(geometry, prefix.length + encodedName.length);

        const result = await new OBJFileLoader().importMeshAsync(null, scene, data.buffer, "");

        expect(result.meshes).toHaveLength(1);
        expect(result.meshes[0].name).toBe("\u4e2d\u6587\u7269\u4f53");
    });

    it("supports an explicitly configured encoding", async () => {
        const prefix = new TextEncoder().encode("o ");
        const encodedName = new Uint8Array([0xd6, 0xd0, 0xce, 0xc4, 0xce, 0xef, 0xcc, 0xe5]);
        const geometry = new TextEncoder().encode("\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n");
        const data = new Uint8Array(prefix.length + encodedName.length + geometry.length);
        data.set(prefix);
        data.set(encodedName, prefix.length);
        data.set(geometry, prefix.length + encodedName.length);

        const result = await new OBJFileLoader({ encoding: "gb18030" }).importMeshAsync(null, scene, data.buffer, "");

        expect(result.meshes[0].name).toBe("\u4e2d\u6587\u7269\u4f53");
    });

    it("keeps direct string input compatible", async () => {
        const data = "o \u4e2d\u6587\u7269\u4f53\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";

        const result = await new OBJFileLoader().importMeshAsync(null, scene, data, "");

        expect(result.meshes[0].name).toBe("\u4e2d\u6587\u7269\u4f53");
    });
});
