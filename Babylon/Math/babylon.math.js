var BABYLON;
(function (BABYLON) {
    var Color3 = (function () {
        function Color3(r, g, b) {
            if (r === void 0) { r = 0; }
            if (g === void 0) { g = 0; }
            if (b === void 0) { b = 0; }
            this.r = r;
            this.g = g;
            this.b = b;
        }
        Color3.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
        };
        // Operators
        Color3.prototype.toArray = function (array, index) {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            return this;
        };
        Color3.prototype.toColor4 = function (alpha) {
            if (alpha === void 0) { alpha = 1; }
            return new Color4(this.r, this.g, this.b, alpha);
        };
        Color3.prototype.asArray = function () {
            var result = [];
            this.toArray(result, 0);
            return result;
        };
        Color3.prototype.toLuminance = function () {
            return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
        };
        Color3.prototype.multiply = function (otherColor) {
            return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
        };
        Color3.prototype.multiplyToRef = function (otherColor, result) {
            result.r = this.r * otherColor.r;
            result.g = this.g * otherColor.g;
            result.b = this.b * otherColor.b;
            return this;
        };
        Color3.prototype.equals = function (otherColor) {
            return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
        };
        Color3.prototype.scale = function (scale) {
            return new Color3(this.r * scale, this.g * scale, this.b * scale);
        };
        Color3.prototype.scaleToRef = function (scale, result) {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
            return this;
        };
        Color3.prototype.add = function (otherColor) {
            return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
        };
        Color3.prototype.addToRef = function (otherColor, result) {
            result.r = this.r + otherColor.r;
            result.g = this.g + otherColor.g;
            result.b = this.b + otherColor.b;
            return this;
        };
        Color3.prototype.subtract = function (otherColor) {
            return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
        };
        Color3.prototype.subtractToRef = function (otherColor, result) {
            result.r = this.r - otherColor.r;
            result.g = this.g - otherColor.g;
            result.b = this.b - otherColor.b;
            return this;
        };
        Color3.prototype.clone = function () {
            return new Color3(this.r, this.g, this.b);
        };
        Color3.prototype.copyFrom = function (source) {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
            return this;
        };
        Color3.prototype.copyFromFloats = function (r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
            return this;
        };
        // Statics
        Color3.FromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Color3(array[offset], array[offset + 1], array[offset + 2]);
        };
        Color3.FromInts = function (r, g, b) {
            return new Color3(r / 255.0, g / 255.0, b / 255.0);
        };
        Color3.Lerp = function (start, end, amount) {
            var r = start.r + ((end.r - start.r) * amount);
            var g = start.g + ((end.g - start.g) * amount);
            var b = start.b + ((end.b - start.b) * amount);
            return new Color3(r, g, b);
        };
        Color3.Red = function () {
            return new Color3(1, 0, 0);
        };
        Color3.Green = function () {
            return new Color3(0, 1, 0);
        };
        Color3.Blue = function () {
            return new Color3(0, 0, 1);
        };
        Color3.Black = function () {
            return new Color3(0, 0, 0);
        };
        Color3.White = function () {
            return new Color3(1, 1, 1);
        };
        Color3.Purple = function () {
            return new Color3(0.5, 0, 0.5);
        };
        Color3.Magenta = function () {
            return new Color3(1, 0, 1);
        };
        Color3.Yellow = function () {
            return new Color3(1, 1, 0);
        };
        Color3.Gray = function () {
            return new Color3(0.5, 0.5, 0.5);
        };
        return Color3;
    })();
    BABYLON.Color3 = Color3;
    var Color4 = (function () {
        function Color4(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        // Operators
        Color4.prototype.addInPlace = function (right) {
            this.r += right.r;
            this.g += right.g;
            this.b += right.b;
            this.a += right.a;
            return this;
        };
        Color4.prototype.asArray = function () {
            var result = [];
            this.toArray(result, 0);
            return result;
        };
        Color4.prototype.toArray = function (array, index) {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            array[index + 3] = this.a;
            return this;
        };
        Color4.prototype.add = function (right) {
            return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
        };
        Color4.prototype.subtract = function (right) {
            return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
        };
        Color4.prototype.subtractToRef = function (right, result) {
            result.r = this.r - right.r;
            result.g = this.g - right.g;
            result.b = this.b - right.b;
            result.a = this.a - right.a;
            return this;
        };
        Color4.prototype.scale = function (scale) {
            return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
        };
        Color4.prototype.scaleToRef = function (scale, result) {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
            result.a = this.a * scale;
            return this;
        };
        Color4.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        };
        Color4.prototype.clone = function () {
            return new Color4(this.r, this.g, this.b, this.a);
        };
        Color4.prototype.copyFrom = function (source) {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
            this.a = source.a;
            return this;
        };
        // Statics
        Color4.Lerp = function (left, right, amount) {
            var result = new Color4(0, 0, 0, 0);
            Color4.LerpToRef(left, right, amount, result);
            return result;
        };
        Color4.LerpToRef = function (left, right, amount, result) {
            result.r = left.r + (right.r - left.r) * amount;
            result.g = left.g + (right.g - left.g) * amount;
            result.b = left.b + (right.b - left.b) * amount;
            result.a = left.a + (right.a - left.a) * amount;
        };
        Color4.FromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        };
        Color4.FromInts = function (r, g, b, a) {
            return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
        };
        return Color4;
    })();
    BABYLON.Color4 = Color4;
    var Vector2 = (function () {
        function Vector2(x, y) {
            this.x = x;
            this.y = y;
        }
        Vector2.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + "}";
        };
        // Operators
        Vector2.prototype.toArray = function (array, index) {
            if (index === void 0) { index = 0; }
            array[index] = this.x;
            array[index + 1] = this.y;
            return this;
        };
        Vector2.prototype.asArray = function () {
            var result = [];
            this.toArray(result, 0);
            return result;
        };
        Vector2.prototype.copyFrom = function (source) {
            this.x = source.x;
            this.y = source.y;
            return this;
        };
        Vector2.prototype.copyFromFloats = function (x, y) {
            this.x = x;
            this.y = y;
            return this;
        };
        Vector2.prototype.add = function (otherVector) {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        };
        Vector2.prototype.addVector3 = function (otherVector) {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        };
        Vector2.prototype.subtract = function (otherVector) {
            return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
        };
        Vector2.prototype.subtractInPlace = function (otherVector) {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            return this;
        };
        Vector2.prototype.multiplyInPlace = function (otherVector) {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            return this;
        };
        Vector2.prototype.multiply = function (otherVector) {
            return new Vector2(this.x * otherVector.x, this.y * otherVector.y);
        };
        Vector2.prototype.multiplyToRef = function (otherVector, result) {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            return this;
        };
        Vector2.prototype.multiplyByFloats = function (x, y) {
            return new Vector2(this.x * x, this.y * y);
        };
        Vector2.prototype.divide = function (otherVector) {
            return new Vector2(this.x / otherVector.x, this.y / otherVector.y);
        };
        Vector2.prototype.divideToRef = function (otherVector, result) {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            return this;
        };
        Vector2.prototype.negate = function () {
            return new Vector2(-this.x, -this.y);
        };
        Vector2.prototype.scaleInPlace = function (scale) {
            this.x *= scale;
            this.y *= scale;
            return this;
        };
        Vector2.prototype.scale = function (scale) {
            return new Vector2(this.x * scale, this.y * scale);
        };
        Vector2.prototype.equals = function (otherVector) {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y;
        };
        // Properties
        Vector2.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Vector2.prototype.lengthSquared = function () {
            return (this.x * this.x + this.y * this.y);
        };
        // Methods
        Vector2.prototype.normalize = function () {
            var len = this.length();
            if (len === 0)
                return this;
            var num = 1.0 / len;
            this.x *= num;
            this.y *= num;
            return this;
        };
        Vector2.prototype.clone = function () {
            return new Vector2(this.x, this.y);
        };
        // Statics
        Vector2.Zero = function () {
            return new Vector2(0, 0);
        };
        Vector2.FromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Vector2(array[offset], array[offset + 1]);
        };
        Vector2.FromArrayToRef = function (array, offset, result) {
            result.x = array[offset];
            result.y = array[offset + 1];
        };
        Vector2.CatmullRom = function (value1, value2, value3, value4, amount) {
            var squared = amount * amount;
            var cubed = amount * squared;
            var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) + (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) + ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));
            var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) + (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) + ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));
            return new Vector2(x, y);
        };
        Vector2.Clamp = function (value, min, max) {
            var x = value.x;
            x = (x > max.x) ? max.x : x;
            x = (x < min.x) ? min.x : x;
            var y = value.y;
            y = (y > max.y) ? max.y : y;
            y = (y < min.y) ? min.y : y;
            return new Vector2(x, y);
        };
        Vector2.Hermite = function (value1, tangent1, value2, tangent2, amount) {
            var squared = amount * amount;
            var cubed = amount * squared;
            var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
            var part2 = (-2.0 * cubed) + (3.0 * squared);
            var part3 = (cubed - (2.0 * squared)) + amount;
            var part4 = cubed - squared;
            var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
            var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
            return new Vector2(x, y);
        };
        Vector2.Lerp = function (start, end, amount) {
            var x = start.x + ((end.x - start.x) * amount);
            var y = start.y + ((end.y - start.y) * amount);
            return new Vector2(x, y);
        };
        Vector2.Dot = function (left, right) {
            return left.x * right.x + left.y * right.y;
        };
        Vector2.Normalize = function (vector) {
            var newVector = vector.clone();
            newVector.normalize();
            return newVector;
        };
        Vector2.Minimize = function (left, right) {
            var x = (left.x < right.x) ? left.x : right.x;
            var y = (left.y < right.y) ? left.y : right.y;
            return new Vector2(x, y);
        };
        Vector2.Maximize = function (left, right) {
            var x = (left.x > right.x) ? left.x : right.x;
            var y = (left.y > right.y) ? left.y : right.y;
            return new Vector2(x, y);
        };
        Vector2.Transform = function (vector, transformation) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]);
            return new Vector2(x, y);
        };
        Vector2.Distance = function (value1, value2) {
            return Math.sqrt(Vector2.DistanceSquared(value1, value2));
        };
        Vector2.DistanceSquared = function (value1, value2) {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            return (x * x) + (y * y);
        };
        return Vector2;
    })();
    BABYLON.Vector2 = Vector2;
    var Vector3 = (function () {
        function Vector3(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        Vector3.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
        };
        // Operators
        Vector3.prototype.asArray = function () {
            var result = [];
            this.toArray(result, 0);
            return result;
        };
        Vector3.prototype.toArray = function (array, index) {
            if (index === void 0) { index = 0; }
            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
            return this;
        };
        Vector3.prototype.toQuaternion = function () {
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
        };
        Vector3.prototype.addInPlace = function (otherVector) {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
            return this;
        };
        Vector3.prototype.add = function (otherVector) {
            return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
        };
        Vector3.prototype.addToRef = function (otherVector, result) {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
            return this;
        };
        Vector3.prototype.subtractInPlace = function (otherVector) {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
            return this;
        };
        Vector3.prototype.subtract = function (otherVector) {
            return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
        };
        Vector3.prototype.subtractToRef = function (otherVector, result) {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
            return this;
        };
        Vector3.prototype.subtractFromFloats = function (x, y, z) {
            return new Vector3(this.x - x, this.y - y, this.z - z);
        };
        Vector3.prototype.subtractFromFloatsToRef = function (x, y, z, result) {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
            return this;
        };
        Vector3.prototype.negate = function () {
            return new Vector3(-this.x, -this.y, -this.z);
        };
        Vector3.prototype.scaleInPlace = function (scale) {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
        };
        Vector3.prototype.scale = function (scale) {
            return new Vector3(this.x * scale, this.y * scale, this.z * scale);
        };
        Vector3.prototype.scaleToRef = function (scale, result) {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
        };
        Vector3.prototype.equals = function (otherVector) {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
        };
        Vector3.prototype.equalsWithEpsilon = function (otherVector) {
            return Math.abs(this.x - otherVector.x) < BABYLON.Engine.Epsilon && Math.abs(this.y - otherVector.y) < BABYLON.Engine.Epsilon && Math.abs(this.z - otherVector.z) < BABYLON.Engine.Epsilon;
        };
        Vector3.prototype.equalsToFloats = function (x, y, z) {
            return this.x === x && this.y === y && this.z === z;
        };
        Vector3.prototype.multiplyInPlace = function (otherVector) {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
            return this;
        };
        Vector3.prototype.multiply = function (otherVector) {
            return new Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
        };
        Vector3.prototype.multiplyToRef = function (otherVector, result) {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
            return this;
        };
        Vector3.prototype.multiplyByFloats = function (x, y, z) {
            return new Vector3(this.x * x, this.y * y, this.z * z);
        };
        Vector3.prototype.divide = function (otherVector) {
            return new Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
        };
        Vector3.prototype.divideToRef = function (otherVector, result) {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
            return this;
        };
        Vector3.prototype.MinimizeInPlace = function (other) {
            if (other.x < this.x)
                this.x = other.x;
            if (other.y < this.y)
                this.y = other.y;
            if (other.z < this.z)
                this.z = other.z;
            return this;
        };
        Vector3.prototype.MaximizeInPlace = function (other) {
            if (other.x > this.x)
                this.x = other.x;
            if (other.y > this.y)
                this.y = other.y;
            if (other.z > this.z)
                this.z = other.z;
            return this;
        };
        // Properties
        Vector3.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };
        Vector3.prototype.lengthSquared = function () {
            return (this.x * this.x + this.y * this.y + this.z * this.z);
        };
        // Methods
        Vector3.prototype.normalize = function () {
            var len = this.length();
            if (len === 0)
                return this;
            var num = 1.0 / len;
            this.x *= num;
            this.y *= num;
            this.z *= num;
            return this;
        };
        Vector3.prototype.clone = function () {
            return new Vector3(this.x, this.y, this.z);
        };
        Vector3.prototype.copyFrom = function (source) {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            return this;
        };
        Vector3.prototype.copyFromFloats = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        // Statics
        Vector3.FromArray = function (array, offset) {
            if (!offset) {
                offset = 0;
            }
            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        };
        Vector3.FromArrayToRef = function (array, offset, result) {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
        };
        Vector3.FromFloatArrayToRef = function (array, offset, result) {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
        };
        Vector3.FromFloatsToRef = function (x, y, z, result) {
            result.x = x;
            result.y = y;
            result.z = z;
        };
        Vector3.Zero = function () {
            return new Vector3(0, 0, 0);
        };
        Vector3.Up = function () {
            return new Vector3(0, 1.0, 0);
        };
        Vector3.TransformCoordinates = function (vector, transformation) {
            var result = Vector3.Zero();
            Vector3.TransformCoordinatesToRef(vector, transformation, result);
            return result;
        };
        Vector3.TransformCoordinatesToRef = function (vector, transformation, result) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
            var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];
            result.x = x / w;
            result.y = y / w;
            result.z = z / w;
        };
        Vector3.TransformCoordinatesFromFloatsToRef = function (x, y, z, transformation, result) {
            var rx = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]) + transformation.m[12];
            var ry = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]) + transformation.m[13];
            var rz = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]) + transformation.m[14];
            var rw = (x * transformation.m[3]) + (y * transformation.m[7]) + (z * transformation.m[11]) + transformation.m[15];
            result.x = rx / rw;
            result.y = ry / rw;
            result.z = rz / rw;
        };
        Vector3.TransformNormal = function (vector, transformation) {
            var result = Vector3.Zero();
            Vector3.TransformNormalToRef(vector, transformation, result);
            return result;
        };
        Vector3.TransformNormalToRef = function (vector, transformation, result) {
            result.x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            result.y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            result.z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
        };
        Vector3.TransformNormalFromFloatsToRef = function (x, y, z, transformation, result) {
            result.x = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]);
            result.y = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]);
            result.z = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]);
        };
        Vector3.CatmullRom = function (value1, value2, value3, value4, amount) {
            var squared = amount * amount;
            var cubed = amount * squared;
            var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) + (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) + ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));
            var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) + (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) + ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));
            var z = 0.5 * ((((2.0 * value2.z) + ((-value1.z + value3.z) * amount)) + (((((2.0 * value1.z) - (5.0 * value2.z)) + (4.0 * value3.z)) - value4.z) * squared)) + ((((-value1.z + (3.0 * value2.z)) - (3.0 * value3.z)) + value4.z) * cubed));
            return new Vector3(x, y, z);
        };
        Vector3.Clamp = function (value, min, max) {
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
        };
        Vector3.Hermite = function (value1, tangent1, value2, tangent2, amount) {
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
        };
        Vector3.Lerp = function (start, end, amount) {
            var x = start.x + ((end.x - start.x) * amount);
            var y = start.y + ((end.y - start.y) * amount);
            var z = start.z + ((end.z - start.z) * amount);
            return new Vector3(x, y, z);
        };
        Vector3.Dot = function (left, right) {
            return (left.x * right.x + left.y * right.y + left.z * right.z);
        };
        Vector3.Cross = function (left, right) {
            var result = Vector3.Zero();
            Vector3.CrossToRef(left, right, result);
            return result;
        };
        Vector3.CrossToRef = function (left, right, result) {
            result.x = left.y * right.z - left.z * right.y;
            result.y = left.z * right.x - left.x * right.z;
            result.z = left.x * right.y - left.y * right.x;
        };
        Vector3.Normalize = function (vector) {
            var result = Vector3.Zero();
            Vector3.NormalizeToRef(vector, result);
            return result;
        };
        Vector3.NormalizeToRef = function (vector, result) {
            result.copyFrom(vector);
            result.normalize();
        };
        Vector3.Project = function (vector, world, transform, viewport) {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;
            var viewportMatrix = Matrix.FromValues(cw / 2.0, 0, 0, 0, 0, -ch / 2.0, 0, 0, 0, 0, 1, 0, cx + cw / 2.0, ch / 2.0 + cy, 0, 1);
            var finalMatrix = world.multiply(transform).multiply(viewportMatrix);
            return Vector3.TransformCoordinates(vector, finalMatrix);
        };
        Vector3.UnprojectFromTransform = function (source, viewportWidth, viewportHeight, world, transform) {
            var matrix = world.multiply(transform);
            matrix.invert();
            source.x = source.x / viewportWidth * 2 - 1;
            source.y = -(source.y / viewportHeight * 2 - 1);
            var vector = Vector3.TransformCoordinates(source, matrix);
            var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];
            if (BABYLON.Tools.WithinEpsilon(num, 1.0)) {
                vector = vector.scale(1.0 / num);
            }
            return vector;
        };
        Vector3.Unproject = function (source, viewportWidth, viewportHeight, world, view, projection) {
            var matrix = world.multiply(view).multiply(projection);
            matrix.invert();
            source.x = source.x / viewportWidth * 2 - 1;
            source.y = -(source.y / viewportHeight * 2 - 1);
            var vector = Vector3.TransformCoordinates(source, matrix);
            var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];
            if (BABYLON.Tools.WithinEpsilon(num, 1.0)) {
                vector = vector.scale(1.0 / num);
            }
            return vector;
        };
        Vector3.Minimize = function (left, right) {
            var min = left.clone();
            min.MinimizeInPlace(right);
            return min;
        };
        Vector3.Maximize = function (left, right) {
            var max = left.clone();
            max.MaximizeInPlace(right);
            return max;
        };
        Vector3.Distance = function (value1, value2) {
            return Math.sqrt(Vector3.DistanceSquared(value1, value2));
        };
        Vector3.DistanceSquared = function (value1, value2) {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;
            return (x * x) + (y * y) + (z * z);
        };
        Vector3.Center = function (value1, value2) {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        };
        return Vector3;
    })();
    BABYLON.Vector3 = Vector3;
    //Vector4 class created for EulerAngle class conversion to Quaternion
    var Vector4 = (function () {
        function Vector4(x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        Vector4.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "W:" + this.w + "}";
        };
        // Operators
        Vector4.prototype.asArray = function () {
            var result = [];
            this.toArray(result, 0);
            return result;
        };
        Vector4.prototype.toArray = function (array, index) {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
            array[index + 3] = this.w;
            return this;
        };
        Vector4.prototype.addInPlace = function (otherVector) {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
            this.w += otherVector.w;
            return this;
        };
        Vector4.prototype.add = function (otherVector) {
            return new Vector4(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z, this.w + otherVector.w);
        };
        Vector4.prototype.addToRef = function (otherVector, result) {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
            result.w = this.w + otherVector.w;
            return this;
        };
        Vector4.prototype.subtractInPlace = function (otherVector) {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
            this.w -= otherVector.w;
            return this;
        };
        Vector4.prototype.subtract = function (otherVector) {
            return new Vector4(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z, this.w - otherVector.w);
        };
        Vector4.prototype.subtractToRef = function (otherVector, result) {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
            result.w = this.w - otherVector.w;
            return this;
        };
        Vector4.prototype.subtractFromFloats = function (x, y, z, w) {
            return new Vector4(this.x - x, this.y - y, this.z - z, this.w - w);
        };
        Vector4.prototype.subtractFromFloatsToRef = function (x, y, z, w, result) {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
            result.w = this.w - w;
            return this;
        };
        Vector4.prototype.negate = function () {
            return new Vector4(-this.x, -this.y, -this.z, -this.w);
        };
        Vector4.prototype.scaleInPlace = function (scale) {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            this.w *= scale;
            return this;
        };
        Vector4.prototype.scale = function (scale) {
            return new Vector4(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
        };
        Vector4.prototype.scaleToRef = function (scale, result) {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
            result.w = this.w * scale;
        };
        Vector4.prototype.equals = function (otherVector) {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z && this.w === otherVector.w;
        };
        Vector4.prototype.equalsWithEpsilon = function (otherVector) {
            return Math.abs(this.x - otherVector.x) < BABYLON.Engine.Epsilon && Math.abs(this.y - otherVector.y) < BABYLON.Engine.Epsilon && Math.abs(this.z - otherVector.z) < BABYLON.Engine.Epsilon && Math.abs(this.w - otherVector.w) < BABYLON.Engine.Epsilon;
        };
        Vector4.prototype.equalsToFloats = function (x, y, z, w) {
            return this.x === x && this.y === y && this.z === z && this.w === w;
        };
        Vector4.prototype.multiplyInPlace = function (otherVector) {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
            this.w *= otherVector.w;
            return this;
        };
        Vector4.prototype.multiply = function (otherVector) {
            return new Vector4(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z, this.w * otherVector.w);
        };
        Vector4.prototype.multiplyToRef = function (otherVector, result) {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
            result.w = this.w * otherVector.w;
            return this;
        };
        Vector4.prototype.multiplyByFloats = function (x, y, z, w) {
            return new Vector4(this.x * x, this.y * y, this.z * z, this.w * w);
        };
        Vector4.prototype.divide = function (otherVector) {
            return new Vector4(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z, this.w / otherVector.w);
        };
        Vector4.prototype.divideToRef = function (otherVector, result) {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
            result.w = this.w / otherVector.w;
            return this;
        };
        Vector4.prototype.MinimizeInPlace = function (other) {
            if (other.x < this.x)
                this.x = other.x;
            if (other.y < this.y)
                this.y = other.y;
            if (other.z < this.z)
                this.z = other.z;
            if (other.w < this.w)
                this.w = other.w;
            return this;
        };
        Vector4.prototype.MaximizeInPlace = function (other) {
            if (other.x > this.x)
                this.x = other.x;
            if (other.y > this.y)
                this.y = other.y;
            if (other.z > this.z)
                this.z = other.z;
            if (other.w > this.w)
                this.w = other.w;
            return this;
        };
        // Properties
        Vector4.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        };
        Vector4.prototype.lengthSquared = function () {
            return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        };
        // Methods
        Vector4.prototype.normalize = function () {
            var len = this.length();
            if (len === 0)
                return this;
            var num = 1.0 / len;
            this.x *= num;
            this.y *= num;
            this.z *= num;
            this.w *= num;
            return this;
        };
        Vector4.prototype.clone = function () {
            return new Vector4(this.x, this.y, this.z, this.w);
        };
        Vector4.prototype.copyFrom = function (source) {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            this.w = source.w;
            return this;
        };
        Vector4.prototype.copyFromFloats = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        // Statics
        Vector4.FromArray = function (array, offset) {
            if (!offset) {
                offset = 0;
            }
            return new Vector4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        };
        Vector4.FromArrayToRef = function (array, offset, result) {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
            result.w = array[offset + 3];
        };
        Vector4.FromFloatArrayToRef = function (array, offset, result) {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
            result.w = array[offset + 3];
        };
        Vector4.FromFloatsToRef = function (x, y, z, w, result) {
            result.x = x;
            result.y = y;
            result.z = z;
            result.w = w;
        };
        Vector4.Zero = function () {
            return new Vector4(0, 0, 0, 0);
        };
        Vector4.Normalize = function (vector) {
            var result = Vector4.Zero();
            Vector4.NormalizeToRef(vector, result);
            return result;
        };
        Vector4.NormalizeToRef = function (vector, result) {
            result.copyFrom(vector);
            result.normalize();
        };
        Vector4.Minimize = function (left, right) {
            var min = left.clone();
            min.MinimizeInPlace(right);
            return min;
        };
        Vector4.Maximize = function (left, right) {
            var max = left.clone();
            max.MaximizeInPlace(right);
            return max;
        };
        Vector4.Distance = function (value1, value2) {
            return Math.sqrt(Vector4.DistanceSquared(value1, value2));
        };
        Vector4.DistanceSquared = function (value1, value2) {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;
            var w = value1.w - value2.w;
            return (x * x) + (y * y) + (z * z) + (w * w);
        };
        Vector4.Center = function (value1, value2) {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        };
        return Vector4;
    })();
    BABYLON.Vector4 = Vector4;
    var Quaternion = (function () {
        function Quaternion(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 1; }
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        Quaternion.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        };
        Quaternion.prototype.asArray = function () {
            return [this.x, this.y, this.z, this.w];
        };
        Quaternion.prototype.equals = function (otherQuaternion) {
            return otherQuaternion && this.x === otherQuaternion.x && this.y === otherQuaternion.y && this.z === otherQuaternion.z && this.w === otherQuaternion.w;
        };
        Quaternion.prototype.clone = function () {
            return new Quaternion(this.x, this.y, this.z, this.w);
        };
        Quaternion.prototype.copyFrom = function (other) {
            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;
            return this;
        };
        Quaternion.prototype.copyFromFloats = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        Quaternion.prototype.add = function (other) {
            return new Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
        };
        Quaternion.prototype.subtract = function (other) {
            return new Quaternion(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
        };
        Quaternion.prototype.scale = function (value) {
            return new Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
        };
        Quaternion.prototype.multiply = function (q1) {
            var result = new Quaternion(0, 0, 0, 1.0);
            this.multiplyToRef(q1, result);
            return result;
        };
        Quaternion.prototype.multiplyToRef = function (q1, result) {
            result.x = this.x * q1.w + this.y * q1.z - this.z * q1.y + this.w * q1.x;
            result.y = -this.x * q1.z + this.y * q1.w + this.z * q1.x + this.w * q1.y;
            result.z = this.x * q1.y - this.y * q1.x + this.z * q1.w + this.w * q1.z;
            result.w = -this.x * q1.x - this.y * q1.y - this.z * q1.z + this.w * q1.w;
            return this;
        };
        Quaternion.prototype.length = function () {
            return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
        };
        Quaternion.prototype.normalize = function () {
            var length = 1.0 / this.length();
            this.x *= length;
            this.y *= length;
            this.z *= length;
            this.w *= length;
            return this;
        };
        Quaternion.prototype.toEulerAngles = function () {
            var result = Vector3.Zero();
            this.toEulerAnglesToRef(result);
            return result;
        };
        Quaternion.prototype.toEulerAnglesToRef = function (result) {
            //result is an EulerAngles in the in the z-x-z convention
            var qx = this.x;
            var qy = this.y;
            var qz = this.z;
            var qw = this.w;
            var qxy = qx * qy;
            var qxz = qx * qz;
            var qwy = qw * qy;
            var qwz = qw * qz;
            var qwx = qw * qx;
            var qyz = qy * qz;
            var sqx = qx * qx;
            var sqy = qy * qy;
            var determinant = sqx + sqy;
            if (determinant !== 0.000 && determinant !== 1.000) {
                result.x = Math.atan2(qxz + qwy, qwx - qyz);
                result.y = Math.acos(1 - 2 * determinant);
                result.z = Math.atan2(qxz - qwy, qwx + qyz);
            }
            else {
                if (determinant === 0.0) {
                    result.x = 0.0;
                    result.y = 0.0;
                    result.z = Math.atan2(qxy - qwz, 0.5 - sqy - qz * qz); //actually, degeneracy gives us choice with x+z=Math.atan2(qxy-qwz,0.5-sqy-qz*qz)
                }
                else {
                    result.x = Math.atan2(qxy - qwz, 0.5 - sqy - qz * qz); //actually, degeneracy gives us choice with x-z=Math.atan2(qxy-qwz,0.5-sqy-qz*qz)
                    result.y = Math.PI;
                    result.z = 0.0;
                }
            }
            return this;
        };
        Quaternion.prototype.toRotationMatrix = function (result) {
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
        };
        Quaternion.prototype.fromRotationMatrix = function (matrix) {
            Quaternion.FromRotationMatrixToRef(matrix, this);
            return this;
        };
        // Statics
        Quaternion.FromRotationMatrix = function (matrix) {
            var result = new Quaternion();
            Quaternion.FromRotationMatrixToRef(matrix, result);
            return result;
        };
        Quaternion.FromRotationMatrixToRef = function (matrix, result) {
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
            }
            else if (m11 > m22 && m11 > m33) {
                s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
                result.w = (m32 - m23) / s;
                result.x = 0.25 * s;
                result.y = (m12 + m21) / s;
                result.z = (m13 + m31) / s;
            }
            else if (m22 > m33) {
                s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
                result.w = (m13 - m31) / s;
                result.x = (m12 + m21) / s;
                result.y = 0.25 * s;
                result.z = (m23 + m32) / s;
            }
            else {
                s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
                result.w = (m21 - m12) / s;
                result.x = (m13 + m31) / s;
                result.y = (m23 + m32) / s;
                result.z = 0.25 * s;
            }
        };
        Quaternion.Inverse = function (q) {
            return new Quaternion(-q.x, -q.y, -q.z, q.w);
        };
        Quaternion.Identity = function () {
            return new Quaternion(0, 0, 0, 1);
        };
        Quaternion.RotationAxis = function (axis, angle) {
            var result = new Quaternion();
            var sin = Math.sin(angle / 2);
            result.w = Math.cos(angle / 2);
            result.x = axis.x * sin;
            result.y = axis.y * sin;
            result.z = axis.z * sin;
            return result;
        };
        Quaternion.FromArray = function (array, offset) {
            if (!offset) {
                offset = 0;
            }
            return new Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        };
        Quaternion.RotationYawPitchRoll = function (yaw, pitch, roll) {
            var result = new Quaternion();
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, result);
            return result;
        };
        Quaternion.RotationYawPitchRollToRef = function (yaw, pitch, roll, result) {
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
        };
        Quaternion.RotationAlphaBetaGamma = function (alpha, beta, gamma) {
            var result = new Quaternion();
            Quaternion.RotationAlphaBetaGammaToRef(alpha, beta, gamma, result);
            return result;
        };
        Quaternion.RotationAlphaBetaGammaToRef = function (alpha, beta, gamma, result) {
            // Produces a quaternion from Euler angles in the z-x-z orientation
            var halfGammaPlusAlpha = (gamma + alpha) * 0.5;
            var halfGammaMinusAlpha = (gamma - alpha) * 0.5;
            var halfBeta = beta * 0.5;
            result.x = Math.cos(halfGammaMinusAlpha) * Math.sin(halfBeta);
            result.y = Math.sin(halfGammaMinusAlpha) * Math.sin(halfBeta);
            result.z = Math.sin(halfGammaPlusAlpha) * Math.cos(halfBeta);
            result.w = Math.cos(halfGammaPlusAlpha) * Math.cos(halfBeta);
        };
        Quaternion.Slerp = function (left, right, amount) {
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
        };
        return Quaternion;
    })();
    BABYLON.Quaternion = Quaternion;
    var Matrix = (function () {
        function Matrix() {
            this.m = new Float32Array(16);
        }
        // Properties
        Matrix.prototype.isIdentity = function () {
            if (this.m[0] !== 1.0 || this.m[5] !== 1.0 || this.m[10] !== 1.0 || this.m[15] !== 1.0)
                return false;
            if (this.m[1] !== 0.0 || this.m[2] !== 0.0 || this.m[3] !== 0.0 || this.m[4] !== 0.0 || this.m[6] !== 0.0 || this.m[7] !== 0.0 || this.m[8] !== 0.0 || this.m[9] !== 0.0 || this.m[11] !== 0.0 || this.m[12] !== 0.0 || this.m[13] !== 0.0 || this.m[14] !== 0.0)
                return false;
            return true;
        };
        Matrix.prototype.determinant = function () {
            var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
            var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
            var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
            var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
            var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
            var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);
            return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) - (this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) - (this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
        };
        // Methods
        Matrix.prototype.toArray = function () {
            return this.m;
        };
        Matrix.prototype.asArray = function () {
            return this.toArray();
        };
        Matrix.prototype.invert = function () {
            this.invertToRef(this);
            return this;
        };
        Matrix.prototype.invertToRef = function (other) {
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
        };
        Matrix.prototype.setTranslation = function (vector3) {
            this.m[12] = vector3.x;
            this.m[13] = vector3.y;
            this.m[14] = vector3.z;
            return this;
        };
        Matrix.prototype.multiply = function (other) {
            var result = new Matrix();
            this.multiplyToRef(other, result);
            return result;
        };
        Matrix.prototype.copyFrom = function (other) {
            for (var index = 0; index < 16; index++) {
                this.m[index] = other.m[index];
            }
            return this;
        };
        Matrix.prototype.copyToArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            for (var index = 0; index < 16; index++) {
                array[offset + index] = this.m[index];
            }
            return this;
        };
        Matrix.prototype.multiplyToRef = function (other, result) {
            this.multiplyToArray(other, result.m, 0);
            return this;
        };
        Matrix.prototype.multiplyToArray = function (other, result, offset) {
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
        };
        Matrix.prototype.equals = function (value) {
            return value && (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] && this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] && this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] && this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
        };
        Matrix.prototype.clone = function () {
            return Matrix.FromValues(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5], this.m[6], this.m[7], this.m[8], this.m[9], this.m[10], this.m[11], this.m[12], this.m[13], this.m[14], this.m[15]);
        };
        Matrix.prototype.decompose = function (scale, rotation, translation) {
            translation.x = this.m[12];
            translation.y = this.m[13];
            translation.z = this.m[14];
            var xs = BABYLON.Tools.Sign(this.m[0] * this.m[1] * this.m[2] * this.m[3]) < 0 ? -1 : 1;
            var ys = BABYLON.Tools.Sign(this.m[4] * this.m[5] * this.m[6] * this.m[7]) < 0 ? -1 : 1;
            var zs = BABYLON.Tools.Sign(this.m[8] * this.m[9] * this.m[10] * this.m[11]) < 0 ? -1 : 1;
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
            var rotationMatrix = Matrix.FromValues(this.m[0] / scale.x, this.m[1] / scale.x, this.m[2] / scale.x, 0, this.m[4] / scale.y, this.m[5] / scale.y, this.m[6] / scale.y, 0, this.m[8] / scale.z, this.m[9] / scale.z, this.m[10] / scale.z, 0, 0, 0, 0, 1);
            Quaternion.FromRotationMatrixToRef(rotationMatrix, rotation);
            return true;
        };
        // Statics
        Matrix.FromArray = function (array, offset) {
            var result = new Matrix();
            if (!offset) {
                offset = 0;
            }
            Matrix.FromArrayToRef(array, offset, result);
            return result;
        };
        Matrix.FromArrayToRef = function (array, offset, result) {
            for (var index = 0; index < 16; index++) {
                result.m[index] = array[index + offset];
            }
        };
        Matrix.FromValuesToRef = function (initialM11, initialM12, initialM13, initialM14, initialM21, initialM22, initialM23, initialM24, initialM31, initialM32, initialM33, initialM34, initialM41, initialM42, initialM43, initialM44, result) {
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
        };
        Matrix.FromValues = function (initialM11, initialM12, initialM13, initialM14, initialM21, initialM22, initialM23, initialM24, initialM31, initialM32, initialM33, initialM34, initialM41, initialM42, initialM43, initialM44) {
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
        };
        Matrix.Compose = function (scale, rotation, translation) {
            var result = Matrix.FromValues(scale.x, 0, 0, 0, 0, scale.y, 0, 0, 0, 0, scale.z, 0, 0, 0, 0, 1);
            var rotationMatrix = Matrix.Identity();
            rotation.toRotationMatrix(rotationMatrix);
            result = result.multiply(rotationMatrix);
            result.setTranslation(translation);
            return result;
        };
        Matrix.Identity = function () {
            return Matrix.FromValues(1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0);
        };
        Matrix.IdentityToRef = function (result) {
            Matrix.FromValuesToRef(1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, result);
        };
        Matrix.Zero = function () {
            return Matrix.FromValues(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        Matrix.RotationX = function (angle) {
            var result = new Matrix();
            Matrix.RotationXToRef(angle, result);
            return result;
        };
        Matrix.Invert = function (source) {
            var result = new Matrix();
            source.invertToRef(result);
            return result;
        };
        Matrix.RotationXToRef = function (angle, result) {
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
        };
        Matrix.RotationY = function (angle) {
            var result = new Matrix();
            Matrix.RotationYToRef(angle, result);
            return result;
        };
        Matrix.RotationYToRef = function (angle, result) {
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
        };
        Matrix.RotationZ = function (angle) {
            var result = new Matrix();
            Matrix.RotationZToRef(angle, result);
            return result;
        };
        Matrix.RotationZToRef = function (angle, result) {
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
        };
        Matrix.RotationAxis = function (axis, angle) {
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
        };
        Matrix.RotationYawPitchRoll = function (yaw, pitch, roll) {
            var result = new Matrix();
            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, result);
            return result;
        };
        Matrix.RotationYawPitchRollToRef = function (yaw, pitch, roll, result) {
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, this._tempQuaternion);
            this._tempQuaternion.toRotationMatrix(result);
        };
        Matrix.Scaling = function (x, y, z) {
            var result = Matrix.Zero();
            Matrix.ScalingToRef(x, y, z, result);
            return result;
        };
        Matrix.ScalingToRef = function (x, y, z, result) {
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
        };
        Matrix.Translation = function (x, y, z) {
            var result = Matrix.Identity();
            Matrix.TranslationToRef(x, y, z, result);
            return result;
        };
        Matrix.TranslationToRef = function (x, y, z, result) {
            Matrix.FromValuesToRef(1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, x, y, z, 1.0, result);
        };
        Matrix.LookAtLH = function (eye, target, up) {
            var result = Matrix.Zero();
            Matrix.LookAtLHToRef(eye, target, up, result);
            return result;
        };
        Matrix.LookAtLHToRef = function (eye, target, up, result) {
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
            return Matrix.FromValuesToRef(this._xAxis.x, this._yAxis.x, this._zAxis.x, 0, this._xAxis.y, this._yAxis.y, this._zAxis.y, 0, this._xAxis.z, this._yAxis.z, this._zAxis.z, 0, ex, ey, ez, 1, result);
        };
        Matrix.OrthoLH = function (width, height, znear, zfar) {
            var hw = 2.0 / width;
            var hh = 2.0 / height;
            var id = 1.0 / (zfar - znear);
            var nid = znear / (znear - zfar);
            return Matrix.FromValues(hw, 0, 0, 0, 0, hh, 0, 0, 0, 0, id, 0, 0, 0, nid, 1);
        };
        Matrix.OrthoOffCenterLH = function (left, right, bottom, top, znear, zfar) {
            var matrix = Matrix.Zero();
            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix);
            return matrix;
        };
        Matrix.OrthoOffCenterLHToRef = function (left, right, bottom, top, znear, zfar, result) {
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
        };
        Matrix.PerspectiveLH = function (width, height, znear, zfar) {
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
        };
        Matrix.PerspectiveFovLH = function (fov, aspect, znear, zfar) {
            var matrix = Matrix.Zero();
            Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix);
            return matrix;
        };
        Matrix.PerspectiveFovLHToRef = function (fov, aspect, znear, zfar, result, fovMode) {
            if (fovMode === void 0) { fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED; }
            var tan = 1.0 / (Math.tan(fov * 0.5));
            var v_fixed = (fovMode === BABYLON.Camera.FOVMODE_VERTICAL_FIXED);
            if (v_fixed) {
                result.m[0] = tan / aspect;
            }
            else {
                result.m[0] = tan;
            }
            result.m[1] = result.m[2] = result.m[3] = 0.0;
            if (v_fixed) {
                result.m[5] = tan;
            }
            else {
                result.m[5] = tan * aspect;
            }
            result.m[4] = result.m[6] = result.m[7] = 0.0;
            result.m[8] = result.m[9] = 0.0;
            result.m[10] = -zfar / (znear - zfar);
            result.m[11] = 1.0;
            result.m[12] = result.m[13] = result.m[15] = 0.0;
            result.m[14] = (znear * zfar) / (znear - zfar);
        };
        Matrix.GetFinalMatrix = function (viewport, world, view, projection, zmin, zmax) {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;
            var viewportMatrix = Matrix.FromValues(cw / 2.0, 0, 0, 0, 0, -ch / 2.0, 0, 0, 0, 0, zmax - zmin, 0, cx + cw / 2.0, ch / 2.0 + cy, zmin, 1);
            return world.multiply(view).multiply(projection).multiply(viewportMatrix);
        };
        Matrix.Transpose = function (matrix) {
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
        };
        Matrix.Reflection = function (plane) {
            var matrix = new Matrix();
            Matrix.ReflectionToRef(plane, matrix);
            return matrix;
        };
        Matrix.ReflectionToRef = function (plane, result) {
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
        };
        Matrix._tempQuaternion = new Quaternion();
        Matrix._xAxis = Vector3.Zero();
        Matrix._yAxis = Vector3.Zero();
        Matrix._zAxis = Vector3.Zero();
        return Matrix;
    })();
    BABYLON.Matrix = Matrix;
    var Plane = (function () {
        function Plane(a, b, c, d) {
            this.normal = new Vector3(a, b, c);
            this.d = d;
        }
        Plane.prototype.asArray = function () {
            return [this.normal.x, this.normal.y, this.normal.z, this.d];
        };
        // Methods
        Plane.prototype.clone = function () {
            return new Plane(this.normal.x, this.normal.y, this.normal.z, this.d);
        };
        Plane.prototype.normalize = function () {
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
        };
        Plane.prototype.transform = function (transformation) {
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
        };
        Plane.prototype.dotCoordinate = function (point) {
            return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
        };
        Plane.prototype.copyFromPoints = function (point1, point2, point3) {
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
        };
        Plane.prototype.isFrontFacingTo = function (direction, epsilon) {
            var dot = Vector3.Dot(this.normal, direction);
            return (dot <= epsilon);
        };
        Plane.prototype.signedDistanceTo = function (point) {
            return Vector3.Dot(point, this.normal) + this.d;
        };
        // Statics
        Plane.FromArray = function (array) {
            return new Plane(array[0], array[1], array[2], array[3]);
        };
        Plane.FromPoints = function (point1, point2, point3) {
            var result = new Plane(0, 0, 0, 0);
            result.copyFromPoints(point1, point2, point3);
            return result;
        };
        Plane.FromPositionAndNormal = function (origin, normal) {
            var result = new Plane(0, 0, 0, 0);
            normal.normalize();
            result.normal = normal;
            result.d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
            return result;
        };
        Plane.SignedDistanceToPlaneFromPositionAndNormal = function (origin, normal, point) {
            var d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
            return Vector3.Dot(point, normal) + d;
        };
        return Plane;
    })();
    BABYLON.Plane = Plane;
    var Viewport = (function () {
        function Viewport(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Viewport.prototype.toGlobal = function (engine) {
            var width = engine.getRenderWidth();
            var height = engine.getRenderHeight();
            return new Viewport(this.x * width, this.y * height, this.width * width, this.height * height);
        };
        return Viewport;
    })();
    BABYLON.Viewport = Viewport;
    var Frustum = (function () {
        function Frustum() {
        }
        Frustum.GetPlanes = function (transform) {
            var frustumPlanes = [];
            for (var index = 0; index < 6; index++) {
                frustumPlanes.push(new Plane(0, 0, 0, 0));
            }
            Frustum.GetPlanesToRef(transform, frustumPlanes);
            return frustumPlanes;
        };
        Frustum.GetPlanesToRef = function (transform, frustumPlanes) {
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
        };
        return Frustum;
    })();
    BABYLON.Frustum = Frustum;
    var Ray = (function () {
        function Ray(origin, direction, length) {
            if (length === void 0) { length = Number.MAX_VALUE; }
            this.origin = origin;
            this.direction = direction;
            this.length = length;
        }
        // Methods
        Ray.prototype.intersectsBoxMinMax = function (minimum, maximum) {
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
                if (max === -Infinity) {
                    max = Infinity;
                }
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
                if (max === -Infinity) {
                    max = Infinity;
                }
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
                if (max === -Infinity) {
                    max = Infinity;
                }
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
        };
        Ray.prototype.intersectsBox = function (box) {
            return this.intersectsBoxMinMax(box.minimum, box.maximum);
        };
        Ray.prototype.intersectsSphere = function (sphere) {
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
        };
        Ray.prototype.intersectsTriangle = function (vertex0, vertex1, vertex2) {
            if (!this._edge1) {
                this._edge1 = Vector3.Zero();
                this._edge2 = Vector3.Zero();
                this._pvec = Vector3.Zero();
                this._tvec = Vector3.Zero();
                this._qvec = Vector3.Zero();
            }
            vertex1.subtractToRef(vertex0, this._edge1);
            vertex2.subtractToRef(vertex0, this._edge2);
            Vector3.CrossToRef(this.direction, this._edge2, this._pvec);
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
            //check if the distance is longer than the predefined length.
            var distance = Vector3.Dot(this._edge2, this._qvec) * invdet;
            if (distance > this.length) {
                return null;
            }
            return new BABYLON.IntersectionInfo(bu, bv, distance);
        };
        // Statics
        Ray.CreateNew = function (x, y, viewportWidth, viewportHeight, world, view, projection) {
            var start = Vector3.Unproject(new Vector3(x, y, 0), viewportWidth, viewportHeight, world, view, projection);
            var end = Vector3.Unproject(new Vector3(x, y, 1), viewportWidth, viewportHeight, world, view, projection);
            var direction = end.subtract(start);
            direction.normalize();
            return new Ray(start, direction);
        };
        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        */
        Ray.CreateNewFromTo = function (origin, end, world) {
            if (world === void 0) { world = Matrix.Identity(); }
            var direction = end.subtract(origin);
            var length = Math.sqrt((direction.x * direction.x) + (direction.y * direction.y) + (direction.z * direction.z));
            direction.normalize();
            return Ray.Transform(new Ray(origin, direction, length), world);
        };
        Ray.Transform = function (ray, matrix) {
            var newOrigin = Vector3.TransformCoordinates(ray.origin, matrix);
            var newDirection = Vector3.TransformNormal(ray.direction, matrix);
            return new Ray(newOrigin, newDirection, ray.length);
        };
        return Ray;
    })();
    BABYLON.Ray = Ray;
    (function (Space) {
        Space[Space["LOCAL"] = 0] = "LOCAL";
        Space[Space["WORLD"] = 1] = "WORLD";
    })(BABYLON.Space || (BABYLON.Space = {}));
    var Space = BABYLON.Space;
    var Axis = (function () {
        function Axis() {
        }
        Axis.X = new Vector3(1, 0, 0);
        Axis.Y = new Vector3(0, 1, 0);
        Axis.Z = new Vector3(0, 0, 1);
        return Axis;
    })();
    BABYLON.Axis = Axis;
    ;
    var BezierCurve = (function () {
        function BezierCurve() {
        }
        BezierCurve.interpolate = function (t, x1, y1, x2, y2) {
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
            return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 + 3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 + Math.pow(refinedT, 3);
        };
        return BezierCurve;
    })();
    BABYLON.BezierCurve = BezierCurve;
    (function (Orientation) {
        Orientation[Orientation["CW"] = 0] = "CW";
        Orientation[Orientation["CCW"] = 1] = "CCW";
    })(BABYLON.Orientation || (BABYLON.Orientation = {}));
    var Orientation = BABYLON.Orientation;
    var Angle = (function () {
        function Angle(radians) {
            var _this = this;
            this.degrees = function () { return _this._radians * 180 / Math.PI; };
            this.radians = function () { return _this._radians; };
            this._radians = radians;
            if (this._radians < 0)
                this._radians += (2 * Math.PI);
        }
        Angle.BetweenTwoPoints = function (a, b) {
            var delta = b.subtract(a);
            var theta = Math.atan2(delta.y, delta.x);
            return new Angle(theta);
        };
        Angle.FromRadians = function (radians) {
            return new Angle(radians);
        };
        Angle.FromDegrees = function (degrees) {
            return new Angle(degrees * Math.PI / 180);
        };
        return Angle;
    })();
    BABYLON.Angle = Angle;
    var Arc2 = (function () {
        function Arc2(startPoint, midPoint, endPoint) {
            this.startPoint = startPoint;
            this.midPoint = midPoint;
            this.endPoint = endPoint;
            var temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
            var startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2.;
            var midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2.;
            var det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);
            this.centerPoint = new Vector2((startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det, ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det);
            this.radius = this.centerPoint.subtract(this.startPoint).length();
            this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);
            var a1 = this.startAngle.degrees();
            var a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
            var a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();
            // angles correction
            if (a2 - a1 > +180.0)
                a2 -= 360.0;
            if (a2 - a1 < -180.0)
                a2 += 360.0;
            if (a3 - a2 > +180.0)
                a3 -= 360.0;
            if (a3 - a2 < -180.0)
                a3 += 360.0;
            this.orientation = (a2 - a1) < 0 ? 0 /* CW */ : 1 /* CCW */;
            this.angle = Angle.FromDegrees(this.orientation === 0 /* CW */ ? a1 - a3 : a3 - a1);
        }
        return Arc2;
    })();
    BABYLON.Arc2 = Arc2;
    var PathCursor = (function () {
        function PathCursor(path) {
            this.path = path;
            this._onchange = new Array();
            this.value = 0;
            this.animations = new Array();
        }
        PathCursor.prototype.getPoint = function () {
            var point = this.path.getPointAtLengthPosition(this.value);
            return new Vector3(point.x, 0, point.y);
        };
        PathCursor.prototype.moveAhead = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(step);
            return this;
        };
        PathCursor.prototype.moveBack = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(-step);
            return this;
        };
        PathCursor.prototype.move = function (step) {
            if (Math.abs(step) > 1) {
                throw "step size should be less than 1.";
            }
            this.value += step;
            this.ensureLimits();
            this.raiseOnChange();
            return this;
        };
        PathCursor.prototype.ensureLimits = function () {
            while (this.value > 1) {
                this.value -= 1;
            }
            while (this.value < 0) {
                this.value += 1;
            }
            return this;
        };
        // used by animation engine
        PathCursor.prototype.markAsDirty = function (propertyName) {
            this.ensureLimits();
            this.raiseOnChange();
            return this;
        };
        PathCursor.prototype.raiseOnChange = function () {
            var _this = this;
            this._onchange.forEach(function (f) { return f(_this); });
            return this;
        };
        PathCursor.prototype.onchange = function (f) {
            this._onchange.push(f);
            return this;
        };
        return PathCursor;
    })();
    BABYLON.PathCursor = PathCursor;
    var Path2 = (function () {
        function Path2(x, y) {
            this._points = [];
            this._length = 0;
            this.closed = false;
            this._points.push(new Vector2(x, y));
        }
        Path2.prototype.addLineTo = function (x, y) {
            if (closed) {
                BABYLON.Tools.Error("cannot add lines to closed paths");
                return this;
            }
            var newPoint = new Vector2(x, y);
            var previousPoint = this._points[this._points.length - 1];
            this._points.push(newPoint);
            this._length += newPoint.subtract(previousPoint).length();
            return this;
        };
        Path2.prototype.addArcTo = function (midX, midY, endX, endY, numberOfSegments) {
            if (numberOfSegments === void 0) { numberOfSegments = 36; }
            if (closed) {
                BABYLON.Tools.Error("cannot add arcs to closed paths");
                return this;
            }
            var startPoint = this._points[this._points.length - 1];
            var midPoint = new Vector2(midX, midY);
            var endPoint = new Vector2(endX, endY);
            var arc = new Arc2(startPoint, midPoint, endPoint);
            var increment = arc.angle.radians() / numberOfSegments;
            if (arc.orientation === 0 /* CW */)
                increment *= -1;
            var currentAngle = arc.startAngle.radians() + increment;
            for (var i = 0; i < numberOfSegments; i++) {
                var x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
                var y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
                this.addLineTo(x, y);
                currentAngle += increment;
            }
            return this;
        };
        Path2.prototype.close = function () {
            this.closed = true;
            return this;
        };
        Path2.prototype.length = function () {
            var result = this._length;
            if (!this.closed) {
                var lastPoint = this._points[this._points.length - 1];
                var firstPoint = this._points[0];
                result += (firstPoint.subtract(lastPoint).length());
            }
            return result;
        };
        Path2.prototype.getPoints = function () {
            return this._points;
        };
        Path2.prototype.getPointAtLengthPosition = function (normalizedLengthPosition) {
            if (normalizedLengthPosition < 0 || normalizedLengthPosition > 1) {
                BABYLON.Tools.Error("normalized length position should be between 0 and 1.");
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
                    return new Vector2(a.x + (dir.x * localOffset), a.y + (dir.y * localOffset));
                }
                previousOffset = nextOffset;
            }
            BABYLON.Tools.Error("internal error");
            return Vector2.Zero();
        };
        Path2.StartingAt = function (x, y) {
            return new Path2(x, y);
        };
        return Path2;
    })();
    BABYLON.Path2 = Path2;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=../Math/babylon.math.js.map