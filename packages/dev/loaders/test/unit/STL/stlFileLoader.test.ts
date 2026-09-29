import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { STLFileLoader } from "loaders/STL/stlFileLoader.pure";

function Solid(name: string): string {
    return `solid ${name}\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid ${name}\n`;
}

const ThreeSolids = Solid("a") + Solid("b") + Solid("c");

function BinaryStl(): ArrayBuffer {
    // 80 byte header, triangle count, then 50 bytes per triangle
    const buffer = new ArrayBuffer(84 + 50);
    const view = new DataView(buffer);
    view.setUint32(80, 1, true);
    view.setFloat32(84 + 12 + 12, 1, true);
    view.setFloat32(84 + 12 + 28, 1, true);
    return buffer;
}

describe("STLFileLoader", () => {
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

    function importNames(meshesNames: string | readonly string[] | null, data: string | ArrayBuffer = ThreeSolids): string[] {
        const meshes: AbstractMesh[] = [];
        new STLFileLoader().importMesh(meshesNames, scene, data, "", meshes);
        return meshes.map((mesh) => mesh.name);
    }

    it("imports every solid when no names are given", () => {
        expect(importNames(null)).toEqual(["a", "b", "c"]);
    });

    it("imports only the solid matching a single name", () => {
        expect(importNames("b")).toEqual(["b"]);
    });

    it("imports only the solids listed in an array of names", () => {
        expect(importNames(["a", "c"])).toEqual(["a", "c"]);
    });

    it("imports nothing for an empty array of names", () => {
        expect(importNames([])).toEqual([]);
    });

    it("applies the filter to an unnamed solid under its default name", () => {
        const data = Solid("") + Solid("b");
        expect(importNames([], data)).toEqual([]);
        expect(importNames(["b"], data)).toEqual(["b"]);
        expect(importNames("b", data)).toEqual(["b"]);
        expect(importNames(["stlmesh"], data)).toEqual(["stlmesh"]);
        expect(importNames(null, data)).toEqual(["stlmesh", "b"]);
    });

    it("applies the filter to a binary STL under its default name", () => {
        expect(importNames([], BinaryStl())).toEqual([]);
        expect(importNames(["a"], BinaryStl())).toEqual([]);
        expect(importNames(["stlmesh"], BinaryStl())).toEqual(["stlmesh"]);
        expect(importNames(null, BinaryStl())).toEqual(["stlmesh"]);
    });
});
