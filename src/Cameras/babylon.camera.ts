module BABYLON {
    export class Camera extends Node {
        public inputs : CameraInputsManager<Camera>;
        
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

        public static ForceAttachControlToAlwaysPreventDefault = false;
        
        // Members
        @serializeAsVector3()
        public position: Vector3;

        @serialize()
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


        // Cache
        private _computedViewMatrix = Matrix.Identity();
        public _projectionMatrix = new Matrix();
        private _worldMatrix: Matrix;
        public _postProcesses = new Array<PostProcess>();
        public _postProcessesTakenIndices = [];

        public _activeMeshes = new SmartArray<Mesh>(256);

        private _globalPosition = Vector3.Zero();

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
        public toString(fullDetails? : boolean) : string {
            var ret = "Name: " + this.name;
            ret += ", type: " + this.getTypeName();
            if (this.animations){
                for (var i = 0; i < this.animations.length; i++){
                   ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails){
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
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
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

                Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix, this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
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

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);

            // Type
            serializationObject.type = this.getTypeName();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }
            
            if (this.inputs){
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
            if (camera.inputs){
                camera.inputs.parse(parsedCamera);
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


