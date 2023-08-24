import { Matrix, Plane, Quaternion, Vector2, Vector3, Vector4, Viewport } from "core/Maths";
import { BabylonMathVectorGetAngleBetweenVectorsOnPlaneTestCases } from "./babylon.math.vector.get-angle-between-vectors-on-plane.test-cases";

describe("Babylon Vector tests", () => {
    describe("Vector2", () => {
        let vector1: Vector2;
        let vector2: Vector2;
        let shouldNotChange: boolean;

        beforeEach(() => {
            vector1 = new Vector2(1, 2);
            vector2 = new Vector2(3, 4);
            shouldNotChange = false;
        });

        afterEach(() => {
            if (shouldNotChange) {
                expect(vector1.x).toBe(1);
                expect(vector1.y).toBe(2);
                expect(vector2.x).toBe(3);
                expect(vector2.y).toBe(4);
            }
        });

        describe("add", () => {
            it("should add two vectors and return a new vector", () => {
                const result = vector1.add(vector2);
                expect(result.x).toBe(4);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("addInPlace", () => {
            it("should add the given vector to the current vector", () => {
                vector1.addInPlace(vector2);
                expect(vector1.x).toBe(4);
                expect(vector1.y).toBe(6);
            });
        });

        describe("addToRef", () => {
            it("should add the given vector to the current vector and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.addToRef(vector2, result);
                expect(result.x).toBe(4);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });
        describe("addVector3", () => {
            it("should add a Vector3 to the current vector", () => {
                const vector3 = new Vector3(5, 6, 7);
                const result = vector1.addVector3(vector3);
                expect(result.x).toBe(6);
                expect(result.y).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("asArray", () => {
            it("should return an array representation of the vector", () => {
                const result = vector1.asArray();
                expect(result.length).toBe(2);
                expect(result[0]).toBe(1);
                expect(result[1]).toBe(2);
                shouldNotChange = true;
            });
        });

        describe("clone", () => {
            it("should create a new vector with the same values", () => {
                const cloned = vector1.clone();
                expect(cloned).not.toBe(vector1);
                expect(cloned.x).toBe(vector1.x);
                expect(cloned.y).toBe(vector1.y);
                shouldNotChange = true;
            });
        });

        describe("copyFrom", () => {
            it("should copy the values from another vector", () => {
                vector1.copyFrom(vector2);
                expect(vector1.x).toBe(vector2.x);
                expect(vector1.y).toBe(vector2.y);
            });
        });

        describe("copyFromFloats", () => {
            it("should set the vector from individual x and y values", () => {
                vector1.copyFromFloats(5, 6);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(6);
            });
        });

        describe("divide", () => {
            it("should divide the vector by another vector", () => {
                const result = vector1.divide(vector2);
                expect(result.x).toBeCloseTo(1 / 3);
                expect(result.y).toBeCloseTo(2 / 4);
                shouldNotChange = true;
            });
        });

        describe("divideInPlace", () => {
            it("should divide the current vector by the given vector", () => {
                vector1.divideInPlace(vector2);
                expect(vector1.x).toBeCloseTo(1 / 3);
                expect(vector1.y).toBeCloseTo(2 / 4);
            });
        });

        describe("divideToRef", () => {
            it("should divide the current vector by the given vector and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.divideToRef(vector2, result);
                expect(result.x).toBeCloseTo(1 / 3);
                expect(result.y).toBeCloseTo(2 / 4);
                shouldNotChange = true;
            });
        });

        describe("equals", () => {
            it("should return true if the vector equals the given vector", () => {
                const equals = vector1.equals(vector2);
                expect(equals).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("equalsWithEpsilon", () => {
            it("should return true if the vector is approximately equal to the given vector within the epsilon range", () => {
                const equals = vector1.equalsWithEpsilon(vector2, 0.01);
                expect(equals).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("floor", () => {
            it("should set each component of the vector to the largest integer less than or equal to it", () => {
                const result = vector1.floor();
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                shouldNotChange = true;
            });
        });

        describe("fract", () => {
            it("should set each component of the vector to its fractional part", () => {
                const result = vector1.fract();
                expect(result.x).toBe(0);
                expect(result.y).toBe(0);
                shouldNotChange = true;
            });
        });

        describe("fromArray", () => {
            it("should set the vector from an array", () => {
                const array = [5, 6];
                vector1.fromArray(array);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(6);
            });
        });

        describe("length", () => {
            it("should return the length (magnitude) of the vector", () => {
                const length = vector1.length();
                expect(length).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2));
                shouldNotChange = true;
            });
        });

        describe("lengthSquared", () => {
            it("should return the squared length of the vector", () => {
                const lengthSquared = vector1.lengthSquared();
                expect(lengthSquared).toBeCloseTo(1 * 1 + 2 * 2);
                shouldNotChange = true;
            });
        });

        describe("multiply", () => {
            it("should multiply the vector by another vector", () => {
                const result = vector1.multiply(vector2);
                expect(result.x).toBe(3);
                expect(result.y).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("multiplyByFloats", () => {
            it("should multiply the vector by the given scalar values", () => {
                const result = vector1.multiplyByFloats(2, 3);
                expect(result.x).toBe(2);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("multiplyInPlace", () => {
            it("should multiply the current vector by the given vector", () => {
                vector1.multiplyInPlace(vector2);
                expect(vector1.x).toBe(3);
                expect(vector1.y).toBe(8);
            });
        });

        describe("multiplyToRef", () => {
            it("should multiply the current vector by the given vector and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.multiplyToRef(vector2, result);
                expect(result.x).toBe(3);
                expect(result.y).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("negate", () => {
            it("should negate each component of the vector and return a new vector", () => {
                const result = vector1.negate();
                expect(result.x).toBe(-1);
                expect(result.y).toBe(-2);
                shouldNotChange = true;
            });
        });

        describe("negateInPlace", () => {
            it("should negate each component of the current vector", () => {
                vector1.negateInPlace();
                expect(vector1.x).toBe(-1);
                expect(vector1.y).toBe(-2);
            });
        });

        describe("negateToRef", () => {
            it("should negate each component of the current vector and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.negateToRef(result);
                expect(result.x).toBe(-1);
                expect(result.y).toBe(-2);
                shouldNotChange = true;
            });
        });

        describe("normalize", () => {
            it("should normalize the vector", () => {
                vector1.normalize();
                const length = vector1.length();
                expect(length).toBeCloseTo(1);
            });
        });

        describe("rotateToRef", () => {
            it("should rotate the vector by the given angle (in radians) and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.rotateToRef(Math.PI / 2, result);
                expect(result.x).toBeCloseTo(-2);
                expect(result.y).toBeCloseTo(1);
                shouldNotChange = true;
            });
        });

        describe("scale", () => {
            it("should scale the vector by the given scalar value and return a new vector", () => {
                const result = vector1.scale(2);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("scaleAndAddToRef", () => {
            it("should scale the current vector by the given scalar value and add it to the given vector, storing the result in the given output vector", () => {
                const result = new Vector2();
                vector1.scaleAndAddToRef(2, result);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("scaleInPlace", () => {
            it("should scale the current vector by the given scalar value", () => {
                vector1.scaleInPlace(2);
                expect(vector1.x).toBe(2);
                expect(vector1.y).toBe(4);
            });
        });

        describe("scaleToRef", () => {
            it("should scale the current vector by the given scalar value and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.scaleToRef(2, result);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("set", () => {
            it("should set the vector components to the given values", () => {
                vector1.set(5, 6);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(6);
            });
        });

        describe("subtract", () => {
            it("should subtract the given vector from the current vector and return a new vector", () => {
                const result = vector1.subtract(vector2);
                expect(result.x).toBe(-2);
                expect(result.y).toBe(-2);
                shouldNotChange = true;
            });
        });

        describe("subtractInPlace", () => {
            it("should subtract the given vector from the current vector", () => {
                vector1.subtractInPlace(vector2);
                expect(vector1.x).toBe(-2);
                expect(vector1.y).toBe(-2);
            });
        });

        describe("subtractToRef", () => {
            it("should subtract the given vector from the current vector and store the result in the given output vector", () => {
                const result = new Vector2();
                vector1.subtractToRef(vector2, result);
                expect(result.x).toBe(-2);
                expect(result.y).toBe(-2);
                shouldNotChange = true;
            });
        });

        describe("toArray", () => {
            it("should return an array representation of the vector", () => {
                const result: number[] = [];
                vector1.toArray(result);
                expect(result.length).toBe(2);
                expect(result[0]).toBe(1);
                expect(result[1]).toBe(2);
            });
        });

        describe("CatmullRom", () => {
            it("should interpolate the vector using a Catmull-Rom spline", () => {
                const p0 = new Vector2(0, 0);
                const vector1 = new Vector2(1, 1);
                const vector2 = new Vector2(2, 2);
                const p3 = new Vector2(3, 3);
                const result = Vector2.CatmullRom(p0, vector1, vector2, p3, 0.5);
                expect(result.x).toBeCloseTo(1.5);
                expect(result.y).toBeCloseTo(1.5);
                shouldNotChange = true;
            });
        });

        describe("Center", () => {
            it("should calculate the center between two vectors", () => {
                const result = Vector2.Center(vector1, vector2);
                expect(result.x).toBeCloseTo(2);
                expect(result.y).toBeCloseTo(3);
                shouldNotChange = true;
            });
        });

        describe("CenterToRef", () => {
            it("should calculate the center between two vectors and store the result in the given output vector", () => {
                const result = new Vector2();
                Vector2.CenterToRef(vector1, vector2, result);
                expect(result.x).toBeCloseTo(2);
                expect(result.y).toBeCloseTo(3);
                shouldNotChange = true;
            });
        });

        describe("Clamp", () => {
            it("should clamp the vector components within the range defined by the min and max vectors", () => {
                const min = new Vector2(1, 2);
                const max = new Vector2(3, 4);
                const result = Vector2.Clamp(vector1, min, max);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                shouldNotChange = true;
            });
        });

        describe("Distance", () => {
            it("should calculate the distance between two vectors", () => {
                const distance = Vector2.Distance(vector1, vector2);
                expect(distance).toBeCloseTo(Math.sqrt(8));
                shouldNotChange = true;
            });
        });

        describe("DistanceOfPointFromSegment", () => {
            it("should calculate the distance between a point and a line segment defined by two vectors", () => {
                const point = new Vector2(5, 6);
                const segmentStart = new Vector2(0, 0);
                const segmentEnd = new Vector2(10, 10);
                const distance = Vector2.DistanceOfPointFromSegment(point, segmentStart, segmentEnd);
                expect(distance).toBeCloseTo(0.7071067811865476 /* sqrt(2) / 2 */);
                shouldNotChange = true;
            });
        });

        describe("DistanceSquared", () => {
            it("should calculate the squared distance between two vectors", () => {
                const distanceSquared = Vector2.DistanceSquared(vector1, vector2);
                expect(distanceSquared).toBeCloseTo(8);
                shouldNotChange = true;
            });
        });

        describe("Dot", () => {
            it("should calculate the dot product of two vectors", () => {
                const dotProduct = Vector2.Dot(vector1, vector2);
                expect(dotProduct).toBe(11);
                shouldNotChange = true;
            });
        });

        describe("FromArray", () => {
            it("should create a new vector from an array", () => {
                const array = [5, 6];
                const result = Vector2.FromArray(array);
                expect(result.x).toBe(5);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("FromArrayToRef", () => {
            it("should create a new vector from an array and store the result in the given output vector", () => {
                const array = [5, 6];
                const result = new Vector2();
                Vector2.FromArrayToRef(array, 0, result);
                expect(result.x).toBe(5);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("Hermite", () => {
            it("should interpolate the vector using a Hermite spline", () => {
                const tangent1 = new Vector2(1, 1);
                const tangent2 = new Vector2(3, 3);
                const result = Vector2.Hermite(vector1, tangent1, vector2, tangent2, 0.5);
                expect(result.x).toBeCloseTo(1.75);
                expect(result.y).toBeCloseTo(2.75);
                shouldNotChange = true;
            });
        });

        describe("Hermite1stDerivative", () => {
            it("should calculate the 1st derivative of a Hermite spline at the given position", () => {
                const tangent1 = new Vector2(1, 1);
                const tangent2 = new Vector2(3, 3);
                const result = Vector2.Hermite1stDerivative(vector1, tangent1, vector2, tangent2, 0.5);
                expect(result.x).toBeCloseTo(2);
                expect(result.y).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("Hermite1stDerivativeToRef", () => {
            it("should calculate the 1st derivative of a Hermite spline at the given position and store the result in the given output vector", () => {
                const tangent1 = new Vector2(1, 1);
                const tangent2 = new Vector2(3, 3);
                const result = new Vector2();
                Vector2.Hermite1stDerivativeToRef(vector1, tangent1, vector2, tangent2, 0.5, result);
                expect(result.x).toBeCloseTo(2);
                expect(result.y).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("Lerp", () => {
            it("should interpolate between two vectors using linear interpolation", () => {
                const result = Vector2.Lerp(vector1, vector2, 0.5);
                expect(result.x).toBeCloseTo(2);
                expect(result.y).toBeCloseTo(3);
                shouldNotChange = true;
            });
        });

        describe("Maximize", () => {
            it("should set each component of the vector to the maximum value between the current vector and the given vector", () => {
                const result = Vector2.Maximize(vector1, vector2);
                expect(result.x).toBe(3);
                expect(result.y).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("Minimize", () => {
            it("should set each component of the vector to the minimum value between the current vector and the given vector", () => {
                const result = Vector2.Minimize(vector1, vector2);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                shouldNotChange = true;
            });
        });

        describe("Normalize", () => {
            it("should normalize the vector", () => {
                const result = Vector2.Normalize(vector1);
                const length = result.length();
                expect(length).toBeCloseTo(1);
                shouldNotChange = true;
            });
        });

        describe("NormalizeToRef", () => {
            it("should normalize the vector and store the result in the given output vector", () => {
                const result = new Vector2();
                Vector2.NormalizeToRef(vector1, result);
                const length = result.length();
                expect(length).toBeCloseTo(1);
                shouldNotChange = true;
            });
        });

        describe("PointInTriangle", () => {
            it("should determine if a point is inside a triangle defined by three vectors", () => {
                const p3 = new Vector2(3, 1);
                const isInside1 = Vector2.PointInTriangle(new Vector2(2, 2), vector1, vector2, p3);
                const isInside2 = Vector2.PointInTriangle(new Vector2(0.5, 0.5), vector1, vector2, p3);
                expect(isInside1).toBe(true);
                expect(isInside2).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("Random", () => {
            it("should create a vector with random values between min and max", () => {
                const result = Vector2.Random(0, 1);
                expect(result.x).toBeGreaterThanOrEqual(0);
                expect(result.x).toBeLessThanOrEqual(1);
                expect(result.y).toBeGreaterThanOrEqual(0);
                expect(result.y).toBeLessThanOrEqual(1);
                shouldNotChange = true;
            });
        });

        describe("Transform", () => {
            it("should transform the vector by the given matrix", () => {
                const matrix = Matrix.Translation(3, 4, 0);
                const result = Vector2.Transform(vector1, matrix);
                expect(result.x).toBe(4);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("TransformToRef", () => {
            it("should transform the vector by the given matrix and store the result in the given output vector", () => {
                const matrix = Matrix.Translation(3, 4, 0);
                const result = new Vector2();
                Vector2.TransformToRef(vector1, matrix, result);
                expect(result.x).toBe(4);
                expect(result.y).toBe(6);
                shouldNotChange = true;
            });
        });
    });

    describe("Vector3", () => {
        let vector1: Vector3;
        let vector2: Vector3;
        let shouldNotChange: boolean;

        beforeEach(() => {
            vector1 = new Vector3(1, 2, 3);
            vector2 = new Vector3(4, 5, 6);
            shouldNotChange = false;
        });

        afterEach(() => {
            if (shouldNotChange) {
                expect(vector1.x).toBe(1);
                expect(vector1.y).toBe(2);
                expect(vector1.z).toBe(3);
                expect(vector2.x).toBe(4);
                expect(vector2.y).toBe(5);
                expect(vector2.z).toBe(6);
            }
        });

        describe("add", () => {
            it("should return the sum of two vectors", () => {
                const result = vector1.add(vector2);
                expect(result.x).toEqual(5);
                expect(result.y).toEqual(7);
                expect(result.z).toEqual(9);
                shouldNotChange = true;
            });
        });

        describe("addInPlace", () => {
            it("should add a vector to the current vector", () => {
                vector1.addInPlace(vector2);
                expect(vector1.x).toEqual(5);
                expect(vector1.y).toEqual(7);
                expect(vector1.z).toEqual(9);
            });
        });

        describe("addInPlaceFromFloats", () => {
            it("should add floats to the current vector", () => {
                vector1.addInPlaceFromFloats(4, 5, 6);
                expect(vector1.x).toEqual(5);
                expect(vector1.y).toEqual(7);
                expect(vector1.z).toEqual(9);
            });
        });

        describe("addToRef", () => {
            it("should add two vectors and store the result in another vector", () => {
                const result = new Vector3();
                vector1.addToRef(vector2, result);
                expect(result.x).toEqual(5);
                expect(result.y).toEqual(7);
                expect(result.z).toEqual(9);
                shouldNotChange = true;
            });
        });

        describe("applyRotationQuaternion", () => {
            it("should apply rotation quaternion to the current vector", () => {
                const quaternion = new Quaternion(0, 0, 0, 1);
                const result = vector1.applyRotationQuaternion(quaternion);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("applyRotationQuaternionInPlace", () => {
            it("should apply rotation quaternion to the current vector in place", () => {
                const quaternion = new Quaternion(0, 0, 0, 1);
                vector1.applyRotationQuaternionInPlace(quaternion);
                expect(vector1.x).toEqual(1);
                expect(vector1.y).toEqual(2);
                expect(vector1.z).toEqual(3);
            });
        });

        describe("applyRotationQuaternionToRef", () => {
            it("should apply rotation quaternion to the current vector and store the result in another vector", () => {
                const quaternion = new Quaternion(0, 0, 0, 1);
                const result = new Vector3();
                vector1.applyRotationQuaternionToRef(quaternion, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("clone", () => {
            it("should create a new vector with the same values as the original vector", () => {
                const clone = vector1.clone();
                expect(clone.x).toEqual(1);
                expect(clone.y).toEqual(2);
                expect(clone.z).toEqual(3);
                expect(clone).not.toBe(vector1);
                shouldNotChange = true;
            });
        });

        describe("copyFrom", () => {
            it("should copy the values from another vector", () => {
                vector1.copyFrom(vector2);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("copyFromFloats", () => {
            it("should set the vector values from individual floats", () => {
                vector1.copyFromFloats(4, 5, 6);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("cross", () => {
            it("should return the cross product of two vectors", () => {
                const result = vector1.cross(vector2);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(6);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("divide", () => {
            it("should divide the vector by another vector", () => {
                const result = vector1.divide(vector2);
                expect(result.x).toEqual(0.25);
                expect(result.y).toEqual(0.4);
                expect(result.z).toEqual(0.5);
                shouldNotChange = true;
            });
        });

        describe("divideInPlace", () => {
            it("should divide the vector by another vector in place", () => {
                vector1.divideInPlace(vector2);
                expect(vector1.x).toEqual(0.25);
                expect(vector1.y).toEqual(0.4);
                expect(vector1.z).toEqual(0.5);
            });
        });

        describe("divideToRef", () => {
            it("should divide the vector by another vector and store the result in another vector", () => {
                const result = new Vector3();
                vector1.divideToRef(vector2, result);
                expect(result.x).toEqual(0.25);
                expect(result.y).toEqual(0.4);
                expect(result.z).toEqual(0.5);
                shouldNotChange = true;
            });
        });

        describe("equals", () => {
            it("should return true if the vector is equal to another vector", () => {
                const otherVector = new Vector3(1, 2, 3);
                const result = vector1.equals(otherVector);
                expect(result).toBe(true);
                shouldNotChange = true;
            });
            it("should return false if the vector is not equal to another vector", () => {
                const otherVector = new Vector3(4, 5, 6);
                const result = vector1.equals(otherVector);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("equalsToFloats", () => {
            it("should return true if the vector is equal to the provided floats", () => {
                const result = vector1.equalsToFloats(1, 2, 3);
                expect(result).toBe(true);
                shouldNotChange = true;
            });

            it("should return false if the vector is not equal to the provided floats", () => {
                const result = vector1.equalsToFloats(4, 5, 6);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("equalsWithEpsilon", () => {
            it("should return true if the vector is approximately equal to another vector within the provided epsilon", () => {
                const otherVector = new Vector3(1.01, 2.01, 3.01);
                const result = vector1.equalsWithEpsilon(otherVector, 0.1);
                expect(result).toBe(true);
                shouldNotChange = true;
            });

            it("should return false if the vector is not approximately equal to another vector within the provided epsilon", () => {
                const result = vector1.equalsWithEpsilon(vector2, 0.1);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("floor", () => {
            it("should set each component of the vector to the largest integer less than or equal to that component", () => {
                const result = vector1.floor();
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("fract", () => {
            it("should compute the fractional part of each component of the vector", () => {
                const result = vector1.fract();
                expect(result.x).toEqual(0);
                expect(result.y).toEqual(0);
                expect(result.z).toEqual(0);
                shouldNotChange = true;
            });
        });

        describe("fromArray", () => {
            it("should create a new vector from an array", () => {
                const array = [4, 5, 6];
                vector1.fromArray(array);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("getNormalToRef", () => {
            it("should compute a normal vector to the current vector and store the result in another vector", () => {
                const result = new Vector3();
                vector1.getNormalToRef(result);
                expect(result.x).toBeCloseTo(0.6324555320336757 /* sqrt(2 / 5) */);
                expect(result.y).toBeCloseTo(-3.1622776601683795 /* -sqrt(10) */);
                expect(result.z).toBeCloseTo(1.8973665961010269 /* 3 * sqrt(2 / 5) */);
                shouldNotChange = true;
            });
        });

        describe("isNonUniformWithinEpsilon", () => {
            it("should return true if the vector has non-uniform values within the provided epsilon", () => {
                const result = vector1.isNonUniformWithinEpsilon(0.1);
                expect(result).toBe(true);
                shouldNotChange = true;
            });

            it("should return false if the vector does not have uniform values within the provided epsilon", () => {
                const result = vector1.isNonUniformWithinEpsilon(2);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("length", () => {
            it("should compute the length (magnitude) of the vector", () => {
                const result = vector1.length();
                expect(result).toBeCloseTo(3.7416573867739413 /* sqrt(14) */, 6);
                shouldNotChange = true;
            });
        });

        describe("lengthSquared", () => {
            it("should compute the squared length of the vector", () => {
                const result = vector1.lengthSquared();
                expect(result).toEqual(14);
                shouldNotChange = true;
            });
        });

        describe("maximizeInPlace", () => {
            it("should set each component of the vector to the maximum value between the current vector and another vector", () => {
                vector1.maximizeInPlace(vector2);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("maximizeInPlaceFromFloats", () => {
            it("should set each component of the vector to the maximum value between the current vector and the provided floats", () => {
                vector1.maximizeInPlaceFromFloats(4, 5, 6);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("minimizeInPlace", () => {
            it("should set each component of the vector to the minimum value between the current vector and another vector", () => {
                vector1.minimizeInPlace(vector2);
                expect(vector1.x).toEqual(1);
                expect(vector1.y).toEqual(2);
                expect(vector1.z).toEqual(3);
            });
        });

        describe("minimizeInPlaceFromFloats", () => {
            it("should set each component of the vector to the minimum value between the current vector and the provided floats", () => {
                vector1.minimizeInPlaceFromFloats(4, 5, 6);
                expect(vector1.x).toEqual(1);
                expect(vector1.y).toEqual(2);
                expect(vector1.z).toEqual(3);
            });
        });

        describe("multiply", () => {
            it("should multiply two vectors component-wise", () => {
                const result = vector1.multiply(vector2);
                expect(result.x).toEqual(4);
                expect(result.y).toEqual(10);
                expect(result.z).toEqual(18);
                shouldNotChange = true;
            });
        });

        describe("multiplyByFloats", () => {
            it("should multiply the vector by individual floats component-wise", () => {
                const result = vector1.multiplyByFloats(4, 5, 6);
                expect(result.x).toEqual(4);
                expect(result.y).toEqual(10);
                expect(result.z).toEqual(18);
                shouldNotChange = true;
            });
        });

        describe("multiplyInPlace", () => {
            it("should multiply the vector by the provided vector in place", () => {
                vector1.multiplyInPlace(vector2);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(10);
                expect(vector1.z).toEqual(18);
            });
        });

        describe("multiplyToRef", () => {
            it("should multiply the vector by another vector component-wise and store the result in another vector", () => {
                const result = new Vector3();
                vector1.multiplyToRef(vector2, result);
                expect(result.x).toEqual(4);
                expect(result.y).toEqual(10);
                expect(result.z).toEqual(18);
                shouldNotChange = true;
            });
        });

        describe("negate", () => {
            it("should negate each component of the vector", () => {
                const result = vector1.negate();
                expect(result.x).toEqual(-1);
                expect(result.y).toEqual(-2);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("negateInPlace", () => {
            it("should negate each component of the vector in place", () => {
                vector1.negateInPlace();
                expect(vector1.x).toEqual(-1);
                expect(vector1.y).toEqual(-2);
                expect(vector1.z).toEqual(-3);
            });
        });

        describe("negateToRef", () => {
            it("should negate each component of the vector and store the result in another vector", () => {
                const result = new Vector3();
                vector1.negateToRef(result);
                expect(result.x).toEqual(-1);
                expect(result.y).toEqual(-2);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("normalize", () => {
            it("should normalize the vector", () => {
                vector1.normalize();
                const length = vector1.length();
                expect(length).toBeCloseTo(1);
            });
        });

        describe("normalizeFromLength", () => {
            it("should normalize the vector with a provided length", () => {
                vector1.normalizeFromLength(10);
                expect(vector1.x).toBeCloseTo(0.1);
                expect(vector1.y).toBeCloseTo(0.2);
                expect(vector1.z).toBeCloseTo(0.3);
            });
        });

        describe("normalizeToNew", () => {
            it("should create a new normalized vector from the current vector", () => {
                const result = vector1.normalizeToNew();
                const length = result.length();
                expect(length).toBeCloseTo(1);
                shouldNotChange = true;
            });
        });

        describe("normalizeToRef", () => {
            it("should normalize the vector and store the result in another vector", () => {
                const result = new Vector3();
                vector1.normalizeToRef(result);
                const length = result.length();
                expect(length).toBeCloseTo(1);
                shouldNotChange = true;
            });
        });

        describe("projectOnPlane", () => {
            it("can project from an origin onto a plane", () => {
                // A ground plane at origin
                const simplePlane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());

                const rayOrigin = new Vector3(0, 10, 0);
                const rayGoingThrough = new Vector3(1, 8, 0);

                // Going left 1 unit for each 2 units downs
                const expected = new Vector3(5, 0, 0);

                expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
            });

            it("can project from an origin onto an offset plane", () => {
                // A ground plane 10 units below origin
                const simplePlane = Plane.FromPositionAndNormal(new Vector3(0, -10, 0), Vector3.Up());

                const rayOrigin = new Vector3(0, 10, 0);
                const rayGoingThrough = new Vector3(1, 8, 0);

                // Going left 1 unit for each 2 units downs
                const expected = new Vector3(10, -10, 0);

                expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
            });

            it("can project parallel to a plane", () => {
                // A ground plane 10 units below origin
                const simplePlane = Plane.FromPositionAndNormal(new Vector3(0, 0, 0), Vector3.Up());

                const rayOrigin = new Vector3(0, 10, 0);
                const rayGoingThrough = new Vector3(10, 10, 0);

                // Going parallel to the plane should return infinity
                const expected = new Vector3(Infinity, Infinity, Infinity);

                expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
            });
        });

        describe("reorderInPlace", () => {
            it("should reorder the vector components in place", () => {
                vector1.reorderInPlace("xyz");
                expect(vector1.x).toEqual(1);
                expect(vector1.y).toEqual(2);
                expect(vector1.z).toEqual(3);
            });
        });

        describe("rotateByQuaternionAroundPointToRef", () => {
            it("should rotate the vector around a point by a quaternion and store the result in another vector", () => {
                const quaternion = new Quaternion(0, 0, 0, 1);
                const result = new Vector3();
                vector1.rotateByQuaternionAroundPointToRef(quaternion, vector2, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("rotateByQuaternionToRef", () => {
            it("should rotate the vector by a quaternion and store the result in another vector", () => {
                const quaternion = new Quaternion(0, 0, 0, 1);
                const result = new Vector3();
                vector1.rotateByQuaternionToRef(quaternion, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("scale", () => {
            it("should scale the vector by a scalar value", () => {
                const result = vector1.scale(2);
                expect(result.x).toEqual(2);
                expect(result.y).toEqual(4);
                expect(result.z).toEqual(6);
                shouldNotChange = true;
            });
        });

        describe("scaleAndAddToRef", () => {
            it("should scale the vector by a scalar value and add it to another vector", () => {
                const result = new Vector3();
                vector1.scaleAndAddToRef(2, result);
                expect(result.x).toEqual(2);
                expect(result.y).toEqual(4);
                expect(result.z).toEqual(6);
                shouldNotChange = true;
            });
        });

        describe("scaleInPlace", () => {
            it("should scale the vector in place by a scalar value", () => {
                vector1.scaleInPlace(2);
                expect(vector1.x).toEqual(2);
                expect(vector1.y).toEqual(4);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("scaleToRef", () => {
            it("should scale the vector by a scalar value and store the result in another vector", () => {
                const result = new Vector3();
                vector1.scaleToRef(2, result);
                expect(result.x).toEqual(2);
                expect(result.y).toEqual(4);
                expect(result.z).toEqual(6);
                shouldNotChange = true;
            });
        });

        describe("set", () => {
            it("should set a vector to the given floats", () => {
                vector1.set(4, 5, 6);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(5);
                expect(vector1.z).toEqual(6);
            });
        });

        describe("setAll", () => {
            it("should set all components of a vector to the given float", () => {
                vector1.setAll(4);
                expect(vector1.x).toEqual(4);
                expect(vector1.y).toEqual(4);
                expect(vector1.z).toEqual(4);
            });
        });

        describe("subtract", () => {
            it("should subtract one vector from another vector (#1)", () => {
                const result = vector1.subtract(vector2);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(-3);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });

            it("should subtract one vector from another vector (#2)", () => {
                const result = vector2.subtract(vector1);
                expect(result.x).toEqual(3);
                expect(result.y).toEqual(3);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("subtractFromFloats", () => {
            it("should subtract floats from a vector", () => {
                const result = vector1.subtractFromFloats(4, 5, 6);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(-3);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("subtractFromFloatsToRef", () => {
            it("should subtract floats from a vector and store the result in another vector", () => {
                const result = new Vector3();
                vector1.subtractFromFloatsToRef(4, 5, 6, result);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(-3);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("subtractInPlace", () => {
            it("should subtract one vector from another vector in place (#1)", () => {
                vector1.subtractInPlace(vector2);
                expect(vector1.x).toEqual(-3);
                expect(vector1.y).toEqual(-3);
                expect(vector1.z).toEqual(-3);
            });

            it("should subtract one vector from another vector in place (#2)", () => {
                vector2.subtractInPlace(vector1);
                expect(vector2.x).toEqual(3);
                expect(vector2.y).toEqual(3);
                expect(vector2.z).toEqual(3);
            });
        });

        describe("subtractToRef", () => {
            it("should subtract one vector from another vector and store the result in another vector (#1)", () => {
                const result = new Vector3();
                vector1.subtractToRef(vector2, result);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(-3);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });

            it("should subtract one vector from another vector and store the result in another vector (#2)", () => {
                const result = new Vector3();
                vector2.subtractToRef(vector1, result);
                expect(result.x).toEqual(3);
                expect(result.y).toEqual(3);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("toQuaternion", () => {
            it("should convert vector to Quaternion", () => {
                const result = vector1.toQuaternion();
                expect(result.x).toBeCloseTo(0.7549338012644525);
                expect(result.y).toBeCloseTo(-0.2061492260268777);
                expect(result.z).toBeCloseTo(0.44443511344300074);
                expect(result.w).toBeCloseTo(0.4359528440735657);
                shouldNotChange = true;
            });
        });

        describe("CatmullRom", () => {
            it("should calculate CatmullRom interpolation", () => {
                const value3 = new Vector3(7, 8, 9);
                const value4 = new Vector3(10, 11, 12);
                const result = Vector3.CatmullRom(vector1, vector2, value3, value4, 0.5);
                expect(result.x).toEqual(5.5);
                expect(result.y).toEqual(6.5);
                expect(result.z).toEqual(7.5);
                shouldNotChange = true;
            });
        });

        describe("Center", () => {
            it("should calculate the center of two vectors", () => {
                const result = Vector3.Center(vector1, vector2);
                expect(result.x).toEqual(2.5);
                expect(result.y).toEqual(3.5);
                expect(result.z).toEqual(4.5);
                shouldNotChange = true;
            });
        });

        describe("CenterToRef", () => {
            it("should calculate the center of two vectors and store the result in the provided vector", () => {
                const value1 = new Vector3(1, 2, 3);
                const value2 = new Vector3(4, 5, 6);
                const result = new Vector3();
                Vector3.CenterToRef(value1, value2, result);
                expect(result.x).toEqual(2.5);
                expect(result.y).toEqual(3.5);
                expect(result.z).toEqual(4.5);
                shouldNotChange = true;
            });
        });

        describe("CheckExtends", () => {
            it("should check if the vector extends the bounding box", () => {
                const value1 = new Vector3(1, 2, 3);
                const value2 = new Vector3(4, 5, 6);
                const result = new Vector3();
                Vector3.CheckExtends(value1, value2, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("Clamp", () => {
            it("should clamp the vector values between the min and max values", () => {
                const value = new Vector3(2, 5, 8);
                const min = new Vector3(1, 3, 6);
                const max = new Vector3(4, 6, 9);
                const result = Vector3.Clamp(value, min, max);
                expect(result.x).toEqual(2);
                expect(result.y).toEqual(5);
                expect(result.z).toEqual(8);
                shouldNotChange = true;
            });
        });

        describe("ClampToRef", () => {
            it("should clamp the vector values between the min and max values and store the result in the provided vector", () => {
                const value = new Vector3(2, 5, 8);
                const min = new Vector3(1, 3, 6);
                const max = new Vector3(4, 6, 9);
                const result = new Vector3();
                Vector3.ClampToRef(value, min, max, result);
                expect(result.x).toEqual(2);
                expect(result.y).toEqual(5);
                expect(result.z).toEqual(8);
                shouldNotChange = true;
            });
        });

        describe("Cross", () => {
            it("should calculate the cross product of two vectors", () => {
                const result = Vector3.Cross(vector1, vector2);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(6);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("CrossToRef", () => {
            it("should calculate the cross product of two vectors and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.CrossToRef(vector1, vector2, result);
                expect(result.x).toEqual(-3);
                expect(result.y).toEqual(6);
                expect(result.z).toEqual(-3);
                shouldNotChange = true;
            });
        });

        describe("Distance", () => {
            it("should calculate the distance between two vectors", () => {
                const result = Vector3.Distance(vector1, vector2);
                expect(result).toBeCloseTo(5.196152422706632 /* 3 * sqrt(3) */);
                shouldNotChange = true;
            });
        });

        describe("DistanceSquared", () => {
            it("should calculate the squared distance between two vectors", () => {
                const result = Vector3.DistanceSquared(vector1, vector2);
                expect(result).toEqual(27);
                shouldNotChange = true;
            });
        });

        describe("Dot", () => {
            it("should calculate the dot product of two vectors", () => {
                const result = Vector3.Dot(vector1, vector2);
                expect(result).toEqual(32);
                shouldNotChange = true;
            });
        });

        describe("FromArray", () => {
            it("should create a Vector3 from an array", () => {
                const array = [1, 2, 3];
                const result = Vector3.FromArray(array);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("FromArrayToRef", () => {
            it("should create a Vector3 from an array and store the result in the provided vector", () => {
                const array = [1, 2, 3];
                const result = new Vector3();
                Vector3.FromArrayToRef(array, 0, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("FromFloatsToRef", () => {
            it("should create a Vector3 from individual float components and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.FromFloatsToRef(1, 2, 3, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("GetAngleBetweenVectorsOnPlane", () => {
            BabylonMathVectorGetAngleBetweenVectorsOnPlaneTestCases.forEach(({ v0, v1, normal, result }, index) => {
                const v0Vector = new Vector3(v0.x, v0.y, v0.z);
                const v1Vector = new Vector3(v1.x, v1.y, v1.z);
                const normalVector = new Vector3(normal.x, normal.y, normal.z);

                it("check GetAngleBetweenVectorsOnPlane test case " + index, () => {
                    const calculatedResult = Vector3.GetAngleBetweenVectorsOnPlane(v0Vector, v1Vector, normalVector);
                    expect(calculatedResult).toBeCloseTo(result, 8);
                });
            });
            shouldNotChange = true;
        });

        describe("GetClipFactor", () => {
            it("should calculate the clip factor of a vector against a line segment", () => {
                const axis = new Vector3(0, 1, 0);
                const result = Vector3.GetClipFactor(vector1, vector2, axis, 1);
                expect(result).toBeCloseTo(-1 / 3);
                shouldNotChange = true;
            });
        });

        describe("Hermite", () => {
            it("should calculate Hermite interpolation", () => {
                const tangentangent1 = new Vector3(7, 8, 9);
                const tangentangent2 = new Vector3(10, 11, 12);
                const result = Vector3.Hermite(vector1, tangentangent1, vector2, tangentangent2, 0.5);
                expect(result.x).toBeCloseTo(2.125);
                expect(result.y).toBeCloseTo(3.125);
                expect(result.z).toBeCloseTo(4.125);
                shouldNotChange = true;
            });
        });

        describe("Hermite1stDerivative", () => {
            it("should calculate the 1st derivative of Hermite interpolation", () => {
                const tangentangent1 = new Vector3(7, 8, 9);
                const tangentangent2 = new Vector3(10, 11, 12);
                const result = Vector3.Hermite1stDerivative(vector1, tangentangent1, vector2, tangentangent2, 0.5);
                expect(result.x).toBeCloseTo(0.25);
                expect(result.y).toBeCloseTo(-0.25);
                expect(result.z).toBeCloseTo(-0.75);
                shouldNotChange = true;
            });
        });

        describe("Hermite1stDerivativeToRef", () => {
            it("should calculate the 1st derivative of Hermite interpolation and store the result in the provided vector", () => {
                const tangentangent1 = new Vector3(7, 8, 9);
                const tangentangent2 = new Vector3(10, 11, 12);
                const result = new Vector3();
                Vector3.Hermite1stDerivativeToRef(vector1, tangentangent1, vector2, tangentangent2, 0.5, result);
                expect(result.x).toBeCloseTo(0.25);
                expect(result.y).toBeCloseTo(-0.25);
                expect(result.z).toBeCloseTo(-0.75);
                shouldNotChange = true;
            });
        });

        describe("Lerp", () => {
            it("should calculate linear interpolation", () => {
                const result = Vector3.Lerp(vector1, vector2, 0.5);
                expect(result.x).toBeCloseTo(2.5);
                expect(result.y).toBeCloseTo(3.5);
                expect(result.z).toBeCloseTo(4.5);
                shouldNotChange = true;
            });
        });

        describe("LerpToRef", () => {
            it("should calculate linear interpolation and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.LerpToRef(vector1, vector2, 0.5, result);
                expect(result.x).toBeCloseTo(2.5);
                expect(result.y).toBeCloseTo(3.5);
                expect(result.z).toBeCloseTo(4.5);
                shouldNotChange = true;
            });
        });

        describe("Maximize", () => {
            it("should set the vector to the maximum of itself and the provided vector", () => {
                const result = Vector3.Maximize(vector1, vector2);
                expect(result.x).toEqual(4);
                expect(result.y).toEqual(5);
                expect(result.z).toEqual(6);
                shouldNotChange = true;
            });
        });

        describe("Minimize", () => {
            it("should set the vector to the minimum of itself and the provided vector", () => {
                const result = Vector3.Minimize(vector1, vector2);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("Normalize", () => {
            it("should normalize the vector", () => {
                const result = Vector3.Normalize(vector1);
                expect(result.x).toBeCloseTo(0.26726, 5);
                expect(result.y).toBeCloseTo(0.53452, 5);
                expect(result.z).toBeCloseTo(0.80178, 5);
                shouldNotChange = true;
            });
        });

        describe("NormalizeToRef", () => {
            it("should normalize the vector and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.NormalizeToRef(vector1, result);
                expect(result.x).toBeCloseTo(0.26726, 5);
                expect(result.y).toBeCloseTo(0.53452, 5);
                expect(result.z).toBeCloseTo(0.80178, 5);
                shouldNotChange = true;
            });
        });

        describe("PitchYawRollToMoveBetweenPoints", () => {
            it("should calculate the pitch, yaw, and roll angles to move between two points", () => {
                const result = Vector3.PitchYawRollToMoveBetweenPoints(vector1, vector2);
                expect(result.x).toBeCloseTo(0.9553166181245092);
                expect(result.y).toBeCloseTo(0.7853981633974483);
                expect(result.z).toEqual(0);
                shouldNotChange = true;
            });
        });

        describe("PitchYawRollToMoveBetweenPointsToRef", () => {
            it("should calculate the pitch, yaw, and roll angles to move between two points and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.PitchYawRollToMoveBetweenPointsToRef(vector1, vector2, result);
                expect(result.x).toBeCloseTo(0.9553166181245092);
                expect(result.y).toBeCloseTo(0.7853981633974483);
                expect(result.z).toEqual(0);
                shouldNotChange = true;
            });
        });

        describe("Project", () => {
            it("should project the vector onto another vector", () => {
                const result = Vector3.Project(vector1, Matrix.Identity(), Matrix.Identity(), new Viewport(0, 0, 100, 100));
                expect(result.x).toEqual(100);
                expect(result.y).toEqual(-50);
                expect(result.z).toEqual(2);
                shouldNotChange = true;
            });
        });

        describe("ProjectOnTriangleToRef", () => {
            it("should project the vector onto a triangle defined by three vectors and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.ProjectOnTriangleToRef(vector1, Vector3.Zero(), vector2, new Vector3(7, 8, 9), result);
                expect(result.x).toBeCloseTo(128 / 77);
                expect(result.y).toBeCloseTo(160 / 77);
                expect(result.z).toBeCloseTo(192 / 77);
                shouldNotChange = true;
            });
        });

        describe("ProjectToRef", () => {
            it("should project the vector onto another vector and store the result in the provided vector", () => {
                const result = new Vector3();
                Vector3.ProjectToRef(vector1, Matrix.Identity(), Matrix.Identity(), new Viewport(0, 0, 100, 100), result);
                expect(result.x).toEqual(100);
                expect(result.y).toEqual(-50);
                expect(result.z).toEqual(2);
                shouldNotChange = true;
            });
        });

        describe("Random", () => {
            it("should generate a random vector", () => {
                const result = Vector3.Random();
                expect(result.x).toBeGreaterThanOrEqual(0);
                expect(result.x).toBeLessThanOrEqual(1);
                expect(result.y).toBeGreaterThanOrEqual(0);
                expect(result.y).toBeLessThanOrEqual(1);
                expect(result.z).toBeGreaterThanOrEqual(0);
                expect(result.z).toBeLessThanOrEqual(1);
                shouldNotChange = true;
            });
        });

        describe("Reflect", () => {
            it("should reflect a vector accross the normal", () => {
                const normal = new Vector3(0, 1, 0);
                const result = Vector3.Reflect(vector1, normal);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(-2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });

            it("can reflect off the plane defined by a normal", () => {
                const inDirection = new Vector3(10, 10, 5);

                const normal = Vector3.Right();

                const expected = new Vector3(-10, 10, 5);

                expect(Vector3.Reflect(inDirection, normal)).toEqual(expected);
                shouldNotChange = true;
            });
        });

        describe("ReflectToRef", () => {
            it("should calculate the reflection of the vector given a normal and store the result in the provided vector", () => {
                const normal = new Vector3(0, 1, 0);
                const result = new Vector3();
                Vector3.ReflectToRef(vector1, normal, result);
                expect(result.x).toEqual(1);
                expect(result.y).toEqual(-2);
                expect(result.z).toEqual(3);
                shouldNotChange = true;
            });
        });

        describe("RotationFromAxis", () => {
            it("should rotate vector around axis by angle", () => {
                const axis1 = new Vector3(0, 1, 0);
                const axis2 = new Vector3(0, 0, 1);
                const axis3 = new Vector3(1, 0, 0);
                const result = Vector3.RotationFromAxis(axis1, axis2, axis3);
                expect(result.x).toBeCloseTo(0);
                expect(result.y).toBeCloseTo(Math.PI / 2);
                expect(result.z).toBeCloseTo(Math.PI / 2);
                shouldNotChange = true;
            });
        });

        describe("RotationFromAxisToRef", () => {
            it("should rotate vector around axis by angle and store result in target vector", () => {
                const axis1 = new Vector3(0, 1, 0);
                const axis2 = new Vector3(0, 0, 1);
                const axis3 = new Vector3(1, 0, 0);
                const result = new Vector3();
                Vector3.RotationFromAxisToRef(axis1, axis2, axis3, result);
                expect(result.x).toBeCloseTo(0);
                expect(result.y).toBeCloseTo(Math.PI / 2);
                expect(result.z).toBeCloseTo(Math.PI / 2);
                shouldNotChange = true;
            });
        });

        describe("SlerpToRef", () => {
            it("should interpolate between current vector and target vector by a given amount", () => {
                const result = new Vector3();
                Vector3.SlerpToRef(vector1, vector2, 0.5, result);
                expect(result.x).toBeCloseTo(2.277191527654695);
                expect(result.y).toBeCloseTo(3.4777320279108768);
                expect(result.z).toBeCloseTo(4.678272528167059);
                shouldNotChange = true;
            });
        });

        describe("SmoothToRef", () => {
            it("should smooth interpolate between current vector and target vector by a given amount", () => {
                const deltaTime = 0.1;
                const lerpTime = 0.5;
                const result = new Vector3();
                Vector3.SmoothToRef(vector1, vector2, deltaTime, lerpTime, result);
                expect(result.x).toBeCloseTo(1.4547972045128181);
                expect(result.y).toBeCloseTo(2.582259323554707);
                expect(result.z).toBeCloseTo(3.709721442596596);
                shouldNotChange = true;
            });
        });

        describe("TransformCoordinates", () => {
            it("should transform vector coordinates by a given matrix", () => {
                const transformation = Matrix.RotationX(Math.PI / 2);
                const result = Vector3.TransformCoordinates(vector1, transformation);
                expect(result.x).toBeCloseTo(1);
                expect(result.y).toBeCloseTo(-3);
                expect(result.z).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("TransformCoordinatesToRef", () => {
            it("should transform vector coordinates by a given matrix and store result in target vector", () => {
                const transformation = Matrix.RotationX(Math.PI / 2);
                const result = new Vector3();
                Vector3.TransformCoordinatesToRef(vector1, transformation, result);
                expect(result.x).toBeCloseTo(1);
                expect(result.y).toBeCloseTo(-3);
                expect(result.z).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("TransformNormal", () => {
            it("should transform vector normal by a given matrix", () => {
                const transformation = Matrix.RotationX(Math.PI / 2);
                const result = Vector3.TransformNormal(vector1, transformation);
                expect(result.x).toBeCloseTo(1);
                expect(result.y).toBeCloseTo(-3);
                expect(result.z).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("TransformNormalToRef", () => {
            it("should transform vector normal by a given matrix and store result in target vector", () => {
                const transformation = Matrix.RotationX(Math.PI / 2);
                const result = new Vector3();
                Vector3.TransformNormalToRef(vector1, transformation, result);
                expect(result.x).toBeCloseTo(1);
                expect(result.y).toBeCloseTo(-3);
                expect(result.z).toBeCloseTo(2);
                shouldNotChange = true;
            });
        });

        describe("Unproject", () => {
            it("should unproject vector coordinates from projection and view matrices", () => {
                const width = 800;
                const height = 600;
                const view = Matrix.LookAtLH(new Vector3(0, 0, -10), Vector3.Zero(), Vector3.Up());
                const projection = Matrix.PerspectiveFovLH(Math.PI / 2, width / height, 0.1, 100);
                const result = Vector3.Unproject(vector1, width, height, Matrix.Identity(), view, projection);
                expect(result.x).toBeCloseTo(0.06660001703257157);
                expect(result.y).toBeCloseTo(-0.04974136462211895);
                expect(result.z).toBeCloseTo(-10.050074196419953);
                shouldNotChange = true;
            });
        });

        describe("UnprojectFloatsToRef", () => {
            it("should unproject vector coordinates from projection and view matrices from floats and store result in target vector", () => {
                const width = 800;
                const height = 600;
                const view = Matrix.LookAtLH(new Vector3(0, 0, -10), Vector3.Zero(), Vector3.Up());
                const projection = Matrix.PerspectiveFovLH(Math.PI / 2, width / height, 0.1, 100);
                const result = new Vector3();
                Vector3.UnprojectFloatsToRef(1, 2, 3, width, height, Matrix.Identity(), view, projection, result);
                expect(result.x).toBeCloseTo(0.06660001703257157);
                expect(result.y).toBeCloseTo(-0.04974136462211895);
                expect(result.z).toBeCloseTo(-10.050074196419953);
                shouldNotChange = true;
            });
        });

        describe("UnprojectFromTransform", () => {
            it("should unproject vector coordinates from transformation matrix and viewport", () => {
                const width = 800;
                const height = 600;
                const transform = Matrix.RotationX(Math.PI / 2);
                const result = Vector3.UnprojectFromTransform(vector1, width, height, Matrix.Identity(), transform);
                expect(result.x).toBeCloseTo(-0.9975);
                expect(result.y).toBeCloseTo(5);
                expect(result.z).toBeCloseTo(-0.993333333333333);
                shouldNotChange = true;
            });
        });

        describe("UnprojectToRef", () => {
            it("should unproject vector coordinates from transformation matrix and viewport and store result in target vector", () => {
                const width = 800;
                const height = 600;
                const view = Matrix.LookAtLH(new Vector3(0, 0, -10), Vector3.Zero(), Vector3.Up());
                const projection = Matrix.PerspectiveFovLH(Math.PI / 2, width / height, 0.1, 100);
                const result = new Vector3();
                Vector3.UnprojectToRef(vector1, width, height, Matrix.Identity(), view, projection, result);
                expect(result.x).toBeCloseTo(0.06660001703257157);
                expect(result.y).toBeCloseTo(-0.04974136462211895);
                expect(result.z).toBeCloseTo(-10.050074196419953);
                shouldNotChange = true;
            });
        });
    });

    describe("Vector4", () => {
        let vector1: Vector4;
        let vector2: Vector4;
        let shouldNotChange: boolean;

        beforeEach(() => {
            vector1 = new Vector4(1, 2, 3, 4);
            vector2 = new Vector4(5, 6, 7, 8);
            shouldNotChange = false;
        });

        afterEach(() => {
            if (shouldNotChange) {
                expect(vector1.x).toBe(1);
                expect(vector1.y).toBe(2);
                expect(vector1.z).toBe(3);
                expect(vector1.w).toBe(4);
                expect(vector2.x).toBe(5);
                expect(vector2.y).toBe(6);
                expect(vector2.z).toBe(7);
                expect(vector2.w).toBe(8);
            }
        });

        describe("add", () => {
            it("should add two vectors", () => {
                const result = vector1.add(vector2);
                expect(result.x).toBe(6);
                expect(result.y).toBe(8);
                expect(result.z).toBe(10);
                expect(result.w).toBe(12);
                shouldNotChange = true;
            });
        });

        describe("addInPlace", () => {
            it("should add a vector in place", () => {
                vector1.addInPlace(vector2);
                expect(vector1.x).toBe(6);
                expect(vector1.y).toBe(8);
                expect(vector1.z).toBe(10);
                expect(vector1.w).toBe(12);
            });
        });

        describe("addToRef", () => {
            it("should add two vectors and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.addToRef(vector2, result);
                expect(result.x).toBe(6);
                expect(result.y).toBe(8);
                expect(result.z).toBe(10);
                expect(result.w).toBe(12);
                shouldNotChange = true;
            });
        });

        describe("asArray", () => {
            it("should return the vector as an array", () => {
                const result = vector1.asArray();
                expect(result).toEqual([1, 2, 3, 4]);
                shouldNotChange = true;
            });
        });

        describe("clone", () => {
            it("should create a copy of the vector", () => {
                const result = vector1.clone();
                expect(result).not.toBe(vector1);
                expect(result).toEqual(vector1);
                shouldNotChange = true;
            });
        });

        describe("copyFrom", () => {
            it("should copy the values from another vector", () => {
                vector1.copyFrom(vector2);
                expect(vector1.x).toBe(vector2.x);
                expect(vector1.y).toBe(vector2.y);
                expect(vector1.z).toBe(vector2.z);
                expect(vector1.w).toBe(vector2.w);
            });
        });

        describe("copyFromFloats", () => {
            it("should set the vector values from individual floats", () => {
                vector1.copyFromFloats(10, 20, 30, 40);
                expect(vector1.x).toBe(10);
                expect(vector1.y).toBe(20);
                expect(vector1.z).toBe(30);
                expect(vector1.w).toBe(40);
            });
        });

        describe("divide", () => {
            it("should divide a vector by another vector", () => {
                const result = vector1.divide(vector2);
                expect(result.x).toBeCloseTo(0.2);
                expect(result.y).toBeCloseTo(0.333);
                expect(result.z).toBeCloseTo(0.4286);
                expect(result.w).toBeCloseTo(0.5);
                shouldNotChange = true;
            });
        });

        describe("divideInPlace", () => {
            it("should divide a vector by another vector in place", () => {
                vector1.divideInPlace(vector2);
                expect(vector1.x).toBeCloseTo(0.2);
                expect(vector1.y).toBeCloseTo(0.333);
                expect(vector1.z).toBeCloseTo(0.4286);
                expect(vector1.w).toBeCloseTo(0.5);
            });
        });

        describe("divideToRef", () => {
            it("should divide a vector by another vector and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.divideToRef(vector2, result);
                expect(result.x).toBeCloseTo(0.2);
                expect(result.y).toBeCloseTo(0.333);
                expect(result.z).toBeCloseTo(0.4286);
                expect(result.w).toBeCloseTo(0.5);
                shouldNotChange = true;
            });
        });

        describe("equals", () => {
            it("should check if two vectors are equal", () => {
                const result = vector1.equals(vector2);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("equalsToFloats", () => {
            it("should check if the vector components are equal to the given floats", () => {
                const result = vector1.equalsToFloats(1, 2, 3, 4);
                expect(result).toBe(true);
                shouldNotChange = true;
            });
        });

        describe("equalsWithEpsilon", () => {
            it("should check if two vectors are approximately equal within a given epsilon value", () => {
                const result = vector1.equalsWithEpsilon(vector2, 0.01);
                expect(result).toBe(false);
                shouldNotChange = true;
            });
        });

        describe("floor", () => {
            it("should set each component to the largest integer less than or equal to its current value", () => {
                const result = vector1.floor();
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("fract", () => {
            it("should calculate the fractional part of each component", () => {
                const result = vector1.fract();
                expect(result.x).toBe(0);
                expect(result.y).toBe(0);
                expect(result.z).toBe(0);
                expect(result.w).toBe(0);
                shouldNotChange = true;
            });
        });

        describe("fromArray", () => {
            it("should set the vector components from an array", () => {
                vector1.fromArray([10, 20, 30, 40]);
                expect(vector1.x).toBe(10);
                expect(vector1.y).toBe(20);
                expect(vector1.z).toBe(30);
                expect(vector1.w).toBe(40);
            });
        });

        describe("length", () => {
            it("should calculate the length (magnitude) of the vector", () => {
                const result = vector1.length();
                expect(result).toBeCloseTo(5.4772);
                shouldNotChange = true;
            });
        });

        describe("lengthSquared", () => {
            it("should calculate the squared length (magnitude) of the vector", () => {
                const result = vector1.lengthSquared();
                expect(result).toBe(30);
                shouldNotChange = true;
            });
        });

        describe("maximizeInPlace", () => {
            it("should set each component to the maximum value between the current value and the given vector", () => {
                vector1.maximizeInPlace(vector2);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(6);
                expect(vector1.z).toBe(7);
                expect(vector1.w).toBe(8);
            });
        });

        describe("minimizeInPlace", () => {
            it("should set each component to the minimum value between the current value and the given vector", () => {
                vector1.minimizeInPlace(vector2);
                expect(vector1.x).toBe(1);
                expect(vector1.y).toBe(2);
                expect(vector1.z).toBe(3);
                expect(vector1.w).toBe(4);
            });
        });

        describe("multiply", () => {
            it("should multiply two vectors", () => {
                const result = vector1.multiply(vector2);
                expect(result.x).toBe(5);
                expect(result.y).toBe(12);
                expect(result.z).toBe(21);
                expect(result.w).toBe(32);
                shouldNotChange = true;
            });
        });

        describe("multiplyByFloats", () => {
            it("should multiply the vector by individual float values", () => {
                const result = vector1.multiplyByFloats(2, 3, 4, 5);
                expect(result.x).toBe(2);
                expect(result.y).toBe(6);
                expect(result.z).toBe(12);
                expect(result.w).toBe(20);
                shouldNotChange = true;
            });
        });

        describe("multiplyInPlace", () => {
            it("should multiply the vector by another vector in place", () => {
                vector1.multiplyInPlace(vector2);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(12);
                expect(vector1.z).toBe(21);
                expect(vector1.w).toBe(32);
            });
        });

        describe("multiplyToRef", () => {
            it("should multiply two vectors and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.multiplyToRef(vector2, result);
                expect(result.x).toBe(5);
                expect(result.y).toBe(12);
                expect(result.z).toBe(21);
                expect(result.w).toBe(32);
                shouldNotChange = true;
            });
        });

        describe("negate", () => {
            it("should negate the vector", () => {
                const result = vector1.negate();
                expect(result.x).toBe(-1);
                expect(result.y).toBe(-2);
                expect(result.z).toBe(-3);
                expect(result.w).toBe(-4);
                shouldNotChange = true;
            });
        });

        describe("negateInPlace", () => {
            it("should negate the vector in place", () => {
                vector1.negateInPlace();
                expect(vector1.x).toBe(-1);
                expect(vector1.y).toBe(-2);
                expect(vector1.z).toBe(-3);
                expect(vector1.w).toBe(-4);
            });
        });

        describe("negateToRef", () => {
            it("should negate the vector and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.negateToRef(result);
                expect(result.x).toBe(-1);
                expect(result.y).toBe(-2);
                expect(result.z).toBe(-3);
                expect(result.w).toBe(-4);
                shouldNotChange = true;
            });
        });

        describe("normalize", () => {
            it("should normalize the vector", () => {
                vector1.normalize();
                expect(vector1.x).toBeCloseTo(0.1826);
                expect(vector1.y).toBeCloseTo(0.3651);
                expect(vector1.z).toBeCloseTo(0.5477);
                expect(vector1.w).toBeCloseTo(0.7303);
            });
        });

        describe("scale", () => {
            it("should scale the vector by a given value", () => {
                const result = vector1.scale(2);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                expect(result.z).toBe(6);
                expect(result.w).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("scaleAndAddToRef", () => {
            it("should scale the vector by a given value and add it to a target vector", () => {
                const result = new Vector4();
                vector1.scaleAndAddToRef(2, result);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                expect(result.z).toBe(6);
                expect(result.w).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("scaleInPlace", () => {
            it("should scale the vector in place by a given value", () => {
                vector1.scaleInPlace(2);
                expect(vector1.x).toBe(2);
                expect(vector1.y).toBe(4);
                expect(vector1.z).toBe(6);
                expect(vector1.w).toBe(8);
            });
        });

        describe("scaleToRef", () => {
            it("should scale the vector to a target vector by a given value", () => {
                const result = new Vector4();
                vector1.scaleToRef(2, result);
                expect(result.x).toBe(2);
                expect(result.y).toBe(4);
                expect(result.z).toBe(6);
                expect(result.w).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("set", () => {
            it("should set the vector components", () => {
                vector1.set(10, 20, 30, 40);
                expect(vector1.x).toBe(10);
                expect(vector1.y).toBe(20);
                expect(vector1.z).toBe(30);
                expect(vector1.w).toBe(40);
            });
        });

        describe("setAll", () => {
            it("should set all components to a given value", () => {
                vector1.setAll(5);
                expect(vector1.x).toBe(5);
                expect(vector1.y).toBe(5);
                expect(vector1.z).toBe(5);
                expect(vector1.w).toBe(5);
            });
        });

        describe("subtract", () => {
            it("should subtract two vectors", () => {
                const result = vector1.subtract(vector2);
                expect(result.x).toBe(-4);
                expect(result.y).toBe(-4);
                expect(result.z).toBe(-4);
                expect(result.w).toBe(-4);
                shouldNotChange = true;
            });
        });

        describe("subtractFromFloats", () => {
            it("should subtract individual float values from the vector components", () => {
                const result = vector1.subtractFromFloats(1, 2, 3, 4);
                expect(result.x).toBe(0);
                expect(result.y).toBe(0);
                expect(result.z).toBe(0);
                expect(result.w).toBe(0);
                shouldNotChange = true;
            });
        });

        describe("subtractFromFloatsToRef", () => {
            it("should subtract individual float values from the vector components and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.subtractFromFloatsToRef(1, 2, 3, 4, result);
                expect(result.x).toBe(0);
                expect(result.y).toBe(0);
                expect(result.z).toBe(0);
                expect(result.w).toBe(0);
                shouldNotChange = true;
            });
        });

        describe("subtractInPlace", () => {
            it("should subtract a vector from the current vector in place", () => {
                vector1.subtractInPlace(vector2);
                expect(vector1.x).toBe(-4);
                expect(vector1.y).toBe(-4);
                expect(vector1.z).toBe(-4);
                expect(vector1.w).toBe(-4);
            });
        });

        describe("subtractToRef", () => {
            it("should subtract a vector from the current vector and store the result in a target vector", () => {
                const result = new Vector4();
                vector1.subtractToRef(vector2, result);
                expect(result.x).toBe(-4);
                expect(result.y).toBe(-4);
                expect(result.z).toBe(-4);
                expect(result.w).toBe(-4);
                shouldNotChange = true;
            });
        });

        describe("toArray", () => {
            it("should return an array with the vector components", () => {
                const result: number[] = [];
                vector1.toArray(result);
                expect(result).toEqual([1, 2, 3, 4]);
            });
        });

        describe("toVector3", () => {
            it("should create a Vector3 with the vector components", () => {
                const result = vector1.toVector3();
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                shouldNotChange = true;
            });
        });

        describe("Center", () => {
            it("should set the vector with the center value between two vectors", () => {
                const result = Vector4.Center(vector1, vector2);
                expect(result.x).toBe(3);
                expect(result.y).toBe(4);
                expect(result.z).toBe(5);
                expect(result.w).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("CenterToRef", () => {
            it("should set a target vector with the center value between two vectors", () => {
                const result = new Vector4();
                Vector4.CenterToRef(vector1, vector2, result);
                expect(result.x).toBe(3);
                expect(result.y).toBe(4);
                expect(result.z).toBe(5);
                expect(result.w).toBe(6);
                shouldNotChange = true;
            });
        });

        describe("Distance", () => {
            it("should calculate the distance between two vectors", () => {
                const result = Vector4.Distance(vector1, vector2);
                expect(result).toBeCloseTo(8);
                shouldNotChange = true;
            });
        });

        describe("DistanceSquared", () => {
            it("should calculate the squared distance between two vectors", () => {
                const result = Vector4.DistanceSquared(vector1, vector2);
                expect(result).toBe(64);
                shouldNotChange = true;
            });
        });

        describe("FromArray", () => {
            it("should create a new Vector4 from an array", () => {
                const result = Vector4.FromArray([10, 20, 30, 40]);
                expect(result.x).toBe(10);
                expect(result.y).toBe(20);
                expect(result.z).toBe(30);
                expect(result.w).toBe(40);
                shouldNotChange = true;
            });
        });

        describe("FromArrayToRef", () => {
            it("should create a new Vector4 from an array and store it in a target vector", () => {
                const result = new Vector4();
                Vector4.FromArrayToRef([10, 20, 30, 40], 0, result);
                expect(result.x).toBe(10);
                expect(result.y).toBe(20);
                expect(result.z).toBe(30);
                expect(result.w).toBe(40);
                shouldNotChange = true;
            });
        });

        describe("FromFloatArrayToRef", () => {
            it("should create a new Vector4 from a Float32Array and store it in a target vector", () => {
                const floatArray = new Float32Array([10, 20, 30, 40]);
                const result = new Vector4();
                Vector4.FromFloatArrayToRef(floatArray, 0, result);
                expect(result.x).toBe(10);
                expect(result.y).toBe(20);
                expect(result.z).toBe(30);
                expect(result.w).toBe(40);
                shouldNotChange = true;
            });
        });

        describe("FromFloatsToRef", () => {
            it("should create a new Vector4 from individual float values and store it in a target vector", () => {
                const result = new Vector4();
                Vector4.FromFloatsToRef(10, 20, 30, 40, result);
                expect(result.x).toBe(10);
                expect(result.y).toBe(20);
                expect(result.z).toBe(30);
                expect(result.w).toBe(40);
                shouldNotChange = true;
            });
        });

        describe("FromVector3", () => {
            it("should create a new Vector4 from a Vector3 and set the w component to the provided value", () => {
                const vector3 = new Vector3(10, 20, 30);
                const result = Vector4.FromVector3(vector3, 40);
                expect(result.x).toBe(10);
                expect(result.y).toBe(20);
                expect(result.z).toBe(30);
                expect(result.w).toBe(40);
                shouldNotChange = true;
            });
        });

        describe("Maximize", () => {
            it("should set the vector with the maximum values between two vectors", () => {
                const result = Vector4.Maximize(vector1, vector2);
                expect(result.x).toBe(5);
                expect(result.y).toBe(6);
                expect(result.z).toBe(7);
                expect(result.w).toBe(8);
                shouldNotChange = true;
            });
        });

        describe("Minimize", () => {
            it("should set the vector with the minimum values between two vectors", () => {
                const result = Vector4.Minimize(vector1, vector2);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("Normalize", () => {
            it("should normalize the vector", () => {
                const result = Vector4.Normalize(vector1);
                expect(result.x).toBeCloseTo(0.1826);
                expect(result.y).toBeCloseTo(0.3651);
                expect(result.z).toBeCloseTo(0.5477);
                expect(result.w).toBeCloseTo(0.7303);
                shouldNotChange = true;
            });
        });

        describe("NormalizeToRef", () => {
            it("should normalize the vector and store the result in a target vector", () => {
                const result = new Vector4();
                Vector4.NormalizeToRef(vector1, result);
                expect(result.x).toBeCloseTo(0.1826);
                expect(result.y).toBeCloseTo(0.3651);
                expect(result.z).toBeCloseTo(0.5477);
                expect(result.w).toBeCloseTo(0.7303);
                shouldNotChange = true;
            });
        });

        describe("Random", () => {
            it("should set the vector with random values", () => {
                const result = Vector4.Random();
                expect(result.x).toBeGreaterThanOrEqual(0);
                expect(result.x).toBeLessThanOrEqual(1);
                expect(result.y).toBeGreaterThanOrEqual(0);
                expect(result.y).toBeLessThanOrEqual(1);
                expect(result.z).toBeGreaterThanOrEqual(0);
                expect(result.z).toBeLessThanOrEqual(1);
                expect(result.w).toBeGreaterThanOrEqual(0);
                expect(result.w).toBeLessThanOrEqual(1);
                shouldNotChange = true;
            });
        });

        describe("TransformCoordinates", () => {
            it("should transform the vector by a given transformation matrix and perspective divide", () => {
                const result = Vector4.TransformCoordinates(vector1.toVector3(), Matrix.Identity());
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(1);
                shouldNotChange = true;
            });
        });

        describe("TransformCoordinatesFromFloatsToRef", () => {
            it("should transform the vector by a given transformation matrix (provided as individual float values) and perspective divide, storing the result in a target vector", () => {
                const result = new Vector4();
                Vector4.TransformCoordinatesFromFloatsToRef(vector1.x, vector1.y, vector1.z, Matrix.Identity(), result);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(1);
                shouldNotChange = true;
            });
        });

        describe("TransformCoordinatesToRef", () => {
            it("should transform the vector by a given transformation matrix and perspective divide, storing the result in a target vector", () => {
                const result = new Vector4();
                Vector4.TransformCoordinatesToRef(vector1.toVector3(), Matrix.Identity(), result);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(1);
                shouldNotChange = true;
            });
        });

        describe("TransformNormal", () => {
            it("should transform the vector by a given transformation matrix without perspective divide", () => {
                const result = Vector4.TransformNormal(vector1, Matrix.Identity());
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("TransformNormalFromFloatsToRef", () => {
            it("should transform the vector by a given transformation matrix (provided as individual float values) without perspective divide, storing the result in a target vector", () => {
                const result = new Vector4();
                Vector4.TransformNormalFromFloatsToRef(vector1.x, vector1.y, vector1.z, vector1.w, Matrix.Identity(), result);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(4);
                shouldNotChange = true;
            });
        });

        describe("TransformNormalToRef", () => {
            it("should transform the vector by a given transformation matrix without perspective divide, storing the result in a target vector", () => {
                const result = new Vector4();
                Vector4.TransformNormalToRef(vector1, Matrix.Identity(), result);
                expect(result.x).toBe(1);
                expect(result.y).toBe(2);
                expect(result.z).toBe(3);
                expect(result.w).toBe(4);
                shouldNotChange = true;
            });
        });
    });
});
