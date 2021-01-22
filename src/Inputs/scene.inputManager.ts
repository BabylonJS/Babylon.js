import { Observable } from "../Misc/observable";
import { PointerInfoPre, PointerInfo, PointerEventTypes } from "../Events/pointerEvents";
import { Nullable } from "../types";
import { AbstractActionManager } from "../Actions/abstractActionManager";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Vector2, Matrix } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Constants } from "../Engines/constants";
import { ActionEvent } from "../Actions/actionEvent";
import { KeyboardEventTypes, KeyboardInfoPre, KeyboardInfo } from "../Events/keyboardEvents";
import { DeviceType, PointerInput } from '../DeviceInput/InputDevices/deviceEnums';
import { EventConstants, IKeyboardEvent, IMouseEvent, IPointerEvent, IWheelEvent } from '../Events/deviceInputEvents';
import { DeviceInputSystem } from '../DeviceInput/deviceInputSystem';

declare type Scene = import("../scene").Scene;

/** @hidden */
class _ClickInfo {
    private _singleClick = false;
    private _doubleClick = false;
    private _hasSwiped = false;
    private _ignore = false;

    public get singleClick(): boolean {
        return this._singleClick;
    }
    public get doubleClick(): boolean {
        return this._doubleClick;
    }
    public get hasSwiped(): boolean {
        return this._hasSwiped;
    }
    public get ignore(): boolean {
        return this._ignore;
    }

    public set singleClick(b: boolean) {
        this._singleClick = b;
    }
    public set doubleClick(b: boolean) {
        this._doubleClick = b;
    }
    public set hasSwiped(b: boolean) {
        this._hasSwiped = b;
    }
    public set ignore(b: boolean) {
        this._ignore = b;
    }
}

/**
 * Class used to manage all inputs for the scene.
 */
export class InputManager {
    /** The distance in pixel that you have to move to prevent some events */
    public static DragMovementThreshold = 10; // in pixels
    /** Time in milliseconds to wait to raise long press events if button is still pressed */
    public static LongPressDelay = 500; // in milliseconds
    /** Time in milliseconds with two consecutive clicks will be considered as a double click */
    public static DoubleClickDelay = 300; // in milliseconds
    /** If you need to check double click without raising a single click at first click, enable this flag */
    public static ExclusiveDoubleClickMode = false;

    /** This is a defensive check to not allow control attachment prior to an already active one. If already attached, previous control is unattached before attaching the new one. */
    private _alreadyAttached = false;
    private _alreadyAttachedTo: HTMLElement;

    // Pointers
    private _onPointerMove: (evt: IMouseEvent) => void;
    private _onPointerDown: (evt: IPointerEvent) => void;
    private _onPointerUp: (evt: IPointerEvent) => void;

    private _initClickEvent: (obs1: Observable<PointerInfoPre>, obs2: Observable<PointerInfo>, evt: IPointerEvent, cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void) => void;
    private _initActionManager: (act: Nullable<AbstractActionManager>, clickInfo: _ClickInfo) => Nullable<AbstractActionManager>;
    private _delayedSimpleClick: (btn: number, clickInfo: _ClickInfo, cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void) => void;
    private _delayedSimpleClickTimeout: number;
    private _previousDelayedSimpleClickTimeout: number;
    private _meshPickProceed = false;

    private _previousButtonPressed: number;
    private _currentPickResult: Nullable<PickingInfo> = null;
    private _previousPickResult: Nullable<PickingInfo> = null;
    private _totalPointersPressed = 0;
    private _doubleClickOccured = false;

    private _pointerOverMesh: Nullable<AbstractMesh>;

    private _pickedDownMesh: Nullable<AbstractMesh>;
    private _pickedUpMesh: Nullable<AbstractMesh>;

    private _pointerX: number = 0;
    private _pointerY: number = 0;
    private _unTranslatedPointerX: number;
    private _unTranslatedPointerY: number;
    private _startingPointerPosition = new Vector2(0, 0);
    private _previousStartingPointerPosition = new Vector2(0, 0);
    private _startingPointerTime = 0;
    private _previousStartingPointerTime = 0;
    private _pointerCaptures: { [pointerId: number]: boolean } = {};
    private _meshUnderPointerId: Nullable<AbstractMesh>[] = [];

    // Keyboard
    private _onKeyDown: (evt: IKeyboardEvent) => void;
    private _onKeyUp: (evt: IKeyboardEvent) => void;

    private _scene: Scene;
    private _deviceInputSystem: DeviceInputSystem;

    /**
     * Creates a new InputManager
     * @param scene defines the hosting scene
     */
    public constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Gets the mesh that is currently under the pointer
     */
    public get meshUnderPointer(): Nullable<AbstractMesh> {
        return this._pointerOverMesh;
    }

    /**
     * When using more than one pointer (for example in XR) you can get the mesh under the specific pointer
     * @param pointerId the pointer id to use
     * @returns The mesh under this pointer id or null if not found
     */
    public getMeshUnderPointerByPointerId(pointerId: number): Nullable<AbstractMesh> {
        return this._meshUnderPointerId[pointerId];
    }

    /**
     * Gets the pointer coordinates in 2D without any translation (ie. straight out of the pointer event)
     */
    public get unTranslatedPointer(): Vector2 {
        return new Vector2(this._unTranslatedPointerX, this._unTranslatedPointerY);
    }

    /**
     * Gets or sets the current on-screen X position of the pointer
     */
    public get pointerX(): number {
        return this._pointerX;
    }

    public set pointerX(value: number) {
        this._pointerX = value;
    }

    /**
     * Gets or sets the current on-screen Y position of the pointer
     */
    public get pointerY(): number {
        return this._pointerY;
    }

    public set pointerY(value: number) {
        this._pointerY = value;
    }

    private _updatePointerPosition(evt: IPointerEvent): void {
        var canvasRect = this._scene.getEngine().getInputElementClientRect();

        if (!canvasRect) {
            return;
        }

        this._pointerX = evt.clientX - canvasRect.left;
        this._pointerY = evt.clientY - canvasRect.top;

        this._unTranslatedPointerX = this._pointerX;
        this._unTranslatedPointerY = this._pointerY;
    }

    private _processPointerMove(pickResult: Nullable<PickingInfo>, evt: IPointerEvent) {
        let scene = this._scene;
        let engine = scene.getEngine();
        var canvas = engine.getInputElement();

        if (!canvas) {
            return;
        }

        canvas.tabIndex = engine.canvasTabIndex;

        // Restore pointer
        if (!scene.doNotHandleCursors) {
            canvas.style.cursor = scene.defaultCursor;
        }

        var isMeshPicked = pickResult && pickResult.hit && pickResult.pickedMesh ? true : false;
        if (isMeshPicked) {
            scene.setPointerOverMesh(pickResult!.pickedMesh, evt.pointerId);

            if (this._pointerOverMesh && this._pointerOverMesh.actionManager && this._pointerOverMesh.actionManager.hasPointerTriggers) {
                if (!scene.doNotHandleCursors) {
                    if (this._pointerOverMesh.actionManager.hoverCursor) {
                        canvas.style.cursor = this._pointerOverMesh.actionManager.hoverCursor;
                    } else {
                        canvas.style.cursor = scene.hoverCursor;
                    }
                }
            }
        } else {
            scene.setPointerOverMesh(null, evt.pointerId);
        }

        for (let step of scene._pointerMoveStage) {
            pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, isMeshPicked, canvas);
        }

        if (pickResult) {
            let type = evt.type === "wheel" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;

            if (scene.onPointerMove) {
                scene.onPointerMove(evt, pickResult, type);
            }

            if (scene.onPointerObservable.hasObservers()) {
                let pi = new PointerInfo(type, evt, pickResult);
                this._setRayOnPointerInfo(pi);
                scene.onPointerObservable.notifyObservers(pi, type);
            }
        }
    }

    // Pointers handling
    private _setRayOnPointerInfo(pointerInfo: PointerInfo) {
        let scene = this._scene;
        if (pointerInfo.pickInfo && !pointerInfo.pickInfo._pickingUnavailable) {
            if (!pointerInfo.pickInfo.ray) {
                pointerInfo.pickInfo.ray = scene.createPickingRay(pointerInfo.event.offsetX, pointerInfo.event.offsetY, Matrix.Identity(), scene.activeCamera);
            }
        }
    }

    private _checkPrePointerObservable(pickResult: Nullable<PickingInfo>, evt: IPointerEvent, type: number) {
        let scene = this._scene;
        let pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
        if (pickResult) {
            pi.ray = pickResult.ray;
        }
        scene.onPrePointerObservable.notifyObservers(pi, type);
        if (pi.skipOnPointerObservable) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Use this method to simulate a pointer move on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    public simulatePointerMove(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): void {
        let evt = new PointerEvent("pointermove", pointerEventInit);

        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERMOVE)) {
            return;
        }
        this._processPointerMove(pickResult, evt);
    }

    /**
     * Use this method to simulate a pointer down on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    public simulatePointerDown(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): void {
        let evt = new PointerEvent("pointerdown", pointerEventInit);

        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERDOWN)) {
            return;
        }

        this._processPointerDown(pickResult, evt);
    }

    private _processPointerDown(pickResult: Nullable<PickingInfo>, evt: IPointerEvent): void {
        let scene = this._scene;
        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
            this._pickedDownMesh = pickResult.pickedMesh;
            var actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
            if (actionManager) {
                if (actionManager.hasPickTriggers) {
                    actionManager.processTrigger(Constants.ACTION_OnPickDownTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                    switch (evt.button) {
                        case 0:
                            actionManager.processTrigger(Constants.ACTION_OnLeftPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                            break;
                        case 1:
                            actionManager.processTrigger(Constants.ACTION_OnCenterPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                            break;
                        case 2:
                            actionManager.processTrigger(Constants.ACTION_OnRightPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                            break;
                    }
                }

                if (actionManager.hasSpecificTrigger(Constants.ACTION_OnLongPressTrigger)) {
                    window.setTimeout(() => {
                        var pickResult = scene.pick(
                            this._unTranslatedPointerX,
                            this._unTranslatedPointerY,
                            (mesh: AbstractMesh): boolean => <boolean>(mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasSpecificTrigger(Constants.ACTION_OnLongPressTrigger) && mesh === this._pickedDownMesh),
                            false,
                            scene.cameraToUseForPointers
                        );

                        if (pickResult && pickResult.hit && pickResult.pickedMesh && actionManager) {
                            if (this._totalPointersPressed !== 0 && Date.now() - this._startingPointerTime > InputManager.LongPressDelay && !this._isPointerSwiping()) {
                                this._startingPointerTime = 0;
                                actionManager.processTrigger(Constants.ACTION_OnLongPressTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                            }
                        }
                    }, InputManager.LongPressDelay);
                }
            }
        } else {
            for (let step of scene._pointerDownStage) {
                pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt);
            }
        }

        if (pickResult) {
            let type = PointerEventTypes.POINTERDOWN;

            if (scene.onPointerDown) {
                scene.onPointerDown(evt, pickResult, type);
            }

            if (scene.onPointerObservable.hasObservers()) {
                let pi = new PointerInfo(type, evt, pickResult);
                this._setRayOnPointerInfo(pi);
                scene.onPointerObservable.notifyObservers(pi, type);
            }
        }
    }

    /** @hidden */
    public _isPointerSwiping(): boolean {
        return Math.abs(this._startingPointerPosition.x - this._pointerX) > InputManager.DragMovementThreshold || Math.abs(this._startingPointerPosition.y - this._pointerY) > InputManager.DragMovementThreshold;
    }

    /**
     * Use this method to simulate a pointer up on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @param doubleTap indicates that the pointer up event should be considered as part of a double click (false by default)
     */
    public simulatePointerUp(pickResult: PickingInfo, pointerEventInit?: PointerEventInit, doubleTap?: boolean): void {
        let evt = new PointerEvent("pointerup", pointerEventInit);
        let clickInfo = new _ClickInfo();

        if (doubleTap) {
            clickInfo.doubleClick = true;
        } else {
            clickInfo.singleClick = true;
        }

        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERUP)) {
            return;
        }

        this._processPointerUp(pickResult, evt, clickInfo);
    }

    private _processPointerUp(pickResult: Nullable<PickingInfo>, evt: IPointerEvent, clickInfo: _ClickInfo): void {
        let scene = this._scene;
        if (pickResult && pickResult && pickResult.pickedMesh) {
            this._pickedUpMesh = pickResult.pickedMesh;
            if (this._pickedDownMesh === this._pickedUpMesh) {
                if (scene.onPointerPick) {
                    scene.onPointerPick(evt, pickResult);
                }
                if (clickInfo.singleClick && !clickInfo.ignore && scene.onPointerObservable.hasObservers()) {
                    let type = PointerEventTypes.POINTERPICK;
                    let pi = new PointerInfo(type, evt, pickResult);
                    this._setRayOnPointerInfo(pi);
                    scene.onPointerObservable.notifyObservers(pi, type);
                }
            }
            let actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
            if (actionManager && !clickInfo.ignore) {
                actionManager.processTrigger(Constants.ACTION_OnPickUpTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));

                if (!clickInfo.hasSwiped && clickInfo.singleClick) {
                    actionManager.processTrigger(Constants.ACTION_OnPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }

                let doubleClickActionManager = pickResult.pickedMesh._getActionManagerForTrigger(Constants.ACTION_OnDoublePickTrigger);
                if (clickInfo.doubleClick && doubleClickActionManager) {
                    doubleClickActionManager.processTrigger(Constants.ACTION_OnDoublePickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }
            }
        } else {
            if (!clickInfo.ignore) {
                for (let step of scene._pointerUpStage) {
                    pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt);
                }
            }
        }

        if (this._pickedDownMesh && this._pickedDownMesh !== this._pickedUpMesh) {
            let pickedDownActionManager = this._pickedDownMesh._getActionManagerForTrigger(Constants.ACTION_OnPickOutTrigger);
            if (pickedDownActionManager) {
                pickedDownActionManager.processTrigger(Constants.ACTION_OnPickOutTrigger, ActionEvent.CreateNew(this._pickedDownMesh, evt));
            }
        }

        let type = 0;
        if (scene.onPointerObservable.hasObservers()) {
            if (!clickInfo.ignore && !clickInfo.hasSwiped) {
                if (clickInfo.singleClick && scene.onPointerObservable.hasSpecificMask(PointerEventTypes.POINTERTAP)) {
                    type = PointerEventTypes.POINTERTAP;
                } else if (clickInfo.doubleClick && scene.onPointerObservable.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP)) {
                    type = PointerEventTypes.POINTERDOUBLETAP;
                }
                if (type) {
                    let pi = new PointerInfo(type, evt, pickResult);
                    this._setRayOnPointerInfo(pi);
                    scene.onPointerObservable.notifyObservers(pi, type);
                }
            }

            if (!clickInfo.ignore) {
                type = PointerEventTypes.POINTERUP;

                let pi = new PointerInfo(type, evt, pickResult);
                this._setRayOnPointerInfo(pi);
                scene.onPointerObservable.notifyObservers(pi, type);
            }
        }

        if (scene.onPointerUp && !clickInfo.ignore) {
            scene.onPointerUp(evt, pickResult, type);
        }
    }

    /**
     * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
     * @param pointerId defines the pointer id to use in a multi-touch scenario (0 by default)
     * @returns true if the pointer was captured
     */
    public isPointerCaptured(pointerId = 0): boolean {
        return this._pointerCaptures[pointerId];
    }

    /**
     * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
     * @param attachUp defines if you want to attach events to pointerup
     * @param attachDown defines if you want to attach events to pointerdown
     * @param attachMove defines if you want to attach events to pointermove
     * @param elementToAttachTo defines the target DOM element to attach to (will use the canvas by default)
     */
    public attachControl(attachUp = true, attachDown = true, attachMove = true, elementToAttachTo: Nullable<HTMLElement> = null): void {
        let scene = this._scene;

        if (!elementToAttachTo) {
            elementToAttachTo = scene.getEngine().getInputElement();
        }

        if (!elementToAttachTo) {
            return;
        }

        if (this._alreadyAttached) {
            this.detachControl();
        }
        this._alreadyAttachedTo = elementToAttachTo;
        let engine = scene.getEngine();

        this._deviceInputSystem = DeviceInputSystem.Create(engine);

        this._initActionManager = (act: Nullable<AbstractActionManager>, clickInfo: _ClickInfo): Nullable<AbstractActionManager> => {
            if (!this._meshPickProceed) {
                let pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerDownPredicate, false, scene.cameraToUseForPointers);
                this._currentPickResult = pickResult;
                if (pickResult) {
                    act = pickResult.hit && pickResult.pickedMesh ? pickResult.pickedMesh._getActionManagerForTrigger() : null;
                }
                this._meshPickProceed = true;
            }
            return act;
        };

        this._delayedSimpleClick = (btn: number, clickInfo: _ClickInfo, cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void) => {
            // double click delay is over and that no double click has been raised since, or the 2 consecutive keys pressed are different
            if ((Date.now() - this._previousStartingPointerTime > InputManager.DoubleClickDelay && !this._doubleClickOccured) || btn !== this._previousButtonPressed) {
                this._doubleClickOccured = false;
                clickInfo.singleClick = true;
                clickInfo.ignore = false;
                cb(clickInfo, this._currentPickResult);
            }
        };

        this._initClickEvent = (obs1: Observable<PointerInfoPre>, obs2: Observable<PointerInfo>, evt: IPointerEvent, cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void): void => {
            let clickInfo = new _ClickInfo();
            this._currentPickResult = null;
            let act: Nullable<AbstractActionManager> = null;

            let checkPicking =
                obs1.hasSpecificMask(PointerEventTypes.POINTERPICK) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERPICK) ||
                obs1.hasSpecificMask(PointerEventTypes.POINTERTAP) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERTAP) ||
                obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) ||
                obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
            if (!checkPicking && AbstractActionManager) {
                act = this._initActionManager(act, clickInfo);
                if (act) {
                    checkPicking = act.hasPickTriggers;
                }
            }

            let needToIgnoreNext = false;

            if (checkPicking) {
                let btn = evt.button;
                clickInfo.hasSwiped = this._isPointerSwiping();

                if (!clickInfo.hasSwiped) {
                    let checkSingleClickImmediately = !InputManager.ExclusiveDoubleClickMode;

                    if (!checkSingleClickImmediately) {
                        checkSingleClickImmediately = !obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) && !obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);

                        if (checkSingleClickImmediately && !AbstractActionManager.HasSpecificTrigger(Constants.ACTION_OnDoublePickTrigger)) {
                            act = this._initActionManager(act, clickInfo);
                            if (act) {
                                checkSingleClickImmediately = !act.hasSpecificTrigger(Constants.ACTION_OnDoublePickTrigger);
                            }
                        }
                    }

                    if (checkSingleClickImmediately) {
                        // single click detected if double click delay is over or two different successive keys pressed without exclusive double click or no double click required
                        if (Date.now() - this._previousStartingPointerTime > InputManager.DoubleClickDelay || btn !== this._previousButtonPressed) {
                            clickInfo.singleClick = true;
                            cb(clickInfo, this._currentPickResult);
                            needToIgnoreNext = true;
                        }
                    }
                    // at least one double click is required to be check and exclusive double click is enabled
                    else {
                        // wait that no double click has been raised during the double click delay
                        this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;
                        this._delayedSimpleClickTimeout = window.setTimeout(this._delayedSimpleClick.bind(this, btn, clickInfo, cb), InputManager.DoubleClickDelay);
                    }

                    let checkDoubleClick = obs1.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP) || obs2.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP);
                    if (!checkDoubleClick && AbstractActionManager.HasSpecificTrigger(Constants.ACTION_OnDoublePickTrigger)) {
                        act = this._initActionManager(act, clickInfo);
                        if (act) {
                            checkDoubleClick = act.hasSpecificTrigger(Constants.ACTION_OnDoublePickTrigger);
                        }
                    }
                    if (checkDoubleClick) {
                        // two successive keys pressed are equal, double click delay is not over and double click has not just occurred
                        if (btn === this._previousButtonPressed && Date.now() - this._previousStartingPointerTime < InputManager.DoubleClickDelay && !this._doubleClickOccured) {
                            // pointer has not moved for 2 clicks, it's a double click
                            if (!clickInfo.hasSwiped && !this._isPointerSwiping()) {
                                this._previousStartingPointerTime = 0;
                                this._doubleClickOccured = true;
                                clickInfo.doubleClick = true;
                                clickInfo.ignore = false;
                                if (InputManager.ExclusiveDoubleClickMode && this._previousDelayedSimpleClickTimeout) {
                                    clearTimeout(this._previousDelayedSimpleClickTimeout);
                                }
                                this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;
                                cb(clickInfo, this._currentPickResult);
                            }
                            // if the two successive clicks are too far, it's just two simple clicks
                            else {
                                this._doubleClickOccured = false;
                                this._previousStartingPointerTime = this._startingPointerTime;
                                this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                                this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                                this._previousButtonPressed = btn;
                                if (InputManager.ExclusiveDoubleClickMode) {
                                    if (this._previousDelayedSimpleClickTimeout) {
                                        clearTimeout(this._previousDelayedSimpleClickTimeout);
                                    }
                                    this._previousDelayedSimpleClickTimeout = this._delayedSimpleClickTimeout;

                                    cb(clickInfo, this._previousPickResult);
                                } else {
                                    cb(clickInfo, this._currentPickResult);
                                }
                            }
                            needToIgnoreNext = true;
                        }
                        // just the first click of the double has been raised
                        else {
                            this._doubleClickOccured = false;
                            this._previousStartingPointerTime = this._startingPointerTime;
                            this._previousStartingPointerPosition.x = this._startingPointerPosition.x;
                            this._previousStartingPointerPosition.y = this._startingPointerPosition.y;
                            this._previousButtonPressed = btn!;
                        }
                    }
                }
            }

            if (!needToIgnoreNext) {
                cb(clickInfo, this._currentPickResult);
            }
        };

        this._onPointerMove = (evt: IMouseEvent) => {
            // preserve compatibility with Safari when pointerId is not present
            if ((evt as IPointerEvent).pointerId === undefined) {
                ((evt as IPointerEvent) as any).pointerId = 0;
            }

            this._updatePointerPosition((evt as IPointerEvent));

            // PreObservable support
            if (this._checkPrePointerObservable(null, (evt as IPointerEvent), evt.type === "wheel" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE)) {
                return;
            }

            if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                return;
            }

            if (!scene.pointerMovePredicate) {
                scene.pointerMovePredicate = (mesh: AbstractMesh): boolean =>
                    mesh.isPickable &&
                    mesh.isVisible &&
                    mesh.isReady() &&
                    mesh.isEnabled() &&
                    (mesh.enablePointerMoveEvents || scene.constantlyUpdateMeshUnderPointer || mesh._getActionManagerForTrigger() !== null) &&
                    (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0);
            }

            // Meshes
            var pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerMovePredicate, false, scene.cameraToUseForPointers);

            this._processPointerMove(pickResult, (evt as IPointerEvent));
        };

        this._onPointerDown = (evt: IPointerEvent) => {
            this._totalPointersPressed++;
            this._pickedDownMesh = null;
            this._meshPickProceed = false;

            // preserve compatibility with Safari when pointerId is not present
            if (evt.pointerId === undefined) {
                (evt as any).pointerId = 0;
            }

            this._updatePointerPosition(evt);

            if (scene.preventDefaultOnPointerDown && elementToAttachTo) { // TODO: DO WE NEED THIS?
                elementToAttachTo.focus();
            }

            this._startingPointerPosition.x = this._pointerX;
            this._startingPointerPosition.y = this._pointerY;
            this._startingPointerTime = Date.now();

            // PreObservable support
            if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERDOWN)) {
                return;
            }

            if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                return;
            }

            this._pointerCaptures[evt.pointerId] = true;

            if (!scene.pointerDownPredicate) {
                scene.pointerDownPredicate = (mesh: AbstractMesh): boolean => {
                    return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled() && (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0);
                };
            }

            // Meshes
            this._pickedDownMesh = null;
            var pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerDownPredicate, false, scene.cameraToUseForPointers);

            this._processPointerDown(pickResult, evt);
        };

        this._onPointerUp = (evt: IPointerEvent) => {
            if (this._totalPointersPressed === 0) {
                // We are attaching the pointer up to windows because of a bug in FF
                return; // So we need to test it the pointer down was pressed before.
            }

            this._totalPointersPressed--;
            this._pickedUpMesh = null;
            this._meshPickProceed = false;

            // preserve compatibility with Safari when pointerId is not present
            if (evt.pointerId === undefined) {
                (evt as any).pointerId = 0;
            }

            this._updatePointerPosition(evt);

            if (scene.preventDefaultOnPointerUp && elementToAttachTo) { // TODO: DO WE NEED THIS?
                elementToAttachTo.focus();
            }

            this._initClickEvent(scene.onPrePointerObservable, scene.onPointerObservable, evt, (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => {
                // PreObservable support
                if (scene.onPrePointerObservable.hasObservers()) {
                    if (!clickInfo.ignore) {
                        if (!clickInfo.hasSwiped) {
                            if (clickInfo.singleClick && scene.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERTAP)) {
                                if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERTAP)) {
                                    return;
                                }
                            }
                            if (clickInfo.doubleClick && scene.onPrePointerObservable.hasSpecificMask(PointerEventTypes.POINTERDOUBLETAP)) {
                                if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERDOUBLETAP)) {
                                    return;
                                }
                            }
                        }
                        if (this._checkPrePointerObservable(null, evt, PointerEventTypes.POINTERUP)) {
                            return;
                        }
                    }
                }

                if (!this._pointerCaptures[evt.pointerId]) {
                    return;
                }

                this._pointerCaptures[evt.pointerId] = false;
                if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                    return;
                }

                if (!scene.pointerUpPredicate) {
                    scene.pointerUpPredicate = (mesh: AbstractMesh): boolean => {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled() && (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0);
                    };
                }

                // Meshes
                if (!this._meshPickProceed && ((AbstractActionManager && AbstractActionManager.HasTriggers) || scene.onPointerObservable.hasObservers())) {
                    this._initActionManager(null, clickInfo);
                }
                if (!pickResult) {
                    pickResult = this._currentPickResult;
                }

                this._processPointerUp(pickResult, evt, clickInfo);

                this._previousPickResult = this._currentPickResult;
            });
        };

        this._onKeyDown = (evt: IKeyboardEvent) => {
            let type = KeyboardEventTypes.KEYDOWN;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                let pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnPointerObservable) {
                    return;
                }
            }

            if (scene.onKeyboardObservable.hasObservers()) {
                let pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }

            if (scene.actionManager) {
                scene.actionManager.processTrigger(Constants.ACTION_OnKeyDownTrigger, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };

        this._onKeyUp = (evt: IKeyboardEvent) => {
            let type = KeyboardEventTypes.KEYUP;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                let pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnPointerObservable) {
                    return;
                }
            }

            if (scene.onKeyboardObservable.hasObservers()) {
                let pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }

            if (scene.actionManager) {
                scene.actionManager.processTrigger(Constants.ACTION_OnKeyUpTrigger, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };

        this._deviceInputSystem.onInputChanged = (deviceType, deviceSlot, inputIndex, previousState, currentState, eventData) => {
            let isKeyboardActive = this._deviceInputSystem.isDeviceAvailable(DeviceType.Keyboard);

            const altKey = (isKeyboardActive && this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_ALT_KEY) === 1);
            const ctrlKey = (isKeyboardActive && this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_CTRL_KEY) === 1);
            const metaKey = (isKeyboardActive && (this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY1) === 1
                || this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY2) === 1
                || this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_META_KEY3) === 1));
            const shiftKey = (isKeyboardActive && this._deviceInputSystem.pollInput(DeviceType.Keyboard, 0, Constants.INPUT_SHIFT_KEY) === 1);

            const evt: {[k: string]: any} = {};

            evt.target = elementToAttachTo;
            evt.preventDefault = () => { },
            evt.altKey = altKey;
            evt.ctrlKey = ctrlKey;
            evt.metaKey = metaKey;
            evt.shiftKey = shiftKey;

            // Keyboard Events
            if (deviceType === DeviceType.Keyboard) {
                evt.type = ((currentState === 1) ? "keydown" : "keyup");
                evt.key = String.fromCharCode(inputIndex);
                evt.keyCode = inputIndex;

                // If we have the actual event data, use that.  Otherwise, default to derived data.
                let currentEvent = eventData || evt;

                if (currentState === 1) {
                    this._onKeyDown((currentEvent as IKeyboardEvent));
                }

                if (currentState === 0) {
                    this._onKeyUp((currentEvent as IKeyboardEvent));
                }
            }

            // Pointer Events
            if (deviceType === DeviceType.Mouse || deviceType === DeviceType.Touch) {
                const pointerX = this._deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.Horizontal);
                const pointerY = this._deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.Vertical);
                // If dealing with a change to the delta, grab values for event init
                const movementX = (inputIndex === PointerInput.DeltaHorizontal) ? currentState : 0;
                const movementY = (inputIndex === PointerInput.DeltaVertical) ? currentState : 0;
                // Get offsets from container
                const offsetX = (inputIndex === PointerInput.DeltaHorizontal && elementToAttachTo) ? movementX! - elementToAttachTo.getBoundingClientRect().x : 0;
                const offsetY = (inputIndex === PointerInput.DeltaVertical && elementToAttachTo) ? movementY! - elementToAttachTo.getBoundingClientRect().y : 0;

                evt.pointerId = (deviceType === DeviceType.Mouse ? 1 : deviceSlot);
                evt.clientX = pointerX;
                evt.clientY = pointerY;
                evt.movementX = movementX;
                evt.movementY = movementY;
                evt.offsetX = offsetX;
                evt.offsetY = offsetY;
                evt.x = pointerX;
                evt.y = pointerY;

                if (attachDown && inputIndex >= PointerInput.LeftClick && inputIndex <= PointerInput.RightClick && currentState === 1) {   // Pointer Down
                    evt.type = "pointerdown";
                    evt.button = (inputIndex - 2);

                    let currentEvent = eventData || evt;

                    this._onPointerDown((currentEvent as IPointerEvent));
                }

                if (attachUp && inputIndex >= PointerInput.LeftClick && inputIndex <= PointerInput.RightClick && currentState === 0) {   // Pointer Up
                    evt.type = "pointerup";
                    evt.button = (inputIndex - 2);
                    let currentEvent = eventData || evt;

                    this._onPointerUp((currentEvent as IPointerEvent));
                }

                if (attachMove) {
                    if (inputIndex === PointerInput.Horizontal || inputIndex === PointerInput.Vertical || inputIndex === PointerInput.DeltaHorizontal || inputIndex === PointerInput.DeltaVertical) {
                        evt.type = "pointermove";
                        let currentEvent = eventData || evt;

                        this._onPointerMove((currentEvent as IPointerEvent));
                    }
                    else if (inputIndex === PointerInput.MouseWheelX || inputIndex === PointerInput.MouseWheelY || inputIndex === PointerInput.MouseWheelZ) {
                        /*
                         * Since wheel inputs stay until they are read, we'll read everything at once.  We'll then fire off
                         * a move event if any of them are not zero.  This will allow us to only fire off events with a proper
                         * delta.
                         */
                        const deltaX = this._deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelX);
                        const deltaY = this._deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelY);
                        const deltaZ = this._deviceInputSystem.pollInput(deviceType, deviceSlot, PointerInput.MouseWheelZ);

                        evt.type = "wheel";
                        evt.deltaMode = EventConstants.DOM_DELTA_PIXEL;
                        evt.deltaX = deltaX;
                        evt.deltaY = deltaY;
                        evt.deltaZ = deltaZ;

                        // If we have a delta, use it.
                        if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
                            let currentEvent = eventData || evt;
                            this._onPointerMove((currentEvent as IWheelEvent));
                        }
                    }
                }
            }
        };

        this._alreadyAttached = true;
    }

    /**
     * Detaches all event handlers
     */
    public detachControl() {
        if (!this._alreadyAttachedTo || !this._alreadyAttached) {
            return;
        }

        this._deviceInputSystem.dispose();

        // Cursor
        if (!this._scene.doNotHandleCursors) {
            this._alreadyAttachedTo.style.cursor = this._scene.defaultCursor;
        }

        this._alreadyAttached = false;
    }

    /**
     * Force the value of meshUnderPointer
     * @param mesh defines the mesh to use
     * @param pointerId optional pointer id when using more than one pointer. Defaults to 0
     */
    public setPointerOverMesh(mesh: Nullable<AbstractMesh>, pointerId: number = 0): void {
        // Sanity check
        if (pointerId < 0) {
            pointerId = 0;
        }
        if (this._meshUnderPointerId[pointerId] === mesh) {
            return;
        }

        let underPointerMesh = this._meshUnderPointerId[pointerId];

        let actionManager: Nullable<AbstractActionManager>;
        if (underPointerMesh) {
            actionManager = underPointerMesh._getActionManagerForTrigger(Constants.ACTION_OnPointerOutTrigger);
            if (actionManager) {
                actionManager.processTrigger(Constants.ACTION_OnPointerOutTrigger, ActionEvent.CreateNew(underPointerMesh, undefined, { pointerId }));
            }
        }

        this._meshUnderPointerId[pointerId] = mesh;
        this._pointerOverMesh = mesh;

        underPointerMesh = this._meshUnderPointerId[pointerId];
        if (underPointerMesh) {
            actionManager = underPointerMesh._getActionManagerForTrigger(Constants.ACTION_OnPointerOverTrigger);
            if (actionManager) {
                actionManager.processTrigger(Constants.ACTION_OnPointerOverTrigger, ActionEvent.CreateNew(underPointerMesh, undefined, { pointerId }));
            }
        }
    }

    /**
     * Gets the mesh under the pointer
     * @returns a Mesh or null if no mesh is under the pointer
     */
    public getPointerOverMesh(): Nullable<AbstractMesh> {
        return this._pointerOverMesh;
    }
}
