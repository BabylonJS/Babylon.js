declare module BABYLON {
    class OculusDistortionCorrectionPostProcess extends PostProcess {
        public aspectRatio: number;
        private _isRightEye;
        private _distortionFactors;
        private _postProcessScaleFactor;
        private _lensCenterOffset;
        private _scaleIn;
        private _scaleFactor;
        private _lensCenter;
        constructor(name: string, camera: Camera, isRightEye: boolean, cameraSettings: any);
    }
}
