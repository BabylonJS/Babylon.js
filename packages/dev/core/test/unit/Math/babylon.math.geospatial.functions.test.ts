import { LatLonFromDegreesToRef, LatLonToNormalToRef } from "../../../src/Maths/math.geospatial.functions";
import { Vector3Length } from "../../../src/Maths/math.vector.functions";

describe("Geospatial function tests", () => {
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
            expect(lat).toBe(exLat);
            expect(lon).toBe(exLon);
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
        ])("should return %s", (_name, lat, lon, ex, ey, ez) => {
            const result = LatLonToNormalToRef({ lat, lon }, { x: 0, y: 0, z: 0 });
            expect(Vector3Length(result)).toBeCloseTo(1, 9);
            expect(result.x).toBeCloseTo(ex, 9);
            expect(result.y).toBeCloseTo(ey, 9);
            expect(result.z).toBeCloseTo(ez, 9);
        });
    });
});
