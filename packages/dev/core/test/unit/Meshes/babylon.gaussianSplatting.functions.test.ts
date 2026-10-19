import { NullEngine } from "core/Engines/nullEngine";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { _IsGaussianSplattingMesh, IsGaussianSplattingClassName } from "core/Meshes/GaussianSplatting/gaussianSplatting.functions";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

class TestMesh extends AbstractMesh {
    public override getClassName(): string {
        return "TestMesh";
    }
}

class CustomGaussianSplattingMesh extends TestMesh {
    public override get _isGaussianSplatting(): boolean {
        return true;
    }
}

class LegacyGaussianSplattingStream extends TestMesh {
    public override getClassName(): string {
        return "GaussianSplattingStream";
    }
}

describe("Gaussian Splatting classification", () => {
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

    it("preserves the supported class-name checks", () => {
        expect(IsGaussianSplattingClassName("GaussianSplattingMesh")).toBe(true);
        expect(IsGaussianSplattingClassName("GaussianSplattingStream")).toBe(true);
        expect(IsGaussianSplattingClassName("GaussianSplattingMeshBase")).toBe(false);
        expect(IsGaussianSplattingClassName("Mesh")).toBe(false);
    });

    it("recognizes inherited capabilities without requiring a known class name", () => {
        expect(_IsGaussianSplattingMesh(new CustomGaussianSplattingMesh("custom", scene))).toBe(true);
        expect(_IsGaussianSplattingMesh(new TestMesh("ordinary", scene))).toBe(false);
    });

    it("keeps the class-name fallback for legacy implementations", () => {
        expect(_IsGaussianSplattingMesh(new LegacyGaussianSplattingStream("legacy", scene))).toBe(true);
    });
});
