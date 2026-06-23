import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3, Matrix } from "core/Maths/math.vector";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { PointLight } from "core/Lights/pointLight";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";

// Minimal ASCII FBX with a single light at a known position/rotation.
function lightFbx(lightType: number, translation: number[], rotation: number[], coneAngle?: number): string {
    const cone = coneAngle !== undefined ? `\n            P: "OuterAngle", "Number", "", "A",${coneAngle}\n            P: "InnerAngle", "Number", "", "A",${coneAngle}` : "";
    return `; FBX 7.4.0 project file
Objects:  {
    Model: 10, "Model::TestLight", "Light" {
        Properties70:  {
            P: "Lcl Translation", "Lcl Translation", "", "A",${translation.join(",")}
            P: "Lcl Rotation", "Lcl Rotation", "", "A",${rotation.join(",")}
        }
    }
    NodeAttribute: 11, "NodeAttribute::TestLight", "Light" {
        TypeFlags: "Light"
        Properties70:  {
            P: "LightType", "enum", "", "",${lightType}
            P: "Color", "Color", "", "A",1,1,1
            P: "Intensity", "Number", "", "A",100${cone}
        }
    }
}
Connections:  {
    C: "OO", 11, 10
    C: "OO", 10, 0
}`;
}

// Minimal ASCII FBX with a single camera at a known position/rotation.
function cameraFbx(translation: number[], rotation: number[], ortho = false): string {
    return `; FBX 7.4.0 project file
Objects:  {
    Model: 10, "Model::TestCam", "Camera" {
        Properties70:  {
            P: "Lcl Translation", "Lcl Translation", "", "A",${translation.join(",")}
            P: "Lcl Rotation", "Lcl Rotation", "", "A",${rotation.join(",")}
        }
    }
    NodeAttribute: 11, "NodeAttribute::TestCam", "Camera" {
        TypeFlags: "Camera"
        Properties70:  {
            P: "FieldOfView", "Number", "", "A",50
            P: "CameraProjectionType", "enum", "", "",${ortho ? 1 : 0}
        }
    }
}
Connections:  {
    C: "OO", 11, 10
    C: "OO", 10, 0
}`;
}

// Effective world-space direction the light points along.
function lightWorldDirection(light: DirectionalLight | SpotLight): Vector3 {
    if (light.parent) {
        return Vector3.TransformNormal(light.direction, light.parent.getWorldMatrix()).normalize();
    }
    return light.direction.clone().normalize();
}

describe("FBX cameras and lights", () => {
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

    describe("lights", () => {
        // FBX lights look down local -Z. Each case rotates the light so that local -Z points at the
        // world origin; the imported light must therefore point from its position toward the origin.
        it.each([
            { name: "+X axis, yawed to face origin", type: 2, pos: [5, 0, 0], rot: [0, 90, 0], cone: 40 },
            { name: "+Z axis, identity faces origin", type: 2, pos: [0, 0, 5], rot: [0, 0, 0], cone: 40 },
            { name: "above, pitched down to origin", type: 2, pos: [0, 5, 0], rot: [-90, 0, 0], cone: 40 },
        ])("aims a spot light at the subject ($name)", async ({ type, pos, rot, cone }) => {
            const loader = new FBXFileLoader();
            await loader.importMeshAsync(null, scene, lightFbx(type, pos, rot, cone), "");

            const light = scene.lights.find((l) => l instanceof SpotLight) as SpotLight;
            expect(light).toBeDefined();

            const worldPos = light.getAbsolutePosition();
            const toOrigin = worldPos.scale(-1).normalize();
            const dir = lightWorldDirection(light);
            // The light must point from its position toward the origin.
            expect(Vector3.Dot(dir, toOrigin)).toBeGreaterThan(0.99);
        });

        it("aims a directional light by its node rotation (yaw to +X in engine space)", async () => {
            const loader = new FBXFileLoader();
            // Directional light yawed 90deg about Y; local -Z -> engine +X after handedness conversion.
            await loader.importMeshAsync(null, scene, lightFbx(1, [0, 0, 0], [0, 90, 0]), "");

            const light = scene.lights.find((l) => l instanceof DirectionalLight) as DirectionalLight;
            expect(light).toBeDefined();
            const dir = lightWorldDirection(light);
            expect(Vector3.Dot(dir, new Vector3(1, 0, 0))).toBeGreaterThan(0.99);
        });

        it("imports a point light with no direction at the node position", async () => {
            const loader = new FBXFileLoader();
            await loader.importMeshAsync(null, scene, lightFbx(0, [1, 2, 3], [0, 0, 0]), "");
            const light = scene.lights.find((l) => l instanceof PointLight) as PointLight;
            expect(light).toBeDefined();
        });
    });

    describe("cameras", () => {
        // FBX cameras look down local +X. Each case rotates the camera so local +X points at the
        // world origin; the imported camera must therefore look from its position toward the origin.
        it.each([
            { name: "+X axis, yawed 180 to face origin", pos: [5, 0, 0], rot: [0, 180, 0] },
            { name: "-Z axis, yawed -90 to face origin", pos: [0, 0, -5], rot: [0, -90, 0] },
        ])("aims a camera at the subject ($name)", async ({ pos, rot }) => {
            const loader = new FBXFileLoader();
            await loader.importMeshAsync(null, scene, cameraFbx(pos, rot, false), "");

            const camera = scene.cameras[0];
            expect(camera).toBeDefined();

            camera.computeWorldMatrix(true);
            const camPos = camera.globalPosition.clone();
            const toOrigin = camPos.scale(-1).normalize();
            const forward = camera.getDirection(new Vector3(0, 0, 1)).normalize();
            expect(Vector3.Dot(forward, toOrigin)).toBeGreaterThan(0.99);
        });

        it("imports an orthographic camera", async () => {
            const loader = new FBXFileLoader();
            await loader.importMeshAsync(null, scene, cameraFbx([0, 0, -5], [0, -90, 0], true), "");
            const camera = scene.cameras[0];
            expect(camera).toBeDefined();
        });
    });
});
