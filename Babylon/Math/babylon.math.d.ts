declare module BABYLON {
    class Color3 {
        public r: number;
        public g: number;
        public b: number;
        constructor(r?: number, g?: number, b?: number);
        public toString(): string;
        public toArray(array: number[], index?: number): void;
        public toColor4(alpha?: number): Color4;
        public asArray(): number[];
        public toLuminance(): number;
        public multiply(otherColor: Color3): Color3;
        public multiplyToRef(otherColor: Color3, result: Color3): void;
        public equals(otherColor: Color3): boolean;
        public scale(scale: number): Color3;
        public scaleToRef(scale: number, result: Color3): void;
        public add(otherColor: Color3): Color3;
        public addToRef(otherColor: Color3, result: Color3): void;
        public subtract(otherColor: Color3): Color3;
        public subtractToRef(otherColor: Color3, result: Color3): void;
        public clone(): Color3;
        public copyFrom(source: Color3): void;
        public copyFromFloats(r: number, g: number, b: number): void;
        static FromArray(array: number[]): Color3;
        static FromInts(r: number, g: number, b: number): Color3;
        static Lerp(start: Color3, end: Color3, amount: number): Color3;
        static Red(): Color3;
        static Green(): Color3;
        static Blue(): Color3;
        static Black(): Color3;
        static White(): Color3;
        static Purple(): Color3;
        static Magenta(): Color3;
        static Yellow(): Color3;
        static Gray(): Color3;
    }
    class Color4 {
        public r: number;
        public g: number;
        public b: number;
        public a: number;
        constructor(r: number, g: number, b: number, a: number);
        public addInPlace(right: any): void;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public add(right: Color4): Color4;
        public subtract(right: Color4): Color4;
        public subtractToRef(right: Color4, result: Color4): void;
        public scale(scale: number): Color4;
        public scaleToRef(scale: number, result: Color4): void;
        public toString(): string;
        public clone(): Color4;
        static Lerp(left: Color4, right: Color4, amount: number): Color4;
        static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void;
        static FromArray(array: number[], offset?: number): Color4;
        static FromInts(r: number, g: number, b: number, a: number): Color4;
    }
    class Vector2 {
        public x: number;
        public y: number;
        constructor(x: number, y: number);
        public toString(): string;
        public toArray(array: number[], index?: number): void;
        public asArray(): number[];
        public copyFrom(source: Vector2): void;
        public copyFromFloats(x: number, y: number): void;
        public add(otherVector: Vector2): Vector2;
        public addVector3(otherVector: Vector3): Vector2;
        public subtract(otherVector: Vector2): Vector2;
        public subtractInPlace(otherVector: Vector2): void;
        public multiplyInPlace(otherVector: Vector2): void;
        public multiply(otherVector: Vector2): Vector2;
        public multiplyToRef(otherVector: Vector2, result: Vector2): void;
        public multiplyByFloats(x: number, y: number): Vector2;
        public divide(otherVector: Vector2): Vector2;
        public divideToRef(otherVector: Vector2, result: Vector2): void;
        public negate(): Vector2;
        public scaleInPlace(scale: number): Vector2;
        public scale(scale: number): Vector2;
        public equals(otherVector: Vector2): boolean;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector2;
        public clone(): Vector2;
        static Zero(): Vector2;
        static FromArray(array: number[], offset?: number): Vector2;
        static FromArrayToRef(array: number[], offset: number, result: Vector2): void;
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        static Dot(left: Vector2, right: Vector2): number;
        static Normalize(vector: Vector2): Vector2;
        static Minimize(left: Vector2, right: Vector2): Vector2;
        static Maximize(left: Vector2, right: Vector2): Vector2;
        static Transform(vector: Vector2, transformation: Matrix): Vector2;
        static Distance(value1: Vector2, value2: Vector2): number;
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
    }
    class Vector3 {
        public x: number;
        public y: number;
        public z: number;
        constructor(x: number, y: number, z: number);
        public toString(): string;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public addInPlace(otherVector: Vector3): void;
        public add(otherVector: Vector3): Vector3;
        public addToRef(otherVector: Vector3, result: Vector3): void;
        public subtractInPlace(otherVector: Vector3): void;
        public subtract(otherVector: Vector3): Vector3;
        public subtractToRef(otherVector: Vector3, result: Vector3): void;
        public subtractFromFloats(x: number, y: number, z: number): Vector3;
        public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        public negate(): Vector3;
        public scaleInPlace(scale: number): Vector3;
        public scale(scale: number): Vector3;
        public scaleToRef(scale: number, result: Vector3): void;
        public equals(otherVector: Vector3): boolean;
        public equalsWithEpsilon(otherVector: Vector3): boolean;
        public equalsToFloats(x: number, y: number, z: number): boolean;
        public multiplyInPlace(otherVector: Vector3): void;
        public multiply(otherVector: Vector3): Vector3;
        public multiplyToRef(otherVector: Vector3, result: Vector3): void;
        public multiplyByFloats(x: number, y: number, z: number): Vector3;
        public divide(otherVector: Vector3): Vector3;
        public divideToRef(otherVector: Vector3, result: Vector3): void;
        public MinimizeInPlace(other: Vector3): void;
        public MaximizeInPlace(other: Vector3): void;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector3;
        public clone(): Vector3;
        public copyFrom(source: Vector3): void;
        public copyFromFloats(x: number, y: number, z: number): void;
        static FromArray(array: number[], offset?: number): Vector3;
        static FromArrayToRef(array: number[], offset: number, result: Vector3): void;
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void;
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
        static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3;
        static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3;
        static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3;
        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        static Distance(value1: Vector3, value2: Vector3): number;
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
        static Center(value1: Vector3, value2: Vector3): Vector3;
    }
    class Vector4 {
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        constructor(x: number, y: number, z: number, w: number);
        public toString(): string;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public addInPlace(otherVector: Vector4): void;
        public add(otherVector: Vector4): Vector4;
        public addToRef(otherVector: Vector4, result: Vector4): void;
        public subtractInPlace(otherVector: Vector4): void;
        public subtract(otherVector: Vector4): Vector4;
        public subtractToRef(otherVector: Vector4, result: Vector4): void;
        public subtractFromFloats(x: number, y: number, z: number, w: number): Vector4;
        public subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        public negate(): Vector4;
        public scaleInPlace(scale: number): Vector4;
        public scale(scale: number): Vector4;
        public scaleToRef(scale: number, result: Vector4): void;
        public equals(otherVector: Vector4): boolean;
        public equalsWithEpsilon(otherVector: Vector4): boolean;
        public equalsToFloats(x: number, y: number, z: number, w: number): boolean;
        public multiplyInPlace(otherVector: Vector4): void;
        public multiply(otherVector: Vector4): Vector4;
        public multiplyToRef(otherVector: Vector4, result: Vector4): void;
        public multiplyByFloats(x: number, y: number, z: number, w: number): Vector4;
        public divide(otherVector: Vector4): Vector4;
        public divideToRef(otherVector: Vector4, result: Vector4): void;
        public MinimizeInPlace(other: Vector4): void;
        public MaximizeInPlace(other: Vector4): void;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector4;
        public clone(): Vector4;
        public copyFrom(source: Vector4): void;
        public copyFromFloats(x: number, y: number, z: number, w: number): void;
        static FromArray(array: number[], offset?: number): Vector4;
        static FromArrayToRef(array: number[], offset: number, result: Vector4): void;
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void;
        static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        static Zero(): Vector4;
        static Normalize(vector: Vector4): Vector4;
        static NormalizeToRef(vector: Vector4, result: Vector4): void;
        static Minimize(left: Vector4, right: Vector4): Vector4;
        static Maximize(left: Vector4, right: Vector4): Vector4;
        static Distance(value1: Vector4, value2: Vector4): number;
        static DistanceSquared(value1: Vector4, value2: Vector4): number;
        static Center(value1: Vector4, value2: Vector4): Vector4;
    }
    class Quaternion {
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        public toString(): string;
        public asArray(): number[];
        public equals(otherQuaternion: Quaternion): boolean;
        public clone(): Quaternion;
        public copyFrom(other: Quaternion): void;
        public copyFromFloats(x: number, y: number, z: number, w: number): void;
        public add(other: Quaternion): Quaternion;
        public subtract(other: Quaternion): Quaternion;
        public scale(value: number): Quaternion;
        public multiply(q1: Quaternion): Quaternion;
        public multiplyToRef(q1: Quaternion, result: Quaternion): void;
        public length(): number;
        public normalize(): void;
        public toEulerAngles(): Vector3;
        public toEulerAnglesToRef(result: Vector3): void;
        public toRotationMatrix(result: Matrix): void;
        public fromRotationMatrix(matrix: Matrix): void;
        static Inverse(q: Quaternion): Quaternion;
        static RotationAxis(axis: Vector3, angle: number): Quaternion;
        static FromArray(array: number[], offset?: number): Quaternion;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }
    class Matrix {
        private static _tempQuaternion;
        private static _xAxis;
        private static _yAxis;
        private static _zAxis;
        public m: Float32Array;
        public isIdentity(): boolean;
        public determinant(): number;
        public toArray(): Float32Array;
        public asArray(): Float32Array;
        public invert(): void;
        public invertToRef(other: Matrix): void;
        public setTranslation(vector3: Vector3): void;
        public multiply(other: Matrix): Matrix;
        public copyFrom(other: Matrix): void;
        public copyToArray(array: Float32Array, offset?: number): void;
        public multiplyToRef(other: Matrix, result: Matrix): void;
        public multiplyToArray(other: Matrix, result: Float32Array, offset: number): void;
        public equals(value: Matrix): boolean;
        public clone(): Matrix;
        static FromArray(array: number[], offset?: number): Matrix;
        static FromArrayToRef(array: number[], offset: number, result: Matrix): void;
        static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void;
        static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix;
        static Identity(): Matrix;
        static IdentityToRef(result: Matrix): void;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static Invert(source: Matrix): Matrix;
        static RotationXToRef(angle: number, result: Matrix): void;
        static RotationY(angle: number): Matrix;
        static RotationYToRef(angle: number, result: Matrix): void;
        static RotationZ(angle: number): Matrix;
        static RotationZToRef(angle: number, result: Matrix): void;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void;
        static Scaling(x: number, y: number, z: number): Matrix;
        static ScalingToRef(x: number, y: number, z: number, result: Matrix): void;
        static Translation(x: number, y: number, z: number): Matrix;
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLHToRef(left: number, right: any, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix): void;
        static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
        static ReflectionToRef(plane: Plane, result: Matrix): void;
    }
    class Plane {
        public normal: Vector3;
        public d: number;
        constructor(a: number, b: number, c: number, d: number);
        public asArray(): number[];
        public clone(): Plane;
        public normalize(): void;
        public transform(transformation: Matrix): Plane;
        public dotCoordinate(point: any): number;
        public copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): void;
        public isFrontFacingTo(direction: Vector3, epsilon: number): boolean;
        public signedDistanceTo(point: Vector3): number;
        static FromArray(array: number[]): Plane;
        static FromPoints(point1: any, point2: any, point3: any): Plane;
        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane;
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number;
    }
    class Viewport {
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        constructor(x: number, y: number, width: number, height: number);
        public toGlobal(engine: any): Viewport;
    }
    class Frustum {
        static GetPlanes(transform: Matrix): Plane[];
        static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void;
    }
    class Ray {
        public origin: Vector3;
        public direction: Vector3;
        public length: number;
        private _edge1;
        private _edge2;
        private _pvec;
        private _tvec;
        private _qvec;
        constructor(origin: Vector3, direction: Vector3, length?: number);
        public intersectsBoxMinMax(minimum: Vector3, maximum: Vector3): boolean;
        public intersectsBox(box: BoundingBox): boolean;
        public intersectsSphere(sphere: any): boolean;
        public intersectsTriangle(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3): IntersectionInfo;
        static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray;
        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        */
        static CreateNewFromTo(origin: Vector3, end: Vector3, world?: Matrix): Ray;
        static Transform(ray: Ray, matrix: Matrix): Ray;
    }
    enum Space {
        LOCAL = 0,
        WORLD = 1,
    }
    class Axis {
        static X: Vector3;
        static Y: Vector3;
        static Z: Vector3;
    }
    class BezierCurve {
        static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number;
    }
}
