import { describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { LoadAssetContainer } from "core/Loading/Plugins/babylonFileLoader";

// Regression coverage for the 9.8→9.16 tree-shaking (`*.pure.ts`) split, which dropped
// the transitive side-effect registrations that used to make importing the .babylon
// loader enough to load a standard scene. This test imports ONLY the public loader
// entry point (no manual `universalCamera` / `pointLight` / `standardMaterial` /
// `texture` side-effect imports) and asserts that cameras, lights, materials and their
// textures all parse. Before the fix, cameras/lights/materials fell back to defaults or
// threw, and material textures were silently dropped (meshes rendered untextured)
// because `SerializationHelper._TextureParser` was never installed.

function makeBabylonScene(): string {
    return JSON.stringify({
        producer: { name: "Babylon.js", version: "1.0", exporter_version: "1.0" },
        cameras: [{ name: "cam", id: "camId", uniqueId: 1, type: "UniversalCamera", position: [0, 0, -10] }],
        activeCameraID: "camId",
        // Light_Type_0 === PointLight
        lights: [{ name: "point", id: "lightId", uniqueId: 2, type: 0, position: [0, 10, 0] }],
        materials: [
            {
                name: "mat",
                id: "matId",
                uniqueId: 3,
                diffuse: [1, 1, 1],
                diffuseTexture: { name: "diffuse.png", hasAlpha: false, level: 1, coordinatesMode: 0 },
            },
        ],
        meshes: [],
    });
}

describe("Babylon file loader transitive side effects", () => {
    it("parses cameras, lights, materials and their textures without manual side-effect imports", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const container = LoadAssetContainer(scene, makeBabylonScene(), "", (message) => {
            throw new Error(message);
        });

        // Camera: a UniversalCamera must parse (default parser previously threw).
        expect(container.cameras.length).toBe(1);
        expect(container.cameras[0].getClassName()).toBe("UniversalCamera");

        // Light: a PointLight (Light_Type_0) must resolve to the concrete class.
        expect(container.lights.length).toBe(1);
        expect(container.lights[0].getClassName()).toBe("PointLight");

        // Material: must resolve to a StandardMaterial.
        expect(container.materials.length).toBe(1);
        const material = container.materials[0] as unknown as { diffuseTexture: unknown; getClassName(): string };
        expect(material.getClassName()).toBe("StandardMaterial");

        // Texture: the material's diffuse texture must be created. This is the core of
        // symptom 2 — without the loader installing SerializationHelper._TextureParser,
        // the texture is dropped and the mesh renders untextured.
        expect(material.diffuseTexture).not.toBeNull();
        expect((material.diffuseTexture as { name: string }).name).toBe("diffuse.png");

        engine.dispose();
    });
});
