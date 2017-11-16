module BABYLON {
    export const ToGammaSpace = 1 / 2.2;
    export const ToLinearSpace = 2.2;
    export const Epsilon = 0.001;

    export class Color3 {
        /**
         * Creates a new Color3 object from red, green, blue values, all between 0 and 1.  
         */
        constructor(public r: number = 0, public g: number = 0, public b: number = 0) {
        }

        /**
         * Returns a string with the Color3 current values.  
         */
        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
        }

        /**
         * Returns the string "Color3".
         */
        public getClassName(): string {
            return "Color3";
        }
        /**
         * Returns the Color3 hash code.  
         */
        public getHashCode(): number {
            let hash = this.r || 0;
            hash = (hash * 397) ^ (this.g || 0);
            hash = (hash * 397) ^ (this.b || 0);
            return hash;
        }

        // Operators
        /**
         * Stores in the passed array from the passed starting index the red, green, blue values as successive elements.  
         * Returns the Color3.  
         */
        public toArray(array: FloatArray, index?: number): Color3 {
            if (index === undefined) {
                index = 0;
            }

            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;

            return this;
        }

        /**
         * Returns a new Color4 object from the current Color3 and the passed alpha.  
         */
        public toColor4(alpha = 1): Color4 {
            return new Color4(this.r, this.g, this.b, alpha);
        }

        /**
         * Returns a new array populated with 3 numeric elements : red, green and blue values.  
         */
        public asArray(): number[] {
            var result = new Array<number>();
            this.toArray(result, 0);
            return result;
        }

        /**
         * Returns the luminance value (float).  
         */
        public toLuminance(): number {
            return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
        }

        /**
         * Multiply each Color3 rgb values by the passed Color3 rgb values in a new Color3 object.  
         * Returns this new object.  
         */
        public multiply(otherColor: Color3): Color3 {
            return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
        }

        /**
         * Multiply the rgb values of the Color3 and the passed Color3 and stores the result in the object "result".  
         * Returns the current Color3.  
         */
        public multiplyToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r * otherColor.r;
            result.g = this.g * otherColor.g;
            result.b = this.b * otherColor.b;
            return this;
        }

        /**
         * Boolean : True if the rgb values are equal to the passed ones.  
         */
        public equals(otherColor: Color3): boolean {
            return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
        }

        /**
         * Boolean : True if the rgb values are equal to the passed ones.  
         */
        public equalsFloats(r: number, g: number, b: number): boolean {
            return this.r === r && this.g === g && this.b === b;
        }

        /**
         * Multiplies in place each rgb value by scale.  
         * Returns the updated Color3.  
         */
        public scale(scale: number): Color3 {
            return new Color3(this.r * scale, this.g * scale, this.b * scale);
        }

        /**
         * Multiplies the rgb values by scale and stores the result into "result".  
         * Returns the unmodified current Color3.  
         */
        public scaleToRef(scale: number, result: Color3): Color3 {
            result.r = this.r * scale;
            result.g = this.g * scale;
            result.b = this.b * scale;
            return this;
        }

        /**
         * Returns a new Color3 set with the added values of the current Color3 and of the passed one.  
         */
        public add(otherColor: Color3): Color3 {
            return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
        }

        /**
         * Stores the result of the addition of the current Color3 and passed one rgb values into "result".  
         * Returns the unmodified current Color3.  
         */
        public addToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r + otherColor.r;
            result.g = this.g + otherColor.g;
            result.b = this.b + otherColor.b;
            return this;
        }

        /**
         * Returns a new Color3 set with the subtracted values of the passed one from the current Color3 .  
         */
        public subtract(otherColor: Color3): Color3 {
            return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
        }

        /**
         * Stores the result of the subtraction of passed one from the current Color3 rgb values into "result".  
         * Returns the unmodified current Color3.  
         */
        public subtractToRef(otherColor: Color3, result: Color3): Color3 {
            result.r = this.r - otherColor.r;
            result.g = this.g - otherColor.g;
            result.b = this.b - otherColor.b;
            return this;
        }

        /**
         * Returns a new Color3 copied the current one.  
         */
        public clone(): Color3 {
            return new Color3(this.r, this.g, this.b);
        }

        /**
         * Copies the rgb values from the source in the current Color3.  
         * Returns the updated Color3.  
         */
        public copyFrom(source: Color3): Color3 {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
            return this;
        }
        /**
         * Updates the Color3 rgb values from the passed floats.  
         * Returns the Color3.  
         */
        public copyFromFloats(r: number, g: number, b: number): Color3 {
            this.r = r;
            this.g = g;
            this.b = b;
            return this;
        }

        /**
         * Updates the Color3 rgb values from the passed floats.  
         * Returns the Color3.  
         */
        public set(r: number, g: number, b: number): Color3 {
            return this.copyFromFloats(r, g, b);
        }

        /**
         * Returns the Color3 hexadecimal code as a string.  
         */
        public toHexString(): string {
            var intR = (this.r * 255) | 0;
            var intG = (this.g * 255) | 0;
            var intB = (this.b * 255) | 0;
            return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB);
        }

        /**
         * Returns a new Color3 converted to linear space.  
         */
        public toLinearSpace(): Color3 {
            var convertedColor = new Color3();
            this.toLinearSpaceToRef(convertedColor);
            return convertedColor;
        }

        /**
         * Converts the Color3 values to linear space and stores the result in "convertedColor".  
         * Returns the unmodified Color3.  
         */
        public toLinearSpaceToRef(convertedColor: Color3): Color3 {
            convertedColor.r = Math.pow(this.r, ToLinearSpace);
            convertedColor.g = Math.pow(this.g, ToLinearSpace);
            convertedColor.b = Math.pow(this.b, ToLinearSpace);
            return this;
        }

        /**
         * Returns a new Color3 converted to gamma space.  
         */
        public toGammaSpace(): Color3 {
            var convertedColor = new Color3();
            this.toGammaSpaceToRef(convertedColor);
            return convertedColor;
        }

        /**
         * Converts the Color3 values to gamma space and stores the result in "convertedColor".  
         * Returns the unmodified Color3.  
         */
        public toGammaSpaceToRef(convertedColor: Color3): Color3 {
            convertedColor.r = Math.pow(this.r, ToGammaSpace);
            convertedColor.g = Math.pow(this.g, ToGammaSpace);
            convertedColor.b = Math.pow(this.b, ToGammaSpace);
            return this;
        }

        // Statics
        /**
         * Creates a new Color3 from the string containing valid hexadecimal values.  
         */
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

        /**
         * Creates a new Vector3 from the startind index of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset: number = 0): Color3 {
            return new Color3(array[offset], array[offset + 1], array[offset + 2]);
        }

        /**
         * Creates a new Color3 from integer values ( < 256).  
         */
        public static FromInts(r: number, g: number, b: number): Color3 {
            return new Color3(r / 255.0, g / 255.0, b / 255.0);
        }

        /**
         * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3.  
         */
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
        public static Teal(): Color3 { return new Color3(0, 1.0, 1.0); }
        public static Random(): Color3 { return new Color3(Math.random(), Math.random(), Math.random()); }
    }

    export class Color4 {
        /**
         * Creates a new Color4 object from the passed float values ( < 1) : red, green, blue, alpha.  
         */
        constructor(public r: number = 0, public g: number = 0, public b: number = 0, public a: number = 1) {
        }

        // Operators
        /**
         * Adds in place the passed Color4 values to the current Color4.  
         * Returns the updated Color4.  
         */
        public addInPlace(right: Color4): Color4 {
            this.r += right.r;
            this.g += right.g;
            this.b += right.b;
            this.a += right.a;
            return this;
        }

        /**
         * Returns a new array populated with 4 numeric elements : red, green, blue, alpha values.  
         */
        public asArray(): number[] {
            var result = new Array<number>();
            this.toArray(result, 0);
            return result;
        }

        /**
         * Stores from the starting index in the passed array the Color4 successive values.  
         * Returns the Color4.  
         */
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

        /**
         * Returns a new Color4 set with the added values of the current Color4 and of the passed one.  
         */
        public add(right: Color4): Color4 {
            return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
        }
        /**
         * Returns a new Color4 set with the subtracted values of the passed one from the current Color4.    
         */
        public subtract(right: Color4): Color4 {
            return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
        }

        /**
         * Subtracts the passed ones from the current Color4 values and stores the results in "result".  
         * Returns the Color4.  
         */
        public subtractToRef(right: Color4, result: Color4): Color4 {
            result.r = this.r - right.r;
            result.g = this.g - right.g;
            result.b = this.b - right.b;
            result.a = this.a - right.a;
            return this;
        }
        /**
         * Creates a new Color4 with the current Color4 values multiplied by scale.  
         */
        public scale(scale: number): Color4 {
            return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
        }

        /**
         * Multiplies the current Color4 values by scale and stores the result in "result".  
         * Returns the Color4.  
         */
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
        /**
         * Returns a string with the Color4 values.  
         */
        public toString(): string {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }
        /**
         * Returns the string "Color4"
         */
        public getClassName(): string {
            return "Color4";
        }
        /**
         * Return the Color4 hash code as a number.  
         */
        public getHashCode(): number {
            let hash = this.r || 0;
            hash = (hash * 397) ^ (this.g || 0);
            hash = (hash * 397) ^ (this.b || 0);
            hash = (hash * 397) ^ (this.a || 0);
            return hash;
        }
        /**
         * Creates a new Color4 copied from the current one.  
         */
        public clone(): Color4 {
            return new Color4(this.r, this.g, this.b, this.a);
        }
        /**
         * Copies the passed Color4 values into the current one.  
         * Returns the updated Color4.  
         */
        public copyFrom(source: Color4): Color4 {
            this.r = source.r;
            this.g = source.g;
            this.b = source.b;
            this.a = source.a;
            return this;
        }

        /**
         * Copies the passed float values into the current one.  
         * Returns the updated Color4.  
         */
        public copyFromFloats(r: number, g: number, b: number, a: number): Color4 {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            return this;
        }

        /**
         * Copies the passed float values into the current one.  
         * Returns the updated Color4.  
         */
        public set(r: number, g: number, b: number, a: number): Color4 {
            return this.copyFromFloats(r, g, b, a);
        }
        /**
         * Returns a string containing the hexadecimal Color4 code.  
         */
        public toHexString(): string {
            var intR = (this.r * 255) | 0;
            var intG = (this.g * 255) | 0;
            var intB = (this.b * 255) | 0;
            var intA = (this.a * 255) | 0;
            return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB) + Scalar.ToHex(intA);
        }

        /**
         * Returns a new Color4 converted to linear space.  
         */
        public toLinearSpace(): Color4 {
            var convertedColor = new Color4();
            this.toLinearSpaceToRef(convertedColor);
            return convertedColor;
        }

        /**
         * Converts the Color4 values to linear space and stores the result in "convertedColor".  
         * Returns the unmodified Color4.  
         */
        public toLinearSpaceToRef(convertedColor: Color4): Color4 {
            convertedColor.r = Math.pow(this.r, ToLinearSpace);
            convertedColor.g = Math.pow(this.g, ToLinearSpace);
            convertedColor.b = Math.pow(this.b, ToLinearSpace);
            convertedColor.a = this.a;
            return this;
        }

        /**
         * Returns a new Color4 converted to gamma space.  
         */
        public toGammaSpace(): Color4 {
            var convertedColor = new Color4();
            this.toGammaSpaceToRef(convertedColor);
            return convertedColor;
        }

        /**
         * Converts the Color4 values to gamma space and stores the result in "convertedColor".  
         * Returns the unmodified Color4.  
         */
        public toGammaSpaceToRef(convertedColor: Color4): Color4 {
            convertedColor.r = Math.pow(this.r, ToGammaSpace);
            convertedColor.g = Math.pow(this.g, ToGammaSpace);
            convertedColor.b = Math.pow(this.b, ToGammaSpace);
            convertedColor.a = this.a;
            return this;
        }        

        // Statics
        /**
         * Creates a new Color4 from the valid hexadecimal value contained in the passed string.  
         */
        public static FromHexString(hex: string): Color4 {
            if (hex.substring(0, 1) !== "#" || hex.length !== 9) {
                //Tools.Warn("Color4.FromHexString must be called with a string like #FFFFFFFF");
                return new Color4(0.0, 0.0, 0.0, 0.0);
            }

            var r = parseInt(hex.substring(1, 3), 16);
            var g = parseInt(hex.substring(3, 5), 16);
            var b = parseInt(hex.substring(5, 7), 16);
            var a = parseInt(hex.substring(7, 9), 16);

            return Color4.FromInts(r, g, b, a);
        }

        /**
         * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 and the right Color4.  
         */
        public static Lerp(left: Color4, right: Color4, amount: number): Color4 {
            var result = new Color4(0.0, 0.0, 0.0, 0.0);
            Color4.LerpToRef(left, right, amount, result);
            return result;
        }
        /**
         * Set the passed "result" with the linearly interpolated values of "amount" between the left Color4 and the right Color4.
         */
        public static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void {
            result.r = left.r + (right.r - left.r) * amount;
            result.g = left.g + (right.g - left.g) * amount;
            result.b = left.b + (right.b - left.b) * amount;
            result.a = left.a + (right.a - left.a) * amount;
        }

        /**
         * Creates a new Color4 from the starting index element of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset: number = 0): Color4 {
            return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }

        /**
         * Creates a new Color4 from the passed integers ( < 256 ).
         */
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
        /**
         * Creates a new Vector2 from the passed x and y coordinates.  
         */
        constructor(public x: number, public y: number) {
        }
        /**
         * Returns a string with the Vector2 coordinates.  
         */
        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + "}";
        }
        /**
         * Returns the string "Vector2"
         */
        public getClassName(): string {
            return "Vector2";
        }

        /**
         * Returns the Vector2 hash code as a number. 
         */
        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            return hash;
        }

        // Operators
        /**
         * Sets the Vector2 coordinates in the passed array or Float32Array from the passed index.  
         * Returns the Vector2.  
         */
        public toArray(array: FloatArray, index: number = 0): Vector2 {
            array[index] = this.x;
            array[index + 1] = this.y;
            return this;
        }
        /**
         * Returns a new array with 2 elements : the Vector2 coordinates.  
         */
        public asArray(): number[] {
            var result = new Array<number>();
            this.toArray(result, 0);
            return result;
        }
        /**
         *  Sets the Vector2 coordinates with the passed Vector2 coordinates.  
         * Returns the updated Vector2.  
         */
        public copyFrom(source: Vector2): Vector2 {
            this.x = source.x;
            this.y = source.y;
            return this;
        }
        /**
         * Sets the Vector2 coordinates with the passed floats.  
         * Returns the updated Vector2.  
         */
        public copyFromFloats(x: number, y: number): Vector2 {
            this.x = x;
            this.y = y;
            return this;
        }
        /**
         * Sets the Vector2 coordinates with the passed floats.  
         * Returns the updated Vector2.  
         */
        public set(x: number, y: number): Vector2 {
            return this.copyFromFloats(x, y);
        }
        /**
         * Returns a new Vector2 set with the addition of the current Vector2 and the passed one coordinates.  
         */
        public add(otherVector: Vector2): Vector2 {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        }
        /**
         * Sets the "result" coordinates with the addition of the current Vector2 and the passed one coordinates. 
         * Returns the Vector2.   
         */
        public addToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            return this;
        }
        /**
         * Set the Vector2 coordinates by adding the passed Vector2 coordinates.  
         * Returns the updated Vector2.  
         */
        public addInPlace(otherVector: Vector2): Vector2 {
            this.x += otherVector.x;
            this.y += otherVector.y;
            return this;
        }
        /**
         * Returns a new Vector2 by adding the current Vector2 coordinates to the passed Vector3 x, y coordinates.  
         */
        public addVector3(otherVector: Vector3): Vector2 {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        }

        /**
         * Returns a new Vector2 set with the subtracted coordinates of the passed one from the current Vector2.  
         */
        public subtract(otherVector: Vector2): Vector2 {
            return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
        }
        /**
         * Sets the "result" coordinates with the subtraction of the passed one from the current Vector2 coordinates.  
         * Returns the Vector2.  
         */
        public subtractToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            return this;
        }
        /**
         * Sets the current Vector2 coordinates by subtracting from it the passed one coordinates.  
         * Returns the updated Vector2.  
         */
        public subtractInPlace(otherVector: Vector2): Vector2 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            return this;
        }
        /**
         * Multiplies in place the current Vector2 coordinates by the passed ones.  
         * Returns the updated Vector2.  
         */
        public multiplyInPlace(otherVector: Vector2): Vector2 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            return this;
        }
        /**
         * Returns a new Vector2 set with the multiplication of the current Vector2 and the passed one coordinates.  
         */
        public multiply(otherVector: Vector2): Vector2 {
            return new Vector2(this.x * otherVector.x, this.y * otherVector.y);
        }
        /**
         * Sets "result" coordinates with the multiplication of the current Vector2 and the passed one coordinates.  
         * Returns the Vector2.  
         */
        public multiplyToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            return this;
        }
        /**
         * Returns a new Vector2 set with the Vector2 coordinates multiplied by the passed floats.  
         */
        public multiplyByFloats(x: number, y: number): Vector2 {
            return new Vector2(this.x * x, this.y * y);
        }
        /**
         * Returns a new Vector2 set with the Vector2 coordinates divided by the passed one coordinates.  
         */
        public divide(otherVector: Vector2): Vector2 {
            return new Vector2(this.x / otherVector.x, this.y / otherVector.y);
        }
        /**
         * Sets the "result" coordinates with the Vector2 divided by the passed one coordinates.   
         * Returns the Vector2.  
         */
        public divideToRef(otherVector: Vector2, result: Vector2): Vector2 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            return this;
        }
        /**
         * Returns a new Vector2 with current Vector2 negated coordinates.  
         */
        public negate(): Vector2 {
            return new Vector2(-this.x, -this.y);
        }
        /**
         * Multiply the Vector2 coordinates by scale.  
         * Returns the updated Vector2.  
         */
        public scaleInPlace(scale: number): Vector2 {
            this.x *= scale;
            this.y *= scale;
            return this;
        }
        /**
         * Returns a new Vector2 scaled by "scale" from the current Vector2.  
         */
        public scale(scale: number): Vector2 {
            return new Vector2(this.x * scale, this.y * scale);
        }
        /**
         * Boolean : True if the passed vector coordinates strictly equal the current Vector2 ones.  
         */
        public equals(otherVector: Vector2): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y;
        }
        /**
         * Boolean : True if the passed vector coordinates are close to the current ones by a distance of epsilon.  
         */
        public equalsWithEpsilon(otherVector: Vector2, epsilon: number = Epsilon): boolean {
            return otherVector && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon);
        }

        // Properties
        /**
         * Returns the vector length (float).  
         */
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        /**
         * Returns the vector squared length (float);
         */
        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y);
        }

        // Methods
        /**
         * Normalize the vector.  
         * Returns the updated Vector2.  
         */
        public normalize(): Vector2 {
            var len = this.length();

            if (len === 0)
                return this;

            var num = 1.0 / len;

            this.x *= num;
            this.y *= num;

            return this;
        }
        /**
         * Returns a new Vector2 copied from the Vector2.  
         */
        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }

        // Statics
        /**
         * Returns a new Vector2(0, 0)
         */
        public static Zero(): Vector2 {
            return new Vector2(0, 0);
        }
        /**
         * Returns a new Vector2(1, 1)
         */
        public static One(): Vector2 {
            return new Vector2(1, 1);
        }
        /**
         * Returns a new Vector2 set from the passed index element of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset: number = 0): Vector2 {
            return new Vector2(array[offset], array[offset + 1]);
        }
        /**
         * Sets "result" from the passed index element of the passed array.
         */
        public static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector2): void {
            result.x = array[offset];
            result.y = array[offset + 1];
        }

        /**
         * Retuns a new Vector2 located for "amount" (float) on the CatmullRom  spline defined by the passed four Vector2.  
         */
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

        /**
         * Returns a new Vector2 set with same the coordinates than "value" ones if the vector "value" is in the square defined by "min" and "max".  
         * If a coordinate of "value" is lower than "min" coordinates, the returned Vector2 is given this "min" coordinate.  
         * If a coordinate of "value" is greater than "max" coordinates, the returned Vector2 is given this "max" coordinate.
         */
        public static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2 {
            var x = value.x;
            x = (x > max.x) ? max.x : x;
            x = (x < min.x) ? min.x : x;

            var y = value.y;
            y = (y > max.y) ? max.y : y;
            y = (y < min.y) ? min.y : y;

            return new Vector2(x, y);
        }

        /**
         * Returns a new Vector2 located for "amount" (float) on the Hermite spline defined by the vectors "value1", "value3", "tangent1", "tangent2".
         */
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

        /**
         * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".          
         */
        public static Lerp(start: Vector2, end: Vector2, amount: number): Vector2 {
            var x = start.x + ((end.x - start.x) * amount);
            var y = start.y + ((end.y - start.y) * amount);
            return new Vector2(x, y);
        }

        /**
         * Returns the dot product (float) of the vector "left" and the vector "right".  
         */
        public static Dot(left: Vector2, right: Vector2): number {
            return left.x * right.x + left.y * right.y;
        }

        /**
         * Returns a new Vector2 equal to the normalized passed vector.  
         */
        public static Normalize(vector: Vector2): Vector2 {
            var newVector = vector.clone();
            newVector.normalize();
            return newVector;
        }

        /**
         * Returns a new Vecto2 set with the minimal coordinate values from the "left" and "right" vectors.  
         */
        public static Minimize(left: Vector2, right: Vector2): Vector2 {
            var x = (left.x < right.x) ? left.x : right.x;
            var y = (left.y < right.y) ? left.y : right.y;
            return new Vector2(x, y);
        }

        /**
         * Returns a new Vecto2 set with the maximal coordinate values from the "left" and "right" vectors. 
         */
        public static Maximize(left: Vector2, right: Vector2): Vector2 {
            var x = (left.x > right.x) ? left.x : right.x;
            var y = (left.y > right.y) ? left.y : right.y;
            return new Vector2(x, y);
        }

        /**
         * Returns a new Vecto2 set with the transformed coordinates of the passed vector by the passed transformation matrix.  
         */
        public static Transform(vector: Vector2, transformation: Matrix): Vector2 {
            let r = Vector2.Zero();
            Vector2.TransformToRef(vector, transformation, r);
            return r;
        }

        /**
         * Transforms the passed vector coordinates by the passed transformation matrix and stores the result in the vector "result" coordinates.  
         */
        public static TransformToRef(vector: Vector2, transformation: Matrix, result: Vector2) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + transformation.m[13];
            result.x = x;
            result.y = y;
        }

        /**
         * Boolean : True if the point "p" is in the triangle defined by the vertors "p0", "p1", "p2"
         */
        public static PointInTriangle(p: Vector2, p0: Vector2, p1: Vector2, p2: Vector2) {
            let a = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
            let sign = a < 0 ? -1 : 1;
            let s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
            let t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

            return s > 0 && t > 0 && (s + t) < 2 * a * sign;
        }

        /**
         * Returns the distance (float) between the vectors "value1" and "value2".  
         */
        public static Distance(value1: Vector2, value2: Vector2): number {
            return Math.sqrt(Vector2.DistanceSquared(value1, value2));
        }

        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".  
         */
        public static DistanceSquared(value1: Vector2, value2: Vector2): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            return (x * x) + (y * y);
        }

        /**
         * Returns a new Vecto2 located at the center of the vectors "value1" and "value2".  
         */
        public static Center(value1: Vector2, value2: Vector2): Vector2 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }

        /**
         * Returns the shortest distance (float) between the point "p" and the segment defined by the two points "segA" and "segB".  
         */
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
        /**
         * Creates a new Vector3 object from the passed x, y, z (floats) coordinates.  
         * A Vector3 is the main object used in 3D geometry.  
         * It can represent etiher the coordinates of a point the space, either a direction.  
         */
        constructor(public x: number, public y: number, public z: number) {
        }

        /**
         * Returns a string with the Vector3 coordinates.  
         */
        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
        }

        /**
         * Returns the string "Vector3"
         */
        public getClassName(): string {
            return "Vector3";
        }

        /**
         * Returns the Vector hash code.  
         */
        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            return hash;
        }

        // Operators
        /**
         * Returns a new array with three elements : the coordinates the Vector3.  
         */
        public asArray(): number[] {
            var result: number[] = [];
            this.toArray(result, 0);
            return result;
        }

        /**
         * Populates the passed array or Float32Array from the passed index with the successive coordinates of the Vector3.  
         * Returns the Vector3.  
         */
        public toArray(array: FloatArray, index: number = 0): Vector3 {
            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
            return this;
        }

        /**
         * Returns a new Quaternion object, computed from the Vector3 coordinates.  
         */
        public toQuaternion(): Quaternion {
            var result = new Quaternion(0.0, 0.0, 0.0, 1.0);

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

        /**
         * Adds the passed vector to the current Vector3.  
         * Returns the updated Vector3.  
         */
        public addInPlace(otherVector: Vector3): Vector3 {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
            return this;
        }

        /**
         * Returns a new Vector3, result of the addition the current Vector3 and the passed vector.  
         */
        public add(otherVector: Vector3): Vector3 {
            return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
        }

        /**
         * Adds the current Vector3 to the passed one and stores the result in the vector "result".  
         * Returns the current Vector3.  
         */
        public addToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
            return this;
        }

        /**
         * Subtract the passed vector from the current Vector3.  
         * Returns the updated Vector3.  
         */
        public subtractInPlace(otherVector: Vector3): Vector3 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
            return this;
        }

        /**
         * Returns a new Vector3, result of the subtraction of the passed vector from the current Vector3.  
         */
        public subtract(otherVector: Vector3): Vector3 {
            return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
        }

        /**
         * Subtracts the passed vector from the current Vector3 and stores the result in the vector "result".  
         * Returns the current Vector3.  
         */
        public subtractToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
            return this;
        }

        /**
         * Returns a new Vector3 set with the subtraction of the passed floats from the current Vector3 coordinates.  
         */
        public subtractFromFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x - x, this.y - y, this.z - z);
        }

        /**
         * Subtracts the passed floats from the current Vector3 coordinates and set the passed vector "result" with this result.  
         * Returns the current Vector3.  
         */
        public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3 {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
            return this;
        }

        /**
         * Returns a new Vector3 set with the current Vector3 negated coordinates.  
         */
        public negate(): Vector3 {
            return new Vector3(-this.x, -this.y, -this.z);
        }

        /**
         * Multiplies the Vector3 coordinates by the float "scale".  
         * Returns the updated Vector3.  
         */
        public scaleInPlace(scale: number): Vector3 {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            return this;
        }

        /**
         * Returns a new Vector3 set with the current Vector3 coordinates multiplied by the float "scale".  
         */
        public scale(scale: number): Vector3 {
            return new Vector3(this.x * scale, this.y * scale, this.z * scale);
        }

        /**
         * Multiplies the current Vector3 coordinates by the float "scale" and stores the result in the passed vector "result" coordinates.  
         * Returns the current Vector3.  
         */
        public scaleToRef(scale: number, result: Vector3): Vector3 {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
            return this;
        }

        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are strictly equal.  
         */
        public equals(otherVector: Vector3): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
        }

        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are distant less than epsilon.
         */
        public equalsWithEpsilon(otherVector: Vector3, epsilon: number = Epsilon): boolean {
            return otherVector && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon) && Scalar.WithinEpsilon(this.z, otherVector.z, epsilon);
        }

        /**
         * Boolean : True if the current Vector3 coordinate equal the passed floats.  
         */
        public equalsToFloats(x: number, y: number, z: number): boolean {
            return this.x === x && this.y === y && this.z === z;
        }

        /**
         * Muliplies the current Vector3 coordinates by the passed ones.  
         * Returns the updated Vector3.  
         */
        public multiplyInPlace(otherVector: Vector3): Vector3 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
            return this;
        }

        /**
         * Returns a new Vector3, result of the multiplication of the current Vector3 by the passed vector.  
         */
        public multiply(otherVector: Vector3): Vector3 {
            return new Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
        }

        /**
         * Multiplies the current Vector3 by the passed one and stores the result in the passed vector "result".  
         * Returns the current Vector3.  
         */
        public multiplyToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
            return this;
        }

        /**
         * Returns a new Vector3 set witth the result of the mulliplication of the current Vector3 coordinates by the passed floats.  
         */
        public multiplyByFloats(x: number, y: number, z: number): Vector3 {
            return new Vector3(this.x * x, this.y * y, this.z * z);
        }

        /**
         * Returns a new Vector3 set witth the result of the division of the current Vector3 coordinates by the passed ones.  
         */
        public divide(otherVector: Vector3): Vector3 {
            return new Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
        }

        /**
         * Divides the current Vector3 coordinates by the passed ones and stores the result in the passed vector "result".  
         * Returns the current Vector3.  
         */
        public divideToRef(otherVector: Vector3, result: Vector3): Vector3 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
            return this;
        }

        /**
         * Updates the current Vector3 with the minimal coordinate values between its and the passed vector ones.  
         * Returns the updated Vector3.  
         */
        public MinimizeInPlace(other: Vector3): Vector3 {
            if (other.x < this.x) this.x = other.x;
            if (other.y < this.y) this.y = other.y;
            if (other.z < this.z) this.z = other.z;
            return this;
        }

        /**
         * Updates the current Vector3 with the maximal coordinate values between its and the passed vector ones.  
         * Returns the updated Vector3.  
         */
        public MaximizeInPlace(other: Vector3): Vector3 {
            if (other.x > this.x) this.x = other.x;
            if (other.y > this.y) this.y = other.y;
            if (other.z > this.z) this.z = other.z;
            return this;
        }

        /**
         * Return true is the vector is non uniform meaning x, y or z are not all the same.
         */
        public get isNonUniform(): boolean {
            let absX = Math.abs(this.x);
            let absY = Math.abs(this.y);
            if (absX !== absY) {
                return true;
            }

            let absZ = Math.abs(this.z);
            if (absX !== absZ) {
                return true;
            }

            if (absY !== absZ) {
                return true;
            }

            return false;
        }

        // Properties
        /**
         * Returns the length of the Vector3 (float).  
         */
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        /**
         * Returns the squared length of the Vector3 (float).  
         */
        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y + this.z * this.z);
        }

        // Methods
        /**
         * Normalize the current Vector3.  
         * Returns the updated Vector3.  
         */
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

        /**
         * Returns a new Vector3 copied from the current Vector3.  
         */
        public clone(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }

        /**
         * Copies the passed vector coordinates to the current Vector3 ones.   
         * Returns the updated Vector3.  
         */
        public copyFrom(source: Vector3): Vector3 {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            return this;
        }

        /**
         * Copies the passed floats to the current Vector3 coordinates.  
         * Returns the updated Vector3.  
         */
        public copyFromFloats(x: number, y: number, z: number): Vector3 {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        /**
         * Copies the passed floats to the current Vector3 coordinates.  
         * Returns the updated Vector3.  
         */
        public set(x: number, y: number, z: number): Vector3 {
            return this.copyFromFloats(x, y, z);
        }

        // Statics
        /**
         * 
         */
        public static GetClipFactor(vector0: Vector3, vector1: Vector3, axis: Vector3, size: number) {
            var d0 = Vector3.Dot(vector0, axis) - size;
            var d1 = Vector3.Dot(vector1, axis) - size;

            var s = d0 / (d0 - d1);

            return s;
        }

        /**
         * Returns a new Vector3 set from the index "offset" of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset?: number): Vector3 {
            if (!offset) {
                offset = 0;
            }
            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        }

        /**
         * Returns a new Vector3 set from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArray instead.
         */
        public static FromFloatArray(array: Float32Array, offset?: number): Vector3 {
            return Vector3.FromArray(array, offset);
        }

        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed array.
         */
        public static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector3): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
        }

        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArrayToRef instead.
         */
        public static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void {
            return Vector3.FromArrayToRef(array, offset, result);
        }

        /**
         * Sets the passed vector "result" with the passed floats.
         */
        public static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void {
            result.x = x;
            result.y = y;
            result.z = z;
        }

        /**
         * Returns a new Vector3 set to (0.0, 0.0, 0.0).
         */
        public static Zero(): Vector3 {
            return new Vector3(0.0, 0.0, 0.0);
        }
        /**
         * Returns a new Vector3 set to (1.0, 1.0, 1.0).
         */
        public static One(): Vector3 {
            return new Vector3(1.0, 1.0, 1.0);
        }
        /**
         * Returns a new Vector3 set to (0.0, 1.0, 0.0)
         */
        public static Up(): Vector3 {
            return new Vector3(0.0, 1.0, 0.0);
        }
        /**
         * Returns a new Vector3 set to (0.0, 0.0, 1.0)
         */
        public static Forward(): Vector3 {
            return new Vector3(0.0, 0.0, 1.0);
        }
        /**
         * Returns a new Vector3 set to (1.0, 0.0, 0.0)
         */
        public static Right(): Vector3 {
            return new Vector3(1.0, 0.0, 0.0);
        }
        /**
         * Returns a new Vector3 set to (-1.0, 0.0, 0.0)
         */
        public static Left(): Vector3 {
            return new Vector3(-1.0, 0.0, 0.0);
        }

        /**
         * Returns a new Vector3 set with the result of the transformation by the passed matrix of the passed vector.  
         * This method computes tranformed coordinates only, not transformed direction vectors. 
         */
        public static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3 {
            var result = Vector3.Zero();
            Vector3.TransformCoordinatesToRef(vector, transformation, result);
            return result;
        }

        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed vector.  
         * This method computes tranformed coordinates only, not transformed direction vectors. 
         */
        public static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
            var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];

            result.x = x / w;
            result.y = y / w;
            result.z = z / w;
        }

        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed floats (x, y, z).  
         * This method computes tranformed coordinates only, not transformed direction vectors.  
         */
        public static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            var rx = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]) + transformation.m[12];
            var ry = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]) + transformation.m[13];
            var rz = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]) + transformation.m[14];
            var rw = (x * transformation.m[3]) + (y * transformation.m[7]) + (z * transformation.m[11]) + transformation.m[15];

            result.x = rx / rw;
            result.y = ry / rw;
            result.z = rz / rw;
        }

        /**
         * Returns a new Vector3 set with the result of the normal transformation by the passed matrix of the passed vector.  
         * This methods computes transformed normalized direction vectors only.  
         */
        public static TransformNormal(vector: Vector3, transformation: Matrix): Vector3 {
            var result = Vector3.Zero();
            Vector3.TransformNormalToRef(vector, transformation, result);
            return result;
        }

        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.  
         * This methods computes transformed normalized direction vectors only. 
         */
        public static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
            result.x = x;
            result.y = y;
            result.z = z;
        }

        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z).  
         * This methods computes transformed normalized direction vectors only. 
         */
        public static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void {
            result.x = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]);
            result.y = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]);
            result.z = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]);
        }

        /**
         * Returns a new Vector3 located for "amount" on the CatmullRom interpolation spline defined by the vectors "value1", "value2", "value3", "value4".  
         */
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

        /**
         * Returns a new Vector3 set with the coordinates of "value", if the vector "value" is in the cube defined by the vectors "min" and "max".  
         * If a coordinate value of "value" is lower than one of the "min" coordinate, then this "value" coordinate is set with the "min" one.  
         * If a coordinate value of "value" is greater than one of the "max" coordinate, then this "value" coordinate is set with the "max" one. 
         */
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

        /**
         * Returns a new Vector3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
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

        /**
         * Returns a new Vector3 located for "amount" (float) on the linear interpolation between the vectors "start" and "end".  
         */
        public static Lerp(start: Vector3, end: Vector3, amount: number): Vector3 {
            var result = new Vector3(0, 0, 0);
            Vector3.LerpToRef(start, end, amount, result);
            return result;
        }

        /**
         * Sets the passed vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end".
         */
        public static LerpToRef(start: Vector3, end: Vector3, amount: number, result: Vector3): void {
            result.x = start.x + ((end.x - start.x) * amount);
            result.y = start.y + ((end.y - start.y) * amount);
            result.z = start.z + ((end.z - start.z) * amount);
        }

        /**
         * Returns the dot product (float) between the vectors "left" and "right".  
         */
        public static Dot(left: Vector3, right: Vector3): number {
            return (left.x * right.x + left.y * right.y + left.z * right.z);
        }

        /**
         * Returns a new Vector3 as the cross product of the vectors "left" and "right".    
         * The cross product is then orthogonal to both "left" and "right".  
         */
        public static Cross(left: Vector3, right: Vector3): Vector3 {
            var result = Vector3.Zero();
            Vector3.CrossToRef(left, right, result);
            return result;
        }

        /**
         * Sets the passed vector "result" with the cross product of "left" and "right".  
         * The cross product is then orthogonal to both "left" and "right". 
         */
        public static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void {
            MathTmp.Vector3[0].x = left.y * right.z - left.z * right.y;
            MathTmp.Vector3[0].y = left.z * right.x - left.x * right.z;
            MathTmp.Vector3[0].z = left.x * right.y - left.y * right.x;
            result.copyFrom(MathTmp.Vector3[0]);
        }

        /**
         * Returns a new Vector3 as the normalization of the passed vector.  
         */
        public static Normalize(vector: Vector3): Vector3 {
            var result = Vector3.Zero();
            Vector3.NormalizeToRef(vector, result);
            return result;
        }

        /**
         * Sets the passed vector "result" with the normalization of the passed first vector.  
         */
        public static NormalizeToRef(vector: Vector3, result: Vector3): void {
            result.copyFrom(vector);
            result.normalize();
        }

        private static _viewportMatrixCache: Matrix;
        public static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3 {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;

            var viewportMatrix = Vector3._viewportMatrixCache ? Vector3._viewportMatrixCache : (Vector3._viewportMatrixCache = new Matrix());

            Matrix.FromValuesToRef(
                cw / 2.0, 0, 0, 0,
                0, -ch / 2.0, 0, 0,
                0, 0, 0.5, 0,
                cx + cw / 2.0, ch / 2.0 + cy, 0.5, 1, viewportMatrix);

            var matrix = MathTmp.Matrix[0];
            world.multiplyToRef(transform, matrix);
            matrix.multiplyToRef(viewportMatrix, matrix);

            return Vector3.TransformCoordinates(vector, matrix);
        }

        public static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3 {
            var matrix = MathTmp.Matrix[0];
            world.multiplyToRef(transform, matrix);
            matrix.invert();
            source.x = source.x / viewportWidth * 2 - 1;
            source.y = -(source.y / viewportHeight * 2 - 1);
            var vector = Vector3.TransformCoordinates(source, matrix);
            var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];

            if (Scalar.WithinEpsilon(num, 1.0)) {
                vector = vector.scale(1.0 / num);
            }

            return vector;
        }

        public static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3 {
            let result = Vector3.Zero();

            Vector3.UnprojectToRef(source, viewportWidth, viewportHeight, world, view, projection, result);

            return result;
        }

        public static UnprojectToRef(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void {
            Vector3.UnprojectFloatsToRef(source.x, source.y, source.z, viewportWidth, viewportHeight, world, view, projection, result);
        }

        public static UnprojectFloatsToRef(sourceX: float, sourceY: float, sourceZ: float, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void {
            var matrix = MathTmp.Matrix[0];
            world.multiplyToRef(view, matrix)
            matrix.multiplyToRef(projection, matrix);
            matrix.invert();
            var screenSource = MathTmp.Vector3[0];
            screenSource.x = sourceX / viewportWidth * 2 - 1;
            screenSource.y = -(sourceY/ viewportHeight * 2 - 1);
            screenSource.z = 2 * sourceZ - 1.0;
            Vector3.TransformCoordinatesToRef(screenSource, matrix, result);
            var num = screenSource.x * matrix.m[3] + screenSource.y * matrix.m[7] + screenSource.z * matrix.m[11] + matrix.m[15];

            if (Scalar.WithinEpsilon(num, 1.0)) {
                result.scaleInPlace(1.0 / num);
            }
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
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".  
         */
        public static Distance(value1: Vector3, value2: Vector3): number {
            return Math.sqrt(Vector3.DistanceSquared(value1, value2));
        }
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".  
         */
        public static DistanceSquared(value1: Vector3, value2: Vector3): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;

            return (x * x) + (y * y) + (z * z);
        }

        /**
         * Returns a new Vector3 located at the center between "value1" and "value2".  
         */
        public static Center(value1: Vector3, value2: Vector3): Vector3 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }

        /**
         * Given three orthogonal normalized left-handed oriented Vector3 axis in space (target system),
         * RotationFromAxis() returns the rotation Euler angles (ex : rotation.x, rotation.y, rotation.z) to apply
         * to something in order to rotate it from its local system to the given target system.  
         * Note : axis1, axis2 and axis3 are normalized during this operation.   
         * Returns a new Vector3.  
         */
        public static RotationFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3): Vector3 {
            var rotation = Vector3.Zero();
            Vector3.RotationFromAxisToRef(axis1, axis2, axis3, rotation);
            return rotation;
        }

        /**
         * The same than RotationFromAxis but updates the passed ref Vector3 parameter instead of returning a new Vector3.  
         */
        public static RotationFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Vector3): void {
            var quat = MathTmp.Quaternion[0];
            Quaternion.RotationQuaternionFromAxisToRef(axis1, axis2, axis3, quat);
            quat.toEulerAnglesToRef(ref);
        }
    }


    //Vector4 class created for EulerAngle class conversion to Quaternion
    export class Vector4 {
        /**
         * Creates a Vector4 object from the passed floats.  
         */
        constructor(public x: number, public y: number, public z: number, public w: number) { }

        /**
         * Returns the string with the Vector4 coordinates.  
         */
        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        }

        /**
         * Returns the string "Vector4".  
         */
        public getClassName(): string {
            return "Vector4";
        }

        /**
         * Returns the Vector4 hash code.  
         */
        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            hash = (hash * 397) ^ (this.w || 0);
            return hash;
        }

        // Operators
        /**
         * Returns a new array populated with 4 elements : the Vector4 coordinates.  
         */
        public asArray(): number[] {
            var result = new Array<number>();

            this.toArray(result, 0);

            return result;
        }

        /**
         * Populates the passed array from the passed index with the Vector4 coordinates.  
         * Returns the Vector4.  
         */
        public toArray(array: FloatArray, index?: number): Vector4 {
            if (index === undefined) {
                index = 0;
            }
            array[index] = this.x;
            array[index + 1] = this.y;
            array[index + 2] = this.z;
            array[index + 3] = this.w;
            return this;
        }

        /**
         * Adds the passed vector to the current Vector4.   
         * Returns the updated Vector4.  
         */
        public addInPlace(otherVector: Vector4): Vector4 {
            this.x += otherVector.x;
            this.y += otherVector.y;
            this.z += otherVector.z;
            this.w += otherVector.w;
            return this;
        }

        /**
         * Returns a new Vector4 as the result of the addition of the current Vector4 and the passed one.  
         */
        public add(otherVector: Vector4): Vector4 {
            return new Vector4(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z, this.w + otherVector.w);
        }

        /**
         * Updates the passed vector "result" with the result of the addition of the current Vector4 and the passed one.  
         * Returns the current Vector4.  
         */
        public addToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x + otherVector.x;
            result.y = this.y + otherVector.y;
            result.z = this.z + otherVector.z;
            result.w = this.w + otherVector.w;
            return this;
        }

        /**
         * Subtract in place the passed vector from the current Vector4.  
         * Returns the updated Vector4.  
         */
        public subtractInPlace(otherVector: Vector4): Vector4 {
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            this.z -= otherVector.z;
            this.w -= otherVector.w;
            return this;
        }

        /**
         * Returns a new Vector4 with the result of the subtraction of the passed vector from the current Vector4.  
         */
        public subtract(otherVector: Vector4): Vector4 {
            return new Vector4(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z, this.w - otherVector.w);
        }

        /**
         * Sets the passed vector "result" with the result of the subtraction of the passed vector from the current Vector4. 
         * Returns the current Vector4.  
         */
        public subtractToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x - otherVector.x;
            result.y = this.y - otherVector.y;
            result.z = this.z - otherVector.z;
            result.w = this.w - otherVector.w;
            return this;
        }

        /**
         * Returns a new Vector4 set with the result of the subtraction of the passed floats from the current Vector4 coordinates.
         */
        public subtractFromFloats(x: number, y: number, z: number, w: number): Vector4 {
            return new Vector4(this.x - x, this.y - y, this.z - z, this.w - w);
        }

        /**
         * Sets the passed vector "result" set with the result of the subtraction of the passed floats from the current Vector4 coordinates.  
         * Returns the current Vector4.  
         */
        public subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): Vector4 {
            result.x = this.x - x;
            result.y = this.y - y;
            result.z = this.z - z;
            result.w = this.w - w;
            return this;
        }

        /**
         * Returns a new Vector4 set with the current Vector4 negated coordinates.  
         */
        public negate(): Vector4 {
            return new Vector4(-this.x, -this.y, -this.z, -this.w);
        }

        /**
         * Multiplies the current Vector4 coordinates by scale (float).  
         * Returns the updated Vector4.  
         */
        public scaleInPlace(scale: number): Vector4 {
            this.x *= scale;
            this.y *= scale;
            this.z *= scale;
            this.w *= scale;
            return this;
        }

        /**
         * Returns a new Vector4 set with the current Vector4 coordinates multiplied by scale (float).  
         */
        public scale(scale: number): Vector4 {
            return new Vector4(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
        }

        /**
         * Sets the passed vector "result" with the current Vector4 coordinates multiplied by scale (float).  
         * Returns the current Vector4.  
         */
        public scaleToRef(scale: number, result: Vector4): Vector4 {
            result.x = this.x * scale;
            result.y = this.y * scale;
            result.z = this.z * scale;
            result.w = this.w * scale;
            return this;
        }

        /**
         * Boolean : True if the current Vector4 coordinates are stricly equal to the passed ones.  
         */
        public equals(otherVector: Vector4): boolean {
            return otherVector && this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z && this.w === otherVector.w;
        }

        /**
         * Boolean : True if the current Vector4 coordinates are each beneath the distance "epsilon" from the passed vector ones.  
         */
        public equalsWithEpsilon(otherVector: Vector4, epsilon: number = Epsilon): boolean {
            return otherVector
                && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon)
                && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon)
                && Scalar.WithinEpsilon(this.z, otherVector.z, epsilon)
                && Scalar.WithinEpsilon(this.w, otherVector.w, epsilon);
        }

        /**
         * Boolean : True if the passed floats are strictly equal to the current Vector4 coordinates.  
         */
        public equalsToFloats(x: number, y: number, z: number, w: number): boolean {
            return this.x === x && this.y === y && this.z === z && this.w === w;
        }

        /**
         * Multiplies in place the current Vector4 by the passed one.  
         * Returns the updated Vector4.  
         */
        public multiplyInPlace(otherVector: Vector4): Vector4 {
            this.x *= otherVector.x;
            this.y *= otherVector.y;
            this.z *= otherVector.z;
            this.w *= otherVector.w;
            return this;
        }

        /**
         * Returns a new Vector4 set with the multiplication result of the current Vector4 and the passed one.  
         */
        public multiply(otherVector: Vector4): Vector4 {
            return new Vector4(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z, this.w * otherVector.w);
        }
        /**
         * Updates the passed vector "result" with the multiplication result of the current Vector4 and the passed one.  
         * Returns the current Vector4.  
         */
        public multiplyToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x * otherVector.x;
            result.y = this.y * otherVector.y;
            result.z = this.z * otherVector.z;
            result.w = this.w * otherVector.w;
            return this;
        }
        /**
         * Returns a new Vector4 set with the multiplication result of the passed floats and the current Vector4 coordinates.  
         */
        public multiplyByFloats(x: number, y: number, z: number, w: number): Vector4 {
            return new Vector4(this.x * x, this.y * y, this.z * z, this.w * w);
        }
        /**
         * Returns a new Vector4 set with the division result of the current Vector4 by the passed one.  
         */
        public divide(otherVector: Vector4): Vector4 {
            return new Vector4(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z, this.w / otherVector.w);
        }
        /**
         * Updates the passed vector "result" with the division result of the current Vector4 by the passed one.  
         * Returns the current Vector4.  
         */
        public divideToRef(otherVector: Vector4, result: Vector4): Vector4 {
            result.x = this.x / otherVector.x;
            result.y = this.y / otherVector.y;
            result.z = this.z / otherVector.z;
            result.w = this.w / otherVector.w;
            return this;
        }

        /**
         * Updates the Vector4 coordinates with the minimum values between its own and the passed vector ones.  
         */
        public MinimizeInPlace(other: Vector4): Vector4 {
            if (other.x < this.x) this.x = other.x;
            if (other.y < this.y) this.y = other.y;
            if (other.z < this.z) this.z = other.z;
            if (other.w < this.w) this.w = other.w;
            return this;
        }
        /**
         * Updates the Vector4 coordinates with the maximum values between its own and the passed vector ones.  
         */
        public MaximizeInPlace(other: Vector4): Vector4 {
            if (other.x > this.x) this.x = other.x;
            if (other.y > this.y) this.y = other.y;
            if (other.z > this.z) this.z = other.z;
            if (other.w > this.w) this.w = other.w;
            return this;
        }

        // Properties
        /**
         * Returns the Vector4 length (float).  
         */
        public length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }
        /**
         * Returns the Vector4 squared length (float).  
         */
        public lengthSquared(): number {
            return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        // Methods
        /**
         * Normalizes in place the Vector4.  
         * Returns the updated Vector4.  
         */
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

        /**
         * Returns a new Vector3 from the Vector4 (x, y, z) coordinates.  
         */
        public toVector3(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }
        /**
         * Returns a new Vector4 copied from the current one.  
         */
        public clone(): Vector4 {
            return new Vector4(this.x, this.y, this.z, this.w);
        }
        /**
         * Updates the current Vector4 with the passed one coordinates.  
         * Returns the updated Vector4.  
         */
        public copyFrom(source: Vector4): Vector4 {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            this.w = source.w;
            return this;
        }
        /**
         * Updates the current Vector4 coordinates with the passed floats.  
         * Returns the updated Vector4.  
         */
        public copyFromFloats(x: number, y: number, z: number, w: number): Vector4 {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }
        /**
         * Updates the current Vector4 coordinates with the passed floats.  
         * Returns the updated Vector4.  
         */
        public set(x: number, y: number, z: number, w: number): Vector4 {
            return this.copyFromFloats(x, y, z, w);
        }

        // Statics
        /**
         * Returns a new Vector4 set from the starting index of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset?: number): Vector4 {
            if (!offset) {
                offset = 0;
            }
            return new Vector4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }
        /**
         * Updates the passed vector "result" from the starting index of the passed array.
         */
        public static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector4): void {
            result.x = array[offset];
            result.y = array[offset + 1];
            result.z = array[offset + 2];
            result.w = array[offset + 3];
        }
        /**
         * Updates the passed vector "result" from the starting index of the passed Float32Array.
         */
        public static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void {
            Vector4.FromArrayToRef(array, offset, result);
        }
        /**
         * Updates the passed vector "result" coordinates from the passed floats.  
         */
        public static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void {
            result.x = x;
            result.y = y;
            result.z = z;
            result.w = w;
        }
        /**
         * Returns a new Vector4 set to (0.0, 0.0, 0.0, 0.0)
         */
        public static Zero(): Vector4 {
            return new Vector4(0.0, 0.0, 0.0, 0.0);
        }
        /**
         * Returns a new Vector4 set to (1.0, 1.0, 1.0, 1.0)
         */
        public static One(): Vector4 {
            return new Vector4(1.0, 1.0, 1.0, 1.0);
        }
        /**
         * Returns a new normalized Vector4 from the passed one.  
         */
        public static Normalize(vector: Vector4): Vector4 {
            var result = Vector4.Zero();
            Vector4.NormalizeToRef(vector, result);
            return result;
        }
        /**
         * Updates the passed vector "result" from the normalization of the passed one.
         */
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
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".  
         */
        public static Distance(value1: Vector4, value2: Vector4): number {
            return Math.sqrt(Vector4.DistanceSquared(value1, value2));
        }
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".  
         */
        public static DistanceSquared(value1: Vector4, value2: Vector4): number {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;
            var w = value1.w - value2.w;

            return (x * x) + (y * y) + (z * z) + (w * w);
        }
        /**
         * Returns a new Vector4 located at the center between the vectors "value1" and "value2".  
         */
        public static Center(value1: Vector4, value2: Vector4): Vector4 {
            var center = value1.add(value2);
            center.scaleInPlace(0.5);
            return center;
        }

        /**
         * Returns a new Vector4 set with the result of the normal transformation by the passed matrix of the passed vector.  
         * This methods computes transformed normalized direction vectors only.  
         */
        public static TransformNormal(vector: Vector4, transformation: Matrix): Vector4 {
            var result = Vector4.Zero();
            Vector4.TransformNormalToRef(vector, transformation, result);
            return result;
        }

        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.  
         * This methods computes transformed normalized direction vectors only. 
         */
        public static TransformNormalToRef(vector: Vector4, transformation: Matrix, result: Vector4): void {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
            result.x = x;
            result.y = y;
            result.z = z;
            result.w = vector.w;
        }

        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z, w).  
         * This methods computes transformed normalized direction vectors only. 
         */
        public static TransformNormalFromFloatsToRef(x: number, y: number, z: number, w: number, transformation: Matrix, result: Vector4): void {
            result.x = (x * transformation.m[0]) + (y * transformation.m[4]) + (z * transformation.m[8]);
            result.y = (x * transformation.m[1]) + (y * transformation.m[5]) + (z * transformation.m[9]);
            result.z = (x * transformation.m[2]) + (y * transformation.m[6]) + (z * transformation.m[10]);
            result.w = w;
        }
    }

    export interface ISize {
        width: number;
        height: number;
    }

    export class Size implements ISize {
        width: number;
        height: number;
        /**
         * Creates a Size object from the passed width and height (floats).  
         */
        public constructor(width: number, height: number) {
            this.width = width;
            this.height = height;
        }
        // Returns a string with the Size width and height.  
        public toString(): string {
            return `{W: ${this.width}, H: ${this.height}}`;
        }
        /** 
         * Returns the string "Size"
         */
        public getClassName(): string {
            return "Size";
        }
        /** 
         * Returns the Size hash code.  
         */
        public getHashCode(): number {
            let hash = this.width || 0;
            hash = (hash * 397) ^ (this.height || 0);
            return hash;
        }
        /**
         * Updates the current size from the passed one.  
         * Returns the updated Size.  
         */
        public copyFrom(src: Size) {
            this.width = src.width;
            this.height = src.height;
        }
        /**
         * Updates in place the current Size from the passed floats.  
         * Returns the updated Size.   
         */
        public copyFromFloats(width: number, height: number): Size {
            this.width = width;
            this.height = height;
            return this;
        }
        /**
         * Updates in place the current Size from the passed floats.  
         * Returns the updated Size.   
         */
        public set(width: number, height: number): Size {
            return this.copyFromFloats(width, height);
        }
        /**
         * Returns a new Size set with the multiplication result of the current Size and the passed floats.  
         */
        public multiplyByFloats(w: number, h: number): Size {
            return new Size(this.width * w, this.height * h);
        }
        /**
         * Returns a new Size copied from the passed one.  
         */
        public clone(): Size {
            return new Size(this.width, this.height);
        }
        /**
         * Boolean : True if the current Size and the passed one width and height are strictly equal.  
         */
        public equals(other: Size): boolean {
            if (!other) {
                return false;
            }
            return (this.width === other.width) && (this.height === other.height);
        }
        /**
         * Returns the surface of the Size : width * height (float).  
         */
        public get surface(): number {
            return this.width * this.height;
        }
        /**
         * Returns a new Size set to (0.0, 0.0)
         */
        public static Zero(): Size {
            return new Size(0.0, 0.0);
        }
        /**
         * Returns a new Size set as the addition result of the current Size and the passed one.  
         */
        public add(otherSize: Size): Size {
            let r = new Size(this.width + otherSize.width, this.height + otherSize.height);
            return r;
        }
        /**
         * Returns a new Size set as the subtraction result of  the passed one from the current Size.
         */
        public subtract(otherSize: Size): Size {
            let r = new Size(this.width - otherSize.width, this.height - otherSize.height);
            return r;
        }
        /**
         * Returns a new Size set at the linear interpolation "amount" between "start" and "end".  
         */
        public static Lerp(start: Size, end: Size, amount: number): Size {
            var w = start.width + ((end.width - start.width) * amount);
            var h = start.height + ((end.height - start.height) * amount);

            return new Size(w, h);
        }

    }


    export class Quaternion {
        /**
         * Creates a new Quaternion from the passed floats.  
         */
        constructor(public x: number = 0.0, public y: number = 0.0, public z: number = 0.0, public w: number = 1.0) {
        }
        /**
         * Returns a string with the Quaternion coordinates.  
         */
        public toString(): string {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
        }
        /**
         * Returns the string "Quaternion".  
         */
        public getClassName(): string {
            return "Quaternion";
        }

        /**
         * Returns the Quaternion hash code.  
         */
        public getHashCode(): number {
            let hash = this.x || 0;
            hash = (hash * 397) ^ (this.y || 0);
            hash = (hash * 397) ^ (this.z || 0);
            hash = (hash * 397) ^ (this.w || 0);
            return hash;
        }

        /**
         * Returns a new array populated with 4 elements : the Quaternion coordinates.  
         */
        public asArray(): number[] {
            return [this.x, this.y, this.z, this.w];
        }
        /**
         * Boolean : True if the current Quaterion and the passed one coordinates are strictly equal.  
         */
        public equals(otherQuaternion: Quaternion): boolean {
            return otherQuaternion && this.x === otherQuaternion.x && this.y === otherQuaternion.y && this.z === otherQuaternion.z && this.w === otherQuaternion.w;
        }
        /**
         * Returns a new Quaternion copied from the current one.  
         */
        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }
        /**
         * Updates the current Quaternion from the passed one coordinates.  
         * Returns the updated Quaterion.  
         */
        public copyFrom(other: Quaternion): Quaternion {
            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;
            return this;
        }
        /**
         * Updates the current Quaternion from the passed float coordinates.  
         * Returns the updated Quaterion.  
         */
        public copyFromFloats(x: number, y: number, z: number, w: number): Quaternion {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        }
        /**
         * Updates the current Quaternion from the passed float coordinates.  
         * Returns the updated Quaterion.  
         */
        public set(x: number, y: number, z: number, w: number): Quaternion {
            return this.copyFromFloats(x, y, z, w);
        }
        /**
         * Returns a new Quaternion as the addition result of the passed one and the current Quaternion.  
         */
        public add(other: Quaternion): Quaternion {
            return new Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
        }
        /**
         * Returns a new Quaternion as the subtraction result of the passed one from the current Quaternion.  
         */
        public subtract(other: Quaternion): Quaternion {
            return new Quaternion(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
        }
        /**
         * Returns a new Quaternion set by multiplying the current Quaterion coordinates by the float "scale".  
         */
        public scale(value: number): Quaternion {
            return new Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
        }
        /**
         * Returns a new Quaternion set as the quaternion mulplication result of the current one with the passed one "q1".  
         */
        public multiply(q1: Quaternion): Quaternion {
            var result = new Quaternion(0, 0, 0, 1.0);
            this.multiplyToRef(q1, result);
            return result;
        }
        /**
         * Sets the passed "result" as the quaternion mulplication result of the current one with the passed one "q1".  
         * Returns the current Quaternion.  
         */
        public multiplyToRef(q1: Quaternion, result: Quaternion): Quaternion {
            var x = this.x * q1.w + this.y * q1.z - this.z * q1.y + this.w * q1.x;
            var y = -this.x * q1.z + this.y * q1.w + this.z * q1.x + this.w * q1.y;
            var z = this.x * q1.y - this.y * q1.x + this.z * q1.w + this.w * q1.z;
            var w = -this.x * q1.x - this.y * q1.y - this.z * q1.z + this.w * q1.w;
            result.copyFromFloats(x, y, z, w);
            return this;
        }
        /**
         * Updates the current Quaternion with the quaternion mulplication result of itself with the passed one "q1".  
         * Returns the updated Quaternion.  
         */
        public multiplyInPlace(q1: Quaternion): Quaternion {
            this.multiplyToRef(q1, this);
            return this;
        }
        /**
         * Sets the passed "ref" with the conjugation of the current Quaternion.  
         * Returns the current Quaternion.  
         */
        public conjugateToRef(ref: Quaternion): Quaternion {
            ref.copyFromFloats(-this.x, -this.y, -this.z, this.w);
            return this;
        }
        /** 
         * Conjugates in place the current Quaternion.
         * Returns the updated Quaternion.  
         */
        public conjugateInPlace(): Quaternion {
            this.x *= -1;
            this.y *= -1;
            this.z *= -1;
            return this;
        }
        /**
         * Returns a new Quaternion as the conjugate of the current Quaternion.   
         */
        public conjugate(): Quaternion {
            var result = new Quaternion(-this.x, -this.y, -this.z, this.w);
            return result;
        }
        /**
         * Returns the Quaternion length (float).  
         */
        public length(): number {
            return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
        }
        /**
         * Normalize in place the current Quaternion.  
         * Returns the updated Quaternion.  
         */
        public normalize(): Quaternion {
            var length = 1.0 / this.length();
            this.x *= length;
            this.y *= length;
            this.z *= length;
            this.w *= length;
            return this;
        }
        /**
         * Returns a new Vector3 set with the Euler angles translated from the current Quaternion.  
         */
        public toEulerAngles(order = "YZX"): Vector3 {
            var result = Vector3.Zero();
            this.toEulerAnglesToRef(result, order);
            return result;
        }

        /**
         * Sets the passed vector3 "result" with the Euler angles translated from the current Quaternion.  
         * Returns the current Quaternion.  
         */
        public toEulerAnglesToRef(result: Vector3, order = "YZX"): Quaternion {

            var qz = this.z;
            var qx = this.x;
            var qy = this.y;
            var qw = this.w;

            var sqw = qw * qw;
            var sqz = qz * qz;
            var sqx = qx * qx;
            var sqy = qy * qy;

            var zAxisY = qy * qz - qx * qw;
            var limit = .4999999;

            if (zAxisY < -limit) {
                result.y = 2 * Math.atan2(qy, qw);
                result.x = Math.PI / 2;
                result.z = 0;
            } else if (zAxisY > limit) {
                result.y = 2 * Math.atan2(qy, qw);
                result.x = -Math.PI / 2;
                result.z = 0;
            } else {
                result.z = Math.atan2(2.0 * (qx * qy + qz * qw), (-sqz - sqx + sqy + sqw));
                result.x = Math.asin(-2.0 * (qz * qy - qx * qw));
                result.y = Math.atan2(2.0 * (qz * qx + qy * qw), (sqz - sqx - sqy + sqw));
            }

            return this;

        }
        /**
         * Updates the passed rotation matrix with the current Quaternion values.  
         * Returns the current Quaternion.  
         */
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

            result._markAsUpdated();
            return this;
        }
        /**
         * Updates the current Quaternion from the passed rotation matrix values.  
         * Returns the updated Quaternion.  
         */
        public fromRotationMatrix(matrix: Matrix): Quaternion {
            Quaternion.FromRotationMatrixToRef(matrix, this);
            return this;
        }

        // Statics
        /**
         * Returns a new Quaternion set from the passed rotation matrix values.  
         */
        public static FromRotationMatrix(matrix: Matrix): Quaternion {
            var result = new Quaternion();
            Quaternion.FromRotationMatrixToRef(matrix, result);
            return result;
        }
        /**
         * Updates the passed quaternion "result" with the passed rotation matrix values.  
         */
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
        /**
         * Returns a new Quaternion set to (0.0, 0.0, 0.0).  
         */
        public static Zero(): Quaternion {
            return new Quaternion(0.0, 0.0, 0.0, 0.0);
        }
        /**
         * Returns a new Quaternion as the inverted current Quaternion.  
         */
        public static Inverse(q: Quaternion): Quaternion {
            return new Quaternion(-q.x, -q.y, -q.z, q.w);
        }
        /**
         * Returns the identity Quaternion.  
         */
        public static Identity(): Quaternion {
            return new Quaternion(0.0, 0.0, 0.0, 1.0);
        }

        public static IsIdentity(quaternion: Quaternion) {
            return quaternion && quaternion.x === 0 && quaternion.y === 0 && quaternion.z === 0 && quaternion.w === 1;
        }
        /**
         * Returns a new Quaternion set from the passed axis (Vector3) and angle in radians (float). 
         */
        public static RotationAxis(axis: Vector3, angle: number): Quaternion {
            return Quaternion.RotationAxisToRef(axis, angle, new Quaternion());
        }
        /**
         * Sets the passed quaternion "result" from the passed axis (Vector3) and angle in radians (float). 
         */
        public static RotationAxisToRef(axis: Vector3, angle: number, result: Quaternion): Quaternion {
            var sin = Math.sin(angle / 2);
            axis.normalize();
            result.w = Math.cos(angle / 2);
            result.x = axis.x * sin;
            result.y = axis.y * sin;
            result.z = axis.z * sin;
            return result;
        }
        /**
         * Retuns a new Quaternion set from the starting index of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset?: number): Quaternion {
            if (!offset) {
                offset = 0;
            }
            return new Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
        }
        /**
         * Returns a new Quaternion set from the passed Euler float angles (y, x, z).  
         */
        public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion {
            var q = new Quaternion();
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, q);
            return q;
        }
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles (y, x, z).  
         */
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
        /**
         * Returns a new Quaternion from the passed float Euler angles expressed in z-x-z orientation
         */
        public static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion {
            var result = new Quaternion();
            Quaternion.RotationAlphaBetaGammaToRef(alpha, beta, gamma, result);
            return result;
        }
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles expressed in z-x-z orientation
         */
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

        /**
         * Returns a new Quaternion as the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.   
         * cf to Vector3.RotationFromAxis() documentation.  
         * Note : axis1, axis2 and axis3 are normalized during this operation.   
         */
        public static RotationQuaternionFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): Quaternion {
            var quat = new Quaternion(0.0, 0.0, 0.0, 0.0);
            Quaternion.RotationQuaternionFromAxisToRef(axis1, axis2, axis3, quat);
            return quat;
        }
        /**
         * Sets the passed quaternion "ref" with the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.   
         * cf to Vector3.RotationFromAxis() documentation.  
         * Note : axis1, axis2 and axis3 are normalized during this operation.   
         */
        public static RotationQuaternionFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): void {
            var rotMat = MathTmp.Matrix[0];
            BABYLON.Matrix.FromXYZAxesToRef(axis1.normalize(), axis2.normalize(), axis3.normalize(), rotMat);
            BABYLON.Quaternion.FromRotationMatrixToRef(rotMat, ref);
        }

        public static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion {
            var result = Quaternion.Identity();

            Quaternion.SlerpToRef(left, right, amount, result);

            return result;
        }

        public static SlerpToRef(left: Quaternion, right: Quaternion, amount: number, result: Quaternion): void {
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

        /**
         * Returns a new Quaternion located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
        public static Hermite(value1: Quaternion, tangent1: Quaternion, value2: Quaternion, tangent2: Quaternion, amount: number): Quaternion {
            var squared = amount * amount;
            var cubed = amount * squared;
            var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
            var part2 = (-2.0 * cubed) + (3.0 * squared);
            var part3 = (cubed - (2.0 * squared)) + amount;
            var part4 = cubed - squared;

            var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
            var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
            var z = (((value1.z * part1) + (value2.z * part2)) + (tangent1.z * part3)) + (tangent2.z * part4);
            var w = (((value1.w * part1) + (value2.w * part2)) + (tangent1.w * part3)) + (tangent2.w * part4);
            return new Quaternion(x, y, z, w);
        }
    }

    export class Matrix {
        private static _tempQuaternion: Quaternion = new Quaternion();
        private static _xAxis: Vector3 = Vector3.Zero();
        private static _yAxis: Vector3 = Vector3.Zero();
        private static _zAxis: Vector3 = Vector3.Zero();
        private static _updateFlagSeed = 0;
        private static _identityReadOnly = Matrix.Identity();

        private _isIdentity = false;
        private _isIdentityDirty = true;
        public updateFlag: number;        
        public m: Float32Array = new Float32Array(16);

        public _markAsUpdated() {
            this.updateFlag = Matrix._updateFlagSeed++;
            this._isIdentityDirty = true;
        }

        public constructor() {
            this._markAsUpdated();
        }

        // Properties
        /**
         * Boolean : True is the matrix is the identity matrix
         */
        public isIdentity(considerAsTextureMatrix = false): boolean {
            if (this._isIdentityDirty) {
                this._isIdentityDirty = false;
                if (this.m[0] !== 1.0 || this.m[5] !== 1.0 || this.m[15] !== 1.0) {
                    this._isIdentity = false;
                } else if (this.m[1] !== 0.0 || this.m[2] !== 0.0 || this.m[3] !== 0.0 ||
                    this.m[4] !== 0.0 || this.m[6] !== 0.0 || this.m[7] !== 0.0 ||
                    this.m[8] !== 0.0 || this.m[9] !== 0.0 || this.m[11] !== 0.0 ||
                    this.m[12] !== 0.0 || this.m[13] !== 0.0 || this.m[14] !== 0.0) {
                    this._isIdentity = false;
                } else {
                    this._isIdentity = true;
                }

                if (!considerAsTextureMatrix && this.m[10] !== 1.0) {
                    this._isIdentity = false;
                }
            }

            return this._isIdentity;
        }
        /**
         * Returns the matrix determinant (float).  
         */
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
        /**
         * Returns the matrix underlying array.  
         */
        public toArray(): Float32Array {
            return this.m;
        }
        /**
        * Returns the matrix underlying array.  
        */
        public asArray(): Float32Array {
            return this.toArray();
        }
        /**
         * Inverts in place the Matrix.  
         * Returns the Matrix inverted.  
         */
        public invert(): Matrix {
            this.invertToRef(this);
            return this;
        }
        /**
         * Sets all the matrix elements to zero.  
         * Returns the Matrix.  
         */
        public reset(): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] = 0.0;
            }

            this._markAsUpdated();
            return this;
        }
        /**
         * Returns a new Matrix as the addition result of the current Matrix and the passed one.  
         */
        public add(other: Matrix): Matrix {
            var result = new Matrix();
            this.addToRef(other, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" with the ddition result of the current Matrix and the passed one.  
         * Returns the Matrix.  
         */
        public addToRef(other: Matrix, result: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                result.m[index] = this.m[index] + other.m[index];
            }
            result._markAsUpdated();
            return this;
        }
        /**
         * Adds in place the passed matrix to the current Matrix.  
         * Returns the updated Matrix.  
         */
        public addToSelf(other: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] += other.m[index];
            }
            this._markAsUpdated();
            return this;
        }
        /**
         * Sets the passed matrix with the current inverted Matrix.  
         * Returns the unmodified current Matrix.  
         */
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

            other._markAsUpdated();
            return this;
        }
        /**
         * Inserts the translation vector (using 3 x floats) in the current Matrix.  
         * Returns the updated Matrix.  
         */
        public setTranslationFromFloats(x: number, y: number, z: number): Matrix {
            this.m[12] = x;
            this.m[13] = y;
            this.m[14] = z;

            this._markAsUpdated();
            return this;
        }
        /**
 * Inserts the translation vector in the current Matrix.  
 * Returns the updated Matrix.  
 */
        public setTranslation(vector3: Vector3): Matrix {
            this.m[12] = vector3.x;
            this.m[13] = vector3.y;
            this.m[14] = vector3.z;

            this._markAsUpdated();
            return this;
        }
        /**
         * Returns a new Vector3 as the extracted translation from the Matrix.  
         */
        public getTranslation(): Vector3 {
            return new Vector3(this.m[12], this.m[13], this.m[14]);
        }
        /**
         * Fill a Vector3 with the extracted translation from the Matrix.  
         */
        public getTranslationToRef(result: Vector3): Matrix {
            result.x = this.m[12];
            result.y = this.m[13];
            result.z = this.m[14];

            return this;
        }
        /**
         * Remove rotation and scaling part from the Matrix. 
         * Returns the updated Matrix. 
         */
        public removeRotationAndScaling(): Matrix {
            this.setRowFromFloats(0, 1, 0, 0, 0);
            this.setRowFromFloats(1, 0, 1, 0, 0);
            this.setRowFromFloats(2, 0, 0, 1, 0);
            return this;
        }
        /**
         * Returns a new Matrix set with the multiplication result of the current Matrix and the passed one.  
         */
        public multiply(other: Matrix): Matrix {
            var result = new Matrix();
            this.multiplyToRef(other, result);
            return result;
        }
        /**
         * Updates the current Matrix from the passed one values.  
         * Returns the updated Matrix.  
         */
        public copyFrom(other: Matrix): Matrix {
            for (var index = 0; index < 16; index++) {
                this.m[index] = other.m[index];
            }

            this._markAsUpdated();
            return this;
        }
        /**
         * Populates the passed array from the starting index with the Matrix values.  
         * Returns the Matrix.  
         */
        public copyToArray(array: Float32Array, offset: number = 0): Matrix {
            for (var index = 0; index < 16; index++) {
                array[offset + index] = this.m[index];
            }
            return this;
        }
        /**
         * Sets the passed matrix "result" with the multiplication result of the current Matrix and the passed one.  
         */
        public multiplyToRef(other: Matrix, result: Matrix): Matrix {
            this.multiplyToArray(other, result.m, 0);

            result._markAsUpdated();
            return this;
        }
        /**
         * Sets the Float32Array "result" from the passed index "offset" with the multiplication result of the current Matrix and the passed one.  
         */
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
        /**
         * Boolean : True is the current Matrix and the passed one values are strictly equal.  
         */
        public equals(value: Matrix): boolean {
            return value &&
                (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] &&
                    this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] &&
                    this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] &&
                    this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
        }
        /**
         * Returns a new Matrix from the current Matrix.  
         */
        public clone(): Matrix {
            return Matrix.FromValues(this.m[0], this.m[1], this.m[2], this.m[3],
                this.m[4], this.m[5], this.m[6], this.m[7],
                this.m[8], this.m[9], this.m[10], this.m[11],
                this.m[12], this.m[13], this.m[14], this.m[15]);
        }
        /**
         * Returns the string "Matrix"
         */
        public getClassName(): string {
            return "Matrix";
        }
        /**
         * Returns the Matrix hash code.  
         */
        public getHashCode(): number {
            let hash = this.m[0] || 0;
            for (let i = 1; i < 16; i++) {
                hash = (hash * 397) ^ (this.m[i] || 0);
            }
            return hash;
        }
        /**
         * Decomposes the current Matrix into : 
         * - a scale vector3 passed as a reference to update, 
         * - a rotation quaternion passed as a reference to update,
         * - a translation vector3 passed as a reference to update.  
         * Returns the boolean `true`.  
         */
        public decompose(scale: Vector3, rotation: Quaternion, translation: Vector3): boolean {
            translation.x = this.m[12];
            translation.y = this.m[13];
            translation.z = this.m[14];

            scale.x = Math.sqrt(this.m[0] * this.m[0] + this.m[1] * this.m[1] + this.m[2] * this.m[2]);
            scale.y = Math.sqrt(this.m[4] * this.m[4] + this.m[5] * this.m[5] + this.m[6] * this.m[6]);
            scale.z = Math.sqrt(this.m[8] * this.m[8] + this.m[9] * this.m[9] + this.m[10] * this.m[10]);

            if (this.determinant() <= 0) {
                scale.y *= -1;
            }

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
                0, 0, 0, 1, MathTmp.Matrix[0]);

            Quaternion.FromRotationMatrixToRef(MathTmp.Matrix[0], rotation);

            return true;
        }
        /**
         * Returns a new Matrix as the extracted rotation matrix from the current one.  
         */
        public getRotationMatrix(): Matrix {
            var result = Matrix.Identity();
            this.getRotationMatrixToRef(result);
            return result;
        }
        /**
         * Extracts the rotation matrix from the current one and sets it as the passed "result".  
         * Returns the current Matrix.  
         */
        public getRotationMatrixToRef(result: Matrix): Matrix {
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

            return this;
        }

        // Statics
        /**
         * Returns a new Matrix set from the starting index of the passed array.
         */
        public static FromArray(array: ArrayLike<number>, offset?: number): Matrix {
            var result = new Matrix();

            if (!offset) {
                offset = 0;
            }
            Matrix.FromArrayToRef(array, offset, result);
            return result;
        }
        /**
         * Sets the passed "result" matrix from the starting index of the passed array.
         */
        public static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Matrix) {
            for (var index = 0; index < 16; index++) {
                result.m[index] = array[index + offset];
            }
            result._markAsUpdated();
        }
        /**
         * Sets the passed "result" matrix from the starting index of the passed Float32Array by multiplying each element by the float "scale".  
         */
        public static FromFloat32ArrayToRefScaled(array: Float32Array, offset: number, scale: number, result: Matrix) {
            for (var index = 0; index < 16; index++) {
                result.m[index] = array[index + offset] * scale;
            }

            result._markAsUpdated();
        }
        /**
         * Sets the passed matrix "result" with the 16 passed floats.  
         */
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

            result._markAsUpdated();
        }
        /**
         * Returns the index-th row of the current matrix as a new Vector4.  
         */
        public getRow(index: number): Nullable<Vector4> {
            if (index < 0 || index > 3) {
                return null;
            }
            var i = index * 4;
            return new Vector4(this.m[i + 0], this.m[i + 1], this.m[i + 2], this.m[i + 3]);
        }
        /**
         * Sets the index-th row of the current matrix with the passed Vector4 values.
         * Returns the updated Matrix.    
         */
        public setRow(index: number, row: Vector4): Matrix {
            if (index < 0 || index > 3) {
                return this;
            }
            var i = index * 4;
            this.m[i + 0] = row.x;
            this.m[i + 1] = row.y;
            this.m[i + 2] = row.z;
            this.m[i + 3] = row.w;

            this._markAsUpdated();

            return this;
        }

        /**
         * Compute the transpose of the matrix.  
         * Returns a new Matrix.  
         */        
        public transpose(): Matrix {
            return Matrix.Transpose(this);
        }

        /**
         * Compute the transpose of the matrix.  
         * Returns the current matrix.  
         */        
        public transposeToRef(result: Matrix): Matrix {
            Matrix.TransposeToRef(this, result);

            return this;
        }

        /**
         * Sets the index-th row of the current matrix with the passed 4 x float values.
         * Returns the updated Matrix.    
         */
        public setRowFromFloats(index: number, x: number, y: number, z: number, w: number): Matrix {
            if (index < 0 || index > 3) {
                return this;
            }
            var i = index * 4;
            this.m[i + 0] = x;
            this.m[i + 1] = y;
            this.m[i + 2] = z;
            this.m[i + 3] = w;

            this._markAsUpdated();
            return this;
        }

        /**
         * Static identity matrix to be used as readonly matrix
         * Must not be updated.
         */
        public static get IdentityReadOnly(): Matrix {
            return Matrix._identityReadOnly;
        }

        /**
         * Returns a new Matrix set from the 16 passed floats.  
         */
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

        /**
         * Returns a new Matrix composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).  
         */
        public static Compose(scale: Vector3, rotation: Quaternion, translation: Vector3): Matrix {
            var result = Matrix.Identity();
            Matrix.ComposeToRef(scale, rotation, translation, result);
            return result;
        }

        /**
       * Update a Matrix with values composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).  
       */
        public static ComposeToRef(scale: Vector3, rotation: Quaternion, translation: Vector3, result: Matrix): void {
            Matrix.FromValuesToRef(scale.x, 0, 0, 0,
                0, scale.y, 0, 0,
                0, 0, scale.z, 0,
                0, 0, 0, 1, MathTmp.Matrix[1]);

            rotation.toRotationMatrix(MathTmp.Matrix[0]);
            MathTmp.Matrix[1].multiplyToRef(MathTmp.Matrix[0], result);

            result.setTranslation(translation);
        }
        /**
         * Returns a new indentity Matrix.  
         */
        public static Identity(): Matrix {
            return Matrix.FromValues(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0);
        }
        /**
         * Sets the passed "result" as an identity matrix.  
         */
        public static IdentityToRef(result: Matrix): void {
            Matrix.FromValuesToRef(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0, result);
        }
        /**
         * Returns a new zero Matrix.  
         */
        public static Zero(): Matrix {
            return Matrix.FromValues(0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0);
        }
        /**
         * Returns a new rotation matrix for "angle" radians around the X axis.  
         */
        public static RotationX(angle: number): Matrix {
            var result = new Matrix();
            Matrix.RotationXToRef(angle, result);
            return result;
        }
        /**
         * Returns a new Matrix as the passed inverted one.  
         */
        public static Invert(source: Matrix): Matrix {
            var result = new Matrix();
            source.invertToRef(result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the X axis. 
         */
        public static RotationXToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[0] = 1.0;
            result.m[15] = 1.0;

            result.m[5] = c;
            result.m[10] = c;
            result.m[9] = -s;
            result.m[6] = s;

            result.m[1] = 0.0;
            result.m[2] = 0.0;
            result.m[3] = 0.0;
            result.m[4] = 0.0;
            result.m[7] = 0.0;
            result.m[8] = 0.0;
            result.m[11] = 0.0;
            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;

            result._markAsUpdated();
        }
        /**
         * Returns a new rotation matrix for "angle" radians around the Y axis.  
         */
        public static RotationY(angle: number): Matrix {
            var result = new Matrix();
            Matrix.RotationYToRef(angle, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Y axis. 
         */
        public static RotationYToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[5] = 1.0;
            result.m[15] = 1.0;

            result.m[0] = c;
            result.m[2] = -s;
            result.m[8] = s;
            result.m[10] = c;

            result.m[1] = 0.0;
            result.m[3] = 0.0;
            result.m[4] = 0.0;
            result.m[6] = 0.0;
            result.m[7] = 0.0;
            result.m[9] = 0.0;
            result.m[11] = 0.0;
            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;

            result._markAsUpdated();
        }
        /**
         * Returns a new rotation matrix for "angle" radians around the Z axis.  
         */
        public static RotationZ(angle: number): Matrix {
            var result = new Matrix();
            Matrix.RotationZToRef(angle, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Z axis. 
         */
        public static RotationZToRef(angle: number, result: Matrix): void {
            var s = Math.sin(angle);
            var c = Math.cos(angle);

            result.m[10] = 1.0;
            result.m[15] = 1.0;

            result.m[0] = c;
            result.m[1] = s;
            result.m[4] = -s;
            result.m[5] = c;

            result.m[2] = 0.0;
            result.m[3] = 0.0;
            result.m[6] = 0.0;
            result.m[7] = 0.0;
            result.m[8] = 0.0;
            result.m[9] = 0.0;
            result.m[11] = 0.0;
            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;

            result._markAsUpdated();
        }
        /**
         * Returns a new rotation matrix for "angle" radians around the passed axis.  
         */
        public static RotationAxis(axis: Vector3, angle: number): Matrix {
            var result = Matrix.Zero();
            Matrix.RotationAxisToRef(axis, angle, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the passed axis. 
         */
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

            result._markAsUpdated();
        }
        /**
         * Returns a new Matrix as a rotation matrix from the Euler angles (y, x, z). 
         */
        public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix {
            var result = new Matrix();
            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a rotation matrix from the Euler angles (y, x, z). 
         */
        public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void {
            Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, this._tempQuaternion);
            this._tempQuaternion.toRotationMatrix(result);
        }
        /**
         * Returns a new Matrix as a scaling matrix from the passed floats (x, y, z). 
         */
        public static Scaling(x: number, y: number, z: number): Matrix {
            var result = Matrix.Zero();
            Matrix.ScalingToRef(x, y, z, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a scaling matrix from the passed floats (x, y, z). 
         */
        public static ScalingToRef(x: number, y: number, z: number, result: Matrix): void {
            result.m[0] = x;
            result.m[1] = 0.0;
            result.m[2] = 0.0;
            result.m[3] = 0.0;
            result.m[4] = 0.0;
            result.m[5] = y;
            result.m[6] = 0.0;
            result.m[7] = 0.0;
            result.m[8] = 0.0;
            result.m[9] = 0.0;
            result.m[10] = z;
            result.m[11] = 0.0;
            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;
            result.m[15] = 1.0;

            result._markAsUpdated();
        }
        /**
         * Returns a new Matrix as a translation matrix from the passed floats (x, y, z). 
         */
        public static Translation(x: number, y: number, z: number): Matrix {
            var result = Matrix.Identity();
            Matrix.TranslationToRef(x, y, z, result);
            return result;
        }
        /**
         * Sets the passed matrix "result" as a translation matrix from the passed floats (x, y, z). 
         */
        public static TranslationToRef(x: number, y: number, z: number, result: Matrix): void {
            Matrix.FromValuesToRef(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                x, y, z, 1.0, result);
        }
        /**
         * Returns a new Matrix whose values are the interpolated values for "gradien" (float) between the ones of the matrices "startValue" and "endValue".
         */
        public static Lerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix {
            var result = Matrix.Zero();
            for (var index = 0; index < 16; index++) {
                result.m[index] = startValue.m[index] * (1.0 - gradient) + endValue.m[index] * gradient;
            }
            result._markAsUpdated();
            return result;
        }

        /**
         * Returns a new Matrix whose values are computed by : 
         * - decomposing the the "startValue" and "endValue" matrices into their respective scale, rotation and translation matrices,
         * - interpolating for "gradient" (float) the values between each of these decomposed matrices between the start and the end,
         * - recomposing a new matrix from these 3 interpolated scale, rotation and translation matrices.  
         */
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

        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".  
         * This methods works for a Left-Handed system.  
         */
        public static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix {
            var result = Matrix.Zero();
            Matrix.LookAtLHToRef(eye, target, up, result);
            return result;
        }

        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".  
         * This methods works for a Left-Handed system.  
         */
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

        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".  
         * This methods works for a Right-Handed system.  
         */
        public static LookAtRH(eye: Vector3, target: Vector3, up: Vector3): Matrix {
            var result = Matrix.Zero();
            Matrix.LookAtRHToRef(eye, target, up, result);
            return result;
        }

        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".  
         * This methods works for a Left-Handed system.  
         */
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

        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.  
         */
        public static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();
            Matrix.OrthoLHToRef(width, height, znear, zfar, matrix);
            return matrix;
        }
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.  
         */
        public static OrthoLHToRef(width: number, height: number, znear: number, zfar: number, result: Matrix): void {
            let n = znear;
            let f = zfar;

            let a = 2.0 / width;
            let b = 2.0 / height;
            let c = 2.0 / (f - n);
            let d = -(f + n) / (f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0.0, 0.0, 0.0,
                0.0, b, 0.0, 0.0,
                0.0, 0.0, c, 0.0,
                0.0, 0.0, d, 1.0,
                result
            );
        }
        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.  
         */
        public static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, matrix);

            return matrix;
        }
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.  
         */
        public static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void {
            let n = znear;
            let f = zfar;

            let a = 2.0 / (right - left);
            let b = 2.0 / (top - bottom);
            let c = 2.0 / (f - n);
            let d = -(f + n) / (f - n);
            let i0 = (left + right) / (left - right);
            let i1 = (top + bottom) / (bottom - top);

            BABYLON.Matrix.FromValuesToRef(
                a, 0.0, 0.0, 0.0,
                0.0, b, 0.0, 0.0,
                0.0, 0.0, c, 0.0,
                i0, i1, d, 1.0,
                result
            );
        }
        /**
         * Returns a new Matrix as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.  
         */
        public static OrthoOffCenterRH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();
            Matrix.OrthoOffCenterRHToRef(left, right, bottom, top, znear, zfar, matrix);
            return matrix;
        }
        /**
         * Sets the passed matrix "result" as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.  
         */
        public static OrthoOffCenterRHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void {
            Matrix.OrthoOffCenterLHToRef(left, right, bottom, top, znear, zfar, result);
            result.m[10] *= -1.0;
        }
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.  
         */
        public static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();

            let n = znear;
            let f = zfar;

            let a = 2.0 * n / width;
            let b = 2.0 * n / height;
            let c = (f + n) / (f - n);
            let d = -2.0 * f * n / (f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0.0, 0.0, 0.0,
                0.0, b, 0.0, 0.0,
                0.0, 0.0, c, 1.0,
                0.0, 0.0, d, 0.0,
                matrix
            );

            return matrix;
        }
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.  
         */
        public static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();
            Matrix.PerspectiveFovLHToRef(fov, aspect, znear, zfar, matrix);
            return matrix;
        }
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.  
         */
        public static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed = true): void {
            let n = znear;
            let f = zfar;

            let t = 1.0 / (Math.tan(fov * 0.5));
            let a = isVerticalFovFixed ? (t / aspect) : t;
            let b = isVerticalFovFixed ? t : (t * aspect);
            let c = (f + n) / (f - n);
            let d = -2.0 * f * n / (f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0.0, 0.0, 0.0,
                0.0, b, 0.0, 0.0,
                0.0, 0.0, c, 1.0,
                0.0, 0.0, d, 0.0,
                result
            );
        }
        /**
         * Returns a new Matrix as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.  
         */
        public static PerspectiveFovRH(fov: number, aspect: number, znear: number, zfar: number): Matrix {
            var matrix = Matrix.Zero();
            Matrix.PerspectiveFovRHToRef(fov, aspect, znear, zfar, matrix);
            return matrix;
        }
        /**
         * Sets the passed matrix "result" as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.  
         */
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
            let c = -(f + n) / (f - n);
            let d = -2 * f * n / (f - n);

            BABYLON.Matrix.FromValuesToRef(
                a, 0.0, 0.0, 0.0,
                0.0, b, 0.0, 0.0,
                0.0, 0.0, c, -1.0,
                0.0, 0.0, d, 0.0,
                result
            );
        }
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix  for WebVR computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.  
         */
        public static PerspectiveFovWebVRToRef(fov: {upDegrees: number, downDegrees: number, leftDegrees: number, rightDegrees: number}, znear: number, zfar: number, result: Matrix, rightHanded = false): void {

            var rightHandedFactor = rightHanded ? -1 : 1;

            var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
            var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
            var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
            var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
            var xScale = 2.0 / (leftTan + rightTan);
            var yScale = 2.0 / (upTan + downTan);
            result.m[0] = xScale;
            result.m[1] = result.m[2] = result.m[3] = result.m[4] = 0.0;
            result.m[5] = yScale;
            result.m[6] = result.m[7] = 0.0;
            result.m[8] = ((leftTan - rightTan) * xScale * 0.5)// * rightHandedFactor;
            result.m[9] = -((upTan - downTan) * yScale * 0.5)// * rightHandedFactor;
            //result.m[10] = -(znear + zfar) / (zfar - znear) * rightHandedFactor;
            result.m[10] = -zfar / (znear - zfar);
            result.m[11] = 1.0 * rightHandedFactor;
            result.m[12] = result.m[13] = result.m[15] = 0.0;
            result.m[14] = -(2.0 * zfar * znear) / (zfar - znear);
            // result.m[14] = (znear * zfar) / (znear - zfar);

            result._markAsUpdated();
        }

        /**
         * Returns the final transformation matrix : world * view * projection * viewport
         */
        public static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix {
            var cw = viewport.width;
            var ch = viewport.height;
            var cx = viewport.x;
            var cy = viewport.y;

            var viewportMatrix = Matrix.FromValues(cw / 2.0, 0.0, 0.0, 0.0,
                0.0, -ch / 2.0, 0.0, 0.0,
                0.0, 0.0, zmax - zmin, 0.0,
                cx + cw / 2.0, ch / 2.0 + cy, zmin, 1);

            return world.multiply(view).multiply(projection).multiply(viewportMatrix);
        }

        /**
         * Returns a new Float32Array array with 4 elements : the 2x2 matrix extracted from the passed Matrix.  
         */
        public static GetAsMatrix2x2(matrix: Matrix): Float32Array {
            return new Float32Array([
                matrix.m[0], matrix.m[1],
                matrix.m[4], matrix.m[5]
            ]);
        }
        /**
         * Returns a new Float32Array array with 9 elements : the 3x3 matrix extracted from the passed Matrix.  
         */
        public static GetAsMatrix3x3(matrix: Matrix): Float32Array {
            return new Float32Array([
                matrix.m[0], matrix.m[1], matrix.m[2],
                matrix.m[4], matrix.m[5], matrix.m[6],
                matrix.m[8], matrix.m[9], matrix.m[10]
            ]);
        }

        /**
         * Compute the transpose of the passed Matrix.  
         * Returns a new Matrix.  
         */
        public static Transpose(matrix: Matrix): Matrix {
            var result = new Matrix();

            Matrix.TransposeToRef(matrix, result);

            return result;
        }

        /**
         * Compute the transpose of the passed Matrix and store it in the result matrix.  
         */
        public static TransposeToRef(matrix: Matrix, result: Matrix): void {
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
        }

        /**
         * Returns a new Matrix as the reflection  matrix across the passed plane.  
         */
        public static Reflection(plane: Plane): Matrix {
            var matrix = new Matrix();
            Matrix.ReflectionToRef(plane, matrix);
            return matrix;
        }

        /**
         * Sets the passed matrix "result" as the reflection matrix across the passed plane. 
         */
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

            result._markAsUpdated();
        }

        /**
         * Sets the passed matrix "mat" as a rotation matrix composed from the 3 passed  left handed axis.  
         */
        public static FromXYZAxesToRef(xaxis: Vector3, yaxis: Vector3, zaxis: Vector3, result: Matrix) {

            result.m[0] = xaxis.x;
            result.m[1] = xaxis.y;
            result.m[2] = xaxis.z;

            result.m[3] = 0.0;

            result.m[4] = yaxis.x;
            result.m[5] = yaxis.y;
            result.m[6] = yaxis.z;

            result.m[7] = 0.0;

            result.m[8] = zaxis.x;
            result.m[9] = zaxis.y;
            result.m[10] = zaxis.z;

            result.m[11] = 0.0;

            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;

            result.m[15] = 1.0;

            result._markAsUpdated();
        }

        /**
         * Sets the passed matrix "result" as a rotation matrix according to the passed quaternion.  
         */
        public static FromQuaternionToRef(quat: Quaternion, result: Matrix) {

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
            result.m[3] = 0.0;
            result.m[4] = 2.0 * (xy - zw);
            result.m[5] = 1.0 - (2.0 * (zz + xx));
            result.m[6] = 2.0 * (yz + xw);
            result.m[7] = 0.0;
            result.m[8] = 2.0 * (zx + yw);
            result.m[9] = 2.0 * (yz - xw);
            result.m[10] = 1.0 - (2.0 * (yy + xx));
            result.m[11] = 0.0;

            result.m[12] = 0.0;
            result.m[13] = 0.0;
            result.m[14] = 0.0;

            result.m[15] = 1.0;

            result._markAsUpdated();
        }
    }

    export class Plane {
        public normal: Vector3;
        public d: number;
        /**
         * Creates a Plane object according to the passed floats a, b, c, d and the plane equation : ax + by + cz + d = 0
         */
        constructor(a: number, b: number, c: number, d: number) {
            this.normal = new Vector3(a, b, c);
            this.d = d;
        }

        /**
         * Returns the plane coordinates as a new array of 4 elements [a, b, c, d].  
         */
        public asArray(): number[] {
            return [this.normal.x, this.normal.y, this.normal.z, this.d];
        }

        // Methods
        /**
         * Returns a new plane copied from the current Plane.  
         */
        public clone(): Plane {
            return new Plane(this.normal.x, this.normal.y, this.normal.z, this.d);
        }
        /**
         * Returns the string "Plane".  
         */
        public getClassName(): string {
            return "Plane";
        }
        /**
         * Returns the Plane hash code.  
         */
        public getHashCode(): number {
            let hash = this.normal.getHashCode();
            hash = (hash * 397) ^ (this.d || 0);
            return hash;
        }
        /**
         * Normalize the current Plane in place.  
         * Returns the updated Plane.  
         */
        public normalize(): Plane {
            var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
            var magnitude = 0.0;

            if (norm !== 0) {
                magnitude = 1.0 / norm;
            }
            this.normal.x *= magnitude;
            this.normal.y *= magnitude;
            this.normal.z *= magnitude;
            this.d *= magnitude;
            return this;
        }
        /**
         * Returns a new Plane as the result of the transformation of the current Plane by the passed matrix.  
         */
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

        /**
         * Returns the dot product (float) of the point coordinates and the plane normal.  
         */
        public dotCoordinate(point: Vector3): number {
            return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
        }

        /**
         * Updates the current Plane from the plane defined by the three passed points.  
         * Returns the updated Plane.  
         */
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
                invPyth = 0.0;
            }

            this.normal.x = yz * invPyth;
            this.normal.y = xz * invPyth;
            this.normal.z = xy * invPyth;
            this.d = -((this.normal.x * point1.x) + (this.normal.y * point1.y) + (this.normal.z * point1.z));

            return this;
        }

        /**
         * Boolean : True is the vector "direction"  is the same side than the plane normal.  
         */
        public isFrontFacingTo(direction: Vector3, epsilon: number): boolean {
            var dot = Vector3.Dot(this.normal, direction);
            return (dot <= epsilon);
        }

        /** 
         * Returns the signed distance (float) from the passed point to the Plane.  
         */
        public signedDistanceTo(point: Vector3): number {
            return Vector3.Dot(point, this.normal) + this.d;
        }

        // Statics
        /**
         * Returns a new Plane from the passed array.  
         */
        static FromArray(array: ArrayLike<number>): Plane {
            return new Plane(array[0], array[1], array[2], array[3]);
        }
        /**
         * Returns a new Plane defined by the three passed points.  
         */
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane {
            var result = new Plane(0.0, 0.0, 0.0, 0.0);
            result.copyFromPoints(point1, point2, point3);
            return result;
        }
        /**
         * Returns a new Plane the normal vector to this plane at the passed origin point.  
         * Note : the vector "normal" is updated because normalized.  
         */
        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane {
            var result = new Plane(0.0, 0.0, 0.0, 0.0);
            normal.normalize();
            result.normal = normal;
            result.d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
            return result;
        }

        /**
         * Returns the signed distance between the plane defined by the normal vector at the "origin"" point and the passed other point.  
         */
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number {
            var d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
            return Vector3.Dot(point, normal) + d;
        }
    }

    export class Viewport {
        /**
         * Creates a Viewport object located at (x, y) and sized (width, height).  
         */
        constructor(public x: number, public y: number, public width: number, public height: number) {
        }

        public toGlobal(renderWidthOrEngine: number | Engine, renderHeight: number): Viewport {
            if ((<Engine>renderWidthOrEngine).getRenderWidth) {
                var engine = (<Engine>renderWidthOrEngine);
                return this.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            }
            let renderWidth = <number>renderWidthOrEngine;
            return new Viewport(this.x * renderWidth, this.y * renderHeight, this.width * renderWidth, this.height * renderHeight);
        }
        /**
         * Returns a new Viewport copied from the current one.  
         */
        public clone(): Viewport {
            return new Viewport(this.x, this.y, this.width, this.height);
        }
    }

    export class Frustum {
        /**
         * Returns a new array of 6 Frustum planes computed by the passed transformation matrix.  
         */
        public static GetPlanes(transform: Matrix): Plane[] {
            var frustumPlanes = [];
            for (var index = 0; index < 6; index++) {
                frustumPlanes.push(new Plane(0.0, 0.0, 0.0, 0.0));
            }
            Frustum.GetPlanesToRef(transform, frustumPlanes);
            return frustumPlanes;
        }

        public static GetNearPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] + transform.m[2];
            frustumPlane.normal.y = transform.m[7] + transform.m[6];
            frustumPlane.normal.z = transform.m[11] + transform.m[10];
            frustumPlane.d = transform.m[15] + transform.m[14];
            frustumPlane.normalize();
        }

        public static GetFarPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] - transform.m[2];
            frustumPlane.normal.y = transform.m[7] - transform.m[6];
            frustumPlane.normal.z = transform.m[11] - transform.m[10];
            frustumPlane.d = transform.m[15] - transform.m[14];
            frustumPlane.normalize();
        }

        public static GetLeftPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] + transform.m[0];
            frustumPlane.normal.y = transform.m[7] + transform.m[4];
            frustumPlane.normal.z = transform.m[11] + transform.m[8];
            frustumPlane.d = transform.m[15] + transform.m[12];
            frustumPlane.normalize();
        }       
        
        public static GetRightPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] - transform.m[0];
            frustumPlane.normal.y = transform.m[7] - transform.m[4];
            frustumPlane.normal.z = transform.m[11] - transform.m[8];
            frustumPlane.d = transform.m[15] - transform.m[12];
            frustumPlane.normalize();
        }     
        
        public static GetTopPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] - transform.m[1];
            frustumPlane.normal.y = transform.m[7] - transform.m[5];
            frustumPlane.normal.z = transform.m[11] - transform.m[9];
            frustumPlane.d = transform.m[15] - transform.m[13];
            frustumPlane.normalize();
        }      
        
        public static GetBottomPlaneToRef(transform: Matrix, frustumPlane: Plane): void {
            frustumPlane.normal.x = transform.m[3] + transform.m[1];
            frustumPlane.normal.y = transform.m[7] + transform.m[5];
            frustumPlane.normal.z = transform.m[11] + transform.m[9];
            frustumPlane.d = transform.m[15] + transform.m[13];
            frustumPlane.normalize();
        }           

        /**
         * Sets the passed array "frustumPlanes" with the 6 Frustum planes computed by the passed transformation matrix.  
         */
        public static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void {
            // Near
            Frustum.GetNearPlaneToRef(transform, frustumPlanes[0]);

            // Far
            Frustum.GetFarPlaneToRef(transform, frustumPlanes[1]);

            // Left
            Frustum.GetLeftPlaneToRef(transform, frustumPlanes[2]);

            // Right
            Frustum.GetRightPlaneToRef(transform, frustumPlanes[3]);

            // Top
            Frustum.GetTopPlaneToRef(transform, frustumPlanes[4]);

            // Bottom
            Frustum.GetBottomPlaneToRef(transform, frustumPlanes[5]);
        }
    }

    export enum Space {
        LOCAL = 0,
        WORLD = 1,
        BONE = 2
    }

    export class Axis {
        public static X: Vector3 = new Vector3(1.0, 0.0, 0.0);
        public static Y: Vector3 = new Vector3(0.0, 1.0, 0.0);
        public static Z: Vector3 = new Vector3(0.0, 0.0, 1.0);
    };

    export class BezierCurve {
        /**
         * Returns the cubic Bezier interpolated value (float) at "t" (float) from the passed x1, y1, x2, y2 floats.  
         */
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

        /**
         * Creates an Angle object of "radians" radians (float).  
         */
        constructor(radians: number) {
            this._radians = radians;
            if (this._radians < 0.0) this._radians += (2.0 * Math.PI);
        }

        /**
         * Returns the Angle value in degrees (float).  
         */
        public degrees = () => this._radians * 180.0 / Math.PI;
        /**
         * Returns the Angle value in radians (float).  
         */
        public radians = () => this._radians;

        /**
         * Returns a new Angle object valued with the angle value in radians between the two passed vectors.  
         */
        public static BetweenTwoPoints(a: Vector2, b: Vector2): Angle {
            var delta = b.subtract(a);
            var theta = Math.atan2(delta.y, delta.x);
            return new Angle(theta);
        }

        /**
         * Returns a new Angle object from the passed float in radians.  
         */
        public static FromRadians(radians: number): Angle {
            return new Angle(radians);
        }
        /**
         * Returns a new Angle object from the passed float in degrees.  
         */
        public static FromDegrees(degrees: number): Angle {
            return new Angle(degrees * Math.PI / 180.0);
        }
    }

    export class Arc2 {
        centerPoint: Vector2;
        radius: number;
        angle: Angle;
        startAngle: Angle;
        orientation: Orientation;

        /**
         * Creates an Arc object from the three passed points : start, middle and end.  
         */
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
        private _length = 0.0;

        public closed = false;

        /**
         * Creates a Path2 object from the starting 2D coordinates x and y.  
         */
        constructor(x: number, y: number) {
            this._points.push(new Vector2(x, y));
        }

        /**
         * Adds a new segment until the passed coordinates (x, y) to the current Path2.  
         * Returns the updated Path2.   
         */
        public addLineTo(x: number, y: number): Path2 {
            if (this.closed) {
                //Tools.Error("cannot add lines to closed paths");
                return this;
            }
            var newPoint = new Vector2(x, y);
            var previousPoint = this._points[this._points.length - 1];
            this._points.push(newPoint);
            this._length += newPoint.subtract(previousPoint).length();
            return this;
        }

        /**
         * Adds _numberOfSegments_ segments according to the arc definition (middle point coordinates, end point coordinates, the arc start point being the current Path2 last point) to the current Path2.  
         * Returns the updated Path2.  
         */
        public addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments = 36): Path2 {
            if (this.closed) {
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
        /**
         * Closes the Path2.     
         * Returns the Path2.  
         */
        public close(): Path2 {
            this.closed = true;
            return this;
        }
        /**
         * Returns the Path2 total length (float).  
         */
        public length(): number {
            var result = this._length;

            if (!this.closed) {
                var lastPoint = this._points[this._points.length - 1];
                var firstPoint = this._points[0];
                result += (firstPoint.subtract(lastPoint).length());
            }
            return result;
        }

        /**
         * Returns the Path2 internal array of points.  
         */
        public getPoints(): Vector2[] {
            return this._points;
        }

        /**
         * Returns a new Vector2 located at a percentage of the Path2 total length on this path.  
         */
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

        /**
         * Returns a new Path2 starting at the coordinates (x, y).  
         */
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
        constructor(public path: Vector3[], firstNormal: Nullable<Vector3> = null, raw?: boolean) {
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
        public update(path: Vector3[], firstNormal: Nullable<Vector3> = null): Path3D {
            for (var p = 0; p < path.length; p++) {
                this._curve[p].x = path[p].x;
                this._curve[p].y = path[p].y;
                this._curve[p].z = path[p].z;
            }
            this._compute(firstNormal);
            return this;
        }

        // private function compute() : computes tangents, normals and binormals
        private _compute(firstNormal: Nullable<Vector3>): void {
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
        private _normalVector(v0: Vector3, vt: Vector3, va: Nullable<Vector3>): Vector3 {
            var normal0: Vector3;
            var tgl = vt.length();
            if (tgl === 0.0) {
                tgl = 1.0;
            }

            if (va === undefined || va === null) {
                var point: Vector3;
                if (!Scalar.WithinEpsilon(Math.abs(vt.y) / tgl, 1.0, Epsilon)) {     // search for a point in the plane
                    point = new Vector3(0.0, -1.0, 0.0);
                }
                else if (!Scalar.WithinEpsilon(Math.abs(vt.x) / tgl, 1.0, Epsilon)) {
                    point = new Vector3(1.0, 0.0, 0.0);
                }
                else if (!Scalar.WithinEpsilon(Math.abs(vt.z) / tgl, 1.0, Epsilon)) {
                    point = new Vector3(0.0, 0.0, 1.0);
                }
                else {
                    point = Vector3.Zero();
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
         * Returns a Curve3 object along a CatmullRom Spline curve : 
         * @param points (array of Vector3) the points the spline must pass through. At least, four points required.  
         * @param nbPoints (integer) the wanted number of points between each curve control points.
         */
        public static CreateCatmullRomSpline(points: Vector3[], nbPoints: number): Curve3 {
            var totalPoints = new Array<Vector3>();
            totalPoints.push(points[0].clone());
            Array.prototype.push.apply(totalPoints, points);
            totalPoints.push(points[points.length - 1].clone());
            var catmullRom = new Array<Vector3>();
            var step = 1.0 / nbPoints;
            var amount = 0.0;
            for (var i = 0; i < totalPoints.length - 3; i++) {
                amount = 0;
                for (var c = 0; c < nbPoints; c++) {
                    catmullRom.push(Vector3.CatmullRom(totalPoints[i], totalPoints[i + 1], totalPoints[i + 2], totalPoints[i + 3], amount));
                    amount += step
                }
            }
            i--;
            catmullRom.push(Vector3.CatmullRom(totalPoints[i], totalPoints[i + 1], totalPoints[i + 2], totalPoints[i + 3], amount));
            return new Curve3(catmullRom);
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
        public static Quaternion: Quaternion[] = [Quaternion.Zero(), Quaternion.Zero()];                // 2 temp Quaternion at once should be enough
        public static Matrix: Matrix[] = [Matrix.Zero(), Matrix.Zero(),
        Matrix.Zero(), Matrix.Zero(),
        Matrix.Zero(), Matrix.Zero(),
        Matrix.Zero(), Matrix.Zero()];                      // 6 temp Matrices at once should be enough
    }
    // Same as Tmp but not exported to keep it onyl for math functions to avoid conflicts
    class MathTmp {
        public static Vector3: Vector3[] = [Vector3.Zero()];
        public static Matrix: Matrix[] = [Matrix.Zero(), Matrix.Zero()];
        public static Quaternion: Quaternion[] = [Quaternion.Zero()];
    }
}
