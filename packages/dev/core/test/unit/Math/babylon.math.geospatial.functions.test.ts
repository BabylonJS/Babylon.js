import { LatLonToNormalToRef } from "../../../src/Maths/math.geospatial.functions";
import { Vector3Length } from "../../../src/Maths/math.vector.functions";

describe("Geospatial function tests", () => {
    describe("LatLonToNormalToRef", () => {
        it.each([
            ["(1,0,0) at equator/prime meridian (ECEF X-axis)", 0, 0, 1, 0, 0],
            ["(-1,0,0) at equator/antimeridian (ECEF X-axis)", 0, Math.PI, -1, 0, 0],
            ["(0,1,0) at equator/90E (ECEF Y-axis)", 0, Math.PI / 2, 0, 1, 0],
            ["(0,-1,0) at equator/270E (ECEF Y-axis)", 0, (3 * Math.PI) / 2, 0, -1, 0],
            ["(0,0,1) at North Pole (ECEF Z-axis)", Math.PI / 2, 0, 0, 0, 1],
            ["(0,0,-1) at South Pole (ECEF Z-axis)", -Math.PI / 2, 0, 0, 0, -1],
            ["non-axis-aligned at 45N 30W", Math.PI / 4, -Math.PI / 6, Math.sqrt(6) / 4, -Math.sqrt(2) / 4, Math.SQRT1_2],
        ])("should return %s", (_name, lat, lon, ex, ey, ez) => {
            const result = LatLonToNormalToRef({ lat, lon }, { x: 0, y: 0, z: 0 });
            expect(Vector3Length(result)).toBeCloseTo(1, 9);
            expect(result.x).toBeCloseTo(ex, 9);
            expect(result.y).toBeCloseTo(ey, 9);
            expect(result.z).toBeCloseTo(ez, 9);
        });
    });
});
