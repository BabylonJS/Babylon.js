/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface RayTriangleIntersection {
        hit: bool;
        distance: number;
        bu: number;
        bv: number;
    }

    interface IColor3 {
        r: number;
        g: number;
        b: number;
    }

    interface Size2D 
    {
        width: number;
        height: number;
    }

    interface Sphere {
        center: Vector3;
        radius: number;
    }

    class Ray {
        origin: Vector3;
        direction: Vector3;

        constructor(origin: Vector3, direction: Vector3);

        intersectsSphere(sphere: Sphere): bool;
        intersectsTriangle(vertex0: Vector3,
            vertex1: Vector3,
            vertex2: Vector3): RayTriangleIntersection;

        static CreateNew(x: number,
            y: number,
            viewportWidth: number,
            viewportHeight: number,
            world: Matrix,
            view: Matrix,
            projection: Matrix): Ray;

    }

    class Color3 implements IColor3 {
        r: number;
        g: number;
        b: number;

        constructor(intialR: number, initialG: number, initialB: number);

        equals(otherColor: Color3): bool;
        equals(otherColor: Color4): bool;
        toString(): string;
        clone(): Color3;

        multiply(otherColor: Color3): Color3;
        scale(scale: number): Color3;
        
        static FromArray(number[]): Color3;
    }

    class Color4 implements IColor3 {
        r: number;
        g: number;
        b: number;
        a: number;

        constructor(initialR: number, initialG: number, initialB: number, initialA: number);

        add(right: Color4): Color4;
        subtract(right: Color4): Color4;
        scale(factor: number): Color4;

        toString(): string;
        clone(): Color4;

        static Lerp(left: number, right: number, amount: number): Color4;
        static FromArray(number[]): Color4;

    }

    class Vector2 {
        x: number;
        y: number;

        constructor(x: number, y: number);

        toString(): string;

        add(other: Vector2): Vector2;
        subtract(other: Vector2): Vector2;
        negate(): Vector2;
        scale(factor: number): Vector2;
        equals(other: Vector2): bool;
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector2;

        static Zero(): Vector2;
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        static Dot(left: Vector2, right: Vector2): number;
        static Normalize(vector: Vector2): Vector2;
        static Minimize(left: Vector2, right: Vector2): Vector2;
        static Maximize(left: Vector2, right: Vector2): Vector2;
        static Transform(vector: Vector2, transformation: number[]): Vector2;
        static Distance(value1: Vector2, value2: Vector2): number;
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
    }

    class Vector3 {
        x: number;
        y: number;
        z: number;

        constructor(x: number, y: number, z: number);

        toString(): string;

        add(other: Vector3): Vector3;
        subtract(other: Vector3): Vector3;
        negate(): Vector3;
        scale(factor: number): Vector3;
        equals(other: Vector3): bool;
        multiply(other: Vector3): Vector3;
        divide(other: Vector3): Vector3;
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector3;

        static FromArray(array: number[], offset?: number = 0);
        static Zero(): Vector3;
        static Up(): Vector3;
        static TransformCoordinates(vector: Vector3, transformation: Matrix);
        static TransformNormal(vector: Vector3, transformation: Matrix);

        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        static Dot(left: Vector3, right: Vector3): number;
        static Normalize(vector: Vector3): Vector3;
        static Unproject(source: Vector3,
            viewportWidth: number,
            viewportHeight: number,
            world: Matrix,
            view: Matrix,
            projection: Matrix): Vector3;

        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        static Distance(value1: Vector3, value2: Vector3): number;
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
    }

    class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;

        constructor(x: number, y: number, z: number, w: number);

        clone(): Quaternion;
        add(other: Quaternion): Quaternion;
        scale(factor: number): Quaternion;
        toEulerAngles(): Vector3;

        static FromArray(array: number[], offset?: number = 0): Quaternion;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }

    class Matrix {
        m: number[];

        constructor();

        isIdentity(): bool;
        determinant(): number;
        toArray(): number[];
        invert(): void;
        multiply(other: Matrix): Matrix;
        equals(other: Matrix): Matrix;
        clone(): Matrix;

        static FromValues(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number): Matrix;
        static Identity(): Matrix;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static RotationY(angle: number): Matrix;
        static RotationZ(angle: number): Matrix;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static Scaling(scaleX: number, scaleY: number, scaleZ: number): Matrix;
        static Translation(x: number, y: number, z: number): Matrix;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static AffineTransformation(scaling: number, rotationCenter: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        static GetFinalMatrix(viewport: Size2D, world: Matrix, view: Matrix, projection: Matrix): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
    }

    class Plane {
        normal: Vector3;
        d: number;

        normalize(): void;
        transform(transformation: Matrix): Plane;
        dotCoordinate(point: Vector3): number;

        static FromArray(array: number[]): Plane;
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
    }

    class Frustum {
        static GetPlanes(transform: Matrix): Plane[];
    }
}