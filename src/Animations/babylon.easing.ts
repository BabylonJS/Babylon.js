module BABYLON {

    export interface IEasingFunction {
        ease(gradient: number): number;
    }

    export class EasingFunction implements IEasingFunction {
        //Statics
        private static _EASINGMODE_EASEIN = 0;
        private static _EASINGMODE_EASEOUT = 1;
        private static _EASINGMODE_EASEINOUT = 2;

        public static get EASINGMODE_EASEIN(): number {
            return EasingFunction._EASINGMODE_EASEIN;
        }

        public static get EASINGMODE_EASEOUT(): number {
            return EasingFunction._EASINGMODE_EASEOUT;
        }

        public static get EASINGMODE_EASEINOUT(): number {
            return EasingFunction._EASINGMODE_EASEINOUT;
        }

        // Properties
        private _easingMode = EasingFunction.EASINGMODE_EASEIN;

        public setEasingMode(easingMode: number) {
            var n = Math.min(Math.max(easingMode, 0), 2);
            this._easingMode = n;
        }
        public getEasingMode(): number {
            return this._easingMode;
        }

        public easeInCore(gradient: number): number {
            throw new Error('You must implement this method');
        }

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

    export class CircleEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            gradient = Math.max(0, Math.min(1, gradient));
            return (1.0 - Math.sqrt(1.0 - (gradient * gradient)));
        }
    }

    export class BackEase extends EasingFunction implements IEasingFunction {
        constructor(public amplitude: number = 1) {
            super();
        }

        public easeInCore(gradient: number): number {
            var num = Math.max(0, this.amplitude);
            return (Math.pow(gradient, 3.0) - ((gradient * num) * Math.sin(3.1415926535897931 * gradient)));
        }
    }

    export class BounceEase extends EasingFunction implements IEasingFunction {
        constructor(public bounces: number= 3, public bounciness: number= 2) {
            super();
        }

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

    export class CubicEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            return (gradient * gradient * gradient);
        }
    }

    export class ElasticEase extends EasingFunction implements IEasingFunction {
        constructor(public oscillations: number= 3, public springiness: number= 3) {
            super();
        }

        public easeInCore(gradient: number): number {
            var num2;
            var num3 = Math.max(0.0, this.oscillations);
            var num = Math.max(0.0, this.springiness);

            if (num == 0) {
                num2 = gradient;
            }else {
                num2 = (Math.exp(num * gradient) - 1.0) / (Math.exp(num) - 1.0);
            }
            return (num2 * Math.sin(((6.2831853071795862 * num3) + 1.5707963267948966) * gradient));
        }
    }

    export class ExponentialEase extends EasingFunction implements IEasingFunction {
        constructor(public exponent: number= 2) {
            super();
        }

        public easeInCore(gradient: number): number {
            if (this.exponent <= 0) {
                return gradient;
            }

            return ((Math.exp(this.exponent * gradient) - 1.0) / (Math.exp(this.exponent) - 1.0));
        }
    }

    export class PowerEase  extends EasingFunction implements IEasingFunction {
        constructor(public power: number= 2) {
            super();
        }

        public easeInCore(gradient: number): number {
            var y = Math.max(0.0, this.power);
            return Math.pow(gradient, y);
        }
    }

    export class QuadraticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            return (gradient * gradient);

           

        }
    }

    export class QuarticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            return (gradient * gradient * gradient * gradient);
        }
    }

    export class QuinticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            return (gradient * gradient * gradient * gradient * gradient);
        }
    }

    export class SineEase  extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number {
            return (1.0 - Math.sin(1.5707963267948966 * (1.0 - gradient)));
        }
    }

    export class BezierCurveEase extends EasingFunction implements IEasingFunction {
        constructor(public x1: number= 0, public y1: number= 0, public x2: number= 1, public y2: number= 1) {
            super();
        }

        public easeInCore(gradient: number): number {
            return BezierCurve.interpolate(gradient, this.x1, this.y1, this.x2, this.y2);
        }
    }
}
