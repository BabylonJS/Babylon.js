import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { Observable, Observer } from "../Misc/observable";
import { PointerInfoPre, PointerInfo, PointerEventTypes } from "../Events/pointerEvents";
import { PickingInfo } from "../Collisions/pickingInfo";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { EngineStore } from "../Engines/engineStore";
import { HemisphericLight } from '../Lights/hemisphericLight';
import { Vector3 } from '../Maths/math.vector';
import { Camera } from '../Cameras/camera';
import { Color3 } from '../Maths/math.color';

/**
 * Renders a layer on top of an existing scene
 */
export class UtilityLayerRenderer implements IDisposable {
    private _pointerCaptures: { [pointerId: number]: boolean } = {};
    private _lastPointerEvents: { [pointerId: number]: boolean } = {};
    private static _DefaultUtilityLayer: Nullable<UtilityLayerRenderer> = null;
    private static _DefaultKeepDepthUtilityLayer: Nullable<UtilityLayerRenderer> = null;
    private _sharedGizmoLight: Nullable<HemisphericLight> = null;

    private _renderCamera: Nullable<Camera> = null;

    /**
     * Gets the camera that is used to render the utility layer (when not set, this will be the last active camera)
     * @param getRigParentIfPossible if the current active camera is a rig camera, should its parent camera be returned
     * @returns the camera that is used when rendering the utility layer
     */
    public getRenderCamera(getRigParentIfPossible?: boolean) {
        if (this._renderCamera) {
            return this._renderCamera;
        } else {
            let activeCam: Camera;
            if (this.originalScene.activeCameras.length > 1) {
                activeCam = this.originalScene.activeCameras[this.originalScene.activeCameras.length - 1];
            } else {
                activeCam = <Camera>(this.originalScene.activeCamera!);
            }

            if (getRigParentIfPossible && activeCam && activeCam.isRigCamera) {
                return activeCam.rigParent!;
            }
            return activeCam;
        }
    }
    /**
     * Sets the camera that should be used when rendering the utility layer (If set to null the last active camera will be used)
     * @param cam the camera that should be used when rendering the utility layer
     */
    public setRenderCamera(cam: Nullable<Camera>) {
        this._renderCamera = cam;
    }

    /**
     * @hidden
     * Light which used by gizmos to get light shading
     */
    public _getSharedGizmoLight(): HemisphericLight {
        if (!this._sharedGizmoLight) {
            this._sharedGizmoLight = new HemisphericLight("shared gizmo light", new Vector3(0, 1, 0), this.utilityLayerScene);
            this._sharedGizmoLight.intensity = 2;
            this._sharedGizmoLight.groundColor = Color3.Gray();
        }
        return this._sharedGizmoLight;
    }

    /**
     * If the picking should be done on the utility layer prior to the actual scene (Default: true)
     */
    public pickUtilitySceneFirst = true;
    /**
     * A shared utility layer that can be used to overlay objects into a scene (Depth map of the previous scene is cleared before drawing on top of it)
     */
    public static get DefaultUtilityLayer(): UtilityLayerRenderer {
        if (UtilityLayerRenderer._DefaultUtilityLayer == null) {
            UtilityLayerRenderer._DefaultUtilityLayer = new UtilityLayerRenderer(EngineStore.LastCreatedScene!);
            UtilityLayerRenderer._DefaultUtilityLayer.originalScene.onDisposeObservable.addOnce(() => {
                UtilityLayerRenderer._DefaultUtilityLayer = null;
            });
        }
        return UtilityLayerRenderer._DefaultUtilityLayer;
    }
    /**
     * A shared utility layer that can be used to embed objects into a scene (Depth map of the previous scene is not cleared before drawing on top of it)
     */
    public static get DefaultKeepDepthUtilityLayer(): UtilityLayerRenderer {
        if (UtilityLayerRenderer._DefaultKeepDepthUtilityLayer == null) {
            UtilityLayerRenderer._DefaultKeepDepthUtilityLayer = new UtilityLayerRenderer(EngineStore.LastCreatedScene!);
            UtilityLayerRenderer._DefaultKeepDepthUtilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
            UtilityLayerRenderer._DefaultKeepDepthUtilityLayer.originalScene.onDisposeObservable.addOnce(() => {
                UtilityLayerRenderer._DefaultKeepDepthUtilityLayer = null;
            });
        }
        return UtilityLayerRenderer._DefaultKeepDepthUtilityLayer;
    }

    /**
     * The scene that is rendered on top of the original scene
     */
    public utilityLayerScene: Scene;

    /**
     *  If the utility layer should automatically be rendered on top of existing scene
    */
    public shouldRender: boolean = true;
    /**
     * If set to true, only pointer down onPointerObservable events will be blocked when picking is occluded by original scene
     */
    public onlyCheckPointerDownEvents = true;

    /**
     * If set to false, only pointerUp, pointerDown and pointerMove will be sent to the utilityLayerScene (false by default)
     */
    public processAllEvents = false;

    /**
     * Observable raised when the pointer move from the utility layer scene to the main scene
     */
    public onPointerOutObservable = new Observable<number>();

    /** Gets or sets a predicate that will be used to indicate utility meshes present in the main scene */
    public mainSceneTrackerPredicate: (mesh: Nullable<AbstractMesh>) => boolean;

    private _afterRenderObserver: Nullable<Observer<Camera>>;
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _originalPointerObserver: Nullable<Observer<PointerInfoPre>>;
    /**
     * Instantiates a UtilityLayerRenderer
     * @param originalScene the original scene that will be rendered on top of
     * @param handleEvents boolean indicating if the utility layer should handle events
     */
    constructor(
        /** the original scene that will be rendered on top of */
        public originalScene: Scene,
        handleEvents: boolean = true) {
        // Create scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
        this.utilityLayerScene = new Scene(originalScene.getEngine(), { virtual: true });
        this.utilityLayerScene.useRightHandedSystem = originalScene.useRightHandedSystem;
        this.utilityLayerScene._allowPostProcessClearColor = false;

        // Detach controls on utility scene, events will be fired by logic below to handle picking priority
        this.utilityLayerScene.detachControl();

        if (handleEvents) {
            this._originalPointerObserver = originalScene.onPrePointerObservable.add((prePointerInfo, eventState) => {
                if (!this.utilityLayerScene.activeCamera) {
                    return;
                }
                if (!this.processAllEvents) {
                    if (prePointerInfo.type !== PointerEventTypes.POINTERMOVE
                        && prePointerInfo.type !== PointerEventTypes.POINTERUP
                        && prePointerInfo.type !== PointerEventTypes.POINTERDOWN
                        && prePointerInfo.type !== PointerEventTypes.POINTERDOUBLETAP) {
                        return;
                    }
                }
                this.utilityLayerScene.pointerX = originalScene.pointerX;
                this.utilityLayerScene.pointerY = originalScene.pointerY;
                let pointerEvent = <PointerEvent>(prePointerInfo.event);
                if (originalScene!.isPointerCaptured(pointerEvent.pointerId)) {
                    this._pointerCaptures[pointerEvent.pointerId] = false;
                    return;
                }

                var utilityScenePick = prePointerInfo.ray ? this.utilityLayerScene.pickWithRay(prePointerInfo.ray) : this.utilityLayerScene.pick(originalScene.pointerX, originalScene.pointerY);
                if (!prePointerInfo.ray && utilityScenePick) {
                    prePointerInfo.ray = utilityScenePick.ray;
                }

                // always fire the prepointer oversvable
                this.utilityLayerScene.onPrePointerObservable.notifyObservers(prePointerInfo);

                // allow every non pointer down event to flow to the utility layer
                if (this.onlyCheckPointerDownEvents && prePointerInfo.type != PointerEventTypes.POINTERDOWN) {
                    if (!prePointerInfo.skipOnPointerObservable) {
                        this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick));
                    }
                    if (prePointerInfo.type === PointerEventTypes.POINTERUP && this._pointerCaptures[pointerEvent.pointerId]) {
                        this._pointerCaptures[pointerEvent.pointerId] = false;
                    }
                    return;
                }

                if (this.utilityLayerScene.autoClearDepthAndStencil || this.pickUtilitySceneFirst) {
                    // If this layer is an overlay, check if this layer was hit and if so, skip pointer events for the main scene
                    if (utilityScenePick && utilityScenePick.hit) {

                        if (!prePointerInfo.skipOnPointerObservable) {
                            this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick));
                        }
                        prePointerInfo.skipOnPointerObservable = true;
                    }
                } else {
                    var originalScenePick = prePointerInfo.ray ? originalScene.pickWithRay(prePointerInfo.ray) : originalScene.pick(originalScene.pointerX, originalScene.pointerY);
                    let pointerEvent = <PointerEvent>(prePointerInfo.event);

                    // If the layer can be occluded by the original scene, only fire pointer events to the first layer that hit they ray
                    if (originalScenePick && utilityScenePick) {

                        // No pick in utility scene
                        if (utilityScenePick.distance === 0 && originalScenePick.pickedMesh) {
                            if (this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(originalScenePick.pickedMesh)) {
                                // We touched an utility mesh present in the main scene
                                this._notifyObservers(prePointerInfo, originalScenePick, pointerEvent);
                                prePointerInfo.skipOnPointerObservable = true;
                            } else if (prePointerInfo.type === PointerEventTypes.POINTERDOWN) {
                                this._pointerCaptures[pointerEvent.pointerId] = true;
                            } else if (this._lastPointerEvents[pointerEvent.pointerId]) {
                                // We need to send a last pointerup to the utilityLayerScene to make sure animations can complete
                                this.onPointerOutObservable.notifyObservers(pointerEvent.pointerId);
                                delete this._lastPointerEvents[pointerEvent.pointerId];
                            }
                        } else if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance < originalScenePick.distance || originalScenePick.distance === 0)) {
                            // We pick something in utility scene or the pick in utility is closer than the one in main scene
                            this._notifyObservers(prePointerInfo, utilityScenePick, pointerEvent);
                            // If a previous utility layer set this, do not unset this
                            if (!prePointerInfo.skipOnPointerObservable) {
                                prePointerInfo.skipOnPointerObservable = utilityScenePick.distance > 0;
                            }
                        } else if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance > originalScenePick.distance)) {
                            // We have a pick in both scenes but main is closer than utility

                            // We touched an utility mesh present in the main scene
                            if (this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(originalScenePick.pickedMesh)) {
                                this._notifyObservers(prePointerInfo, originalScenePick, pointerEvent);
                                prePointerInfo.skipOnPointerObservable = true;
                            } else if (this._lastPointerEvents[pointerEvent.pointerId]) {
                                // We need to send a last pointerup to the utilityLayerScene to make sure animations can complete
                                this.onPointerOutObservable.notifyObservers(pointerEvent.pointerId);
                                delete this._lastPointerEvents[pointerEvent.pointerId];
                            }
                        }

                        if (prePointerInfo.type === PointerEventTypes.POINTERUP && this._pointerCaptures[pointerEvent.pointerId]) {
                            this._pointerCaptures[pointerEvent.pointerId] = false;
                        }
                    }
                }
            });

            // As a newly added utility layer will be rendered over the screen last, it's pointer events should be processed first
            if (this._originalPointerObserver) {
                originalScene.onPrePointerObservable.makeObserverTopPriority(this._originalPointerObserver);
            }
        }

        // Render directly on top of existing scene without clearing
        this.utilityLayerScene.autoClear = false;

        this._afterRenderObserver = this.originalScene.onAfterCameraRenderObservable.add((camera) => {
            // Only render when the render camera finishes rendering
            if (this.shouldRender && camera == this.getRenderCamera()) {
                this.render();
            }
        });

        this._sceneDisposeObserver = this.originalScene.onDisposeObservable.add(() => {
            this.dispose();
        });

        this._updateCamera();
    }

    private _notifyObservers(prePointerInfo: PointerInfoPre, pickInfo: PickingInfo, pointerEvent: PointerEvent) {
        if (!prePointerInfo.skipOnPointerObservable) {
            this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, pickInfo));
            this._lastPointerEvents[pointerEvent.pointerId] = true;
        }
    }

    /**
     * Renders the utility layers scene on top of the original scene
     */
    public render() {
        this._updateCamera();
        if (this.utilityLayerScene.activeCamera) {
            // Set the camera's scene to utility layers scene
            var oldScene = this.utilityLayerScene.activeCamera.getScene();
            var camera = this.utilityLayerScene.activeCamera;
            camera._scene = this.utilityLayerScene;
            if (camera.leftCamera) {
                camera.leftCamera._scene = this.utilityLayerScene;
            }
            if (camera.rightCamera) {
                camera.rightCamera._scene = this.utilityLayerScene;
            }

            this.utilityLayerScene.render(false);

            // Reset camera's scene back to original
            camera._scene = oldScene;
            if (camera.leftCamera) {
                camera.leftCamera._scene = oldScene;
            }
            if (camera.rightCamera) {
                camera.rightCamera._scene = oldScene;
            }
        }

    }

    /**
     * Disposes of the renderer
     */
    public dispose() {
        this.onPointerOutObservable.clear();

        if (this._afterRenderObserver) {
            this.originalScene.onAfterCameraRenderObservable.remove(this._afterRenderObserver);
        }
        if (this._sceneDisposeObserver) {
            this.originalScene.onDisposeObservable.remove(this._sceneDisposeObserver);
        }
        if (this._originalPointerObserver) {
            this.originalScene.onPrePointerObservable.remove(this._originalPointerObserver);
        }
        this.utilityLayerScene.dispose();
    }

    private _updateCamera() {
        this.utilityLayerScene.cameraToUseForPointers = this.getRenderCamera();
        this.utilityLayerScene.activeCamera = this.getRenderCamera();
    }
}
