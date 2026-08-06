import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import { Scene } from "core/scene";
import { SpotLight } from "core/Lights/spotLight";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/EXT_lights_ies";

const IES_DATA = ["IESNA:LM-63-2002", "TILT=NONE", "1 1000 1 2 2 1 1 1 1 1", "1 1 1", "0 180", "0 360", "1 1", "1 1"].join("\n");

function buildExtLightsIesGltf(): string {
    const profile = btoa(IES_DATA);
    return JSON.stringify({
        asset: { version: "2.0" },
        extensionsUsed: ["EXT_lights_ies"],
        extensions: {
            EXT_lights_ies: {
                lights: [
                    {
                        name: "Photometric light",
                        uri: `data:application/octet-stream;base64,${profile}`,
                    },
                ],
            },
        },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [
            {
                name: "Light node",
                extensions: {
                    EXT_lights_ies: {
                        light: 0,
                    },
                },
            },
        ],
    });
}

describe("EXT_lights_ies", () => {
    let engine: NullEngine;
    let scene: Scene;
    let globalNameDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
        globalNameDescriptor = Object.getOwnPropertyDescriptor(globalThis, "name");
        Reflect.deleteProperty(globalThis, "name");
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        if (globalNameDescriptor) {
            Object.defineProperty(globalThis, "name", globalNameDescriptor);
        } else {
            Reflect.deleteProperty(globalThis, "name");
        }
    });

    it("names the IES profile from the created light without relying on a browser global", async () => {
        await ImportMeshAsync(`data:${buildExtLightsIesGltf()}`, scene);

        expect(scene.lights).toHaveLength(1);
        const light = scene.lights[0] as SpotLight;
        expect(light.name).toBe("Photometric light");
        expect(light.iesProfileTexture?.name).toBe("Photometric light_iesProfile");
    });
});
