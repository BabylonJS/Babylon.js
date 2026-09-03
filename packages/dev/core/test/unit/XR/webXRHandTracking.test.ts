import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh.pure";
import { Scene } from "core/scene.pure";
import { RegisterWebXRHandTracking } from "core/XR/features/WebXRHandTracking.pure";
import { describe, expect, it } from "vitest";

describe("WebXRHandTracking", () => {
    it("registers the instanced meshes required for default joint meshes", () => {
        RegisterWebXRHandTracking();
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const source = new Mesh("source", scene);

        expect(source.createInstance("joint")).toBeDefined();

        scene.dispose();
        engine.dispose();
    });
});
