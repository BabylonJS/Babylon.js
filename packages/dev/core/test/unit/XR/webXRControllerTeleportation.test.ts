/**
 * @jest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Ray } from "core/Culling";
import { Vector3 } from "core/Maths";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Scene } from "core/scene";
import { WebXRSessionManager, WebXRMotionControllerTeleportation } from "core/XR";
import "core/Animations/index";

/**
 * Helper to create a teleportation feature instance for testing.
 * Returns the feature and a dispose function to clean up engine/scene resources.
 */
function createTeleportationFeature(parabolicCheckRadius = 5): { feature: WebXRMotionControllerTeleportation; dispose: () => void } {
    const engine = new NullEngine({
        renderHeight: 256,
        renderWidth: 256,
        textureSize: 256,
        deterministicLockstep: false,
        lockstepMaxSteps: 1,
    });
    const scene = new Scene(engine);
    const sessionManager = new WebXRSessionManager(scene);
    // Provide a dummy mesh to skip _createDefaultTargetMesh (which needs canvas 2D context)
    const dummyMesh = new AbstractMesh("teleportTarget", scene);
    const feature = new WebXRMotionControllerTeleportation(sessionManager, {
        xrInput: { xrCamera: {} } as any,
        teleportationTargetMesh: dummyMesh,
    });
    feature.parabolicCheckRadius = parabolicCheckRadius;
    return {
        feature,
        dispose: () => {
            scene.dispose();
            engine.dispose();
        },
    };
}

/**
 * Simulates the parabolic ray landing on a flat floor at y=0.
 * Returns the horizontal distance from the original ray origin to the landing point.
 * @param rayOriginY - Y height of the ray origin (simulated controller height)
 * @param elevationDeg - Elevation angle in degrees above horizontal (0 = horizontal, 90 = straight up)
 * @param radius - parabolicCheckRadius
 * @returns horizontal distance to landing point, or null if ray doesn't reach floor
 */
function computeLandingDistance(rayOriginY: number, elevationDeg: number, radius: number): number | null {
    const { feature, dispose } = createTeleportationFeature(radius);
    const theta = (elevationDeg * Math.PI) / 180;
    const direction = new Vector3(0, Math.sin(theta), Math.cos(theta));
    direction.normalize();

    const origin = new Vector3(0, rayOriginY, 0);
    const ray = new Ray(origin.clone(), direction.clone());
    const tmpVector = new Vector3();

    const success = (feature as any)._buildParabolicRay(ray, tmpVector);
    if (!success) {
        dispose();
        return null;
    }

    // Compute where the ray hits y=0 (flat floor)
    // ray.origin + t * ray.direction, solve for y = 0
    if (Math.abs(ray.direction.y) < 1e-10) {
        dispose();
        return null; // ray is horizontal, won't hit floor
    }
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) {
        dispose();
        return null; // floor is behind the ray
    }

    const landingX = ray.origin.x + t * ray.direction.x;
    const landingZ = ray.origin.z + t * ray.direction.z;
    dispose();
    return Math.sqrt(landingX * landingX + landingZ * landingZ);
}

describe("WebXRMotionControllerTeleportation - Parabolic Ray", () => {
    describe("_buildParabolicRay", () => {
        it("should return false when pointing almost straight up", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            const ray = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, 1, 0)); // straight up
            ray.direction.normalize();
            const tmpVector = new Vector3();

            const result = (feature as any)._buildParabolicRay(ray, tmpVector);
            expect(result).toBe(false);
            dispose();
        });

        it("should return false when pointing almost straight down", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            const ray = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, -1, 0)); // straight down
            ray.direction.normalize();
            const tmpVector = new Vector3();

            const result = (feature as any)._buildParabolicRay(ray, tmpVector);
            expect(result).toBe(false);
            dispose();
        });

        it("should return true for a valid non-vertical direction", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            const ray = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, 0.707, 0.707)); // 45° up
            ray.direction.normalize();
            const tmpVector = new Vector3();

            const result = (feature as any)._buildParabolicRay(ray, tmpVector);
            expect(result).toBe(true);
            dispose();
        });

        it("should produce a downward-angled ray when controller points upward", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            const ray = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, 0.707, 0.707)); // 45° up
            ray.direction.normalize();
            const tmpVector = new Vector3();

            (feature as any)._buildParabolicRay(ray, tmpVector);

            // The resulting ray direction should point downward (negative Y)
            expect(ray.direction.y).toBeLessThan(0);
            // And forward (positive Z)
            expect(ray.direction.z).toBeGreaterThan(0);
            dispose();
        });

        it("should move the ray origin forward and upward from controller position", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            const originY = 1.5;
            const ray = new Ray(new Vector3(0, originY, 0), new Vector3(0, 0.5, 0.866)); // 30° up
            ray.direction.normalize();
            const tmpVector = new Vector3();

            (feature as any)._buildParabolicRay(ray, tmpVector);

            // Origin should have moved forward (z > 0) and up (y > originY)
            expect(ray.origin.z).toBeGreaterThan(0);
            expect(ray.origin.y).toBeGreaterThan(originY);
            dispose();
        });

        it("should scale effective radius with horizontal component", () => {
            const { feature, dispose } = createTeleportationFeature(10);

            // 30° up: horizontal component = cos(30°) ≈ 0.866
            const ray30 = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)));
            ray30.direction.normalize();
            const tmp30 = new Vector3();
            (feature as any)._buildParabolicRay(ray30, tmp30);
            const originZ30 = ray30.origin.z;

            // 60° up: horizontal component = cos(60°) ≈ 0.5
            const ray60 = new Ray(new Vector3(0, 1.5, 0), new Vector3(0, Math.sin(Math.PI / 3), Math.cos(Math.PI / 3)));
            ray60.direction.normalize();
            const tmp60 = new Vector3();
            (feature as any)._buildParabolicRay(ray60, tmp60);
            const originZ60 = ray60.origin.z;

            // 30° should move origin further forward than 60° (more horizontal reach)
            expect(originZ30).toBeGreaterThan(originZ60);
            dispose();
        });
    });

    describe("Landing distance behavior", () => {
        const controllerHeight = 1.5;

        it("should land very close when pointing steeply upward (80°)", () => {
            const dist = computeLandingDistance(controllerHeight, 80, 5);
            expect(dist).not.toBeNull();
            // Should land within 1 meter
            expect(dist!).toBeLessThan(1);
        });

        it("should land at moderate distance when pointing 45° up", () => {
            const dist = computeLandingDistance(controllerHeight, 45, 5);
            expect(dist).not.toBeNull();
            // Should land roughly at parabolicCheckRadius (3-6m range)
            expect(dist!).toBeGreaterThan(2);
            expect(dist!).toBeLessThan(7);
        });

        it("should land further when pointing more horizontally (30°)", () => {
            const dist30 = computeLandingDistance(controllerHeight, 30, 5);
            const dist60 = computeLandingDistance(controllerHeight, 60, 5);
            expect(dist30).not.toBeNull();
            expect(dist60).not.toBeNull();
            // 30° (more horizontal) should land further than 60° (more vertical)
            expect(dist30!).toBeGreaterThan(dist60!);
        });

        it("should scale proportionally with parabolicCheckRadius", () => {
            const dist5 = computeLandingDistance(controllerHeight, 45, 5);
            const dist10 = computeLandingDistance(controllerHeight, 45, 10);
            expect(dist5).not.toBeNull();
            expect(dist10).not.toBeNull();
            // Doubling the radius should roughly double the landing distance
            // (the height contribution stays the same, so it's not exactly 2x)
            expect(dist10!).toBeGreaterThan(dist5! * 1.5);
        });

        it("should return null when pointing straight up (90°)", () => {
            const dist = computeLandingDistance(controllerHeight, 90, 5);
            expect(dist).toBeNull();
        });

        it("should handle 3D directions (not just XZ plane)", () => {
            const { feature, dispose } = createTeleportationFeature(5);
            // Point 45° up and 45° to the right
            const direction = new Vector3(0.5, 0.707, 0.5);
            direction.normalize();
            const ray = new Ray(new Vector3(0, 1.5, 0), direction);
            const tmpVector = new Vector3();

            const result = (feature as any)._buildParabolicRay(ray, tmpVector);
            expect(result).toBe(true);

            // Ray should go downward
            expect(ray.direction.y).toBeLessThan(0);
            // And have both X and Z components (forward + sideways)
            expect(ray.direction.x).toBeGreaterThan(0);
            expect(ray.direction.z).toBeGreaterThan(0);
            dispose();
        });

        it("should produce monotonically decreasing landing distance as elevation increases", () => {
            const distances: number[] = [];
            for (let angle = 20; angle <= 80; angle += 10) {
                const dist = computeLandingDistance(controllerHeight, angle, 5);
                expect(dist).not.toBeNull();
                distances.push(dist!);
            }

            // Each successive distance should be smaller (more vertical = closer)
            for (let i = 1; i < distances.length; i++) {
                expect(distances[i]).toBeLessThan(distances[i - 1]);
            }
        });
    });
});
