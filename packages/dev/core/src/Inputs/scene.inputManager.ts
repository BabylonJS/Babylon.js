import type { Observable } from "../Misc/observable";
import { PointerInfoPre, PointerInfo, PointerEventTypes } from "../Events/pointerEvents";
import type { Nullable } from "../types";
import { AbstractActionManager } from "../Actions/abstractActionManager";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Vector2, Matrix } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Constants } from "../Engines/constants";
import { ActionEvent } from "../Actions/actionEvent";
import { KeyboardEventTypes, KeyboardInfoPre, KeyboardInfo } from "../Events/keyboardEvents";
import { DeviceType, PointerInput } from "../DeviceInput/InputDevices/deviceEnums";
import type { IKeyboardEvent, IMouseEvent, IPointerEvent } from "../Events/deviceInputEvents";
import { DeviceSourceManager } from "../DeviceInput/InputDevices/deviceSourceManager";
import { EngineStore } from "../Engines/engineStore";

declare type Scene = import("../scene").Scene;

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
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
    private _alreadyAttachedTo: Nullable<HTMLElement>;

    // Pointers
    private _onPointerMove: (evt: IMouseEvent) => void;
    private _onPointerDown: (evt: IPointerEvent) => void;
    private _onPointerUp: (evt: IPointerEvent) => void;

    private _initClickEvent: (
        obs1: Observable<PointerInfoPre>,
        obs2: Observable<PointerInfo>,
        evt: IPointerEvent,
        cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void
    ) => void;
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
    private _isSwiping: boolean = false;
    private _swipeButtonPressed: number = -1;

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
    private _meshUnderPointerId: { [pointerId: number]: Nullable<AbstractMesh> } = {};
    private _movePointerInfo: Nullable<PointerInfo> = null;

    // Keyboard
    private _onKeyDown: (evt: IKeyboardEvent) => void;
    private _onKeyUp: (evt: IKeyboardEvent) => void;

    private _scene: Scene;
    private _deviceSourceManager: Nullable<DeviceSourceManager> = null;

    /**
     * Creates a new InputManager
     * @param scene - defines the hosting scene
     */
    constructor(scene?: Scene) {
        this._scene = scene || <Scene>EngineStore.LastCreatedScene;
        if (!this._scene) {
            return;
        }
    }

    /**
     * Gets the mesh that is currently under the pointer
     * @returns Mesh that the pointer is pointer is hovering over
     */
    public get meshUnderPointer(): Nullable<AbstractMesh> {
        if (this._movePointerInfo) {
            // Because _pointerOverMesh is populated as part of _pickMove, we need to force a pick to update it.
            // Calling _pickMove calls _setCursorAndPointerOverMesh which calls setPointerOverMesh
            this._movePointerInfo._generatePickInfo();
            // Once we have what we need, we can clear _movePointerInfo because we don't need it anymore
            this._movePointerInfo = null;
        }
        return this._pointerOverMesh;
    }

    /**
     * When using more than one pointer (for example in XR) you can get the mesh under the specific pointer
     * @param pointerId - the pointer id to use
     * @returns The mesh under this pointer id or null if not found
     */
    public getMeshUnderPointerByPointerId(pointerId: number): Nullable<AbstractMesh> {
        return this._meshUnderPointerId[pointerId] || null;
    }

    /**
     * Gets the pointer coordinates in 2D without any translation (ie. straight out of the pointer event)
     * @returns Vector with X/Y values directly from pointer event
     */
    public get unTranslatedPointer(): Vector2 {
        return new Vector2(this._unTranslatedPointerX, this._unTranslatedPointerY);
    }

    /**
     * Gets or sets the current on-screen X position of the pointer
     * @returns Translated X with respect to screen
     */
    public get pointerX(): number {
        return this._pointerX;
    }

    public set pointerX(value: number) {
        this._pointerX = value;
    }

    /**
     * Gets or sets the current on-screen Y position of the pointer
     * @returns Translated Y with respect to screen
     */
    public get pointerY(): number {
        return this._pointerY;
    }

    public set pointerY(value: number) {
        this._pointerY = value;
    }

    private _updatePointerPosition(evt: IPointerEvent): void {
        const canvasRect = this._scene.getEngine().getInputElementClientRect();

        if (!canvasRect) {
            return;
        }

        this._pointerX = evt.clientX - canvasRect.left;
        this._pointerY = evt.clientY - canvasRect.top;

        this._unTranslatedPointerX = this._pointerX;
        this._unTranslatedPointerY = this._pointerY;
    }

    private _processPointerMove(pickResult: Nullable<PickingInfo>, evt: IPointerEvent) {
        const scene = this._scene;
        const engine = scene.getEngine();
        const canvas = engine.getInputElement();

        if (canvas) {
            canvas.tabIndex = engine.canvasTabIndex;

            // Restore pointer
            if (!scene.doNotHandleCursors) {
                canvas.style.cursor = scene.defaultCursor;
            }
        }

        this._setCursorAndPointerOverMesh(pickResult, evt.pointerId, scene);

        for (const step of scene._pointerMoveStage) {
            const isMeshPicked = pickResult?.pickedMesh ? true : false;
            pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, isMeshPicked, canvas);
        }

        const type = evt.inputIndex >= PointerInput.MouseWheelX && evt.inputIndex <= PointerInput.MouseWheelZ ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;

        if (scene.onPointerMove) {
            // Because of lazy picking, we need to force a pick to update the pickResult
            const pr = pickResult ? pickResult : this._pickMove(evt.pointerId);
            scene.onPointerMove(evt, pr, type);
        }

        let pointerInfo: PointerInfo;
        if (pickResult) {
            pointerInfo = new PointerInfo(type, evt, pickResult);
            this._setRayOnPointerInfo(pickResult, evt);
        } else {
            pointerInfo = new PointerInfo(type, evt, null, this);
            this._movePointerInfo = pointerInfo;
        }

        if (scene.onPointerObservable.hasObservers()) {
            scene.onPointerObservable.notifyObservers(pointerInfo, type);
        }
    }

    // Pointers handling
    /** @internal */
    public _setRayOnPointerInfo(pickInfo: Nullable<PickingInfo>, event: IMouseEvent) {
        const scene = this._scene;
        if (pickInfo && scene._pickingAvailable) {
            if (!pickInfo.ray) {
                pickInfo.ray = scene.createPickingRay(event.offsetX, event.offsetY, Matrix.Identity(), scene.activeCamera);
            }
        }
    }

    private _checkPrePointerObservable(pickResult: Nullable<PickingInfo>, evt: IPointerEvent, type: number) {
        const scene = this._scene;
        const pi = new PointerInfoPre(type, evt, this._unTranslatedPointerX, this._unTranslatedPointerY);
        if (pickResult) {
            pi.originalPickingInfo = pickResult;
            pi.ray = pickResult.ray;
            if (pickResult.originMesh) {
                pi.nearInteractionPickingInfo = pickResult;
            }
        }

        scene.onPrePointerObservable.notifyObservers(pi, type);
        if (pi.skipOnPointerObservable) {
            return true;
        } else {
            return false;
        }
    }

    /** @internal */
    public _pickMove(pointerId: number): PickingInfo {
        const scene = this._scene;
        const pickResult = scene.pick(
            this._unTranslatedPointerX,
            this._unTranslatedPointerY,
            scene.pointerMovePredicate,
            false,
            scene.cameraToUseForPointers,
            scene.pointerMoveTrianglePredicate
        );

        this._setCursorAndPointerOverMesh(pickResult, pointerId, scene);

        return pickResult;
    }

    private _setCursorAndPointerOverMesh(pickResult: Nullable<PickingInfo>, pointerId: number, scene: Scene) {
        const engine = scene.getEngine();
        const canvas = engine.getInputElement();

        if (pickResult?.pickedMesh) {
            this.setPointerOverMesh(pickResult.pickedMesh, pointerId, pickResult);

            if (!scene.doNotHandleCursors && canvas && this._pointerOverMesh) {
                const actionManager = this._pointerOverMesh._getActionManagerForTrigger();
                if (actionManager && actionManager.hasPointerTriggers) {
                    canvas.style.cursor = actionManager.hoverCursor || scene.hoverCursor;
                }
            }
        } else {
            this.setPointerOverMesh(null, pointerId, pickResult);
        }
    }

    /**
     * Use this method to simulate a pointer move on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    public simulatePointerMove(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): void {
        const evt = new PointerEvent("pointermove", pointerEventInit);
        evt.inputIndex = PointerInput.Move;

        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERMOVE)) {
            return;
        }
        this._processPointerMove(pickResult, evt);
    }

    /**
     * Use this method to simulate a pointer down on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     */
    public simulatePointerDown(pickResult: PickingInfo, pointerEventInit?: PointerEventInit): void {
        const evt = new PointerEvent("pointerdown", pointerEventInit);
        evt.inputIndex = evt.button + 2;

        if (this._checkPrePointerObservable(pickResult, evt, PointerEventTypes.POINTERDOWN)) {
            return;
        }

        this._processPointerDown(pickResult, evt);
    }

    private _processPointerDown(pickResult: Nullable<PickingInfo>, evt: IPointerEvent): void {
        const scene = this._scene;
        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
            this._pickedDownMesh = pickResult.pickedMesh;
            const actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
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
                        const pickResult = scene.pick(
                            this._unTranslatedPointerX,
                            this._unTranslatedPointerY,
                            (mesh: AbstractMesh): boolean =>
                                <boolean>(
                                    (mesh.isPickable &&
                                        mesh.isVisible &&
                                        mesh.isReady() &&
                                        mesh.actionManager &&
                                        mesh.actionManager.hasSpecificTrigger(Constants.ACTION_OnLongPressTrigger) &&
                                        mesh === this._pickedDownMesh)
                                ),
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
            for (const step of scene._pointerDownStage) {
                pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt, false);
            }
        }

        if (pickResult) {
            const type = PointerEventTypes.POINTERDOWN;

            if (scene.onPointerDown) {
                scene.onPointerDown(evt, pickResult, type);
            }

            if (scene.onPointerObservable.hasObservers()) {
                const pi = new PointerInfo(type, evt, pickResult);
                this._setRayOnPointerInfo(pickResult, evt);
                scene.onPointerObservable.notifyObservers(pi, type);
            }
        }
    }

    /**
     * @internal
     * @internals Boolean if delta for pointer exceeds drag movement threshold
     */
    public _isPointerSwiping(): boolean {
        return this._isSwiping;
    }

    /**
     * Use this method to simulate a pointer up on a mesh
     * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
     * @param pickResult - pickingInfo of the object wished to simulate pointer event on
     * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
     * @param doubleTap - indicates that the pointer up event should be considered as part of a double click (false by default)
     */
    public simulatePointerUp(pickResult: PickingInfo, pointerEventInit?: PointerEventInit, doubleTap?: boolean): void {
        const evt = new PointerEvent("pointerup", pointerEventInit);
        evt.inputIndex = PointerInput.Move;
        const clickInfo = new _ClickInfo();

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
        const scene = this._scene;
        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
            this._pickedUpMesh = pickResult.pickedMesh;
            if (this._pickedDownMesh === this._pickedUpMesh) {
                if (scene.onPointerPick) {
                    scene.onPointerPick(evt, pickResult);
                }
                if (clickInfo.singleClick && !clickInfo.ignore && scene.onPointerObservable.hasObservers()) {
                    const type = PointerEventTypes.POINTERPICK;
                    const pi = new PointerInfo(type, evt, pickResult);
                    this._setRayOnPointerInfo(pickResult, evt);
                    scene.onPointerObservable.notifyObservers(pi, type);
                }
            }
            const actionManager = pickResult.pickedMesh._getActionManagerForTrigger();
            if (actionManager && !clickInfo.ignore) {
                actionManager.processTrigger(Constants.ACTION_OnPickUpTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));

                if (!clickInfo.hasSwiped && clickInfo.singleClick) {
                    actionManager.processTrigger(Constants.ACTION_OnPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }

                const doubleClickActionManager = pickResult.pickedMesh._getActionManagerForTrigger(Constants.ACTION_OnDoublePickTrigger);
                if (clickInfo.doubleClick && doubleClickActionManager) {
                    doubleClickActionManager.processTrigger(Constants.ACTION_OnDoublePickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt, pickResult));
                }
            }
        } else {
            if (!clickInfo.ignore) {
                for (const step of scene._pointerUpStage) {
                    pickResult = step.action(this._unTranslatedPointerX, this._unTranslatedPointerY, pickResult, evt, clickInfo.doubleClick);
                }
            }
        }

        if (this._pickedDownMesh && this._pickedDownMesh !== this._pickedUpMesh) {
            const pickedDownActionManager = this._pickedDownMesh._getActionManagerForTrigger(Constants.ACTION_OnPickOutTrigger);
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
                    const pi = new PointerInfo(type, evt, pickResult);
                    this._setRayOnPointerInfo(pickResult, evt);
                    scene.onPointerObservable.notifyObservers(pi, type);
                }
            }

            if (!clickInfo.ignore) {
                type = PointerEventTypes.POINTERUP;
                const pi = new PointerInfo(type, evt, pickResult);
                this._setRayOnPointerInfo(pickResult, evt);
                scene.onPointerObservable.notifyObservers(pi, type);
            }
        }

        if (scene.onPointerUp && !clickInfo.ignore) {
            scene.onPointerUp(evt, pickResult, type);
        }
    }

    /**
     * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
     * @param pointerId - defines the pointer id to use in a multi-touch scenario (0 by default)
     * @returns true if the pointer was captured
     */
    public isPointerCaptured(pointerId = 0): boolean {
        return this._pointerCaptures[pointerId];
    }

    /**
     * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
     * @param attachUp - defines if you want to attach events to pointerup
     * @param attachDown - defines if you want to attach events to pointerdown
     * @param attachMove - defines if you want to attach events to pointermove
     * @param elementToAttachTo - defines the target DOM element to attach to (will use the canvas by default)
     */
    public attachControl(attachUp = true, attachDown = true, attachMove = true, elementToAttachTo: Nullable<HTMLElement> = null): void {
        const scene = this._scene;
        const engine = scene.getEngine();

        if (!elementToAttachTo) {
            elementToAttachTo = engine.getInputElement();
        }

        if (this._alreadyAttached) {
            this.detachControl();
        }

        if (elementToAttachTo) {
            this._alreadyAttachedTo = elementToAttachTo;
        }
        this._deviceSourceManager = new DeviceSourceManager(engine);

        // Because this is only called from _initClickEvent, which is called in _onPointerUp, we'll use the pointerUpPredicate for the pick call
        this._initActionManager = (act: Nullable<AbstractActionManager>): Nullable<AbstractActionManager> => {
            if (!this._meshPickProceed) {
                const pickResult =
                    scene.skipPointerUpPicking || (scene._registeredActions === 0 && !scene.onPointerObservable.hasObservers())
                        ? null
                        : scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerUpPredicate, false, scene.cameraToUseForPointers);
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

        this._initClickEvent = (
            obs1: Observable<PointerInfoPre>,
            obs2: Observable<PointerInfo>,
            evt: IPointerEvent,
            cb: (clickInfo: _ClickInfo, pickResult: Nullable<PickingInfo>) => void
        ): void => {
            const clickInfo = new _ClickInfo();
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
                const btn = evt.button;
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
                (evt as IPointerEvent as any).pointerId = 0;
            }

            this._updatePointerPosition(evt as IPointerEvent);

            // PreObservable support
            if (
                this._checkPrePointerObservable(
                    null,
                    evt as IPointerEvent,
                    evt.inputIndex >= PointerInput.MouseWheelX && evt.inputIndex <= PointerInput.MouseWheelZ ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE
                )
            ) {
                return;
            }

            if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                return;
            }

            if (scene.skipPointerMovePicking) {
                this._processPointerMove(new PickingInfo(), evt as IPointerEvent);
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

            // Check if pointer leaves DragMovementThreshold range to determine if swipe is occurring
            if (!this._isSwiping && this._swipeButtonPressed !== -1) {
                this._isSwiping =
                    Math.abs(this._startingPointerPosition.x - this._pointerX) > InputManager.DragMovementThreshold ||
                    Math.abs(this._startingPointerPosition.y - this._pointerY) > InputManager.DragMovementThreshold;
            }

            const pickResult = scene._registeredActions > 0 ? this._pickMove((evt as IPointerEvent).pointerId) : null;
            this._processPointerMove(pickResult, evt as IPointerEvent);
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

            if (this._swipeButtonPressed === -1) {
                this._swipeButtonPressed = evt.button;
            }

            if (scene.preventDefaultOnPointerDown && elementToAttachTo) {
                evt.preventDefault();
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
                    return (
                        mesh.isPickable &&
                        mesh.isVisible &&
                        mesh.isReady() &&
                        mesh.isEnabled() &&
                        (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0)
                    );
                };
            }

            // Meshes
            this._pickedDownMesh = null;
            let pickResult;
            if (scene.skipPointerDownPicking || (scene._registeredActions === 0 && !scene.onPointerObservable.hasObservers())) {
                pickResult = new PickingInfo();
            } else {
                pickResult = scene.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, scene.pointerDownPredicate, false, scene.cameraToUseForPointers);
            }

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

            if (scene.preventDefaultOnPointerUp && elementToAttachTo) {
                evt.preventDefault();
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
                            // If we're skipping the next observable, we need to reset the swipe state before returning
                            if (this._swipeButtonPressed === evt.button) {
                                this._isSwiping = false;
                                this._swipeButtonPressed = -1;
                            }
                            return;
                        }
                    }
                }

                this._pointerCaptures[evt.pointerId] = false;
                if (!scene.cameraToUseForPointers && !scene.activeCamera) {
                    return;
                }

                if (!scene.pointerUpPredicate) {
                    scene.pointerUpPredicate = (mesh: AbstractMesh): boolean => {
                        return (
                            mesh.isPickable &&
                            mesh.isVisible &&
                            mesh.isReady() &&
                            mesh.isEnabled() &&
                            (!scene.cameraToUseForPointers || (scene.cameraToUseForPointers.layerMask & mesh.layerMask) !== 0)
                        );
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

                if (this._swipeButtonPressed === evt.button) {
                    this._isSwiping = false;
                    this._swipeButtonPressed = -1;
                }
            });
        };

        this._onKeyDown = (evt: IKeyboardEvent) => {
            const type = KeyboardEventTypes.KEYDOWN;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnKeyboardObservable) {
                    return;
                }
            }

            if (scene.onKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }

            if (scene.actionManager) {
                scene.actionManager.processTrigger(Constants.ACTION_OnKeyDownTrigger, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };

        this._onKeyUp = (evt: IKeyboardEvent) => {
            const type = KeyboardEventTypes.KEYUP;
            if (scene.onPreKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfoPre(type, evt);
                scene.onPreKeyboardObservable.notifyObservers(pi, type);
                if (pi.skipOnKeyboardObservable) {
                    return;
                }
            }

            if (scene.onKeyboardObservable.hasObservers()) {
                const pi = new KeyboardInfo(type, evt);
                scene.onKeyboardObservable.notifyObservers(pi, type);
            }

            if (scene.actionManager) {
                scene.actionManager.processTrigger(Constants.ACTION_OnKeyUpTrigger, ActionEvent.CreateNewFromScene(scene, evt));
            }
        };

        // If a device connects that we can handle, wire up the observable
        this._deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (
                        eventData.inputIndex === PointerInput.LeftClick ||
                        eventData.inputIndex === PointerInput.MiddleClick ||
                        eventData.inputIndex === PointerInput.RightClick ||
                        eventData.inputIndex === PointerInput.BrowserBack ||
                        eventData.inputIndex === PointerInput.BrowserForward
                    ) {
                        if (attachDown && deviceSource.getInput(eventData.inputIndex) === 1) {
                            this._onPointerDown(eventData);
                        } else if (attachUp && deviceSource.getInput(eventData.inputIndex) === 0) {
                            this._onPointerUp(eventData);
                        }
                    } else if (attachMove) {
                        if (eventData.inputIndex === PointerInput.Move) {
                            this._onPointerMove(eventData);
                        } else if (
                            eventData.inputIndex === PointerInput.MouseWheelX ||
                            eventData.inputIndex === PointerInput.MouseWheelY ||
                            eventData.inputIndex === PointerInput.MouseWheelZ
                        ) {
                            this._onPointerMove(eventData);
                        }
                    }
                });
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.inputIndex === PointerInput.LeftClick) {
                        if (attachDown && deviceSource.getInput(eventData.inputIndex) === 1) {
                            this._onPointerDown(eventData);
                        } else if (attachUp && deviceSource.getInput(eventData.inputIndex) === 0) {
                            this._onPointerUp(eventData);
                        }
                    }

                    if (attachMove && eventData.inputIndex === PointerInput.Move) {
                        this._onPointerMove(eventData);
                    }
                });
            } else if (deviceSource.deviceType === DeviceType.Keyboard) {
                deviceSource.onInputChangedObservable.add((eventData) => {
                    if (eventData.type === "keydown") {
                        this._onKeyDown(eventData);
                    } else if (eventData.type === "keyup") {
                        this._onKeyUp(eventData);
                    }
                });
            }
        });

        this._alreadyAttached = true;
    }

    /**
     * Detaches all event handlers
     */
    public detachControl() {
        if (this._alreadyAttached) {
            this._deviceSourceManager!.dispose();
            this._deviceSourceManager = null;

            // Cursor
            if (this._alreadyAttachedTo && !this._scene.doNotHandleCursors) {
                this._alreadyAttachedTo.style.cursor = this._scene.defaultCursor;
            }

            this._alreadyAttached = false;
            this._alreadyAttachedTo = null;
        }
    }

    /**
     * Force the value of meshUnderPointer
     * @param mesh - defines the mesh to use
     * @param pointerId - optional pointer id when using more than one pointer. Defaults to 0
     * @param pickResult - optional pickingInfo data used to find mesh
     */
    public setPointerOverMesh(mesh: Nullable<AbstractMesh>, pointerId: number = 0, pickResult?: Nullable<PickingInfo>): void {
        if (this._meshUnderPointerId[pointerId] === mesh && (!mesh || !mesh._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting)) {
            return;
        }

        const underPointerMesh = this._meshUnderPointerId[pointerId];

        let actionManager: Nullable<AbstractActionManager>;
        if (underPointerMesh) {
            actionManager = underPointerMesh._getActionManagerForTrigger(Constants.ACTION_OnPointerOutTrigger);
            if (actionManager) {
                actionManager.processTrigger(Constants.ACTION_OnPointerOutTrigger, ActionEvent.CreateNew(underPointerMesh, undefined, { pointerId }));
            }
        }

        if (mesh) {
            this._meshUnderPointerId[pointerId] = mesh;
            this._pointerOverMesh = mesh;

            actionManager = mesh._getActionManagerForTrigger(Constants.ACTION_OnPointerOverTrigger);
            if (actionManager) {
                actionManager.processTrigger(Constants.ACTION_OnPointerOverTrigger, ActionEvent.CreateNew(mesh, undefined, { pointerId, pickResult }));
            }
        } else {
            delete this._meshUnderPointerId[pointerId];
            this._pointerOverMesh = null;
        }
    }

    /**
     * Gets the mesh under the pointer
     * @returns a Mesh or null if no mesh is under the pointer
     */
    public getPointerOverMesh(): Nullable<AbstractMesh> {
        return this.meshUnderPointer;
    }

    /**
     * @param mesh - Mesh to invalidate
     * @internal
     */
    public _invalidateMesh(mesh: AbstractMesh) {
        if (this._pointerOverMesh === mesh) {
            this._pointerOverMesh = null;
        }
        if (this._pickedDownMesh === mesh) {
            this._pickedDownMesh = null;
        }
        if (this._pickedUpMesh === mesh) {
            this._pickedUpMesh = null;
        }
        for (const pointerId in this._meshUnderPointerId) {
            if (this._meshUnderPointerId[pointerId] === mesh) {
                delete this._meshUnderPointerId[pointerId];
            }
        }
    }
}
