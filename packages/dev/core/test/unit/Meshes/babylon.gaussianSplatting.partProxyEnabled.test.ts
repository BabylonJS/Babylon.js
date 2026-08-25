import { BoundingInfo } from "core/Culling/boundingInfo";
import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingPartProxyMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingPartProxyMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("GaussianSplattingPartProxyMesh enabled state", () => {
    let engine: NullEngine;
    let scene: Scene;
    let compound: GaussianSplattingMesh;
    let proxy: GaussianSplattingPartProxyMesh;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
        compound = new GaussianSplattingMesh("compound", null, scene);
        proxy = new GaussianSplattingPartProxyMesh("part", scene, compound, 0, new BoundingInfo(Vector3.Zero(), Vector3.One()), 1, 0);
        proxy.visibility = 0.25;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("hides the part while disabled and restores its visibility when re-enabled", () => {
        proxy.setEnabled(false);

        expect(compound.getPartVisibility(0)).toBe(0);
        proxy.visibility = 0.5;
        expect(proxy.visibility).toBe(0.5);
        expect(compound.getPartVisibility(0)).toBe(0);

        proxy.setEnabled(true);

        expect(compound.getPartVisibility(0)).toBe(0.5);
    });

    it("tracks enabled state inherited from an ancestor", () => {
        const parent = new TransformNode("parent", scene);
        proxy.parent = parent;

        parent.setEnabled(false);
        expect(compound.getPartVisibility(0)).toBe(0);

        parent.setEnabled(true);
        expect(compound.getPartVisibility(0)).toBe(0.25);
    });
});
