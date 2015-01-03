declare module BABYLON {
    interface IEasingFunction {
        ease(gradient: number): number;
    }
    class EasingFunction implements IEasingFunction {
        private static _EASINGMODE_EASEIN;
        private static _EASINGMODE_EASEOUT;
        private static _EASINGMODE_EASEINOUT;
        static EASINGMODE_EASEIN : number;
        static EASINGMODE_EASEOUT : number;
        static EASINGMODE_EASEINOUT : number;
        private _easingMode;
        public setEasingMode(easingMode: number): void;
        public getEasingMode(): number;
        public easeInCore(gradient: number): number;
        public ease(gradient: number): number;
    }
    class CircleEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class BackEase extends EasingFunction implements IEasingFunction {
        public amplitude: number;
        constructor(amplitude?: number);
        public easeInCore(gradient: number): number;
    }
    class BounceEase extends EasingFunction implements IEasingFunction {
        public bounces: number;
        public bounciness: number;
        constructor(bounces?: number, bounciness?: number);
        public easeInCore(gradient: number): number;
    }
    class CubicEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class ElasticEase extends EasingFunction implements IEasingFunction {
        public oscillations: number;
        public springiness: number;
        constructor(oscillations?: number, springiness?: number);
        public easeInCore(gradient: number): number;
    }
    class ExponentialEase extends EasingFunction implements IEasingFunction {
        public exponent: number;
        constructor(exponent?: number);
        public easeInCore(gradient: number): number;
    }
    class PowerEase extends EasingFunction implements IEasingFunction {
        public power: number;
        constructor(power?: number);
        public easeInCore(gradient: number): number;
    }
    class QuadraticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class QuarticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class QuinticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class SineEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class BezierCurveEase extends EasingFunction implements IEasingFunction {
        public x1: number;
        public y1: number;
        public x2: number;
        public y2: number;
        constructor(x1?: number, y1?: number, x2?: number, y2?: number);
        public easeInCore(gradient: number): number;
    }
}
