import { BezierCurve } from "../Maths/math.path";

/**
 * This represents the main contract an easing function should follow.
 * Easing functions are used throughout the animation system.
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export interface IEasingFunction {
    /**
     * Given an input gradient between 0 and 1, this returns the corrseponding value
     * of the easing function.
     * The link below provides some of the most common examples of easing functions.
     * @see https://easings.net/
     * @param gradient Defines the value between 0 and 1 we want the easing value for
     * @returns the corresponding value on the curve defined by the easing function
     */
    ease(gradient: number): number;
}

/**
 * Base class used for every default easing function.
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class EasingFunction implements IEasingFunction {
    /**
     * Interpolation follows the mathematical formula associated with the easing function.
     */
    public static readonly EASINGMODE_EASEIN = 0;

    /**
     * Interpolation follows 100% interpolation minus the output of the formula associated with the easing function.
     */
    public static readonly EASINGMODE_EASEOUT = 1;

    /**
     * Interpolation uses EaseIn for the first half of the animation and EaseOut for the second half.
     */
    public static readonly EASINGMODE_EASEINOUT = 2;

    private _easingMode = EasingFunction.EASINGMODE_EASEIN;

    /**
     * Sets the easing mode of the current function.
     * @param easingMode Defines the willing mode (EASINGMODE_EASEIN, EASINGMODE_EASEOUT or EASINGMODE_EASEINOUT)
     */
    public setEasingMode(easingMode: number) {
        var n = Math.min(Math.max(easingMode, 0), 2);
        this._easingMode = n;
    }
    /**
     * Gets the current easing mode.
     * @returns the easing mode
     */
    public getEasingMode(): number {
        return this._easingMode;
    }

    /**
     * @hidden
     */
    public easeInCore(gradient: number): number {
        throw new Error('You must implement this method');
    }

    /**
     * Given an input gradient between 0 and 1, this returns the corresponding value
     * of the easing function.
     * @param gradient Defines the value between 0 and 1 we want the easing value for
     * @returns the corresponding value on the curve defined by the easing function
     */
    public ease(gradient: number): number {
        switch (this._easingMode) {
            case EasingFunction.EASINGMODE_EASEIN:
                return this.easeInCore(gradient);
            case EasingFunction.EASINGMODE_EASEOUT:
                return (1 - this.easeInCore(1 - gradient));
        }

        if (gradient >= 0.5) {
            return (((1 - this.easeInCore((1 - gradient) * 2)) * 0.5) + 0.5);
        }

        return (this.easeInCore(gradient * 2) * 0.5);
    }
}

/**
 * Easing function with a circle shape (see link below).
 * @see https://easings.net/#easeInCirc
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class CircleEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        gradient = Math.max(0, Math.min(1, gradient));
        return (1.0 - Math.sqrt(1.0 - (gradient * gradient)));
    }
}

/**
 * Easing function with a ease back shape (see link below).
 * @see https://easings.net/#easeInBack
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class BackEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates a back ease easing
     * @see https://easings.net/#easeInBack
     * @param amplitude Defines the amplitude of the function
     */
    constructor(
        /** Defines the amplitude of the function */
        public amplitude: number = 1) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        var num = Math.max(0, this.amplitude);
        return (Math.pow(gradient, 3.0) - ((gradient * num) * Math.sin(3.1415926535897931 * gradient)));
    }
}

/**
 * Easing function with a bouncing shape (see link below).
 * @see https://easings.net/#easeInBounce
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class BounceEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates a bounce easing
     * @see https://easings.net/#easeInBounce
     * @param bounces Defines the number of bounces
     * @param bounciness Defines the amplitude of the bounce
     */
    constructor(
        /** Defines the number of bounces */
        public bounces: number = 3,
        /** Defines the amplitude of the bounce */
        public bounciness: number = 2) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        var y = Math.max(0.0, this.bounces);
        var bounciness = this.bounciness;
        if (bounciness <= 1.0) {
            bounciness = 1.001;
        }
        var num9 = Math.pow(bounciness, y);
        var num5 = 1.0 - bounciness;
        var num4 = ((1.0 - num9) / num5) + (num9 * 0.5);
        var num15 = gradient * num4;
        var num65 = Math.log((-num15 * (1.0 - bounciness)) + 1.0) / Math.log(bounciness);
        var num3 = Math.floor(num65);
        var num13 = num3 + 1.0;
        var num8 = (1.0 - Math.pow(bounciness, num3)) / (num5 * num4);
        var num12 = (1.0 - Math.pow(bounciness, num13)) / (num5 * num4);
        var num7 = (num8 + num12) * 0.5;
        var num6 = gradient - num7;
        var num2 = num7 - num8;
        return (((-Math.pow(1.0 / bounciness, y - num3) / (num2 * num2)) * (num6 - num2)) * (num6 + num2));
    }
}

/**
 * Easing function with a power of 3 shape (see link below).
 * @see https://easings.net/#easeInCubic
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class CubicEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return (gradient * gradient * gradient);
    }
}

/**
 * Easing function with an elastic shape (see link below).
 * @see https://easings.net/#easeInElastic
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class ElasticEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates an elastic easing function
     * @see https://easings.net/#easeInElastic
     * @param oscillations Defines the number of oscillations
     * @param springiness Defines the amplitude of the oscillations
     */
    constructor(
        /** Defines the number of oscillations*/
        public oscillations: number = 3,
        /** Defines the amplitude of the oscillations*/
        public springiness: number = 3) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        var num2;
        var num3 = Math.max(0.0, this.oscillations);
        var num = Math.max(0.0, this.springiness);

        if (num == 0) {
            num2 = gradient;
        } else {
            num2 = (Math.exp(num * gradient) - 1.0) / (Math.exp(num) - 1.0);
        }
        return (num2 * Math.sin(((6.2831853071795862 * num3) + 1.5707963267948966) * gradient));
    }
}

/**
 * Easing function with an exponential shape (see link below).
 * @see https://easings.net/#easeInExpo
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class ExponentialEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates an exponential easing function
     * @see https://easings.net/#easeInExpo
     * @param exponent Defines the exponent of the function
     */
    constructor(
        /** Defines the exponent of the function */
        public exponent: number = 2) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        if (this.exponent <= 0) {
            return gradient;
        }

        return ((Math.exp(this.exponent * gradient) - 1.0) / (Math.exp(this.exponent) - 1.0));
    }
}

/**
 * Easing function with a power shape (see link below).
 * @see https://easings.net/#easeInQuad
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class PowerEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates an power base easing function
     * @see https://easings.net/#easeInQuad
     * @param power Defines the power of the function
     */
    constructor(
        /** Defines the power of the function */
        public power: number = 2) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        var y = Math.max(0.0, this.power);
        return Math.pow(gradient, y);
    }
}

/**
 * Easing function with a power of 2 shape (see link below).
 * @see https://easings.net/#easeInQuad
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class QuadraticEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return (gradient * gradient);
    }
}

/**
 * Easing function with a power of 4 shape (see link below).
 * @see https://easings.net/#easeInQuart
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class QuarticEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return (gradient * gradient * gradient * gradient);
    }
}

/**
 * Easing function with a power of 5 shape (see link below).
 * @see https://easings.net/#easeInQuint
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class QuinticEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return (gradient * gradient * gradient * gradient * gradient);
    }
}

/**
 * Easing function with a sin shape (see link below).
 * @see https://easings.net/#easeInSine
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class SineEase extends EasingFunction implements IEasingFunction {
    /** @hidden */
    public easeInCore(gradient: number): number {
        return (1.0 - Math.sin(1.5707963267948966 * (1.0 - gradient)));
    }
}

/**
 * Easing function with a bezier shape (see link below).
 * @see http://cubic-bezier.com/#.17,.67,.83,.67
 * @see https://doc.babylonjs.com/babylon101/animations#easing-functions
 */
export class BezierCurveEase extends EasingFunction implements IEasingFunction {
    /**
     * Instantiates a bezier function
     * @see http://cubic-bezier.com/#.17,.67,.83,.67
     * @param x1 Defines the x component of the start tangent in the bezier curve
     * @param y1 Defines the y component of the start tangent in the bezier curve
     * @param x2 Defines the x component of the end tangent in the bezier curve
     * @param y2 Defines the y component of the end tangent in the bezier curve
     */
    constructor(
        /** Defines the x component of the start tangent in the bezier curve */
        public x1: number = 0,
        /** Defines the y component of the start tangent in the bezier curve */
        public y1: number = 0,
        /** Defines the x component of the end tangent in the bezier curve */
        public x2: number = 1,
        /** Defines the y component of the end tangent in the bezier curve */
        public y2: number = 1) {
        super();
    }

    /** @hidden */
    public easeInCore(gradient: number): number {
        return BezierCurve.Interpolate(gradient, this.x1, this.y1, this.x2, this.y2);
    }
}
