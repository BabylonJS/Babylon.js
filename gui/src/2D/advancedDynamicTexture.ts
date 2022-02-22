import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { Vector2, Vector3, Matrix } from "babylonjs/Maths/math.vector";
import { Tools } from "babylonjs/Misc/tools";
import { PointerInfoPre, PointerInfo, PointerEventTypes, PointerInfoBase } from "babylonjs/Events/pointerEvents";
import { ClipboardEventTypes, ClipboardInfo } from "babylonjs/Events/clipboardEvents";
import { KeyboardInfoPre, KeyboardEventTypes } from "babylonjs/Events/keyboardEvents";
import { Camera } from "babylonjs/Cameras/camera";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { DynamicTexture } from "babylonjs/Materials/Textures/dynamicTexture";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Layer } from "babylonjs/Layers/layer";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";

import { Container } from "./controls/container";
import { Control } from "./controls/control";
import { IFocusableControl } from "./controls/focusableControl";
import { Style } from "./style";
import { Measure } from "./measure";
import { Constants } from "babylonjs/Engines/constants";
import { Viewport } from "babylonjs/Maths/math.viewport";
import { Color3 } from "babylonjs/Maths/math.color";
import { WebRequest } from "babylonjs/Misc/webRequest";
import { IPointerEvent, IWheelEvent } from "babylonjs/Events/deviceInputEvents";
import { RandomGUID } from "babylonjs/Misc/guid";

/**
 * Class used to create texture to support 2D GUI elements
 * @see https://doc.babylonjs.com/how_to/gui
 */
export class AdvancedDynamicTexture extends DynamicTexture {
    /** Define the Uurl to load snippets */
    public static SnippetUrl = "https://snippet.babylonjs.com";

    /** Indicates if some optimizations can be performed in GUI GPU management (the downside is additional memory/GPU texture memory used) */
    public static AllowGPUOptimizations = true;

    /** Snippet ID if the content was created from the snippet server */
    public snippetId: string;

    private _isDirty = false;
    private _renderObserver: Nullable<Observer<Camera>>;
    private _resizeObserver: Nullable<Observer<Engine>>;
    private _preKeyboardObserver: Nullable<Observer<KeyboardInfoPre>>;
    private _pointerMoveObserver: Nullable<Observer<PointerInfoPre>>;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _canvasPointerOutObserver: Nullable<Observer<IPointerEvent>>;
    private _canvasBlurObserver: Nullable<Observer<Engine>>;
    private _background: string;
    /** @hidden */
    public _rootContainer = new Container("root");
    /** @hidden */
    public _lastPickedControl: Control;
    /** @hidden */
    public _lastControlOver: { [pointerId: number]: Control } = {};
    /** @hidden */
    public _lastControlDown: { [pointerId: number]: Control } = {};
    /** @hidden */
    public _capturingControl: { [pointerId: number]: Control } = {};
    /** @hidden */
    public _shouldBlockPointer: boolean;
    /** @hidden */
    public _layerToDispose: Nullable<Layer>;
    /** @hidden */
    public _linkedControls = new Array<Control>();
    private _isFullscreen = false;
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

    /** @hidden */
    public _numLayoutCalls = 0;
    /** Gets the number of layout calls made the last time the ADT has been rendered */
    public get numLayoutCalls(): number {
        return this._numLayoutCalls;
    }

    /** @hidden */
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
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
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
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
     * */
    public get idealRatio(): number {
        var rwidth: number = 0;
        var rheight: number = 0;

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
     * @return all child controls
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
     * @return the first control found or null
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
        for (var child of container.children) {
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
            var maxX = Math.ceil(Math.max(this._invalidatedRectangle.left + this._invalidatedRectangle.width - 1, invalidMaxX));
            var maxY = Math.ceil(Math.max(this._invalidatedRectangle.top + this._invalidatedRectangle.height - 1, invalidMaxY));
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
     * @see https://doc.babylonjs.com/how_to/gui#styles
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
        let scene = this.getScene();
        if (!scene) {
            return;
        }
        this._rootElement = null;
        scene.onBeforeCameraRenderObservable.remove(this._renderObserver);
        if (this._resizeObserver) {
            scene.getEngine().onResizeObservable.remove(this._resizeObserver);
        }
        if (this._pointerMoveObserver) {
            scene.onPrePointerObservable.remove(this._pointerMoveObserver);
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
        super.dispose();
    }
    private _onResize(): void {
        let scene = this.getScene();
        if (!scene) {
            return;
        }
        // Check size
        var engine = scene.getEngine();
        var textureSize = this.getSize();
        var renderWidth = engine.getRenderWidth() * this._renderScale;
        var renderHeight = engine.getRenderHeight() * this._renderScale;

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
    /** @hidden */
    public _getGlobalViewport(): Viewport {
        var size = this.getSize();
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
        var scene = this.getScene();
        if (!scene) {
            return Vector3.Zero();
        }
        var globalViewport = this._getGlobalViewport();
        var projectedPosition = Vector3.Project(position, worldMatrix, scene.getTransformMatrix(), globalViewport);
        return new Vector3(projectedPosition.x, projectedPosition.y, projectedPosition.z);
    }

    private _checkUpdate(camera: Camera): void {
        if (this._layerToDispose) {
            if ((camera.layerMask & this._layerToDispose.layerMask) === 0) {
                return;
            }
        }
        if (this._isFullscreen && this._linkedControls.length) {
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            var globalViewport = this._getGlobalViewport();
            for (let control of this._linkedControls) {
                if (!control.isVisible) {
                    continue;
                }
                let mesh = control._linkedMesh as AbstractMesh;
                if (!mesh || mesh.isDisposed()) {
                    Tools.SetImmediate(() => {
                        control.linkWithMesh(null);
                    });
                    continue;
                }
                let position = mesh.getBoundingInfo ? mesh.getBoundingInfo().boundingSphere.center : (Vector3.ZeroReadOnly as Vector3);
                let projectedPosition = Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);
                if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                    control.notRenderable = true;
                    continue;
                }
                control.notRenderable = false;

                control._moveToProjectedPosition(projectedPosition);
            }
        }
        if (!this._isDirty && !this._rootContainer.isDirty) {
            return;
        }
        this._isDirty = false;
        this._render();
        this.update(this.applyYInversionOnUpdate, this.premulAlpha, AdvancedDynamicTexture.AllowGPUOptimizations);
    }

    private _clearMeasure = new Measure(0, 0, 0, 0);

    private _render(): void {
        var textureSize = this.getSize();
        var renderWidth = textureSize.width;
        var renderHeight = textureSize.height;

        var context = this.getContext();
        context.font = "18px Arial";
        context.strokeStyle = "white";

        // Layout
        this.onBeginLayoutObservable.notifyObservers(this);
        var measure = new Measure(0, 0, renderWidth, renderHeight);
        this._numLayoutCalls = 0;
        this._rootContainer._layout(measure, context);
        this.onEndLayoutObservable.notifyObservers(this);
        this._isDirty = false; // Restoring the dirty state that could have been set by controls during layout processing

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
    /** @hidden */
    public _changeCursor(cursor: string) {
        if (this._rootElement) {
            this._rootElement.style.cursor = cursor;
            this._cursorChanged = true;
        }
    }
    /** @hidden */
    public _registerLastControlDown(control: Control, pointerId: number) {
        this._lastControlDown[pointerId] = control;
        this.onControlPickedObservable.notifyObservers(control);
    }
    private _doPicking(x: number, y: number, pi: PointerInfoBase, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): void {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        var engine = scene.getEngine();
        var textureSize = this.getSize();
        if (this._isFullscreen) {
            let camera = scene.cameraToUseForPointers || scene.activeCamera;
            if (!camera) {
                return;
            }
            let viewport = camera.viewport;
            x = x * (textureSize.width / (engine.getRenderWidth() * viewport.width));
            y = y * (textureSize.height / (engine.getRenderHeight() * viewport.height));
        }
        if (this._capturingControl[pointerId]) {
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
    /** @hidden */
    public _cleanControlAfterRemovalFromList(list: { [pointerId: number]: Control }, control: Control) {
        for (var pointerId in list) {
            if (!list.hasOwnProperty(pointerId)) {
                continue;
            }
            var lastControlOver = list[pointerId];
            if (lastControlOver === control) {
                delete list[pointerId];
            }
        }
    }
    /** @hidden */
    public _cleanControlAfterRemoval(control: Control) {
        this._cleanControlAfterRemovalFromList(this._lastControlDown, control);
        this._cleanControlAfterRemovalFromList(this._lastControlOver, control);
    }
    /** Attach to all scene events required to support pointer events */
    public attach(): void {
        const scene = this.getScene();
        if (!scene) {
            return;
        }

        let tempViewport = new Viewport(0, 0, 0, 0);

        this._pointerMoveObserver = scene.onPrePointerObservable.add((pi, state) => {
            if (scene.isPointerCaptured((<IPointerEvent>pi.event).pointerId)) {
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

            if (pi.type === PointerEventTypes.POINTERMOVE && (pi.event as IPointerEvent).pointerId) {
                this._defaultMousePointerId = (pi.event as IPointerEvent).pointerId; // This is required to make sure we have the correct pointer ID for wheel
            }

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
                    let rigViewport = new Viewport(0, 0, 1, 1);
                    camera.rigCameras.forEach((rigCamera) => {
                        // generate the viewport of this camera
                        rigCamera.viewport.toGlobalToRef(engine.getRenderWidth(), engine.getRenderHeight(), rigViewport);
                        let x = scene.pointerX / engine.getHardwareScalingLevel() - rigViewport.x;
                        let y = scene.pointerY / engine.getHardwareScalingLevel() - (engine.getRenderHeight() - rigViewport.y - rigViewport.height);
                        // check if the pointer is in the camera's viewport
                        if (x < 0 || y < 0 || x > rigViewport.width || y > rigViewport.height) {
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

            let x = scene.pointerX / engine.getHardwareScalingLevel() - tempViewport.x;
            let y = scene.pointerY / engine.getHardwareScalingLevel() - (engine.getRenderHeight() - tempViewport.y - tempViewport.height);
            this._shouldBlockPointer = false;
            // Do picking modifies _shouldBlockPointer
            let pointerId = (pi.event as IPointerEvent).pointerId || this._defaultMousePointerId;
            this._doPicking(x, y, pi, pi.type, pointerId, pi.event.button, (<IWheelEvent>pi.event).deltaX, (<IWheelEvent>pi.event).deltaY);
            // Avoid overwriting a true skipOnPointerObservable to false
            if (this._shouldBlockPointer) {
                pi.skipOnPointerObservable = this._shouldBlockPointer;
            }
            // if overridden by a rig camera - reset back to the original value
            scene.cameraToUseForPointers = originalCameraToUseForPointers;
        });
        this._attachToOnPointerOut(scene);
        this._attachToOnBlur(scene);
    }

    /** @hidden */
    private onClipboardCopy = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        let ev = new ClipboardInfo(ClipboardEventTypes.COPY, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /** @hidden */
    private onClipboardCut = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        let ev = new ClipboardInfo(ClipboardEventTypes.CUT, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /** @hidden */
    private onClipboardPaste = (rawEvt: Event) => {
        const evt = rawEvt as ClipboardEvent;
        let ev = new ClipboardInfo(ClipboardEventTypes.PASTE, evt);
        this.onClipboardObservable.notifyObservers(ev);
        evt.preventDefault();
    };
    /**
     * Register the clipboard Events onto the canvas
     */
    public registerClipboardEvents(): void {
        self.addEventListener("copy", this.onClipboardCopy, false);
        self.addEventListener("cut", this.onClipboardCut, false);
        self.addEventListener("paste", this.onClipboardPaste, false);
    }
    /**
     * Unregister the clipboard Events from the canvas
     */
    public unRegisterClipboardEvents(): void {
        self.removeEventListener("copy", this.onClipboardCopy);
        self.removeEventListener("cut", this.onClipboardCut);
        self.removeEventListener("paste", this.onClipboardPaste);
    }
    /**
     * Connect the texture to a hosting mesh to enable interactions
     * @param mesh defines the mesh to attach to
     * @param supportPointerMove defines a boolean indicating if pointer move events must be catched as well
     */
    public attachToMesh(mesh: AbstractMesh, supportPointerMove = true): void {
        var scene = this.getScene();
        if (!scene) {
            return;
        }
        this._pointerObserver = scene.onPointerObservable.add((pi, state) => {
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

            var pointerId = (pi.event as IPointerEvent).pointerId || this._defaultMousePointerId;
            if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                var uv = pi.pickInfo.getTextureCoordinates();
                if (uv) {
                    let size = this.getSize();
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
                        for (var control of friendlyControls) {
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
    private _attachToOnPointerOut(scene: Scene): void {
        this._canvasPointerOutObserver = scene.getEngine().onCanvasPointerOutObservable.add((pointerEvent) => {
            if (this._lastControlOver[pointerEvent.pointerId]) {
                this._lastControlOver[pointerEvent.pointerId]._onPointerOut(this._lastControlOver[pointerEvent.pointerId], null);
            }
            delete this._lastControlOver[pointerEvent.pointerId];
            if (this._lastControlDown[pointerEvent.pointerId] && this._lastControlDown[pointerEvent.pointerId] !== this._capturingControl[pointerEvent.pointerId]) {
                this._lastControlDown[pointerEvent.pointerId]._forcePointerUp();
                delete this._lastControlDown[pointerEvent.pointerId];
            }
        });
    }
    private _attachToOnBlur(scene: Scene): void {
        this._canvasBlurObserver = scene.getEngine().onCanvasBlurObservable.add((pointerEvent) => {
            Object.entries(this._lastControlDown).forEach(([key, value]) => {
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
        let serializationObject = {
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
    public parseContent(serializedObject: any, scaleToSize?: boolean) {
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
     * Recreate the content of the ADT from a snippet saved by the GUI editor
     * @param snippetId defines the snippet to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @returns a promise that will resolve on success
     */
    public parseFromSnippetAsync(snippetId: string, scaleToSize?: boolean): Promise<void> {
        if (snippetId === "_BLANK") {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            var request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        var snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        let serializationObject = JSON.parse(snippet.gui);

                        this.parseContent(serializationObject, scaleToSize);
                        this.snippetId = snippetId;

                        resolve();
                    } else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", AdvancedDynamicTexture.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }

    /**
     * Recreate the content of the ADT from a url json
     * @param url defines the url to load
     * @param scaleToSize defines whether to scale to texture to the saved size
     * @returns a promise that will resolve on success
     */
    public parseFromURLAsync(url: string, scaleToSize?: boolean): Promise<void> {
        if (url === "") {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            var request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        var gui = request.responseText;
                        let serializationObject = JSON.parse(gui);
                        this.parseContent(serializationObject, scaleToSize);

                        resolve();
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
     * @returns a new AdvancedDynamicTexture
     */
    public static CreateForMesh(mesh: AbstractMesh, width = 1024, height = 1024, supportPointerMove = true, onlyAlphaTesting = false, invertY?: boolean): AdvancedDynamicTexture {
        // use a unique ID in name so serialization will work even if you create two ADTs for a single mesh
        const uniqueId = RandomGUID();
        var result = new AdvancedDynamicTexture(`AdvancedDynamicTexture for ${mesh.name} [${uniqueId}]`, width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE, invertY);
        var material = new StandardMaterial(`AdvancedDynamicTextureMaterial for ${mesh.name} [${uniqueId}]`, mesh.getScene());
        material.backFaceCulling = false;
        material.diffuseColor = Color3.Black();
        material.specularColor = Color3.Black();
        if (onlyAlphaTesting) {
            material.diffuseTexture = result;
            material.emissiveTexture = result;
            result.hasAlpha = true;
        } else {
            material.emissiveTexture = result;
            material.opacityTexture = result;
        }
        mesh.material = material;
        result.attachToMesh(mesh, supportPointerMove);
        return result;
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
        var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE, invertY);
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
    public static CreateFullscreenUI(name: string, foreground: boolean = true, scene: Nullable<Scene> = null, sampling = Texture.BILINEAR_SAMPLINGMODE, adaptiveScaling: boolean = false): AdvancedDynamicTexture {
        var result = new AdvancedDynamicTexture(name, 0, 0, scene, false, sampling);
        // Display
        const resultScene = result.getScene();
        var layer = new Layer(name + "_layer", null, resultScene, !foreground);
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
}
