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
            result.vScreenCenter = 0.0467999987,
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

    export class Camera extends Node {
        // Statics
        private static _PERSPECTIVE_CAMERA = 0;
        private static _ORTHOGRAPHIC_CAMERA = 1;

        private static _FOVMODE_VERTICAL_FIXED = 0;
        private static _FOVMODE_HORIZONTAL_FIXED = 1;

        private static _RIG_MODE_NONE = 0;
        private static _RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
        private static _RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
        private static _RIG_MODE_VR = 20;

        public static get PERSPECTIVE_CAMERA(): number {
            return Camera._PERSPECTIVE_CAMERA;
        }

        public static get ORTHOGRAPHIC_CAMERA(): number {
            return Camera._ORTHOGRAPHIC_CAMERA;
        }

        public static get FOVMODE_VERTICAL_FIXED(): number {
            return Camera._FOVMODE_VERTICAL_FIXED;
        }

        public static get FOVMODE_HORIZONTAL_FIXED(): number {
            return Camera._FOVMODE_HORIZONTAL_FIXED;
        }

        public static get RIG_MODE_NONE(): number {
            return Camera._RIG_MODE_NONE;
        }

        public static get RIG_MODE_STEREOSCOPIC_ANAGLYPH(): number {
            return Camera._RIG_MODE_STEREOSCOPIC_ANAGLYPH;
        }

        public static get RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL(): number {
            return Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL;
        }

        public static get RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED(): number {
            return Camera._RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
        }

        public static get RIG_MODE_STEREOSCOPIC_OVERUNDER(): number {
            return Camera._RIG_MODE_STEREOSCOPIC_OVERUNDER;
        }

        public static get RIG_MODE_VR(): number {
            return Camera._RIG_MODE_VR;
        }
        
        // Members
        public upVector = Vector3.Up();
        public orthoLeft = null;
        public orthoRight = null;
        public orthoBottom = null;
        public orthoTop = null;
        public fov = 0.8;
        public minZ = 1.0;
        public maxZ = 10000.0;
        public inertia = 0.9;
        public mode = Camera.PERSPECTIVE_CAMERA;
        public isIntermediate = false;
        public viewport = new Viewport(0, 0, 1.0, 1.0);
        public layerMask: number = 0x0FFFFFFF;
        public fovMode: number = Camera.FOVMODE_VERTICAL_FIXED;
   
        // Camera rig members
        public cameraRigMode = Camera.RIG_MODE_NONE;
        public _cameraRigParams: any;
        public _rigCameras = new Array<Camera>();

        // Cache
        private _computedViewMatrix = Matrix.Identity();
        public _projectionMatrix = new Matrix();
        private _worldMatrix: Matrix;
        public _postProcesses = new Array<PostProcess>();
        public _postProcessesTakenIndices = [];

        public _activeMeshes = new SmartArray<Mesh>(256);

        private _globalPosition = Vector3.Zero();

        constructor(name: string, public position: Vector3, scene: Scene) {
            super(name, scene);

            scene.addCamera(this);

            if (!scene.activeCamera) {
                scene.activeCamera = this;
            }
        }

        public get globalPosition(): Vector3 {
            return this._globalPosition;
        }

        public getActiveMeshes(): SmartArray<Mesh> {
            return this._activeMeshes;
        }

        public isActiveMesh(mesh: Mesh): boolean {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        }

        //Cache
        public _initCache() {
            super._initCache();

            this._cache.position = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.upVector = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

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

            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
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
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._updateRigCameras();
            }
            this._checkInputs();
        }

        public _checkInputs(): void {
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
            var i: number;
            var start: number;
            if (this._postProcesses[insertAt]) {
                start = this._postProcesses.length - 1;
                for (i = start; i >= insertAt + 1; --i) {
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

            if (!add && this._postProcessesTakenIndices.indexOf(insertAt) === -1) {
                this._postProcessesTakenIndices.push(insertAt);
            }

            var result = insertAt + add;

            this._postProcesses[result] = postProcess;

            return result;
        }

        public detachPostProcess(postProcess: PostProcess, atIndices: any = null): number[] {
            var result = [];
            var i: number;
            var index: number;
            if (!atIndices) {

                var length = this._postProcesses.length;

                for (i = 0; i < length; i++) {

                    if (this._postProcesses[i] !== postProcess) {
                        continue;
                    }

                    delete this._postProcesses[i];
                    index = this._postProcessesTakenIndices.indexOf(i);
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
                this._worldMatrix = Matrix.Identity();
            }

            var viewMatrix = this.getViewMatrix();

            viewMatrix.invertToRef(this._worldMatrix);

            return this._worldMatrix;
        }

        public _getViewMatrix(): Matrix {
            return Matrix.Identity();
        }

        public getViewMatrix(force?: boolean): Matrix {
            this._computedViewMatrix = this._computeViewMatrix(force);

            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }

            if (!this.parent || !this.parent.getWorldMatrix) {
                this._globalPosition.copyFrom(this.position);
            } else {
                if (!this._worldMatrix) {
                    this._worldMatrix = Matrix.Identity();
                }

                this._computedViewMatrix.invertToRef(this._worldMatrix);

                this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._computedViewMatrix);
                this._globalPosition.copyFromFloats(this._computedViewMatrix.m[12], this._computedViewMatrix.m[13], this._computedViewMatrix.m[14]);

                this._computedViewMatrix.invert();

                this._markSyncedWithParent();
            }

            this._currentRenderId = this.getScene().getRenderId();

            return this._computedViewMatrix;
        }

        public _computeViewMatrix(force?: boolean): Matrix {
            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }

            this._computedViewMatrix = this._getViewMatrix();
            this._currentRenderId = this.getScene().getRenderId();

            return this._computedViewMatrix;
        }

        public getProjectionMatrix(force?: boolean): Matrix {
            if (!force && this._isSynchronizedProjectionMatrix()) {
                return this._projectionMatrix;
            }

            var engine = this.getEngine();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                if (this.minZ <= 0) {
                    this.minZ = 0.1;
                }

                Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix, this.fovMode);
                return this._projectionMatrix;
            }

            var halfWidth = engine.getRenderWidth() / 2.0;
            var halfHeight = engine.getRenderHeight() / 2.0;
            Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
            return this._projectionMatrix;
        }

        public dispose(): void {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this.getScene().removeCamera(this);
            while (this._rigCameras.length > 0) {
                this._rigCameras.pop().dispose();
            }

            // Postprocesses
            for (var i = 0; i < this._postProcessesTakenIndices.length; ++i) {
                this._postProcesses[this._postProcessesTakenIndices[i]].dispose(this);
            }
        }
        
        // ---- Camera rigs section ----
        public setCameraRigMode(mode: number, rigParams: any): void {
            while (this._rigCameras.length > 0) {
                this._rigCameras.pop().dispose();
            }
            this.cameraRigMode = mode;
            this._cameraRigParams = {};

            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    this._cameraRigParams.interaxialDistance = rigParams.interaxialDistance || 0.0637;
                    //we have to implement stereo camera calcultating left and right viewpoints from interaxialDistance and target, 
                    //not from a given angle as it is now, but until that complete code rewriting provisional stereoHalfAngle value is introduced
                    this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637);

                    this._rigCameras.push(this.createRigCamera(this.name + "_L", 0));
                    this._rigCameras.push(this.createRigCamera(this.name + "_R", 1));
                    break;
            }

            var postProcesses = new Array<PostProcess>();

            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                    postProcesses.push(new PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[0]));
                    this._rigCameras[0].isIntermediate = true;

                    postProcesses.push(new AnaglyphPostProcess(this.name + "_anaglyph", 1.0, this._rigCameras[1]));
                    postProcesses[1].onApply = effect => {
                        effect.setTextureFromPostProcess("leftSampler", postProcesses[0]);
                    };
                    break;

                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    var isStereoscopicHoriz = (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED);
                    var firstCamIndex = (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED) ? 1 : 0;
                    var secondCamIndex = 1 - firstCamIndex;

                    postProcesses.push(new PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[firstCamIndex]));
                    this._rigCameras[firstCamIndex].isIntermediate = true;

                    postProcesses.push(new StereoscopicInterlacePostProcess(this.name + "_stereoInterlace", this._rigCameras[secondCamIndex], postProcesses[0], isStereoscopicHoriz));
                    break;

                case Camera.RIG_MODE_VR:
                    this._rigCameras.push(this.createRigCamera(this.name + "_L", 0));
                    this._rigCameras.push(this.createRigCamera(this.name + "_R", 1));

                    var metrics = rigParams.vrCameraMetrics || VRCameraMetrics.GetDefault();
                    this._rigCameras[0]._cameraRigParams.vrMetrics = metrics;
                    this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
                    this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();

                    this._rigCameras[0]._cameraRigParams.vrHMatrix = metrics.leftHMatrix;
                    this._rigCameras[0]._cameraRigParams.vrPreViewMatrix = metrics.leftPreViewMatrix;
                    this._rigCameras[0].getProjectionMatrix = this._rigCameras[0]._getVRProjectionMatrix;

                    if (metrics.compensateDistortion) {
                        postProcesses.push(new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Left", this._rigCameras[0], false, metrics));
                    }

                    this._rigCameras[1]._cameraRigParams.vrMetrics = this._rigCameras[0]._cameraRigParams.vrMetrics;
                    this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
                    this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
                    this._rigCameras[1]._cameraRigParams.vrHMatrix = metrics.rightHMatrix;
                    this._rigCameras[1]._cameraRigParams.vrPreViewMatrix = metrics.rightPreViewMatrix;

                    this._rigCameras[1].getProjectionMatrix = this._rigCameras[1]._getVRProjectionMatrix;

                    if (metrics.compensateDistortion) {
                        postProcesses.push(new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Right", this._rigCameras[1], true, metrics));
                    }
                    break;
            }

            this._update();
        }

        private _getVRProjectionMatrix(): Matrix {
            Matrix.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix);
            this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix);
            return this._projectionMatrix;
        }

        public setCameraRigParameter(name: string, value: any) {
            this._cameraRigParams[name] = value;
            //provisionnally:
            if (name === "interaxialDistance") {
                this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(value / 0.0637);
            }
        }
        
        /**
         * May needs to be overridden by children so sub has required properties to be copied
         */
        public createRigCamera(name: string, cameraIndex: number): Camera {
            return null;
        }
        
        /**
         * May needs to be overridden by children
         */
        public _updateRigCameras() {
            for (var i = 0; i < this._rigCameras.length; i++) {
                this._rigCameras[i].minZ = this.minZ;
                this._rigCameras[i].maxZ = this.maxZ;
                this._rigCameras[i].fov = this.fov;
            }
            
            // only update viewport when ANAGLYPH
            if (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH) {
                this._rigCameras[0].viewport = this._rigCameras[1].viewport = this.viewport;
            }
        }

        public static ParseCamera(parsedCamera: any, scene: Scene): Camera {
            var camera;
            var position = Vector3.FromArray(parsedCamera.position);
            var lockedTargetMesh = (parsedCamera.lockedTargetId) ? scene.getLastMeshByID(parsedCamera.lockedTargetId) : null;

            if (parsedCamera.type === "AnaglyphArcRotateCamera" || parsedCamera.type === "ArcRotateCamera") {
                var alpha = parsedCamera.alpha;
                var beta = parsedCamera.beta;
                var radius = parsedCamera.radius;
                if (parsedCamera.type === "AnaglyphArcRotateCamera") {
                    var interaxial_distance = parsedCamera.interaxial_distance;
                    camera = new AnaglyphArcRotateCamera(parsedCamera.name, alpha, beta, radius, lockedTargetMesh, interaxial_distance, scene);
                } else {
                    camera = new ArcRotateCamera(parsedCamera.name, alpha, beta, radius, lockedTargetMesh, scene);
                }

            } else if (parsedCamera.type === "AnaglyphFreeCamera") {
                interaxial_distance = parsedCamera.interaxial_distance;
                camera = new AnaglyphFreeCamera(parsedCamera.name, position, interaxial_distance, scene);

            } else if (parsedCamera.type === "DeviceOrientationCamera") {
                camera = new DeviceOrientationCamera(parsedCamera.name, position, scene);

            } else if (parsedCamera.type === "FollowCamera") {
                camera = new FollowCamera(parsedCamera.name, position, scene);
                camera.heightOffset = parsedCamera.heightOffset;
                camera.radius = parsedCamera.radius;
                camera.rotationOffset = parsedCamera.rotationOffset;
                if (lockedTargetMesh)
                    (<FollowCamera>camera).target = lockedTargetMesh;

            } else if (parsedCamera.type === "GamepadCamera") {
                camera = new GamepadCamera(parsedCamera.name, position, scene);

            } else if (parsedCamera.type === "TouchCamera") {
                camera = new TouchCamera(parsedCamera.name, position, scene);

            } else if (parsedCamera.type === "VirtualJoysticksCamera") {
                camera = new VirtualJoysticksCamera(parsedCamera.name, position, scene);

            } else if (parsedCamera.type === "WebVRFreeCamera") {
                camera = new WebVRFreeCamera(parsedCamera.name, position, scene);

            } else if (parsedCamera.type === "VRDeviceOrientationFreeCamera") {
                camera = new VRDeviceOrientationFreeCamera(parsedCamera.name, position, scene);

            } else {
                // Free Camera is the default value
                camera = new FreeCamera(parsedCamera.name, position, scene);
            }

            // apply 3d rig, when found
            if (parsedCamera.cameraRigMode) {
                var rigParams = (parsedCamera.interaxial_distance) ? { interaxialDistance: parsedCamera.interaxial_distance } : {};
                camera.setCameraRigMode(parsedCamera.cameraRigMode, rigParams);
            }

            // Test for lockedTargetMesh & FreeCamera outside of if-else-if nest, since things like GamepadCamera extend FreeCamera
            if (lockedTargetMesh && camera instanceof FreeCamera) {
                (<FreeCamera>camera).lockedTarget = lockedTargetMesh;
            }

            camera.id = parsedCamera.id;

            Tags.AddTagsTo(camera, parsedCamera.tags);

            // Parent
            if (parsedCamera.parentId) {
                camera._waitingParentId = parsedCamera.parentId;
            }

            // Target
            if (parsedCamera.target) {
                if (camera.setTarget) {
                    camera.setTarget(Vector3.FromArray(parsedCamera.target));
                } else {
                    //For ArcRotate
                    camera.target = Vector3.FromArray(parsedCamera.target);
                }
            } else {
                camera.rotation = Vector3.FromArray(parsedCamera.rotation);
            }

            camera.fov = parsedCamera.fov;
            camera.minZ = parsedCamera.minZ;
            camera.maxZ = parsedCamera.maxZ;

            camera.speed = parsedCamera.speed;
            camera.inertia = parsedCamera.inertia;

            camera.checkCollisions = parsedCamera.checkCollisions;
            camera.applyGravity = parsedCamera.applyGravity;
            if (parsedCamera.ellipsoid) {
                camera.ellipsoid = Vector3.FromArray(parsedCamera.ellipsoid);
            }

            // Animations
            if (parsedCamera.animations) {
                for (var animationIndex = 0; animationIndex < parsedCamera.animations.length; animationIndex++) {
                    var parsedAnimation = parsedCamera.animations[animationIndex];

                    camera.animations.push(Animation.ParseAnimation(parsedAnimation));
                }
            }

            if (parsedCamera.autoAnimate) {
                scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, 1.0);
            }

            // Layer Mask
            if (parsedCamera.layerMask && (!isNaN(parsedCamera.layerMask))) {
                camera.layerMask = Math.abs(parseInt(parsedCamera.layerMask));
            } else {
                camera.layerMask = 0x0FFFFFFF;
            }

            return camera;
        }
    }
}

