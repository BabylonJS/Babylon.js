import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { Matrix } from "core/Maths/math.vector";
import { Vector2, Vector3, TmpVectors } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";
import type { PointerInfoPre, PointerInfo, PointerInfoBase } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { ClipboardEventTypes, ClipboardInfo } from "core/Events/clipboardEvents";
import type { KeyboardInfoPre } from "core/Events/keyboardEvents";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";
import type { Camera } from "core/Cameras/camera";
import { Texture } from "core/Materials/Textures/texture";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Layer } from "core/Layers/layer";
import type { Engine } from "core/Engines/engine";
import type { Scene } from "core/scene";

import { Container } from "./controls/container";
import { Control } from "./controls/control";
import type { IFocusableControl } from "./controls/focusableControl";
import { Style } from "./style";
import { Measure } from "./measure";
import { Constants } from "core/Engines/constants";
import { Viewport } from "core/Maths/math.viewport";
import { Color3 } from "core/Maths/math.color";
import { WebRequest } from "core/Misc/webRequest";
import type { IPointerEvent, IWheelEvent } from "core/Events/deviceInputEvents";
import { RandomGUID } from "core/Misc/guid";
import { GetClass } from "core/Misc/typeStore";
import { DecodeBase64ToBinary } from "core/Misc/stringTools";

import type { StandardMaterial } from "core/Materials/standardMaterial";

/**
 * Class used to create texture to support 2D GUI elements
 * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui
 */
export class AdvancedDynamicTexture extends DynamicTexture {
    /** Define the Uurl to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    /** Indicates if some optimizations can be performed in GUI GPU management (the downside is additional memory/GPU texture memory used) */
    public static AllowGPUOptimizations = true;

    /** Snippet ID if the content was created from the snippet server */
    public snippetId: string;

    /** Observable that fires when the GUI is ready */
    public onGuiReadyObservable = new Observable<AdvancedDynamicTexture>();

    private _isDirty = false;
    private _renderObserver: Nullable<Observer<Camera>>;
    private _resizeObserver: Nullable<Observer<Engine>>;
    private _preKeyboardObserver: Nullable<Observer<KeyboardInfoPre>>;
    private _prePointerObserver: Nullable<Observer<PointerInfoPre>>;
    private _sceneRenderObserver: Nullable<Observer<Scene>>;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _canvasPointerOutObserver: Nullable<Observer<PointerEvent>>;
    private _canvasBlurObserver: Nullable<Observer<Engine>>;
    private _controlAddedObserver: Nullable<Observer<Nullable<Control>>>;
    private _controlRemovedObserver: Nullable<Observer<Nullable<Control>>>;
    private _background: string;
    /** @internal */
    public _rootContainer = new Container("root");
    /** @internal */
    public _lastPickedControl: Control;
    /** @internal */
    public _lastControlOver: { [pointerId: number]: Control } = {};
    /** @internal */
    public _lastControlDown: { [pointerId: number]: Control } = {};
    /** @internal */
    public _capturingControl: { [pointerId: number]: Control } = {};
    /** @internal */
    public _shouldBlockPointer: boolean;
    /** @internal */
    public _layerToDispose: Nullable<Layer>;
    /** @internal */
    public _linkedControls = new Array<Control>();
    /** @internal */
    public _isFullscreen = false;
    private _fullscreenViewport = new Viewport(0, 0, 1, 1);
    private _idealWidth = 0;
    private _idealHeight = 0;
    private _useSmallestIdeal: boolean = false;
    private _renderAtIdealSize = false;
    private _focusedControl: Nullable<IFocusableControl>;
    private _blockNextFocusCheck = false;
    private _renderScale = 1;
    private _rootElement: Nullable<HTMLElement>;
    private _cursorChanged = false;
    private _defaultMousePointerId = 0;
    private _rootChildrenHaveChanged: boolean = false;

    /** @internal */
    public _capturedPointerIds = new Set<number>();

    /** @internal */
    public _numLayoutCalls = 0;
    /** Gets the number of layout calls made the last time the ADT has been rendered */
    public get numLayoutCalls(): number {
        return this._numLayoutCalls;
    }

    /** @internal */
    public _numRenderCalls = 0;
    /** Gets the number of render calls made the last time the ADT has been rendered */
    public get numRenderCalls(): number {
        return this._numRenderCalls;
    }

    /**
     * Define type to string to ensure compatibility across browsers
     * Safari doesn't support DataTransfer constructor
     */
    private _clipboardData: string = "";
    /**
     * Observable event triggered each time an clipboard event is received from the rendering canvas
     */
    public onClipboardObservable = new Observable<ClipboardInfo>();
    /**
     * Observable event triggered each time a pointer down is intercepted by a control
     */
    public onControlPickedObservable = new Observable<Control>();
    /**
     * Observable event triggered before layout is evaluated
     */
    public onBeginLayoutObservable = new Observable<AdvancedDynamicTexture>();
    /**
     * Observable event triggered after the layout was evaluated
     */
    public onEndLayoutObservable = new Observable<AdvancedDynamicTexture>();
    /**
     * Observable event triggered before the texture is rendered
     */
    public onBeginRenderObservable = new Observable<AdvancedDynamicTexture>();
    /**
     * Observable event triggered after the texture was rendered
     */
    public onEndRenderObservable = new Observable<AdvancedDynamicTexture>();
    /**
     * Gets or sets a boolean defining if alpha is stored as premultiplied
     */
    public premulAlpha = false;
    /**
     * Gets or sets a boolean indicating that the canvas must be reverted on Y when updating the texture
     */
    public applyYInversionOnUpdate = true;
    /**
     * Gets or sets a number used to scale rendering size (2 means that the texture will be twice bigger).
     * Useful when you want more antialiasing
     */
    public get renderScale(): number {
        return this._renderScale;
    }
    public set renderScale(value: number) {
        if (value === this._renderScale) {
            return;
        }
        this._renderScale = value;
        this._onResize();
    }
    /** Gets or sets the background color */
    public get background(): string {
        return this._background;
    }
    public set background(value: string) {
        if (this._background === value) {
            return;
        }
        this._background = value;
        this.markAsDirty();
    }
    /**
     * Gets or sets the ideal width used to design controls.
     * The GUI will then rescale everything accordingly
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#adaptive-scaling
     */
    public get idealWidth(): number {
        return this._idealWidth;
    }
    public set idealWidth(value: number) {
        if (this._idealWidth === value) {
            return;
        }
        this._idealWidth = value;
        this.markAsDirty();
        this._rootContainer._markAllAsDirty();
    }
    /**
     * Gets or sets the ideal height used to design controls.
     * The GUI will then rescale everything accordingly
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#adaptive-scaling
     */
    public get idealHeight(): number {
        return this._idealHeight;
    }
    public set idealHeight(value: number) {
        if (this._idealHeight === value) {
            return;
        }
        this._idealHeight = value;
        this.markAsDirty();
        this._rootContainer._markAllAsDirty();
    }
    /**
     * Gets or sets a boolean indicating if the smallest ideal value must be used if idealWidth and idealHeight are both set
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#adaptive-scaling
     */
    public get useSmallestIdeal(): boolean {
        return this._useSmallestIdeal;
    }
    public set useSmallestIdeal(value: boolean) {
        if (this._useSmallestIdeal === value) {
            return;
        }
        this._useSmallestIdeal = value;
        this.markAsDirty();
        this._rootContainer._markAllAsDirty();
    }
    /**
     * Gets or sets a boolean indicating if adaptive scaling must be used
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#adaptive-scaling
     */
    public get renderAtIdealSize(): boolean {
        return this._renderAtIdealSize;
    }
    public set renderAtIdealSize(value: boolean) {
        if (this._renderAtIdealSize === value) {
            return;
        }
        this._renderAtIdealSize = value;
        this._onResize();
    }

    /**
     * Gets the ratio used when in "ideal mode"
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#adaptive-scaling
     * */
    public get idealRatio(): number {
        let rwidth: number = 0;
        let rheight: number = 0;

        if (this._idealWidth) {
            rwidth = this.getSize().width / this._idealWidth;
        }

        if (this._idealHeight) {
            rheight = this.getSize().height / this._idealHeight;
        }

        if (this._useSmallestIdeal && this._idealWidth && this._idealHeight) {
            return window.innerWidth < window.innerHeight ? rwidth : rheight;
        }

        if (this._idealWidth) {
            // horizontal
            return rwidth;
        }

        if (this._idealHeight) {
            // vertical
            return rheight;
        }

        return 1;
    }

    /**
     * Gets the underlying layer used to render the texture when in fullscreen mode
     */
    public get layer(): Nullable<Layer> {
        return this._layerToDispose;
    }
    /**
     * Gets the root container control
     */
    public get rootContainer(): Container {
        return this._rootContainer;
    }
    /**
     * Returns an array containing the root container.
     * This is mostly used to let the Inspector introspects the ADT
     * @returns an array containing the rootContainer
     */
    public getChildren(): Array<Container> {
        return [this._rootContainer];
    }
    /**
     * Will return all controls that are inside this texture
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns all child controls
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[] {
        return this._rootContainer.getDescendants(directDescendantsOnly, predicate);
    }

    /**
     * Will return all controls with the given type name
     * @param typeName defines the type name to search for
     * @returns an array of all controls found
     */
    public getControlsByType(typeName: string): Control[] {
        return this._rootContainer.getDescendants(false, (control) => control.typeName === typeName);
    }

    /**
     * Will return the first control with the given name
     * @param name defines the name to search for
     * @returns the first control found or null
     */
    public getControlByName(name: string): Nullable<Control> {
        return this._getControlByKey("name", name);
    }

    private _getControlByKey(key: string, value: any): Nullable<Control> {
        return this._rootContainer.getDescendants().find((control) => control[key as keyof Control] === value) || null;
    }

    /**
     * Gets or sets the current focused control
     */
    public get focusedControl(): Nullable<IFocusableControl> {
        return this._focusedControl;
    }
    public set focusedControl(control: Nullable<IFocusableControl>) {
        if (this._focusedControl == control) {
            return;
        }
        if (this._focusedControl) {
            this._focusedControl.onBlur();
        }
        if (control) {
            control.onFocus();
        }
        this._focusedControl = control;
    }
    /**
     * Gets or sets a boolean indicating if the texture must be rendered in background or foreground when in fullscreen mode
     */
    public get isForeground(): boolean {
        if (!this.layer) {
            return true;
        }
        return !this.layer.isBackground;
    }
    public set isForeground(value: boolean) {
        if (!this.layer) {
            return;
        }
        if (this.layer.isBackground === !value) {
            return;
        }
        this.layer.isBackground = !value;
    }
    /**
     * Gets or set information about clipboardData
     */
    public get clipboardData(): string {
        return this._clipboardData;
    }
    public set clipboardData(value: string) {
        this._clipboardData = value;
    }

    /**
     * If this is set, even when a control is pointer blocker, some events can still be passed through to the scene.
     * Options from values are PointerEventTypes
     * POINTERDOWN, POINTERUP, POINTERMOVE, POINTERWHEEL, POINTERPICK, POINTERTAP, POINTERDOUBLETAP
     */
    public skipBlockEvents = 0;

    /**
     * If set to true, every scene render will trigger a pointer event for the GUI
     * if it is linked to a mesh or has controls linked to a mesh. This will allow
     * you to catch the pointer moving around the GUI due to camera or mesh movements,
     * but it has a performance cost.
     */
    public checkPointerEveryFrame = false;
    /**
     * Creates a new AdvancedDynamicTexture
     * @param name defines the name of the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param scene defines the hosting scene
     * @param generateMipMaps defines a boolean indicating if mipmaps must be generated (false by default)
     * @param samplingMode defines the texture sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
     * @param invertY defines if the texture needs to be inverted on the y axis during loading (true by default)
     */
    constructor(name: string, width = 0, height = 0, scene?: Nullable<Scene>, generateMipMaps = false, samplingMode = Texture.NEAREST_SAMPLINGMODE, invertY = true) {
        super(name, { width: width, height: height }, scene, generateMipMaps, samplingMode, Constants.TEXTUREFORMAT_RGBA, invertY);
        scene = this.getScene();
        if (!scene || !this._texture) {
            return;
        }
        this.applyYInversionOnUpdate = invertY;
        this._rootElement = scene.getEngine().getInputElement();
        this._renderObserver = scene.onBeforeCameraRenderObservable.add((camera: Camera) => this._checkUpdate(camera));

        /** Whenever a control is added or removed to the root, we have to recheck the camera projection as it can have changed  */
        this._controlAddedObserver = this._rootContainer.onControlAddedObservable.add((control) => {
            if (control) {
                this._rootChildrenHaveChanged = true;
            }
        });
        this._controlRemovedObserver = this._rootContainer.onControlRemovedObservable.add((control) => {
            if (control) {
                this._rootChildrenHaveChanged = true;
            }
        });
        this._preKeyboardObserver = scene.onPreKeyboardObservable.add((info) => {
            if (!this._focusedControl) {
                return;
            }
            if (info.type === KeyboardEventTypes.KEYDOWN) {
                this._focusedControl.processKeyboard(info.event);
            }
            info.skipOnPointerObservable = true;
        });
        this._rootContainer._link(this);
        this.hasAlpha = true;
        if (!width || !height) {
            this._resizeObserver = scene.getEngine().onResizeObservable.add(() => this._onResize());
            this._onResize();
        }
        this._texture.isReady = true;
    }
    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "AdvancedDynamicTexture"
     */
    public getClassName(): string {
        return "AdvancedDynamicTexture";
    }
    /**
     * Function used to execute a function on all controls
     * @param func defines the function to execute
     * @param container defines the container where controls belong. If null the root container will be used
     */
    public executeOnAllControls(func: (control: Control) => void, container?: Container) {
        if (!container) {
            container = this._rootContainer;
        }
        func(container);
        for (const child of container.children) {
            if ((<any>child).children) {
                this.executeOnAllControls(func, <Container>child);
                continue;
            }
            func(child);
        }
    }

    private _useInvalidateRectOptimization = true;

    /**
     * Gets or sets a boolean indicating if the InvalidateRect optimization should be turned on
     */
    public get useInvalidateRectOptimization(): boolean {
        return this._useInvalidateRectOptimization;
    }

    public set useInvalidateRectOptimization(value: boolean) {
        this._useInvalidateRectOptimization = value;
    }

    // Invalidated rectangle which is the combination of all invalidated controls after they have been rotated into absolute position
    private _invalidatedRectangle: Nullable<Measure> = null;
    /**
     * Invalidates a rectangle area on the gui texture
     * @param invalidMinX left most position of the rectangle to invalidate in the texture
     * @param invalidMinY top most position of the rectangle to invalidate in the texture
     * @param invalidMaxX right most position of the rectangle to invalidate in the texture
     * @param invalidMaxY bottom most position of the rectangle to invalidate in the texture
     */
    public invalidateRect(invalidMinX: number, invalidMinY: number, invalidMaxX: number, invalidMaxY: number) {
        if (!this._useInvalidateRectOptimization) {
            return;
        }
        if (!this._invalidatedRectangle) {
            this._invalidatedRectangle = new Measure(invalidMinX, invalidMinY, invalidMaxX - invalidMinX + 1, invalidMaxY - invalidMinY + 1);
        } else {
            // Compute intersection
            const maxX = Math.ceil(Math.max(this._invalidatedRectangle.left + this._invalidatedRectangle.width - 1, invalidMaxX));
            const maxY = Math.ceil(Math.max(this._invalidatedRectangle.top + this._invalidatedRectangle.height - 1, invalidMaxY));
            this._invalidatedRectangle.left = Math.floor(Math.min(this._invalidatedRectangle.left, invalidMinX));
            this._invalidatedRectangle.top = Math.floor(Math.min(this._invalidatedRectangle.top, invalidMinY));
            this._invalidatedRectangle.width = maxX - this._invalidatedRectangle.left + 1;
            this._invalidatedRectangle.height = maxY - this._invalidatedRectangle.top + 1;
        }
    }
    /**
     * Marks the texture as dirty forcing a complete update
     */
    public markAsDirty() {
        this._isDirty = true;
    }
    /**
     * Helper function used to create a new style
     * @returns a new style
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#styles
     */
    public createStyle(): Style {
        return new Style(this);
    }
    /**
     * Adds a new control to the root container
     * @param control defines the control to add
     * @returns the current texture
     */
    public addControl(control: Control): AdvancedDynamicTexture {
        this._rootContainer.addControl(control);
        return this;
    }
    /**
     * Removes a control from the root container
     * @param control defines the control to remove
     * @returns the current texture
     */
    public removeControl(control: Control): AdvancedDynamicTexture {
        this._rootContainer.removeControl(control);
        return this;
    }
    /**
     * Moves overlapped controls towards a position where it is not overlapping anymore.
     * Please note that this method alters linkOffsetXInPixels and linkOffsetYInPixels.
     * @param overlapGroup the overlap group which will be processed or undefined to process all overlap groups
     * @param deltaStep the step size (speed) to reach the target non overlapping position (default 0.1)
     * @param repelFactor how much is the control repelled by other controls
     */
    public moveToNonOverlappedPosition(overlapGroup?: number | Control[], deltaStep = 1, repelFactor = 1) {
        let controlsForGroup: Control[];
        if (Array.isArray(overlapGroup)) {
            controlsForGroup = overlapGroup;
        } else {
            const descendants = this.getDescendants(true);
            // get only the controls with an overlapGroup property set
            // if the overlapGroup parameter is set, filter the controls and get only the controls belonging to that overlapGroup
            controlsForGroup = overlapGroup === undefined ? descendants.filter((c) => c.overlapGroup !== undefined) : descendants.filter((c) => c.overlapGroup === overlapGroup);
        }

        controlsForGroup.forEach((control1) => {
            let velocity = Vector2.Zero();
            const center = new Vector2(control1.centerX, control1.centerY);

            controlsForGroup.forEach((control2) => {
                if (control1 !== control2 && AdvancedDynamicTexture._Overlaps(control1, control2)) {
                    // if the two controls overlaps get a direction vector from one control's center to another control's center
                    const diff = center.subtract(new Vector2(control2.centerX, control2.centerY));
                    const diffLength = diff.length();

                    if (diffLength > 0) {
                        // calculate the velocity
                        velocity = velocity.add(diff.normalize().scale(repelFactor / diffLength));
                    }
                }
            });

            if (velocity.length() > 0) {
                // move the control along the direction vector away from the overlapping control
                velocity = velocity.normalize().scale(deltaStep * (control1.overlapDeltaMultiplier ?? 1));
                control1.linkOffsetXInPixels += velocity.x;
                control1.linkOffsetYInPixels += velocity.y;
            }
        });
    }
    /**
     * Release all resources
     */
    public dispose(): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        this._rootElement = null;
        scene.onBeforeCameraRenderObservable.remove(this._renderObserver);
        if (this._resizeObserver) {
            scene.getEngine().onResizeObservable.remove(this._resizeObserver);
        }
        if (this._prePointerObserver) {
            scene.onPrePointerObservable.remove(this._prePointerObserver);
        }
        if (this._sceneRenderObserver) {
            scene.onBeforeRenderObservable.remove(this._sceneRenderObserver);
        }
        if (this._pointerObserver) {
            scene.onPointerObservable.remove(this._pointerObserver);
        }
        if (this._preKeyboardObserver) {
            scene.onPreKeyboardObservable.remove(this._preKeyboardObserver);
        }
        if (this._canvasPointerOutObserver) {
            scene.getEngine().onCanvasPointerOutObservable.remove(this._canvasPointerOutObserver);
        }
        if (this._canvasBlurObserver) {
            scene.getEngine().onCanvasBlurObservable.remove(this._canvasBlurObserver);
        }
        if (this._controlAddedObserver) {
            this._rootContainer.onControlAddedObservable.remove(this._controlAddedObserver);
        }
        if (this._controlRemovedObserver) {
            this._rootContainer.onControlRemovedObservable.remove(this._controlRemovedObserver);
        }
        if (this._layerToDispose) {
            this._layerToDispose.texture = null;
            this._layerToDispose.dispose();
            this._layerToDispose = null;
        }
        this._rootContainer.dispose();
        this.onClipboardObservable.clear();
        this.onControlPickedObservable.clear();
        this.onBeginRenderObservable.clear();
        this.onEndRenderObservable.clear();
        this.onBeginLayoutObservable.clear();
        this.onEndLayoutObservable.clear();
        this.onGuiReadyObservable.clear();
        super.dispose();
    }
    private _onResize(): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        // Check size
        const engine = scene.getEngine();
        const textureSize = this.getSize();
        let renderWidth = engine.getRenderWidth() * this._renderScale;
        let renderHeight = engine.getRenderHeight() * this._renderScale;

        if (this._renderAtIdealSize) {
            if (this._idealWidth) {
                renderHeight = (renderHeight * this._idealWidth) / renderWidth;
                renderWidth = this._idealWidth;
            } else if (this._idealHeight) {
                renderWidth = (renderWidth * this._idealHeight) / renderHeight;
                renderHeight = this._idealHeight;
            }
        }
        if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
            this.scaleTo(renderWidth, renderHeight);
            this.markAsDirty();
            if (this._idealWidth || this._idealHeight) {
                this._rootContainer._markAllAsDirty();
            }
        }
        this.invalidateRect(0, 0, textureSize.width - 1, textureSize.height - 1);
    }
    /** @internal */
    public _getGlobalViewport(): Viewport {
        const size = this.getSize();
        const globalViewPort = this._fullscreenViewport.toGlobal(size.width, size.height);

        const targetX = Math.round(globalViewPort.width * (1 / this.rootContainer.scaleX));
        const targetY = Math.round(globalViewPort.height * (1 / this.rootContainer.scaleY));

        globalViewPort.x += (globalViewPort.width - targetX) / 2;
        globalViewPort.y += (globalViewPort.height - targetY) / 2;

        globalViewPort.width = targetX;
        globalViewPort.height = targetY;

        return globalViewPort;
    }
    /**
     * Get screen coordinates for a vector3
     * @param position defines the position to project
     * @param worldMatrix defines the world matrix to use
     * @returns the projected position
     */
    public getProjectedPosition(position: Vector3, worldMatrix: Matrix): Vector2 {
        const result = this.getProjectedPositionWithZ(position, worldMatrix);
        return new Vector2(result.x, result.y);
    }

    /**
     * Get screen coordinates for a vector3
     * @param position defines the position to project
     * @param worldMatrix defines the world matrix to use
     * @returns the projected position with Z
     */
    public getProjectedPositionWithZ(position: Vector3, worldMatrix: Matrix): Vector3 {
        const scene = this.getScene();
        if (!scene) {
            return Vector3.Zero();
        }
        const globalViewport = this._getGlobalViewport();
        const projectedPosition = Vector3.Project(position, worldMatrix, scene.getTransformMatrix(), globalViewport);
        return new Vector3(projectedPosition.x, projectedPosition.y, projectedPosition.z);
    }

    private _checkUpdate(camera: Camera, skipUpdate?: boolean): void {
        if (this._layerToDispose) {
            if ((camera.layerMask & this._layerToDispose.layerMask) === 0) {
                return;
            }
        }
        if (this._isFullscreen && this._linkedControls.length) {
            const scene = this.getScene();
            if (!scene) {
                return;
            }
            const globalViewport = this._getGlobalViewport();
            for (const control of this._linkedControls) {
                if (!control.isVisible) {
                    continue;
                }
                const mesh = control._linkedMesh as AbstractMesh;
                if (!mesh || mesh.isDisposed()) {
                    Tools.SetImmediate(() => {
                        control.linkWithMesh(null);
                    });
                    continue;
                }
                const position = mesh.getBoundingInfo ? mesh.getBoundingInfo().boundingSphere.center : (Vector3.ZeroReadOnly as Vector3);
                const projectedPosition = Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
                if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                    control.notRenderable = true;
                    continue;
                }
                control.notRenderable = false;
                if (this.useInvalidateRectOptimization) {
                    control.invalidateRect();
                }

                control._moveToProjectedPosition(projectedPosition);
            }
        }
        if (!this._isDirty && !this._rootContainer.isDirty) {
            return;
        }
        this._isDirty = false;
        this._render(skipUpdate);
        if (!skipUpdate) {
            this.update(this.applyYInversionOnUpdate, this.premulAlpha, AdvancedDynamicTexture.AllowGPUOptimizations);
        }
    }

    private _clearMeasure = new Measure(0, 0, 0, 0);

    private _render(skipRender?: boolean): void {
        const textureSize = this.getSize();
        const renderWidth = textureSize.width;
        const renderHeight = textureSize.height;

        const context = this.getContext();
        context.font = "18px Arial";
        context.strokeStyle = "white";

        if (this.onGuiReadyObservable.hasObservers()) {
            this._checkGuiIsReady();
        }

        /** We have to recheck the camera projection in the case the root control's children have changed  */
        if (this._rootChildrenHaveChanged) {
            const camera = this.getScene()?.activeCamera;
            if (camera) {
                this._rootChildrenHaveChanged = false;
                this._checkUpdate(camera, true);
            }
        }

        // Layout
        this.onBeginLayoutObservable.notifyObservers(this);
        const measure = new Measure(0, 0, renderWidth, renderHeight);
        this._numLayoutCalls = 0;
        this._rootContainer._layout(measure, context);
        this.onEndLayoutObservable.notifyObservers(this);
        this._isDirty = false; // Restoring the dirty state that could have been set by controls during layout processing

        if (skipRender) {
            return;
        }

        // Clear
        if (this._invalidatedRectangle) {
            this._clearMeasure.copyFrom(this._invalidatedRectangle);
        } else {
            this._clearMeasure.copyFromFloats(0, 0, renderWidth, renderHeight);
        }
        context.clearRect(this._clearMeasure.left, this._clearMeasure.top, this._clearMeasure.width, this._clearMeasure.height);
        if (this._background) {
            context.save();
            context.fillStyle = this._background;
            context.fillRect(this._clearMeasure.left, this._clearMeasure.top, this._clearMeasure.width, this._clearMeasure.height);
            context.restore();
        }

        // Render
        this.onBeginRenderObservable.notifyObservers(this);
        this._numRenderCalls = 0;
        this._rootContainer._render(context, this._invalidatedRectangle);
        this.onEndRenderObservable.notifyObservers(this);
        this._invalidatedRectangle = null;
    }
    /**
     * @internal
     */
    public _changeCursor(cursor: string) {
        if (this._rootElement) {
            this._rootElement.style.cursor = cursor;
            this._cursorChanged = true;
        }
    }
    /**
     * @internal
     */
    public _registerLastControlDown(control: Control, pointerId: number) {
        this._lastControlDown[pointerId] = control;
        this.onControlPickedObservable.notifyObservers(control);
    }
    private _doPicking(x: number, y: number, pi: Nullable<PointerInfoBase>, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        const engine = scene.getEngine();
        const textureSize = this.getSize();
        if (this._isFullscreen) {
            const camera = scene.cameraToUseForPointers || scene.activeCamera;
            if (!camera) {
                return;
            }
            const viewport = camera.viewport;
            x = x * (textureSize.width / (engine.getRenderWidth() * viewport.width));
            y = y * (textureSize.height / (engine.getRenderHeight() * viewport.height));
        }
        if (this._capturingControl[pointerId]) {
            if (this._capturingControl[pointerId].isPointerBlocker) {
                this._shouldBlockPointer = true;
            }
            this._capturingControl[pointerId]._processObservables(type, x, y, pi, pointerId, buttonIndex);
            return;
        }

        this._cursorChanged = false;
        if (!this._rootContainer._processPicking(x, y, pi, type, pointerId, buttonIndex, deltaX, deltaY)) {
            if (!scene.doNotHandleCursors) {
                this._changeCursor("");
            }
            if (type === PointerEventTypes.POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId], pi);
                    delete this._lastControlOver[pointerId];
                }
            }
        }

        if (!this._cursorChanged && !scene.doNotHandleCursors) {
            this._changeCursor("");
        }
        this._manageFocus();
    }
    /**
     * @internal
     */
    public _cleanControlAfterRemovalFromList(list: { [pointerId: number]: Control }, control: Control) {
        for (const pointerId in list) {
            if (!Object.prototype.hasOwnProperty.call(list, pointerId)) {
                continue;
            }
            const lastControlOver = list[pointerId];
            if (lastControlOver === control) {
                delete list[pointerId];
            }
        }
    }
    /**
     * @internal
     */
    public _cleanControlAfterRemoval(control: Control) {
        this._cleanControlAfterRemovalFromList(this._lastControlDown, control);
        this._cleanControlAfterRemovalFromList(this._lastControlOver, control);
    }

    /**
     * This function will run a pointer event on this ADT and will trigger any pointer events on any controls
     * This will work on a fullscreen ADT only. For mesh based ADT, simulate pointer events using the scene directly.
     * @param x pointer X on the canvas for the picking
     * @param y pointer Y on the canvas for the picking
     * @param pi optional pointer information
     */
    public pick(x: number, y: number, pi: Nullable<PointerInfoPre> = null) {
        if (this._isFullscreen && this._scene) {
            this._translateToPicking(this._scene, new Viewport(0, 0, 0, 0), pi, x, y);
        }
    }

    private _translateToPicking(scene: Scene, tempViewport: Viewport, pi: Nullable<PointerInfoPre>, x: number = scene.pointerX, y: number = scene.pointerY) {
        const camera = scene.cameraToUseForPointers || scene.activeCamera;
        const engine = scene.getEngine();
        const originalCameraToUseForPointers = scene.cameraToUseForPointers;

        if (!camera) {
            tempViewport.x = 0;
            tempViewport.y = 0;
            tempViewport.width = engine.getRenderWidth();
            tempViewport.height = engine.getRenderHeight();
        } else {
            if (camera.rigCameras.length) {
                // rig camera - we need to find the camera to use for this event
                const rigViewport = new Viewport(0, 0, 1, 1);
                camera.rigCameras.forEach((rigCamera) => {
                    // generate the viewport of this camera
                    rigCamera.viewport.toGlobalToRef(engine.getRenderWidth(), engine.getRenderHeight(), rigViewport);
                    const transformedX = x / engine.getHardwareScalingLevel() - rigViewport.x;
                    const transformedY = y / engine.getHardwareScalingLevel() - (engine.getRenderHeight() - rigViewport.y - rigViewport.height);
                    // check if the pointer is in the camera's viewport
                    if (transformedX < 0 || transformedY < 0 || x > rigViewport.width || y > rigViewport.height) {
                        // out of viewport - don't use this camera
                        return;
                    }
                    // set the camera to use for pointers until this pointer loop is over
                    scene.cameraToUseForPointers = rigCamera;
                    // set the viewport
                    tempViewport.x = rigViewport.x;
                    tempViewport.y = rigViewport.y;
                    tempViewport.width = rigViewport.width;
                    tempViewport.height = rigViewport.height;
                });
            } else {
                camera.viewport.toGlobalToRef(engine.getRenderWidth(), engine.getRenderHeight(), tempViewport);
            }
        }

        const transformedX = x / engine.getHardwareScalingLevel() - tempViewport.x;
        const transformedY = y / engine.getHardwareScalingLevel() - (engine.getRenderHeight() - tempViewport.y - tempViewport.height);
        this._shouldBlockPointer = false;
        // Do picking modifies _shouldBlockPointer
        if (pi) {
            const pointerId = (pi.event as IPointerEvent).pointerId || this._defaultMousePointerId;
            this._doPicking(transformedX, transformedY, pi, pi.type, pointerId, pi.event.button, (<IWheelEvent>pi.event).deltaX, (<IWheelEvent>pi.event).deltaY);
            // Avoid overwriting a true skipOnPointerObservable to false
            if ((this._shouldBlockPointer && !(pi.type & this.skipBlockEvents)) || this._capturingControl[pointerId]) {
                pi.skipOnPointerObservable = true;
            }
        } else {
            this._doPicking(transformedX, transformedY, null, PointerEventTypes.POINTERMOVE, this._defaultMousePointerId, 0);
        }
        // if overridden by a rig camera - reset back to the original value
        scene.cameraToUseForPointers = originalCameraToUseForPointers;
    }

    /** Attach to all scene events required to support pointer events */
    public attach(): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }

        const tempViewport = new Viewport(0, 0, 0, 0);

        this._prePointerObserver = scene.onPrePointerObservable.add((pi) => {
            if (
                scene.isPointerCaptured((<IPointerEvent>pi.event).pointerId) &&
                pi.type === PointerEventTypes.POINTERUP &&
                !this._capturedPointerIds.has((pi.event as IPointerEvent).pointerId)
            ) {
                return;
            }
            if (
                pi.type !== PointerEventTypes.POINTERMOVE &&
                pi.type !== PointerEventTypes.POINTERUP &&
                pi.type !== PointerEventTypes.POINTERDOWN &&
                pi.type !== PointerEventTypes.POINTERWHEEL
            ) {
                return;
            }

            if (pi.type === PointerEventTypes.POINTERMOVE) {
                // Avoid pointerMove events firing while the pointer is captured by the scene
                if (scene.isPointerCaptured((<IPointerEvent>pi.event).pointerId)) {
                    return;
                }
                if ((pi.event as IPointerEvent).pointerId) {
                    this._defaultMousePointerId = (pi.event as IPointerEvent).pointerId; // This is required to make sure we have the correct pointer ID for wheel
                }
            }
            this._translateToPicking(scene, tempViewport, pi);
        });
        this._attachPickingToSceneRender(scene, () => this._translateToPicking(scene, tempViewport, null), false);
        this._attachToOnPointerOut(scene);
        this._attachToOnBlur(scene);
    }

    /**
     * @internal
     */
    private _onClipboardCopy = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        const ev = new ClipboardInfo(ClipboardEventTypes.COPY, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /**
     * @internal
     */
    private _onClipboardCut = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        const ev = new ClipboardInfo(ClipboardEventTypes.CUT, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /**
     * @internal
     */
    private _onClipboardPaste = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        const ev = new ClipboardInfo(ClipboardEventTypes.PASTE, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /**
     * Register the clipboard Events onto the canvas
     */
    public registerClipboardEvents(): void {
        self.addEventListener("copy", this._onClipboardCopy, false);
        self.addEventListener("cut", this._onClipboardCut, false);
        self.addEventListener("paste", this._onClipboardPaste, false);
    }
    /**
     * Unregister the clipboard Events from the canvas
     */
    public unRegisterClipboardEvents(): void {
        self.removeEventListener("copy", this._onClipboardCopy);
        self.removeEventListener("cut", this._onClipboardCut);
        self.removeEventListener("paste", this._onClipboardPaste);
    }

    /**
     * Transform uvs from mesh space to texture space, taking the texture into account
     * @param uv the uvs in mesh space
     * @returns the uvs in texture space
     */
    private _transformUvs(uv: Vector2): Vector2 {
        const textureMatrix = this.getTextureMatrix();
        let result;
        if (textureMatrix.isIdentityAs3x2()) {
            result = uv;
        } else {
            const homogeneousTextureMatrix = TmpVectors.Matrix[0];

            textureMatrix.getRowToRef(0, TmpVectors.Vector4[0]);
            textureMatrix.getRowToRef(1, TmpVectors.Vector4[1]);
            textureMatrix.getRowToRef(2, TmpVectors.Vector4[2]);

            const r0 = TmpVectors.Vector4[0];
            const r1 = TmpVectors.Vector4[1];
            const r2 = TmpVectors.Vector4[2];

            homogeneousTextureMatrix.setRowFromFloats(0, r0.x, r0.y, 0, 0);
            homogeneousTextureMatrix.setRowFromFloats(1, r1.x, r1.y, 0, 0);
            homogeneousTextureMatrix.setRowFromFloats(2, 0, 0, 1, 0);
            homogeneousTextureMatrix.setRowFromFloats(3, r2.x, r2.y, 0, 1);

            result = TmpVectors.Vector2[0];
            Vector2.TransformToRef(uv, homogeneousTextureMatrix, result);
        }

        // In wrap and mirror mode, the texture coordinate for coordinates more than 1 is the fractional part of the coordinate
        if (this.wrapU === Texture.WRAP_ADDRESSMODE || this.wrapU === Texture.MIRROR_ADDRESSMODE) {
            if (result.x > 1) {
                let fX = result.x - Math.trunc(result.x);
                // In mirror mode, the sign of the texture coordinate depends on the integer part -
                // odd integers means it is mirrored from the original coordinate
                if (this.wrapU === Texture.MIRROR_ADDRESSMODE && Math.trunc(result.x) % 2 === 1) {
                    fX = 1 - fX;
                }
                result.x = fX;
            }
        }
        if (this.wrapV === Texture.WRAP_ADDRESSMODE || this.wrapV === Texture.MIRROR_ADDRESSMODE) {
            if (result.y > 1) {
                let fY = result.y - Math.trunc(result.y);
                if (this.wrapV === Texture.MIRROR_ADDRESSMODE && Math.trunc(result.x) % 2 === 1) {
                    fY = 1 - fY;
                }
                result.y = fY;
            }
        }
        return result;
    }
    /**
     * Connect the texture to a hosting mesh to enable interactions
     * @param mesh defines the mesh to attach to
     * @param supportPointerMove defines a boolean indicating if pointer move events must be catched as well
     */
    public attachToMesh(mesh: AbstractMesh, supportPointerMove = true): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }

        if (this._pointerObserver) {
            scene.onPointerObservable.remove(this._pointerObserver);
        }

        this._pointerObserver = scene.onPointerObservable.add((pi) => {
            if (
                pi.type !== PointerEventTypes.POINTERMOVE &&
                pi.type !== PointerEventTypes.POINTERUP &&
                pi.type !== PointerEventTypes.POINTERDOWN &&
                pi.type !== PointerEventTypes.POINTERWHEEL
            ) {
                return;
            }

            if (pi.type === PointerEventTypes.POINTERMOVE && (pi.event as IPointerEvent).pointerId) {
                this._defaultMousePointerId = (pi.event as IPointerEvent).pointerId; // This is required to make sure we have the correct pointer ID for wheel
            }

            const pointerId = (pi.event as IPointerEvent).pointerId || this._defaultMousePointerId;
            if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                let uv = pi.pickInfo.getTextureCoordinates();
                if (uv) {
                    uv = this._transformUvs(uv);
                    const size = this.getSize();
                    this._doPicking(
                        uv.x * size.width,
                        (this.applyYInversionOnUpdate ? 1.0 - uv.y : uv.y) * size.height,
                        pi,
                        pi.type,
                        pointerId,
                        pi.event.button,
                        (<IWheelEvent>pi.event).deltaX,
                        (<IWheelEvent>pi.event).deltaY
                    );
                }
            } else if (pi.type === PointerEventTypes.POINTERUP) {
                if (this._lastControlDown[pointerId]) {
                    this._lastControlDown[pointerId]._forcePointerUp(pointerId);
                }
                delete this._lastControlDown[pointerId];
                if (this.focusedControl) {
                    const friendlyControls = this.focusedControl.keepsFocusWith();
                    let canMoveFocus = true;
                    if (friendlyControls) {
                        for (const control of friendlyControls) {
                            // Same host, no need to keep the focus
                            if (this === control._host) {
                                continue;
                            }
                            // Different hosts
                            const otherHost = control._host;
                            if (otherHost._lastControlOver[pointerId] && otherHost._lastControlOver[pointerId].isAscendant(control)) {
                                canMoveFocus = false;
                                break;
                            }
                        }
                    }
                    if (canMoveFocus) {
                        this.focusedControl = null;
                    }
                }
            } else if (pi.type === PointerEventTypes.POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId], pi, true);
                }
                delete this._lastControlOver[pointerId];
            }
        });
        mesh.enablePointerMoveEvents = supportPointerMove;
        this._attachPickingToSceneRender(
            scene,
            () => {
                const pointerId = this._defaultMousePointerId;
                const pick = scene?.pick(scene.pointerX, scene.pointerY);
                if (pick && pick.hit && pick.pickedMesh === mesh) {
                    let uv = pick.getTextureCoordinates();
                    if (uv) {
                        uv = this._transformUvs(uv);
                        const size = this.getSize();
                        this._doPicking(uv.x * size.width, (this.applyYInversionOnUpdate ? 1.0 - uv.y : uv.y) * size.height, null, PointerEventTypes.POINTERMOVE, pointerId, 0);
                    }
                } else {
                    if (this._lastControlOver[pointerId]) {
                        this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId], null, true);
                    }
                    delete this._lastControlOver[pointerId];
                }
            },
            true
        );
        this._attachToOnPointerOut(scene);
        this._attachToOnBlur(scene);
    }
    /**
     * Move the focus to a specific control
     * @param control defines the control which will receive the focus
     */
    public moveFocusToControl(control: IFocusableControl): void {
        this.focusedControl = control;
        this._lastPickedControl = <any>control;
        this._blockNextFocusCheck = true;
    }
    private _manageFocus(): void {
        if (this._blockNextFocusCheck) {
            this._blockNextFocusCheck = false;
            this._lastPickedControl = <any>this._focusedControl;
            return;
        }
        // Focus management
        if (this._focusedControl) {
            if (this._focusedControl !== <any>this._lastPickedControl) {
                if (this._lastPickedControl.isFocusInvisible) {
                    return;
                }
                this.focusedControl = null;
            }
        }
    }
    private _attachPickingToSceneRender(scene: Scene, pickFunction: () => void, forcePicking: boolean) {
        this._sceneRenderObserver = scene.onBeforeRenderObservable.add(() => {
            if (!this.checkPointerEveryFrame) {
                return;
            }
            if (this._linkedControls.length > 0 || forcePicking) {
                pickFunction();
            }
        });
    }
    private _attachToOnPointerOut(scene: Scene): void {
        this._canvasPointerOutObserver = scene.getEngine().onCanvasPointerOutObservable.add((pointerEvent) => {
            if (this._lastControlOver[pointerEvent.pointerId]) {
                this._lastControlOver[pointerEvent.pointerId]._onPointerOut(this._lastControlOver[pointerEvent.pointerId], null);
            }
            delete this._lastControlOver[pointerEvent.pointerId];
            if (this._lastControlDown[pointerEvent.pointerId] && this._lastControlDown[pointerEvent.pointerId] !== this._capturingControl[pointerEvent.pointerId]) {
                this._lastControlDown[pointerEvent.pointerId]._forcePointerUp(pointerEvent.pointerId);
                delete this._lastControlDown[pointerEvent.pointerId];
            }
        });
    }
    private _attachToOnBlur(scene: Scene): void {
        this._canvasBlurObserver = scene.getEngine().onCanvasBlurObservable.add(() => {
            Object.entries(this._lastControlDown).forEach(([, value]) => {
                value._onCanvasBlur();
            });
            this.focusedControl = null;
            this._lastControlDown = {};
        });
    }

    /**
     * Serializes the entire GUI system
     * @returns an object with the JSON serialized data
     */
    public serializeContent(): any {
        const size = this.getSize();
        const serializationObject = {
            root: {},
            width: size.width,
            height: size.height,
        };

        this._rootContainer.serialize(serializationObject.root);

        return serializationObject;
    }

    /**
     * Recreate the content of the ADT from a JSON object
     * @param serializedObject define the JSON serialized object to restore from
     * @param scaleToSize defines whether to scale to texture to the saved size
     */
    public parseSerializedObject(serializedObject: any, scaleToSize?: boolean) {
        this._rootContainer = Control.Parse(serializedObject.root, this) as Container;
        if (scaleToSize) {
            const width = serializedObject.width;
            const height = serializedObject.height;
            if (typeof width === "number" && typeof height === "number" && width >= 0 && height >= 0) {
                this.scaleTo(width, height);
            } else {
                // scales the GUI to a default size if none was available in the serialized content
                this.scaleTo(1920, 1080);
            }
        }
    }

    /**
     * Clones the ADT
     * @param newName defines the name of the new ADT
     * @returns the clone of the ADT
     */
    public clone(newName?: string): AdvancedDynamicTexture {
        const scene = this.getScene();

        if (!scene) {
            return this;
        }
        const size = this.getSize();
        const data = this.serializeContent();
        const clone = new AdvancedDynamicTexture(newName ?? "Clone of " + this.name, size.width, size.height, scene, !this.noMipmap, this.samplingMode);
        clone.parseSerializedObject(data);

        return clone;
    }

    /**
     * Recreate the content of the ADT from a JSON object
     * @param serializedObject define the JSON serialized object to restore from
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @deprecated Please use parseSerializedObject instead
     */
    public parseContent = this.parseSerializedObject;

    /**
     * Recreate the content of the ADT from a snippet saved by the GUI editor
     * @param snippetId defines the snippet to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @param appendToAdt if provided the snippet will be appended to the adt. Otherwise a fullscreen ADT will be created.
     * @returns a promise that will resolve on success
     */
    public static async ParseFromSnippetAsync(snippetId: string, scaleToSize?: boolean, appendToAdt?: AdvancedDynamicTexture): Promise<AdvancedDynamicTexture> {
        const adt = appendToAdt ?? AdvancedDynamicTexture.CreateFullscreenUI("ADT from snippet");
        if (snippetId === "_BLANK") {
            return adt;
        }

        const serialized = await AdvancedDynamicTexture._LoadURLContentAsync(AdvancedDynamicTexture.SnippetUrl + "/" + snippetId.replace(/#/g, "/"), true);
        adt.parseSerializedObject(serialized, scaleToSize);
        return adt;
    }

    /**
     * Recreate the content of the ADT from a snippet saved by the GUI editor
     * @param snippetId defines the snippet to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @returns a promise that will resolve on success
     */
    public parseFromSnippetAsync(snippetId: string, scaleToSize?: boolean): Promise<AdvancedDynamicTexture> {
        return AdvancedDynamicTexture.ParseFromSnippetAsync(snippetId, scaleToSize, this);
    }

    /**
     * Recreate the content of the ADT from a url json
     * @param url defines the url to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @param appendToAdt if provided the snippet will be appended to the adt. Otherwise a fullscreen ADT will be created.
     * @returns a promise that will resolve on success
     */
    public static async ParseFromFileAsync(url: string, scaleToSize?: boolean, appendToAdt?: AdvancedDynamicTexture): Promise<AdvancedDynamicTexture> {
        const adt = appendToAdt ?? AdvancedDynamicTexture.CreateFullscreenUI("ADT from URL");
        const serialized = await AdvancedDynamicTexture._LoadURLContentAsync(url);
        adt.parseSerializedObject(serialized, scaleToSize);
        return adt;
    }

    /**
     * Recreate the content of the ADT from a url json
     * @param url defines the url to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @returns a promise that will resolve on success
     */
    public parseFromURLAsync(url: string, scaleToSize?: boolean): Promise<AdvancedDynamicTexture> {
        return AdvancedDynamicTexture.ParseFromFileAsync(url, scaleToSize, this);
    }

    private static _LoadURLContentAsync(url: string, snippet: boolean = false): Promise<any> {
        if (url === "") {
            return Promise.reject("No URL provided");
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        let gui;
                        if (snippet) {
                            const payload = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                            gui = payload.encodedGui ? new TextDecoder("utf-8").decode(DecodeBase64ToBinary(payload.encodedGui)) : payload.gui;
                        } else {
                            gui = request.responseText;
                        }
                        const serializationObject = JSON.parse(gui);
                        resolve(serializationObject);
                    } else {
                        reject("Unable to load");
                    }
                }
            });
            request.open("GET", url);
            request.send();
        });
    }

    // Statics
    /**
     * Compares two rectangle based controls for pixel overlap
     * @param control1 The first control to compare
     * @param control2 The second control to compare
     * @returns true if overlaps, otherwise false
     */
    private static _Overlaps(control1: Control, control2: Control) {
        return !(
            control1.centerX > control2.centerX + control2.widthInPixels ||
            control1.centerX + control1.widthInPixels < control2.centerX ||
            control1.centerY + control1.heightInPixels < control2.centerY ||
            control1.centerY > control2.centerY + control2.heightInPixels
        );
    }

    /**
     * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh)
     * @param mesh defines the mesh which will receive the texture
     * @param width defines the texture width (1024 by default)
     * @param height defines the texture height (1024 by default)
     * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
     * @param onlyAlphaTesting defines a boolean indicating that alpha blending will not be used (only alpha testing) (false by default)
     * @param invertY defines if the texture needs to be inverted on the y axis during loading (true by default)
     * @param materialSetupCallback defines a custom way of creating and setting up the material on the mesh
     * @returns a new AdvancedDynamicTexture
     */
    public static CreateForMesh(
        mesh: AbstractMesh,
        width = 1024,
        height = 1024,
        supportPointerMove = true,
        onlyAlphaTesting = false,
        invertY?: boolean,
        materialSetupCallback: (mesh: AbstractMesh, uniqueId: string, texture: AdvancedDynamicTexture, onlyAlphaTesting: boolean) => void = this._CreateMaterial
    ): AdvancedDynamicTexture {
        // use a unique ID in name so serialization will work even if you create two ADTs for a single mesh
        const uniqueId = RandomGUID();
        const result = new AdvancedDynamicTexture(
            `AdvancedDynamicTexture for ${mesh.name} [${uniqueId}]`,
            width,
            height,
            mesh.getScene(),
            true,
            Texture.TRILINEAR_SAMPLINGMODE,
            invertY
        );

        materialSetupCallback(mesh, uniqueId, result, onlyAlphaTesting);

        result.attachToMesh(mesh, supportPointerMove);
        return result;
    }

    private static _CreateMaterial(mesh: AbstractMesh, uniqueId: string, texture: AdvancedDynamicTexture, onlyAlphaTesting: boolean): void {
        const internalClassType = GetClass("BABYLON.StandardMaterial");
        if (!internalClassType) {
            // eslint-disable-next-line no-throw-literal
            throw "StandardMaterial needs to be imported before as it contains a side-effect required by your code.";
        }

        const material: StandardMaterial = new internalClassType(`AdvancedDynamicTextureMaterial for ${mesh.name} [${uniqueId}]`, mesh.getScene());
        material.backFaceCulling = false;
        material.diffuseColor = Color3.Black();
        material.specularColor = Color3.Black();
        if (onlyAlphaTesting) {
            material.diffuseTexture = texture;
            material.emissiveTexture = texture;
            texture.hasAlpha = true;
        } else {
            material.emissiveTexture = texture;
            material.opacityTexture = texture;
        }
        mesh.material = material;
    }

    /**
     * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh) BUT do not create a new material for the mesh. You will be responsible for connecting the texture
     * @param mesh defines the mesh which will receive the texture
     * @param width defines the texture width (1024 by default)
     * @param height defines the texture height (1024 by default)
     * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
     * @param invertY defines if the texture needs to be inverted on the y axis during loading (true by default)
     * @returns a new AdvancedDynamicTexture
     */
    public static CreateForMeshTexture(mesh: AbstractMesh, width = 1024, height = 1024, supportPointerMove = true, invertY?: boolean): AdvancedDynamicTexture {
        const result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE, invertY);
        result.attachToMesh(mesh, supportPointerMove);
        return result;
    }
    /**
     * Creates a new AdvancedDynamicTexture in fullscreen mode.
     * In this mode the texture will rely on a layer for its rendering.
     * This allows it to be treated like any other layer.
     * As such, if you have a multi camera setup, you can set the layerMask on the GUI as well.
     * LayerMask is set through advancedTexture.layer.layerMask
     * @param name defines name for the texture
     * @param foreground defines a boolean indicating if the texture must be rendered in foreground (default is true)
     * @param scene defines the hosting scene
     * @param sampling defines the texture sampling mode (Texture.BILINEAR_SAMPLINGMODE by default)
     * @param adaptiveScaling defines whether to automatically scale root to match hardwarescaling (false by default)
     * @returns a new AdvancedDynamicTexture
     */
    public static CreateFullscreenUI(
        name: string,
        foreground: boolean = true,
        scene: Nullable<Scene> = null,
        sampling = Texture.BILINEAR_SAMPLINGMODE,
        adaptiveScaling: boolean = false
    ): AdvancedDynamicTexture {
        const result = new AdvancedDynamicTexture(name, 0, 0, scene, false, sampling);
        // Display
        const resultScene = result.getScene();
        const layer = new Layer(name + "_layer", null, resultScene, !foreground);
        layer.texture = result;
        result._layerToDispose = layer;
        result._isFullscreen = true;

        if (adaptiveScaling && resultScene) {
            const newScale = 1 / resultScene.getEngine().getHardwareScalingLevel();
            result._rootContainer.scaleX = newScale;
            result._rootContainer.scaleY = newScale;
        }

        // Attach
        result.attach();
        return result;
    }

    /**
     * Scales the texture
     * @param ratio the scale factor to apply to both width and height
     */
    public scale(ratio: number): void {
        super.scale(ratio);
        this.markAsDirty();
    }

    /**
     * Resizes the texture
     * @param width the new width
     * @param height the new height
     */
    public scaleTo(width: number, height: number): void {
        super.scaleTo(width, height);
        this.markAsDirty();
    }

    private _checkGuiIsReady() {
        if (this.guiIsReady()) {
            this.onGuiReadyObservable.notifyObservers(this);

            this.onGuiReadyObservable.clear();
        }
    }

    /**
     * @returns true if all the GUI components are ready to render
     */
    public guiIsReady(): boolean {
        return this._rootContainer.isReady();
    }
}
