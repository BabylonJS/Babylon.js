module BABYLON {
    export class Camera extends Node {
        public inputs: CameraInputsManager<Camera>;

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
        private static _RIG_MODE_WEBVR = 21;

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

        public static get RIG_MODE_WEBVR(): number {
            return Camera._RIG_MODE_WEBVR;
        }

        public static ForceAttachControlToAlwaysPreventDefault = false;

        // Members
        @serializeAsVector3()
        public position: Vector3;

        @serializeAsVector3()
        public upVector = Vector3.Up();

        @serialize()
        public orthoLeft = null;

        @serialize()
        public orthoRight = null;

        @serialize()
        public orthoBottom = null;

        @serialize()
        public orthoTop = null;

        @serialize()
        public fov = 0.8;

        @serialize()
        public minZ = 1.0;

        @serialize()
        public maxZ = 10000.0;

        @serialize()
        public inertia = 0.9;

        @serialize()
        public mode = Camera.PERSPECTIVE_CAMERA;
        public isIntermediate = false;

        public viewport = new Viewport(0, 0, 1.0, 1.0);

        @serialize()
        public layerMask: number = 0x0FFFFFFF;

        @serialize()
        public fovMode: number = Camera.FOVMODE_VERTICAL_FIXED;

        // Camera rig members
        @serialize()
        public cameraRigMode = Camera.RIG_MODE_NONE;

        @serialize()
        public interaxialDistance: number

        @serialize()
        public isStereoscopicSideBySide: boolean

        public _cameraRigParams: any;
        public _rigCameras = new Array<Camera>();
        public _rigPostProcess: PostProcess;

        // Cache
        private _computedViewMatrix = Matrix.Identity();
        public _projectionMatrix = new Matrix();
        private _doNotComputeProjectionMatrix = false;
        private _worldMatrix: Matrix;
        public _postProcesses = new Array<PostProcess>();
        private _transformMatrix = Matrix.Zero();
        private _webvrViewMatrix = Matrix.Identity();

        public _activeMeshes = new SmartArray<Mesh>(256);

        private _globalPosition = Vector3.Zero();
        private _frustumPlanes: Plane[];
        private _refreshFrustumPlanes = true;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, scene);

            scene.addCamera(this);

            if (!scene.activeCamera) {
                scene.activeCamera = this;
            }

            this.position = position;
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name;
            ret += ", type: " + this.getTypeName();
            if (this.animations) {
                for (var i = 0; i < this.animations.length; i++) {
                    ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails) {
            }
            return ret;
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
            this._cache.fovMode = undefined;
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
            this._cache.fovMode = this.fovMode;
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
            this.update();
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
                    && this._cache.fovMode === this.fovMode
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
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        }

        public detachControl(element: HTMLElement): void {
        }

        public update(): void {
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._updateRigCameras();
            }
            this._checkInputs();
        }

        public _checkInputs(): void {
        }

        private _cascadePostProcessesToRigCams(): void {
            // invalidate framebuffer
            if (this._postProcesses.length > 0) {
                this._postProcesses[0].markTextureDirty();
            }

            // glue the rigPostProcess to the end of the user postprocesses & assign to each sub-camera
            for (var i = 0, len = this._rigCameras.length; i < len; i++) {
                var cam = this._rigCameras[i];
                var rigPostProcess = cam._rigPostProcess;

                // for VR rig, there does not have to be a post process 
                if (rigPostProcess) {
                    var isPass = rigPostProcess instanceof PassPostProcess;
                    if (isPass) {
                        // any rig which has a PassPostProcess for rig[0], cannot be isIntermediate when there are also user postProcesses
                        cam.isIntermediate = this._postProcesses.length === 0;
                    }
                    cam._postProcesses = this._postProcesses.slice(0).concat(rigPostProcess);
                    rigPostProcess.markTextureDirty();

                } else {
                    cam._postProcesses = this._postProcesses.slice(0);
                }
            }
        }

        public attachPostProcess(postProcess: PostProcess, insertAt: number = null): number {
            if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
                Tools.Error("You're trying to reuse a post process not defined as reusable.");
                return 0;
            }

            if (insertAt == null || insertAt < 0) {
                this._postProcesses.push(postProcess);

            } else {
                this._postProcesses.splice(insertAt, 0, postProcess);
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated            
            return this._postProcesses.indexOf(postProcess);
        }

        public detachPostProcess(postProcess: PostProcess, atIndices: any = null): number[] {
            var result = [];
            var i: number;
            var index: number;

            if (!atIndices) {
                var idx = this._postProcesses.indexOf(postProcess);
                if (idx !== -1) {
                    this._postProcesses.splice(idx, 1);
                }
            } else {
                atIndices = (atIndices instanceof Array) ? atIndices : [atIndices];
                // iterate descending, so can just splice as we go
                for (i = atIndices.length - 1; i >= 0; i--) {
                    if (this._postProcesses[atIndices[i]] !== postProcess) {
                        result.push(i);
                        continue;
                    }
                    this._postProcesses.splice(index, 1);
                }
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
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

            this._refreshFrustumPlanes = true;

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

        public freezeProjectionMatrix(projection?: Matrix): void {
            this._doNotComputeProjectionMatrix = true;
            if (projection !== undefined) {
                this._projectionMatrix = projection;
            }
        };
        
        public unfreezeProjectionMatrix(): void {
            this._doNotComputeProjectionMatrix = false;
        };
        
        public getProjectionMatrix(force?: boolean): Matrix {
            if (this._doNotComputeProjectionMatrix || (!force && this._isSynchronizedProjectionMatrix())) {
                return this._projectionMatrix;
            }

            this._refreshFrustumPlanes = true;

            var engine = this.getEngine();
            var scene = this.getScene();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                if (this.minZ <= 0) {
                    this.minZ = 0.1;
                }

                if (scene.useRightHandedSystem) {
                    Matrix.PerspectiveFovRHToRef(this.fov,
                        engine.getAspectRatio(this),
                        this.minZ,
                        this.maxZ,
                        this._projectionMatrix,
                        this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
                } else {
                    Matrix.PerspectiveFovLHToRef(this.fov,
                        engine.getAspectRatio(this),
                        this.minZ,
                        this.maxZ,
                        this._projectionMatrix,
                        this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
                }
                return this._projectionMatrix;
            }

            var halfWidth = engine.getRenderWidth() / 2.0;
            var halfHeight = engine.getRenderHeight() / 2.0;
            if (scene.useRightHandedSystem) {
                Matrix.OrthoOffCenterRHToRef(this.orthoLeft || -halfWidth,
                    this.orthoRight || halfWidth,
                    this.orthoBottom || -halfHeight,
                    this.orthoTop || halfHeight,
                    this.minZ,
                    this.maxZ,
                    this._projectionMatrix);
            } else {
                Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth,
                    this.orthoRight || halfWidth,
                    this.orthoBottom || -halfHeight,
                    this.orthoTop || halfHeight,
                    this.minZ,
                    this.maxZ,
                    this._projectionMatrix);
            }
            return this._projectionMatrix;
        }

        public getTranformationMatrix(): Matrix {
            this._computedViewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            return this._transformMatrix;
        }

        private updateFrustumPlanes(): void {
            if (!this._refreshFrustumPlanes) {
                return;
            }

            this.getTranformationMatrix();

            if (!this._frustumPlanes) {
                this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
            } else {
                Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }

            this._refreshFrustumPlanes = false;
        }

        public isInFrustum(target: ICullable): boolean {
            this.updateFrustumPlanes();

            return target.isInFrustum(this._frustumPlanes);
        }

        public isCompletelyInFrustum(target: ICullable): boolean {
            this.updateFrustumPlanes();

            return target.isCompletelyInFrustum(this._frustumPlanes);
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
            for (var i = 0; i < this._postProcesses.length; ++i) {
                this._postProcesses[i].dispose(this);
            }

            super.dispose();
        }

        // ---- Camera rigs section ----
        public setCameraRigMode(mode: number, rigParams: any): void {
            while (this._rigCameras.length > 0) {
                this._rigCameras.pop().dispose();
            }
            this.cameraRigMode = mode;
            this._cameraRigParams = {};
            //we have to implement stereo camera calcultating left and right viewpoints from interaxialDistance and target, 
            //not from a given angle as it is now, but until that complete code rewriting provisional stereoHalfAngle value is introduced
            this._cameraRigParams.interaxialDistance = rigParams.interaxialDistance || 0.0637;
            this._cameraRigParams.stereoHalfAngle = BABYLON.Tools.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637);

            // create the rig cameras, unless none
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._rigCameras.push(this.createRigCamera(this.name + "_L", 0));
                this._rigCameras.push(this.createRigCamera(this.name + "_R", 1));
            }

            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                    this._rigCameras[0]._rigPostProcess = new PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[0]);
                    this._rigCameras[1]._rigPostProcess = new AnaglyphPostProcess(this.name + "_anaglyph", 1.0, this._rigCameras);
                    break;

                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                    var isStereoscopicHoriz = this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;

                    this._rigCameras[0]._rigPostProcess = new PassPostProcess(this.name + "_passthru", 1.0, this._rigCameras[0]);
                    this._rigCameras[1]._rigPostProcess = new StereoscopicInterlacePostProcess(this.name + "_stereoInterlace", this._rigCameras, isStereoscopicHoriz);
                    break;

                case Camera.RIG_MODE_VR:
                    var metrics = rigParams.vrCameraMetrics || VRCameraMetrics.GetDefault();

                    this._rigCameras[0]._cameraRigParams.vrMetrics = metrics;
                    this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
                    this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();
                    this._rigCameras[0]._cameraRigParams.vrHMatrix = metrics.leftHMatrix;
                    this._rigCameras[0]._cameraRigParams.vrPreViewMatrix = metrics.leftPreViewMatrix;
                    this._rigCameras[0].getProjectionMatrix = this._rigCameras[0]._getVRProjectionMatrix;

                    this._rigCameras[1]._cameraRigParams.vrMetrics = metrics;
                    this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
                    this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
                    this._rigCameras[1]._cameraRigParams.vrHMatrix = metrics.rightHMatrix;
                    this._rigCameras[1]._cameraRigParams.vrPreViewMatrix = metrics.rightPreViewMatrix;
                    this._rigCameras[1].getProjectionMatrix = this._rigCameras[1]._getVRProjectionMatrix;

                    if (metrics.compensateDistortion) {
                        this._rigCameras[0]._rigPostProcess = new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Left", this._rigCameras[0], false, metrics);
                        this._rigCameras[1]._rigPostProcess = new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Right", this._rigCameras[1], true, metrics);
                    }
                    break;
                case Camera.RIG_MODE_WEBVR:
                    if (rigParams.vrDisplay) {
                        //var leftEye = rigParams.vrDisplay.getEyeParameters('left');
                        //var rightEye = rigParams.vrDisplay.getEyeParameters('right');
                        this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
                        this._rigCameras[0].setCameraRigParameter("left", true);
                        this._rigCameras[0].setCameraRigParameter("frameData", rigParams.frameData);
                        //this._rigCameras[0].setCameraRigParameter("vrOffsetMatrix", Matrix.Translation(-leftEye.offset[0], leftEye.offset[1], -leftEye.offset[2]));
                        this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();
                        this._rigCameras[0].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        //this._rigCameras[0]._getViewMatrix = this._getWebVRViewMatrix;
                        this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
                        this._rigCameras[1].setCameraRigParameter("frameData", rigParams.frameData);
                        //this._rigCameras[1].setCameraRigParameter("vrOffsetMatrix", Matrix.Translation(-rightEye.offset[0], rightEye.offset[1], -rightEye.offset[2]));
                        this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
                        this._rigCameras[1].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        //this._rigCameras[1]._getViewMatrix = this._getWebVRViewMatrix;
                    }
                    break;

            }

            this._cascadePostProcessesToRigCams();
            this.
                update();
        }

        private _getVRProjectionMatrix(): Matrix {
            Matrix.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix);
            this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix);
            return this._projectionMatrix;
        }

        private _getWebVRProjectionMatrix(): Matrix {
            var projectionArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftProjectionMatrix : this._cameraRigParams["frameData"].rightProjectionMatrix;
            //babylon compatible matrix
            [8, 9, 10, 11].forEach(function (num) {
                projectionArray[num] *= -1;
            });
            Matrix.FromArrayToRef(projectionArray, 0, this._projectionMatrix);
            return this._projectionMatrix;
        }

        //Can be used, but we'll use the free camera's view matrix calculation
        private _getWebVRViewMatrix(): Matrix {
            var projectionArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftViewMatrix : this._cameraRigParams["frameData"].rightViewMatrix;
            //babylon compatible matrix
            [8, 9, 10, 11].forEach(function (num) {
                projectionArray[num] *= -1;
            });
            Matrix.FromArrayToRef(projectionArray, 0, this._webvrViewMatrix);
            return this._webvrViewMatrix;
        }

        public setCameraRigParameter(name: string, value: any) {
            if (!this._cameraRigParams) {
                this._cameraRigParams = {};
            }
            this._cameraRigParams[name] = value;
            //provisionnally:
            if (name === "interaxialDistance") {
                this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(value / 0.0637);
            }
        }

        /**
         * needs to be overridden by children so sub has required properties to be copied
         */
        public createRigCamera(name: string, cameraIndex: number): Camera {
            return null;
        }

        /**
         * May need to be overridden by children
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

        public _setupInputs() {
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);

            // Type
            serializationObject.type = this.getTypeName();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            if (this.inputs) {
                this.inputs.serialize(serializationObject);
            }
            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();

            return serializationObject;
        }

        public getTypeName(): string {
            return "Camera";
        }

        public clone(name: string): Camera {
            return SerializationHelper.Clone(Camera.GetConstructorFromName(this.getTypeName(), name, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
        }

        static GetConstructorFromName(type: string, name: string, scene: Scene, interaxial_distance: number = 0, isStereoscopicSideBySide: boolean = true): () => Camera {
            switch (type) {
                case "ArcRotateCamera":
                    return () => new ArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
                case "DeviceOrientationCamera":
                    return () => new DeviceOrientationCamera(name, Vector3.Zero(), scene);
                case "FollowCamera":
                    return () => new FollowCamera(name, Vector3.Zero(), scene);
                case "ArcFollowCamera":
                    return () => new ArcFollowCamera(name, 0, 0, 1.0, null, scene);
                case "GamepadCamera":
                    return () => new GamepadCamera(name, Vector3.Zero(), scene);
                case "TouchCamera":
                    return () => new TouchCamera(name, Vector3.Zero(), scene);
                case "VirtualJoysticksCamera":
                    return () => new VirtualJoysticksCamera(name, Vector3.Zero(), scene);
                case "WebVRFreeCamera":
                    return () => new WebVRFreeCamera(name, Vector3.Zero(), scene);
                case "VRDeviceOrientationFreeCamera":
                    return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
                case "AnaglyphArcRotateCamera":
                    return () => new AnaglyphArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), interaxial_distance, scene);
                case "AnaglyphFreeCamera":
                    return () => new AnaglyphFreeCamera(name, Vector3.Zero(), interaxial_distance, scene);
                case "AnaglyphGamepadCamera":
                    return () => new AnaglyphGamepadCamera(name, Vector3.Zero(), interaxial_distance, scene);
                case "AnaglyphUniversalCamera":
                    return () => new AnaglyphUniversalCamera(name, Vector3.Zero(), interaxial_distance, scene);
                case "StereoscopicArcRotateCamera":
                    return () => new StereoscopicArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene);
                case "StereoscopicFreeCamera":
                    return () => new StereoscopicFreeCamera(name, Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene);
                case "StereoscopicGamepadCamera":
                    return () => new StereoscopicGamepadCamera(name, Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene);
                case "StereoscopicUniversalCamera":
                    return () => new StereoscopicUniversalCamera(name, Vector3.Zero(), interaxial_distance, isStereoscopicSideBySide, scene);
                case "FreeCamera": // Forcing Universal here
                    return () => new UniversalCamera(name, Vector3.Zero(), scene);
                default: // Universal Camera is the default value
                    return () => new UniversalCamera(name, Vector3.Zero(), scene);
            }
        }

        public static Parse(parsedCamera: any, scene: Scene): Camera {
            var type = parsedCamera.type;
            var construct = Camera.GetConstructorFromName(type, parsedCamera.name, scene, parsedCamera.interaxial_distance, parsedCamera.isStereoscopicSideBySide);

            var camera = SerializationHelper.Parse(construct, parsedCamera, scene);

            // Parent
            if (parsedCamera.parentId) {
                camera._waitingParentId = parsedCamera.parentId;
            }

            //If camera has an input manager, let it parse inputs settings
            if (camera.inputs) {
                camera.inputs.parse(parsedCamera);

                camera._setupInputs();
            }

            // Target
            if (parsedCamera.target) {
                if ((<any>camera).setTarget) {
                    (<any>camera).setTarget(Vector3.FromArray(parsedCamera.target));
                }
            }

            // Apply 3d rig, when found
            if (parsedCamera.cameraRigMode) {
                var rigParams = (parsedCamera.interaxial_distance) ? { interaxialDistance: parsedCamera.interaxial_distance } : {};
                camera.setCameraRigMode(parsedCamera.cameraRigMode, rigParams);
            }

            // Animations
            if (parsedCamera.animations) {
                for (var animationIndex = 0; animationIndex < parsedCamera.animations.length; animationIndex++) {
                    var parsedAnimation = parsedCamera.animations[animationIndex];

                    camera.animations.push(Animation.Parse(parsedAnimation));
                }
                Node.ParseAnimationRanges(camera, parsedCamera, scene);
            }

            if (parsedCamera.autoAnimate) {
                scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, parsedCamera.autoAnimateSpeed || 1.0);
            }

            return camera;
        }
    }
}
