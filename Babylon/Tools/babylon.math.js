var BABYLON = BABYLON || {};

(function () {
    ////////////////////////////////// Ray //////////////////////////////////

    BABYLON.Ray = function (origin, direction) {
        this.origin = origin;
        this.direction = direction;
    };

    // Methods
    BABYLON.Ray.prototype.intersectsBox = function (box) {
        var d = 0.0;
        var maxValue = Number.MAX_VALUE;

        if (Math.abs(this.direction.x) < 0.0000001) {
            if (this.origin.x < box.minimum.x || this.origin.x > box.maximum.x) {
                return false;
            }
        }
        else {
            var inv = 1.0 / this.direction.x;
            var min = (box.minimum.x - this.origin.x) * inv;
            var max = (box.maximum.x - this.origin.x) * inv;

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
            if (this.origin.y < box.minimum.y || this.origin.y > box.maximum.y) {
                return false;
            }
        }
        else {
            var inv = 1.0 / this.direction.y;
            var min = (box.minimum.y - this.origin.y) * inv;
            var max = (box.maximum.y - this.origin.y) * inv;

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

        if (Math.abs(this.direction.z) < 0.0000001) {
            if (this.origin.z < box.minimum.z || this.origin.z > box.maximum.z) {
                return false;
            }
        }
        else {
            var inv = 1.0 / this.direction.z;
            var min = (box.minimum.z - this.origin.z) * inv;
            var max = (box.maximum.z - this.origin.z) * inv;

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
        return true;
    };

    BABYLON.Ray.prototype.intersectsSphere = function (sphere) {
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

    BABYLON.Ray.prototype.intersectsTriangle = function (vertex0, vertex1, vertex2) {
        var edge1 = vertex1.subtract(vertex0);
        var edge2 = vertex2.subtract(vertex0);
        var pvec = BABYLON.Vector3.Cross(this.direction, edge2);
        var det = BABYLON.Vector3.Dot(edge1, pvec);

        if (det === 0) {
            return {
                hit: false,
                distance: 0,
                bu: 0,
                bv: 0
            };
        }

        var invdet = 1 / det;

        var tvec = this.origin.subtract(vertex0);

        var bu = BABYLON.Vector3.Dot(tvec, pvec) * invdet;

        if (bu < 0 || bu > 1.0) {
            return {
                hit: false,
                distance: 0,
                bu: bu,
                bv: 0
            };
        }

        var qvec = BABYLON.Vector3.Cross(tvec, edge1);

        bv = BABYLON.Vector3.Dot(this.direction, qvec) * invdet;

        if (bv < 0 || bu + bv > 1.0) {
            return {
                hit: false,
                distance: 0,
                bu: bu,
                bv: bv
            };
        }

        distance = BABYLON.Vector3.Dot(edge2, qvec) * invdet;

        return {
            hit: true,
            distance: distance,
            bu: bu,
            bv: bv
        };
    };

    // Statics
    BABYLON.Ray.CreateNew = function (x, y, viewportWidth, viewportHeight, world, view, projection) {
        var start = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 0), viewportWidth, viewportHeight, world, view, projection);
        var end = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 1), viewportWidth, viewportHeight, world, view, projection);

        var direction = end.subtract(start);
        direction.normalize();

        return new BABYLON.Ray(start, direction);
    };

    ////////////////////////////////// Color3 //////////////////////////////////

    BABYLON.Color3 = function (initialR, initialG, initialB) {
        this.r = initialR;
        this.g = initialG;
        this.b = initialB;
    };

    BABYLON.Color3.prototype.toString = function () {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
    };

    // Operators
    BABYLON.Color3.prototype.multiply = function (otherColor) {
        return new BABYLON.Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
    };

    BABYLON.Color3.prototype.multiplyToRef = function (otherColor, result) {
        result.r = this.r * otherColor.r;
        result.g = this.g * otherColor.g;
        result.b = this.b * otherColor.b;
    };

    BABYLON.Color3.prototype.equals = function (otherColor) {
        return this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
    };

    BABYLON.Color3.prototype.scale = function (scale) {
        return new BABYLON.Color3(this.r * scale, this.g * scale, this.b * scale);
    };

    BABYLON.Color3.prototype.scaleToRef = function (scale, result) {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
    };

    BABYLON.Color3.prototype.clone = function () {
        return new BABYLON.Color3(this.r, this.g, this.b);
    };

    BABYLON.Color3.prototype.copyFrom = function (source) {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
    };

    BABYLON.Color3.prototype.copyFromFloats = function (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    };

    // Statics
    BABYLON.Color3.FromArray = function (array) {
        return new BABYLON.Color3(array[0], array[1], array[2]);
    };

    ////////////////////////////////// Color4 //////////////////////////////////

    BABYLON.Color4 = function (initialR, initialG, initialB, initialA) {
        this.r = initialR;
        this.g = initialG;
        this.b = initialB;
        this.a = initialA;
    };

    // Operators
    BABYLON.Color4.prototype.addInPlace = function (right) {
        this.r += right.r;
        this.g += right.g;
        this.b += right.b;
        this.a += right.a;
    };

    BABYLON.Color4.prototype.add = function (right) {
        return new BABYLON.Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
    };

    BABYLON.Color4.prototype.subtract = function (right) {
        return new BABYLON.Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
    };

    BABYLON.Color4.prototype.subtractToRef = function (right, result) {
        result.r = this.r - right.r;
        result.g = this.g - right.g;
        result.b = this.b - right.b;
        result.a = this.a - right.a;
    };

    BABYLON.Color4.prototype.scale = function (scale) {
        return new BABYLON.Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
    };

    BABYLON.Color4.prototype.scaleToRef = function (scale, result) {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        result.a = this.a * scale;
    };

    BABYLON.Color4.prototype.toString = function () {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
    };

    BABYLON.Color4.prototype.clone = function () {
        return new BABYLON.Color4(this.r, this.g, this.b, this.a);
    };

    // Statics
    BABYLON.Color4.Lerp = function (left, right, amount) {
        var result = new BABYLON.Color4(0, 0, 0, 0);

        BABYLON.Color4.LerpToRef(left, right, amount, result);

        return result;
    };

    BABYLON.Color4.LerpToRef = function (left, right, amount, result) {
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
        result.a = left.a + (right.a - left.a) * amount;
    };

    BABYLON.Color4.FromArray = function (array, offset) {
        if (!offset) {
            offset = 0;
        }

        return new BABYLON.Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    };

    ////////////////////////////////// Vector2 //////////////////////////////////

    BABYLON.Vector2 = function (initialX, initialY) {
        this.x = initialX;
        this.y = initialY;
    };

    BABYLON.Vector2.prototype.toString = function () {
        return "{X: " + this.x + " Y:" + this.y + "}";
    };

    // Operators
    BABYLON.Vector2.prototype.add = function (otherVector) {
        return new BABYLON.Vector2(this.x + otherVector.x, this.y + otherVector.y);
    };

    BABYLON.Vector2.prototype.subtract = function (otherVector) {
        return new BABYLON.Vector2(this.x - otherVector.x, this.y - otherVector.y);
    };

    BABYLON.Vector2.prototype.negate = function () {
        return new BABYLON.Vector2(-this.x, -this.y);
    };

    BABYLON.Vector2.prototype.scaleInPlace = function (scale) {
        this.x *= scale;
        this.y *= scale;
    };

    BABYLON.Vector2.prototype.scale = function (scale) {
        return new BABYLON.Vector2(this.x * scale, this.y * scale);
    };

    BABYLON.Vector2.prototype.equals = function (otherVector) {
        return this.x === otherVector.x && this.y === otherVector.y;
    };

    // Properties
    BABYLON.Vector2.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    BABYLON.Vector2.prototype.lengthSquared = function () {
        return (this.x * this.x + this.y * this.y);
    };

    // Methods
    BABYLON.Vector2.prototype.normalize = function () {
        var len = this.length();

        if (len === 0)
            return;

        var num = 1.0 / len;

        this.x *= num;
        this.y *= num;
    };

    BABYLON.Vector2.prototype.clone = function () {
        return new BABYLON.Vector2(this.x, this.y);
    };

    // Statics
    BABYLON.Vector2.Zero = function () {
        return new BABYLON.Vector2(0, 0);
    };

    BABYLON.Vector2.CatmullRom = function (value1, value2, value3, value4, amount) {
        var squared = amount * amount;
        var cubed = amount * squared;

        var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
                (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
            ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

        var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
                (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
            ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Clamp = function (value, min, max) {
        var x = value.x;
        x = (x > max.x) ? max.x : x;
        x = (x < min.x) ? min.x : x;

        var y = value.y;
        y = (y > max.y) ? max.y : y;
        y = (y < min.y) ? min.y : y;

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Hermite = function (value1, tangent1, value2, tangent2, amount) {
        var squared = amount * amount;
        var cubed = amount * squared;
        var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        var part2 = (-2.0 * cubed) + (3.0 * squared);
        var part3 = (cubed - (2.0 * squared)) + amount;
        var part4 = cubed - squared;

        var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
        var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Lerp = function (start, end, amount) {
        var x = start.x + ((end.x - start.x) * amount);
        var y = start.y + ((end.y - start.y) * amount);

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Dot = function (left, right) {
        return left.x * right.x + left.y * right.y;
    };

    BABYLON.Vector2.Normalize = function (vector) {
        var newVector = vector.clone();
        newVector.normalize();
        return newVector;
    };

    BABYLON.Vector2.Minimize = function (left, right) {
        var x = (left.x < right.x) ? left.x : right.x;
        var y = (left.y < right.y) ? left.y : right.y;

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Maximize = function (left, right) {
        var x = (left.x > right.x) ? left.x : right.x;
        var y = (left.y > right.y) ? left.y : right.y;

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Transform = function (vector, transformation) {
        var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]);
        var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]);

        return new BABYLON.Vector2(x, y);
    };

    BABYLON.Vector2.Distance = function (value1, value2) {
        return Math.sqrt(BABYLON.Vector2.DistanceSquared(value1, value2));
    };

    BABYLON.Vector2.DistanceSquared = function (value1, value2) {
        var x = value1.x - value2.x;
        var y = value1.y - value2.y;

        return (x * x) + (y * y);
    };

    ////////////////////////////////// Vector3 //////////////////////////////////

    BABYLON.Vector3 = function (initialX, initialY, initialZ) {
        this.x = initialX;
        this.y = initialY;
        this.z = initialZ;
    };

    BABYLON.Vector3.prototype.toString = function () {
        return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
    };

    // Operators
    BABYLON.Vector3.prototype.toArray = function (array, index) {
        array[index] = this.x;
        array[index + 1] = this.y;
        array[index + 2] = this.z;
    };

    BABYLON.Vector3.prototype.addInPlace = function (otherVector) {
        this.x += otherVector.x;
        this.y += otherVector.y;
        this.z += otherVector.z;
    };

    BABYLON.Vector3.prototype.add = function (otherVector) {
        return new BABYLON.Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
    };

    BABYLON.Vector3.prototype.addToRef = function (otherVector, result) {
        result.x = this.x + otherVector.x;
        result.y = this.y + otherVector.y;
        result.z = this.z + otherVector.z;
    };

    BABYLON.Vector3.prototype.subtractInPlace = function (otherVector) {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        this.z -= otherVector.z;
    };

    BABYLON.Vector3.prototype.subtract = function (otherVector) {
        return new BABYLON.Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
    };

    BABYLON.Vector3.prototype.subtractToRef = function (otherVector, result) {
        result.x = this.x - otherVector.x;
        result.y = this.y - otherVector.y;
        result.z = this.z - otherVector.z;
    };

    BABYLON.Vector3.prototype.subtractFromFloats = function (x, y, z) {
        return new BABYLON.Vector3(this.x - x, this.y - y, this.z - z);
    };

    BABYLON.Vector3.prototype.subtractFromFloatsToRef = function (x, y, z, result) {
        result.x = this.x - x;
        result.y = this.y - y;
        result.z = this.z - z;
    };

    BABYLON.Vector3.prototype.negate = function () {
        return new BABYLON.Vector3(-this.x, -this.y, -this.z);
    };

    BABYLON.Vector3.prototype.scaleInPlace = function (scale) {
        this.x *= scale;
        this.y *= scale;
        this.z *= scale;
    };

    BABYLON.Vector3.prototype.scale = function (scale) {
        return new BABYLON.Vector3(this.x * scale, this.y * scale, this.z * scale);
    };

    BABYLON.Vector3.prototype.scaleToRef = function (scale, result) {
        result.x = this.x * scale;
        result.y = this.y * scale;
        result.z = this.z * scale;
    };

    BABYLON.Vector3.prototype.equals = function (otherVector) {
        return this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
    };

    BABYLON.Vector3.prototype.equalsToFloats = function (x, y, z) {
        return this.x === x && this.y === y && this.z === z;
    };

    BABYLON.Vector3.prototype.multiplyInPlace = function (otherVector) {
        this.x *= otherVector.x;
        this.y *= otherVector.y;
        this.z *= otherVector.z;
    };

    BABYLON.Vector3.prototype.multiply = function (otherVector) {
        return new BABYLON.Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
    };

    BABYLON.Vector3.prototype.multiplyToRef = function (otherVector, result) {
        result.x = this.x * otherVector.x;
        result.y = this.y * otherVector.y;
        result.z = this.z * otherVector.z;
    };

    BABYLON.Vector3.prototype.multiplyByFloats = function (x, y, z) {
        return new BABYLON.Vector3(this.x * x, this.y * y, this.z * z);
    };

    BABYLON.Vector3.prototype.divide = function (otherVector) {
        return new BABYLON.Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
    };

    BABYLON.Vector3.prototype.divideToRef = function (otherVector, result) {
        result.x = this.x / otherVector.x;
        result.y = this.y / otherVector.y;
        result.z = this.z / otherVector.z;
    };

    // Properties
    BABYLON.Vector3.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };

    BABYLON.Vector3.prototype.lengthSquared = function () {
        return (this.x * this.x + this.y * this.y + this.z * this.z);
    };

    // Methods
    BABYLON.Vector3.prototype.normalize = function () {
        var len = this.length();

        if (len === 0)
            return;

        var num = 1.0 / len;

        this.x *= num;
        this.y *= num;
        this.z *= num;
    };

    BABYLON.Vector3.prototype.clone = function () {
        return new BABYLON.Vector3(this.x, this.y, this.z);
    };

    BABYLON.Vector3.prototype.copyFrom = function (source) {
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
    };

    BABYLON.Vector3.prototype.copyFromFloats = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    // Statics
    BABYLON.Vector3.FromArray = function (array, offset) {
        if (!offset) {
            offset = 0;
        }

        return new BABYLON.Vector3(array[offset], array[offset + 1], array[offset + 2]);
    };

    BABYLON.Vector3.FromArrayToRef = function (array, offset, result) {
        if (!offset) {
            offset = 0;
        }

        result.x = array[offset];
        result.y = array[offset + 1];
        result.z = array[offset + 2];
    };

    BABYLON.Vector3.FromFloatsToRef = function (x, y, z, result) {
        result.x = x;
        result.y = y;
        result.z = z;
    };

    BABYLON.Vector3.Zero = function () {
        return new BABYLON.Vector3(0, 0, 0);
    };

    BABYLON.Vector3.Up = function () {
        return new BABYLON.Vector3(0, 1.0, 0);
    };

    BABYLON.Vector3.TransformCoordinates = function (vector, transformation) {
        var result = BABYLON.Vector3.Zero();

        BABYLON.Vector3.TransformCoordinatesToRef(vector, transformation, result);

        return result;
    };

    BABYLON.Vector3.TransformCoordinatesToRef = function (vector, transformation, result) {
        var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
        var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
        var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
        var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];

        result.x = x / w;
        result.y = y / w;
        result.z = z / w;
    };

    BABYLON.Vector3.TransformCoordinatesFromFloatsToRef = function (x, y, z, transformation, result) {
        var rx = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]) + transformation.m[12];
        var ry = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]) + transformation.m[13];
        var rz = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]) + transformation.m[14];
        var rw = (x * transformation.m[3]) + (y * transformation.m[7]) + (z * transformation.m[11]) + transformation.m[15];

        result.x = rx / rw;
        result.y = ry / rw;
        result.z = rz / rw;
    };

    BABYLON.Vector3.TransformNormal = function (vector, transformation) {
        var result = BABYLON.Vector3.Zero();

        BABYLON.Vector3.TransformNormalToRef(vector, transformation, result);

        return result;
    };

    BABYLON.Vector3.TransformNormalToRef = function (vector, transformation, result) {
        result.x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
        result.y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
        result.z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
    };

    BABYLON.Vector3.TransformNormalFromFloatsToRef = function (x, y, z, transformation, result) {
        result.x = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]);
        result.y = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]);
        result.z = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]);
    };

    BABYLON.Vector3.CatmullRom = function (value1, value2, value3, value4, amount) {
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

        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Clamp = function (value, min, max) {
        var x = value.x;
        x = (x > max.x) ? max.x : x;
        x = (x < min.x) ? min.x : x;

        var y = value.y;
        y = (y > max.y) ? max.y : y;
        y = (y < min.y) ? min.y : y;

        var z = value.z;
        z = (z > max.z) ? max.z : z;
        z = (z < min.z) ? min.z : z;

        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Hermite = function (value1, tangent1, value2, tangent2, amount) {
        var squared = amount * amount;
        var cubed = amount * squared;
        var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        var part2 = (-2.0 * cubed) + (3.0 * squared);
        var part3 = (cubed - (2.0 * squared)) + amount;
        var part4 = cubed - squared;

        var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
        var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
        var z = (((value1.z * part1) + (value2.z * part2)) + (tangent1.z * part3)) + (tangent2.z * part4);

        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Lerp = function (start, end, amount) {
        var x = start.x + ((end.x - start.x) * amount);
        var y = start.y + ((end.y - start.y) * amount);
        var z = start.z + ((end.z - start.z) * amount);

        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Dot = function (left, right) {
        return (left.x * right.x + left.y * right.y + left.z * right.z);
    };

    BABYLON.Vector3.Cross = function (left, right) {
        var result = BABYLON.Vector3.Zero();

        BABYLON.Vector3.CrossToRef(left, right, result);

        return result;
    };

    BABYLON.Vector3.CrossToRef = function (left, right, result) {
        result.x = left.y * right.z - left.z * right.y;
        result.y = left.z * right.x - left.x * right.z;
        result.z = left.x * right.y - left.y * right.x;
    };

    BABYLON.Vector3.Normalize = function (vector) {
        var result = BABYLON.Vector3.Zero();
        BABYLON.Vector3.NormalizeToRef(vector, result);
        return result;
    };

    BABYLON.Vector3.NormalizeToRef = function (vector, result) {
        result.copyFrom(vector);
        result.normalize();
    };

    BABYLON.Vector3.Unproject = function (source, viewportWidth, viewportHeight, world, view, projection) {
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
    };

    BABYLON.Vector3.Minimize = function (left, right) {
        var x = (left.x < right.x) ? left.x : right.x;
        var y = (left.y < right.y) ? left.y : right.y;
        var z = (left.z < right.z) ? left.z : right.z;
        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Maximize = function (left, right) {
        var x = (left.x > right.x) ? left.x : right.x;
        var y = (left.y > right.y) ? left.y : right.y;
        var z = (left.z > right.z) ? left.z : right.z;
        return new BABYLON.Vector3(x, y, z);
    };

    BABYLON.Vector3.Distance = function (value1, value2) {
        return Math.sqrt(BABYLON.Vector3.DistanceSquared(value1, value2));
    };

    BABYLON.Vector3.DistanceSquared = function (value1, value2) {
        var x = value1.x - value2.x;
        var y = value1.y - value2.y;
        var z = value1.z - value2.z;

        return (x * x) + (y * y) + (z * z);
    };

    ////////////////////////////////// Quaternion //////////////////////////////////

    BABYLON.Quaternion = function (initialX, initialY, initialZ, initialW) {
        this.x = initialX;
        this.y = initialY;
        this.z = initialZ;
        this.w = initialW;
    };

    BABYLON.Quaternion.prototype.toString = function () {
        return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
    };
    
    BABYLON.Quaternion.prototype.equals = function (otherQuaternion) {
        return this.x === otherQuaternion.x && this.y === otherQuaternion.y && this.z === otherQuaternion.z && this.w === otherQuaternion.w;
    };

    BABYLON.Quaternion.prototype.clone = function () {
        return new BABYLON.Quaternion(this.x, this.y, this.z, this.w);
    };
    
    BABYLON.Quaternion.prototype.copyFrom = function (other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.w = other.w;
    };

    BABYLON.Quaternion.prototype.add = function (other) {
        return new BABYLON.Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
    };

    BABYLON.Quaternion.prototype.scale = function (value) {
        return new BABYLON.Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
    };

    BABYLON.Quaternion.prototype.length = function () {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
    };

    BABYLON.Quaternion.prototype.normalize = function () {
        var length = 1.0 / this.length();
        this.x *= length;
        this.y *= length;
        this.z *= length;
        this.w *= length;
    };

    BABYLON.Quaternion.prototype.toEulerAngles = function () {
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

        return new BABYLON.Vector3(pitch, yaw, roll);
    };

    BABYLON.Quaternion.prototype.toRotationMatrix = function (result) {
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
    };

    // Statics
    BABYLON.Quaternion.FromArray = function (array, offset) {
        if (!offset) {
            offset = 0;
        }

        return new BABYLON.Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    };

    BABYLON.Quaternion.RotationYawPitchRoll = function (yaw, pitch, roll) {
        var result = new BABYLON.Quaternion();

        BABYLON.Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, result);

        return result;
    };

    BABYLON.Quaternion.RotationYawPitchRollToRef = function (yaw, pitch, roll, result) {
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


    BABYLON.Quaternion.Slerp = function (left, right, amount) {
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

        return new BABYLON.Quaternion((num3 * left.x) + (num2 * right.x), (num3 * left.y) + (num2 * right.y), (num3 * left.z) + (num2 * right.z), (num3 * left.w) + (num2 * right.w));
    };

    ////////////////////////////////// Matrix //////////////////////////////////

    if (!BABYLON.MatrixType) {
        BABYLON.MatrixType = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
    }

    BABYLON.Matrix = function () {
        this.m = new BABYLON.MatrixType(16);
    };

    // Properties
    BABYLON.Matrix.prototype.isIdentity = function () {
        if (this.m[0] != 1.0 || this.m[5] != 1.0 || this.m[10] != 1.0 || this.m[15] != 1.0)
            return false;

        if (this.m[1] != 0.0 || this.m[2] != 0.0 || this.m[3] != 0.0 ||
            this.m[4] != 0.0 || this.m[6] != 0.0 || this.m[7] != 0.0 ||
            this.m[8] != 0.0 || this.m[9] != 0.0 || this.m[11] != 0.0 ||
            this.m[12] != 0.0 || this.m[13] != 0.0 || this.m[14] != 0.0)
            return false;

        return true;
    };

    BABYLON.Matrix.prototype.determinant = function () {
        var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
        var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
        var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
        var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
        var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
        var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);

        return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) -
                (this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) -
            (this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
    };

    // Methods
    BABYLON.Matrix.prototype.toArray = function () {
        return this.m;
    };

    BABYLON.Matrix.prototype.invert = function () {
        this.invertToRef(this);
    };

    BABYLON.Matrix.prototype.invertToRef = function (other) {
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
    };
    
    BABYLON.Matrix.prototype.setTranslation = function (vector3) {
        this.m[12] = vector3.x;
        this.m[13] = vector3.y;
        this.m[14] = vector3.z;
    };

    BABYLON.Matrix.prototype.multiply = function (other) {
        var result = new BABYLON.Matrix();

        this.multiplyToRef(other, result);

        return result;
    };

    BABYLON.Matrix.prototype.copyFrom = function (other) {
        for (var index = 0; index < 16; index++) {
            this.m[index] = other.m[index];
        }
    };

    BABYLON.Matrix.prototype.multiplyToRef = function (other, result) {
        this.multiplyToArray(other, result.m, 0);
    };

    BABYLON.Matrix.prototype.multiplyToArray = function (other, result, offset) {
        result[offset] = this.m[0] * other.m[0] + this.m[1] * other.m[4] + this.m[2] * other.m[8] + this.m[3] * other.m[12];
        result[offset + 1] = this.m[0] * other.m[1] + this.m[1] * other.m[5] + this.m[2] * other.m[9] + this.m[3] * other.m[13];
        result[offset + 2] = this.m[0] * other.m[2] + this.m[1] * other.m[6] + this.m[2] * other.m[10] + this.m[3] * other.m[14];
        result[offset + 3] = this.m[0] * other.m[3] + this.m[1] * other.m[7] + this.m[2] * other.m[11] + this.m[3] * other.m[15];

        result[offset + 4] = this.m[4] * other.m[0] + this.m[5] * other.m[4] + this.m[6] * other.m[8] + this.m[7] * other.m[12];
        result[offset + 5] = this.m[4] * other.m[1] + this.m[5] * other.m[5] + this.m[6] * other.m[9] + this.m[7] * other.m[13];
        result[offset + 6] = this.m[4] * other.m[2] + this.m[5] * other.m[6] + this.m[6] * other.m[10] + this.m[7] * other.m[14];
        result[offset + 7] = this.m[4] * other.m[3] + this.m[5] * other.m[7] + this.m[6] * other.m[11] + this.m[7] * other.m[15];

        result[offset + 8] = this.m[8] * other.m[0] + this.m[9] * other.m[4] + this.m[10] * other.m[8] + this.m[11] * other.m[12];
        result[offset + 9] = this.m[8] * other.m[1] + this.m[9] * other.m[5] + this.m[10] * other.m[9] + this.m[11] * other.m[13];
        result[offset + 10] = this.m[8] * other.m[2] + this.m[9] * other.m[6] + this.m[10] * other.m[10] + this.m[11] * other.m[14];
        result[offset + 11] = this.m[8] * other.m[3] + this.m[9] * other.m[7] + this.m[10] * other.m[11] + this.m[11] * other.m[15];

        result[offset + 12] = this.m[12] * other.m[0] + this.m[13] * other.m[4] + this.m[14] * other.m[8] + this.m[15] * other.m[12];
        result[offset + 13] = this.m[12] * other.m[1] + this.m[13] * other.m[5] + this.m[14] * other.m[9] + this.m[15] * other.m[13];
        result[offset + 14] = this.m[12] * other.m[2] + this.m[13] * other.m[6] + this.m[14] * other.m[10] + this.m[15] * other.m[14];
        result[offset + 15] = this.m[12] * other.m[3] + this.m[13] * other.m[7] + this.m[14] * other.m[11] + this.m[15] * other.m[15];
    };

    BABYLON.Matrix.prototype.equals = function (value) {
        return (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] &&
                this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] &&
                this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] &&
                this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
    };

    BABYLON.Matrix.prototype.clone = function () {
        return BABYLON.Matrix.FromValues(this.m[0], this.m[1], this.m[2], this.m[3],
            this.m[4], this.m[5], this.m[6], this.m[7],
            this.m[8], this.m[9], this.m[10], this.m[11],
            this.m[12], this.m[13], this.m[14], this.m[15]);
    };

    // Statics
    BABYLON.Matrix.FromArray = function (array, offset) {
        var result = new BABYLON.Matrix();

        BABYLON.Matrix.FromArrayToRef(array, offset, result);

        return result;
    };

    BABYLON.Matrix.FromArrayToRef = function (array, offset, result) {
        if (!offset) {
            offset = 0;
        }

        for (var index = 0; index < 16; index++) {
            result.m[index] = array[index + offset];
        }
    };

    BABYLON.Matrix.FromValuesToRef = function (initialM11, initialM12, initialM13, initialM14,
        initialM21, initialM22, initialM23, initialM24,
        initialM31, initialM32, initialM33, initialM34,
        initialM41, initialM42, initialM43, initialM44, result) {

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

    BABYLON.Matrix.FromValues = function (initialM11, initialM12, initialM13, initialM14,
        initialM21, initialM22, initialM23, initialM24,
        initialM31, initialM32, initialM33, initialM34,
        initialM41, initialM42, initialM43, initialM44) {

        var result = new BABYLON.Matrix();

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

    BABYLON.Matrix.Identity = function () {
        return BABYLON.Matrix.FromValues(1.0, 0, 0, 0,
            0, 1.0, 0, 0,
            0, 0, 1.0, 0,
            0, 0, 0, 1.0);
    };

    BABYLON.Matrix.IdentityToRef = function (result) {
        BABYLON.Matrix.FromValuesToRef(1.0, 0, 0, 0,
            0, 1.0, 0, 0,
            0, 0, 1.0, 0,
            0, 0, 0, 1.0, result);
    };

    BABYLON.Matrix.Zero = function () {
        return BABYLON.Matrix.FromValues(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);
    };

    BABYLON.Matrix.RotationX = function (angle) {
        var result = new BABYLON.Matrix();

        BABYLON.Matrix.RotationXToRef(angle, result);

        return result;
    };

    BABYLON.Matrix.RotationXToRef = function (angle, result) {
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

    BABYLON.Matrix.RotationY = function (angle) {
        var result = new BABYLON.Matrix();

        BABYLON.Matrix.RotationYToRef(angle, result);

        return result;
    };

    BABYLON.Matrix.RotationYToRef = function (angle, result) {
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

    BABYLON.Matrix.RotationZ = function (angle) {
        var result = new BABYLON.Matrix();

        BABYLON.Matrix.RotationZToRef(angle, result);

        return result;
    };

    BABYLON.Matrix.RotationZToRef = function (angle, result) {
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

    BABYLON.Matrix.RotationAxis = function (axis, angle) {
        var s = Math.sin(-angle);
        var c = Math.cos(-angle);
        var c1 = 1 - c;

        axis.normalize();
        var result = BABYLON.Matrix.Zero();

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

    BABYLON.Matrix.RotationYawPitchRoll = function (yaw, pitch, roll) {
        var result = new BABYLON.Matrix();

        BABYLON.Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, result);

        return result;
    };

    var tempQuaternion = new BABYLON.Quaternion(); // For RotationYawPitchRoll
    BABYLON.Matrix.RotationYawPitchRollToRef = function (yaw, pitch, roll, result) {
        BABYLON.Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, tempQuaternion);

        tempQuaternion.toRotationMatrix(result);
    };

    BABYLON.Matrix.Scaling = function (x, y, z) {
        var result = BABYLON.Matrix.Zero();

        BABYLON.Matrix.ScalingToRef(x, y, z, result);

        return result;
    };

    BABYLON.Matrix.ScalingToRef = function (x, y, z, result) {
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

    BABYLON.Matrix.Translation = function (x, y, z) {
        var result = BABYLON.Matrix.Identity();

        BABYLON.Matrix.TranslationToRef(x, y, z, result);

        return result;
    };

    BABYLON.Matrix.TranslationToRef = function (x, y, z, result) {
        BABYLON.Matrix.FromValuesToRef(1.0, 0, 0, 0,
            0, 1.0, 0, 0,
            0, 0, 1.0, 0,
            x, y, z, 1.0, result);
    };

    BABYLON.Matrix.LookAtLH = function (eye, target, up) {
        var result = BABYLON.Matrix.Zero();

        BABYLON.Matrix.LookAtLHToRef(eye, target, up, result);

        return result;

    };


    var xAxis = BABYLON.Vector3.Zero();
    var yAxis = BABYLON.Vector3.Zero();
    var zAxis = BABYLON.Vector3.Zero();
    BABYLON.Matrix.LookAtLHToRef = function (eye, target, up, result) {
        // Z axis
        target.subtractToRef(eye, zAxis);
        zAxis.normalize();

        // X axis
        BABYLON.Vector3.CrossToRef(up, zAxis, xAxis);
        xAxis.normalize();

        // Y axis
        BABYLON.Vector3.CrossToRef(zAxis, xAxis, yAxis);
        yAxis.normalize();

        // Eye angles
        var ex = -BABYLON.Vector3.Dot(xAxis, eye);
        var ey = -BABYLON.Vector3.Dot(yAxis, eye);
        var ez = -BABYLON.Vector3.Dot(zAxis, eye);

        return BABYLON.Matrix.FromValuesToRef(xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            ex, ey, ez, 1, result);
    };

    BABYLON.Matrix.OrthoLH = function (width, height, znear, zfar) {
        var hw = 2.0 / width;
        var hh = 2.0 / height;
        var id = 1.0 / (zfar - znear);
        var nid = znear / (znear - zfar);

        return BABYLON.Matrix.FromValues(hw, 0, 0, 0,
            0, hh, 0, 0,
            0, 0, id, 0,
            0, 0, nid, 1);
    };

    BABYLON.Matrix.OrthoOffCenterLH = function (left, right, bottom, top, znear, zfar) {
        var matrix = BABYLON.Matrix.Zero();

        BABYLON.Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix);

        return matrix;
    };

    BABYLON.Matrix.OrthoOffCenterLHToRef = function (left, right, bottom, top, znear, zfar, result) {
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

    BABYLON.Matrix.PerspectiveLH = function (width, height, znear, zfar) {
        var matrix = BABYLON.Matrix.Zero();

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

    BABYLON.Matrix.PerspectiveFovLH = function (fov, aspect, znear, zfar) {
        var matrix = BABYLON.Matrix.Zero();

        BABYLON.Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix);

        return matrix;
    };

    BABYLON.Matrix.PerspectiveFovLHToRef = function (fov, aspect, znear, zfar, result) {
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
    };

    BABYLON.Matrix.AffineTransformation = function (scaling, rotationCenter, rotation, translation) {
        return BABYLON.Matrix.Scaling(scaling, scaling, scaling) * BABYLON.Matrix.Translation(-rotationCenter) *
            BABYLON.Matrix.RotationQuaternion(rotation) * BABYLON.Matrix.Translation(rotationCenter) * BABYLON.Matrix.Translation(translation);
    };

    BABYLON.Matrix.GetFinalMatrix = function (viewport, world, view, projection) {
        var cw = viewport.width;
        var ch = viewport.height;
        var cx = viewport.x;
        var cy = viewport.y;
        var zmin = viewport.minZ;
        var zmax = viewport.maxZ;

        var viewportMatrix = new BABYLON.Matrix(cw / 2.0, 0, 0, 0,
            0, -ch / 2.0, 0, 0,
            0, 0, zmax - zmin, 0,
            cx + cw / 2.0, ch / 2.0 + cy, zmin, 1);

        return world.multiply(view).multiply(projection).multiply(viewportMatrix);
    };

    BABYLON.Matrix.Transpose = function (matrix) {
        var result = new BABYLON.Matrix();

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

    BABYLON.Matrix.Reflection = function (plane) {
        var matrix = new BABYLON.Matrix();

        BABYLON.Matrix.ReflectionToRef(plane, matrix);

        return matrix;
    };

    BABYLON.Matrix.ReflectionToRef = function (plane, result) {
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

    ////////////////////////////////// Plane //////////////////////////////////
    BABYLON.Plane = function (a, b, c, d) {
        this.normal = new BABYLON.Vector3(a, b, c);
        this.d = d;
    };

    // Methods
    BABYLON.Plane.prototype.normalize = function () {
        var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
        var magnitude = 0;

        if (norm != 0) {
            magnitude = 1.0 / norm;
        }

        this.normal.x *= magnitude;
        this.normal.y *= magnitude;
        this.normal.z *= magnitude;

        this.d *= magnitude;
    };

    BABYLON.Plane.prototype.transform = function (transformation) {
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
    };


    BABYLON.Plane.prototype.dotCoordinate = function (point) {
        return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
    };

    BABYLON.Plane.prototype.copyFromPoints = function (point1, point2, point3) {
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

        if (pyth != 0)
            invPyth = 1.0 / pyth;
        else
            invPyth = 0;

        this.normal.x = yz * invPyth;
        this.normal.y = xz * invPyth;
        this.normal.z = xy * invPyth;
        this.d = -((this.normal.x * point1.x) + (this.normal.y * point1.y) + (this.normal.z * point1.z));
    };

    BABYLON.Plane.prototype.isFrontFacingTo = function (direction, epsilon) {
        var dot = BABYLON.Vector3.Dot(this.normal, direction);

        return (dot <= epsilon);
    };

    BABYLON.Plane.prototype.signedDistanceTo = function (point) {
        return BABYLON.Vector3.Dot(point, this.normal) + this.d;
    };

    // Statics
    BABYLON.Plane.FromArray = function (array) {
        return new BABYLON.Plane(array[0], array[1], array[2], array[3]);
    };

    BABYLON.Plane.FromPoints = function (point1, point2, point3) {
        var result = new BABYLON.Plane(0, 0, 0, 0);

        result.copyFromPoints(point1, point2, point3);

        return result;
    };

    BABYLON.Plane.FromPositionAndNormal = function (origin, normal) {
        var result = new BABYLON.Plane(0, 0, 0, 0);
        normal.normalize();

        result.normal = normal;
        result.d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);

        return result;
    };

    BABYLON.Plane.SignedDistanceToPlaneFromPositionAndNormal = function (origin, normal, point) {
        var d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);

        return BABYLON.Vector3.Dot(point, normal) + d;
    };
    ////////////////////////////////// Frustum //////////////////////////////////
    BABYLON.Frustum = {};

    // Statics
    BABYLON.Frustum.GetPlanes = function (transform) {
        var frustumPlanes = [];

        for (var index = 0; index < 6; index++) {
            frustumPlanes.push(new BABYLON.Plane(0, 0, 0, 0));
        }

        BABYLON.Frustum.GetPlanesToRef(transform, frustumPlanes);

        return frustumPlanes;
    };

    BABYLON.Frustum.GetPlanesToRef = function (transform, frustumPlanes) {
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
})();
