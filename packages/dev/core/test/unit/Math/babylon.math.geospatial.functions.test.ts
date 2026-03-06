import { EcefFromLatLonAltToRef, LatLonFromDegreesToRef, LatLonToNormalToRef, Wgs84Ellipsoid } from "../../../src/Maths/math.geospatial.functions";
import { Vector3Length } from "../../../src/Maths/math.vector.functions";

describe("Geospatial function tests", () => {
    describe("Wgs84Ellipsoid", () => {
        it("should have expected constants", () => {
            const { semiMajorAxis, flattening, semiMinorAxis, firstEccentricitySquared, secondEccentricitySquared } = Wgs84Ellipsoid;
            expect(semiMajorAxis).toBe(6378137.0);
            expect(flattening).toBe(1 / 298.257223563);
            expect(semiMinorAxis).toBeCloseTo(6378137.0 * (1 - 1 / 298.257223563), 10);
            expect(firstEccentricitySquared).toBeCloseTo(2 / 298.257223563 - 1 / (298.257223563 * 298.257223563), 14);
            expect(secondEccentricitySquared).toBeCloseTo(firstEccentricitySquared / (1 - firstEccentricitySquared), 14);
        });
    });
    describe("LatLonFromDegreesToRef", () => {
        it.each([
            ["(0, 0)", 0, 0, 0, 0],
            ["(0, 180)", 0, 180, 0, Math.PI],
            ["(90, 0)", 90, 0, Math.PI / 2, 0],
            ["(-90, 0)", -90, 0, -Math.PI / 2, 0],
            ["(45, 30)", 45, 30, Math.PI / 4, Math.PI / 6],
            ["(-45, -30)", -45, -30, -Math.PI / 4, -Math.PI / 6],
        ])("should convert %s in degrees", (_name, latDeg, lonDeg, exLat, exLon) => {
            const { lat, lon } = LatLonFromDegreesToRef(latDeg, lonDeg, { lat: 0, lon: 0 });
            expect(lat).toBeCloseTo(exLat, 9);
            expect(lon).toBeCloseTo(exLon, 9);
        });
    });
    describe("LatLonToNormalToRef", () => {
        it.each([
            ["(1,0,0) at latLon=(0, 0) degrees (ECEF X-axis)", 0, 0, 1, 0, 0],
            ["(-1,0,0) at latLon=(0, 180) degrees (ECEF X-axis)", 0, Math.PI, -1, 0, 0],
            ["(0,1,0) at latLon=(0, 90) degrees (ECEF Y-axis)", 0, Math.PI / 2, 0, 1, 0],
            ["(0,-1,0) at latLon=(0, -90) degrees (ECEF Y-axis)", 0, -Math.PI / 2, 0, -1, 0],
            ["(0,0,1) at latLon=(90, 0) degrees (ECEF Z-axis)", Math.PI / 2, 0, 0, 0, 1],
            ["(0,0,-1) at latLon=(-90, 0) degrees (ECEF Z-axis)", -Math.PI / 2, 0, 0, 0, -1],
            ["(0,0,1) beyond North Pole (ECEF Z-axis)", 0.1 + Math.PI / 2, 0, 0, 0, 1],
            ["(0,0,-1) beyond South Pole (ECEF Z-axis)", -Math.PI / 2 - 0.1, 0, 0, 0, -1],
            ["non-axis-aligned at latLon=(45, -30) degrees", Math.PI / 4, -Math.PI / 6, Math.sqrt(6) / 4, -Math.sqrt(2) / 4, Math.SQRT1_2],
        ])("should return %s", (_name, lat, lon, x, y, z) => {
            const result = LatLonToNormalToRef({ lat, lon }, { x: 0, y: 0, z: 0 });
            expect(Vector3Length(result)).toBeCloseTo(1, 9);
            expect(result.x).toBeCloseTo(x, 9);
            expect(result.y).toBeCloseTo(y, 9);
            expect(result.z).toBeCloseTo(z, 9);
        });
    });
    describe("EcefFromLatLonAltToRef using Wgs84Ellipsoid", () => {
        it.each([
            ["(semiMajorAxis, 0, 0) at latLonAlt=(0, 0, 0)", 0, 0, 0, Wgs84Ellipsoid.semiMajorAxis, 0, 0],
            ["(semiMajorAxis + 1234, 0, 0) at latLonAlt=(0, 0, 1234)", 0, 0, 1234, Wgs84Ellipsoid.semiMajorAxis + 1234, 0, 0],
            ["(-semiMajorAxis, 0, 0) at latLonAlt=(0, 180, 0)", 0, Math.PI, 0, -Wgs84Ellipsoid.semiMajorAxis, 0, 0],
            ["(-semiMajorAxis - 100, 0, 0) at latLonAlt=(0, 180, 100)", 0, Math.PI, 100, -Wgs84Ellipsoid.semiMajorAxis - 100, 0, 0],
            ["(0, semiMajorAxis, 0) at latLonAlt=(0, 90, 0)", 0, Math.PI / 2, 0, 0, Wgs84Ellipsoid.semiMajorAxis, 0],
            ["(0, semiMajorAxis - 12, 0) at latLonAlt=(0, 90, -12)", 0, Math.PI / 2, -12, 0, Wgs84Ellipsoid.semiMajorAxis - 12, 0],
            ["(0, -semiMajorAxis, 0) at latLonAlt=(0, -90, 0)", 0, -Math.PI / 2, 0, 0, -Wgs84Ellipsoid.semiMajorAxis, 0],
            ["(0, -semiMajorAxis - 56789, 0) at latLonAlt=(0, -90, 56789)", 0, -Math.PI / 2, 56789, 0, -Wgs84Ellipsoid.semiMajorAxis - 56789, 0],
            ["(0, 0, semiMinorAxis) at latLonAlt=(90, 0, 0)", Math.PI / 2, 0, 0, 0, 0, Wgs84Ellipsoid.semiMinorAxis],
            ["(0, 0, semiMinorAxis + 1000) at latLonAlt=(90, 0, 1000)", Math.PI / 2, 0, 1000, 0, 0, Wgs84Ellipsoid.semiMinorAxis + 1000],
            ["(0, 0, -semiMinorAxis) at latLonAlt=(-90, 0, 0)", -Math.PI / 2, 0, 0, 0, 0, -Wgs84Ellipsoid.semiMinorAxis],
            ["(0, 0, -semiMinorAxis + 1000) at latLonAlt=(-90, 0, -1000)", -Math.PI / 2, 0, -1000, 0, 0, -Wgs84Ellipsoid.semiMinorAxis + 1000],
            ["(0, 0, semiMinorAxis) beyond North Pole", Math.PI / 2 + 0.1, 0, 0, 0, 0, Wgs84Ellipsoid.semiMinorAxis],
        ])("should return %s", (_name, lat, lon, alt, x, y, z) => {
            const result = EcefFromLatLonAltToRef({ lat, lon, alt }, Wgs84Ellipsoid, { x: 0, y: 0, z: 0 });
            expect(result.x).toBeCloseTo(x, 6);
            expect(result.y).toBeCloseTo(y, 6);
            expect(result.z).toBeCloseTo(z, 6);
        });
    });
    describe("EcefFromLatLonAltToRef (Spherical)", () => {
        const semiMajorAxis = 1000000;
        const sphericalEllipsoid = { semiMajorAxis, firstEccentricitySquared: 0 };
        it.each([
            ["(semiMajorAxis, 0, 0) at latLonAlt=(0, 0, 0)", 0, 0, 0, semiMajorAxis, 0, 0],
            ["(semiMajorAxis + 1234, 0, 0) at latLonAlt=(0, 0, 1234)", 0, 0, 1234, semiMajorAxis + 1234, 0, 0],
            ["(-semiMajorAxis, 0, 0) at latLonAlt=(0, 180, 0)", 0, Math.PI, 0, -semiMajorAxis, 0, 0],
            ["(-semiMajorAxis - 100, 0, 0) at latLonAlt=(0, 180, 100)", 0, Math.PI, 100, -semiMajorAxis - 100, 0, 0],
            ["(0, semiMajorAxis, 0) at latLonAlt=(0, 90, 0)", 0, Math.PI / 2, 0, 0, semiMajorAxis, 0],
            ["(0, semiMajorAxis - 12, 0) at latLonAlt=(0, 90, -12)", 0, Math.PI / 2, -12, 0, semiMajorAxis - 12, 0],
            ["(0, -semiMajorAxis, 0) at latLonAlt=(0, -90, 0)", 0, -Math.PI / 2, 0, 0, -semiMajorAxis, 0],
            ["(0, -semiMajorAxis - 56789, 0) at latLonAlt=(0, -90, 56789)", 0, -Math.PI / 2, 56789, 0, -semiMajorAxis - 56789, 0],
            ["(0, 0, semiMajorAxis) at latLonAlt=(90, 0, 0)", Math.PI / 2, 0, 0, 0, 0, semiMajorAxis],
            ["(0, 0, semiMajorAxis + 1000) at latLonAlt=(90, 0, 1000)", Math.PI / 2, 0, 1000, 0, 0, semiMajorAxis + 1000],
            ["(0, 0, -semiMajorAxis) at latLonAlt=(-90, 0, 0)", -Math.PI / 2, 0, 0, 0, 0, -semiMajorAxis],
            ["(0, 0, -semiMajorAxis + 1000) at latLonAlt=(-90, 0, -1000)", -Math.PI / 2, 0, -1000, 0, 0, -semiMajorAxis + 1000],
            ["(0, 0, semiMajorAxis) beyond North Pole", Math.PI / 2 + 0.1, 0, 0, 0, 0, semiMajorAxis],
            [
                "non-axis-aligned at latLonAlt=(45, -30, 1000)",
                Math.PI / 4,
                -Math.PI / 6,
                1000,
                (semiMajorAxis + 1000) * (Math.sqrt(6) / 4), // R * cos(45) * cos(-30)
                (semiMajorAxis + 1000) * (-Math.sqrt(2) / 4), // R * cos(45) * sin(-30)
                (semiMajorAxis + 1000) * Math.SQRT1_2, // R * sin(45)
            ],
        ])("should return %s", (_name, lat, lon, alt, x, y, z) => {
            const result = EcefFromLatLonAltToRef({ lat, lon, alt }, sphericalEllipsoid, { x: 0, y: 0, z: 0 });
            expect(result.x).toBeCloseTo(x, 9);
            expect(result.y).toBeCloseTo(y, 9);
            expect(result.z).toBeCloseTo(z, 9);
        });
    });
});
