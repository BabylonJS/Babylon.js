/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface RayTriangleIntersection {
        hit: boolean;
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

        intersectsBox(box: BoundingBox): boolean;
        intersectsSphere(sphere: Sphere): boolean;
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

        equals(otherColor: Color3): boolean;
        equals(otherColor: Color4): boolean;
        toString(): string;
        clone(): Color3;

        multiply(otherColor: Color3): Color3;
        mutilplyToRef(otherColor: Color3, result: Color3): void;
        scale(scale: number): Color3;
        scaleToRef(scale: number, result: Color3): void;
        copyFrom(source: Color3): void;
        copyFromFloats(r: number, g: number, b: number): void;
        
        static FromArray(array: number[]): Color3;
    }

    class Color4 implements IColor3 {
        r: number;
        g: number;
        b: number;
        a: number;

        constructor(initialR: number, initialG: number, initialB: number, initialA: number);

        addInPlace(right: Color4): void;
        add(right: Color4): Color4;
        subtract(right: Color4): Color4;
        subtractToRef(right: Color4, result: Color4): void;
        scale(factor: number): Color4;
        scale(factor: number, result: Color4): void;

        toString(): string;
        clone(): Color4;

        static Lerp(left: number, right: number, amount: number): Color4;
        static FromArray(array: number[]): Color4;

    }

    class Vector2 {
        x: number;
        y: number;

        constructor(x: number, y: number);

        toString(): string;

        add(other: Vector2): Vector2;
        subtract(other: Vector2): Vector2;
        negate(): Vector2;
        scaleInPlace(scale: number): void;
        scale(scale: number): Vector2;
        equals(other: Vector2): boolean;
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

        addInPlace(otherVector: Vector3): void;
        add(other: Vector3): Vector3;
        addToRef(otherVector: Vector3, result: Vector3): void;
        suntractInPlace(otherVector: Vector3): void;
        subtract(other: Vector3): Vector3;
        subtractToRef(otherVector: Vector3, result: Vector3): void;
        subtractFromFloatsTo(x: number, y: number, z: number): Vector3;
        subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        negate(): Vector3;
        scaleInPlace(scale: number): void;
        scale(scale: number): Vector3;
        scaleToRef(scale: number, result: Vector3): void;
        equals(other: Vector3): boolean;
        equalsToFloats(x: number, y: number, z: number): boolean;
        multiplyInPlace(other: Vector3): void;
        multiply(other: Vector3): Vector3;
        multiplyToRef(otherVector: Vector3, result: Vector3): void
        multiplyByFloats(x: number, y: number, z: number): Vector3;
        divide(other: Vector3): Vector3;
        divideToRef(otherVector: Vector3, result: Vector3): void; 
        length(): number;
        lengthSquared(): number;
        normalize();
        clone(): Vector3;
        copyFrom(source: Vector3): void;
        copyFromFloats(x: number, y: number, z: number): void;

        static FromArray(array: number[], offset: number);
        static FromArrayToRef(array: number[], offset: number, result: Vector3): void;
        static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        static Zero(): Vector3;
        static Up(): Vector3;
        static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3;
        static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        static TransformNormal(vector: Vector3, transformation: Matrix): Vector3;
        static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;

        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        static Dot(left: Vector3, right: Vector3): number;
        static Cross(left: Vector3, right: Vector3): Vector3;
        static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void;
        static Normalize(vector: Vector3): Vector3;
        static NormalizeToRef(vector: Vector3, result: Vector3): void;
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

        toString(): string;

        constructor(x: number, y: number, z: number, w: number);

        equals(otherQuaternion: Quaternion): boolean;
        clone(): Quaternion;
        copyFrom(other: Quaternion): void;
        add(other: Quaternion): Quaternion;
        scale(factor: number): Quaternion;
        multiply(q1: Quaternion): Quaternion;
        multiplyToRef(q1: Quaternion, result: Quaternion): void;
        length(): number;
        normalize(): void;
        toEulerAngles(): Vector3;
        toRotationMatrix(result: Quaternion): void;

        static FromArray(array: number[], offset: number): Quaternion;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }

    class Matrix {
        m: number[];

        constructor();

        isIdentity(): boolean;
        determinant(): number;
        toArray(): number[];
        invert(): void;
        invertToRef(other: Matrix): void;
        setTranslations(vector3: Vector3): void;
        multiply(other: Matrix): Matrix;
        copyFrom(other: Matrix): void;
        multiplyToRef(other: Matrix, result: Matrix): void;
        multiplyToArray(other: Matrix, result: number[], offset: number): void;
        equals(other: Matrix): boolean;
        clone(): Matrix;

        static FromArray(array: number[], offset: number): Matrix;
        static FromArrayToRef(array: number[], offset: number, result: Matrix): void;
        static FromValues(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number): Matrix;
        static FromValuesToRef(m11: number, m12: number, m13: number, m14: number,
            m21: number, m22: number, m23: number, m24: number,
            m31: number, m32: number, m33: number, m34: number,
            m41: number, m42: number, m43: number, m44: number, result: Matrix): void;
        static Identity(): Matrix;
        static IdentityToRef(result: Matrix): void;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static RotationXToRef(angle: number, result: Matrix): void;
        static RotationY(angle: number): Matrix;
        static RotationYToRef(angle: number, result: Matrix): void;
        static RotationZ(angle: number): Matrix;
        static RotationZToRef(angle: number, result: Matrix): void;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static Scaling(scaleX: number, scaleY: number, scaleZ: number): Matrix;
        static ScalingToRef(scaleX: number, scaleY: number, scaleZ: number, result: Matrix): void;
        static Translation(x: number, y: number, z: number): Matrix;
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix): void;
        static AffineTransformation(scaling: number, rotationCenter: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        static GetFinalMatrix(viewport: Size2D, world: Matrix, view: Matrix, projection: Matrix): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
        static ReflectionToRef(plane: Plane, result: Matrix): void;
    }

    class Plane {
        normal: Vector3;
        d: number;

        constructor(a: number, b: number, c: number, d: number);

        normalize(): void;
        transform(transformation: Matrix): Plane;
        dotCoordinate(point: Vector3): number;
        copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): void;
        isFrontFacingTo(direction: Vector3, epsilon: Vector3): boolean;
        signedDistanceTo(point: Vector3): number;

        static FromArray(array: number[]): Plane;
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        static FromPositionAndNormal(origin: Vector3, normal: Vector2): Plane;
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point): number;
    }

    class Frustum {
        frustrumPlanes: Plane[];

        constructor(transform: Matrix);

        static GetPlanes(transform: Matrix): Plane[];
    }
}