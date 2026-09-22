import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { DirectionalLight } from "core/Lights/directionalLight";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type Material } from "core/Materials/material";
import { Atmosphere } from "../../../src/atmosphere/atmosphere";

const PluginName = "AtmospherePBRMaterialPlugin";

// The atmosphere refuses WebGL 1, which is what NullEngine reports.
class WebGL2NullEngine extends NullEngine {
    public override get version(): number {
        return 2;
    }
}

const CreateScene = (engine: WebGL2NullEngine): Scene => {
    const scene = new Scene(engine);
    new DirectionalLight("light", new Vector3(0, -1, 0), scene);
    return scene;
};

const CreateAtmosphere = (scene: Scene): Atmosphere => new Atmosphere("atmosphere", scene, [scene.lights[0] as DirectionalLight]);

const GetAtmosphereOf = (material: Material): Atmosphere | null => {
    const plugin = material.pluginManager?.getPlugin(PluginName) as unknown as { _atmosphere?: Atmosphere } | null;
    return plugin?._atmosphere ?? null;
};

describe("Atmosphere material plugin registration", () => {
    let engine: WebGL2NullEngine;
    let sceneA: Scene;
    let sceneB: Scene;

    beforeEach(() => {
        engine = new WebGL2NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        sceneA = CreateScene(engine);
        sceneB = CreateScene(engine);
    });

    afterEach(() => {
        engine.dispose();
    });

    it("does not attach the plugin to materials of a scene without an atmosphere", () => {
        const atmosphereA = CreateAtmosphere(sceneA);

        expect(GetAtmosphereOf(new PBRMaterial("a", sceneA))).toBe(atmosphereA);
        expect(GetAtmosphereOf(new PBRMaterial("b", sceneB))).toBeNull();
    });

    it("attaches each scene's own atmosphere, whichever atmosphere was created last", () => {
        const atmosphereA = CreateAtmosphere(sceneA);
        const materialABefore = new PBRMaterial("aBefore", sceneA);
        const atmosphereB = CreateAtmosphere(sceneB);
        const materialAAfter = new PBRMaterial("aAfter", sceneA);
        const materialB = new PBRMaterial("b", sceneB);

        expect(GetAtmosphereOf(materialABefore)).toBe(atmosphereA);
        expect(GetAtmosphereOf(materialAAfter)).toBe(atmosphereA);
        expect(GetAtmosphereOf(materialB)).toBe(atmosphereB);
    });

    it.each([
        ["first", 0],
        ["second", 1],
    ])("keeps the other scene's atmosphere working when the %s atmosphere is disposed", (_, disposedIndex) => {
        const scenes = [sceneA, sceneB];
        const atmospheres = scenes.map(CreateAtmosphere);
        const keptIndex = 1 - disposedIndex;

        atmospheres[disposedIndex].dispose();

        expect(GetAtmosphereOf(new PBRMaterial("disposed", scenes[disposedIndex]))).toBeNull();
        expect(GetAtmosphereOf(new PBRMaterial("kept", scenes[keptIndex]))).toBe(atmospheres[keptIndex]);
    });
});
