module BABYLON {
    export class HolographicCamera extends Camera {
        
        private _identityProjection: Matrix;

        private _scriptProjection: Matrix;
        private _scriptViewProjection: Matrix;

        private _onBeforeRenderObserver: Observer<Scene>;

        private _holographicViewMatrix: Matrix;        
        private _holographicViewMatrixChanged = false;

        constructor(name: string, position: Vector3, scene: Scene) {            
            super(name, position, scene);

            this._holographicViewMatrix = new Matrix();

            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
            
            var self = this;
            this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(function (scene) {
                self._holographicViewMatrix.m = (<any>window).getViewMatrix();
                self.setViewMatrix(self._holographicViewMatrix);
            })

            this._identityProjection = BABYLON.Matrix.Identity();

            this._scriptProjection = BABYLON.Matrix.Transpose(BABYLON.Matrix.PerspectiveFovLH(30, window.innerWidth / window.innerHeight, 1, 20));
            this._scriptViewProjection = BABYLON.Matrix.Identity();

            this.fov = 30;
            this.minZ = 1.0;
            this.maxZ = 20;
            this.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;
            this.isIntermediate = false;
            this.viewport = new BABYLON.Viewport(0, 0, 1.0, 1.0);
            this.layerMask = 0x0FFFFFFF;
            this.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
            this.cameraRigMode = BABYLON.Camera.RIG_MODE_NONE;

            scene.addCamera(this);
            if (!scene.activeCamera) {
                scene.activeCamera = this;
            }
        }

        public getTypeName(): string {
            return "HolographicCamera";
        };
        
        public _initCache(): void {
        };

        public _updateCache(): void {
            // Check why ???
            this._holographicViewMatrixChanged = false;
        };

        public _updateFromScene(): void {
        };

        // Synchronized
        public _isSynchronizedViewMatrix() : boolean {
            return !this._holographicViewMatrixChanged;
        };
        public _isSynchronizedProjectionMatrix() : boolean {
            return true;
        };

        public setViewMatrix(view: Matrix) : void {
            this._holographicViewMatrix = view;
            this.position.x = view.m[12];
            this.position.y = view.m[13];
            this.position.z = -view.m[14];
            this._holographicViewMatrixChanged = true;
        };

        public getViewMatrix(): Matrix {
            return this._holographicViewMatrix;
        };

        public getProjectionMatrix(): Matrix {
            return this._identityProjection;
        };

        public computeFrustumPlanes(frustumPlanes: Plane[]) : void {
            if (frustumPlanes) {
                this.getFrustumPlanesToRef(frustumPlanes);
            }
        }
        
        private getFrustumPlanes(): Plane[] {
            this._holographicViewMatrix.multiplyToRef(this._scriptProjection, this._scriptViewProjection);
            return BABYLON.Frustum.GetPlanes(this._scriptViewProjection);
        };

        private getFrustumPlanesToRef(result: Plane[]): Plane[] {
            this._holographicViewMatrix.multiplyToRef(this._scriptProjection, this._scriptViewProjection);
            BABYLON.Frustum.GetPlanesToRef(this._scriptViewProjection, result);
            return result;
        };

        public dispose(): void {
            this.getScene().onBeforeRenderObservable.remove(this._onBeforeRenderObserver);

            super.dispose();
        }
    }
}