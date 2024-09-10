/**
 * Extract int value
 * @param value number value
 * @returns int value
 */
export function ExtractAsInt(value: number) {
    return parseInt(value.toString().replace(/\W/g, ""));
}

/**
 * Boolean : true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
 * @param a number
 * @param b number
 * @param epsilon (default = 1.401298E-45)
 * @returns true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
 */
export function WithinEpsilon(a: number, b: number, epsilon: number = 1.401298e-45): boolean {
    return Math.abs(a - b) <= epsilon;
}

/**
 * Returns a random float number between and min and max values
 * @param min min value of random
 * @param max max value of random
 * @returns random value
 */
export function RandomRange(min: number, max: number): number {
    if (min === max) {
        return min;
    }
    return Math.random() * (max - min) + min;
}

/**
 * Creates a new scalar with values linearly interpolated of "amount" between the start scalar and the end scalar.
 * @param start start value
 * @param end target value
 * @param amount amount to lerp between
 * @returns the lerped value
 */
export function Lerp(start: number, end: number, amount: number): number {
    return start + (end - start) * amount;
}

/**
 * Same as Lerp but makes sure the values interpolate correctly when they wrap around 360 degrees.
 * The parameter t is clamped to the range [0, 1]. Variables a and b are assumed to be in degrees.
 * @param start start value
 * @param end target value
 * @param amount amount to lerp between
 * @returns the lerped value
 */
export function LerpAngle(start: number, end: number, amount: number): number {
    let num: number = Repeat(end - start, 360.0);
    if (num > 180.0) {
        num -= 360.0;
    }
    return start + num * Clamp(amount);
}

/**
 * Calculates the linear parameter t that produces the interpolant value within the range [a, b].
 * @param a start value
 * @param b target value
 * @param value value between a and b
 * @returns the inverseLerp value
 */
export function InverseLerp(a: number, b: number, value: number): number {
    let result: number = 0;
    if (a != b) {
        result = Clamp((value - a) / (b - a));
    } else {
        result = 0.0;
    }
    return result;
}

/**
 * Returns a new scalar located for "amount" (float) on the Hermite spline defined by the scalars "value1", "value3", "tangent1", "tangent2".
 * @see http://mathworld.wolfram.com/HermitePolynomial.html
 * @param value1 defines the first control point
 * @param tangent1 defines the first tangent
 * @param value2 defines the second control point
 * @param tangent2 defines the second tangent
 * @param amount defines the amount on the interpolation spline (between 0 and 1)
 * @returns hermite result
 */
export function Hermite(value1: number, tangent1: number, value2: number, tangent2: number, amount: number): number {
    const squared = amount * amount;
    const cubed = amount * squared;
    const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
    const part2 = -2.0 * cubed + 3.0 * squared;
    const part3 = cubed - 2.0 * squared + amount;
    const part4 = cubed - squared;

    return value1 * part1 + value2 * part2 + tangent1 * part3 + tangent2 * part4;
}

/**
 * Returns a new scalar which is the 1st derivative of the Hermite spline defined by the scalars "value1", "value2", "tangent1", "tangent2".
 * @param value1 defines the first control point
 * @param tangent1 defines the first tangent
 * @param value2 defines the second control point
 * @param tangent2 defines the second tangent
 * @param time define where the derivative must be done
 * @returns 1st derivative
 */
export function Hermite1stDerivative(value1: number, tangent1: number, value2: number, tangent2: number, time: number): number {
    const t2 = time * time;
    return (t2 - time) * 6 * value1 + (3 * t2 - 4 * time + 1) * tangent1 + (-t2 + time) * 6 * value2 + (3 * t2 - 2 * time) * tangent2;
}

/**
 * Returns the value itself if it's between min and max.
 * Returns min if the value is lower than min.
 * Returns max if the value is greater than max.
 * @param value the value to clmap
 * @param min the min value to clamp to (default: 0)
 * @param max the max value to clamp to (default: 1)
 * @returns the clamped value
 */
export function Clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Returns the angle converted to equivalent value between -Math.PI and Math.PI radians.
 * @param angle The angle to normalize in radian.
 * @returns The converted angle.
 */
export function NormalizeRadians(angle: number): number {
    // More precise but slower version kept for reference.
    // angle = angle % Tools.TwoPi;
    // angle = (angle + Tools.TwoPi) % Tools.TwoPi;

    //if (angle > Math.PI) {
    //	angle -= Tools.TwoPi;
    //}

    angle -= Math.PI * 2 * Math.floor((angle + Math.PI) / (Math.PI * 2));

    return angle;
}

/**
 * Returns a string : the upper case translation of the number i to hexadecimal.
 * @param i number
 * @returns the upper case translation of the number i to hexadecimal.
 */
export function ToHex(i: number): string {
    const str = i.toString(16);

    if (i <= 15) {
        return ("0" + str).toUpperCase();
    }

    return str.toUpperCase();
}

/**
 * the floor part of a log2 value.
 * @param value the value to compute log2 of
 * @returns the log2 of value.
 */
export function ILog2(value: number): number {
    if (Math.log2) {
        return Math.floor(Math.log2(value));
    }

    if (value < 0) {
        return NaN;
    } else if (value === 0) {
        return -Infinity;
    }

    let n = 0;
    if (value < 1) {
        while (value < 1) {
            n++;
            value = value * 2;
        }
        n = -n;
    } else if (value > 1) {
        while (value > 1) {
            n++;
            value = Math.floor(value / 2);
        }
    }

    return n;
}

/**
 * Loops the value, so that it is never larger than length and never smaller than 0.
 *
 * This is similar to the modulo operator but it works with floating point numbers.
 * For example, using 3.0 for t and 2.5 for length, the result would be 0.5.
 * With t = 5 and length = 2.5, the result would be 0.0.
 * Note, however, that the behaviour is not defined for negative numbers as it is for the modulo operator
 * @param value the value
 * @param length the length
 * @returns the looped value
 */
export function Repeat(value: number, length: number): number {
    return value - Math.floor(value / length) * length;
}

/**
 * Normalize the value between 0.0 and 1.0 using min and max values
 * @param value value to normalize
 * @param min max to normalize between
 * @param max min to normalize between
 * @returns the normalized value
 */
export function Normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
}

/**
 * Denormalize the value from 0.0 and 1.0 using min and max values
 * @param normalized value to denormalize
 * @param min max to denormalize between
 * @param max min to denormalize between
 * @returns the denormalized value
 */
export function Denormalize(normalized: number, min: number, max: number): number {
    return normalized * (max - min) + min;
}

/**
 * Calculates the shortest difference between two given angles given in degrees.
 * @param current current angle in degrees
 * @param target target angle in degrees
 * @returns the delta
 */
export function DeltaAngle(current: number, target: number): number {
    let num: number = Repeat(target - current, 360.0);
    if (num > 180.0) {
        num -= 360.0;
    }
    return num;
}

/**
 * PingPongs the value t, so that it is never larger than length and never smaller than 0.
 * @param tx value
 * @param length length
 * @returns The returned value will move back and forth between 0 and length
 */
export function PingPong(tx: number, length: number): number {
    const t: number = Repeat(tx, length * 2.0);
    return length - Math.abs(t - length);
}

/**
 * Interpolates between min and max with smoothing at the limits.
 *
 * This function interpolates between min and max in a similar way to Lerp. However, the interpolation will gradually speed up
 * from the start and slow down toward the end. This is useful for creating natural-looking animation, fading and other transitions.
 * @param from from
 * @param to to
 * @param tx value
 * @returns the smooth stepped value
 */
export function SmoothStep(from: number, to: number, tx: number): number {
    let t: number = Clamp(tx);
    t = -2.0 * t * t * t + 3.0 * t * t;
    return to * t + from * (1.0 - t);
}

/**
 * Moves a value current towards target.
 *
 * This is essentially the same as Mathf.Lerp but instead the function will ensure that the speed never exceeds maxDelta.
 * Negative values of maxDelta pushes the value away from target.
 * @param current current value
 * @param target target value
 * @param maxDelta max distance to move
 * @returns resulting value
 */
export function MoveTowards(current: number, target: number, maxDelta: number): number {
    let result: number = 0;
    if (Math.abs(target - current) <= maxDelta) {
        result = target;
    } else {
        result = current + Math.sign(target - current) * maxDelta;
    }
    return result;
}

/**
 * Same as MoveTowards but makes sure the values interpolate correctly when they wrap around 360 degrees.
 *
 * Variables current and target are assumed to be in degrees. For optimization reasons, negative values of maxDelta
 *  are not supported and may cause oscillation. To push current away from a target angle, add 180 to that angle instead.
 * @param current current value
 * @param target target value
 * @param maxDelta max distance to move
 * @returns resulting angle
 */
export function MoveTowardsAngle(current: number, target: number, maxDelta: number): number {
    const num: number = DeltaAngle(current, target);
    let result: number = 0;
    if (-maxDelta < num && num < maxDelta) {
        result = target;
    } else {
        target = current + num;
        result = MoveTowards(current, target, maxDelta);
    }
    return result;
}

/**
 * This function returns percentage of a number in a given range.
 *
 * RangeToPercent(40,20,60) will return 0.5 (50%)
 * RangeToPercent(34,0,100) will return 0.34 (34%)
 * @param number to convert to percentage
 * @param min min range
 * @param max max range
 * @returns the percentage
 */
export function RangeToPercent(number: number, min: number, max: number): number {
    return (number - min) / (max - min);
}

/**
 * This function returns number that corresponds to the percentage in a given range.
 *
 * PercentToRange(0.34,0,100) will return 34.
 * @param percent to convert to number
 * @param min min range
 * @param max max range
 * @returns the number
 */
export function PercentToRange(percent: number, min: number, max: number): number {
    return (max - min) * percent + min;
}

/**
 * Returns the highest common factor of two integers.
 * @param a first parameter
 * @param b second parameter
 * @returns HCF of a and b
 */
export function HighestCommonFactor(a: number, b: number): number {
    const r: number = a % b;
    if (r === 0) {
        return b;
    }
    return HighestCommonFactor(b, r);
}
