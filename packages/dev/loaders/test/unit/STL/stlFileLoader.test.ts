import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { STLFileLoader } from "loaders/STL/stlFileLoader.pure";

function Solid(name: string): string {
    return `solid ${name}\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid ${name}\n`;
}

const ThreeSolids = Solid("a") + Solid("b") + Solid("c");

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

    function importNames(meshesNames: string | readonly string[] | null): string[] {
        const meshes: AbstractMesh[] = [];
        new STLFileLoader().importMesh(meshesNames, scene, ThreeSolids, "", meshes);
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
});
