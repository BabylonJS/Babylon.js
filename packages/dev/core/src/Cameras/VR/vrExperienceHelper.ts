import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { Camera } from "../../Cameras/camera";
import { FreeCamera } from "../../Cameras/freeCamera";
import { TargetCamera } from "../../Cameras/targetCamera";
import { DeviceOrientationCamera } from "../../Cameras/deviceOrientationCamera";
import { VRDeviceOrientationFreeCamera } from "../../Cameras/VR/vrDeviceOrientationFreeCamera";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { Scene, IDisposable } from "../../scene";
import { Quaternion, Matrix, Vector3 } from "../../Maths/math.vector";
import { Color3, Color4 } from "../../Maths/math.color";
import type { StickValues } from "../../Gamepads/gamepad";
import { Gamepad } from "../../Gamepads/gamepad";
import type { Xbox360Pad } from "../../Gamepads/xboxGamepad";
import { Xbox360Button } from "../../Gamepads/xboxGamepad";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { PickingInfo } from "../../Collisions/pickingInfo";
import { Ray } from "../../Culling/ray";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration";
import { StandardMaterial } from "../../Materials/standardMaterial";
import { DynamicTexture } from "../../Materials/Textures/dynamicTexture";
import type { ImageProcessingPostProcess } from "../../PostProcesses/imageProcessingPostProcess";
import { SineEase, EasingFunction, CircleEase } from "../../Animations/easing";
import { Animation } from "../../Animations/animation";
import type { VRCameraMetrics } from "../../Cameras/VR/vrCameraMetrics";
import "../../Gamepads/gamepadSceneComponent";
import "../../Animations/animatable";
import { WebXRSessionManager } from "../../XR/webXRSessionManager";
import type { WebXRDefaultExperience } from "../../XR/webXRDefaultExperience";
import { WebXRState } from "../../XR/webXRTypes";
import { CreateGround } from "../../Meshes/Builders/groundBuilder";
import type { IPointerEvent } from "../../Events/deviceInputEvents";
import type { Mesh } from "core/Meshes/mesh";
import { CreateTorus } from "core/Meshes/Builders/torusBuilder";

/**
 * Options to modify the vr teleportation behavior.
 */
export interface VRTeleportationOptions {
    /**
     * The name of the mesh which should be used as the teleportation floor. (default: null)
     */
    floorMeshName?: string;
    /**
     * A list of meshes to be used as the teleportation floor. (default: empty)
     */
    floorMeshes?: Mesh[];
    /**
     * The teleportation mode. (default: TELEPORTATIONMODE_CONSTANTTIME)
     */
    teleportationMode?: number;
    /**
     * The duration of the animation in ms, apply when animationMode is TELEPORTATIONMODE_CONSTANTTIME. (default 122ms)
     */
    teleportationTime?: number;
    /**
     * The speed of the animation in distance/sec, apply when animationMode is TELEPORTATIONMODE_CONSTANTSPEED. (default 20 units / sec)
     */
    teleportationSpeed?: number;
    /**
     * The easing function used in the animation or null for Linear. (default CircleEase)
     */
    easingFunction?: EasingFunction;
}

/**
 * Options to modify the vr experience helper's behavior.
 */
export interface VRExperienceHelperOptions {
    /**
     * Create a DeviceOrientationCamera to be used as your out of vr camera. (default: true)
     */
    createDeviceOrientationCamera?: boolean;
    /**
     * Create a VRDeviceOrientationFreeCamera to be used for VR when no external HMD is found. (default: true)
     */
    createFallbackVRDeviceOrientationFreeCamera?: boolean;
    /**
     * Uses the main button on the controller to toggle the laser casted. (default: true)
     */
    laserToggle?: boolean;
    /**
     * A list of meshes to be used as the teleportation floor. If specified, teleportation will be enabled (default: undefined)
     */
    floorMeshes?: Mesh[];
    /**
     * Distortion metrics for the fallback vrDeviceOrientationCamera (default: VRCameraMetrics.Default)
     */
    vrDeviceOrientationCameraMetrics?: VRCameraMetrics;
    /**
     * Defines if WebXR should be used (if available)
     */
    useXR?: boolean;
}

class VRExperienceHelperGazer implements IDisposable {
    /** @internal */
    public _gazeTracker: Mesh;

    /** @internal */
    public _currentMeshSelected: Nullable<AbstractMesh>;
    /** @internal */
    public _currentHit: Nullable<PickingInfo>;

    public static _IdCounter = 0;
    /** @internal */
    public _id: number;

    /** @internal */
    public _pointerDownOnMeshAsked: boolean = false;
    /** @internal */
    public _isActionableMesh: boolean = false;

    /** @internal */
    public _interactionsEnabled: boolean;
    /** @internal */
    public _teleportationEnabled: boolean;
    /** @internal */
    public _teleportationRequestInitiated = false;
    /** @internal */
    public _teleportationBackRequestInitiated = false;
    /** @internal */
    public _rotationRightAsked = false;
    /** @internal */
    public _rotationLeftAsked = false;
    /** @internal */
    public _dpadPressed = true;

    /** @internal */
    public _activePointer = false;

    constructor(
        public scene: Scene,
        gazeTrackerToClone: Nullable<Mesh> = null
    ) {
        this._id = VRExperienceHelperGazer._IdCounter++;

        // Gaze tracker
        if (!gazeTrackerToClone) {
            this._gazeTracker = CreateTorus(
                "gazeTracker",
                {
                    diameter: 0.0035,
                    thickness: 0.0025,
                    tessellation: 20,
                    updatable: false,
                },
                scene
            );
            this._gazeTracker.bakeCurrentTransformIntoVertices();
            this._gazeTracker.isPickable = false;
            this._gazeTracker.isVisible = false;
            const targetMat = new StandardMaterial("targetMat", scene);
            targetMat.specularColor = Color3.Black();
            targetMat.emissiveColor = new Color3(0.7, 0.7, 0.7);
            targetMat.backFaceCulling = false;
            this._gazeTracker.material = targetMat;
        } else {
            this._gazeTracker = gazeTrackerToClone.clone("gazeTracker") as Mesh;
        }
    }

    /**
     * @internal
     */
    public _getForwardRay(length: number): Ray {
        return new Ray(Vector3.Zero(), new Vector3(0, 0, length));
    }

    /** @internal */
    public _selectionPointerDown() {
        this._pointerDownOnMeshAsked = true;
        if (this._currentHit) {
            this.scene.simulatePointerDown(this._currentHit, { pointerId: this._id });
        }
    }

    /** @internal */
    public _selectionPointerUp() {
        if (this._currentHit) {
            this.scene.simulatePointerUp(this._currentHit, { pointerId: this._id });
        }
        this._pointerDownOnMeshAsked = false;
    }

    /** @internal */
    public _activatePointer() {
        this._activePointer = true;
    }

    /** @internal */
    public _deactivatePointer() {
        this._activePointer = false;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _updatePointerDistance(distance: number = 100) {}

    public dispose() {
        this._interactionsEnabled = false;
        this._teleportationEnabled = false;
        if (this._gazeTracker) {
            this._gazeTracker.dispose();
        }
    }
}

class VRExperienceHelperCameraGazer extends VRExperienceHelperGazer {
    constructor(
        private _getCamera: () => Nullable<Camera>,
        scene: Scene
    ) {
        super(scene);
    }

    _getForwardRay(length: number): Ray {
        const camera = this._getCamera();
        if (camera) {
            return camera.getForwardRay(length);
        } else {
            return new Ray(Vector3.Zero(), Vector3.Forward());
        }
    }
}

/**
 * Event containing information after VR has been entered
 */
export class OnAfterEnteringVRObservableEvent {
    /**
     * If entering vr was successful
     */
    public success: boolean;
}

/**
 * Helps to quickly add VR support to an existing scene.
 * See https://doc.babylonjs.com/features/featuresDeepDive/cameras/webVRHelper
 * @deprecated Use WebXR instead!
 */
export class VRExperienceHelper {
    private _scene: Scene;
    private _position: Vector3;
    private _btnVR: Nullable<HTMLButtonElement>;
    private _btnVRDisplayed: boolean;

    // Have we entered VR? (this is the VRExperienceHelper state)
    private _hasEnteredVR: boolean;

    // Are we presenting in the fullscreen fallback?
    private _fullscreenVRpresenting = false;

    private _inputElement: Nullable<HTMLElement>;
    private _vrDeviceOrientationCamera: Nullable<VRDeviceOrientationFreeCamera>;
    private _deviceOrientationCamera: Nullable<DeviceOrientationCamera>;
    private _existingCamera: Camera;

    private _onKeyDown: (event: KeyboardEvent) => void;
    private _onVrDisplayPresentChangeBind: any;

    /**
     * Gets or sets a boolean indicating that gaze can be enabled even if pointer lock is not engage (useful on iOS where fullscreen mode and pointer lock are not supported)
     */
    public enableGazeEvenWhenNoPointerLock = false;

    /**
     * Gets or sets a boolean indicating that the VREXperienceHelper will exit VR if double tap is detected
     */
    public exitVROnDoubleTap = true;

    /**
     * Observable raised right before entering VR.
     */
    public onEnteringVRObservable = new Observable<VRExperienceHelper>();

    /**
     * Observable raised when entering VR has completed.
     */
    public onAfterEnteringVRObservable = new Observable<OnAfterEnteringVRObservableEvent>();

    /**
     * Observable raised when exiting VR.
     */
    public onExitingVRObservable = new Observable<VRExperienceHelper>();

    /** Return this.onEnteringVRObservable
     * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
     */
    public get onEnteringVR(): Observable<VRExperienceHelper> {
        return this.onEnteringVRObservable;
    }

    /** Return this.onExitingVRObservable
     * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
     */
    public get onExitingVR(): Observable<VRExperienceHelper> {
        return this.onExitingVRObservable;
    }

    private _useCustomVRButton: boolean = false;
    private _teleportActive = false;
    private _floorMeshName: string;
    private _floorMeshesCollection: Mesh[] = [];
    private _teleportationMode: number = VRExperienceHelper.TELEPORTATIONMODE_CONSTANTTIME;
    private _teleportationTime: number = 122;
    private _teleportationSpeed: number = 20;
    private _teleportationEasing: EasingFunction;
    private _rotationAllowed: boolean = true;
    private _teleportBackwardsVector = new Vector3(0, -1, -1);
    private _teleportationTarget: Mesh;
    private _isDefaultTeleportationTarget = true;
    private _postProcessMove: ImageProcessingPostProcess;
    private _teleportationFillColor: string = "#444444";
    private _teleportationBorderColor: string = "#FFFFFF";
    private _rotationAngle: number = 0;
    private _haloCenter = new Vector3(0, 0, 0);
    private _cameraGazer: VRExperienceHelperCameraGazer;
    private _padSensibilityUp = 0.65;
    private _padSensibilityDown = 0.35;

    private _pickedLaserColor: Color3 = new Color3(0.2, 0.2, 1);
    private _pickedGazeColor: Color3 = new Color3(0, 0, 1);

    /**
     * Observable raised when a new mesh is selected based on meshSelectionPredicate
     */
    public onNewMeshSelected = new Observable<AbstractMesh>();

    /**
     * Observable raised when a new mesh is picked based on meshSelectionPredicate
     */
    public onNewMeshPicked = new Observable<PickingInfo>();

    private _circleEase: CircleEase;

    /**
     * Observable raised before camera teleportation
     */
    public onBeforeCameraTeleport = new Observable<Vector3>();

    /**
     *  Observable raised after camera teleportation
     */
    public onAfterCameraTeleport = new Observable<Vector3>();

    /**
     * Observable raised when current selected mesh gets unselected
     */
    public onSelectedMeshUnselected = new Observable<AbstractMesh>();

    private _raySelectionPredicate: (mesh: AbstractMesh) => boolean;

    /**
     * To be optionally changed by user to define custom ray selection
     */
    public raySelectionPredicate: (mesh: AbstractMesh) => boolean;

    /**
     * To be optionally changed by user to define custom selection logic (after ray selection)
     */
    public meshSelectionPredicate: (mesh: AbstractMesh) => boolean;

    /**
     * Set teleportation enabled. If set to false camera teleportation will be disabled but camera rotation will be kept.
     */
    public teleportationEnabled: boolean = true;

    private _defaultHeight: number;
    private _teleportationInitialized = false;
    private _interactionsEnabled = false;
    private _displayGaze = true;
    private _displayLaserPointer = true;

    /**
     * The mesh used to display where the user is going to teleport.
     */
    public get teleportationTarget(): Mesh {
        return this._teleportationTarget;
    }

    /**
     * Sets the mesh to be used to display where the user is going to teleport.
     */
    public set teleportationTarget(value: Mesh) {
        if (value) {
            value.name = "teleportationTarget";
            this._isDefaultTeleportationTarget = false;
            this._teleportationTarget = value;
        }
    }

    /**
     * The mesh used to display where the user is selecting, this mesh will be cloned and set as the gazeTracker for the left and right controller
     * when set bakeCurrentTransformIntoVertices will be called on the mesh.
     * See https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/bakingTransforms
     */
    public get gazeTrackerMesh(): Mesh {
        return this._cameraGazer._gazeTracker;
    }

    public set gazeTrackerMesh(value: Mesh) {
        if (value) {
            // Dispose of existing meshes
            if (this._cameraGazer._gazeTracker) {
                this._cameraGazer._gazeTracker.dispose();
            }

            // Set and create gaze trackers on head and controllers
            this._cameraGazer._gazeTracker = value;
            this._cameraGazer._gazeTracker.bakeCurrentTransformIntoVertices();
            this._cameraGazer._gazeTracker.isPickable = false;
            this._cameraGazer._gazeTracker.isVisible = false;
            this._cameraGazer._gazeTracker.name = "gazeTracker";
        }
    }

    /**
     * If the gaze trackers scale should be updated to be constant size when pointing at near/far meshes
     */
    public updateGazeTrackerScale = true;
    /**
     * If the gaze trackers color should be updated when selecting meshes
     */
    public updateGazeTrackerColor = true;
    /**
     * If the controller laser color should be updated when selecting meshes
     */
    public updateControllerLaserColor = true;

    /**
     * If the ray of the gaze should be displayed.
     */
    public get displayGaze(): boolean {
        return this._displayGaze;
    }

    /**
     * Sets if the ray of the gaze should be displayed.
     */
    public set displayGaze(value: boolean) {
        this._displayGaze = value;
        if (!value) {
            this._cameraGazer._gazeTracker.isVisible = false;
        }
    }

    /**
     * If the ray of the LaserPointer should be displayed.
     */
    public get displayLaserPointer(): boolean {
        return this._displayLaserPointer;
    }

    /**
     * Sets if the ray of the LaserPointer should be displayed.
     */
    public set displayLaserPointer(value: boolean) {
        this._displayLaserPointer = value;
    }

    /**
     * The deviceOrientationCamera used as the camera when not in VR.
     */
    public get deviceOrientationCamera(): Nullable<DeviceOrientationCamera> {
        return this._deviceOrientationCamera;
    }

    /**
     * Based on the current WebVR support, returns the current VR camera used.
     */
    public get currentVRCamera(): Nullable<Camera> {
        return this._scene.activeCamera;
    }

    /**
     * The deviceOrientationCamera that is used as a fallback when vr device is not connected.
     */
    public get vrDeviceOrientationCamera(): Nullable<VRDeviceOrientationFreeCamera> {
        return this._vrDeviceOrientationCamera;
    }

    /**
     * The html button that is used to trigger entering into VR.
     */
    public get vrButton(): Nullable<HTMLButtonElement> {
        return this._btnVR;
    }

    private get _teleportationRequestInitiated(): boolean {
        return this._cameraGazer._teleportationRequestInitiated;
    }

    /**
     * Defines whether or not Pointer lock should be requested when switching to
     * full screen.
     */
    public requestPointerLockOnFullScreen = true;

    // XR

    /**
     * If asking to force XR, this will be populated with the default xr experience
     */
    public xr: WebXRDefaultExperience;

    /**
     * Was the XR test done already. If this is true AND this.xr exists, xr is initialized.
     * If this is true and no this.xr, xr exists but is not supported, using WebVR.
     */
    public xrTestDone: boolean = false;

    /**
     * Instantiates a VRExperienceHelper.
     * Helps to quickly add VR support to an existing scene.
     * @param scene The scene the VRExperienceHelper belongs to.
     * @param webVROptions Options to modify the vr experience helper's behavior.
     */
    constructor(
        scene: Scene,
        /** Options to modify the vr experience helper's behavior. */
        public webVROptions: VRExperienceHelperOptions = {}
    ) {
        Logger.Warn("WebVR is deprecated. Please avoid using this experience helper and use the WebXR experience helper instead");
        this._scene = scene;
        this._inputElement = scene.getEngine().getInputElement();

        // check for VR support:

        const vrSupported = "getVRDisplays" in navigator;
        // no VR support? force XR but only when it is not set because web vr can work without the getVRDisplays
        if (!vrSupported && webVROptions.useXR === undefined) {
            webVROptions.useXR = true;
        }

        // Parse options
        if (webVROptions.createFallbackVRDeviceOrientationFreeCamera === undefined) {
            webVROptions.createFallbackVRDeviceOrientationFreeCamera = true;
        }
        if (webVROptions.createDeviceOrientationCamera === undefined) {
            webVROptions.createDeviceOrientationCamera = true;
        }
        if (webVROptions.laserToggle === undefined) {
            webVROptions.laserToggle = true;
        }

        this._hasEnteredVR = false;

        // Set position
        if (this._scene.activeCamera) {
            this._position = this._scene.activeCamera.position.clone();
        } else {
            this._position = new Vector3(0, this._defaultHeight, 0);
        }

        // Set non-vr camera
        if (webVROptions.createDeviceOrientationCamera || !this._scene.activeCamera) {
            this._deviceOrientationCamera = new DeviceOrientationCamera("deviceOrientationVRHelper", this._position.clone(), scene);

            // Copy data from existing camera
            if (this._scene.activeCamera) {
                this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
                // Set rotation from previous camera
                if (this._scene.activeCamera instanceof TargetCamera && this._scene.activeCamera.rotation) {
                    const targetCamera = this._scene.activeCamera;
                    if (targetCamera.rotationQuaternion) {
                        this._deviceOrientationCamera.rotationQuaternion.copyFrom(targetCamera.rotationQuaternion);
                    } else {
                        this._deviceOrientationCamera.rotationQuaternion.copyFrom(
                            Quaternion.RotationYawPitchRoll(targetCamera.rotation.y, targetCamera.rotation.x, targetCamera.rotation.z)
                        );
                    }
                    this._deviceOrientationCamera.rotation = targetCamera.rotation.clone();
                }
            }

            this._scene.activeCamera = this._deviceOrientationCamera;
            if (this._inputElement) {
                this._scene.activeCamera.attachControl();
            }
        } else {
            this._existingCamera = this._scene.activeCamera;
        }

        if (this.webVROptions.useXR && (navigator as any).xr) {
            // force-check XR session support
            WebXRSessionManager.IsSessionSupportedAsync("immersive-vr").then((supported) => {
                if (supported) {
                    Logger.Log("Using WebXR. It is recommended to use the WebXRDefaultExperience directly");
                    // it is possible to use XR, let's do it!
                    scene
                        .createDefaultXRExperienceAsync({
                            floorMeshes: webVROptions.floorMeshes || [],
                        })
                        .then((xr) => {
                            this.xr = xr;
                            // connect observables
                            this.xrTestDone = true;

                            this._cameraGazer = new VRExperienceHelperCameraGazer(() => {
                                return this.xr.baseExperience.camera;
                            }, scene);

                            this.xr.baseExperience.onStateChangedObservable.add((state) => {
                                // support for entering / exiting
                                switch (state) {
                                    case WebXRState.ENTERING_XR:
                                        this.onEnteringVRObservable.notifyObservers(this);
                                        if (!this._interactionsEnabled) {
                                            this.xr.pointerSelection.detach();
                                        }
                                        this.xr.pointerSelection.displayLaserPointer = this._displayLaserPointer;
                                        break;
                                    case WebXRState.EXITING_XR:
                                        this.onExitingVRObservable.notifyObservers(this);

                                        // resize to update width and height when exiting vr exits fullscreen
                                        this._scene.getEngine().resize();
                                        break;
                                    case WebXRState.IN_XR:
                                        this._hasEnteredVR = true;
                                        break;
                                    case WebXRState.NOT_IN_XR:
                                        this._hasEnteredVR = false;
                                        break;
                                }
                            });
                        });
                } else {
                    // XR not supported (thou exists), continue WebVR init
                    this._completeVRInit(scene, webVROptions);
                }
            });
        } else {
            // no XR, continue init synchronous
            this._completeVRInit(scene, webVROptions);
        }
    }

    private _completeVRInit(scene: Scene, webVROptions: VRExperienceHelperOptions): void {
        this.xrTestDone = true;
        // Create VR cameras
        if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
            this._vrDeviceOrientationCamera = new VRDeviceOrientationFreeCamera(
                "VRDeviceOrientationVRHelper",
                this._position,
                this._scene,
                true,
                webVROptions.vrDeviceOrientationCameraMetrics
            );
            this._vrDeviceOrientationCamera.angularSensibility = Number.MAX_VALUE;
        }

        this._cameraGazer = new VRExperienceHelperCameraGazer(() => {
            return this.currentVRCamera;
        }, scene);
        // Create default button
        if (!this._useCustomVRButton) {
            this._btnVR = <HTMLButtonElement>document.createElement("BUTTON");
            this._btnVR.className = "babylonVRicon";
            this._btnVR.id = "babylonVRiconbtn";
            this._btnVR.title = "Click to switch to VR";
            const url = !window.SVGSVGElement
                ? "https://cdn.babylonjs.com/Assets/vrButton.png"
                : "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A";
            let css =
                ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(" +
                url +
                "); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
            css += ".babylonVRicon.vrdisplaypresenting { display: none; }";
            // TODO: Add user feedback so that they know what state the VRDisplay is in (disconnected, connected, entering-VR)
            // css += ".babylonVRicon.vrdisplaysupported { }";
            // css += ".babylonVRicon.vrdisplayready { }";
            // css += ".babylonVRicon.vrdisplayrequesting { }";

            const style = document.createElement("style");
            style.appendChild(document.createTextNode(css));
            document.getElementsByTagName("head")[0].appendChild(style);

            this._moveButtonToBottomRight();
        }

        // VR button click event
        if (this._btnVR) {
            this._btnVR.addEventListener("click", () => {
                if (!this.isInVRMode) {
                    this.enterVR();
                }
            });
        }

        // Window events

        const hostWindow = this._scene.getEngine().getHostWindow();
        if (!hostWindow) {
            return;
        }

        hostWindow.addEventListener("resize", this._onResize);
        document.addEventListener("fullscreenchange", this._onFullscreenChange, false);

        // Display vr button when headset is connected
        if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
            this._displayVRButton();
        }

        // Exiting VR mode using 'ESC' key on desktop
        this._onKeyDown = (event: KeyboardEvent) => {
            if (event.keyCode === 27 && this.isInVRMode) {
                this.exitVR();
            }
        };
        document.addEventListener("keydown", this._onKeyDown);

        // Exiting VR mode double tapping the touch screen
        this._scene.onPrePointerObservable.add(
            () => {
                if (this._hasEnteredVR && this.exitVROnDoubleTap) {
                    this.exitVR();
                    if (this._fullscreenVRpresenting) {
                        this._scene.getEngine().exitFullscreen();
                    }
                }
            },
            PointerEventTypes.POINTERDOUBLETAP,
            false
        );

        scene.onDisposeObservable.add(() => {
            this.dispose();
        });

        this._updateButtonVisibility();

        //create easing functions
        this._circleEase = new CircleEase();
        this._circleEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        this._teleportationEasing = this._circleEase;

        // Allow clicking in the vrDeviceOrientationCamera
        scene.onPointerObservable.add((e) => {
            if (this._interactionsEnabled) {
                if (scene.activeCamera === this.vrDeviceOrientationCamera && (e.event as IPointerEvent).pointerType === "mouse") {
                    if (e.type === PointerEventTypes.POINTERDOWN) {
                        this._cameraGazer._selectionPointerDown();
                    } else if (e.type === PointerEventTypes.POINTERUP) {
                        this._cameraGazer._selectionPointerUp();
                    }
                }
            }
        });

        if (this.webVROptions.floorMeshes) {
            this.enableTeleportation({ floorMeshes: this.webVROptions.floorMeshes });
        }
    }

    private _onResize = () => {
        this._moveButtonToBottomRight();
    };

    private _onFullscreenChange = () => {
        this._fullscreenVRpresenting = !!document.fullscreenElement;
        if (!this._fullscreenVRpresenting && this._inputElement) {
            this.exitVR();
            if (!this._useCustomVRButton && this._btnVR) {
                this._btnVR.style.top = this._inputElement.offsetTop + this._inputElement.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._inputElement.offsetLeft + this._inputElement.offsetWidth - 100 + "px";
                // make sure the button is visible after setting its position
                this._updateButtonVisibility();
            }
        }
    };

    /**
     * Gets a value indicating if we are currently in VR mode.
     */
    public get isInVRMode(): boolean {
        return (this.xr && this.webVROptions.useXR && this.xr.baseExperience.state === WebXRState.IN_XR) || this._fullscreenVRpresenting;
    }

    private _moveButtonToBottomRight() {
        if (this._inputElement && !this._useCustomVRButton && this._btnVR) {
            const rect: ClientRect = this._inputElement.getBoundingClientRect();
            this._btnVR.style.top = rect.top + rect.height - 70 + "px";
            this._btnVR.style.left = rect.left + rect.width - 100 + "px";
        }
    }

    private _displayVRButton() {
        if (!this._useCustomVRButton && !this._btnVRDisplayed && this._btnVR) {
            document.body.appendChild(this._btnVR);
            this._btnVRDisplayed = true;
        }
    }

    private _updateButtonVisibility() {
        if (!this._btnVR || this._useCustomVRButton) {
            return;
        }
        this._btnVR.className = "babylonVRicon";
        if (this.isInVRMode) {
            this._btnVR.className += " vrdisplaypresenting";
        }
    }

    private _cachedAngularSensibility = { angularSensibilityX: null, angularSensibilityY: null, angularSensibility: null };
    /**
     * Attempt to enter VR. If a headset is connected and ready, will request present on that.
     * Otherwise, will use the fullscreen API.
     */
    public enterVR() {
        if (this.xr) {
            this.xr.baseExperience.enterXRAsync("immersive-vr", "local-floor", this.xr.renderTarget);
            return;
        }
        if (this.onEnteringVRObservable) {
            try {
                this.onEnteringVRObservable.notifyObservers(this);
            } catch (err) {
                Logger.Warn("Error in your custom logic onEnteringVR: " + err);
            }
        }

        if (this._scene.activeCamera) {
            this._position = this._scene.activeCamera.position.clone();

            if (this.vrDeviceOrientationCamera) {
                this.vrDeviceOrientationCamera.rotation = Quaternion.FromRotationMatrix(this._scene.activeCamera.getWorldMatrix().getRotationMatrix()).toEulerAngles();
                this.vrDeviceOrientationCamera.angularSensibility = 2000;
            }

            // make sure that we return to the last active camera
            this._existingCamera = this._scene.activeCamera;

            // Remove and cache angular sensability to avoid camera rotation when in VR
            if ((<any>this._existingCamera).angularSensibilityX) {
                this._cachedAngularSensibility.angularSensibilityX = (<any>this._existingCamera).angularSensibilityX;
                (<any>this._existingCamera).angularSensibilityX = Number.MAX_VALUE;
            }
            if ((<any>this._existingCamera).angularSensibilityY) {
                this._cachedAngularSensibility.angularSensibilityY = (<any>this._existingCamera).angularSensibilityY;
                (<any>this._existingCamera).angularSensibilityY = Number.MAX_VALUE;
            }
            if ((<any>this._existingCamera).angularSensibility) {
                this._cachedAngularSensibility.angularSensibility = (<any>this._existingCamera).angularSensibility;
                (<any>this._existingCamera).angularSensibility = Number.MAX_VALUE;
            }
        }

        // If WebVR is supported and a headset is connected
        if (this._vrDeviceOrientationCamera) {
            this._vrDeviceOrientationCamera.position = this._position;
            if (this._scene.activeCamera) {
                this._vrDeviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
            }
            this._scene.activeCamera = this._vrDeviceOrientationCamera;
            this._scene.getEngine().enterFullscreen(this.requestPointerLockOnFullScreen);
            this._updateButtonVisibility();
            this._vrDeviceOrientationCamera.onViewMatrixChangedObservable.addOnce(() => {
                this.onAfterEnteringVRObservable.notifyObservers({ success: true });
            });
        }

        if (this._scene.activeCamera && this._inputElement) {
            this._scene.activeCamera.attachControl();
        }

        if (this._interactionsEnabled) {
            this._scene.registerBeforeRender(this._beforeRender);
        }

        this._hasEnteredVR = true;
    }

    /**
     * Attempt to exit VR, or fullscreen.
     */
    public exitVR() {
        if (this.xr) {
            this.xr.baseExperience.exitXRAsync();
            return;
        }
        if (this._hasEnteredVR) {
            if (this.onExitingVRObservable) {
                try {
                    this.onExitingVRObservable.notifyObservers(this);
                } catch (err) {
                    Logger.Warn("Error in your custom logic onExitingVR: " + err);
                }
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }

            if (this.vrDeviceOrientationCamera) {
                this.vrDeviceOrientationCamera.angularSensibility = Number.MAX_VALUE;
            }

            if (this._deviceOrientationCamera) {
                this._deviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._deviceOrientationCamera;

                // Restore angular sensibility
                if (this._cachedAngularSensibility.angularSensibilityX) {
                    (<any>this._deviceOrientationCamera).angularSensibilityX = this._cachedAngularSensibility.angularSensibilityX;
                    this._cachedAngularSensibility.angularSensibilityX = null;
                }
                if (this._cachedAngularSensibility.angularSensibilityY) {
                    (<any>this._deviceOrientationCamera).angularSensibilityY = this._cachedAngularSensibility.angularSensibilityY;
                    this._cachedAngularSensibility.angularSensibilityY = null;
                }
                if (this._cachedAngularSensibility.angularSensibility) {
                    (<any>this._deviceOrientationCamera).angularSensibility = this._cachedAngularSensibility.angularSensibility;
                    this._cachedAngularSensibility.angularSensibility = null;
                }
            } else if (this._existingCamera) {
                this._existingCamera.position = this._position;
                this._scene.activeCamera = this._existingCamera;
                if (this._inputElement) {
                    this._scene.activeCamera.attachControl();
                }

                // Restore angular sensibility
                if (this._cachedAngularSensibility.angularSensibilityX) {
                    (<any>this._existingCamera).angularSensibilityX = this._cachedAngularSensibility.angularSensibilityX;
                    this._cachedAngularSensibility.angularSensibilityX = null;
                }
                if (this._cachedAngularSensibility.angularSensibilityY) {
                    (<any>this._existingCamera).angularSensibilityY = this._cachedAngularSensibility.angularSensibilityY;
                    this._cachedAngularSensibility.angularSensibilityY = null;
                }
                if (this._cachedAngularSensibility.angularSensibility) {
                    (<any>this._existingCamera).angularSensibility = this._cachedAngularSensibility.angularSensibility;
                    this._cachedAngularSensibility.angularSensibility = null;
                }
            }

            this._updateButtonVisibility();

            if (this._interactionsEnabled) {
                this._scene.unregisterBeforeRender(this._beforeRender);
                this._cameraGazer._gazeTracker.isVisible = false;
            }

            // resize to update width and height when exiting vr exits fullscreen
            this._scene.getEngine().resize();

            this._hasEnteredVR = false;
        }
    }

    /**
     * The position of the vr experience helper.
     */
    public get position(): Vector3 {
        return this._position;
    }

    /**
     * Sets the position of the vr experience helper.
     */
    public set position(value: Vector3) {
        this._position = value;

        if (this._scene.activeCamera) {
            this._scene.activeCamera.position = value;
        }
    }

    /**
     * Enables controllers and user interactions such as selecting and object or clicking on an object.
     */
    public enableInteractions() {
        if (!this._interactionsEnabled) {
            // in XR it is enabled by default, but just to make sure, re-attach
            if (this.xr) {
                if (this.xr.baseExperience.state === WebXRState.IN_XR) {
                    this.xr.pointerSelection.attach();
                }
                return;
            }

            this.raySelectionPredicate = (mesh) => {
                return mesh.isVisible && (mesh.isPickable || mesh.name === this._floorMeshName);
            };

            this.meshSelectionPredicate = () => {
                return true;
            };

            this._raySelectionPredicate = (mesh) => {
                if (
                    this._isTeleportationFloor(mesh) ||
                    (mesh.name.indexOf("gazeTracker") === -1 && mesh.name.indexOf("teleportationTarget") === -1 && mesh.name.indexOf("torusTeleportation") === -1)
                ) {
                    return this.raySelectionPredicate(mesh);
                }
                return false;
            };

            this._interactionsEnabled = true;
        }
    }

    private _beforeRender = () => {
        if (this._scene.getEngine().isPointerLock || this.enableGazeEvenWhenNoPointerLock) {
            // no-op
        } else {
            this._cameraGazer._gazeTracker.isVisible = false;
        }
    };

    private _isTeleportationFloor(mesh: AbstractMesh): boolean {
        for (let i = 0; i < this._floorMeshesCollection.length; i++) {
            if (this._floorMeshesCollection[i].id === mesh.id) {
                return true;
            }
        }
        if (this._floorMeshName && mesh.name === this._floorMeshName) {
            return true;
        }
        return false;
    }

    /**
     * Adds a floor mesh to be used for teleportation.
     * @param floorMesh the mesh to be used for teleportation.
     */
    public addFloorMesh(floorMesh: Mesh): void {
        if (!this._floorMeshesCollection) {
            return;
        }

        if (this._floorMeshesCollection.indexOf(floorMesh) > -1) {
            return;
        }

        this._floorMeshesCollection.push(floorMesh);
    }

    /**
     * Removes a floor mesh from being used for teleportation.
     * @param floorMesh the mesh to be removed.
     */
    public removeFloorMesh(floorMesh: Mesh): void {
        if (!this._floorMeshesCollection) {
            return;
        }

        const meshIndex = this._floorMeshesCollection.indexOf(floorMesh);
        if (meshIndex !== -1) {
            this._floorMeshesCollection.splice(meshIndex, 1);
        }
    }

    /**
     * Enables interactions and teleportation using the VR controllers and gaze.
     * @param vrTeleportationOptions options to modify teleportation behavior.
     */
    public enableTeleportation(vrTeleportationOptions: VRTeleportationOptions = {}) {
        if (!this._teleportationInitialized) {
            this.enableInteractions();

            if (this.webVROptions.useXR && (vrTeleportationOptions.floorMeshes || vrTeleportationOptions.floorMeshName)) {
                const floorMeshes: AbstractMesh[] = vrTeleportationOptions.floorMeshes || [];
                if (!floorMeshes.length) {
                    const floorMesh = this._scene.getMeshByName(vrTeleportationOptions.floorMeshName!);
                    if (floorMesh) {
                        floorMeshes.push(floorMesh);
                    }
                }
                if (this.xr) {
                    floorMeshes.forEach((mesh) => {
                        this.xr.teleportation.addFloorMesh(mesh);
                    });
                    if (!this.xr.teleportation.attached) {
                        this.xr.teleportation.attach();
                    }
                    return;
                } else if (!this.xrTestDone) {
                    const waitForXr = () => {
                        if (this.xrTestDone) {
                            this._scene.unregisterBeforeRender(waitForXr);
                            if (this.xr) {
                                if (!this.xr.teleportation.attached) {
                                    this.xr.teleportation.attach();
                                }
                            } else {
                                this.enableTeleportation(vrTeleportationOptions);
                            }
                        }
                    };
                    this._scene.registerBeforeRender(waitForXr);
                    return;
                }
            }

            if (vrTeleportationOptions.floorMeshName) {
                this._floorMeshName = vrTeleportationOptions.floorMeshName;
            }
            if (vrTeleportationOptions.floorMeshes) {
                this._floorMeshesCollection = vrTeleportationOptions.floorMeshes;
            }

            if (vrTeleportationOptions.teleportationMode) {
                this._teleportationMode = vrTeleportationOptions.teleportationMode;
            }
            if (vrTeleportationOptions.teleportationTime && vrTeleportationOptions.teleportationTime > 0) {
                this._teleportationTime = vrTeleportationOptions.teleportationTime;
            }
            if (vrTeleportationOptions.teleportationSpeed && vrTeleportationOptions.teleportationSpeed > 0) {
                this._teleportationSpeed = vrTeleportationOptions.teleportationSpeed;
            }
            if (vrTeleportationOptions.easingFunction !== undefined) {
                this._teleportationEasing = vrTeleportationOptions.easingFunction;
            }

            // Creates an image processing post process for the vignette not relying
            // on the main scene configuration for image processing to reduce setup and spaces
            // (gamma/linear) conflicts.
            const imageProcessingConfiguration = new ImageProcessingConfiguration();
            imageProcessingConfiguration.vignetteColor = new Color4(0, 0, 0, 0);
            imageProcessingConfiguration.vignetteEnabled = true;
            this._teleportationInitialized = true;
            if (this._isDefaultTeleportationTarget) {
                this._createTeleportationCircles();
            }
        }
    }

    private _onNewGamepadConnected = (gamepad: Gamepad) => {
        if (gamepad.type !== Gamepad.POSE_ENABLED) {
            if (gamepad.leftStick) {
                gamepad.onleftstickchanged((stickValues) => {
                    if (this._teleportationInitialized && this.teleportationEnabled) {
                        // Listening to classic/xbox gamepad only if no VR controller is active
                        this._checkTeleportWithRay(stickValues, this._cameraGazer);
                        this._checkTeleportBackwards(stickValues, this._cameraGazer);
                    }
                });
            }
            if (gamepad.rightStick) {
                gamepad.onrightstickchanged((stickValues) => {
                    if (this._teleportationInitialized) {
                        this._checkRotate(stickValues, this._cameraGazer);
                    }
                });
            }
            if (gamepad.type === Gamepad.XBOX) {
                (<Xbox360Pad>gamepad).onbuttondown((buttonPressed: Xbox360Button) => {
                    if (this._interactionsEnabled && buttonPressed === Xbox360Button.A) {
                        this._cameraGazer._selectionPointerDown();
                    }
                });
                (<Xbox360Pad>gamepad).onbuttonup((buttonPressed: Xbox360Button) => {
                    if (this._interactionsEnabled && buttonPressed === Xbox360Button.A) {
                        this._cameraGazer._selectionPointerUp();
                    }
                });
            }
        }
    };

    private _checkTeleportWithRay(stateObject: StickValues, gazer: VRExperienceHelperGazer) {
        // Dont teleport if another gaze already requested teleportation
        if (this._teleportationRequestInitiated && !gazer._teleportationRequestInitiated) {
            return;
        }
        if (!gazer._teleportationRequestInitiated) {
            if (stateObject.y < -this._padSensibilityUp && gazer._dpadPressed) {
                gazer._activatePointer();
                gazer._teleportationRequestInitiated = true;
            }
        } else {
            // Listening to the proper controller values changes to confirm teleportation
            if (Math.sqrt(stateObject.y * stateObject.y + stateObject.x * stateObject.x) < this._padSensibilityDown) {
                if (this._teleportActive) {
                    this.teleportCamera(this._haloCenter);
                }

                gazer._teleportationRequestInitiated = false;
            }
        }
    }
    private _checkRotate(stateObject: StickValues, gazer: VRExperienceHelperGazer) {
        // Only rotate when user is not currently selecting a teleportation location
        if (gazer._teleportationRequestInitiated) {
            return;
        }

        if (!gazer._rotationLeftAsked) {
            if (stateObject.x < -this._padSensibilityUp && gazer._dpadPressed) {
                gazer._rotationLeftAsked = true;
                if (this._rotationAllowed) {
                    this._rotateCamera(false);
                }
            }
        } else {
            if (stateObject.x > -this._padSensibilityDown) {
                gazer._rotationLeftAsked = false;
            }
        }

        if (!gazer._rotationRightAsked) {
            if (stateObject.x > this._padSensibilityUp && gazer._dpadPressed) {
                gazer._rotationRightAsked = true;
                if (this._rotationAllowed) {
                    this._rotateCamera(true);
                }
            }
        } else {
            if (stateObject.x < this._padSensibilityDown) {
                gazer._rotationRightAsked = false;
            }
        }
    }
    private _checkTeleportBackwards(stateObject: StickValues, gazer: VRExperienceHelperGazer) {
        // Only teleport backwards when user is not currently selecting a teleportation location
        if (gazer._teleportationRequestInitiated) {
            return;
        }
        // Teleport backwards
        if (stateObject.y > this._padSensibilityUp && gazer._dpadPressed) {
            if (!gazer._teleportationBackRequestInitiated) {
                if (!this.currentVRCamera) {
                    return;
                }

                // Get rotation and position of the current camera
                const rotation = Quaternion.FromRotationMatrix(this.currentVRCamera.getWorldMatrix().getRotationMatrix());
                const position = this.currentVRCamera.position;

                // Get matrix with only the y rotation of the device rotation
                rotation.toEulerAnglesToRef(this._workingVector);
                this._workingVector.z = 0;
                this._workingVector.x = 0;
                Quaternion.RotationYawPitchRollToRef(this._workingVector.y, this._workingVector.x, this._workingVector.z, this._workingQuaternion);
                this._workingQuaternion.toRotationMatrix(this._workingMatrix);

                // Rotate backwards ray by device rotation to cast at the ground behind the user
                Vector3.TransformCoordinatesToRef(this._teleportBackwardsVector, this._workingMatrix, this._workingVector);

                // Teleport if ray hit the ground and is not to far away eg. backwards off a cliff
                const ray = new Ray(position, this._workingVector);
                const hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
                if (hit && hit.pickedPoint && hit.pickedMesh && this._isTeleportationFloor(hit.pickedMesh) && hit.distance < 5) {
                    this.teleportCamera(hit.pickedPoint);
                }

                gazer._teleportationBackRequestInitiated = true;
            }
        } else {
            gazer._teleportationBackRequestInitiated = false;
        }
    }

    private _createTeleportationCircles() {
        this._teleportationTarget = CreateGround("teleportationTarget", { width: 2, height: 2, subdivisions: 2 }, this._scene);
        this._teleportationTarget.isPickable = false;

        const length = 512;
        const dynamicTexture = new DynamicTexture("DynamicTexture", length, this._scene, true);
        dynamicTexture.hasAlpha = true;
        const context = dynamicTexture.getContext();

        const centerX = length / 2;
        const centerY = length / 2;
        const radius = 200;

        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = this._teleportationFillColor;
        context.fill();
        context.lineWidth = 10;
        context.strokeStyle = this._teleportationBorderColor;
        context.stroke();
        context.closePath();
        dynamicTexture.update();

        const teleportationCircleMaterial = new StandardMaterial("TextPlaneMaterial", this._scene);
        teleportationCircleMaterial.diffuseTexture = dynamicTexture;
        this._teleportationTarget.material = teleportationCircleMaterial;

        const torus = CreateTorus(
            "torusTeleportation",
            {
                diameter: 0.75,
                thickness: 0.1,
                tessellation: 25,
                updatable: false,
            },
            this._scene
        );
        torus.isPickable = false;
        torus.parent = this._teleportationTarget;

        const animationInnerCircle = new Animation("animationInnerCircle", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

        const keys = [];
        keys.push({
            frame: 0,
            value: 0,
        });
        keys.push({
            frame: 30,
            value: 0.4,
        });
        keys.push({
            frame: 60,
            value: 0,
        });

        animationInnerCircle.setKeys(keys);

        const easingFunction = new SineEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        animationInnerCircle.setEasingFunction(easingFunction);

        torus.animations = [];
        torus.animations.push(animationInnerCircle);

        this._scene.beginAnimation(torus, 0, 60, true);

        this._hideTeleportationTarget();
    }

    private _hideTeleportationTarget() {
        this._teleportActive = false;
        if (this._teleportationInitialized) {
            this._teleportationTarget.isVisible = false;
            if (this._isDefaultTeleportationTarget) {
                (<Mesh>this._teleportationTarget.getChildren()[0]).isVisible = false;
            }
        }
    }

    private _rotateCamera(right: boolean) {
        if (!(this.currentVRCamera instanceof FreeCamera)) {
            return;
        }

        if (right) {
            this._rotationAngle++;
        } else {
            this._rotationAngle--;
        }

        this.currentVRCamera.animations = [];

        const target = Quaternion.FromRotationMatrix(Matrix.RotationY((Math.PI / 4) * this._rotationAngle));

        const animationRotation = new Animation("animationRotation", "rotationQuaternion", 90, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const animationRotationKeys = [];
        animationRotationKeys.push({
            frame: 0,
            value: this.currentVRCamera.rotationQuaternion,
        });
        animationRotationKeys.push({
            frame: 6,
            value: target,
        });

        animationRotation.setKeys(animationRotationKeys);

        animationRotation.setEasingFunction(this._circleEase);

        this.currentVRCamera.animations.push(animationRotation);

        this._postProcessMove.animations = [];

        const animationPP = new Animation("animationPP", "vignetteWeight", 90, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const vignetteWeightKeys = [];
        vignetteWeightKeys.push({
            frame: 0,
            value: 0,
        });
        vignetteWeightKeys.push({
            frame: 3,
            value: 4,
        });
        vignetteWeightKeys.push({
            frame: 6,
            value: 0,
        });

        animationPP.setKeys(vignetteWeightKeys);
        animationPP.setEasingFunction(this._circleEase);
        this._postProcessMove.animations.push(animationPP);

        const animationPP2 = new Animation("animationPP2", "vignetteStretch", 90, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const vignetteStretchKeys = [];
        vignetteStretchKeys.push({
            frame: 0,
            value: 0,
        });
        vignetteStretchKeys.push({
            frame: 3,
            value: 10,
        });
        vignetteStretchKeys.push({
            frame: 6,
            value: 0,
        });

        animationPP2.setKeys(vignetteStretchKeys);
        animationPP2.setEasingFunction(this._circleEase);
        this._postProcessMove.animations.push(animationPP2);

        this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
        this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;
        this._postProcessMove.samples = 4;
        this._scene.beginAnimation(this.currentVRCamera, 0, 6, false, 1);
    }

    private _workingVector = Vector3.Zero();
    private _workingQuaternion = Quaternion.Identity();
    private _workingMatrix = Matrix.Identity();

    /**
     * Time Constant Teleportation Mode
     */
    public static readonly TELEPORTATIONMODE_CONSTANTTIME = 0;
    /**
     * Speed Constant Teleportation Mode
     */
    public static readonly TELEPORTATIONMODE_CONSTANTSPEED = 1;

    /**
     * Teleports the users feet to the desired location
     * @param location The location where the user's feet should be placed
     */
    public teleportCamera(location: Vector3) {
        if (!(this.currentVRCamera instanceof FreeCamera)) {
            return;
        }
        // Teleport the hmd to where the user is looking by moving the anchor to where they are looking minus the
        // offset of the headset from the anchor.

        this._workingVector.copyFrom(location);
        // Add height to account for user's height offset
        if (this.isInVRMode) {
            // no-op
        } else {
            this._workingVector.y += this._defaultHeight;
        }

        this.onBeforeCameraTeleport.notifyObservers(this._workingVector);

        // Animations FPS
        const FPS = 90;
        let speedRatio, lastFrame;
        if (this._teleportationMode == VRExperienceHelper.TELEPORTATIONMODE_CONSTANTSPEED) {
            lastFrame = FPS;
            const dist = Vector3.Distance(this.currentVRCamera.position, this._workingVector);
            speedRatio = this._teleportationSpeed / dist;
        } else {
            // teleportationMode is TELEPORTATIONMODE_CONSTANTTIME
            lastFrame = Math.round((this._teleportationTime * FPS) / 1000);
            speedRatio = 1;
        }

        // Create animation from the camera's position to the new location
        this.currentVRCamera.animations = [];
        const animationCameraTeleportation = new Animation("animationCameraTeleportation", "position", FPS, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animationCameraTeleportationKeys = [
            {
                frame: 0,
                value: this.currentVRCamera.position,
            },
            {
                frame: lastFrame,
                value: this._workingVector,
            },
        ];

        animationCameraTeleportation.setKeys(animationCameraTeleportationKeys);
        animationCameraTeleportation.setEasingFunction(this._teleportationEasing);
        this.currentVRCamera.animations.push(animationCameraTeleportation);

        this._postProcessMove.animations = [];

        // Calculate the mid frame for vignette animations
        const midFrame = Math.round(lastFrame / 2);

        const animationPP = new Animation("animationPP", "vignetteWeight", FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const vignetteWeightKeys = [];
        vignetteWeightKeys.push({
            frame: 0,
            value: 0,
        });
        vignetteWeightKeys.push({
            frame: midFrame,
            value: 8,
        });
        vignetteWeightKeys.push({
            frame: lastFrame,
            value: 0,
        });

        animationPP.setKeys(vignetteWeightKeys);
        this._postProcessMove.animations.push(animationPP);

        const animationPP2 = new Animation("animationPP2", "vignetteStretch", FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);

        const vignetteStretchKeys = [];
        vignetteStretchKeys.push({
            frame: 0,
            value: 0,
        });
        vignetteStretchKeys.push({
            frame: midFrame,
            value: 10,
        });
        vignetteStretchKeys.push({
            frame: lastFrame,
            value: 0,
        });

        animationPP2.setKeys(vignetteStretchKeys);
        this._postProcessMove.animations.push(animationPP2);

        this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
        this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;

        this._scene.beginAnimation(this.currentVRCamera, 0, lastFrame, false, speedRatio, () => {
            this.onAfterCameraTeleport.notifyObservers(this._workingVector);
        });

        this._hideTeleportationTarget();
    }

    /**
     * Permanently set new colors for the laser pointer
     * @param color the new laser color
     * @param pickedColor the new laser color when picked mesh detected
     */
    public setLaserColor(color: Color3, pickedColor: Color3 = this._pickedLaserColor) {
        this._pickedLaserColor = pickedColor;
    }

    /**
     * Set lighting enabled / disabled on the laser pointer of both controllers
     * @param _enabled should the lighting be enabled on the laser pointer
     */
    public setLaserLightingState(_enabled: boolean = true) {
        // no-op
    }

    /**
     * Permanently set new colors for the gaze pointer
     * @param color the new gaze color
     * @param pickedColor the new gaze color when picked mesh detected
     */
    public setGazeColor(color: Color3, pickedColor: Color3 = this._pickedGazeColor) {
        this._pickedGazeColor = pickedColor;
    }

    /**
     * Sets the color of the laser ray from the vr controllers.
     * @param _color new color for the ray.
     */
    public changeLaserColor(_color: Color3) {
        if (!this.updateControllerLaserColor) {
            return;
        }
    }

    /**
     * Sets the color of the ray from the vr headsets gaze.
     * @param color new color for the ray.
     */
    public changeGazeColor(color: Color3) {
        if (!this.updateGazeTrackerColor) {
            return;
        }
        if (!(<StandardMaterial>this._cameraGazer._gazeTracker.material)) {
            return;
        }
        (<StandardMaterial>this._cameraGazer._gazeTracker.material).emissiveColor = color;
    }

    /**
     * Exits VR and disposes of the vr experience helper
     */
    public dispose() {
        if (this.isInVRMode) {
            this.exitVR();
        }

        if (this._postProcessMove) {
            this._postProcessMove.dispose();
        }

        if (this._vrDeviceOrientationCamera) {
            this._vrDeviceOrientationCamera.dispose();
        }
        if (!this._useCustomVRButton && this._btnVR && this._btnVR.parentNode) {
            document.body.removeChild(this._btnVR);
        }

        if (this._deviceOrientationCamera && this._scene.activeCamera != this._deviceOrientationCamera) {
            this._deviceOrientationCamera.dispose();
        }

        if (this._cameraGazer) {
            this._cameraGazer.dispose();
        }

        if (this._teleportationTarget) {
            this._teleportationTarget.dispose();
        }

        if (this.xr) {
            this.xr.dispose();
        }

        this._floorMeshesCollection.length = 0;

        document.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("vrdisplaypresentchange", this._onVrDisplayPresentChangeBind);

        window.removeEventListener("resize", this._onResize);
        document.removeEventListener("fullscreenchange", this._onFullscreenChange);

        this._scene.gamepadManager.onGamepadConnectedObservable.removeCallback(this._onNewGamepadConnected);

        this._scene.unregisterBeforeRender(this._beforeRender);
    }

    /**
     * Gets the name of the VRExperienceHelper class
     * @returns "VRExperienceHelper"
     */
    public getClassName(): string {
        return "VRExperienceHelper";
    }
}
