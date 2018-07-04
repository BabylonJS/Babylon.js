﻿module BABYLON {
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

        /**
         * This is the default FOV mode for perspective cameras.
         * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
         *
         */
        public static get FOVMODE_VERTICAL_FIXED(): number {
            return Camera._FOVMODE_VERTICAL_FIXED;
        }

        /**
         * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
         *
         */
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

        public static UseAlternateWebVRRendering = false;

        // Members
        @serializeAsVector3()
        public position: Vector3;

        /**
         * The vector the camera should consider as up.
         * (default is Vector3(0, 1, 0) aka Vector3.Up())
         */
        @serializeAsVector3()
        public upVector = Vector3.Up();

        @serialize()
        public orthoLeft: Nullable<number> = null;

        @serialize()
        public orthoRight: Nullable<number> = null;

        @serialize()
        public orthoBottom: Nullable<number> = null;

        @serialize()
        public orthoTop: Nullable<number> = null;

        /**
         * FOV is set in Radians. (default is 0.8)
         */
        @serialize()
        public fov = 0.8;

        @serialize()
        public minZ = 1;

        @serialize()
        public maxZ = 10000.0;

        @serialize()
        public inertia = 0.9;

        @serialize()
        public mode = Camera.PERSPECTIVE_CAMERA;
        public isIntermediate = false;

        public viewport = new Viewport(0, 0, 1.0, 1.0);

        /**
         * Restricts the camera to viewing objects with the same layerMask.
         * A camera with a layerMask of 1 will render mesh.layerMask & camera.layerMask!== 0
         */
        @serialize()
        public layerMask: number = 0x0FFFFFFF;

        /**
         * fovMode sets the camera frustum bounds to the viewport bounds. (default is FOVMODE_VERTICAL_FIXED)
         */
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
        public _rigPostProcess: Nullable<PostProcess>;
        protected _webvrViewMatrix = Matrix.Identity();
        public _skipRendering = false;
        public _alternateCamera: Camera;

        public customRenderTargets = new Array<RenderTargetTexture>();

        // Observables
        public onViewMatrixChangedObservable = new Observable<Camera>();
        public onProjectionMatrixChangedObservable = new Observable<Camera>();
        public onAfterCheckInputsObservable = new Observable<Camera>();
        public onRestoreStateObservable = new Observable<Camera>();

        // Cache
        private _computedViewMatrix = Matrix.Identity();
        public _projectionMatrix = new Matrix();
        private _doNotComputeProjectionMatrix = false;
        private _worldMatrix = Matrix.Identity();
        public _postProcesses = new Array<Nullable<PostProcess>>();
        private _transformMatrix = Matrix.Zero();

        public _activeMeshes = new SmartArray<AbstractMesh>(256);

        protected _globalPosition = Vector3.Zero();
        private _frustumPlanes: Plane[];
        private _refreshFrustumPlanes = true;

        constructor(name: string, position: Vector3, scene: Scene, setActiveOnSceneIfNoneActive = true) {
            super(name, scene);

            this.getScene().addCamera(this);

            if (setActiveOnSceneIfNoneActive && !this.getScene().activeCamera) {
                this.getScene().activeCamera = this;
            }

            this.position = position;
        }

        private _storedFov: number;
        private _stateStored: boolean;

        /**
         * Store current camera state (fov, position, etc..)
         */
        public storeState(): Camera {
            this._stateStored = true;
            this._storedFov = this.fov;

            return this;
        }

        /**
         * Restores the camera state values if it has been stored. You must call storeState() first
         */
        protected _restoreStateValues(): boolean {
            if (!this._stateStored) {
                return false;
            }

            this.fov = this._storedFov;

            return true;
        }

        /**
         * Restored camera state. You must call storeState() first
         */
        public restoreState(): boolean {
            if (this._restoreStateValues()) {
                this.onRestoreStateObservable.notifyObservers(this);
                return true;
            }

            return false;
        }

        public getClassName(): string {
            return "Camera";
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name;
            ret += ", type: " + this.getClassName();
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

        public getActiveMeshes(): SmartArray<AbstractMesh> {
            return this._activeMeshes;
        }

        public isActiveMesh(mesh: Mesh): boolean {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        }

        /**
         * Is this camera ready to be used/rendered
         * @param completeCheck defines if a complete check (including post processes) has to be done (false by default)
         * @return true if the camera is ready
         */
        public isReady(completeCheck = false): boolean {
            if (completeCheck) {
                for (var pp of this._postProcesses) {
                    if (pp && !pp.isReady()) {
                        return false;
                    }
                }
            }
            return super.isReady(completeCheck);
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

            this._cache.position.copyFrom(this.position);
            this._cache.upVector.copyFrom(this.upVector);
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
            this._checkInputs();
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._updateRigCameras();
            }
        }

        public _checkInputs(): void {
            this.onAfterCheckInputsObservable.notifyObservers(this);
        }

        public get rigCameras(): Camera[] {
            return this._rigCameras;
        }

        public get rigPostProcess(): Nullable<PostProcess> {
            return this._rigPostProcess;
        }

        /**
         * Internal, gets the first post proces.
         * @returns the first post process to be run on this camera.
         */
        public _getFirstPostProcess():Nullable<PostProcess>{
            for(var ppIndex = 0; ppIndex < this._postProcesses.length; ppIndex++){
                if(this._postProcesses[ppIndex] !== null){
                    return this._postProcesses[ppIndex];
                }
            }
            return null;
        }

        private _cascadePostProcessesToRigCams(): void {
            // invalidate framebuffer
            var firstPostProcess = this._getFirstPostProcess();
            if (firstPostProcess) {
                firstPostProcess.markTextureDirty();
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

        public attachPostProcess(postProcess: PostProcess, insertAt: Nullable<number> = null): number {
            if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
                Tools.Error("You're trying to reuse a post process not defined as reusable.");
                return 0;
            }

            if (insertAt == null || insertAt < 0) {
                this._postProcesses.push(postProcess);
            } else if(this._postProcesses[insertAt] === null) {
                this._postProcesses[insertAt] = postProcess;
            }else{
                this._postProcesses.splice(insertAt, 0, postProcess);
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
            return this._postProcesses.indexOf(postProcess);
        }

        public detachPostProcess(postProcess: PostProcess): void {
            var idx = this._postProcesses.indexOf(postProcess);
            if (idx !== -1) {
                this._postProcesses[idx] = null;
            }
            this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
        }

        public getWorldMatrix(): Matrix {
            if (this._isSynchronizedViewMatrix()) {
                return this._worldMatrix;
            }

            // Getting the the view matrix will also compute the world matrix.
            this.getViewMatrix();

            return this._worldMatrix;
        }

        public _getViewMatrix(): Matrix {
            return Matrix.Identity();
        }

        public getViewMatrix(force?: boolean): Matrix {
            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }

            this.updateCache();
            this._computedViewMatrix = this._getViewMatrix();
            this._currentRenderId = this.getScene().getRenderId();
            this._childRenderId = this._currentRenderId;

            this._refreshFrustumPlanes = true;

            if (this._cameraRigParams && this._cameraRigParams.vrPreViewMatrix) {
                this._computedViewMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._computedViewMatrix);
            }

            this.onViewMatrixChangedObservable.notifyObservers(this);

            this._computedViewMatrix.invertToRef(this._worldMatrix);

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

            // Cache
            this._cache.mode = this.mode;
            this._cache.minZ = this.minZ;
            this._cache.maxZ = this.maxZ;

            // Matrix
            this._refreshFrustumPlanes = true;

            var engine = this.getEngine();
            var scene = this.getScene();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                this._cache.fov = this.fov;
                this._cache.fovMode = this.fovMode;
                this._cache.aspectRatio = engine.getAspectRatio(this);

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
            } else {
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

                this._cache.orthoLeft = this.orthoLeft;
                this._cache.orthoRight = this.orthoRight;
                this._cache.orthoBottom = this.orthoBottom;
                this._cache.orthoTop = this.orthoTop;
                this._cache.renderWidth = engine.getRenderWidth();
                this._cache.renderHeight = engine.getRenderHeight();
            }

            this.onProjectionMatrixChangedObservable.notifyObservers(this);

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

        public getForwardRay(length = 100, transform?: Matrix, origin?: Vector3): Ray {
            if (!transform) {
                transform = this.getWorldMatrix();
            }

            if (!origin) {
                origin = this.position;
            }
            var forward = new Vector3(0, 0, 1);
            var forwardWorld = Vector3.TransformNormal(forward, transform);

            var direction = Vector3.Normalize(forwardWorld);

            return new Ray(origin, direction, length);
        }

        /**
         * Releases resources associated with this node.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
            // Observables
            this.onViewMatrixChangedObservable.clear();
            this.onProjectionMatrixChangedObservable.clear();
            this.onAfterCheckInputsObservable.clear();
            this.onRestoreStateObservable.clear();

            // Inputs
            if (this.inputs) {
                this.inputs.clear();
            }

            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this.getScene().removeCamera(this);
            while (this._rigCameras.length > 0) {
                let camera = this._rigCameras.pop();
                if (camera) {
                    camera.dispose();
                }
            }

            // Postprocesses
            if (this._rigPostProcess) {
                this._rigPostProcess.dispose(this);
                this._rigPostProcess = null;
                this._postProcesses = [];
            }
            else if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                this._rigPostProcess = null;
                this._postProcesses = [];
            } else {
                var i = this._postProcesses.length;
                while (--i >= 0) {
                    var postProcess = this._postProcesses[i]
                    if(postProcess){
                        postProcess.dispose(this);
                    }
                }
            }

            // Render targets
            var i = this.customRenderTargets.length;
            while (--i >= 0) {
                this.customRenderTargets[i].dispose();
            }
            this.customRenderTargets = [];

            // Active Meshes
            this._activeMeshes.dispose();

            super.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

        // ---- Camera rigs section ----
        public get leftCamera(): Nullable<FreeCamera> {
            if (this._rigCameras.length < 1) {
                return null;
            }
            return (<FreeCamera>this._rigCameras[0]);
        }

        public get rightCamera(): Nullable<FreeCamera> {
            if (this._rigCameras.length < 2) {
                return null;
            }
            return (<FreeCamera>this._rigCameras[1]);
        }

        public getLeftTarget(): Nullable<Vector3> {
            if (this._rigCameras.length < 1) {
                return null;
            }
            return (<TargetCamera>this._rigCameras[0]).getTarget();
        }

        public getRightTarget(): Nullable<Vector3> {
            if (this._rigCameras.length < 2) {
                return null;
            }
            return (<TargetCamera>this._rigCameras[1]).getTarget();
        }

        public setCameraRigMode(mode: number, rigParams: any): void {
            if (this.cameraRigMode === mode) {
                return;
            }

            while (this._rigCameras.length > 0) {
                let camera = this._rigCameras.pop();

                if (camera) {
                    camera.dispose();
                }
            }
            this.cameraRigMode = mode;
            this._cameraRigParams = {};
            //we have to implement stereo camera calcultating left and right viewpoints from interaxialDistance and target,
            //not from a given angle as it is now, but until that complete code rewriting provisional stereoHalfAngle value is introduced
            this._cameraRigParams.interaxialDistance = rigParams.interaxialDistance || 0.0637;
            this._cameraRigParams.stereoHalfAngle = Tools.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637);

            // create the rig cameras, unless none
            if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
                let leftCamera = this.createRigCamera(this.name + "_L", 0);
                let rightCamera = this.createRigCamera(this.name + "_R", 1);
                if (leftCamera && rightCamera) {
                    this._rigCameras.push(leftCamera);
                    this._rigCameras.push(rightCamera);
                }
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
                        var leftEye = rigParams.vrDisplay.getEyeParameters('left');
                        var rightEye = rigParams.vrDisplay.getEyeParameters('right');

                        //Left eye
                        this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
                        this._rigCameras[0].setCameraRigParameter("left", true);
                        //leaving this for future reference
                        this._rigCameras[0].setCameraRigParameter("specs", rigParams.specs);
                        this._rigCameras[0].setCameraRigParameter("eyeParameters", leftEye);
                        this._rigCameras[0].setCameraRigParameter("frameData", rigParams.frameData);
                        this._rigCameras[0].setCameraRigParameter("parentCamera", rigParams.parentCamera);
                        this._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();
                        this._rigCameras[0].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        this._rigCameras[0].parent = this;
                        this._rigCameras[0]._getViewMatrix = this._getWebVRViewMatrix;

                        //Right eye
                        this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
                        this._rigCameras[1].setCameraRigParameter('eyeParameters', rightEye);
                        this._rigCameras[1].setCameraRigParameter("specs", rigParams.specs);
                        this._rigCameras[1].setCameraRigParameter("frameData", rigParams.frameData);
                        this._rigCameras[1].setCameraRigParameter("parentCamera", rigParams.parentCamera);
                        this._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
                        this._rigCameras[1].getProjectionMatrix = this._getWebVRProjectionMatrix;
                        this._rigCameras[1].parent = this;
                        this._rigCameras[1]._getViewMatrix = this._getWebVRViewMatrix;

                        if (Camera.UseAlternateWebVRRendering) {
                            this._rigCameras[1]._skipRendering = true;
                            this._rigCameras[0]._alternateCamera = this._rigCameras[1];
                        }
                    }
                    break;

            }

            this._cascadePostProcessesToRigCams();
            this.update();
        }

        private _getVRProjectionMatrix(): Matrix {
            Matrix.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix);
            this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix);
            return this._projectionMatrix;
        }

        protected _updateCameraRotationMatrix() {
            //Here for WebVR
        }

        protected _updateWebVRCameraRotationMatrix() {
            //Here for WebVR
        }

        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRProjectionMatrix(): Matrix {
            return Matrix.Identity();
        }

        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRViewMatrix(): Matrix {
            return Matrix.Identity();
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
        public createRigCamera(name: string, cameraIndex: number): Nullable<Camera> {
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
            serializationObject.type = this.getClassName();

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

        public clone(name: string): Camera {
            return SerializationHelper.Clone(Camera.GetConstructorFromName(this.getClassName(), name, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
        }

        public getDirection(localAxis: Vector3): Vector3 {
            var result = Vector3.Zero();

            this.getDirectionToRef(localAxis, result);

            return result;
        }

        public getDirectionToRef(localAxis: Vector3, result: Vector3): void {
            Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
        }

        static GetConstructorFromName(type: string, name: string, scene: Scene, interaxial_distance: number = 0, isStereoscopicSideBySide: boolean = true): () => Camera {
            let constructorFunc = Node.Construct(type, name, scene, {
                interaxial_distance: interaxial_distance,
                isStereoscopicSideBySide: isStereoscopicSideBySide
            });

            if (constructorFunc) {
                return <() => Camera>constructorFunc;
            }

            // Default to universal camera
            return () => new UniversalCamera(name, Vector3.Zero(), scene);
        }

        public computeWorldMatrix(): Matrix {
            return this.getWorldMatrix();
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

            if ((<any>camera).setPosition) { // need to force position
                camera.position.copyFromFloats(0, 0, 0);
                (<any>camera).setPosition(Vector3.FromArray(parsedCamera.position));
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
