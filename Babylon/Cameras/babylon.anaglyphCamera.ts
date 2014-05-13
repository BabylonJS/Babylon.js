module BABYLON {
    var buildCamera = (that, name) => {
        that._leftCamera.isIntermediate = true;

        that.subCameras.push(that._leftCamera);
        that.subCameras.push(that._rightCamera);

        that._leftTexture = new BABYLON.PassPostProcess(name + "_leftTexture", 1.0, that._leftCamera);
        that._anaglyphPostProcess = new BABYLON.AnaglyphPostProcess(name + "_anaglyph", 1.0, that._rightCamera);

        that._anaglyphPostProcess.onApply = effect => {
            effect.setTextureFromPostProcess("leftSampler", that._leftTexture);
        };

        that._update();
    };

    export class AnaglyphArcRotateCamera extends ArcRotateCamera {
        private _eyeSpace: number;
        private _leftCamera: ArcRotateCamera;
        private _rightCamera: ArcRotateCamera;

        // ANY
        constructor(name: string, alpha: number, beta: number, radius: number, target, eyeSpace: number, scene) {
            super(name, alpha, beta, radius, target, scene);

            this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);

            this._leftCamera = new BABYLON.ArcRotateCamera(name + "_left", alpha - this._eyeSpace, beta, radius, target, scene);
            this._rightCamera = new BABYLON.ArcRotateCamera(name + "_right", alpha + this._eyeSpace, beta, radius, target, scene);

            buildCamera(this, name);
        }

        public _update(): void {
            this._updateCamera(this._leftCamera);
            this._updateCamera(this._rightCamera);

            this._leftCamera.alpha = this.alpha - this._eyeSpace;
            this._rightCamera.alpha = this.alpha + this._eyeSpace;

            super._update();
        }

        public _updateCamera(camera: ArcRotateCamera) {
            camera.beta = this.beta;
            camera.radius = this.radius;

            camera.minZ = this.minZ;
            camera.maxZ = this.maxZ;

            camera.fov = this.fov;

            camera.target = this.target;
        }
    }

    export class AnaglyphFreeCamera extends FreeCamera {
        private _eyeSpace: number;
        private _leftCamera: FreeCamera;
        private _rightCamera: FreeCamera;
        private _transformMatrix: Matrix;

        constructor(name: string, position: Vector3, eyeSpace: number, scene: Scene) {
            super(name, position, scene);

            this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);
            this._transformMatrix = new BABYLON.Matrix();

            this._leftCamera = new BABYLON.FreeCamera(name + "_left", position.clone(), scene);
            this._rightCamera = new BABYLON.FreeCamera(name + "_right", position.clone(), scene);

            buildCamera(this, name);
        }

        public _getSubCameraPosition(eyeSpace, result) {
            var target = this.getTarget();
            BABYLON.Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(BABYLON.Matrix.RotationY(eyeSpace), this._transformMatrix);

            this._transformMatrix = this._transformMatrix.multiply(BABYLON.Matrix.Translation(target.x, target.y, target.z));

            BABYLON.Vector3.TransformCoordinatesToRef(this.position, this._transformMatrix, result);
        }

        public _update(): void {
            this._getSubCameraPosition(-this._eyeSpace, this._leftCamera.position);
            this._getSubCameraPosition(this._eyeSpace, this._rightCamera.position);

            this._updateCamera(this._leftCamera);
            this._updateCamera(this._rightCamera);

            super._update();
        }

        public _updateCamera(camera: FreeCamera): void {
            camera.minZ = this.minZ;
            camera.maxZ = this.maxZ;

            camera.fov = this.fov;

            camera.viewport = this.viewport;

            camera.setTarget(this.getTarget());
        }
    }
} 