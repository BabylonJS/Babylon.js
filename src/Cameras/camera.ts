import { serialize, SerializationHelper, serializeAsVector3 } from "../Misc/decorators";
import { SmartArray } from "../Misc/smartArray";
import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { CameraInputsManager } from "./cameraInputsManager";
import { Scene } from "../scene";
import { Matrix, Vector3, Quaternion } from "../Maths/math.vector";
import { Node } from "../node";
import { Mesh } from "../Meshes/mesh";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { ICullable } from "../Culling/boundingInfo";
import { Logger } from "../Misc/logger";
import { _TypeStore } from '../Misc/typeStore';
import { _DevTools } from '../Misc/devTools';
import { Viewport } from '../Maths/math.viewport';
import { Frustum } from '../Maths/math.frustum';
import { Plane } from '../Maths/math.plane';

declare type PostProcess = import("../PostProcesses/postProcess").PostProcess;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type FreeCamera = import("./freeCamera").FreeCamera;
declare type TargetCamera = import("./targetCamera").TargetCamera;
declare type Ray = import("../Culling/ray").Ray;

/**
 * This is the base class of all the camera used in the application.
 * @see https://doc.babylonjs.com/features/cameras
 */
export class Camera extends Node {
    /** @hidden */
    public static _createDefaultParsedCamera = (name: string, scene: Scene): Camera => {
        throw _DevTools.WarnImport("UniversalCamera");
    }

    /**
     * This is the default projection mode used by the cameras.
     * It helps recreating a feeling of perspective and better appreciate depth.
     * This is the best way to simulate real life cameras.
     */
    public static readonly PERSPECTIVE_CAMERA = 0;
    /**
     * This helps creating camera with an orthographic mode.
     * Orthographic is commonly used in engineering as a means to produce object specifications that communicate dimensions unambiguously, each line of 1 unit length (cm, meter..whatever) will appear to have the same length everywhere on the drawing. This allows the drafter to dimension only a subset of lines and let the reader know that other lines of that length on the drawing are also that length in reality. Every parallel line in the drawing is also parallel in the object.
     */
    public static readonly ORTHOGRAPHIC_CAMERA = 1;

    /**
     * This is the default FOV mode for perspective cameras.
     * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
     */
    public static readonly FOVMODE_VERTICAL_FIXED = 0;
    /**
     * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
     */
    public static readonly FOVMODE_HORIZONTAL_FIXED = 1;

    /**
     * This specifies ther is no need for a camera rig.
     * Basically only one eye is rendered corresponding to the camera.
     */
    public static readonly RIG_MODE_NONE = 0;
    /**
     * Simulates a camera Rig with one blue eye and one red eye.
     * This can be use with 3d blue and red glasses.
     */
    public static readonly RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
    /**
     * Defines that both eyes of the camera will be rendered side by side with a parallel target.
     */
    public static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
    /**
     * Defines that both eyes of the camera will be rendered side by side with a none parallel target.
     */
    public static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
    /**
     * Defines that both eyes of the camera will be rendered over under each other.
     */
    public static readonly RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
    /**
     * Defines that both eyes of the camera will be rendered on successive lines interlaced for passive 3d monitors.
     */
    public static readonly RIG_MODE_STEREOSCOPIC_INTERLACED = 14;
    /**
     * Defines that both eyes of the camera should be renderered in a VR mode (carbox).
     */
    public static readonly RIG_MODE_VR = 20;
    /**
     * Defines that both eyes of the camera should be renderered in a VR mode (webVR).
     */
    public static readonly RIG_MODE_WEBVR = 21;
    /**
     * Custom rig mode allowing rig cameras to be populated manually with any number of cameras
     */
    public static readonly RIG_MODE_CUSTOM = 22;

    /**
     * Defines if by default attaching controls should prevent the default javascript event to continue.
     */
    public static ForceAttachControlToAlwaysPreventDefault = false;

    /**
     * Define the input manager associated with the camera.
     */
    public inputs: CameraInputsManager<Camera>;

    /** @hidden */
    @serializeAsVector3("position")
    public _position = Vector3.Zero();

    /**
     * Define the current local position of the camera in the scene
     */
    public get position(): Vector3 {
        return this._position;
    }

    public set position(newPosition: Vector3) {
        this._position = newPosition;
    }

    /**
     * The vector the camera should consider as up.
     * (default is Vector3(0, 1, 0) aka Vector3.Up())
     */
    @serializeAsVector3()
    public upVector = Vector3.Up();

    /**
     * Define the current limit on the left side for an orthographic camera
     * In scene unit
     */
    @serialize()
    public orthoLeft: Nullable<number> = null;

    /**
     * Define the current limit on the right side for an orthographic camera
     * In scene unit
     */
    @serialize()
    public orthoRight: Nullable<number> = null;

    /**
     * Define the current limit on the bottom side for an orthographic camera
     * In scene unit
     */
    @serialize()
    public orthoBottom: Nullable<number> = null;

    /**
     * Define the current limit on the top side for an orthographic camera
     * In scene unit
     */
    @serialize()
    public orthoTop: Nullable<number> = null;

    /**
     * Field Of View is set in Radians. (default is 0.8)
     */
    @serialize()
    public fov = 0.8;

    /**
     * Define the minimum distance the camera can see from.
     * This is important to note that the depth buffer are not infinite and the closer it starts
     * the more your scene might encounter depth fighting issue.
     */
    @serialize()
    public minZ = 1;

    /**
     * Define the maximum distance the camera can see to.
     * This is important to note that the depth buffer are not infinite and the further it end
     * the more your scene might encounter depth fighting issue.
     */
    @serialize()
    public maxZ = 10000.0;

    /**
     * Define the default inertia of the camera.
     * This helps giving a smooth feeling to the camera movement.
     */
    @serialize()
    public inertia = 0.9;

    /**
     * Define the mode of the camera (Camera.PERSPECTIVE_CAMERA or Camera.ORTHOGRAPHIC_CAMERA)
     */
    @serialize()
    public mode = Camera.PERSPECTIVE_CAMERA;

    /**
     * Define whether the camera is intermediate.
     * This is useful to not present the output directly to the screen in case of rig without post process for instance
     */
    public isIntermediate = false;

    /**
     * Define the viewport of the camera.
     * This correspond to the portion of the screen the camera will render to in normalized 0 to 1 unit.
     */
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

    /**
     * Rig mode of the camera.
     * This is useful to create the camera with two "eyes" instead of one to create VR or stereoscopic scenes.
     * This is normally controlled byt the camera themselves as internal use.
     */
    @serialize()
    public cameraRigMode = Camera.RIG_MODE_NONE;

    /**
     * Defines the distance between both "eyes" in case of a RIG
     */
    @serialize()
    public interaxialDistance: number;

    /**
     * Defines if stereoscopic rendering is done side by side or over under.
     */
    @serialize()
    public isStereoscopicSideBySide: boolean;

    /**
     * Defines the list of custom render target which are rendered to and then used as the input to this camera's render. Eg. display another camera view on a TV in the main scene
     * This is pretty helpfull if you wish to make a camera render to a texture you could reuse somewhere
     * else in the scene. (Eg. security camera)
     *
     * To change the final output target of the camera, camera.outputRenderTarget should be used instead (eg. webXR renders to a render target corrisponding to an HMD)
     */
    public customRenderTargets = new Array<RenderTargetTexture>();
    /**
     * When set, the camera will render to this render target instead of the default canvas
     *
     * If the desire is to use the output of a camera as a texture in the scene consider using camera.customRenderTargets instead
     */
    public outputRenderTarget: Nullable<RenderTargetTexture> = null;

    /**
     * Observable triggered when the camera view matrix has changed.
     */
    public onViewMatrixChangedObservable = new Observable<Camera>();
    /**
     * Observable triggered when the camera Projection matrix has changed.
     */
    public onProjectionMatrixChangedObservable = new Observable<Camera>();
    /**
     * Observable triggered when the inputs have been processed.
     */
    public onAfterCheckInputsObservable = new Observable<Camera>();
    /**
     * Observable triggered when reset has been called and applied to the camera.
     */
    public onRestoreStateObservable = new Observable<Camera>();

    /**
     * Is this camera a part of a rig system?
     */
    public isRigCamera: boolean = false;

    /**
     * If isRigCamera set to true this will be set with the parent camera.
     * The parent camera is not (!) necessarily the .parent of this camera (like in the case of XR)
     */
    public rigParent?: Camera;

    /** @hidden */
    public _cameraRigParams: any;
    /** @hidden */
    public _rigCameras = new Array<Camera>();
    /** @hidden */
    public _rigPostProcess: Nullable<PostProcess>;

    protected _webvrViewMatrix = Matrix.Identity();
    /** @hidden */
    public _skipRendering = false;

    /** @hidden */
    public _projectionMatrix = new Matrix();

    /** @hidden */
    public _postProcesses = new Array<Nullable<PostProcess>>();

    /** @hidden */
    public _activeMeshes = new SmartArray<AbstractMesh>(256);

    protected _globalPosition = Vector3.Zero();

    /** @hidden */
    public _computedViewMatrix = Matrix.Identity();
    private _doNotComputeProjectionMatrix = false;
    private _transformMatrix = Matrix.Zero();
    private _frustumPlanes: Plane[];
    private _refreshFrustumPlanes = true;
    private _storedFov: number;
    private _stateStored: boolean;

    /**
     * Instantiates a new camera object.
     * This should not be used directly but through the inherited cameras: ArcRotate, Free...
     * @see https://doc.babylonjs.com/features/cameras
     * @param name Defines the name of the camera in the scene
     * @param position Defines the position of the camera
     * @param scene Defines the scene the camera belongs too
     * @param setActiveOnSceneIfNoneActive Defines if the camera should be set as active after creation if no other camera have been defined in the scene
     */
    constructor(name: string, position: Vector3, scene: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, scene);

        this.getScene().addCamera(this);

        if (setActiveOnSceneIfNoneActive && !this.getScene().activeCamera) {
            this.getScene().activeCamera = this;
        }

        this.position = position;
    }

    /**
     * Store current camera state (fov, position, etc..)
     * @returns the camera
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
     * Restored camera state. You must call storeState() first.
     * @returns true if restored and false otherwise
     */
    public restoreState(): boolean {
        if (this._restoreStateValues()) {
            this.onRestoreStateObservable.notifyObservers(this);
            return true;
        }

        return false;
    }

    /**
     * Gets the class name of the camera.
     * @returns the class name
     */
    public getClassName(): string {
        return "Camera";
    }

    /** @hidden */
    public readonly _isCamera = true;

    /**
     * Gets a string representation of the camera useful for debug purpose.
     * @param fullDetails Defines that a more verboe level of logging is required
     * @returns the string representation
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

    /**
     * Gets the current world space position of the camera.
     */
    public get globalPosition(): Vector3 {
        return this._globalPosition;
    }

    /**
     * Gets the list of active meshes this frame (meshes no culled or excluded by lod s in the frame)
     * @returns the active meshe list
     */
    public getActiveMeshes(): SmartArray<AbstractMesh> {
        return this._activeMeshes;
    }

    /**
     * Check whether a mesh is part of the current active mesh list of the camera
     * @param mesh Defines the mesh to check
     * @returns true if active, false otherwise
     */
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

    /** @hidden */
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

    /** @hidden */
    public _updateCache(ignoreParentClass?: boolean): void {
        if (!ignoreParentClass) {
            super._updateCache();
        }

        this._cache.position.copyFrom(this.position);
        this._cache.upVector.copyFrom(this.upVector);
    }

    /** @hidden */
    public _isSynchronized(): boolean {
        return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
    }

    /** @hidden */
    public _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronized()) {
            return false;
        }

        return this._cache.position.equals(this.position)
            && this._cache.upVector.equals(this.upVector)
            && this.isSynchronizedWithParent();
    }

    /** @hidden */
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

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: HTMLElement): void {
    }

    /**
     * Update the camera state according to the different inputs gathered during the frame.
     */
    public update(): void {
        this._checkInputs();
        if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
            this._updateRigCameras();
        }
    }

    /** @hidden */
    public _checkInputs(): void {
        this.onAfterCheckInputsObservable.notifyObservers(this);
    }

    /** @hidden */
    public get rigCameras(): Camera[] {
        return this._rigCameras;
    }

    /**
     * Gets the post process used by the rig cameras
     */
    public get rigPostProcess(): Nullable<PostProcess> {
        return this._rigPostProcess;
    }

    /**
     * Internal, gets the first post proces.
     * @returns the first post process to be run on this camera.
     */
    public _getFirstPostProcess(): Nullable<PostProcess> {
        for (var ppIndex = 0; ppIndex < this._postProcesses.length; ppIndex++) {
            if (this._postProcesses[ppIndex] !== null) {
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
                var isPass = rigPostProcess.getEffectName() === "pass";
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

    /**
     * Attach a post process to the camera.
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#attach-postprocess
     * @param postProcess The post process to attach to the camera
     * @param insertAt The position of the post process in case several of them are in use in the scene
     * @returns the position the post process has been inserted at
     */
    public attachPostProcess(postProcess: PostProcess, insertAt: Nullable<number> = null): number {
        if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
            Logger.Error("You're trying to reuse a post process not defined as reusable.");
            return 0;
        }

        if (insertAt == null || insertAt < 0) {
            this._postProcesses.push(postProcess);
        } else if (this._postProcesses[insertAt] === null) {
            this._postProcesses[insertAt] = postProcess;
        } else {
            this._postProcesses.splice(insertAt, 0, postProcess);
        }
        this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
        return this._postProcesses.indexOf(postProcess);
    }

    /**
     * Detach a post process to the camera.
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#attach-postprocess
     * @param postProcess The post process to detach from the camera
     */
    public detachPostProcess(postProcess: PostProcess): void {
        var idx = this._postProcesses.indexOf(postProcess);
        if (idx !== -1) {
            this._postProcesses[idx] = null;
        }
        this._cascadePostProcessesToRigCams(); // also ensures framebuffer invalidated
    }

    /**
     * Gets the current world matrix of the camera
     */
    public getWorldMatrix(): Matrix {
        if (this._isSynchronizedViewMatrix()) {
            return this._worldMatrix;
        }

        // Getting the the view matrix will also compute the world matrix.
        this.getViewMatrix();

        return this._worldMatrix;
    }

    /** @hidden */
    public _getViewMatrix(): Matrix {
        return Matrix.Identity();
    }

    /**
     * Gets the current view matrix of the camera.
     * @param force forces the camera to recompute the matrix without looking at the cached state
     * @returns the view matrix
     */
    public getViewMatrix(force?: boolean): Matrix {
        if (!force && this._isSynchronizedViewMatrix()) {
            return this._computedViewMatrix;
        }

        this.updateCache();
        this._computedViewMatrix = this._getViewMatrix();
        this._currentRenderId = this.getScene().getRenderId();
        this._childUpdateId++;

        this._refreshFrustumPlanes = true;

        if (this._cameraRigParams && this._cameraRigParams.vrPreViewMatrix) {
            this._computedViewMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._computedViewMatrix);
        }

        // Notify parent camera if rig camera is changed
        if (this.parent && (this.parent as Camera).onViewMatrixChangedObservable) {
            (this.parent as Camera).onViewMatrixChangedObservable.notifyObservers((this.parent as Camera));
        }

        this.onViewMatrixChangedObservable.notifyObservers(this);

        this._computedViewMatrix.invertToRef(this._worldMatrix);

        return this._computedViewMatrix;
    }

    /**
     * Freeze the projection matrix.
     * It will prevent the cache check of the camera projection compute and can speed up perf
     * if no parameter of the camera are meant to change
     * @param projection Defines manually a projection if necessary
     */
    public freezeProjectionMatrix(projection?: Matrix): void {
        this._doNotComputeProjectionMatrix = true;
        if (projection !== undefined) {
            this._projectionMatrix = projection;
        }
    }

    /**
     * Unfreeze the projection matrix if it has previously been freezed by freezeProjectionMatrix.
     */
    public unfreezeProjectionMatrix(): void {
        this._doNotComputeProjectionMatrix = false;
    }

    /**
     * Gets the current projection matrix of the camera.
     * @param force forces the camera to recompute the matrix without looking at the cached state
     * @returns the projection matrix
     */
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

            const reverseDepth = engine.useReverseDepthBuffer;
            let getProjectionMatrix: (fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed: boolean) => void;
            if (scene.useRightHandedSystem) {
                getProjectionMatrix = reverseDepth ? Matrix.PerspectiveFovReverseRHToRef : Matrix.PerspectiveFovRHToRef;
            } else {
                getProjectionMatrix = reverseDepth ? Matrix.PerspectiveFovReverseLHToRef : Matrix.PerspectiveFovLHToRef;
            }

            getProjectionMatrix(this.fov,
                engine.getAspectRatio(this),
                this.minZ,
                this.maxZ,
                this._projectionMatrix,
                this.fovMode === Camera.FOVMODE_VERTICAL_FIXED);
        } else {
            var halfWidth = engine.getRenderWidth() / 2.0;
            var halfHeight = engine.getRenderHeight() / 2.0;
            if (scene.useRightHandedSystem) {
                Matrix.OrthoOffCenterRHToRef(this.orthoLeft ?? -halfWidth,
                    this.orthoRight ?? halfWidth,
                    this.orthoBottom ?? -halfHeight,
                    this.orthoTop ?? halfHeight,
                    this.minZ,
                    this.maxZ,
                    this._projectionMatrix);
            } else {
                Matrix.OrthoOffCenterLHToRef(this.orthoLeft ?? -halfWidth,
                    this.orthoRight ?? halfWidth,
                    this.orthoBottom ?? -halfHeight,
                    this.orthoTop ?? halfHeight,
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

    /**
     * Gets the transformation matrix (ie. the multiplication of view by projection matrices)
     * @returns a Matrix
     */
    public getTransformationMatrix(): Matrix {
        this._computedViewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        return this._transformMatrix;
    }

    private _updateFrustumPlanes(): void {
        if (!this._refreshFrustumPlanes) {
            return;
        }

        this.getTransformationMatrix();

        if (!this._frustumPlanes) {
            this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
        } else {
            Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
        }

        this._refreshFrustumPlanes = false;
    }

    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * This checks the bounding box center. See isCompletelyInFrustum for a full bounding check
     * @param target The object to check
     * @param checkRigCameras If the rig cameras should be checked (eg. with webVR camera both eyes should be checked) (Default: false)
     * @returns true if the object is in frustum otherwise false
     */
    public isInFrustum(target: ICullable, checkRigCameras = false): boolean {
        this._updateFrustumPlanes();

        if (checkRigCameras && this.rigCameras.length > 0) {
            var result = false;
            this.rigCameras.forEach((cam) => {
                cam._updateFrustumPlanes();
                result = result || target.isInFrustum(cam._frustumPlanes);
            });
            return result;
        } else {
            return target.isInFrustum(this._frustumPlanes);
        }
    }

    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * Unlike isInFrustum this cheks the full bounding box
     * @param target The object to check
     * @returns true if the object is in frustum otherwise false
     */
    public isCompletelyInFrustum(target: ICullable): boolean {
        this._updateFrustumPlanes();

        return target.isCompletelyInFrustum(this._frustumPlanes);
    }

    /**
     * Gets a ray in the forward direction from the camera.
     * @param length Defines the length of the ray to create
     * @param transform Defines the transform to apply to the ray, by default the world matrx is used to create a workd space ray
     * @param origin Defines the start point of the ray which defaults to the camera position
     * @returns the forward ray
     */
    public getForwardRay(length = 100, transform?: Matrix, origin?: Vector3): Ray {
        throw _DevTools.WarnImport("Ray");
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
                var postProcess = this._postProcesses[i];
                if (postProcess) {
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

    /** @hidden */
    public _isLeftCamera = false;
    /**
     * Gets the left camera of a rig setup in case of Rigged Camera
     */
    public get isLeftCamera(): boolean {
        return this._isLeftCamera;
    }

    /** @hidden */
    public _isRightCamera = false;
    /**
     * Gets the right camera of a rig setup in case of Rigged Camera
     */
    public get isRightCamera(): boolean {
        return this._isRightCamera;
    }

    /**
     * Gets the left camera of a rig setup in case of Rigged Camera
     */
    public get leftCamera(): Nullable<FreeCamera> {
        if (this._rigCameras.length < 1) {
            return null;
        }
        return (<FreeCamera>this._rigCameras[0]);
    }

    /**
     * Gets the right camera of a rig setup in case of Rigged Camera
     */
    public get rightCamera(): Nullable<FreeCamera> {
        if (this._rigCameras.length < 2) {
            return null;
        }
        return (<FreeCamera>this._rigCameras[1]);
    }

    /**
     * Gets the left camera target of a rig setup in case of Rigged Camera
     * @returns the target position
     */
    public getLeftTarget(): Nullable<Vector3> {
        if (this._rigCameras.length < 1) {
            return null;
        }
        return (<TargetCamera>this._rigCameras[0]).getTarget();
    }

    /**
     * Gets the right camera target of a rig setup in case of Rigged Camera
     * @returns the target position
     */
    public getRightTarget(): Nullable<Vector3> {
        if (this._rigCameras.length < 2) {
            return null;
        }
        return (<TargetCamera>this._rigCameras[1]).getTarget();
    }

    /**
     * @hidden
     */
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
            if (leftCamera) {
                leftCamera._isLeftCamera = true;
            }
            let rightCamera = this.createRigCamera(this.name + "_R", 1);
            if (rightCamera) {
                rightCamera._isRightCamera = true;
            }
            if (leftCamera && rightCamera) {
                this._rigCameras.push(leftCamera);
                this._rigCameras.push(rightCamera);
            }
        }

        switch (this.cameraRigMode) {
            case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                Camera._setStereoscopicAnaglyphRigMode(this);
                break;
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
            case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
            case Camera.RIG_MODE_STEREOSCOPIC_INTERLACED:
                    Camera._setStereoscopicRigMode(this);
                break;
            case Camera.RIG_MODE_VR:
                Camera._setVRRigMode(this, rigParams);
                break;
            case Camera.RIG_MODE_WEBVR:
                Camera._setWebVRRigMode(this, rigParams);
                break;
        }

        this._cascadePostProcessesToRigCams();
        this.update();
    }

    /** @hidden */
    public static _setStereoscopicRigMode(camera: Camera) {
        throw "Import Cameras/RigModes/stereoscopicRigMode before using stereoscopic rig mode";
    }

    /** @hidden */
    public static _setStereoscopicAnaglyphRigMode(camera: Camera) {
        throw "Import Cameras/RigModes/stereoscopicAnaglyphRigMode before using stereoscopic anaglyph rig mode";
    }

    /** @hidden */
    public static _setVRRigMode(camera: Camera, rigParams: any) {
        throw "Import Cameras/RigModes/vrRigMode before using VR rig mode";
    }

    /** @hidden */
    public static _setWebVRRigMode(camera: Camera, rigParams: any) {
        throw "Import Cameras/RigModes/WebVRRigMode before using Web VR rig mode";
    }

    /** @hidden */
    public _getVRProjectionMatrix(): Matrix {
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
     * @hidden
     */
    public _getWebVRProjectionMatrix(): Matrix {
        return Matrix.Identity();
    }

    /**
     * This function MUST be overwritten by the different WebVR cameras available.
     * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
     * @hidden
     */
    public _getWebVRViewMatrix(): Matrix {
        return Matrix.Identity();
    }

    /** @hidden */
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
     * @hidden
     */
    public createRigCamera(name: string, cameraIndex: number): Nullable<Camera> {
        return null;
    }

    /**
     * May need to be overridden by children
     * @hidden
     */
    public _updateRigCameras() {
        for (var i = 0; i < this._rigCameras.length; i++) {
            this._rigCameras[i].minZ = this.minZ;
            this._rigCameras[i].maxZ = this.maxZ;
            this._rigCameras[i].fov = this.fov;
            this._rigCameras[i].upVector.copyFrom(this.upVector);
        }

        // only update viewport when ANAGLYPH
        if (this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH) {
            this._rigCameras[0].viewport = this._rigCameras[1].viewport = this.viewport;
        }
    }

    /** @hidden */
    public _setupInputs() {
    }

    /**
     * Serialiaze the camera setup to a json represention
     * @returns the JSON representation
     */
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
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        serializationObject.ranges = this.serializeAnimationRanges();

        return serializationObject;
    }

    /**
     * Clones the current camera.
     * @param name The cloned camera name
     * @returns the cloned camera
     */
    public clone(name: string): Camera {
        return SerializationHelper.Clone(Camera.GetConstructorFromName(this.getClassName(), name, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
    }

    /**
     * Gets the direction of the camera relative to a given local axis.
     * @param localAxis Defines the reference axis to provide a relative direction.
     * @return the direction
     */
    public getDirection(localAxis: Vector3): Vector3 {
        var result = Vector3.Zero();

        this.getDirectionToRef(localAxis, result);

        return result;
    }

    /**
     * Returns the current camera absolute rotation
     */
    public get absoluteRotation(): Quaternion {
        var result = Quaternion.Zero();

        this.getWorldMatrix().decompose(undefined, result);

        return result;
    }

    /**
     * Gets the direction of the camera relative to a given local axis into a passed vector.
     * @param localAxis Defines the reference axis to provide a relative direction.
     * @param result Defines the vector to store the result in
     */
    public getDirectionToRef(localAxis: Vector3, result: Vector3): void {
        Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
    }

    /**
     * Gets a camera constructor for a given camera type
     * @param type The type of the camera to construct (should be equal to one of the camera class name)
     * @param name The name of the camera the result will be able to instantiate
     * @param scene The scene the result will construct the camera in
     * @param interaxial_distance In case of stereoscopic setup, the distance between both eyes
     * @param isStereoscopicSideBySide In case of stereoscopic setup, should the sereo be side b side
     * @returns a factory method to construc the camera
     */
    static GetConstructorFromName(type: string, name: string, scene: Scene, interaxial_distance: number = 0, isStereoscopicSideBySide: boolean = true): () => Camera {
        let constructorFunc = Node.Construct(type, name, scene, {
            interaxial_distance: interaxial_distance,
            isStereoscopicSideBySide: isStereoscopicSideBySide
        });

        if (constructorFunc) {
            return <() => Camera>constructorFunc;
        }

        // Default to universal camera
        return () => Camera._createDefaultParsedCamera(name, scene);
    }

    /**
     * Compute the world  matrix of the camera.
     * @returns the camera world matrix
     */
    public computeWorldMatrix(): Matrix {
        return this.getWorldMatrix();
    }

    /**
     * Parse a JSON and creates the camera from the parsed information
     * @param parsedCamera The JSON to parse
     * @param scene The scene to instantiate the camera in
     * @returns the newly constructed camera
     */
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
                const internalClass = _TypeStore.GetClass("BABYLON.Animation");
                if (internalClass) {
                    camera.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            Node.ParseAnimationRanges(camera, parsedCamera, scene);
        }

        if (parsedCamera.autoAnimate) {
            scene.beginAnimation(camera, parsedCamera.autoAnimateFrom, parsedCamera.autoAnimateTo, parsedCamera.autoAnimateLoop, parsedCamera.autoAnimateSpeed || 1.0);
        }

        return camera;
    }
}
