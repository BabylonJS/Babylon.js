﻿module BABYLON {

    declare var SIMD;

    export const ToGammaSpace = 1 / 2.2;
    export const ToLinearSpace = 2.2;
    export const Epsilon = 0.001;


    export class MathTools {
        public static WithinEpsilon(a: number, b: number, epsilon: number = 1.401298E-45): boolean {
            var num = a - b;
            return -epsilon <= num && num <= epsilon;
        }

        public static ToHex(i: number): string {
            var str = i.toString(16);

            if (i <= 15) {
                return ("0" + str).toUpperCase();
            }

            return str.toUpperCase();
        }

        // Returns -1 when value is a negative number and
        // +1 when value is a positive number. 
        public static Sign(value: number): number {
            value = +value; // convert to a number

            if (value === 0 || isNaN(value))
                return value;

            return value > 0 ? 1 : -1;
        }

        public static Clamp(value: number, min = 0, max = 1): number {
            return Math.min(max, Math.max(min, value));
        }
    }


    export class Color3 {
        constructor(public r: number = 0, public g: number = 0, public b: number = 0) {
        }

        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
        }

        public getClassName(): string {
            return "Color3";
        }

        public getHashCode(): number {
            let hash = this.r || 0;
            hash = (hash * 397) ^ (this.g || 0);
            hash = (hash * 397) ^ (this.b || 0);
            return hash;
        }

        // Operators
        public toArray(array: number[], index?: number): Color3 {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;

            return this;
        }

        public toColor4(alpha = 1): Color4 {
            return new Color4(this.r, this.g, this.b, alpha);
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public toLuminance(): number {
            return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
        }

        public multiply(otherColor: Color3): Color3 {
            return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
        }

        public multiplyToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r * otherColor.r;
            result.g = this.g * otherColor.g;
            result.b = this.b * otherColor.b;

            return this;
        }

        public equals(otherColor: Color3): boolean {
            return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
        }

        public equalsFloats(r: number, g: number, b: number): boolean {
            return this.r === r && this.g === g && this.b === b;
        }

        public scale(scale: number): Color3 {
            return new Color3(this.r * scale, this.g * scale, this.b * scale);
        }

        public scaleToRef(scale: number, result: Color3): Color3 {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;

            return this;
        }

        public add(otherColor: Color3): Color3 {
            return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
        }

        public addToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r + otherColor.r;
            result.g = this.g + otherColor.g;
            result.b = this.b + otherColor.b;

            return this;
        }

        public subtract(otherColor: Color3): Color3 {
            return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
        }

        public subtractToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r - otherColor.r;
            result.g = this.g - otherColor.g;
            result.b = this.b - otherColor.b;

            return this;
        }

        public clone(): Color3 {
            return new Color3(this.r, this.g, this.b);
        }

        public copyFrom(source: Color3): Color3 {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;

            return this;
        }

        public copyFromFloats(r: number, g: number, b: number): Color3 {
            this.r = r;
            this.g = g;
            this.b = b;

            return this;
        }

        public toHexString(): string {
            var intR = (this.r * 255) | 0;
            var intG = (this.g * 255) | 0;
            var intB = (this.b * 255) | 0;

            return "#" + MathTools.ToHex(intR) + MathTools.ToHex(intG) + MathTools.ToHex(intB);
        }

        public toLinearSpace(): Color3 {
            var convertedColor = new Color3();
            this.toLinearSpaceToRef(convertedColor);
            return convertedColor;
        }

        public toLinearSpaceToRef(convertedColor: Color3): Color3 {
            convertedColor.r = Math.pow(this.r, ToLinearSpace);
            convertedColor.g = Math.pow(this.g, ToLinearSpace);
            convertedColor.b = Math.pow(this.b, ToLinearSpace);

            return this;
        }

        public toGammaSpace(): Color3 {
            var convertedColor = new Color3();
            this.toGammaSpaceToRef(convertedColor);
            return convertedColor;
        }

        public toGammaSpaceToRef(convertedColor: Color3): Color3 {
            convertedColor.r = Math.pow(this.r, ToGammaSpace);
            convertedColor.g = Math.pow(this.g, ToGammaSpace);
            convertedColor.b = Math.pow(this.b, ToGammaSpace);

            return this;
        }

        // Statics
        public static FromHexString(hex: string): Color3 {
            if (hex.substring(0, 1) !== "#" || hex.length !== 7) {
                //Tools.Warn("Color3.FromHexString must be called with a string like #FFFFFF");
                return new Color3(0, 0, 0);
            }

            var r = parseInt(hex.substring(1, 3), 16);
            var g = parseInt(hex.substring(3, 5), 16);
            var b = parseInt(hex.substring(5, 7), 16);

            return Color3.FromInts(r, g, b);
        }

        public static FromArray(array: number[], offset: number = 0): Color3 {
            return new Color3(array[offset], array[offset + 1], array[offset + 2]);
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
        public static Random(): Color3 { return new Color3(Math.random(), Math.random(), Math.random()); }
    }

    export class Color4 {
        constructor(public r: number, public g: number, public b: number, public a: number) {
        }

        // Operators
        public addInPlace(right): Color4 {
            this.r += right.r;
            this.g += right.g;
            this.b += right.b;
            this.a += right.a;

            return this;
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public toArray(array: number[], index?: number): Color4 {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            array[index + 3] = this.a;

            return this;
        }

        public add(right: Color4): Color4 {
            return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
        }

        public subtract(right: Color4): Color4 {
            return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
        }

        public subtractToRef(right: Color4, result: Color4): Color4 {
            result.r = this.r - right.r;
            result.g = this.g - right.g;
            result.b = this.b - right.b;
            result.a = this.a - right.a;

            return this;
        }

        public scale(scale: number): Color4 {
            return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
        }

        public scaleToRef(scale: number, result: Color4): Color4 {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
            result.a = this.a * scale;

            return this;
        }

        /**
          * Multipy an RGBA Color4 value by another and return a new Color4 object
          * @param color The Color4 (RGBA) value to multiply by
          * @returns A new Color4.
          */
        public multiply(color: Color4): Color4 {
            return new Color4(this.r * color.r, this.g * color.g, this.b * color.b, this.a * color.a);
        }

        /**
         * Multipy an RGBA Color4 value by another and push the result in a reference value
         * @param color The Color4 (RGBA) value to multiply by
         * @param result The Color4 (RGBA) to fill the result in 
         * @returns the result Color4.
         */
        public multiplyToRef(color: Color4, result: Color4): Color4 {
            result.r = this.r * color.r;
            result.g = this.g * color.g;
            result.b = this.b * color.b;
            result.a = this.a * color.a;

            return result;
        }

        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }

        public getClassName(): string {
            return "Color4";
        }

        public getHashCode(): number {
            let hash = this.r || 0;
            hash = (hash * 397) ^ (this.g || 0);
            hash = (hash * 397) ^ (this.b || 0);
            hash = (hash * 397) ^ (this.a || 0);
            return hash;
        }

        public clone(): Color4 {
            return new Color4(this.r, this.g, this.b, this.a);
        }

        public copyFrom(source: Color4): Color4 {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
            this.a = source.a;

            return this;
        }

        public toHexString(): string {
            var intR = (this.r * 255) | 0;
            var intG = (this.g * 255) | 0;
            var intB = (this.b * 255) | 0;
            var intA = (this.a * 255) | 0;

            return "#" + MathTools.ToHex(intR) + MathTools.ToHex(intG) + MathTools.ToHex(intB) + MathTools.ToHex(intA);
        }

        // Statics
        public static FromHexString(hex: string): Color4 {
            if (hex.substring(0, 1) !== "#" || hex.length !== 9) {
                //Tools.Warn("Color4.FromHexString must be called with a string like #FFFFFFFF");
                return new Color4(0, 0, 0, 0);
            }

            var r = parseInt(hex.substring(1, 3), 16);
            var g = parseInt(hex.substring(3, 5), 16);
            var b = parseInt(hex.substring(5, 7), 16);
            var a = parseInt(hex.substring(7, 9), 16);

            return Color4.FromInts(r, g, b, a);
        }

        public static Lerp(left: Color4, right: Color4, amount: number): Color4 {
            var result = new Color4(0, 0, 0, 0);

            Color4.LerpToRef(left, right, amount, result);

            return result;
        }

        public static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void {
            result.r = left.r + (right.r - left.r) * amount;
            result.g = left.g + (right.g - left.g) * amount;
            result.b = left.b + (right.b - left.b) * amount;
            result.a = left.a + (right.a - left.a) * amount;
        }

        public static FromArray(array: number[], offset: number = 0): Color4 {
            return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }

        public static FromInts(r: number, g: number, b: number, a: number): Color4 {
            return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
        }

        public static CheckColors4(colors: number[], count: number): number[] {
            // Check if color3 was used
            if (colors.length === count * 3) {
                var colors4 = [];
                for (var index = 0; index < colors.length; index += 3) {
                    var newIndex = (index / 3) * 4;
                    colors4[newIndex] = colors[index];
                    colors4[newIndex + 1] = colors[index + 1];
                    colors4[newIndex + 2] = colors[index + 2];
                    colors4[newIndex + 3] = 1.0;
                }

                return colors4;
            }

            return colors;
        }
    }

    export class Vector2 {
        constructor(public x: number, public y: number) {
        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + "}";
        }

        public getClassName(): string {
            return "Vector2";
        }

        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            return hash;
        }

        // Operators
        public toArray(array: number[] | Float32Array, index: number = 0): Vector2 {
            array[index] = this.x;
            array[index + 1] = this.y;

            return this;
        }

        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public copyFrom(source: Vector2): Vector2 {
            this.x = source.x;
            this.y = source.y;

            return this;
        }

        public copyFromFloats(x: number, y: number): Vector2 {
            this.x = x;
            this.y = y;

            return this;
        }

        public add(otherVector: Vector2): Vector2 {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        }

        public addToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;

            return this;
        }

        public addInPlace(otherVector: Vector2): Vector2 {
            this.x += otherVector.x;
            this.y += otherVector.y;

            return this;
        }

        public addVector3(otherVector: Vector3): Vector2 {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        }

        public subtract(otherVector: Vector2): Vector2 {
            return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
        }

        public subtractToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;

            return this;
        }

        public subtractInPlace(otherVector: Vector2): Vector2 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;

            return this;
        }

        public multiplyInPlace(otherVector: Vector2): Vector2 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;

            return this;
        }

        public multiply(otherVector: Vector2): Vector2 {
            return new Vector2(this.x * otherVector.x, this.y * otherVector.y);
        }

        public multiplyToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;

            return this;
        }

        public multiplyByFloats(x: number, y: number): Vector2 {
            return new Vector2(this.x * x, this.y * y);
        }

        public divide(otherVector: Vector2): Vector2 {
            return new Vector2(this.x / otherVector.x, this.y / otherVector.y);
        }

        public divideToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;

            return this;
        }

        public negate(): Vector2 {
            return new Vector2(-this.x, -this.y);
        }

        public scaleInPlace(scale: number): Vector2 {
            this.x *= scale;
            this.y *= scale;
            return this;
        }

        public scale(scale: number): Vector2 {
            return new Vector2(this.x * scale, this.y * scale);
        }

        public equals(otherVector: Vector2): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y;
        }

        public equalsWithEpsilon(otherVector: Vector2, epsilon: number = Epsilon): boolean {
            return otherVector && MathTools.WithinEpsilon(this.x, otherVector.x, epsilon) && MathTools.WithinEpsilon(this.y, otherVector.y, epsilon);
        }

        // Properties
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y);
        }

        // Methods
        public normalize(): Vector2 {
            var len = this.length();

            if (len === 0)
                return this;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;

            return this;
        }

        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }

        // Statics
        public static Zero(): Vector2 {
            return new Vector2(0, 0);
        }

        public static FromArray(array: number[] | Float32Array, offset: number = 0): Vector2 {
            return new Vector2(array[offset], array[offset + 1]);
        }

        public static FromArrayToRef(array: number[] | Float32Array, offset: number, result: Vector2): void {
            result.x = array[offset];
            result.y = array[offset + 1];
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
            let r = Vector2.Zero();
            Vector2.TransformToRef(vector, transformation, r);
            return r;
        }

        public static TransformToRef(vector: Vector2, transformation: Matrix, result: Vector2) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + transformation.m[13];

            result.x = x;
            result.y = y;
        }

        public static PointInTriangle(p: Vector2, p0: Vector2, p1: Vector2, p2: Vector2) {
            let a = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
            let sign = a < 0 ? -1 : 1;
            let s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
            let t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

            return s > 0 && t > 0 && (s + t) < 2 * a * sign;
        }

        public static Distance(value1: Vector2, value2: Vector2): number {
            return Math.sqrt(Vector2.DistanceSquared(value1, value2));
        }

        public static DistanceSquared(value1: Vector2, value2: Vector2): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;

            return (x * x) + (y * y);
        }

        public static Center(value1: Vector2, value2: Vector2): Vector2 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }

        public static DistanceOfPointFromSegment(p: Vector2, segA: Vector2, segB: Vector2): number {
            let l2 = Vector2.DistanceSquared(segA, segB);
            if (l2 === 0.0) {
                return Vector2.Distance(p, segA);
            }
            let v = segB.subtract(segA);
            let t = Math.max(0, Math.min(1, Vector2.Dot(p.subtract(segA), v) / l2));
            let proj = segA.add(v.multiplyByFloats(t, t));
            return Vector2.Distance(p, proj);
        }
    }

    export class Vector3 {

        constructor(public x: number, public y: number, public z: number) {
        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
        }

        public getClassName(): string {
            return "Vector3";
        }

        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            return hash;
        }

        // Operators
        public asArray(): number[] {
            var result: number[] = [];

            this.toArray(result, 0);

            return result;
        }

        public toArray(array: number[] | Float32Array, index: number = 0): Vector3 {
            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;

            return this;
        }

        public toQuaternion(): Quaternion {
            var result = new Quaternion(0, 0, 0, 1);

            var cosxPlusz = Math.cos((this.x + this.z) * 0.5);
            var sinxPlusz = Math.sin((this.x + this.z) * 0.5);
            var coszMinusx = Math.cos((this.z - this.x) * 0.5);
            var sinzMinusx = Math.sin((this.z - this.x) * 0.5);
            var cosy = Math.cos(this.y * 0.5);
            var siny = Math.sin(this.y * 0.5);

            result.x = coszMinusx * siny;
            result.y = -sinzMinusx * siny;
            result.z = sinxPlusz * cosy;
            result.w = cosxPlusz * cosy;

            return result;
        }

        public addInPlace(otherVector: Vector3): Vector3 {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;

            return this;
        }

        public add(otherVector: Vector3): Vector3 {
            return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
        }

        public addToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;

            return this;
        }

        public subtractInPlace(otherVector: Vector3): Vector3 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;

            return this;
        }

        public subtract(otherVector: Vector3): Vector3 {
            return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
        }

        public subtractToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;

            return this;
        }

        public subtractFromFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x - x, this.y - y, this.z - z);
        }

        public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3 {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;

            return this;
        }

        public negate(): Vector3 {
            return new Vector3(-this.x, -this.y, -this.z);
        }

        public scaleInPlace(scale: number): Vector3 {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
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

        public equalsWithEpsilon(otherVector: Vector3, epsilon: number = Epsilon): boolean {
            return otherVector && MathTools.WithinEpsilon(this.x, otherVector.x, epsilon) && MathTools.WithinEpsilon(this.y, otherVector.y, epsilon) && MathTools.WithinEpsilon(this.z, otherVector.z, epsilon);
        }

        public equalsToFloats(x: number, y: number, z: number): boolean {
            return this.x === x && this.y === y && this.z === z;
        }

        public multiplyInPlace(otherVector: Vector3): Vector3 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;

            return this;
        }

        public multiply(otherVector: Vector3): Vector3 {
            return new Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
        }

        public multiplyToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;

            return this;
        }

        public multiplyByFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x * x, this.y * y, this.z * z);
        }

        public divide(otherVector: Vector3): Vector3 {
            return new Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
        }

        public divideToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;

            return this;
        }

        public MinimizeInPlace(other: Vector3): Vector3 {
            if (other.x < this.x) this.x = other.x;
            if (other.y < this.y) this.y = other.y;
            if (other.z < this.z) this.z = other.z;

            return this;
        }

        public MaximizeInPlace(other: Vector3): Vector3 {
            if (other.x > this.x) this.x = other.x;
            if (other.y > this.y) this.y = other.y;
            if (other.z > this.z) this.z = other.z;

            return this;
        }

        // Properties
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y + this.z * this.z);
        }

        // Methods
        public normalize(): Vector3 {
            var len = this.length();

            if (len === 0 || len === 1.0)
                return this;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;
            this.z *= num;

            return this;
        }

        public clone(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }

        public copyFrom(source: Vector3): Vector3 {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;

            return this;
        }

        public copyFromFloats(x: number, y: number, z: number): Vector3 {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        }

        // Statics
        public static GetClipFactor(vector0: Vector3, vector1: Vector3, axis: Vector3, size) {
            var d0 = Vector3.Dot(vector0, axis) - size;
            var d1 = Vector3.Dot(vector1, axis) - size;

            var s = d0 / (d0 - d1);

            return s;
        }

        public static FromArray(array: number[] | Float32Array, offset?: number): Vector3 {
            if (!offset) {
                offset = 0;
            }

            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        }

        public static FromFloatArray(array: Float32Array, offset?: number): Vector3 {
            if (!offset) {
                offset = 0;
            }

            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        }

        public static FromArrayToRef(array: number[] | Float32Array, offset: number, result: Vector3): void {
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

        public static Forward(): Vector3 {
            return new Vector3(0, 0, 1.0);
        }

        public static Right(): Vector3 {
            return new Vector3(1.0, 0, 0);
        }

        public static Left(): Vector3 {
            return new Vector3(-1.0, 0, 0);
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
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
            result.x = x;
            result.y = y;
            result.z = z;
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
            var result = new Vector3(0, 0, 0);

            Vector3.LerpToRef(start, end, amount, result);

            return result;
        }

        public static LerpToRef(start: Vector3, end: Vector3, amount: number, result: Vector3): void {
            result.x = start.x + ((end.x - start.x) * amount);
            result.y = start.y + ((end.y - start.y) * amount);
            result.z = start.z + ((end.z - start.z) * amount);
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
            Tmp.Vector3[0].x = left.y * right.z - left.z * right.y;
            Tmp.Vector3[0].y = left.z * right.x - left.x * right.z;
            Tmp.Vector3[0].z = left.x * right.y - left.y * right.x;
            result.copyFrom(Tmp.Vector3[0]);
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

        private static _viewportMatrixCache: Matrix;
        private static _matrixCache: Matrix;
        public static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3 {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;

            var viewportMatrix = Vector3._viewportMatrixCache ? Vector3._viewportMatrixCache : (Vector3._viewportMatrixCache = new Matrix());

            Matrix.FromValuesToRef(
                cw / 2.0, 0, 0, 0,
                0, -ch / 2.0, 0, 0,
                0, 0, 1, 0,
                cx + cw / 2.0, ch / 2.0 + cy, 0, 1, viewportMatrix);

            var matrix = Vector3._matrixCache ? Vector3._matrixCache : (Vector3._matrixCache = new Matrix());
            world.multiplyToRef(transform, matrix);
            matrix.multiplyToRef(viewportMatrix, matrix);

            return Vector3.TransformCoordinates(vector, matrix);
        }

        public static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3 {
            var matrix = Vector3._matrixCache ? Vector3._matrixCache : (Vector3._matrixCache = new Matrix());
            world.multiplyToRef(transform, matrix);
            matrix.invert();
            source.x = source.x / viewportWidth * 2 - 1;
            source.y = -(source.y / viewportHeight * 2 - 1);
            var vector = Vector3.TransformCoordinates(source, matrix);
            var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];

            if (MathTools.WithinEpsilon(num, 1.0)) {
                vector = vector.scale(1.0 / num);
            }

            return vector;
        }

        public static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3 {
            var matrix = Vector3._matrixCache ? Vector3._matrixCache : (Vector3._matrixCache = new Matrix());
            world.multiplyToRef(view, matrix)
            matrix.multiplyToRef(projection, matrix);
            matrix.invert();
            var screenSource = new Vector3(source.x / viewportWidth * 2 - 1, -(source.y / viewportHeight * 2 - 1), source.z);
            var vector = Vector3.TransformCoordinates(screenSource, matrix);
            var num = screenSource.x * matrix.m[3] + screenSource.y * matrix.m[7] + screenSource.z * matrix.m[11] + matrix.m[15];

            if (MathTools.WithinEpsilon(num, 1.0)) {
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

        /**
         * Given three orthogonal normalized left-handed oriented Vector3 axis in space (target system),
         * RotationFromAxis() returns the rotation Euler angles (ex : rotation.x, rotation.y, rotation.z) to apply
         * to something in order to rotate it from its local system to the given target system.
         */
        public static RotationFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3): Vector3 {
            var rotation = Vector3.Zero();
            Vector3.RotationFromAxisToRef(axis1, axis2, axis3, rotation);
            return rotation;
        }

        /**
         * The same than RotationFromAxis but updates the passed ref Vector3 parameter.
         */
        public static RotationFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Vector3): void {
            var u = axis1.normalize();
            var w = axis3.normalize();

            // world axis
            var X = Axis.X;
            var Y = Axis.Y;

            // equation unknowns and vars
            var yaw = 0.0;
            var pitch = 0.0;
            var roll = 0.0;
            var x = 0.0;
            var y = 0.0;
            var z = 0.0;
            var t = 0.0;
            var sign = -1.0;
            var nbRevert = 0;
            var cross: Vector3 = Tmp.Vector3[0];
            var dot = 0.0;

            // step 1  : rotation around w
            // Rv3(u) = u1, and u1 belongs to plane xOz
            // Rv3(w) = w1 = w invariant
            var u1: Vector3 = Tmp.Vector3[1];
            if (MathTools.WithinEpsilon(w.z, 0, Epsilon)) {
                z = 1.0;
            }
            else if (MathTools.WithinEpsilon(w.x, 0, Epsilon)) {
                x = 1.0;
            }
            else {
                t = w.z / w.x;
                x = - t * Math.sqrt(1 / (1 + t * t));
                z = Math.sqrt(1 / (1 + t * t));
            }

            u1.x = x;
            u1.y = y;
            u1.z = z;
            u1.normalize();
            Vector3.CrossToRef(u, u1, cross);  // returns same direction as w (=local z) if positive angle : cross(source, image)
            cross.normalize();
            if (Vector3.Dot(w, cross) < 0) {
                sign = 1.0;
            }

            dot = Vector3.Dot(u, u1);
            dot = (Math.min(1.0, Math.max(-1.0, dot))); // to force dot to be in the range [-1, 1]
            roll = Math.acos(dot) * sign;

            if (Vector3.Dot(u1, X) < 0) { // checks X orientation
                roll = Math.PI + roll;
                u1 = u1.scaleInPlace(-1);
                nbRevert++;
            }

            // step 2 : rotate around u1
            // Ru1(w1) = Ru1(w) = w2, and w2 belongs to plane xOz
            // u1 is yet in xOz and invariant by Ru1, so after this step u1 and w2 will be in xOz
            var w2: Vector3 = Tmp.Vector3[2];
            var v2: Vector3 = Tmp.Vector3[3];
            x = 0.0;
            y = 0.0;
            z = 0.0;
            sign = -1.0;
            if (MathTools.WithinEpsilon(w.z, 0, Epsilon)) {
                x = 1.0;
            }
            else {
                t = u1.z / u1.x;
                x = - t * Math.sqrt(1 / (1 + t * t));
                z = Math.sqrt(1 / (1 + t * t));
            }

            w2.x = x;
            w2.y = y;
            w2.z = z;
            w2.normalize();
            Vector3.CrossToRef(w2, u1, v2);   // v2 image of v1 through rotation around u1
            v2.normalize();
            Vector3.CrossToRef(w, w2, cross); // returns same direction as u1 (=local x) if positive angle : cross(source, image)
            cross.normalize();
            if (Vector3.Dot(u1, cross) < 0) {
                sign = 1.0;
            }

            dot = Vector3.Dot(w, w2);
            dot = (Math.min(1.0, Math.max(-1.0, dot))); // to force dot to be in the range [-1, 1]
            pitch = Math.acos(dot) * sign;
            if (Vector3.Dot(v2, Y) < 0) { // checks for Y orientation
                pitch = Math.PI + pitch;
                nbRevert++;
            }

            // step 3 : rotate around v2
            // Rv2(u1) = X, same as Rv2(w2) = Z, with X=(1,0,0) and Z=(0,0,1)
            sign = -1.0;
            Vector3.CrossToRef(X, u1, cross); // returns same direction as Y if positive angle : cross(source, image)
            cross.normalize();
            if (Vector3.Dot(cross, Y) < 0) {
                sign = 1.0;
            }
            dot = Vector3.Dot(u1, X);
            dot = (Math.min(1.0, Math.max(-1.0, dot))); // to force dot to be in the range [-1, 1]
            yaw = - Math.acos(dot) * sign;         // negative : plane zOx oriented clockwise
            if (dot < 0 && nbRevert < 2) {
                yaw = Math.PI + yaw;
            }

            ref.x = pitch;
            ref.y = yaw;
            ref.z = roll;
        }
    }

    //Vector4 class created for EulerAngle class conversion to Quaternion
    export class Vector4 {

        constructor(public x: number, public y: number, public z: number, public w: number) { }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        }

        public getClassName(): string {
            return "Vector4";
        }

        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            hash = (hash * 397) ^ (this.w || 0);
            return hash;
        }

        // Operators
        public asArray(): number[] {
            var result = [];

            this.toArray(result, 0);

            return result;
        }

        public toArray(array: number[], index?: number): Vector4 {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
            array[index + 3] = this.w;

            return this;
        }

        public addInPlace(otherVector: Vector4): Vector4 {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
            this.w += otherVector.w;

            return this;
        }

        public add(otherVector: Vector4): Vector4 {
            return new Vector4(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z, this.w + otherVector.w);
        }

        public addToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
            result.w = this.w + otherVector.w;

            return this;
        }

        public subtractInPlace(otherVector: Vector4): Vector4 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
            this.w -= otherVector.w;

            return this;
        }

        public subtract(otherVector: Vector4): Vector4 {
            return new Vector4(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z, this.w - otherVector.w);
        }

        public subtractToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
            result.w = this.w - otherVector.w;

            return this;
        }

        public subtractFromFloats(x: number, y: number, z: number, w: number): Vector4 {
            return new Vector4(this.x - x, this.y - y, this.z - z, this.w - w);
        }

        public subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): Vector4 {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
            result.w = this.w - w;

            return this;
        }

        public negate(): Vector4 {
            return new Vector4(-this.x, -this.y, -this.z, -this.w);
        }

        public scaleInPlace(scale: number): Vector4 {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            this.w *= scale;
            return this;
        }

        public scale(scale: number): Vector4 {
            return new Vector4(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
        }

        public scaleToRef(scale: number, result: Vector4) {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
            result.w = this.w * scale;
        }

        public equals(otherVector: Vector4): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z && this.w === otherVector.w;
        }

        public equalsWithEpsilon(otherVector: Vector4, epsilon: number = Epsilon): boolean {
            return otherVector
                && MathTools.WithinEpsilon(this.x, otherVector.x, epsilon)
                && MathTools.WithinEpsilon(this.y, otherVector.y, epsilon)
                && MathTools.WithinEpsilon(this.z, otherVector.z, epsilon)
                && MathTools.WithinEpsilon(this.w, otherVector.w, epsilon);
        }

        public equalsToFloats(x: number, y: number, z: number, w: number): boolean {
            return this.x === x && this.y === y && this.z === z && this.w === w;
        }

        public multiplyInPlace(otherVector: Vector4): Vector4 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
            this.w *= otherVector.w;

            return this;
        }

        public multiply(otherVector: Vector4): Vector4 {
            return new Vector4(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z, this.w * otherVector.w);
        }

        public multiplyToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
            result.w = this.w * otherVector.w;

            return this;
        }

        public multiplyByFloats(x: number, y: number, z: number, w: number): Vector4 {
            return new Vector4(this.x * x, this.y * y, this.z * z, this.w * w);
        }

        public divide(otherVector: Vector4): Vector4 {
            return new Vector4(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z, this.w / otherVector.w);
        }

        public divideToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
            result.w = this.w / otherVector.w;

            return this;
        }

        public MinimizeInPlace(other: Vector4): Vector4 {
            if (other.x < this.x) this.x = other.x;
            if (other.y < this.y) this.y = other.y;
            if (other.z < this.z) this.z = other.z;
            if (other.w < this.w) this.w = other.w;

            return this;
        }

        public MaximizeInPlace(other: Vector4): Vector4 {
            if (other.x > this.x) this.x = other.x;
            if (other.y > this.y) this.y = other.y;
            if (other.z > this.z) this.z = other.z;
            if (other.w > this.w) this.w = other.w;

            return this;
        }

        // Properties
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        // Methods
        public normalize(): Vector4 {
            var len = this.length();

            if (len === 0)
                return this;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;
            this.z *= num;
            this.w *= num;

            return this;
        }

        public toVector3(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }

        public clone(): Vector4 {
            return new Vector4(this.x, this.y, this.z, this.w);
        }

        public copyFrom(source: Vector4): Vector4 {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            this.w = source.w;

            return this;
        }

        public copyFromFloats(x: number, y: number, z: number, w: number): Vector4 {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        // Statics
        public static FromArray(array: number[], offset?: number): Vector4 {
            if (!offset) {
                offset = 0;
            }

            return new Vector4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }

        public static FromArrayToRef(array: number[], offset: number, result: Vector4): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
            result.w = array[offset + 3];
        }

        public static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
            result.w = array[offset + 3];
        }

        public static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void {
            result.x = x;
            result.y = y;
            result.z = z;
            result.w = w;
        }

        public static Zero(): Vector4 {
            return new Vector4(0, 0, 0, 0);
        }

        public static Normalize(vector: Vector4): Vector4 {
            var result = Vector4.Zero();
            Vector4.NormalizeToRef(vector, result);
            return result;
        }

        public static NormalizeToRef(vector: Vector4, result: Vector4): void {
            result.copyFrom(vector);
            result.normalize();
        }

        public static Minimize(left: Vector4, right: Vector4): Vector4 {
            var min = left.clone();
            min.MinimizeInPlace(right);
            return min;
        }

        public static Maximize(left: Vector4, right: Vector4): Vector4 {
            var max = left.clone();
            max.MaximizeInPlace(right);
            return max;
        }

        public static Distance(value1: Vector4, value2: Vector4): number {
            return Math.sqrt(Vector4.DistanceSquared(value1, value2));
        }

        public static DistanceSquared(value1: Vector4, value2: Vector4): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;
            var w = value1.w - value2.w;

            return (x * x) + (y * y) + (z * z) + (w * w);
        }

        public static Center(value1: Vector4, value2: Vector4): Vector4 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }
    }

    export interface ISize {
        width: number;
        height: number;
    }

    export class Size implements ISize {
        width: number;
        height: number;

        public constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
        }

        public toString(): string {
            return `{W: ${this.width}, H: ${this.height}}`;
        }

        public getClassName(): string {
            return "Size";
        }

        public getHashCode(): number {
            let hash = this.width || 0;
            hash = (hash * 397) ^ (this.height || 0);
            return hash;
        }

        public copyFrom(src: Size) {
            this.width = src.width;
            this.height = src.height;
        }

        public copyFromFloats(width: number, height: number) {
            this.width = width;
            this.height = height;
        }

        public multiplyByFloats(w: number, h: number): Size {
            return new Size(this.width * w, this.height * h);
        }

        public clone(): Size {
            return new Size(this.width, this.height);
        }

        public equals(other: Size): boolean {
            if (!other) {
                return false;
            }

            return (this.width === other.width) && (this.height === other.height);
        }

        public get surface(): number {
            return this.width * this.height;
        }

        public static Zero(): Size {
            return new Size(0, 0);
        }

        public add(otherSize: Size): Size {
            let r = new Size(this.width + otherSize.width, this.height + otherSize.height);
            return r;
        }

        public substract(otherSize: Size): Size {
            let r = new Size(this.width - otherSize.width, this.height - otherSize.height);
            return r;
        }

        public static Lerp(start: Size, end: Size, amount: number): Size {
            var w = start.width + ((end.width - start.width) * amount);
            var h = start.height + ((end.height - start.height) * amount);

            return new Size(w, h);
        }

    }


    export class Quaternion {
        constructor(public x: number = 0, public y: number = 0, public z: number = 0, public w: number = 1) {
        }

        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        }

        public getClassName(): string {
            return "Quaternion";
        }

        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            hash = (hash * 397) ^ (this.w || 0);
            return hash;
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

        public copyFrom(other: Quaternion): Quaternion {
            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;

            return this;
        }

        public copyFromFloats(x: number, y: number, z: number, w: number): Quaternion {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
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

        public multiplyToRef(q1: Quaternion, result: Quaternion): Quaternion {
            var x = this.x * q1.w + this.y * q1.z - this.z * q1.y + this.w * q1.x;
            var y = -this.x * q1.z + this.y * q1.w + this.z * q1.x + this.w * q1.y;
            var z = this.x * q1.y - this.y * q1.x + this.z * q1.w + this.w * q1.z;
            var w = -this.x * q1.x - this.y * q1.y - this.z * q1.z + this.w * q1.w;
            result.copyFromFloats(x, y, z, w);

            return this;
        }

        public multiplyInPlace(q1: Quaternion): Quaternion {
            this.multiplyToRef(q1, this);

            return this;
        }

        public conjugateToRef(ref: Quaternion): Quaternion {
            ref.copyFromFloats(-this.x, -this.y, -this.z, this.w);
            return this;
        }

        public conjugateInPlace(): Quaternion {
            this.x *= -1;
            this.y *= -1;
            this.z *= -1;
            return this;
        }

        public conjugate(): Quaternion {
            var result = new Quaternion(-this.x, -this.y, -this.z, this.w);
            return result;
        }

        public length(): number {
            return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
        }

        public normalize(): Quaternion {
            var length = 1.0 / this.length();
            this.x *= length;
            this.y *= length;
            this.z *= length;
            this.w *= length;

            return this;
        }

        public toEulerAngles(order = "YZX"): Vector3 {
            var result = Vector3.Zero();

            this.toEulerAnglesToRef(result, order);

            return result;
        }

        public toEulerAnglesToRef(result: Vector3, order = "YZX"): Quaternion {
            
            var qz = this.z;
            var qx = this.x;
            var qy = this.y;
            var qw = this.w;

            var sqw = qw * qw;
            var sqz = qz * qz;
            var sqx = qx * qx;
            var sqy = qy * qy;

            var zAxisY = qy*qz - qx*qw;
            var limit = .4999999;

            if(zAxisY < -limit){
                result.y = 2 * Math.atan2(qy,qw);
                result.x = Math.PI/2;
                result.z = 0;
            }else if(zAxisY > limit){
                result.y = 2 * Math.atan2(qy,qw);
                result.x = -Math.PI/2;
                result.z = 0;
            }else{
                result.z = Math.atan2(2.0 * (qx * qy + qz * qw), (-sqz - sqx + sqy + sqw));
                result.x = Math.asin(-2.0 * (qz * qy - qx * qw));
                result.y = Math.atan2(2.0 * (qz * qx + qy * qw), (sqz - sqx - sqy + sqw));
            }

            return this;
            
        }

        public toRotationMatrix(result: Matrix): Quaternion {
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

            return this;
        }

        public fromRotationMatrix(matrix: Matrix): Quaternion {
            Quaternion.FromRotationMatrixToRef(matrix, this);
            return this;
        }

        // Statics

        public static FromRotationMatrix(matrix: Matrix): Quaternion {
            var result = new Quaternion();
            Quaternion.FromRotationMatrixToRef(matrix, result);
            return result;
        }

        public static FromRotationMatrixToRef(matrix: Matrix, result: Quaternion): void {
            var data = matrix.m;
            var m11 = data[0], m12 = data[4], m13 = data[8];
            var m21 = data[1], m22 = data[5], m23 = data[9];
            var m31 = data[2], m32 = data[6], m33 = data[10];
            var trace = m11 + m22 + m33;
            var s;

            if (trace > 0) {

                s = 0.5 / Math.sqrt(trace + 1.0);

                result.w = 0.25 / s;
                result.x = (m32 - m23) * s;
                result.y = (m13 - m31) * s;
                result.z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {

                s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

                result.w = (m32 - m23) / s;
                result.x = 0.25 * s;
                result.y = (m12 + m21) / s;
                result.z = (m13 + m31) / s;
            } else if (m22 > m33) {

                s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

                result.w = (m13 - m31) / s;
                result.x = (m12 + m21) / s;
                result.y = 0.25 * s;
                result.z = (m23 + m32) / s;
            } else {

                s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

                result.w = (m21 - m12) / s;
                result.x = (m13 + m31) / s;
                result.y = (m23 + m32) / s;
                result.z = 0.25 * s;
            }
        }

        public static Inverse(q: Quaternion): Quaternion {
            return new Quaternion(-q.x, -q.y, -q.z, q.w);
        }

        public static Identity(): Quaternion {
            return new Quaternion(0, 0, 0, 1);
        }

        public static RotationAxis(axis: Vector3, angle: number): Quaternion {
            return Quaternion.RotationAxisToRef(axis, angle, new Quaternion());
        }

        public static RotationAxisToRef(axis: Vector3, angle: number, result: Quaternion): Quaternion {
            var sin = Math.sin(angle / 2);

            axis.normalize();

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
            var q = new Quaternion();
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, q);
            return q;
        }

        public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void {
            // Produces a quaternion from Euler angles in the z-y-x orientation (Tait-Bryan angles)
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

        public static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion {
            var result = new Quaternion();
            Quaternion.RotationAlphaBetaGammaToRef(alpha, beta, gamma, result);
            return result;
        }

        public static RotationAlphaBetaGammaToRef(alpha: number, beta: number, gamma: number, result: Quaternion): void {
            // Produces a quaternion from Euler angles in the z-x-z orientation
            var halfGammaPlusAlpha = (gamma + alpha) * 0.5;
            var halfGammaMinusAlpha = (gamma - alpha) * 0.5;
            var halfBeta = beta * 0.5;

            result.x = Math.cos(halfGammaMinusAlpha) * Math.sin(halfBeta);
            result.y = Math.sin(halfGammaMinusAlpha) * Math.sin(halfBeta);
            result.z = Math.sin(halfGammaPlusAlpha) * Math.cos(halfBeta);
            result.w = Math.cos(halfGammaPlusAlpha) * Math.cos(halfBeta);
        }

        public static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion {
            
            var result = Quaternion.Identity();

            Quaternion.SlerpToRef(left, right, amount, result);

            return result;

        }

        public static SlerpToRef(left: Quaternion, right: Quaternion, amount: number, result:Quaternion): void {
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

            result.x = (num3 * left.x) + (num2 * right.x);
            result.y = (num3 * left.y) + (num2 * right.y);
            result.z = (num3 * left.z) + (num2 * right.z);
            result.w = (num3 * left.w) + (num2 * right.w);

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
            if (this.m[0] !== 1.0 || this.m[5] !== 1.0 || this.m[10] !== 1.0 || this.m[15] !== 1.0)
                return false;

            if (this.m[1] !== 0.0 || this.m[2] !== 0.0 || this.m[3] !== 0.0 ||
                this.m[4] !== 0.0 || this.m[6] !== 0.0 || this.m[7] !== 0.0 ||
                this.m[8] !== 0.0 || this.m[9] !== 0.0 || this.m[11] !== 0.0 ||
                this.m[12] !== 0.0 || this.m[13] !== 0.0 || this.m[14] !== 0.0)
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

        public invert(): Matrix {
            this.invertToRef(this);

            return this;
        }

        public reset(): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] = 0;
            }

            return this;
        }

        public add(other: Matrix): Matrix {
            var result = new Matrix();

            this.addToRef(other, result);

            return result;
        }

        public addToRef(other: Matrix, result: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                result.m[index] = this.m[index] + other.m[index];
            }

            return this;
        }

        public addToSelf(other: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] += other.m[index];
            }

            return this;
        }

        public invertToRef(other: Matrix): Matrix {
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

            return this;
        }

        public setTranslation(vector3: Vector3): Matrix {
            this.m[12] = vector3.x;
            this.m[13] = vector3.y;
            this.m[14] = vector3.z;

            return this;
        }

        public getTranslation(): Vector3 {
            return new Vector3(this.m[12], this.m[13], this.m[14]);
        }

        public multiply(other: Matrix): Matrix {
            var result = new Matrix();

            this.multiplyToRef(other, result);

            return result;
        }

        public copyFrom(other: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] = other.m[index];
            }

            return this;
        }

        public copyToArray(array: Float32Array, offset: number = 0): Matrix {
            for (var index = 0; index < 16; index++) {
                array[offset + index] = this.m[index];
            }

            return this;
        }

        public multiplyToRef(other: Matrix, result: Matrix): Matrix {
            this.multiplyToArray(other, result.m, 0);

            return this;
        }

        public multiplyToArray(other: Matrix, result: Float32Array, offset: number): Matrix {
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

            return this;
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

        public getClassName(): string {
            return "Matrix";
        }

        public getHashCode(): number {
            let hash = this.m[0] || 0;
            for (let i = 1; i < 16; i++) {
                hash = (hash * 397) ^ (this.m[i] || 0);
            }
            return hash;
        }

        public decompose(scale: Vector3, rotation: Quaternion, translation: Vector3): boolean {
            translation.x = this.m[12];
            translation.y = this.m[13];
            translation.z = this.m[14];

            var xs = MathTools.Sign(this.m[0] * this.m[1] * this.m[2] * this.m[3]) < 0 ? -1 : 1;
            var ys = MathTools.Sign(this.m[4] * this.m[5] * this.m[6] * this.m[7]) < 0 ? -1 : 1;
            var zs = MathTools.Sign(this.m[8] * this.m[9] * this.m[10] * this.m[11]) < 0 ? -1 : 1;

            scale.x = xs * Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1] + this.m[2] * this.m[2]);
            scale.y = ys * Math.sqrt(this.m[4] * this.m[4] + this.m[5] * this.m[5] + this.m[6] * this.m[6]);
            scale.z = zs * Math.sqrt(this.m[8] * this.m[8] + this.m[9] * this.m[9] + this.m[10] * this.m[10]);

            if (scale.x === 0 || scale.y === 0 || scale.z === 0) {
                rotation.x = 0;
                rotation.y = 0;
                rotation.z = 0;
                rotation.w = 1;
                return false;
            }

            Matrix.FromValuesToRef(
                this.m[0] / scale.x, this.m[1] / scale.x, this.m[2] / scale.x, 0,
                this.m[4] / scale.y, this.m[5] / scale.y, this.m[6] / scale.y, 0,
                this.m[8] / scale.z, this.m[9] / scale.z, this.m[10] / scale.z, 0,
                0, 0, 0, 1, Tmp.Matrix[0]);

            Quaternion.FromRotationMatrixToRef(Tmp.Matrix[0], rotation);

            return true;
        }

        public getRotationMatrix(): Matrix{

            var result = Matrix.Identity();

            this.getRotationMatrixToRef(result);

            return result;

        }

        public getRotationMatrixToRef(result:Matrix): void{

            var m = this.m;

            var xs = m[0] * m[1] * m[2] * m[3] < 0 ? -1 : 1;
            var ys = m[4] * m[5] * m[6] * m[7] < 0 ? -1 : 1;
            var zs = m[8] * m[9] * m[10] * m[11] < 0 ? -1 : 1;

            var sx = xs * Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
            var sy = ys * Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
            var sz = zs * Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);

            Matrix.FromValuesToRef(
                m[0] / sx, m[1] / sx, m[2] / sx, 0,
                m[4] / sy, m[5] / sy, m[6] / sy, 0,
                m[8] / sz, m[9] / sz, m[10] / sz, 0,
                0, 0, 0, 1, result);

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

        public static FromFloat32ArrayToRefScaled(array: Float32Array, offset: number, scale: number, result: Matrix) {
            for (var index = 0; index < 16; index++) {
                result.m[index] = array[index + offset] * scale;
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

        public getRow(index: number): Vector4 {
            if (index < 0 || index > 3) {
                return null;
            }

            var i = index * 4;
            return new Vector4(this.m[i + 0], this.m[i + 1], this.m[i + 2], this.m[i + 3]);
        }

        public setRow(index: number, row: Vector4): Matrix {
            if (index < 0 || index > 3) {
                return this;
            }

            var i = index * 4;
            this.m[i + 0] = row.x;
            this.m[i + 1] = row.y;
            this.m[i + 2] = row.z;
            this.m[i + 3] = row.w;

            return this;
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

        public static Compose(scale: Vector3, rotation: Quaternion, translation: Vector3): Matrix {
            var result = Matrix.FromValues(scale.x, 0, 0, 0,
                0, scale.y, 0, 0,
                0, 0, scale.z, 0,
                0, 0, 0, 1);

            var rotationMatrix = Matrix.Identity();
            rotation.toRotationMatrix(rotationMatrix);
            result = result.multiply(rotationMatrix);

            result.setTranslation(translation);

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

        public static Invert(source: Matrix): Matrix {
            var result = new Matrix();

            source.invertToRef(result);

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
            var result = Matrix.Zero();
            Matrix.RotationAxisToRef(axis, angle, result);
            return result;
        }

        public static RotationAxisToRef(axis: Vector3, angle: number, result: Matrix): void {
            var s = Math.sin(-angle);
            var c = Math.cos(-angle);
            var c1 = 1 - c;

            axis.normalize();

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

        public static Lerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix {
            var result = Matrix.Zero();

            for (var index = 0; index < 16; index++) {
                result.m[index] = startValue.m[index] * (1.0 - gradient) + endValue.m[index] * gradient;
            }

            return result;
        }

        public static DecomposeLerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix {
            var startScale = new Vector3(0, 0, 0);
            var startRotation = new Quaternion();
            var startTranslation = new Vector3(0, 0, 0);
            startValue.decompose(startScale, startRotation, startTranslation);

            var endScale = new Vector3(0, 0, 0);
            var endRotation = new Quaternion();
            var endTranslation = new Vector3(0, 0, 0);
            endValue.decompose(endScale, endRotation, endTranslation);

            var resultScale = Vector3.Lerp(startScale, endScale, gradient);
            var resultRotation = Quaternion.Slerp(startRotation, endRotation, gradient);
            var resultTranslation = Vector3.Lerp(startTranslation, endTranslation, gradient);

            return Matrix.Compose(resultScale, resultRotation, resultTranslation);
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

            if (this._xAxis.lengthSquared() === 0) {
                this._xAxis.x = 1.0;
            } else {
                this._xAxis.normalize();
            }

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

        public static LookAtRH(eye: Vector3, target: Vector3, up: Vector3): Matrix {
            var result = Matrix.Zero();

            Matrix.LookAtRHToRef(eye, target, up, result);

            return result;
        }

        public static LookAtRHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void {
            // Z axis
            eye.subtractToRef(target, this._zAxis);
            this._zAxis.normalize();

            // X axis
            Vector3.CrossToRef(up, this._zAxis, this._xAxis);

            if (this._xAxis.lengthSquared() === 0) {
                this._xAxis.x = 1.0;
            } else {
                this._xAxis.normalize();
            }

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
            var matrix = Matrix.Zero();

            Matrix.OrthoLHToRef(width, height, znear, zfar, matrix);

            return matrix;
        }

        public static OrthoLHToRef(width: number, height: number, znear: number, zfar: number, result: Matrix): void {
            let n = znear;
            let f = zfar;

            let a = 2.0 / width;
            let b = 2.0 / height;
            let c = 2.0 / (f - n);
            let d = -(f + n)/(f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0, 0, 0,
                0, b, 0, 0,
                0, 0, c, 0,
                0, 0, d, 1,
                result
            );
        }

        public static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix);

            return matrix;
        }

        public static OrthoOffCenterLHToRef(left: number, right, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void {
            let n = znear;
            let f = zfar;

            let a = 2.0 / (right - left);
            let b = 2.0 / (top - bottom);
            let c = 2.0 / (f - n);
            let d = -(f + n)/(f - n);
            let i0 = (left + right) / (left - right);
            let i1 = (top + bottom) / (bottom - top);

            BABYLON.Matrix.FromValuesToRef(
                a, 0, 0, 0,
                0, b, 0, 0,
                0, 0, c, 0,
                i0, i1, d, 1,
                result
            );
        }

        public static OrthoOffCenterRH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.OrthoOffCenterRHToRef(left, right, bottom, top, znear, zfar, matrix);

            return matrix;
        }

        public static OrthoOffCenterRHToRef(left: number, right, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void {
            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, result);
            result.m[10] *= -1.0;
        }

        public static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            let n = znear;
            let f = zfar;

            let a = 2.0 * n / width;
            let b = 2.0 * n / height;
            let c = (f + n)/(f - n);
            let d = -2.0 * f * n/(f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0, 0, 0,
                0, b, 0, 0,
                0, 0, c, 1,
                0, 0, d, 0,
                matrix
            );

            return matrix;
        }

        public static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix);

            return matrix;
        }

        public static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true): void {
            let n = znear;
            let f = zfar;

            let t = 1.0 / (Math.tan(fov * 0.5));
            let a = isVerticalFovFixed ? (t / aspect) : t;
            let b = isVerticalFovFixed ? t : (t * aspect);
            let c = (f + n)/(f - n);
            let d = -2.0 * f * n/(f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0, 0, 0,
                0, b, 0, 0,
                0, 0, c, 1,
                0, 0, d, 0,
                result
            );
        }

        public static PerspectiveFovRH(fov: number, aspect: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.PerspectiveFovRHToRef(fov, aspect, znear, zfar, matrix);

            return matrix;
        }

        public static PerspectiveFovRHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true): void {
            //alternatively this could be expressed as:
            //    m = PerspectiveFovLHToRef
            //    m[10] *= -1.0;
            //    m[11] *= -1.0;

            let n = znear;
            let f = zfar;

            let t = 1.0 / (Math.tan(fov * 0.5));
            let a = isVerticalFovFixed ? (t / aspect) : t;
            let b = isVerticalFovFixed ? t : (t * aspect);
            let c = -(f + n)/(f - n);
            let d = -2*f*n/(f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0, 0, 0,
                0, b, 0, 0,
                0, 0, c,-1,
                0, 0, d, 0,
                result
            );
        }

        public static PerspectiveFovWebVRToRef(fov, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true): void {
            //left handed
            var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
            var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
            var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
            var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
            var xScale = 2.0 / (leftTan + rightTan);
            var yScale = 2.0 / (upTan + downTan);
            result.m[0] = xScale;
            result.m[1] = result.m[2] = result.m[3] = result.m[4] = 0.0;
            result.m[5] = yScale;
            result.m[6] = result.m[7] =  0.0;
            result.m[8] = ((leftTan - rightTan) * xScale * 0.5);
            result.m[9] = -((upTan - downTan) * yScale * 0.5);
            result.m[10] = -(znear + zfar) / (zfar - znear);
            // result.m[10] = -zfar / (znear - zfar);
            result.m[11] = 1.0;
            result.m[12] = result.m[13] = result.m[15] = 0.0;
            result.m[14] = -(2.0 * zfar * znear) / (zfar - znear);
            // result.m[14] = (znear * zfar) / (znear - zfar);
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

        public static GetAsMatrix2x2(matrix: Matrix): Float32Array {
            return new Float32Array([
                matrix.m[0], matrix.m[1],
                matrix.m[4], matrix.m[5]
            ]);
        }

        public static GetAsMatrix3x3(matrix: Matrix): Float32Array {
            return new Float32Array([
                matrix.m[0], matrix.m[1], matrix.m[2],
                matrix.m[4], matrix.m[5], matrix.m[6],
                matrix.m[8], matrix.m[9], matrix.m[10]
            ]);
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

        public static FromXYZAxesToRef(xaxis: Vector3, yaxis: Vector3, zaxis: Vector3, mat: Matrix) {
            
            mat.m[0] = xaxis.x;
            mat.m[1] = xaxis.y;
            mat.m[2] = xaxis.z;

            mat.m[3] = 0;
            
            mat.m[4] = yaxis.x;
            mat.m[5] = yaxis.y;
            mat.m[6] = yaxis.z;
            
            mat.m[7] = 0;
            
            mat.m[8] = zaxis.x;
            mat.m[9] = zaxis.y;
            mat.m[10] = zaxis.z;
            
            mat.m[11] = 0;
            
            mat.m[12] = 0;
            mat.m[13] = 0;
            mat.m[14] = 0;
            
            mat.m[15] = 1;

        }

        public static FromQuaternionToRef(quat:Quaternion, result:Matrix){

            var xx = quat.x * quat.x;
            var yy = quat.y * quat.y;
            var zz = quat.z * quat.z;
            var xy = quat.x * quat.y;
            var zw = quat.z * quat.w;
            var zx = quat.z * quat.x;
            var yw = quat.y * quat.w;
            var yz = quat.y * quat.z;
            var xw = quat.x * quat.w;

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

        public getClassName(): string {
            return "Plane";
        }

        public getHashCode(): number {
            let hash = this.normal.getHashCode();
            hash = (hash * 397) ^ (this.d || 0);
            return hash;
        }

        public normalize(): Plane {
            var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
            var magnitude = 0;

            if (norm !== 0) {
                magnitude = 1.0 / norm;
            }

            this.normal.x *= magnitude;
            this.normal.y *= magnitude;
            this.normal.z *= magnitude;

            this.d *= magnitude;

            return this;
        }

        public transform(transformation: Matrix): Plane {
            var transposedMatrix = Matrix.Transpose(transformation);
            var x = this.normal.x;
            var y = this.normal.y;
            var z = this.normal.z;
            var d = this.d;

            var normalX = (((x * transposedMatrix.m[0]) + (y * transposedMatrix.m[1])) + (z * transposedMatrix.m[2])) + (d * transposedMatrix.m[3]);
            var normalY = (((x * transposedMatrix.m[4]) + (y * transposedMatrix.m[5])) + (z * transposedMatrix.m[6])) + (d * transposedMatrix.m[7]);
            var normalZ = (((x * transposedMatrix.m[8]) + (y * transposedMatrix.m[9])) + (z * transposedMatrix.m[10])) + (d * transposedMatrix.m[11]);
            var finalD = (((x * transposedMatrix.m[12]) + (y * transposedMatrix.m[13])) + (z * transposedMatrix.m[14])) + (d * transposedMatrix.m[15]);

            return new Plane(normalX, normalY, normalZ, finalD);
        }


        public dotCoordinate(point): number {
            return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
        }

        public copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane {
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

            if (pyth !== 0) {
                invPyth = 1.0 / pyth;
            }
            else {
                invPyth = 0;
            }

            this.normal.x = yz * invPyth;
            this.normal.y = xz * invPyth;
            this.normal.z = xy * invPyth;
            this.d = -((this.normal.x * point1.x) + (this.normal.y * point1.y) + (this.normal.z * point1.z));

            return this;
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
            return new Plane(array[0], array[1], array[2], array[3]);
        }

        static FromPoints(point1, point2, point3): Plane {
            var result = new Plane(0, 0, 0, 0);

            result.copyFromPoints(point1, point2, point3);

            return result;
        }

        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane {
            var result = new Plane(0, 0, 0, 0);
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

        public toGlobal(renderWidth: number, renderHeight: number): Viewport {
            return new Viewport(this.x * renderWidth, this.y * renderHeight, this.width * renderWidth, this.height * renderHeight);
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
            frustumPlanes[0].normal.z = transform.m[11] + transform.m[10];
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

    export enum Space {
        LOCAL = 0,
        WORLD = 1
    }

    export class Axis {
        public static X: Vector3 = new Vector3(1, 0, 0);
        public static Y: Vector3 = new Vector3(0, 1, 0);
        public static Z: Vector3 = new Vector3(0, 0, 1);
    };

    export class BezierCurve {
        public static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number {

            // Extract X (which is equal to time here)
            var f0 = 1 - 3 * x2 + 3 * x1;
            var f1 = 3 * x2 - 6 * x1;
            var f2 = 3 * x1;

            var refinedT = t;
            for (var i = 0; i < 5; i++) {
                var refinedT2 = refinedT * refinedT;
                var refinedT3 = refinedT2 * refinedT;

                var x = f0 * refinedT3 + f1 * refinedT2 + f2 * refinedT;
                var slope = 1.0 / (3.0 * f0 * refinedT2 + 2.0 * f1 * refinedT + f2);
                refinedT -= (x - t) * slope;
                refinedT = Math.min(1, Math.max(0, refinedT));

            }

            // Resolve cubic bezier for the given x
            return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 +
                3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 +
                Math.pow(refinedT, 3);

        }
    }

    export enum Orientation {
        CW = 0,
        CCW = 1
    }

    export class Angle {
        private _radians: number;

        constructor(radians: number) {
            this._radians = radians;
            if (this._radians < 0) this._radians += (2 * Math.PI);
        }

        public degrees = () => this._radians * 180 / Math.PI;
        public radians = () => this._radians;

        public static BetweenTwoPoints(a: Vector2, b: Vector2): Angle {
            var delta = b.subtract(a);
            var theta = Math.atan2(delta.y, delta.x);
            return new Angle(theta);
        }

        public static FromRadians(radians: number): Angle {
            return new Angle(radians);
        }

        public static FromDegrees(degrees: number): Angle {
            return new Angle(degrees * Math.PI / 180);
        }
    }

    export class Arc2 {
        centerPoint: Vector2;
        radius: number;
        angle: Angle;
        startAngle: Angle;
        orientation: Orientation;

        constructor(public startPoint: Vector2, public midPoint: Vector2, public endPoint: Vector2) {

            var temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
            var startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2.;
            var midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2.;
            var det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);

            this.centerPoint = new Vector2(
                (startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det,
                ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det
            );

            this.radius = this.centerPoint.subtract(this.startPoint).length();

            this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);

            var a1 = this.startAngle.degrees();
            var a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
            var a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();

            // angles correction
            if (a2 - a1 > +180.0) a2 -= 360.0;
            if (a2 - a1 < -180.0) a2 += 360.0;
            if (a3 - a2 > +180.0) a3 -= 360.0;
            if (a3 - a2 < -180.0) a3 += 360.0;

            this.orientation = (a2 - a1) < 0 ? Orientation.CW : Orientation.CCW;
            this.angle = Angle.FromDegrees(this.orientation === Orientation.CW ? a1 - a3 : a3 - a1);
        }
    }

    export class Path2 {
        private _points = new Array<Vector2>();
        private _length = 0;

        public closed = false;

        constructor(x: number, y: number) {
            this._points.push(new Vector2(x, y));
        }

        public addLineTo(x: number, y: number): Path2 {
            if (closed) {
                //Tools.Error("cannot add lines to closed paths");
                return this;
            }
            var newPoint = new Vector2(x, y);
            var previousPoint = this._points[this._points.length - 1];
            this._points.push(newPoint);
            this._length += newPoint.subtract(previousPoint).length();
            return this;
        }

        public addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments = 36): Path2 {
            if (closed) {
                //Tools.Error("cannot add arcs to closed paths");
                return this;
            }
            var startPoint = this._points[this._points.length - 1];
            var midPoint = new Vector2(midX, midY);
            var endPoint = new Vector2(endX, endY);

            var arc = new Arc2(startPoint, midPoint, endPoint);

            var increment = arc.angle.radians() / numberOfSegments;
            if (arc.orientation === Orientation.CW) increment *= -1;
            var currentAngle = arc.startAngle.radians() + increment;

            for (var i = 0; i < numberOfSegments; i++) {
                var x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
                var y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
                this.addLineTo(x, y);
                currentAngle += increment;
            }
            return this;
        }

        public close(): Path2 {
            this.closed = true;
            return this;
        }

        public length(): number {
            var result = this._length;

            if (!this.closed) {
                var lastPoint = this._points[this._points.length - 1];
                var firstPoint = this._points[0];
                result += (firstPoint.subtract(lastPoint).length());
            }

            return result;
        }

        public getPoints(): Vector2[] {
            return this._points;
        }

        public getPointAtLengthPosition(normalizedLengthPosition: number): Vector2 {
            if (normalizedLengthPosition < 0 || normalizedLengthPosition > 1) {
                //Tools.Error("normalized length position should be between 0 and 1.");
                return Vector2.Zero();
            }

            var lengthPosition = normalizedLengthPosition * this.length();

            var previousOffset = 0;
            for (var i = 0; i < this._points.length; i++) {
                var j = (i + 1) % this._points.length;

                var a = this._points[i];
                var b = this._points[j];
                var bToA = b.subtract(a);

                var nextOffset = (bToA.length() + previousOffset);
                if (lengthPosition >= previousOffset && lengthPosition <= nextOffset) {
                    var dir = bToA.normalize();
                    var localOffset = lengthPosition - previousOffset;

                    return new Vector2(
                        a.x + (dir.x * localOffset),
                        a.y + (dir.y * localOffset)
                    );
                }
                previousOffset = nextOffset;
            }

            //Tools.Error("internal error");
            return Vector2.Zero();
        }

        public static StartingAt(x: number, y: number): Path2 {
            return new Path2(x, y);
        }
    }

    export class Path3D {
        private _curve = new Array<Vector3>();
        private _distances = new Array<number>();
        private _tangents = new Array<Vector3>();
        private _normals = new Array<Vector3>();
        private _binormals = new Array<Vector3>();
        private _raw: boolean;

        /**
        * new Path3D(path, normal, raw)
        * Creates a Path3D. A Path3D is a logical math object, so not a mesh.  
        * please read the description in the tutorial :  http://doc.babylonjs.com/tutorials/How_to_use_Path3D  
        * path : an array of Vector3, the curve axis of the Path3D
        * normal (optional) : Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
        * raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
        */
        constructor(public path: Vector3[], firstNormal?: Vector3, raw?: boolean) {
            for (var p = 0; p < path.length; p++) {
                this._curve[p] = path[p].clone(); // hard copy
            }
            this._raw = raw || false;
            this._compute(firstNormal);
        }

        /**
         * Returns the Path3D array of successive Vector3 designing its curve.  
         */
        public getCurve(): Vector3[] {
            return this._curve;
        }

        /**
         * Returns an array populated with tangent vectors on each Path3D curve point.
         */
        public getTangents(): Vector3[] {
            return this._tangents;
        }


        /**
         * Returns an array populated with normal vectors on each Path3D curve point.
         */
        public getNormals(): Vector3[] {
            return this._normals;
        }


        /**
         * Returns an array populated with binormal vectors on each Path3D curve point.
         */
        public getBinormals(): Vector3[] {
            return this._binormals;
        }


        /**
         * Returns an array populated with distances (float) of the i-th point from the first curve point.
         */
        public getDistances(): number[] {
            return this._distances;
        }


        /**
         * Forces the Path3D tangent, normal, binormal and distance recomputation.
         * Returns the same object updated.  
         */
        public update(path: Vector3[], firstNormal?: Vector3): Path3D {
            for (var p = 0; p < path.length; p++) {
                this._curve[p].x = path[p].x;
                this._curve[p].y = path[p].y;
                this._curve[p].z = path[p].z;
            }
            this._compute(firstNormal);
            return this;
        }

        // private function compute() : computes tangents, normals and binormals
        private _compute(firstNormal) {
            var l = this._curve.length;

            // first and last tangents
            this._tangents[0] = this._getFirstNonNullVector(0);
            if (!this._raw) {
                this._tangents[0].normalize();
            }
            this._tangents[l - 1] = this._curve[l - 1].subtract(this._curve[l - 2]);
            if (!this._raw) {
                this._tangents[l - 1].normalize();
            }

            // normals and binormals at first point : arbitrary vector with _normalVector()
            var tg0 = this._tangents[0];
            var pp0 = this._normalVector(this._curve[0], tg0, firstNormal);
            this._normals[0] = pp0;
            if (!this._raw) {
                this._normals[0].normalize();
            }
            this._binormals[0] = Vector3.Cross(tg0, this._normals[0]);
            if (!this._raw) {
                this._binormals[0].normalize();
            }
            this._distances[0] = 0.0;

            // normals and binormals : next points
            var prev: Vector3;        // previous vector (segment)
            var cur: Vector3;         // current vector (segment)
            var curTang: Vector3;     // current tangent
            // previous normal
            var prevBinor: Vector3;   // previous binormal

            for (var i = 1; i < l; i++) {
                // tangents
                prev = this._getLastNonNullVector(i);
                if (i < l - 1) {
                    cur = this._getFirstNonNullVector(i);
                    this._tangents[i] = prev.add(cur);
                    this._tangents[i].normalize();
                }
                this._distances[i] = this._distances[i - 1] + prev.length();

                // normals and binormals
                // http://www.cs.cmu.edu/afs/andrew/scs/cs/15-462/web/old/asst2camera.html
                curTang = this._tangents[i];
                prevBinor = this._binormals[i - 1];
                this._normals[i] = Vector3.Cross(prevBinor, curTang);
                if (!this._raw) {
                    this._normals[i].normalize();
                }
                this._binormals[i] = Vector3.Cross(curTang, this._normals[i]);
                if (!this._raw) {
                    this._binormals[i].normalize();
                }
            }
        }

        // private function getFirstNonNullVector(index)
        // returns the first non null vector from index : curve[index + N].subtract(curve[index])
        private _getFirstNonNullVector(index: number): Vector3 {
            var i = 1;
            var nNVector: Vector3 = this._curve[index + i].subtract(this._curve[index]);
            while (nNVector.length() === 0 && index + i + 1 < this._curve.length) {
                i++;
                nNVector = this._curve[index + i].subtract(this._curve[index]);
            }
            return nNVector;
        }

        // private function getLastNonNullVector(index)
        // returns the last non null vector from index : curve[index].subtract(curve[index - N])
        private _getLastNonNullVector(index: number): Vector3 {
            var i = 1;
            var nLVector: Vector3 = this._curve[index].subtract(this._curve[index - i]);
            while (nLVector.length() === 0 && index > i + 1) {
                i++;
                nLVector = this._curve[index].subtract(this._curve[index - i]);
            }
            return nLVector;
        }

        // private function normalVector(v0, vt, va) :
        // returns an arbitrary point in the plane defined by the point v0 and the vector vt orthogonal to this plane
        // if va is passed, it returns the va projection on the plane orthogonal to vt at the point v0
        private _normalVector(v0: Vector3, vt: Vector3, va: Vector3): Vector3 {
            var normal0: Vector3;
            var tgl = vt.length();
            if (tgl === 0.0) {
                tgl = 1.0;
            }

            if (va === undefined || va === null) {
                var point: Vector3;
                if (!MathTools.WithinEpsilon(Math.abs(vt.y) / tgl, 1.0, Epsilon)) {     // search for a point in the plane
                    point = new Vector3(0.0, -1.0, 0.0);
                }
                else if (!MathTools.WithinEpsilon(Math.abs(vt.x) / tgl, 1.0, Epsilon)) {
                    point = new Vector3(1.0, 0.0, 0.0);
                }
                else if (!MathTools.WithinEpsilon(Math.abs(vt.z) / tgl, 1.0, Epsilon)) {
                    point = new Vector3(0.0, 0.0, 1.0);
                }
                normal0 = Vector3.Cross(vt, point);
            }
            else {
                normal0 = Vector3.Cross(vt, va);
                Vector3.CrossToRef(normal0, vt, normal0);
            }
            normal0.normalize();
            return normal0;
        }
    }

    export class Curve3 {
        private _points: Vector3[];
        private _length: number = 0.0;

        /**
         * Returns a Curve3 object along a Quadratic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#quadratic-bezier-curve  
         * @param v0 (Vector3) the origin point of the Quadratic Bezier
         * @param v1 (Vector3) the control point
         * @param v2 (Vector3) the end point of the Quadratic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        public static CreateQuadraticBezier(v0: Vector3, v1: Vector3, v2: Vector3, nbPoints: number): Curve3 {
            nbPoints = nbPoints > 2 ? nbPoints : 3;
            var bez = new Array<Vector3>();
            var equation = (t: number, val0: number, val1: number, val2: number) => {
                var res = (1.0 - t) * (1.0 - t) * val0 + 2.0 * t * (1.0 - t) * val1 + t * t * val2;
                return res;
            }
            for (var i = 0; i <= nbPoints; i++) {
                bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x), equation(i / nbPoints, v0.y, v1.y, v2.y), equation(i / nbPoints, v0.z, v1.z, v2.z)));
            }
            return new Curve3(bez);
        }

        /**
         * Returns a Curve3 object along a Cubic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#cubic-bezier-curve  
         * @param v0 (Vector3) the origin point of the Cubic Bezier
         * @param v1 (Vector3) the first control point
         * @param v2 (Vector3) the second control point
         * @param v3 (Vector3) the end point of the Cubic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        public static CreateCubicBezier(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3, nbPoints: number): Curve3 {
            nbPoints = nbPoints > 3 ? nbPoints : 4;
            var bez = new Array<Vector3>();
            var equation = (t: number, val0: number, val1: number, val2: number, val3: number) => {
                var res = (1.0 - t) * (1.0 - t) * (1.0 - t) * val0 + 3.0 * t * (1.0 - t) * (1.0 - t) * val1 + 3.0 * t * t * (1.0 - t) * val2 + t * t * t * val3;
                return res;
            }
            for (var i = 0; i <= nbPoints; i++) {
                bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x, v3.x), equation(i / nbPoints, v0.y, v1.y, v2.y, v3.y), equation(i / nbPoints, v0.z, v1.z, v2.z, v3.z)));
            }
            return new Curve3(bez);
        }

        /**
         * Returns a Curve3 object along a Hermite Spline curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#hermite-spline  
         * @param p1 (Vector3) the origin point of the Hermite Spline
         * @param t1 (Vector3) the tangent vector at the origin point
         * @param p2 (Vector3) the end point of the Hermite Spline
         * @param t2 (Vector3) the tangent vector at the end point
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        public static CreateHermiteSpline(p1: Vector3, t1: Vector3, p2: Vector3, t2: Vector3, nbPoints: number): Curve3 {
            var hermite = new Array<Vector3>();
            var step = 1.0 / nbPoints;
            for (var i = 0; i <= nbPoints; i++) {
                hermite.push(Vector3.Hermite(p1, t1, p2, t2, i * step));
            }
            return new Curve3(hermite);
        }

        /**
         * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.  
         * A Curve3 is designed from a series of successive Vector3.  
         * Tuto : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#curve3-object
         */
        constructor(points: Vector3[]) {
            this._points = points;
            this._length = this._computeLength(points);
        }

        /**
         * Returns the Curve3 stored array of successive Vector3
         */
        public getPoints() {
            return this._points;
        }

        /**
         * Returns the computed length (float) of the curve.
         */
        public length() {
            return this._length;
        }

        /**
         * Returns a new instance of Curve3 object : var curve = curveA.continue(curveB);  
         * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.  
         * curveA and curveB keep unchanged.  
         */
        public continue(curve: Curve3): Curve3 {
            var lastPoint = this._points[this._points.length - 1];
            var continuedPoints = this._points.slice();
            var curvePoints = curve.getPoints();
            for (var i = 1; i < curvePoints.length; i++) {
                continuedPoints.push(curvePoints[i].subtract(curvePoints[0]).add(lastPoint));
            }
            var continuedCurve = new Curve3(continuedPoints);
            return continuedCurve;
        }

        private _computeLength(path: Vector3[]): number {
            var l = 0;
            for (var i = 1; i < path.length; i++) {
                l += (path[i].subtract(path[i - 1])).length();
            }
            return l;
        }
    }

    // SphericalHarmonics
    export class SphericalHarmonics {
        public L00: Vector3 = Vector3.Zero();
        public L1_1: Vector3 = Vector3.Zero();
        public L10: Vector3 = Vector3.Zero();
        public L11: Vector3 = Vector3.Zero();
        public L2_2: Vector3 = Vector3.Zero();
        public L2_1: Vector3 = Vector3.Zero();
        public L20: Vector3 = Vector3.Zero();
        public L21: Vector3 = Vector3.Zero();
        public L22: Vector3 = Vector3.Zero();

        public addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void {
            var colorVector = new Vector3(color.r, color.g, color.b);
            var c = colorVector.scale(deltaSolidAngle);

            this.L00 = this.L00.add(c.scale(0.282095));

            this.L1_1 = this.L1_1.add(c.scale(0.488603 * direction.y));
            this.L10 = this.L10.add(c.scale(0.488603 * direction.z));
            this.L11 = this.L11.add(c.scale(0.488603 * direction.x));

            this.L2_2 = this.L2_2.add(c.scale(1.092548 * direction.x * direction.y));
            this.L2_1 = this.L2_1.add(c.scale(1.092548 * direction.y * direction.z));
            this.L21 = this.L21.add(c.scale(1.092548 * direction.x * direction.z));

            this.L20 = this.L20.add(c.scale(0.315392 * (3.0 * direction.z * direction.z - 1.0)));
            this.L22 = this.L22.add(c.scale(0.546274 * (direction.x * direction.x - direction.y * direction.y)));
        }

        public scale(scale: number): void {
            this.L00 = this.L00.scale(scale);
            this.L1_1 = this.L1_1.scale(scale);
            this.L10 = this.L10.scale(scale);
            this.L11 = this.L11.scale(scale);
            this.L2_2 = this.L2_2.scale(scale);
            this.L2_1 = this.L2_1.scale(scale);
            this.L20 = this.L20.scale(scale);
            this.L21 = this.L21.scale(scale);
            this.L22 = this.L22.scale(scale);
        }
    }

    // SphericalPolynomial
    export class SphericalPolynomial {
        public x: Vector3 = Vector3.Zero();
        public y: Vector3 = Vector3.Zero();
        public z: Vector3 = Vector3.Zero();
        public xx: Vector3 = Vector3.Zero();
        public yy: Vector3 = Vector3.Zero();
        public zz: Vector3 = Vector3.Zero();
        public xy: Vector3 = Vector3.Zero();
        public yz: Vector3 = Vector3.Zero();
        public zx: Vector3 = Vector3.Zero();

        public addAmbient(color: Color3): void {
            var colorVector = new Vector3(color.r, color.g, color.b);
            this.xx = this.xx.add(colorVector);
            this.yy = this.yy.add(colorVector);
            this.zz = this.zz.add(colorVector);
        }

        public static getSphericalPolynomialFromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
            var result = new SphericalPolynomial();

            result.x = harmonics.L11.scale(1.02333);
            result.y = harmonics.L1_1.scale(1.02333);
            result.z = harmonics.L10.scale(1.02333);

            result.xx = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).add(harmonics.L22.scale(0.429043));
            result.yy = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).subtract(harmonics.L22.scale(0.429043));
            result.zz = harmonics.L00.scale(0.886277).add(harmonics.L20.scale(0.495417));

            result.yz = harmonics.L2_1.scale(0.858086);
            result.zx = harmonics.L21.scale(0.858086);
            result.xy = harmonics.L2_2.scale(0.858086);

            return result;
        }
    }

    // Vertex formats
    export class PositionNormalVertex {
        constructor(public position: Vector3 = Vector3.Zero(), public normal: Vector3 = Vector3.Up()) {

        }

        public clone(): PositionNormalVertex {
            return new PositionNormalVertex(this.position.clone(), this.normal.clone());
        }
    }

    export class PositionNormalTextureVertex {
        constructor(public position: Vector3 = Vector3.Zero(), public normal: Vector3 = Vector3.Up(), public uv: Vector2 = Vector2.Zero()) {

        }

        public clone(): PositionNormalTextureVertex {
            return new PositionNormalTextureVertex(this.position.clone(), this.normal.clone(), this.uv.clone());
        }
    }

    // Temporary pre-allocated objects for engine internal use
    // usage in any internal function :
    // var tmp = Tmp.Vector3[0];   <= gets access to the first pre-created Vector3
    // There's a Tmp array per object type : int, float, Vector2, Vector3, Vector4, Quaternion, Matrix
    export class Tmp {
        public static Color3: Color3[] = [Color3.Black(), Color3.Black(), Color3.Black()];
        public static Vector2: Vector2[] = [Vector2.Zero(), Vector2.Zero(), Vector2.Zero()];  // 3 temp Vector2 at once should be enough
        public static Vector3: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(),
            Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];    // 9 temp Vector3 at once should be enough
        public static Vector4: Vector4[] = [Vector4.Zero(), Vector4.Zero(), Vector4.Zero()];  // 3 temp Vector4 at once should be enough
        public static Quaternion: Quaternion[] = [new Quaternion(0, 0, 0, 0)];                // 1 temp Quaternion at once should be enough
        public static Matrix: Matrix[] = [Matrix.Zero(), Matrix.Zero(),
            Matrix.Zero(), Matrix.Zero(),
            Matrix.Zero(), Matrix.Zero(),
            Matrix.Zero(), Matrix.Zero()];                      // 6 temp Matrices at once should be enough
    }
}
