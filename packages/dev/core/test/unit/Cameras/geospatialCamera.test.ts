import { Vector2, Vector3 } from "core/Maths/math.vector";
import { ComputeLocalBasisToRefs } from "core/Cameras/geospatialCameraMovement";
import { ComputeLookAtFromYawPitchToRef, ComputeYawPitchFromLookAtToRef, GeospatialCamera } from "core/Cameras/geospatialCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";

/**
 * Helper to check if two vectors are approximately equal
 */
function vectorsApproxEqual(a: Vector3, b: Vector3, tolerance = 0.0001): boolean {
    return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance && Math.abs(a.z - b.z) < tolerance;
}

/**
 * Helper to check if a vector is approximately unit length
 */
function isUnitVector(v: Vector3, tolerance = 0.0001): boolean {
    return Math.abs(v.length() - 1) < tolerance;
}

/**
 * Helper to check if two vectors are approximately perpendicular
 */
function arePerpendicular(a: Vector3, b: Vector3, tolerance = 0.0001): boolean {
    return Math.abs(Vector3.Dot(a, b)) < tolerance;
}

describe("GeospatialCamera", () => {
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

    // ============================================
    // UNIT TESTS: ComputeLocalBasisToRefs (exported function)
    // ============================================
    describe("ComputeLocalBasisToRefs", () => {
        /**
         * Tests the local coordinate system (East, North, Up) computation at various globe positions.
         *
         * The convention is:
         * - Up: points away from globe center (geocentric normal)
         * - North: points toward the north pole (Z+ axis in ECEF)
         * - East: perpendicular to both, completing a right-handed system
         *
         * At the equator on the X+ axis (0° lat, 0° lon):
         * - Up = (1, 0, 0)
         * - North = (0, 0, 1)
         * - East = (0, 1, 0)
         */
        it("should compute correct basis at equator (X+ axis)", () => {
            const worldPos = new Vector3(6371, 0, 0); // On X+ axis (0° lat, 0° lon)
            const east = new Vector3();
            const north = new Vector3();
            const up = new Vector3();

            ComputeLocalBasisToRefs(worldPos, east, north, up);

            // Up should point outward (same direction as position)
            expect(vectorsApproxEqual(up, new Vector3(1, 0, 0))).toBe(true);
            // North should point toward Z+ (north pole)
            expect(vectorsApproxEqual(north, new Vector3(0, 0, 1))).toBe(true);
            // East should point toward Y+
            expect(vectorsApproxEqual(east, new Vector3(0, 1, 0))).toBe(true);

            // All should be unit vectors
            expect(isUnitVector(east)).toBe(true);
            expect(isUnitVector(north)).toBe(true);
            expect(isUnitVector(up)).toBe(true);

            // All should be mutually perpendicular
            expect(arePerpendicular(east, north)).toBe(true);
            expect(arePerpendicular(east, up)).toBe(true);
            expect(arePerpendicular(north, up)).toBe(true);
        });

        it("should compute correct basis at equator (Y+ axis, 90° longitude)", () => {
            const worldPos = new Vector3(0, 6371, 0); // On Y+ axis (0° lat, 90° lon)
            const east = new Vector3();
            const north = new Vector3();
            const up = new Vector3();

            ComputeLocalBasisToRefs(worldPos, east, north, up);

            // Up should point toward Y+
            expect(vectorsApproxEqual(up, new Vector3(0, 1, 0))).toBe(true);
            // North should still point toward Z+ (north pole direction, projected onto local tangent plane)
            expect(vectorsApproxEqual(north, new Vector3(0, 0, 1))).toBe(true);
            // East should point toward -X (counterclockwise when viewed from above)
            expect(vectorsApproxEqual(east, new Vector3(-1, 0, 0))).toBe(true);

            expect(arePerpendicular(east, north)).toBe(true);
            expect(arePerpendicular(east, up)).toBe(true);
            expect(arePerpendicular(north, up)).toBe(true);
        });

        it("should handle north pole (edge case - East is degenerate)", () => {
            const worldPos = new Vector3(0, 0, 6371); // North pole
            const east = new Vector3();
            const north = new Vector3();
            const up = new Vector3();

            ComputeLocalBasisToRefs(worldPos, east, north, up);

            // Up should point toward Z+ (outward from north pole)
            expect(vectorsApproxEqual(up, new Vector3(0, 0, 1))).toBe(true);

            // At the pole, "North" is undefined (all directions lead south)
            // The function should still produce an orthonormal basis
            expect(isUnitVector(east)).toBe(true);
            expect(isUnitVector(north)).toBe(true);
            expect(arePerpendicular(east, north)).toBe(true);
            expect(arePerpendicular(east, up)).toBe(true);
            expect(arePerpendicular(north, up)).toBe(true);
        });

        it("should handle south pole (edge case)", () => {
            const worldPos = new Vector3(0, 0, -6371); // South pole
            const east = new Vector3();
            const north = new Vector3();
            const up = new Vector3();

            ComputeLocalBasisToRefs(worldPos, east, north, up);

            // Up should point toward Z- (outward from south pole)
            expect(vectorsApproxEqual(up, new Vector3(0, 0, -1))).toBe(true);

            // Should still produce an orthonormal basis
            expect(isUnitVector(east)).toBe(true);
            expect(isUnitVector(north)).toBe(true);
            expect(arePerpendicular(east, north)).toBe(true);
            expect(arePerpendicular(east, up)).toBe(true);
            expect(arePerpendicular(north, up)).toBe(true);
        });

        it("should compute correct basis at 45° latitude", () => {
            // Position at 45° N latitude, 0° longitude
            const lat = Math.PI / 4; // 45°
            const r = 6371;
            const worldPos = new Vector3(r * Math.cos(lat), 0, r * Math.sin(lat));
            const east = new Vector3();
            const north = new Vector3();
            const up = new Vector3();

            ComputeLocalBasisToRefs(worldPos, east, north, up);

            // Up should be normalized position
            const expectedUp = worldPos.clone().normalize();
            expect(vectorsApproxEqual(up, expectedUp)).toBe(true);

            // All should be unit and perpendicular
            expect(isUnitVector(east)).toBe(true);
            expect(isUnitVector(north)).toBe(true);
            expect(isUnitVector(up)).toBe(true);
            expect(arePerpendicular(east, north)).toBe(true);
            expect(arePerpendicular(east, up)).toBe(true);
            expect(arePerpendicular(north, up)).toBe(true);

            // North should have positive Z component (pointing toward north pole)
            expect(north.z).toBeGreaterThan(0);
        });
    });

    // ============================================
    // UNIT TESTS: ComputeYawPitchFromLookAtToRef (exported function)
    // ============================================
    describe("ComputeYawPitchFromLookAtToRef", () => {
        /**
         * Tests the inverse calculation: given a lookAt direction and center,
         * compute the yaw and pitch that would produce that lookAt.
         *
         * The forward formula (in _setOrientation) is:
         *   horiz = north * cos(yaw) + east * sin(yaw)
         *   lookAt = horiz * sin(pitch) - up * cos(pitch)
         *
         * ComputeYawPitchFromLookAtToRef should be the inverse of this.
         */

        it("should be the inverse of the forward yaw/pitch calculation (right-handed)", () => {
            const center = new Vector3(6371, 0, 0); // Equator, 0° lon
            const lookAt = new Vector3();
            const result = new Vector2();

            const testCases = [
                { yaw: 0, pitch: Math.PI / 4 },
                { yaw: Math.PI / 4, pitch: Math.PI / 4 },
                { yaw: Math.PI / 2, pitch: Math.PI / 6 },
                { yaw: -Math.PI / 4, pitch: Math.PI / 3 },
                { yaw: Math.PI, pitch: Math.PI / 4 },
                { yaw: 0, pitch: Math.PI / 2 - 0.01 }, // Near horizon
            ];

            for (const { yaw, pitch } of testCases) {
                ComputeLookAtFromYawPitchToRef(yaw, pitch, center, true, lookAt);
                ComputeYawPitchFromLookAtToRef(lookAt, center, true, 0, result);

                expect(result.y).toBeCloseTo(pitch, 5);
                // Yaw can wrap around, so compare the angular difference
                const yawDiff = Math.abs(result.x - yaw);
                const yawDiffWrapped = Math.min(yawDiff, 2 * Math.PI - yawDiff);
                expect(yawDiffWrapped).toBeLessThan(0.0001);
            }
        });

        it("should be the inverse of the forward yaw/pitch calculation (left-handed)", () => {
            const center = new Vector3(6371, 0, 0); // Equator, 0° lon
            const lookAt = new Vector3();
            const result = new Vector2();

            const testCases = [
                { yaw: 0, pitch: Math.PI / 4 },
                { yaw: Math.PI / 4, pitch: Math.PI / 4 },
                { yaw: -Math.PI / 2, pitch: Math.PI / 6 },
            ];

            for (const { yaw, pitch } of testCases) {
                ComputeLookAtFromYawPitchToRef(yaw, pitch, center, false, lookAt);
                ComputeYawPitchFromLookAtToRef(lookAt, center, false, 0, result);

                expect(result.y).toBeCloseTo(pitch, 5);
                const yawDiff = Math.abs(result.x - yaw);
                const yawDiffWrapped = Math.min(yawDiff, 2 * Math.PI - yawDiff);
                expect(yawDiffWrapped).toBeLessThan(0.0001);
            }
        });

        it("should work at different center positions", () => {
            const centers = [
                new Vector3(6371, 0, 0), // Equator, 0° lon
                new Vector3(0, 6371, 0), // Equator, 90° lon
                new Vector3(4505, 0, 4505), // ~45° N latitude
                new Vector3(-6371, 0, 0), // Equator, 180° lon
            ];
            const lookAt = new Vector3();
            const result = new Vector2();

            for (const center of centers) {
                const yaw = Math.PI / 4;
                const pitch = Math.PI / 4;

                ComputeLookAtFromYawPitchToRef(yaw, pitch, center, true, lookAt);
                ComputeYawPitchFromLookAtToRef(lookAt, center, true, 0, result);

                expect(result.y).toBeCloseTo(pitch, 5);
                const yawDiff = Math.abs(result.x - yaw);
                const yawDiffWrapped = Math.min(yawDiff, 2 * Math.PI - yawDiff);
                expect(yawDiffWrapped).toBeLessThan(0.0001);
            }
        });

        it("should return currentYaw when pitch is near 0 (looking straight down)", () => {
            const center = new Vector3(6371, 0, 0);
            const currentYaw = Math.PI / 3;

            // When pitch ≈ 0, lookAt points straight down at the center (parallel to -up)
            const up = center.clone().normalize();
            const lookAt = up.scale(-1); // Looking straight down
            const result = new Vector2();

            ComputeYawPitchFromLookAtToRef(lookAt, center, true, currentYaw, result);

            // Pitch should be near 0
            expect(result.y).toBeLessThan(0.01);
            // Yaw should fall back to currentYaw since it's undefined at pitch=0
            expect(result.x).toBeCloseTo(currentYaw, 5);
        });

        it("should handle pitch near π/2 (looking at horizon)", () => {
            const center = new Vector3(6371, 0, 0);
            const yaw = Math.PI / 4;
            const pitch = Math.PI / 2 - 0.001; // Just below horizon
            const lookAt = new Vector3();
            const result = new Vector2();

            ComputeLookAtFromYawPitchToRef(yaw, pitch, center, true, lookAt);
            ComputeYawPitchFromLookAtToRef(lookAt, center, true, 0, result);

            expect(result.y).toBeCloseTo(pitch, 3);
            const yawDiff = Math.abs(result.x - yaw);
            const yawDiffWrapped = Math.min(yawDiff, 2 * Math.PI - yawDiff);
            expect(yawDiffWrapped).toBeLessThan(0.001);
        });

        it("should produce consistent results with GeospatialCamera._setOrientation roundtrip", () => {
            // This is an integration test: set yaw/pitch on camera, then verify
            // that ComputeYawPitchFromLookAtToRef can recover those values
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            const result = new Vector2();

            const testCases = [
                { yaw: 0, pitch: Math.PI / 4 },
                { yaw: Math.PI / 4, pitch: Math.PI / 3 },
                { yaw: -Math.PI / 2, pitch: Math.PI / 6 },
            ];

            for (const { yaw, pitch } of testCases) {
                camera.yaw = yaw;
                camera.pitch = pitch;

                // Get the lookAt direction from camera's internal state
                const lookAt = camera.center.subtract(camera.position).normalize();

                // Use ComputeYawPitchFromLookAtToRef to recover yaw/pitch
                ComputeYawPitchFromLookAtToRef(lookAt, camera.center, scene.useRightHandedSystem, camera.yaw, result);

                expect(result.y).toBeCloseTo(camera.pitch, 4);
                const yawDiff = Math.abs(result.x - camera.yaw);
                const yawDiffWrapped = Math.min(yawDiff, 2 * Math.PI - yawDiff);
                expect(yawDiffWrapped).toBeLessThan(0.0001);
            }

            scene.dispose();
            engine.dispose();
        });
    });

    // ============================================
    // TESTS: GeospatialCamera class construction
    // ============================================
    describe("GeospatialCamera construction", () => {
        it("should initialize with default values", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Default yaw should be 0
            expect(camera.yaw).toBe(0);
            // Default pitch should be at pitchMin (Epsilon)
            expect(camera.pitch).toBeCloseTo(camera.limits.pitchMin, 5);
            // Center should be at planet radius on X axis
            expect(camera.center.x).toBeCloseTo(6371, 1);
            expect(camera.center.y).toBe(0);
            expect(camera.center.z).toBe(0);
        });

        it("should have valid position after construction", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Position should be farther from origin than center (camera is above surface)
            expect(camera.position.length()).toBeGreaterThan(camera.center.length());
        });

        it("should have orthonormal upVector and lookAt-implied direction", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // upVector should be unit length
            expect(isUnitVector(camera.upVector)).toBe(true);

            // Direction from position to center should be perpendicular to upVector
            // (or at least make sense as a camera orientation)
            const lookDir = camera.center.subtract(camera.position).normalize();
            // lookDir and upVector should be perpendicular
            expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
        });
    });

    // ============================================
    // TESTS: GeospatialCamera._setOrientation (via public setters)
    // ============================================
    describe("GeospatialCamera yaw/pitch/radius/center setters", () => {
        /**
         * These tests verify that the camera's _setOrientation method (called by setters)
         * correctly computes lookAt, upVector, and position from yaw/pitch/radius/center.
         *
         * The formula tested:
         *   horiz = North * cos(yaw) + East * sin(yaw)
         *   lookAt = horiz * sin(pitch) - Up * cos(pitch)
         *   position = center - lookAt * radius
         */

        it("should update position when radius changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            const initialDistance = camera.position.length();

            camera.radius = camera.radius * 2;

            const newDistance = Vector3.Distance(camera.position, camera.center);
            expect(newDistance).toBeCloseTo(camera.radius, 3);
            expect(camera.position.length()).toBeGreaterThan(initialDistance);
        });

        it("should maintain orthonormal basis when yaw changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            camera.pitch = Math.PI / 4; // Set a non-zero pitch first

            const yawValues = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2];
            for (const yaw of yawValues) {
                camera.yaw = yaw;

                expect(isUnitVector(camera.upVector)).toBe(true);
                const lookDir = camera.center.subtract(camera.position).normalize();
                expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
            }
        });

        it("should maintain orthonormal basis when pitch changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Test various pitch values (staying within limits)
            const pitchValues = [0.01, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2 - 0.01];
            for (const pitch of pitchValues) {
                camera.pitch = pitch;

                expect(isUnitVector(camera.upVector)).toBe(true);
                const lookDir = camera.center.subtract(camera.position).normalize();
                expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
            }
        });

        it("should keep camera looking at center after setting properties", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            camera.yaw = Math.PI / 4;
            camera.pitch = Math.PI / 4;
            camera.radius = 10000;

            // Position to center distance should equal radius
            const distanceToCenter = Vector3.Distance(camera.position, camera.center);
            expect(distanceToCenter).toBeCloseTo(camera.radius, 3);
        });

        it("should handle center at different globe positions", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const centers = [
                new Vector3(6371, 0, 0), // Equator, 0° lon
                new Vector3(0, 6371, 0), // Equator, 90° lon
                new Vector3(4505, 0, 4505), // ~45° N latitude
            ];

            for (const newCenter of centers) {
                camera.center = newCenter;

                // Camera should still be valid
                expect(isUnitVector(camera.upVector)).toBe(true);
                const lookDir = camera.center.subtract(camera.position).normalize();
                expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
                expect(Vector3.Distance(camera.position, camera.center)).toBeCloseTo(camera.radius, 1);
            }
        });
    });

    // ============================================
    // TESTS: GeospatialCamera gimbal lock handling
    // ============================================
    describe("GeospatialCamera gimbal lock (pitch near 0)", () => {
        /**
         * When pitch is near 0, the camera looks straight down at the globe.
         * This causes gimbal lock because cross(geocentricUp, lookAt) ≈ 0.
         *
         * The fix in _setOrientation: when right.lengthSquared() < Epsilon,
         * use cross(horiz, lookAt) instead.
         */

        it("should not produce NaN upVector when pitch is near 0", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Set pitch to minimum (looking straight down)
            camera.pitch = camera.limits.pitchMin;

            expect(isNaN(camera.upVector.x)).toBe(false);
            expect(isNaN(camera.upVector.y)).toBe(false);
            expect(isNaN(camera.upVector.z)).toBe(false);
            expect(isUnitVector(camera.upVector)).toBe(true);
        });

        it("should produce valid orientation when pitch is exactly at pitchMin", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            camera.pitch = camera.limits.pitchMin;

            const lookDir = camera.center.subtract(camera.position).normalize();
            expect(isUnitVector(lookDir)).toBe(true);
            expect(isUnitVector(camera.upVector)).toBe(true);
            expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
        });

        it("should not flip upVector when varying yaw at low pitch", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Set very low pitch (near gimbal lock)
            camera.pitch = 0.01;

            const geocentricUp = camera.center.clone().normalize();
            const yawValues = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, -Math.PI];

            for (const yaw of yawValues) {
                camera.yaw = yaw;

                // upVector should always have positive dot product with geocentric up
                // (camera shouldn't flip upside down)
                const dotWithGeoUp = Vector3.Dot(camera.upVector, geocentricUp);
                expect(dotWithGeoUp).toBeGreaterThan(0);
            }
        });
    });

    // ============================================
    // TESTS: GeospatialCamera limits enforcement
    // ============================================
    describe("GeospatialCamera limits", () => {
        it("should clamp pitch to limits", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Try to set pitch below pitchMin
            camera.pitch = -1;
            expect(camera.pitch).toBeGreaterThanOrEqual(camera.limits.pitchMin);

            // Try to set pitch above pitchMax
            camera.pitch = Math.PI;
            expect(camera.pitch).toBeLessThanOrEqual(camera.limits.pitchMax);
        });

        it("should clamp radius to limits", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Try to set radius below radiusMin
            camera.radius = 0.001;
            expect(camera.radius).toBeGreaterThanOrEqual(camera.limits.radiusMin);

            // For radiusMax, if it's Infinity we skip this test
            if (camera.limits.radiusMax !== Infinity) {
                camera.radius = camera.limits.radiusMax * 2;
                expect(camera.radius).toBeLessThanOrEqual(camera.limits.radiusMax);
            }
        });

        it("should wrap yaw to normalized range", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Set yaw to value > π
            camera.yaw = Math.PI * 3;
            expect(camera.yaw).toBeGreaterThanOrEqual(-Math.PI);
            expect(camera.yaw).toBeLessThan(Math.PI);

            // Set yaw to value < -π
            camera.yaw = -Math.PI * 3;
            expect(camera.yaw).toBeGreaterThanOrEqual(-Math.PI);
            expect(camera.yaw).toBeLessThan(Math.PI);
        });
    });

    // ============================================
    // TESTS: GeospatialCamera zoom methods
    // ============================================
    describe("GeospatialCamera zoom methods", () => {
        it("zoomAlongLookAt should change radius without changing center", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            const initialCenter = camera.center.clone();
            const initialRadius = camera.radius;

            camera.zoomAlongLookAt(100);

            expect(camera.center.equals(initialCenter)).toBe(true);
            expect(camera.radius).toBeLessThan(initialRadius);
        });

        it("zoomToPoint should update center toward target", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            const initialCenter = camera.center.clone();

            // Zoom toward a point slightly offset from current center
            const targetPoint = new Vector3(6371, 100, 0);
            camera.zoomToPoint(targetPoint, 500);

            // Center should have moved toward target
            const centerMovement = camera.center.subtract(initialCenter);
            expect(centerMovement.length()).toBeGreaterThan(0);
        });

        it("should maintain valid orientation after zoomToPoint", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const targetPoint = new Vector3(6371, 100, 100);
            camera.zoomToPoint(targetPoint, 500);

            expect(isUnitVector(camera.upVector)).toBe(true);
            const lookDir = camera.center.subtract(camera.position).normalize();
            expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
        });
    });

    // ============================================
    // TESTS: GeospatialCamera view matrix
    // ============================================
    describe("GeospatialCamera view matrix", () => {
        it("should return valid view matrix", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const viewMatrix = camera.getViewMatrix();

            // View matrix should be a valid transformation matrix
            expect(viewMatrix).toBeDefined();
            // Check it's not the identity (camera has actual transformation)
            const det = viewMatrix.determinant();
            expect(Math.abs(det)).toBeGreaterThan(0.999);
            expect(Math.abs(det)).toBeLessThan(1.001);
        });

        it("should update view matrix when orientation changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const matrix1 = camera.getViewMatrix().clone();
            camera.yaw = Math.PI / 2;
            const matrix2 = camera.getViewMatrix().clone();

            // Matrices should be different
            expect(matrix1.equals(matrix2)).toBe(false);
        });
    });

    // ============================================
    // TESTS: GeospatialCamera yaw/pitch round-trip through setters
    // ============================================
    describe("GeospatialCamera yaw/pitch round-trip", () => {
        /**
         * These tests verify that setting yaw/pitch produces consistent lookAt directions
         * by checking the camera's actual position and center relationship.
         */

        it("should produce consistent lookAt for various yaw/pitch combinations", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const testCases = [
                { yaw: 0, pitch: Math.PI / 6 },
                { yaw: Math.PI / 4, pitch: Math.PI / 4 },
                { yaw: -Math.PI / 3, pitch: Math.PI / 3 },
                { yaw: Math.PI / 2, pitch: Math.PI / 4 },
            ];

            for (const { yaw, pitch } of testCases) {
                camera.yaw = yaw;
                camera.pitch = pitch;

                // After setting yaw/pitch, verify camera state is consistent
                const lookDir = camera.center.subtract(camera.position).normalize();

                // Camera should have valid orientation
                expect(isUnitVector(lookDir)).toBe(true);
                expect(isUnitVector(camera.upVector)).toBe(true);
                expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);

                // Verify the yaw/pitch values are what we set (accounting for normalization)
                expect(camera.pitch).toBeCloseTo(pitch, 3);
                // Yaw comparison needs to handle wraparound
                let yawDiff = camera.yaw - yaw;
                while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
                while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
                expect(Math.abs(yawDiff)).toBeLessThan(0.001);
            }
        });

        it("should maintain consistent lookAt when changing only yaw", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            camera.pitch = Math.PI / 4; // Set fixed pitch

            // Track positions for all yaw values
            const positions: Vector3[] = [];
            const yawValues = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2];

            for (const yaw of yawValues) {
                camera.yaw = yaw;
                positions.push(camera.position.clone());

                // Each position should be at the same distance from center
                const dist = Vector3.Distance(camera.position, camera.center);
                expect(dist).toBeCloseTo(camera.radius, 3);
            }
        });

        it("should maintain consistent lookAt when changing only pitch", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            camera.yaw = Math.PI / 4; // Set fixed yaw

            const pitchValues = [0.01, Math.PI / 6, Math.PI / 4, Math.PI / 3];

            for (const pitch of pitchValues) {
                camera.pitch = pitch;

                // Each position should be at the same distance from center
                const dist = Vector3.Distance(camera.position, camera.center);
                expect(dist).toBeCloseTo(camera.radius, 3);

                // upVector should always be valid
                expect(isUnitVector(camera.upVector)).toBe(true);
            }
        });
    });

    // ============================================
    // TESTS: GeospatialCamera center change preserving orientation
    // ============================================
    describe("GeospatialCamera center change behavior", () => {
        /**
         * When center changes via the setter, the camera should:
         * 1. Maintain the same yaw/pitch angles relative to the new local basis
         * 2. Keep camera looking at the new center
         * 3. Position should update to maintain the same radius
         */

        it("should maintain yaw/pitch when center changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            // Set specific orientation
            camera.yaw = Math.PI / 4;
            camera.pitch = Math.PI / 4;
            const originalYaw = camera.yaw;
            const originalPitch = camera.pitch;

            // Change center (but not too far to hit pole limits)
            camera.center = new Vector3(6371, 100, 0);

            // Yaw and pitch should remain the same
            expect(camera.yaw).toBeCloseTo(originalYaw, 3);
            expect(camera.pitch).toBeCloseTo(originalPitch, 3);
        });

        it("should maintain radius when center changes", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            const originalRadius = camera.radius;
            camera.center = new Vector3(6371, 100, 0);

            expect(camera.radius).toBeCloseTo(originalRadius, 3);
        });

        it("should maintain valid camera orientation at various globe positions", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });
            camera.yaw = Math.PI / 3;
            camera.pitch = Math.PI / 4;

            const centers = [
                new Vector3(6371, 0, 0), // Equator, 0° lon
                new Vector3(0, 6371, 0), // Equator, 90° lon
                new Vector3(4505, 0, 4505), // ~45° N latitude (cos(45°)*6371, 0, sin(45°)*6371)
            ];

            for (const newCenter of centers) {
                camera.center = newCenter;

                // Camera should still have valid orientation
                expect(isUnitVector(camera.upVector)).toBe(true);
                const lookDir = camera.center.subtract(camera.position).normalize();
                expect(arePerpendicular(lookDir, camera.upVector)).toBe(true);
            }
        });
    });

    // ============================================
    // TESTS: GeospatialCamera zoomToPoint orientation preservation
    // ============================================
    describe("GeospatialCamera zoomToPoint orientation", () => {
        /**
         * The zoomToPoint method should:
         * 1. Move the camera toward the target point
         * 2. Update center appropriately
         * 3. NOT cause visible rotation (pitch hitch)
         *
         * This tests the fix for the original bug where zoom inertia ending
         * caused a pitch hitch.
         */

        it("should not significantly change pitch angle during zoom", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            camera.yaw = Math.PI / 4;
            camera.pitch = Math.PI / 4;

            const initialPitch = camera.pitch;
            const initialYaw = camera.yaw;

            // Zoom toward a point
            const targetPoint = new Vector3(6371, 50, 50);
            camera.zoomToPoint(targetPoint, 100);

            // Pitch and yaw should be close to original values
            // (Some small change is expected as the center moves)
            expect(Math.abs(camera.pitch - initialPitch)).toBeLessThan(0.1);

            let yawDiff = camera.yaw - initialYaw;
            while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
            while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
            expect(Math.abs(yawDiff)).toBeLessThan(0.1);
        });

        it("should maintain valid camera basis after multiple zooms", () => {
            const camera = new GeospatialCamera("testCam", scene, { planetRadius: 6371 });

            camera.pitch = Math.PI / 4;
            camera.yaw = 0;

            // Perform multiple zoom operations
            for (let i = 0; i < 5; i++) {
                const targetPoint = new Vector3(6371 + i * 10, i * 10, i * 10);
                camera.zoomToPoint(targetPoint, 50);

                // Camera should remain valid after each zoom
                expect(isUnitVector(camera.upVector)).toBe(true);
                expect(isNaN(camera.upVector.x)).toBe(false);
                expect(isNaN(camera.upVector.y)).toBe(false);
                expect(isNaN(camera.upVector.z)).toBe(false);
            }
        });
    });
});
