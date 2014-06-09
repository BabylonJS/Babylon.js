module BABYLON {
    export class Camera extends Node {
        // Statics
        public static PERSPECTIVE_CAMERA = 0;
        public static ORTHOGRAPHIC_CAMERA = 1;

        // Members
        public upVector = Vector3.Up();
        public orthoLeft = null;
        public orthoRight = null;
        public orthoBottom = null;
        public orthoTop = null;
        public fov = 0.8;
        public minZ = 0.1;
        public maxZ = 1000.0;
        public inertia = 0.9;
        public mode = Camera.PERSPECTIVE_CAMERA;
        public isIntermediate = false;
        public viewport = new Viewport(0, 0, 1.0, 1.0);
        public subCameras = [];
        public layerMask: number = 0xFFFFFFFF;

        private _computedViewMatrix = BABYLON.Matrix.Identity();
        private _projectionMatrix = new BABYLON.Matrix();
        private _worldMatrix: Matrix;
        public _postProcesses = new Array<PostProcess>();
        public _postProcessesTakenIndices = [];

        constructor(name: string, public position: Vector3, scene: Scene) {
            super(name, scene);

            scene.cameras.push(this);

            if (!scene.activeCamera) {
                scene.activeCamera = this;
            }
        }

        //Cache
        public _initCache() {
            super._initCache();

            this._cache.position = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.upVector = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

            this._cache.mode = undefined;
            this._cache.minZ = undefined;
            this._cache.maxZ = undefined;

            this._cache.fov = undefined;
            this._cache.aspectRatio = undefined;

            this._cache.orthoLeft = undefined;
            this._cache.orthoRight = undefined;
            this._cache.orthoBottom = undefined;
            this._cache.orthoTop = undefined;
            this._cache.renderWidth = undefined;
            this._cache.renderHeight = undefined;
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            var engine = this.getEngine();

            this._cache.position.copyFrom(this.position);
            this._cache.upVector.copyFrom(this.upVector);

            this._cache.mode = this.mode;
            this._cache.minZ = this.minZ;
            this._cache.maxZ = this.maxZ;

            this._cache.fov = this.fov;
            this._cache.aspectRatio = engine.getAspectRatio(this);

            this._cache.orthoLeft = this.orthoLeft;
            this._cache.orthoRight = this.orthoRight;
            this._cache.orthoBottom = this.orthoBottom;
            this._cache.orthoTop = this.orthoTop;
            this._cache.renderWidth = engine.getRenderWidth();
            this._cache.renderHeight = engine.getRenderHeight();
        }

        public _updateFromScene(): void {
            this.updateCache();
            this._update();
        }

        // Synchronized
        public _isSynchronized(): boolean {
            return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
        }

        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronized())
                return false;

            return this._cache.position.equals(this.position)
                && this._cache.upVector.equals(this.upVector)
                && this.isSynchronizedWithParent();
        }

        public _isSynchronizedProjectionMatrix(): boolean {
            var check = this._cache.mode === this.mode
                && this._cache.minZ === this.minZ
                && this._cache.maxZ === this.maxZ;

            if (!check) {
                return false;
            }

            var engine = this.getEngine();

            if (this.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
                check = this._cache.fov === this.fov
                && this._cache.aspectRatio === engine.getAspectRatio(this);
            }
            else {
                check = this._cache.orthoLeft === this.orthoLeft
                && this._cache.orthoRight === this.orthoRight
                && this._cache.orthoBottom === this.orthoBottom
                && this._cache.orthoTop === this.orthoTop
                && this._cache.renderWidth === engine.getRenderWidth()
                && this._cache.renderHeight === engine.getRenderHeight();
            }

            return check;
        }

        // Controls
        public attachControl(element: HTMLElement): void {
        }

        public detachControl(element: HTMLElement): void {
        }

        public _update(): void {
        }

        public attachPostProcess(postProcess: PostProcess, insertAt: number = null): number {
            if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
                Tools.Error("You're trying to reuse a post process not defined as reusable.");
                return 0;
            }

            if (insertAt == null || insertAt < 0) {
                this._postProcesses.push(postProcess);
                this._postProcessesTakenIndices.push(this._postProcesses.length - 1);

                return this._postProcesses.length - 1;
            }

            var add = 0;

            if (this._postProcesses[insertAt]) {

                var start = this._postProcesses.length - 1;


                for (var i = start; i >= insertAt + 1; --i) {
                    this._postProcesses[i + 1] = this._postProcesses[i];
                }

                add = 1;
            }

            for (i = 0; i < this._postProcessesTakenIndices.length; ++i) {
                if (this._postProcessesTakenIndices[i] < insertAt) {
                    continue;
                }

                start = this._postProcessesTakenIndices.length - 1;
                for (var j = start; j >= i; --j) {
                    this._postProcessesTakenIndices[j + 1] = this._postProcessesTakenIndices[j] + add;
                }
                this._postProcessesTakenIndices[i] = insertAt;
                break;
            }

            if (!add && this._postProcessesTakenIndices.indexOf(insertAt) == -1) {
                this._postProcessesTakenIndices.push(insertAt);
            }

            var result = insertAt + add;

            this._postProcesses[result] = postProcess;

            return result;
        }

        public detachPostProcess(postProcess: PostProcess, atIndices: any = null): number[] {
            var result = [];

            if (!atIndices) {

                var length = this._postProcesses.length;

                for (var i = 0; i < length; i++) {

                    if (this._postProcesses[i] !== postProcess) {
                        continue;
                    }

                    delete this._postProcesses[i];

                    var index = this._postProcessesTakenIndices.indexOf(i);
                    this._postProcessesTakenIndices.splice(index, 1);
                }

            }
            else {
                atIndices = (atIndices instanceof Array) ? atIndices : [atIndices];
                for (i = 0; i < atIndices.length; i++) {
                    var foundPostProcess = this._postProcesses[atIndices[i]];

                    if (foundPostProcess !== postProcess) {
                        result.push(i);
                        continue;
                    }

                    delete this._postProcesses[atIndices[i]];

                    index = this._postProcessesTakenIndices.indexOf(atIndices[i]);
                    this._postProcessesTakenIndices.splice(index, 1);
                }
            }
            return result;
        }

        public getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            var viewMatrix = this.getViewMatrix();

            viewMatrix.invertToRef(this._worldMatrix);

            return this._worldMatrix;
        }

        public _getViewMatrix(): Matrix {
            return BABYLON.Matrix.Identity();
        }

        public getViewMatrix(): Matrix {
            this._computedViewMatrix = this._computeViewMatrix();

            if (!this.parent
                || !this.parent.getWorldMatrix
                || this.isSynchronized()) {
                return this._computedViewMatrix;
            }

            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            this._computedViewMatrix.invertToRef(this._worldMatrix);

            this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._computedViewMatrix);

            this._computedViewMatrix.invert();

            this._currentRenderId = this.getScene().getRenderId();
            return this._computedViewMatrix;
        }

        public _computeViewMatrix(force?: boolean): Matrix {
            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }

            this._computedViewMatrix = this._getViewMatrix();
            if (!this.parent || !this.parent.getWorldMatrix) {
                this._currentRenderId = this.getScene().getRenderId();
            }
            return this._computedViewMatrix;
        }

        public getProjectionMatrix(force?: boolean): Matrix {
            if (!force && this._isSynchronizedProjectionMatrix()) {
                return this._projectionMatrix;
            }

            var engine = this.getEngine();
            if (this.mode === BABYLON.Camera.PERSPECTIVE_CAMERA) {
                if (this.minZ <= 0) {
                    this.minZ = 0.1;
                }

                BABYLON.Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix);
                return this._projectionMatrix;
            }

            var halfWidth = engine.getRenderWidth() / 2.0;
            var halfHeight = engine.getRenderHeight() / 2.0;
            BABYLON.Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
            return this._projectionMatrix;
        }

        public dispose(): void {
            // Remove from scene
            var index = this.getScene().cameras.indexOf(this);
            this.getScene().cameras.splice(index, 1);

            // Postprocesses
            for (var i = 0; i < this._postProcessesTakenIndices.length; ++i) {
                this._postProcesses[this._postProcessesTakenIndices[i]].dispose(this);
            }
        }
    }
}