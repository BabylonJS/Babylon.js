import { describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh.pure";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Scene } from "core/scene";
import "core/Meshes/meshBuilder";

describe("MeshBuilder side effects", () => {
    it("registers legacy Mesh creation functions", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const createSphere = Object.getOwnPropertyDescriptor(Mesh, "CreateSphere")?.value;

            expect(createSphere).toBeTypeOf("function");
            expect(() => Reflect.apply(createSphere, Mesh, ["sphere", 8, 1, scene])).not.toThrow();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("registers legacy tiled VertexData creation functions", () => {
        expect(() => VertexData.CreateTiledPlane({})).not.toThrow();
        expect(() => VertexData.CreateTiledBox({})).not.toThrow();
    });
});
