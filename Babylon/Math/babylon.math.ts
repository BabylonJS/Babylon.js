module BABYLON {
    export class Color3 {
        constructor(public r: number = 0, public g: number = 0, public b: number = 0) {
        }

        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
        }

        // Operators
        public toArray(array: number[], index?: number): void {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public multiply(otherColor: Color3): Color3 {
            return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
        }

        public multiplyToRef(otherColor: Color3, result: Color3): void {
            result.r = this.r * otherColor.r;
            result.g = this.g * otherColor.g;
            result.b = this.b * otherColor.b;
        }

        public equals(otherColor: Color3): boolean {
            return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
        }

        public scale(scale: number): Color3 {
            return new Color3(this.r * scale, this.g * scale, this.b * scale);
        }

        public scaleToRef(scale: number, result: Color3): void {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
        }

        public add(otherColor: Color3): Color3 {
            return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
        }

        public addToRef(otherColor: Color3, result: Color3): void {
            result.r = this.r + otherColor.r;
            result.g = this.g + otherColor.g;
            result.b = this.b + otherColor.b;
        }

        public subtract(otherColor: Color3): Color3 {
            return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
        }

        public subtractToRef(otherColor: Color3, result: Color3): void {
            result.r = this.r - otherColor.r;
            result.g = this.g - otherColor.g;
            result.b = this.b - otherColor.b;
        }

        public clone(): Color3 {
            return new Color3(this.r, this.g, this.b);
        }

        public copyFrom(source: Color3): void {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
        }

        public copyFromFloats(r: number, g: number, b: number): void {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        // Statics
        public static FromArray(array: number[]): Color3 {
            return new Color3(array[0], array[1], array[2]);
        }

        public static FromInts(r: number, g: number, b: number): Color3 {
            return new Color3(r / 255.0, g / 255.0, b / 255.0);
        }

        public static Lerp(start: Color3, end: Color3, amount: number): Color3 {
            var r = start.r + ((end.r - start.r) * amount);
            var g = start.g + ((end.g - start.g) * amount);
            var b = start.b + ((end.b - start.b) * amount);

            return new Color3(r, g, b);
        }

        public static Red(): Color3 { return new Color3(1, 0, 0); }
        public static Green(): Color3 { return new Color3(0, 1, 0); }
        public static Blue(): Color3 { return new Color3(0, 0, 1); }
        public static Black(): Color3 { return new Color3(0, 0, 0); }
        public static White(): Color3 { return new Color3(1, 1, 1); }
        public static Purple(): Color3 { return new Color3(0.5, 0, 0.5); }
        public static Magenta(): Color3 { return new Color3(1, 0, 1); }
        public static Yellow(): Color3 { return new Color3(1, 1, 0); }
        public static Gray(): Color3 { return new Color3(0.5, 0.5, 0.5); }
    }

    export class Color4 {
        constructor(public r: number, public g: number, public b: number, public a: number) {
        }

        // Operators
        public addInPlace(right) {
            this.r += right.r;
            this.g += right.g;
            this.b += right.b;
            this.a += right.a;
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public toArray(array: number[], index?: number): void {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            array[index + 3] = this.a;
        }

        public add(right: Color4): Color4 {
            return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
        }

        public subtract(right: Color4): Color4 {
            return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
        }

        public subtractToRef(right: Color4, result: Color4): void {
            result.r = this.r - right.r;
            result.g = this.g - right.g;
            result.b = this.b - right.b;
            result.a = this.a - right.a;
        }

        public scale(scale: number): Color4 {
            return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
        }

        public scaleToRef(scale: number, result: Color4): void {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
            result.a = this.a * scale;
        }

        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }

        public clone(): Color4 {
            return new Color4(this.r, this.g, this.b, this.a);
        }

        // Statics
        public static Lerp(left: Color4, right: Color4, amount: number): Color4 {
            var result = new Color4(0, 0, 0, 0);

            BABYLON.Color4.LerpToRef(left, right, amount, result);

            return result;
        }

        public static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void {
            result.r = left.r + (right.r - left.r) * amount;
            result.g = left.g + (right.g - left.g) * amount;
            result.b = left.b + (right.b - left.b) * amount;
            result.a = left.a + (right.a - left.a) * amount;
        }

        public static FromArray(array: number[], offset: number): Color4 {
            if (!offset) {
                offset = 0;
            }

            return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }

        public static FromInts(r: number, g: number, b: number, a: number): Color4 {
            return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
        }
    }

    export class Vector2 {
        constructor(public x: number, public y: number) {
        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + "}";
        }

        // Operators
        public toArray(array: number[], index?: number): void {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.x;
            array[index + 1] = this.y;
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public copyFrom(source: Vector2): void {
            this.x = source.x;
            this.y = source.y;
        }

        public add(otherVector: Vector2): Vector2 {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        }

        public subtract(otherVector: Vector2): Vector2 {
            return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
        }

        public negate(): Vector2 {
            return new Vector2(-this.x, -this.y);
        }

        public scaleInPlace(scale: number): void {
            this.x *= scale;
            this.y *= scale;
        }

        public scale(scale: number): Vector2 {
            return new Vector2(this.x * scale, this.y * scale);
        }

        public equals(otherVector: Vector2): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y;
        }

        // Properties
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y);
        }

        // Methods
        public normalize(): void {
            var len = this.length();

            if (len === 0)
                return;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;
        }

        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }

        // Statics
        public static Zero(): Vector2 {
            return new Vector2(0, 0);
        }

        public static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2 {
            var squared = amount * amount;
            var cubed = amount * squared;

            var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
                (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
                ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

            var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
                (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
                ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

            return new Vector2(x, y);
        }

        public static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2 {
            var x = value.x;
            x = (x > max.x) ? max.x : x;
            x = (x < min.x) ? min.x : x;

            var y = value.y;
            y = (y > max.y) ? max.y : y;
            y = (y < min.y) ? min.y : y;

            return new Vector2(x, y);
        }

        public static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2 {
            var squared = amount * amount;
            var cubed = amount * squared;
            var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
            var part2 = (-2.0 * cubed) + (3.0 * squared);
            var part3 = (cubed - (2.0 * squared)) + amount;
            var part4 = cubed - squared;

            var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
            var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);

            return new Vector2(x, y);
        }

        public static Lerp(start: Vector2, end: Vector2, amount: number): Vector2 {
            var x = start.x + ((end.x - start.x) * amount);
            var y = start.y + ((end.y - start.y) * amount);

            return new Vector2(x, y);
        }

        public static Dot(left: Vector2, right: Vector2): number {
            return left.x * right.x + left.y * right.y;
        }

        public static Normalize(vector: Vector2): Vector2 {
            var newVector = vector.clone();
            newVector.normalize();
            return newVector;
        }

        public static Minimize(left: Vector2, right: Vector2): Vector2 {
            var x = (left.x < right.x) ? left.x : right.x;
            var y = (left.y < right.y) ? left.y : right.y;

            return new Vector2(x, y);
        }

        public static Maximize(left: Vector2, right: Vector2): Vector2 {
            var x = (left.x > right.x) ? left.x : right.x;
            var y = (left.y > right.y) ? left.y : right.y;

            return new Vector2(x, y);
        }

        public static Transform(vector: Vector2, transformation: Matrix): Vector2 {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]);

            return new Vector2(x, y);
        }

        public static Distance(value1: Vector2, value2: Vector2): number {
            return Math.sqrt(Vector2.DistanceSquared(value1, value2));
        }

        public static DistanceSquared(value1: Vector2, value2: Vector2): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;

            return (x * x) + (y * y);
        }
    }

    export class Vector3 {

        constructor(public x: number, public y: number, public z: number) {
        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
        }

        // Operators
        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public toArray(array: number[], index?: number): void {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
        }

        public addInPlace(otherVector: Vector3): void {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
        }

        public add(otherVector: Vector3): Vector3 {
            return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
        }

        public addToRef(otherVector: Vector3, result: Vector3): void {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
        }

        public subtractInPlace(otherVector: Vector3): void {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
        }

        public subtract(otherVector: Vector3): Vector3 {
            return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
        }

        public subtractToRef(otherVector: Vector3, result: Vector3): void {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
        }

        public subtractFromFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x - x, this.y - y, this.z - z);
        }

        public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): void {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
        }

        public negate(): Vector3 {
            return new Vector3(-this.x, -this.y, -this.z);
        }

        public scaleInPlace(scale: number): void {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
        }

        public scale(scale: number): Vector3 {
            return new Vector3(this.x * scale, this.y * scale, this.z * scale);
        }

        public scaleToRef(scale: number, result: Vector3) {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
        }

        public equals(otherVector: Vector3): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
        }

        public equalsToFloats(x: number, y: number, z: number): boolean {
            return this.x === x && this.y === y && this.z === z;
        }

        public multiplyInPlace(otherVector: Vector3): void {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
        }

        public multiply(otherVector: Vector3): Vector3 {
            return new Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
        }

        public multiplyToRef(otherVector: Vector3, result: Vector3): void {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
        }

        public multiplyByFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x * x, this.y * y, this.z * z);
        }

        public divide(otherVector: Vector3): Vector3 {
            return new Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
        }

        public divideToRef(otherVector: Vector3, result: Vector3): void {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
        }

        public MinimizeInPlace(other: Vector3): void {
            if (other.x < this.x) this.x = other.x;
            if (other.y < this.y) this.y = other.y;
            if (other.z < this.z) this.z = other.z;
        }

        public MaximizeInPlace(other: Vector3): void {
            if (other.x > this.x) this.x = other.x;
            if (other.y > this.y) this.y = other.y;
            if (other.z > this.z) this.z = other.z;
        }

        // Properties
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y + this.z * this.z);
        }

        // Methods
        public normalize(): void {
            var len = this.length();

            if (len === 0)
                return;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;
            this.z *= num;
        }

        public clone(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }

        public copyFrom(source: Vector3): void {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
        }

        public copyFromFloats(x: number, y: number, z: number): void {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        // Statics
        public static FromArray(array: number[], offset?: number): Vector3 {
            if (!offset) {
                offset = 0;
            }

            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        }

        public static FromArrayToRef(array: number[], offset: number, result: Vector3): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
        }

        public static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
        }

        public static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void {
            result.x = x;
            result.y = y;
            result.z = z;
        }

        public static Zero(): Vector3 {
            return new Vector3(0, 0, 0);
        }

        public static Up(): Vector3 {
            return new Vector3(0, 1.0, 0);
        }

        public static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3 {
            var result = Vector3.Zero();

            Vector3.TransformCoordinatesToRef(vector, transformation, result);

            return result;
        }

        public static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
            var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];

            result.x = x / w;
            result.y = y / w;
            result.z = z / w;
        }

        public static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            var rx = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]) + transformation.m[12];
            var ry = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]) + transformation.m[13];
            var rz = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]) + transformation.m[14];
            var rw = (x * transformation.m[3]) + (y * transformation.m[7]) + (z * transformation.m[11]) + transformation.m[15];

            result.x = rx / rw;
            result.y = ry / rw;
            result.z = rz / rw;
        }

        public static TransformNormal(vector: Vector3, transformation: Matrix): Vector3 {
            var result = Vector3.Zero();

            Vector3.TransformNormalToRef(vector, transformation, result);

            return result;
        }

        public static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void {
            result.x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            result.y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            result.z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
        }

        public static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            result.x = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]);
            result.y = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]);
            result.z = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]);
        }

        public static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3 {
            var squared = amount * amount;
            var cubed = amount * squared;

            var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
                (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
                ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

            var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
                (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
                ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

            var z = 0.5 * ((((2.0 * value2.z) + ((-value1.z + value3.z) * amount)) +
                (((((2.0 * value1.z) - (5.0 * value2.z)) + (4.0 * value3.z)) - value4.z) * squared)) +
                ((((-value1.z + (3.0 * value2.z)) - (3.0 * value3.z)) + value4.z) * cubed));

            return new Vector3(x, y, z);
        }

        public static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3 {
            var x = value.x;
            x = (x > max.x) ? max.x : x;
            x = (x < min.x) ? min.x : x;

            var y = value.y;
            y = (y > max.y) ? max.y : y;
            y = (y < min.y) ? min.y : y;

            var z = value.z;
            z = (z > max.z) ? max.z : z;
            z = (z < min.z) ? min.z : z;

            return new Vector3(x, y, z);
        }

        public static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3 {
            var squared = amount * amount;
            var cubed = amount * squared;
            var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
            var part2 = (-2.0 * cubed) + (3.0 * squared);
            var part3 = (cubed - (2.0 * squared)) + amount;
            var part4 = cubed - squared;

            var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
            var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
            var z = (((value1.z * part1) + (value2.z * part2)) + (tangent1.z * part3)) + (tangent2.z * part4);

            return new Vector3(x, y, z);
        }

        public static Lerp(start: Vector3, end: Vector3, amount: number): Vector3 {
            var x = start.x + ((end.x - start.x) * amount);
            var y = start.y + ((end.y - start.y) * amount);
            var z = start.z + ((end.z - start.z) * amount);

            return new Vector3(x, y, z);
        }

        public static Dot(left: Vector3, right: Vector3): number {
            return (left.x * right.x + left.y * right.y + left.z * right.z);
        }

        public static Cross(left: Vector3, right: Vector3): Vector3 {
            var result = Vector3.Zero();

            Vector3.CrossToRef(left, right, result);

            return result;
        }

        public static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void {
            result.x = left.y * right.z - left.z * right.y;
            result.y = left.z * right.x - left.x * right.z;
            result.z = left.x * right.y - left.y * right.x;
        }

        public static Normalize(vector: Vector3): Vector3 {
            var result = Vector3.Zero();
            Vector3.NormalizeToRef(vector, result);
            return result;
        }

        public static NormalizeToRef(vector: Vector3, result: Vector3): void {
            result.copyFrom(vector);
            result.normalize();
        }

        public static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3 {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;

            var viewportMatrix = BABYLON.Matrix.FromValues(
                cw / 2.0, 0, 0, 0,
                0, -ch / 2.0, 0, 0,
                0, 0, 1, 0,
                cx + cw / 2.0, ch / 2.0 + cy, 0, 1);

            var finalMatrix = world.multiply(transform).multiply(viewportMatrix);

            return Vector3.TransformCoordinates(vector, finalMatrix);
        }

        public static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3 {
            var matrix = world.multiply(view).multiply(projection);
            matrix.invert();
            source.x = source.x / viewportWidth * 2 - 1;
            source.y = -(source.y / viewportHeight * 2 - 1);
            var vector = BABYLON.Vector3.TransformCoordinates(source, matrix);
            var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];

            if (BABYLON.Tools.WithinEpsilon(num, 1.0)) {
                vector = vector.scale(1.0 / num);
            }

            return vector;
        }

        public static Minimize(left: Vector3, right: Vector3): Vector3 {
            var min = left.clone();
            min.MinimizeInPlace(right);
            return min;
        }

        public static Maximize(left: Vector3, right: Vector3): Vector3 {
            var max = left.clone();
            max.MaximizeInPlace(right);
            return max;
        }

        public static Distance(value1: Vector3, value2: Vector3): number {
            return Math.sqrt(Vector3.DistanceSquared(value1, value2));
        }

        public static DistanceSquared(value1: Vector3, value2: Vector3): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;

            return (x * x) + (y * y) + (z * z);
        }

        public static Center(value1: Vector3, value2: Vector3): Vector3 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }
    }

    export class Quaternion {
        constructor(public x: number = 0, public y: number = 0, public z: number = 0, public w: number = 0) {

        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        }

        public asArray(): number[] {
            return [this.x, this.y, this.z, this.w];
        }

        public equals(otherQuaternion: Quaternion): boolean {
            return otherQuaternion && this.x === otherQuaternion.x && this.y === otherQuaternion.y && this.z === otherQuaternion.z && this.w === otherQuaternion.w;
        }

        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        public copyFrom(other: Quaternion): void {
            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;
        }

        public add(other: Quaternion): Quaternion {
            return new Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
        }

        public subtract(other: Quaternion): Quaternion {
            return new Quaternion(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
        }

        public scale(value: number): Quaternion {
            return new Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
        }

        public multiply(q1: Quaternion): Quaternion {
            var result = new Quaternion(0, 0, 0, 1.0);

            this.multiplyToRef(q1, result);

            return result;
        }

        public multiplyToRef(q1: Quaternion, result: Quaternion): void {
            result.x = this.x * q1.w + this.y * q1.z - this.z * q1.y + this.w * q1.x;
            result.y = -this.x * q1.z + this.y * q1.w + this.z * q1.x + this.w * q1.y;
            result.z = this.x * q1.y - this.y * q1.x + this.z * q1.w + this.w * q1.z;
            result.w = -this.x * q1.x - this.y * q1.y - this.z * q1.z + this.w * q1.w;
        }

        public length(): number {
            return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
        }

        public normalize(): void {
            var length = 1.0 / this.length();
            this.x *= length;
            this.y *= length;
            this.z *= length;
            this.w *= length;
        }

        public toEulerAngles(): Vector3 {
            var qx = this.x;
            var qy = this.y;
            var qz = this.z;
            var qw = this.w;

            var sqx = qx * qx;
            var sqy = qy * qy;
            var sqz = qz * qz;

            var yaw = Math.atan2(2.0 * (qy * qw - qx * qz), 1.0 - 2.0 * (sqy + sqz));
            var pitch = Math.asin(2.0 * (qx * qy + qz * qw));
            var roll = Math.atan2(2.0 * (qx * qw - qy * qz), 1.0 - 2.0 * (sqx + sqz));

            var gimbaLockTest = qx * qy + qz * qw;
            if (gimbaLockTest > 0.499) {
                yaw = 2.0 * Math.atan2(qx, qw);
                roll = 0;
            } else if (gimbaLockTest < -0.499) {
                yaw = -2.0 * Math.atan2(qx, qw);
                roll = 0;
            }

            return new Vector3(pitch, yaw, roll);
        }

        public toRotationMatrix(result: Matrix): void {
            var xx = this.x * this.x;
            var yy = this.y * this.y;
            var zz = this.z * this.z;
            var xy = this.x * this.y;
            var zw = this.z * this.w;
            var zx = this.z * this.x;
            var yw = this.y * this.w;
            var yz = this.y * this.z;
            var xw = this.x * this.w;

            result.m[0] = 1.0 - (2.0 * (yy + zz));
            result.m[1] = 2.0 * (xy + zw);
            result.m[2] = 2.0 * (zx - yw);
            result.m[3] = 0;
            result.m[4] = 2.0 * (xy - zw);
            result.m[5] = 1.0 - (2.0 * (zz + xx));
            result.m[6] = 2.0 * (yz + xw);
            result.m[7] = 0;
            result.m[8] = 2.0 * (zx + yw);
            result.m[9] = 2.0 * (yz - xw);
            result.m[10] = 1.0 - (2.0 * (yy + xx));
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
            result.m[15] = 1.0;
        }

        // Statics
        public static RotationAxis(axis: Vector3, angle: number): Quaternion {
            var result = new Quaternion();
            var sin = Math.sin(angle / 2);

            result.w = Math.cos(angle / 2);
            result.x = axis.x * sin;
            result.y = axis.y * sin;
            result.z = axis.z * sin;

            return result;
        }

        public static FromArray(array: number[], offset?: number): Quaternion {
            if (!offset) {
                offset = 0;
            }

            return new Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }

        public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion {
            var result = new Quaternion();

            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, result);

            return result;
        }

        public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void {
            var halfRoll = roll * 0.5;
            var halfPitch = pitch * 0.5;
            var halfYaw = yaw * 0.5;

            var sinRoll = Math.sin(halfRoll);
            var cosRoll = Math.cos(halfRoll);
            var sinPitch = Math.sin(halfPitch);
            var cosPitch = Math.cos(halfPitch);
            var sinYaw = Math.sin(halfYaw);
            var cosYaw = Math.cos(halfYaw);

            result.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
            result.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
            result.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
            result.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);
        }


        public static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion {
            var num2;
            var num3;
            var num = amount;
            var num4 = (((left.x * right.x) + (left.y * right.y)) + (left.z * right.z)) + (left.w * right.w);
            var flag = false;

            if (num4 < 0) {
                flag = true;
                num4 = -num4;
            }

            if (num4 > 0.999999) {
                num3 = 1 - num;
                num2 = flag ? -num : num;
            }
            else {
                var num5 = Math.acos(num4);
                var num6 = (1.0 / Math.sin(num5));
                num3 = (Math.sin((1.0 - num) * num5)) * num6;
                num2 = flag ? ((-Math.sin(num * num5)) * num6) : ((Math.sin(num * num5)) * num6);
            }

            return new Quaternion((num3 * left.x) + (num2 * right.x), (num3 * left.y) + (num2 * right.y), (num3 * left.z) + (num2 * right.z), (num3 * left.w) + (num2 * right.w));
        }
    }

    export class Matrix {
        private static _tempQuaternion: Quaternion = new Quaternion();
        private static _xAxis: Vector3 = Vector3.Zero();
        private static _yAxis: Vector3 = Vector3.Zero();
        private static _zAxis: Vector3 = Vector3.Zero();

        public m: Float32Array = new Float32Array(16);

        // Properties
        public isIdentity(): boolean {
            if (this.m[0] != 1.0 || this.m[5] != 1.0 || this.m[10] != 1.0 || this.m[15] != 1.0)
                return false;

            if (this.m[1] != 0.0 || this.m[2] != 0.0 || this.m[3] != 0.0 ||
                this.m[4] != 0.0 || this.m[6] != 0.0 || this.m[7] != 0.0 ||
                this.m[8] != 0.0 || this.m[9] != 0.0 || this.m[11] != 0.0 ||
                this.m[12] != 0.0 || this.m[13] != 0.0 || this.m[14] != 0.0)
                return false;

            return true;
        }

        public determinant(): number {
            var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
            var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
            var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
            var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
            var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
            var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);

            return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) -
                (this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) -
                (this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
        }

        // Methods
        public toArray(): Float32Array {
            return this.m;
        }

        public asArray(): Float32Array {
            return this.toArray();
        }

        public invert(): void {
            this.invertToRef(this);
        }

        public invertToRef(other: Matrix) {
            var l1 = this.m[0];
            var l2 = this.m[1];
            var l3 = this.m[2];
            var l4 = this.m[3];
            var l5 = this.m[4];
            var l6 = this.m[5];
            var l7 = this.m[6];
            var l8 = this.m[7];
            var l9 = this.m[8];
            var l10 = this.m[9];
            var l11 = this.m[10];
            var l12 = this.m[11];
            var l13 = this.m[12];
            var l14 = this.m[13];
            var l15 = this.m[14];
            var l16 = this.m[15];
            var l17 = (l11 * l16) - (l12 * l15);
            var l18 = (l10 * l16) - (l12 * l14);
            var l19 = (l10 * l15) - (l11 * l14);
            var l20 = (l9 * l16) - (l12 * l13);
            var l21 = (l9 * l15) - (l11 * l13);
            var l22 = (l9 * l14) - (l10 * l13);
            var l23 = ((l6 * l17) - (l7 * l18)) + (l8 * l19);
            var l24 = -(((l5 * l17) - (l7 * l20)) + (l8 * l21));
            var l25 = ((l5 * l18) - (l6 * l20)) + (l8 * l22);
            var l26 = -(((l5 * l19) - (l6 * l21)) + (l7 * l22));
            var l27 = 1.0 / ((((l1 * l23) + (l2 * l24)) + (l3 * l25)) + (l4 * l26));
            var l28 = (l7 * l16) - (l8 * l15);
            var l29 = (l6 * l16) - (l8 * l14);
            var l30 = (l6 * l15) - (l7 * l14);
            var l31 = (l5 * l16) - (l8 * l13);
            var l32 = (l5 * l15) - (l7 * l13);
            var l33 = (l5 * l14) - (l6 * l13);
            var l34 = (l7 * l12) - (l8 * l11);
            var l35 = (l6 * l12) - (l8 * l10);
            var l36 = (l6 * l11) - (l7 * l10);
            var l37 = (l5 * l12) - (l8 * l9);
            var l38 = (l5 * l11) - (l7 * l9);
            var l39 = (l5 * l10) - (l6 * l9);

            other.m[0] = l23 * l27;
            other.m[4] = l24 * l27;
            other.m[8] = l25 * l27;
            other.m[12] = l26 * l27;
            other.m[1] = -(((l2 * l17) - (l3 * l18)) + (l4 * l19)) * l27;
            other.m[5] = (((l1 * l17) - (l3 * l20)) + (l4 * l21)) * l27;
            other.m[9] = -(((l1 * l18) - (l2 * l20)) + (l4 * l22)) * l27;
            other.m[13] = (((l1 * l19) - (l2 * l21)) + (l3 * l22)) * l27;
            other.m[2] = (((l2 * l28) - (l3 * l29)) + (l4 * l30)) * l27;
            other.m[6] = -(((l1 * l28) - (l3 * l31)) + (l4 * l32)) * l27;
            other.m[10] = (((l1 * l29) - (l2 * l31)) + (l4 * l33)) * l27;
            other.m[14] = -(((l1 * l30) - (l2 * l32)) + (l3 * l33)) * l27;
            other.m[3] = -(((l2 * l34) - (l3 * l35)) + (l4 * l36)) * l27;
            other.m[7] = (((l1 * l34) - (l3 * l37)) + (l4 * l38)) * l27;
            other.m[11] = -(((l1 * l35) - (l2 * l37)) + (l4 * l39)) * l27;
            other.m[15] = (((l1 * l36) - (l2 * l38)) + (l3 * l39)) * l27;
        }

        public setTranslation(vector3: Vector3): void {
            this.m[12] = vector3.x;
            this.m[13] = vector3.y;
            this.m[14] = vector3.z;
        }

        public multiply(other: Matrix): Matrix {
            var result = new Matrix();

            this.multiplyToRef(other, result);

            return result;
        }

        public copyFrom(other: Matrix): void {
            for (var index = 0; index < 16; index++) {
                this.m[index] = other.m[index];
            }
        }

        public copyToArray(array: Float32Array, offset: number = 0): void {
            for (var index = 0; index < 16; index++) {
                array[offset + index] = this.m[index];
            }
        }

        public multiplyToRef(other: Matrix, result: Matrix): void {
            this.multiplyToArray(other, result.m, 0);
        }

        public multiplyToArray(other: Matrix, result: Float32Array, offset: number): void {

            var tm0 = this.m[0];
            var tm1 = this.m[1];
            var tm2 = this.m[2];
            var tm3 = this.m[3];
            var tm4 = this.m[4];
            var tm5 = this.m[5];
            var tm6 = this.m[6];
            var tm7 = this.m[7];
            var tm8 = this.m[8];
            var tm9 = this.m[9];
            var tm10 = this.m[10];
            var tm11 = this.m[11];
            var tm12 = this.m[12];
            var tm13 = this.m[13];
            var tm14 = this.m[14];
            var tm15 = this.m[15];

            var om0 = other.m[0];
            var om1 = other.m[1];
            var om2 = other.m[2];
            var om3 = other.m[3];
            var om4 = other.m[4];
            var om5 = other.m[5];
            var om6 = other.m[6];
            var om7 = other.m[7];
            var om8 = other.m[8];
            var om9 = other.m[9];
            var om10 = other.m[10];
            var om11 = other.m[11];
            var om12 = other.m[12];
            var om13 = other.m[13];
            var om14 = other.m[14];
            var om15 = other.m[15];

            result[offset] = tm0 * om0 + tm1 * om4 + tm2 * om8 + tm3 * om12;
            result[offset + 1] = tm0 * om1 + tm1 * om5 + tm2 * om9 + tm3 * om13;
            result[offset + 2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
            result[offset + 3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;

            result[offset + 4] = tm4 * om0 + tm5 * om4 + tm6 * om8 + tm7 * om12;
            result[offset + 5] = tm4 * om1 + tm5 * om5 + tm6 * om9 + tm7 * om13;
            result[offset + 6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
            result[offset + 7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;

            result[offset + 8] = tm8 * om0 + tm9 * om4 + tm10 * om8 + tm11 * om12;
            result[offset + 9] = tm8 * om1 + tm9 * om5 + tm10 * om9 + tm11 * om13;
            result[offset + 10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
            result[offset + 11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;

            result[offset + 12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
            result[offset + 13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
            result[offset + 14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
            result[offset + 15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
        }

        public equals(value: Matrix): boolean {
            return value &&
                (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] &&
                this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] &&
                this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] &&
                this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
        }

        public clone(): Matrix {
            return Matrix.FromValues(this.m[0], this.m[1], this.m[2], this.m[3],
                this.m[4], this.m[5], this.m[6], this.m[7],
                this.m[8], this.m[9], this.m[10], this.m[11],
                this.m[12], this.m[13], this.m[14], this.m[15]);
        }

        // Statics
        public static FromArray(array: number[], offset?: number): Matrix {
            var result = new Matrix();

            if (!offset) {
                offset = 0;
            }

            Matrix.FromArrayToRef(array, offset, result);

            return result;
        }

        public static FromArrayToRef(array: number[], offset: number, result: Matrix) {

            for (var index = 0; index < 16; index++) {
                result.m[index] = array[index + offset];
            }
        }

        public static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number,
            initialM21: number, initialM22: number, initialM23: number, initialM24: number,
            initialM31: number, initialM32: number, initialM33: number, initialM34: number,
            initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void {

            result.m[0] = initialM11;
            result.m[1] = initialM12;
            result.m[2] = initialM13;
            result.m[3] = initialM14;
            result.m[4] = initialM21;
            result.m[5] = initialM22;
            result.m[6] = initialM23;
            result.m[7] = initialM24;
            result.m[8] = initialM31;
            result.m[9] = initialM32;
            result.m[10] = initialM33;
            result.m[11] = initialM34;
            result.m[12] = initialM41;
            result.m[13] = initialM42;
            result.m[14] = initialM43;
            result.m[15] = initialM44;
        }

        public static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number,
            initialM21: number, initialM22: number, initialM23: number, initialM24: number,
            initialM31: number, initialM32: number, initialM33: number, initialM34: number,
            initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix {

            var result = new Matrix();

            result.m[0] = initialM11;
            result.m[1] = initialM12;
            result.m[2] = initialM13;
            result.m[3] = initialM14;
            result.m[4] = initialM21;
            result.m[5] = initialM22;
            result.m[6] = initialM23;
            result.m[7] = initialM24;
            result.m[8] = initialM31;
            result.m[9] = initialM32;
            result.m[10] = initialM33;
            result.m[11] = initialM34;
            result.m[12] = initialM41;
            result.m[13] = initialM42;
            result.m[14] = initialM43;
            result.m[15] = initialM44;

            return result;
        }

        public static Identity(): Matrix {
            return Matrix.FromValues(1.0, 0, 0, 0,
                0, 1.0, 0, 0,
                0, 0, 1.0, 0,
                0, 0, 0, 1.0);
        }

        public static IdentityToRef(result: Matrix): void {
            Matrix.FromValuesToRef(1.0, 0, 0, 0,
                0, 1.0, 0, 0,
                0, 0, 1.0, 0,
                0, 0, 0, 1.0, result);
        }

        public static Zero(): Matrix {
            return Matrix.FromValues(0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0);
        }

        public static RotationX(angle: number): Matrix {
            var result = new Matrix();

            Matrix.RotationXToRef(angle, result);

            return result;
        }

        public static RotationXToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[0] = 1.0;
            result.m[15] = 1.0;

            result.m[5] = c;
            result.m[10] = c;
            result.m[9] = -s;
            result.m[6] = s;

            result.m[1] = 0;
            result.m[2] = 0;
            result.m[3] = 0;
            result.m[4] = 0;
            result.m[7] = 0;
            result.m[8] = 0;
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
        }

        public static RotationY(angle: number): Matrix {
            var result = new Matrix();

            Matrix.RotationYToRef(angle, result);

            return result;
        }

        public static RotationYToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[5] = 1.0;
            result.m[15] = 1.0;

            result.m[0] = c;
            result.m[2] = -s;
            result.m[8] = s;
            result.m[10] = c;

            result.m[1] = 0;
            result.m[3] = 0;
            result.m[4] = 0;
            result.m[6] = 0;
            result.m[7] = 0;
            result.m[9] = 0;
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
        }

        public static RotationZ(angle: number): Matrix {
            var result = new Matrix();

            Matrix.RotationZToRef(angle, result);

            return result;
        }

        public static RotationZToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[10] = 1.0;
            result.m[15] = 1.0;

            result.m[0] = c;
            result.m[1] = s;
            result.m[4] = -s;
            result.m[5] = c;

            result.m[2] = 0;
            result.m[3] = 0;
            result.m[6] = 0;
            result.m[7] = 0;
            result.m[8] = 0;
            result.m[9] = 0;
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
        }

        public static RotationAxis(axis: Vector3, angle: number): Matrix {
            var s = Math.sin(-angle);
            var c = Math.cos(-angle);
            var c1 = 1 - c;

            axis.normalize();
            var result = Matrix.Zero();

            result.m[0] = (axis.x * axis.x) * c1 + c;
            result.m[1] = (axis.x * axis.y) * c1 - (axis.z * s);
            result.m[2] = (axis.x * axis.z) * c1 + (axis.y * s);
            result.m[3] = 0.0;

            result.m[4] = (axis.y * axis.x) * c1 + (axis.z * s);
            result.m[5] = (axis.y * axis.y) * c1 + c;
            result.m[6] = (axis.y * axis.z) * c1 - (axis.x * s);
            result.m[7] = 0.0;

            result.m[8] = (axis.z * axis.x) * c1 - (axis.y * s);
            result.m[9] = (axis.z * axis.y) * c1 + (axis.x * s);
            result.m[10] = (axis.z * axis.z) * c1 + c;
            result.m[11] = 0.0;

            result.m[15] = 1.0;

            return result;
        }

        public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix {
            var result = new Matrix();

            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, result);

            return result;
        }

        public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void {
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, this._tempQuaternion);

            this._tempQuaternion.toRotationMatrix(result);
        }

        public static Scaling(x: number, y: number, z: number): Matrix {
            var result = Matrix.Zero();

            Matrix.ScalingToRef(x, y, z, result);

            return result;
        }

        public static ScalingToRef(x: number, y: number, z: number, result: Matrix): void {
            result.m[0] = x;
            result.m[1] = 0;
            result.m[2] = 0;
            result.m[3] = 0;
            result.m[4] = 0;
            result.m[5] = y;
            result.m[6] = 0;
            result.m[7] = 0;
            result.m[8] = 0;
            result.m[9] = 0;
            result.m[10] = z;
            result.m[11] = 0;
            result.m[12] = 0;
            result.m[13] = 0;
            result.m[14] = 0;
            result.m[15] = 1.0;
        }

        public static Translation(x: number, y: number, z: number): Matrix {
            var result = Matrix.Identity();

            Matrix.TranslationToRef(x, y, z, result);

            return result;
        }

        public static TranslationToRef(x: number, y: number, z: number, result: Matrix): void {
            Matrix.FromValuesToRef(1.0, 0, 0, 0,
                0, 1.0, 0, 0,
                0, 0, 1.0, 0,
                x, y, z, 1.0, result);
        }

        public static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix {
            var result = Matrix.Zero();

            Matrix.LookAtLHToRef(eye, target, up, result);

            return result;
        }

        public static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void {
            // Z axis
            target.subtractToRef(eye, this._zAxis);
            this._zAxis.normalize();

            // X axis
            Vector3.CrossToRef(up, this._zAxis, this._xAxis);
            this._xAxis.normalize();

            // Y axis
            Vector3.CrossToRef(this._zAxis, this._xAxis, this._yAxis);
            this._yAxis.normalize();

            // Eye angles
            var ex = -Vector3.Dot(this._xAxis, eye);
            var ey = -Vector3.Dot(this._yAxis, eye);
            var ez = -Vector3.Dot(this._zAxis, eye);

            return Matrix.FromValuesToRef(this._xAxis.x, this._yAxis.x, this._zAxis.x, 0,
                this._xAxis.y, this._yAxis.y, this._zAxis.y, 0,
                this._xAxis.z, this._yAxis.z, this._zAxis.z, 0,
                ex, ey, ez, 1, result);
        }

        public static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix {
            var hw = 2.0 / width;
            var hh = 2.0 / height;
            var id = 1.0 / (zfar - znear);
            var nid = znear / (znear - zfar);

            return Matrix.FromValues(hw, 0, 0, 0,
                0, hh, 0, 0,
                0, 0, id, 0,
                0, 0, nid, 1);
        }

        public static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix);

            return matrix;
        }

        public static OrthoOffCenterLHToRef(left: number, right, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void {
            result.m[0] = 2.0 / (right - left);
            result.m[1] = result.m[2] = result.m[3] = 0;
            result.m[5] = 2.0 / (top - bottom);
            result.m[4] = result.m[6] = result.m[7] = 0;
            result.m[10] = -1.0 / (znear - zfar);
            result.m[8] = result.m[9] = result.m[11] = 0;
            result.m[12] = (left + right) / (left - right);
            result.m[13] = (top + bottom) / (bottom - top);
            result.m[14] = znear / (znear - zfar);
            result.m[15] = 1.0;
        }

        public static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            matrix.m[0] = (2.0 * znear) / width;
            matrix.m[1] = matrix.m[2] = matrix.m[3] = 0.0;
            matrix.m[5] = (2.0 * znear) / height;
            matrix.m[4] = matrix.m[6] = matrix.m[7] = 0.0;
            matrix.m[10] = -zfar / (znear - zfar);
            matrix.m[8] = matrix.m[9] = 0.0;
            matrix.m[11] = 1.0;
            matrix.m[12] = matrix.m[13] = matrix.m[15] = 0.0;
            matrix.m[14] = (znear * zfar) / (znear - zfar);

            return matrix;
        }

        public static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix);

            return matrix;
        }

        public static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix): void {
            var tan = 1.0 / (Math.tan(fov * 0.5));

            result.m[0] = tan / aspect;
            result.m[1] = result.m[2] = result.m[3] = 0.0;
            result.m[5] = tan;
            result.m[4] = result.m[6] = result.m[7] = 0.0;
            result.m[8] = result.m[9] = 0.0;
            result.m[10] = -zfar / (znear - zfar);
            result.m[11] = 1.0;
            result.m[12] = result.m[13] = result.m[15] = 0.0;
            result.m[14] = (znear * zfar) / (znear - zfar);
        }

        public static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;

            var viewportMatrix = Matrix.FromValues(cw / 2.0, 0, 0, 0,
                0, -ch / 2.0, 0, 0,
                0, 0, zmax - zmin, 0,
                cx + cw / 2.0, ch / 2.0 + cy, zmin, 1);

            return world.multiply(view).multiply(projection).multiply(viewportMatrix);
        }

        public static Transpose(matrix: Matrix): Matrix {
            var result = new Matrix();

            result.m[0] = matrix.m[0];
            result.m[1] = matrix.m[4];
            result.m[2] = matrix.m[8];
            result.m[3] = matrix.m[12];

            result.m[4] = matrix.m[1];
            result.m[5] = matrix.m[5];
            result.m[6] = matrix.m[9];
            result.m[7] = matrix.m[13];

            result.m[8] = matrix.m[2];
            result.m[9] = matrix.m[6];
            result.m[10] = matrix.m[10];
            result.m[11] = matrix.m[14];

            result.m[12] = matrix.m[3];
            result.m[13] = matrix.m[7];
            result.m[14] = matrix.m[11];
            result.m[15] = matrix.m[15];

            return result;
        }

        public static Reflection(plane: Plane): Matrix {
            var matrix = new Matrix();

            Matrix.ReflectionToRef(plane, matrix);

            return matrix;
        }

        public static ReflectionToRef(plane: Plane, result: Matrix): void {
            plane.normalize();
            var x = plane.normal.x;
            var y = plane.normal.y;
            var z = plane.normal.z;
            var temp = -2 * x;
            var temp2 = -2 * y;
            var temp3 = -2 * z;
            result.m[0] = (temp * x) + 1;
            result.m[1] = temp2 * x;
            result.m[2] = temp3 * x;
            result.m[3] = 0.0;
            result.m[4] = temp * y;
            result.m[5] = (temp2 * y) + 1;
            result.m[6] = temp3 * y;
            result.m[7] = 0.0;
            result.m[8] = temp * z;
            result.m[9] = temp2 * z;
            result.m[10] = (temp3 * z) + 1;
            result.m[11] = 0.0;
            result.m[12] = temp * plane.d;
            result.m[13] = temp2 * plane.d;
            result.m[14] = temp3 * plane.d;
            result.m[15] = 1.0;
        }
    }

    export class Plane {
        public normal: Vector3;
        public d: number;

        constructor(a: number, b: number, c: number, d: number) {
            this.normal = new Vector3(a, b, c);
            this.d = d;
        }

        public asArray(): number[] {
            return [this.normal.x, this.normal.y, this.normal.z, this.d];
        }

        // Methods
        public clone(): Plane {
            return new Plane(this.normal.x, this.normal.y, this.normal.z, this.d);
        }

        public normalize(): void {
            var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
            var magnitude = 0;

            if (norm != 0) {
                magnitude = 1.0 / norm;
            }

            this.normal.x *= magnitude;
            this.normal.y *= magnitude;
            this.normal.z *= magnitude;

            this.d *= magnitude;
        }

        public transform(transformation: Matrix): Plane {
            var transposedMatrix = BABYLON.Matrix.Transpose(transformation);
            var x = this.normal.x;
            var y = this.normal.y;
            var z = this.normal.z;
            var d = this.d;

            var normalX = (((x * transposedMatrix.m[0]) + (y * transposedMatrix.m[1])) + (z * transposedMatrix.m[2])) + (d * transposedMatrix.m[3]);
            var normalY = (((x * transposedMatrix.m[4]) + (y * transposedMatrix.m[5])) + (z * transposedMatrix.m[6])) + (d * transposedMatrix.m[7]);
            var normalZ = (((x * transposedMatrix.m[8]) + (y * transposedMatrix.m[9])) + (z * transposedMatrix.m[10])) + (d * transposedMatrix.m[11]);
            var finalD = (((x * transposedMatrix.m[12]) + (y * transposedMatrix.m[13])) + (z * transposedMatrix.m[14])) + (d * transposedMatrix.m[15]);

            return new BABYLON.Plane(normalX, normalY, normalZ, finalD);
        }


        public dotCoordinate(point): number {
            return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
        }

        public copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): void {
            var x1 = point2.x - point1.x;
            var y1 = point2.y - point1.y;
            var z1 = point2.z - point1.z;
            var x2 = point3.x - point1.x;
            var y2 = point3.y - point1.y;
            var z2 = point3.z - point1.z;
            var yz = (y1 * z2) - (z1 * y2);
            var xz = (z1 * x2) - (x1 * z2);
            var xy = (x1 * y2) - (y1 * x2);
            var pyth = (Math.sqrt((yz * yz) + (xz * xz) + (xy * xy)));
            var invPyth;

            if (pyth != 0) {
                invPyth = 1.0 / pyth;
            }
            else {
                invPyth = 0;
            }

            this.normal.x = yz * invPyth;
            this.normal.y = xz * invPyth;
            this.normal.z = xy * invPyth;
            this.d = -((this.normal.x * point1.x) + (this.normal.y * point1.y) + (this.normal.z * point1.z));
        }

        public isFrontFacingTo(direction: Vector3, epsilon: number): boolean {
            var dot = Vector3.Dot(this.normal, direction);

            return (dot <= epsilon);
        }

        public signedDistanceTo(point: Vector3): number {
            return Vector3.Dot(point, this.normal) + this.d;
        }

        // Statics
        static FromArray(array: number[]): Plane {
            return new BABYLON.Plane(array[0], array[1], array[2], array[3]);
        }

        static FromPoints(point1, point2, point3): Plane {
            var result = new BABYLON.Plane(0, 0, 0, 0);

            result.copyFromPoints(point1, point2, point3);

            return result;
        }

        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane {
            var result = new BABYLON.Plane(0, 0, 0, 0);
            normal.normalize();

            result.normal = normal;
            result.d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);

            return result;
        }

        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number {
            var d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);

            return Vector3.Dot(point, normal) + d;
        }
    }

    export class Viewport {
        constructor(public x: number, public y: number, public width: number, public height: number) {
        }

        public toGlobal(engine) {
            var width = engine.getRenderWidth();
            var height = engine.getRenderHeight();
            return new Viewport(this.x * width, this.y * height, this.width * width, this.height * height);
        }
    }

    export class Frustum {
        public static GetPlanes(transform: Matrix): Plane[] {
            var frustumPlanes = [];

            for (var index = 0; index < 6; index++) {
                frustumPlanes.push(new Plane(0, 0, 0, 0));
            }

            Frustum.GetPlanesToRef(transform, frustumPlanes);

            return frustumPlanes;
        }

        public static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void {
            // Near
            frustumPlanes[0].normal.x = transform.m[3] + transform.m[2];
            frustumPlanes[0].normal.y = transform.m[7] + transform.m[6];
            frustumPlanes[0].normal.z = transform.m[10] + transform.m[10];
            frustumPlanes[0].d = transform.m[15] + transform.m[14];
            frustumPlanes[0].normalize();

            // Far
            frustumPlanes[1].normal.x = transform.m[3] - transform.m[2];
            frustumPlanes[1].normal.y = transform.m[7] - transform.m[6];
            frustumPlanes[1].normal.z = transform.m[11] - transform.m[10];
            frustumPlanes[1].d = transform.m[15] - transform.m[14];
            frustumPlanes[1].normalize();

            // Left
            frustumPlanes[2].normal.x = transform.m[3] + transform.m[0];
            frustumPlanes[2].normal.y = transform.m[7] + transform.m[4];
            frustumPlanes[2].normal.z = transform.m[11] + transform.m[8];
            frustumPlanes[2].d = transform.m[15] + transform.m[12];
            frustumPlanes[2].normalize();

            // Right
            frustumPlanes[3].normal.x = transform.m[3] - transform.m[0];
            frustumPlanes[3].normal.y = transform.m[7] - transform.m[4];
            frustumPlanes[3].normal.z = transform.m[11] - transform.m[8];
            frustumPlanes[3].d = transform.m[15] - transform.m[12];
            frustumPlanes[3].normalize();

            // Top
            frustumPlanes[4].normal.x = transform.m[3] - transform.m[1];
            frustumPlanes[4].normal.y = transform.m[7] - transform.m[5];
            frustumPlanes[4].normal.z = transform.m[11] - transform.m[9];
            frustumPlanes[4].d = transform.m[15] - transform.m[13];
            frustumPlanes[4].normalize();

            // Bottom
            frustumPlanes[5].normal.x = transform.m[3] + transform.m[1];
            frustumPlanes[5].normal.y = transform.m[7] + transform.m[5];
            frustumPlanes[5].normal.z = transform.m[11] + transform.m[9];
            frustumPlanes[5].d = transform.m[15] + transform.m[13];
            frustumPlanes[5].normalize();
        }
    }

    export class Ray {
        private _edge1: Vector3;
        private _edge2: Vector3;
        private _pvec: Vector3;
        private _tvec: Vector3;
        private _qvec: Vector3;

        constructor(public origin: Vector3, public direction: Vector3) {
        }

        // Methods
        public intersectsBoxMinMax(minimum: Vector3, maximum: Vector3): boolean {
            var d = 0.0;
            var maxValue = Number.MAX_VALUE;

            if (Math.abs(this.direction.x) < 0.0000001) {
                if (this.origin.x < minimum.x || this.origin.x > maximum.x) {
                    return false;
                }
            }
            else {
                var inv = 1.0 / this.direction.x;
                var min = (minimum.x - this.origin.x) * inv;
                var max = (maximum.x - this.origin.x) * inv;

                if (min > max) {
                    var temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.y) < 0.0000001) {
                if (this.origin.y < minimum.y || this.origin.y > maximum.y) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.y;
                min = (minimum.y - this.origin.y) * inv;
                max = (maximum.y - this.origin.y) * inv;

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.z) < 0.0000001) {
                if (this.origin.z < minimum.z || this.origin.z > maximum.z) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.z;
                min = (minimum.z - this.origin.z) * inv;
                max = (maximum.z - this.origin.z) * inv;

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }
            return true;
        }

        public intersectsBox(box: BoundingBox): boolean {
            return this.intersectsBoxMinMax(box.minimum, box.maximum);
        }

        public intersectsSphere(sphere): boolean {
            var x = sphere.center.x - this.origin.x;
            var y = sphere.center.y - this.origin.y;
            var z = sphere.center.z - this.origin.z;
            var pyth = (x * x) + (y * y) + (z * z);
            var rr = sphere.radius * sphere.radius;

            if (pyth <= rr) {
                return true;
            }

            var dot = (x * this.direction.x) + (y * this.direction.y) + (z * this.direction.z);
            if (dot < 0.0) {
                return false;
            }

            var temp = pyth - (dot * dot);

            return temp <= rr;
        }

        public intersectsTriangle(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3): IntersectionInfo {
            if (!this._edge1) {
                this._edge1 = BABYLON.Vector3.Zero();
                this._edge2 = BABYLON.Vector3.Zero();
                this._pvec = BABYLON.Vector3.Zero();
                this._tvec = BABYLON.Vector3.Zero();
                this._qvec = BABYLON.Vector3.Zero();
            }

            vertex1.subtractToRef(vertex0, this._edge1);
            vertex2.subtractToRef(vertex0, this._edge2);
            BABYLON.Vector3.CrossToRef(this.direction, this._edge2, this._pvec);
            var det = Vector3.Dot(this._edge1, this._pvec);

            if (det === 0) {
                return null;
            }

            var invdet = 1 / det;

            this.origin.subtractToRef(vertex0, this._tvec);

            var bu = Vector3.Dot(this._tvec, this._pvec) * invdet;

            if (bu < 0 || bu > 1.0) {
                return null;
            }

            Vector3.CrossToRef(this._tvec, this._edge1, this._qvec);

            var bv = Vector3.Dot(this.direction, this._qvec) * invdet;

            if (bv < 0 || bu + bv > 1.0) {
                return null;
            }

            return new IntersectionInfo(bu, bv, Vector3.Dot(this._edge2, this._qvec) * invdet);
        }

        // Statics
        public static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray {
            var start = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 0), viewportWidth, viewportHeight, world, view, projection);
            var end = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 1), viewportWidth, viewportHeight, world, view, projection);

            var direction = end.subtract(start);
            direction.normalize();

            return new Ray(start, direction);
        }

        public static Transform(ray: Ray, matrix: Matrix): Ray {
            var newOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, matrix);
            var newDirection = BABYLON.Vector3.TransformNormal(ray.direction, matrix);

            return new Ray(newOrigin, newDirection);
        }
    }

    export enum Space {
        LOCAL = 0,
        WORLD = 1
    }

    export class Axis {
        public static X: Vector3 = new BABYLON.Vector3(1, 0, 0);
        public static Y: Vector3 = new BABYLON.Vector3(0, 1, 0);
        public static Z: Vector3 =new BABYLON.Vector3(0, 0, 1);
    };
}