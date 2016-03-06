var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var EasingFunction = (function () {
        function EasingFunction() {
            // Properties
            this._easingMode = EasingFunction.EASINGMODE_EASEIN;
        }
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEIN", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEIN;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEOUT", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEOUT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEINOUT", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEINOUT;
            },
            enumerable: true,
            configurable: true
        });
        EasingFunction.prototype.setEasingMode = function (easingMode) {
            var n = Math.min(Math.max(easingMode, 0), 2);
            this._easingMode = n;
        };
        EasingFunction.prototype.getEasingMode = function () {
            return this._easingMode;
        };
        EasingFunction.prototype.easeInCore = function (gradient) {
            throw new Error('You must implement this method');
        };
        EasingFunction.prototype.ease = function (gradient) {
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
        };
        //Statics
        EasingFunction._EASINGMODE_EASEIN = 0;
        EasingFunction._EASINGMODE_EASEOUT = 1;
        EasingFunction._EASINGMODE_EASEINOUT = 2;
        return EasingFunction;
    }());
    BABYLON.EasingFunction = EasingFunction;
    var CircleEase = (function (_super) {
        __extends(CircleEase, _super);
        function CircleEase() {
            _super.apply(this, arguments);
        }
        CircleEase.prototype.easeInCore = function (gradient) {
            gradient = Math.max(0, Math.min(1, gradient));
            return (1.0 - Math.sqrt(1.0 - (gradient * gradient)));
        };
        return CircleEase;
    }(EasingFunction));
    BABYLON.CircleEase = CircleEase;
    var BackEase = (function (_super) {
        __extends(BackEase, _super);
        function BackEase(amplitude) {
            if (amplitude === void 0) { amplitude = 1; }
            _super.call(this);
            this.amplitude = amplitude;
        }
        BackEase.prototype.easeInCore = function (gradient) {
            var num = Math.max(0, this.amplitude);
            return (Math.pow(gradient, 3.0) - ((gradient * num) * Math.sin(3.1415926535897931 * gradient)));
        };
        return BackEase;
    }(EasingFunction));
    BABYLON.BackEase = BackEase;
    var BounceEase = (function (_super) {
        __extends(BounceEase, _super);
        function BounceEase(bounces, bounciness) {
            if (bounces === void 0) { bounces = 3; }
            if (bounciness === void 0) { bounciness = 2; }
            _super.call(this);
            this.bounces = bounces;
            this.bounciness = bounciness;
        }
        BounceEase.prototype.easeInCore = function (gradient) {
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
        };
        return BounceEase;
    }(EasingFunction));
    BABYLON.BounceEase = BounceEase;
    var CubicEase = (function (_super) {
        __extends(CubicEase, _super);
        function CubicEase() {
            _super.apply(this, arguments);
        }
        CubicEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient);
        };
        return CubicEase;
    }(EasingFunction));
    BABYLON.CubicEase = CubicEase;
    var ElasticEase = (function (_super) {
        __extends(ElasticEase, _super);
        function ElasticEase(oscillations, springiness) {
            if (oscillations === void 0) { oscillations = 3; }
            if (springiness === void 0) { springiness = 3; }
            _super.call(this);
            this.oscillations = oscillations;
            this.springiness = springiness;
        }
        ElasticEase.prototype.easeInCore = function (gradient) {
            var num2;
            var num3 = Math.max(0.0, this.oscillations);
            var num = Math.max(0.0, this.springiness);
            if (num == 0) {
                num2 = gradient;
            }
            else {
                num2 = (Math.exp(num * gradient) - 1.0) / (Math.exp(num) - 1.0);
            }
            return (num2 * Math.sin(((6.2831853071795862 * num3) + 1.5707963267948966) * gradient));
        };
        return ElasticEase;
    }(EasingFunction));
    BABYLON.ElasticEase = ElasticEase;
    var ExponentialEase = (function (_super) {
        __extends(ExponentialEase, _super);
        function ExponentialEase(exponent) {
            if (exponent === void 0) { exponent = 2; }
            _super.call(this);
            this.exponent = exponent;
        }
        ExponentialEase.prototype.easeInCore = function (gradient) {
            if (this.exponent <= 0) {
                return gradient;
            }
            return ((Math.exp(this.exponent * gradient) - 1.0) / (Math.exp(this.exponent) - 1.0));
        };
        return ExponentialEase;
    }(EasingFunction));
    BABYLON.ExponentialEase = ExponentialEase;
    var PowerEase = (function (_super) {
        __extends(PowerEase, _super);
        function PowerEase(power) {
            if (power === void 0) { power = 2; }
            _super.call(this);
            this.power = power;
        }
        PowerEase.prototype.easeInCore = function (gradient) {
            var y = Math.max(0.0, this.power);
            return Math.pow(gradient, y);
        };
        return PowerEase;
    }(EasingFunction));
    BABYLON.PowerEase = PowerEase;
    var QuadraticEase = (function (_super) {
        __extends(QuadraticEase, _super);
        function QuadraticEase() {
            _super.apply(this, arguments);
        }
        QuadraticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient);
        };
        return QuadraticEase;
    }(EasingFunction));
    BABYLON.QuadraticEase = QuadraticEase;
    var QuarticEase = (function (_super) {
        __extends(QuarticEase, _super);
        function QuarticEase() {
            _super.apply(this, arguments);
        }
        QuarticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient * gradient);
        };
        return QuarticEase;
    }(EasingFunction));
    BABYLON.QuarticEase = QuarticEase;
    var QuinticEase = (function (_super) {
        __extends(QuinticEase, _super);
        function QuinticEase() {
            _super.apply(this, arguments);
        }
        QuinticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient * gradient * gradient);
        };
        return QuinticEase;
    }(EasingFunction));
    BABYLON.QuinticEase = QuinticEase;
    var SineEase = (function (_super) {
        __extends(SineEase, _super);
        function SineEase() {
            _super.apply(this, arguments);
        }
        SineEase.prototype.easeInCore = function (gradient) {
            return (1.0 - Math.sin(1.5707963267948966 * (1.0 - gradient)));
        };
        return SineEase;
    }(EasingFunction));
    BABYLON.SineEase = SineEase;
    var BezierCurveEase = (function (_super) {
        __extends(BezierCurveEase, _super);
        function BezierCurveEase(x1, y1, x2, y2) {
            if (x1 === void 0) { x1 = 0; }
            if (y1 === void 0) { y1 = 0; }
            if (x2 === void 0) { x2 = 1; }
            if (y2 === void 0) { y2 = 1; }
            _super.call(this);
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        BezierCurveEase.prototype.easeInCore = function (gradient) {
            return BABYLON.BezierCurve.interpolate(gradient, this.x1, this.y1, this.x2, this.y2);
        };
        return BezierCurveEase;
    }(EasingFunction));
    BABYLON.BezierCurveEase = BezierCurveEase;
})(BABYLON || (BABYLON = {}));
