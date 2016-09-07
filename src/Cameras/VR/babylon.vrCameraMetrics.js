var BABYLON;
(function (BABYLON) {
    var VRCameraMetrics = (function () {
        function VRCameraMetrics() {
            this.compensateDistortion = true;
        }
        Object.defineProperty(VRCameraMetrics.prototype, "aspectRatio", {
            get: function () {
                return this.hResolution / (2 * this.vResolution);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "aspectRatioFov", {
            get: function () {
                return (2 * Math.atan((this.postProcessScaleFactor * this.vScreenSize) / (2 * this.eyeToScreenDistance)));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "leftHMatrix", {
            get: function () {
                var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
                var h = (4 * meters) / this.hScreenSize;
                return BABYLON.Matrix.Translation(h, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "rightHMatrix", {
            get: function () {
                var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
                var h = (4 * meters) / this.hScreenSize;
                return BABYLON.Matrix.Translation(-h, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "leftPreViewMatrix", {
            get: function () {
                return BABYLON.Matrix.Translation(0.5 * this.interpupillaryDistance, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(VRCameraMetrics.prototype, "rightPreViewMatrix", {
            get: function () {
                return BABYLON.Matrix.Translation(-0.5 * this.interpupillaryDistance, 0, 0);
            },
            enumerable: true,
            configurable: true
        });
        VRCameraMetrics.GetDefault = function () {
            var result = new VRCameraMetrics();
            result.hResolution = 1280;
            result.vResolution = 800;
            result.hScreenSize = 0.149759993;
            result.vScreenSize = 0.0935999975;
            result.vScreenCenter = 0.0467999987,
                result.eyeToScreenDistance = 0.0410000011;
            result.lensSeparationDistance = 0.0635000020;
            result.interpupillaryDistance = 0.0640000030;
            result.distortionK = [1.0, 0.219999999, 0.239999995, 0.0];
            result.chromaAbCorrection = [0.995999992, -0.00400000019, 1.01400006, 0.0];
            result.postProcessScaleFactor = 1.714605507808412;
            result.lensCenterOffset = 0.151976421;
            return result;
        };
        return VRCameraMetrics;
    })();
    BABYLON.VRCameraMetrics = VRCameraMetrics;
})(BABYLON || (BABYLON = {}));
