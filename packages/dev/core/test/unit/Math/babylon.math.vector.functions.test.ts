import { Vector3FromFloatsToRef, Vector3ScaleInPlace, Vector3ScaleToRef } from "../../../src/Maths/math.vector.functions";

describe("Vector functions tests", () => {
    describe("Vector3", () => {
        it("writes floats into result", () => {
            const target = { x: 0, y: 0, z: 0 };
            const result = Vector3FromFloatsToRef(7, 8, 9, target);
            expect(result).toBe(target);
            expect(target).toEqual({ x: 7, y: 8, z: 9 });
        });

        it("scales to ref", () => {
            const target = { x: 1, y: 2, z: 3 };
            const result = Vector3ScaleToRef(target, 2, { x: 0, y: 0, z: 0 });
            expect(result).not.toBe(target);
            expect(target).toEqual({ x: 1, y: 2, z: 3 });
            expect(result).toEqual({ x: 2, y: 4, z: 6 });
        });

        it("scales in place", () => {
            const vector = { x: -1, y: 2, z: -3 };
            const result = Vector3ScaleInPlace(vector, 3);
            expect(result).toBe(vector);
            expect(vector).toEqual({ x: -3, y: 6, z: -9 });
        });
    });
});
