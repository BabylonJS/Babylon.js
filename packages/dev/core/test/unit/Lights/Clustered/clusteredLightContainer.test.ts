import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { PointLight } from "core/Lights/pointLight";
import { SpotLight } from "core/Lights/spotLight";
import { Light } from "core/Lights/light";
import { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

import "core/Lights/Clustered/clusteredLightingSceneComponent";

describe("ClusteredLightContainer", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        // NullEngine doesn't support clustered lighting, so bypass the check
        vi.spyOn(ClusteredLightContainer, "IsLightSupported").mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        engine.dispose();
    });

    describe("serialize", () => {
        it("should serialize an empty container", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const serialized = container.serialize();

            expect(serialized.type).toBe(5);
            expect(serialized.name).toBe("cluster");
            expect(serialized.clusteredLights).toEqual([]);
        });

        it("should serialize with custom properties", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            container.horizontalTiles = 32;
            container.verticalTiles = 48;
            container.depthSlices = 8;
            container.maxRange = 500;

            const serialized = container.serialize();

            expect(serialized.horizontalTiles).toBe(32);
            expect(serialized.verticalTiles).toBe(48);
            expect(serialized.depthSlices).toBe(8);
            expect(serialized.maxRange).toBe(500);
        });

        it("should serialize child point lights", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point1 = new PointLight("point1", new Vector3(1, 2, 3), scene);
            const point2 = new PointLight("point2", new Vector3(4, 5, 6), scene);

            container.addLight(point1);
            container.addLight(point2);

            const serialized = container.serialize();

            expect(serialized.clusteredLights).toHaveLength(2);
            expect(serialized.clusteredLights[0].name).toBe("point1");
            expect(serialized.clusteredLights[0].type).toBe(0); // LIGHTTYPEID_POINTLIGHT
            expect(serialized.clusteredLights[1].name).toBe("point2");
            expect(serialized.clusteredLights[1].type).toBe(0);
        });

        it("should serialize child spot lights", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const spot = new SpotLight("spot1", new Vector3(0, 5, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, scene);

            container.addLight(spot);

            const serialized = container.serialize();

            expect(serialized.clusteredLights).toHaveLength(1);
            expect(serialized.clusteredLights[0].name).toBe("spot1");
            expect(serialized.clusteredLights[0].type).toBe(2); // LIGHTTYPEID_SPOTLIGHT
        });

        it("should not include child lights in scene.lights after addLight", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point = new PointLight("point1", new Vector3(1, 2, 3), scene);

            // The point light should be in scene.lights initially
            expect(scene.lights).toContain(point);

            container.addLight(point);

            // After addLight, the child light should be removed from scene.lights
            expect(scene.lights).not.toContain(point);
            // But the container itself should be in scene.lights
            expect(scene.lights).toContain(container);
        });

        it("should not include child lights in mesh.lightSources after addLight", async () => {
            const { CreateBox } = await import("core/Meshes/Builders/boxBuilder");
            const mesh = CreateBox("box", { size: 1 }, scene);
            const container = new ClusteredLightContainer("cluster", [], scene);

            // Light constructed with dontAddToScene=true is still pushed into mesh.lightSources
            // by the Light constructor (via the includedOnlyMeshes setter calling _resyncMeshes).
            // addLight() must clean that up, otherwise the orphan light is rendered as a regular
            // point/spot light bypassing the cluster (e.g. ignoring maxRange).
            const point = new PointLight("point1", new Vector3(1, 2, 3), scene, true);
            expect(mesh.lightSources).toContain(point);

            container.addLight(point);

            expect(mesh.lightSources).not.toContain(point);
            expect(mesh.lightSources).toContain(container);
        });

        it("should not re-add child lights to mesh.lightSources when their parent enabled state changes", async () => {
            const { CreateBox } = await import("core/Meshes/Builders/boxBuilder");
            const mesh = CreateBox("box", { size: 1 }, scene);
            const parent = CreateBox("parent", { size: 1 }, scene);
            parent.setEnabled(false);
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point = new PointLight("point", new Vector3(0, 1, 0), scene, true);
            point.parent = parent;

            container.addLight(point);

            expect(mesh.lightSources).toContain(container);
            expect(mesh.lightSources).not.toContain(point);

            parent.setEnabled(true);

            expect(mesh.lightSources).toContain(container);
            expect(mesh.lightSources).not.toContain(point);
            expect(scene.lights).not.toContain(point);
        });

        it("should not re-add child lights to mesh.lightSources when their excluded meshes change", async () => {
            const { CreateBox } = await import("core/Meshes/Builders/boxBuilder");
            const mesh = CreateBox("box", { size: 1 }, scene);
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point = new PointLight("point", new Vector3(0, 1, 0), scene, true);
            point.excludedMeshes.push(mesh);

            container.addLight(point);

            expect(mesh.lightSources).toContain(container);
            expect(mesh.lightSources).not.toContain(point);

            point.excludedMeshes.splice(0, 1);

            expect(mesh.lightSources).toContain(container);
            expect(mesh.lightSources).not.toContain(point);
            expect(scene.lights).not.toContain(point);
        });

        it("should not let multiple clustered light containers own the same child light", () => {
            const container1 = new ClusteredLightContainer("cluster1", [], scene);
            const container2 = new ClusteredLightContainer("cluster2", [], scene);
            const point = new PointLight("point", new Vector3(0, 1, 0), scene, true);

            container1.addLight(point);
            container1.addLight(point);
            container2.addLight(point);

            expect(container1.lights).toEqual([point]);
            expect(container2.lights).toEqual([]);
            expect(scene.lights).not.toContain(point);

            container2.removeLight(point);

            expect(scene.lights).not.toContain(point);

            container1.removeLight(point);

            expect(scene.lights).toContain(point);
        });
    });

    describe("parse", () => {
        it("should round-trip serialize/parse an empty container", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            container.horizontalTiles = 32;
            container.verticalTiles = 48;
            container.depthSlices = 8;
            container.maxRange = 500;

            const serialized = container.serialize();

            // Dispose original
            container.dispose();

            // Parse into a new scene
            const scene2 = new Scene(engine);
            const parsed = Light.Parse(serialized, scene2);

            expect(parsed).not.toBeNull();
            expect(parsed).toBeInstanceOf(ClusteredLightContainer);

            const parsedContainer = parsed as ClusteredLightContainer;
            expect(parsedContainer.name).toBe("cluster");
            expect(parsedContainer.horizontalTiles).toBe(32);
            expect(parsedContainer.verticalTiles).toBe(48);
            expect(parsedContainer.depthSlices).toBe(8);
            expect(parsedContainer.maxRange).toBe(500);

            scene2.dispose();
        });

        it("should round-trip serialize/parse with child lights", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point1 = new PointLight("point1", new Vector3(1, 2, 3), scene);
            point1.intensity = 0.75;
            const point2 = new PointLight("point2", new Vector3(4, 5, 6), scene);
            point2.intensity = 1.5;

            container.addLight(point1);
            container.addLight(point2);

            const serialized = container.serialize();

            // Dispose originals
            container.dispose();

            // Parse into a new scene
            const scene2 = new Scene(engine);
            const parsed = Light.Parse(serialized, scene2);

            expect(parsed).not.toBeNull();
            const parsedContainer = parsed as ClusteredLightContainer;

            // Child lights are deferred until onDataLoadedObservable fires
            expect(parsedContainer.lights).toHaveLength(0);

            // Simulate the loader finishing — triggers deferred addLight()
            scene2.onDataLoadedObservable.notifyObservers(scene2);

            // Child lights should now be parsed and added
            expect(parsedContainer.lights).toHaveLength(2);
            expect(parsedContainer.lights[0].name).toBe("point1");
            expect(parsedContainer.lights[0].intensity).toBe(0.75);
            expect(parsedContainer.lights[1].name).toBe("point2");
            expect(parsedContainer.lights[1].intensity).toBe(1.5);

            // Child lights should not be in scene.lights (only the container)
            const sceneLightNames = scene2.lights.map((l) => l.name);
            expect(sceneLightNames).toContain("cluster");
            expect(sceneLightNames).not.toContain("point1");
            expect(sceneLightNames).not.toContain("point2");

            scene2.dispose();
        });

        it("should round-trip serialize/parse with mixed light types", () => {
            const container = new ClusteredLightContainer("cluster", [], scene);
            const point = new PointLight("point1", new Vector3(1, 2, 3), scene);
            const spot = new SpotLight("spot1", new Vector3(0, 5, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, scene);

            container.addLight(point);
            container.addLight(spot);

            const serialized = container.serialize();

            container.dispose();

            const scene2 = new Scene(engine);
            const parsed = Light.Parse(serialized, scene2) as ClusteredLightContainer;

            // Simulate the loader finishing — triggers deferred addLight()
            scene2.onDataLoadedObservable.notifyObservers(scene2);

            expect(parsed.lights).toHaveLength(2);
            expect(parsed.lights[0]).toBeInstanceOf(PointLight);
            expect(parsed.lights[0].name).toBe("point1");
            expect(parsed.lights[1]).toBeInstanceOf(SpotLight);
            expect(parsed.lights[1].name).toBe("spot1");

            scene2.dispose();
        });
    });

    describe("transferTexturesToEffect", () => {
        it("binds the tile mask storage buffer for WebGPU effects", () => {
            const setStorageBuffer = vi.fn();
            const setTexture = vi.fn();

            ClusteredLightContainer.prototype.transferTexturesToEffect.call(
                {
                    getEngine: () => ({ isWebGPU: true, setStorageBuffer }),
                    _lightDataTexture: "lightDataTexture",
                    _tileMaskTexture: "tileMaskTexture",
                    _tileMaskBuffer: "tileMaskBuffer",
                },
                {
                    shaderLanguage: ShaderLanguage.GLSL,
                    setTexture,
                },
                "0"
            );

            expect(setTexture).toHaveBeenCalledWith("lightDataTexture0", "lightDataTexture");
            expect(setTexture).not.toHaveBeenCalledWith("tileMaskTexture0", "tileMaskTexture");
            expect(setStorageBuffer).toHaveBeenCalledWith("tileMaskBuffer0", "tileMaskBuffer");
        });

        it("binds the WGSL tile mask storage buffer for WGSL effects on WebGPU", () => {
            const setStorageBuffer = vi.fn();
            const setTexture = vi.fn();

            ClusteredLightContainer.prototype.transferTexturesToEffect.call(
                {
                    getEngine: () => ({ isWebGPU: true, setStorageBuffer }),
                    _lightDataTexture: "lightDataTexture",
                    _tileMaskTexture: "tileMaskTexture",
                    _tileMaskBuffer: "tileMaskBuffer",
                },
                {
                    shaderLanguage: ShaderLanguage.WGSL,
                    setTexture,
                },
                "0"
            );

            expect(setTexture).toHaveBeenCalledWith("lightDataTexture0", "lightDataTexture");
            expect(setTexture).not.toHaveBeenCalledWith("tileMaskTexture0", "tileMaskTexture");
            expect(setStorageBuffer).toHaveBeenCalledWith("tileMaskBuffer0", "tileMaskBuffer");
        });
    });
});
