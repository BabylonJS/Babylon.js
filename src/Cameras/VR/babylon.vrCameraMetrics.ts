module BABYLON {
    export class VRCameraMetrics {
        public hResolution: number;
        public vResolution: number;
        public hScreenSize: number;
        public vScreenSize: number;
        public vScreenCenter: number;
        public eyeToScreenDistance: number;
        public lensSeparationDistance: number;
        public interpupillaryDistance: number;
        public distortionK: number[];
        public chromaAbCorrection: number[];
        public postProcessScaleFactor: number;
        public lensCenterOffset: number;
        public compensateDistortion = true;

        public get aspectRatio(): number {
            return this.hResolution / (2 * this.vResolution);
        }

        public get aspectRatioFov(): number {
            return (2 * Math.atan((this.postProcessScaleFactor * this.vScreenSize) / (2 * this.eyeToScreenDistance)));
        }

        public get leftHMatrix(): Matrix {
            var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
            var h = (4 * meters) / this.hScreenSize;

            return Matrix.Translation(h, 0, 0);
        }

        public get rightHMatrix(): Matrix {
            var meters = (this.hScreenSize / 4) - (this.lensSeparationDistance / 2);
            var h = (4 * meters) / this.hScreenSize;

            return Matrix.Translation(-h, 0, 0);
        }

        public get leftPreViewMatrix(): Matrix {
            return Matrix.Translation(0.5 * this.interpupillaryDistance, 0, 0);
        }

        public get rightPreViewMatrix(): Matrix {
            return Matrix.Translation(-0.5 * this.interpupillaryDistance, 0, 0);
        }

        public static GetDefault(): VRCameraMetrics {
            var result = new VRCameraMetrics();

            result.hResolution = 1280;
            result.vResolution = 800;
            result.hScreenSize = 0.149759993;
            result.vScreenSize = 0.0935999975;
            result.vScreenCenter = 0.0467999987;
            result.eyeToScreenDistance = 0.0410000011;
            result.lensSeparationDistance = 0.0635000020;
            result.interpupillaryDistance = 0.0640000030;
            result.distortionK = [1.0, 0.219999999, 0.239999995, 0.0];
            result.chromaAbCorrection = [0.995999992, -0.00400000019, 1.01400006, 0.0];
            result.postProcessScaleFactor = 1.714605507808412;
            result.lensCenterOffset = 0.151976421;

            return result;
        }
    }
}