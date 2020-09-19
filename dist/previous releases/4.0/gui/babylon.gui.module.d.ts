declare module "babylonjs-gui/2D/valueAndUnit" {
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /**
     * Class used to specific a value and its associated unit
     */
    export class ValueAndUnit {
        /** defines the unit to store */
        unit: number;
        /** defines a boolean indicating if the value can be negative */
        negativeValueAllowed: boolean;
        private _value;
        private _originalUnit;
        /**
         * Gets or sets a value indicating that this value will not scale accordingly with adaptive scaling property
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
         */
        ignoreAdaptiveScaling: boolean;
        /**
         * Creates a new ValueAndUnit
         * @param value defines the value to store
         * @param unit defines the unit to store
         * @param negativeValueAllowed defines a boolean indicating if the value can be negative
         */
        constructor(value: number, 
        /** defines the unit to store */
        unit?: number, 
        /** defines a boolean indicating if the value can be negative */
        negativeValueAllowed?: boolean);
        /** Gets a boolean indicating if the value is a percentage */
        readonly isPercentage: boolean;
        /** Gets a boolean indicating if the value is store as pixel */
        readonly isPixel: boolean;
        /** Gets direct internal value */
        readonly internalValue: number;
        /**
         * Gets value as pixel
         * @param host defines the root host
         * @param refValue defines the reference value for percentages
         * @returns the value as pixel
         */
        getValueInPixel(host: AdvancedDynamicTexture, refValue: number): number;
        /**
         * Update the current value and unit. This should be done cautiously as the GUi won't be marked as dirty with this function.
         * @param value defines the value to store
         * @param unit defines the unit to store
         * @returns the current ValueAndUnit
         */
        updateInPlace(value: number, unit?: number): ValueAndUnit;
        /**
         * Gets the value accordingly to its unit
         * @param host  defines the root host
         * @returns the value
         */
        getValue(host: AdvancedDynamicTexture): number;
        /**
         * Gets a string representation of the value
         * @param host defines the root host
         * @param decimals defines an optional number of decimals to display
         * @returns a string
         */
        toString(host: AdvancedDynamicTexture, decimals?: number): string;
        /**
         * Store a value parsed from a string
         * @param source defines the source string
         * @returns true if the value was successfully parsed
         */
        fromString(source: string | number): boolean;
        private static _Regex;
        private static _UNITMODE_PERCENTAGE;
        private static _UNITMODE_PIXEL;
        /** UNITMODE_PERCENTAGE */
        static readonly UNITMODE_PERCENTAGE: number;
        /** UNITMODE_PIXEL */
        static readonly UNITMODE_PIXEL: number;
    }
}
declare module "babylonjs-gui/2D/style" {
    import { Observable } from "babylonjs/Misc/observable";
    import { IDisposable } from "babylonjs/scene";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";
    /**
     * Define a style used by control to automatically setup properties based on a template.
     * Only support font related properties so far
     */
    export class Style implements IDisposable {
        private _fontFamily;
        private _fontStyle;
        private _fontWeight;
        /** @hidden */
        _host: AdvancedDynamicTexture;
        /** @hidden */
        _fontSize: ValueAndUnit;
        /**
         * Observable raised when the style values are changed
         */
        onChangedObservable: Observable<Style>;
        /**
         * Creates a new style object
         * @param host defines the AdvancedDynamicTexture which hosts this style
         */
        constructor(host: AdvancedDynamicTexture);
        /**
         * Gets or sets the font size
         */
        fontSize: string | number;
        /**
         * Gets or sets the font family
         */
        fontFamily: string;
        /**
         * Gets or sets the font style
         */
        fontStyle: string;
        /** Gets or sets font weight */
        fontWeight: string;
        /** Dispose all associated resources */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/math2D" {
    import { Nullable } from "babylonjs/types";
    import { Vector2 } from "babylonjs/Maths/math";
    /**
     * Class used to transport Vector2 information for pointer events
     */
    export class Vector2WithInfo extends Vector2 {
        /** defines the current mouse button index */
        buttonIndex: number;
        /**
         * Creates a new Vector2WithInfo
         * @param source defines the vector2 data to transport
         * @param buttonIndex defines the current mouse button index
         */
        constructor(source: Vector2, 
        /** defines the current mouse button index */
        buttonIndex?: number);
    }
    /** Class used to provide 2D matrix features */
    export class Matrix2D {
        /** Gets the internal array of 6 floats used to store matrix data */
        m: Float32Array;
        /**
         * Creates a new matrix
         * @param m00 defines value for (0, 0)
         * @param m01 defines value for (0, 1)
         * @param m10 defines value for (1, 0)
         * @param m11 defines value for (1, 1)
         * @param m20 defines value for (2, 0)
         * @param m21 defines value for (2, 1)
         */
        constructor(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number);
        /**
         * Fills the matrix from direct values
         * @param m00 defines value for (0, 0)
         * @param m01 defines value for (0, 1)
         * @param m10 defines value for (1, 0)
         * @param m11 defines value for (1, 1)
         * @param m20 defines value for (2, 0)
         * @param m21 defines value for (2, 1)
         * @returns the current modified matrix
         */
        fromValues(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number): Matrix2D;
        /**
         * Gets matrix determinant
         * @returns the determinant
         */
        determinant(): number;
        /**
         * Inverses the matrix and stores it in a target matrix
         * @param result defines the target matrix
         * @returns the current matrix
         */
        invertToRef(result: Matrix2D): Matrix2D;
        /**
         * Multiplies the current matrix with another one
         * @param other defines the second operand
         * @param result defines the target matrix
         * @returns the current matrix
         */
        multiplyToRef(other: Matrix2D, result: Matrix2D): Matrix2D;
        /**
         * Applies the current matrix to a set of 2 floats and stores the result in a vector2
         * @param x defines the x coordinate to transform
         * @param y defines the x coordinate to transform
         * @param result defines the target vector2
         * @returns the current matrix
         */
        transformCoordinates(x: number, y: number, result: Vector2): Matrix2D;
        /**
         * Creates an identity matrix
         * @returns a new matrix
         */
        static Identity(): Matrix2D;
        /**
         * Creates a translation matrix and stores it in a target matrix
         * @param x defines the x coordinate of the translation
         * @param y defines the y coordinate of the translation
         * @param result defines the target matrix
         */
        static TranslationToRef(x: number, y: number, result: Matrix2D): void;
        /**
         * Creates a scaling matrix and stores it in a target matrix
         * @param x defines the x coordinate of the scaling
         * @param y defines the y coordinate of the scaling
         * @param result defines the target matrix
         */
        static ScalingToRef(x: number, y: number, result: Matrix2D): void;
        /**
         * Creates a rotation matrix and stores it in a target matrix
         * @param angle defines the rotation angle
         * @param result defines the target matrix
         */
        static RotationToRef(angle: number, result: Matrix2D): void;
        private static _TempPreTranslationMatrix;
        private static _TempPostTranslationMatrix;
        private static _TempRotationMatrix;
        private static _TempScalingMatrix;
        private static _TempCompose0;
        private static _TempCompose1;
        private static _TempCompose2;
        /**
         * Composes a matrix from translation, rotation, scaling and parent matrix and stores it in a target matrix
         * @param tx defines the x coordinate of the translation
         * @param ty defines the y coordinate of the translation
         * @param angle defines the rotation angle
         * @param scaleX defines the x coordinate of the scaling
         * @param scaleY defines the y coordinate of the scaling
         * @param parentMatrix defines the parent matrix to multiply by (can be null)
         * @param result defines the target matrix
         */
        static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: Nullable<Matrix2D>, result: Matrix2D): void;
    }
}
declare module "babylonjs-gui/2D/measure" {
    import { Matrix2D } from "babylonjs-gui/2D/math2D";
    /**
     * Class used to store 2D control sizes
     */
    export class Measure {
        /** defines left coordinate */
        left: number;
        /** defines top coordinate  */
        top: number;
        /** defines width dimension  */
        width: number;
        /** defines height dimension */
        height: number;
        /**
         * Creates a new measure
         * @param left defines left coordinate
         * @param top defines top coordinate
         * @param width defines width dimension
         * @param height defines height dimension
         */
        constructor(
        /** defines left coordinate */
        left: number, 
        /** defines top coordinate  */
        top: number, 
        /** defines width dimension  */
        width: number, 
        /** defines height dimension */
        height: number);
        /**
         * Copy from another measure
         * @param other defines the other measure to copy from
         */
        copyFrom(other: Measure): void;
        /**
         * Copy from a group of 4 floats
         * @param left defines left coordinate
         * @param top defines top coordinate
         * @param width defines width dimension
         * @param height defines height dimension
         */
        copyFromFloats(left: number, top: number, width: number, height: number): void;
        /**
         * Computes the axis aligned bounding box measure for two given measures
         * @param a Input measure
         * @param b Input measure
         * @param result the resulting bounding measure
         */
        static CombineToRef(a: Measure, b: Measure, result: Measure): void;
        /**
         * Computes the axis aligned bounding box of the measure after it is modified by a given transform
         * @param transform the matrix to transform the measure before computing the AABB
         * @param result the resulting AABB
         */
        transformToRef(transform: Matrix2D, result: Measure): void;
        /**
         * Check equality between this measure and another one
         * @param other defines the other measures
         * @returns true if both measures are equals
         */
        isEqualsTo(other: Measure): boolean;
        /**
         * Creates an empty measure
         * @returns a new measure
         */
        static Empty(): Measure;
    }
}
declare module "babylonjs-gui/2D/advancedDynamicTexture" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Viewport, Vector2, Vector3, Matrix } from "babylonjs/Maths/math";
    import { ClipboardInfo } from "babylonjs/Events/clipboardEvents";
    import { DynamicTexture } from "babylonjs/Materials/Textures/dynamicTexture";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { Layer } from "babylonjs/Layers/layer";
    import { Scene } from "babylonjs/scene";
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Style } from "babylonjs-gui/2D/style";
    /**
    * Interface used to define a control that can receive focus
    */
    export interface IFocusableControl {
        /**
         * Function called when the control receives the focus
         */
        onFocus(): void;
        /**
         * Function called when the control loses the focus
         */
        onBlur(): void;
        /**
         * Function called to let the control handle keyboard events
         * @param evt defines the current keyboard event
         */
        processKeyboard(evt: KeyboardEvent): void;
        /**
        * Function called to get the list of controls that should not steal the focus from this control
        * @returns an array of controls
        */
        keepsFocusWith(): Nullable<Control[]>;
    }
    /**
    * Class used to create texture to support 2D GUI elements
    * @see http://doc.babylonjs.com/how_to/gui
    */
    export class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _preKeyboardObserver;
        private _pointerMoveObserver;
        private _pointerObserver;
        private _canvasPointerOutObserver;
        private _background;
        /** @hidden */
        _rootContainer: Container;
        /** @hidden */
        _lastPickedControl: Control;
        /** @hidden */
        _lastControlOver: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _lastControlDown: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _capturingControl: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _shouldBlockPointer: boolean;
        /** @hidden */
        _layerToDispose: Nullable<Layer>;
        /** @hidden */
        _linkedControls: Control[];
        private _isFullscreen;
        private _fullscreenViewport;
        private _idealWidth;
        private _idealHeight;
        private _useSmallestIdeal;
        private _renderAtIdealSize;
        private _focusedControl;
        private _blockNextFocusCheck;
        private _renderScale;
        private _rootCanvas;
        private _cursorChanged;
        /**
        * Define type to string to ensure compatibility across browsers
        * Safari doesn't support DataTransfer constructor
        */
        private _clipboardData;
        /**
        * Observable event triggered each time an clipboard event is received from the rendering canvas
        */
        onClipboardObservable: Observable<ClipboardInfo>;
        /**
        * Observable event triggered each time a pointer down is intercepted by a control
        */
        onControlPickedObservable: Observable<Control>;
        /**
        * Observable event triggered before layout is evaluated
        */
        onBeginLayoutObservable: Observable<AdvancedDynamicTexture>;
        /**
        * Observable event triggered after the layout was evaluated
        */
        onEndLayoutObservable: Observable<AdvancedDynamicTexture>;
        /**
        * Observable event triggered before the texture is rendered
        */
        onBeginRenderObservable: Observable<AdvancedDynamicTexture>;
        /**
        * Observable event triggered after the texture was rendered
        */
        onEndRenderObservable: Observable<AdvancedDynamicTexture>;
        /**
        * Gets or sets a boolean defining if alpha is stored as premultiplied
        */
        premulAlpha: boolean;
        /**
        * Gets or sets a number used to scale rendering size (2 means that the texture will be twice bigger).
        * Useful when you want more antialiasing
        */
        renderScale: number;
        /** Gets or sets the background color */
        background: string;
        /**
        * Gets or sets the ideal width used to design controls.
        * The GUI will then rescale everything accordingly
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        idealWidth: number;
        /**
        * Gets or sets the ideal height used to design controls.
        * The GUI will then rescale everything accordingly
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        idealHeight: number;
        /**
        * Gets or sets a boolean indicating if the smallest ideal value must be used if idealWidth and idealHeight are both set
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        useSmallestIdeal: boolean;
        /**
        * Gets or sets a boolean indicating if adaptive scaling must be used
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        renderAtIdealSize: boolean;
        /**
        * Gets the underlying layer used to render the texture when in fullscreen mode
        */
        readonly layer: Nullable<Layer>;
        /**
        * Gets the root container control
        */
        readonly rootContainer: Container;
        /**
        * Returns an array containing the root container.
        * This is mostly used to let the Inspector introspects the ADT
        * @returns an array containing the rootContainer
        */
        getChildren(): Array<Container>;
        /**
        * Will return all controls that are inside this texture
        * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
        * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
        * @return all child controls
        */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[];
        /**
        * Gets or sets the current focused control
        */
        focusedControl: Nullable<IFocusableControl>;
        /**
        * Gets or sets a boolean indicating if the texture must be rendered in background or foreground when in fullscreen mode
        */
        isForeground: boolean;
        /**
        * Gets or set information about clipboardData
        */
        clipboardData: string;
        /**
       * Creates a new AdvancedDynamicTexture
       * @param name defines the name of the texture
       * @param width defines the width of the texture
       * @param height defines the height of the texture
       * @param scene defines the hosting scene
       * @param generateMipMaps defines a boolean indicating if mipmaps must be generated (false by default)
       * @param samplingMode defines the texture sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
       */
        constructor(name: string, width: number | undefined, height: number | undefined, scene: Nullable<Scene>, generateMipMaps?: boolean, samplingMode?: number);
        /**
        * Get the current class name of the texture useful for serialization or dynamic coding.
        * @returns "AdvancedDynamicTexture"
        */
        getClassName(): string;
        /**
        * Function used to execute a function on all controls
        * @param func defines the function to execute
        * @param container defines the container where controls belong. If null the root container will be used
        */
        executeOnAllControls(func: (control: Control) => void, container?: Container): void;
        private _useInvalidateRectOptimization;
        /**
         * Gets or sets a boolean indicating if the InvalidateRect optimization should be turned on
         */
        useInvalidateRectOptimization: boolean;
        private _invalidatedRectangle;
        /**
         * Invalidates a rectangle area on the gui texture
         * @param invalidMinX left most position of the rectangle to invalidate in the texture
         * @param invalidMinY top most position of the rectangle to invalidate in the texture
         * @param invalidMaxX right most position of the rectangle to invalidate in the texture
         * @param invalidMaxY bottom most position of the rectangle to invalidate in the texture
         */
        invalidateRect(invalidMinX: number, invalidMinY: number, invalidMaxX: number, invalidMaxY: number): void;
        /**
        * Marks the texture as dirty forcing a complete update
        */
        markAsDirty(): void;
        /**
        * Helper function used to create a new style
        * @returns a new style
        * @see http://doc.babylonjs.com/how_to/gui#styles
        */
        createStyle(): Style;
        /**
        * Adds a new control to the root container
        * @param control defines the control to add
        * @returns the current texture
        */
        addControl(control: Control): AdvancedDynamicTexture;
        /**
        * Removes a control from the root container
        * @param control defines the control to remove
        * @returns the current texture
        */
        removeControl(control: Control): AdvancedDynamicTexture;
        /**
        * Release all resources
        */
        dispose(): void;
        private _onResize;
        /** @hidden */
        _getGlobalViewport(scene: Scene): Viewport;
        /**
        * Get screen coordinates for a vector3
        * @param position defines the position to project
        * @param worldMatrix defines the world matrix to use
        * @returns the projected position
        */
        getProjectedPosition(position: Vector3, worldMatrix: Matrix): Vector2;
        private _checkUpdate;
        private _clearMeasure;
        private _render;
        /** @hidden */
        _changeCursor(cursor: string): void;
        /** @hidden */
        _registerLastControlDown(control: Control, pointerId: number): void;
        private _doPicking;
        /** @hidden */
        _cleanControlAfterRemovalFromList(list: {
            [pointerId: number]: Control;
        }, control: Control): void;
        /** @hidden */
        _cleanControlAfterRemoval(control: Control): void;
        /** Attach to all scene events required to support pointer events */
        attach(): void;
        /** @hidden */
        private onClipboardCopy;
        /** @hidden */
        private onClipboardCut;
        /** @hidden */
        private onClipboardPaste;
        /**
        * Register the clipboard Events onto the canvas
        */
        registerClipboardEvents(): void;
        /**
         * Unregister the clipboard Events from the canvas
         */
        unRegisterClipboardEvents(): void;
        /**
        * Connect the texture to a hosting mesh to enable interactions
        * @param mesh defines the mesh to attach to
        * @param supportPointerMove defines a boolean indicating if pointer move events must be catched as well
        */
        attachToMesh(mesh: AbstractMesh, supportPointerMove?: boolean): void;
        /**
        * Move the focus to a specific control
        * @param control defines the control which will receive the focus
        */
        moveFocusToControl(control: IFocusableControl): void;
        private _manageFocus;
        private _attachToOnPointerOut;
        /**
         * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh)
         * @param mesh defines the mesh which will receive the texture
         * @param width defines the texture width (1024 by default)
         * @param height defines the texture height (1024 by default)
         * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
         * @param onlyAlphaTesting defines a boolean indicating that alpha blending will not be used (only alpha testing) (false by default)
         * @returns a new AdvancedDynamicTexture
         */
        static CreateForMesh(mesh: AbstractMesh, width?: number, height?: number, supportPointerMove?: boolean, onlyAlphaTesting?: boolean): AdvancedDynamicTexture;
        /**
        * Creates a new AdvancedDynamicTexture in fullscreen mode.
        * In this mode the texture will rely on a layer for its rendering.
        * This allows it to be treated like any other layer.
        * As such, if you have a multi camera setup, you can set the layerMask on the GUI as well.
        * LayerMask is set through advancedTexture.layer.layerMask
        * @param name defines name for the texture
        * @param foreground defines a boolean indicating if the texture must be rendered in foreground (default is true)
        * @param scene defines the hsoting scene
        * @param sampling defines the texture sampling mode (Texture.BILINEAR_SAMPLINGMODE by default)
        * @returns a new AdvancedDynamicTexture
        */
        static CreateFullscreenUI(name: string, foreground?: boolean, scene?: Nullable<Scene>, sampling?: number): AdvancedDynamicTexture;
    }
}
declare module "babylonjs-gui/2D/controls/control" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector2, Vector3 } from "babylonjs/Maths/math";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { Scene } from "babylonjs/scene";
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";
    import { Measure } from "babylonjs-gui/2D/measure";
    import { Style } from "babylonjs-gui/2D/style";
    import { Matrix2D, Vector2WithInfo } from "babylonjs-gui/2D/math2D";
    /**
     * Root class used for all 2D controls
     * @see http://doc.babylonjs.com/how_to/gui#controls
     */
    export class Control {
        /** defines the name of the control */
        name?: string | undefined;
        /**
         * Gets or sets a boolean indicating if alpha must be an inherited value (false by default)
         */
        static AllowAlphaInheritance: boolean;
        private _alpha;
        private _alphaSet;
        private _zIndex;
        /** @hidden */
        _host: AdvancedDynamicTexture;
        /** Gets or sets the control parent */
        parent: Nullable<Container>;
        /** @hidden */
        _currentMeasure: Measure;
        private _fontFamily;
        private _fontStyle;
        private _fontWeight;
        private _fontSize;
        private _font;
        /** @hidden */
        _width: ValueAndUnit;
        /** @hidden */
        _height: ValueAndUnit;
        /** @hidden */
        protected _fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        private _color;
        private _style;
        private _styleObserver;
        /** @hidden */
        protected _horizontalAlignment: number;
        /** @hidden */
        protected _verticalAlignment: number;
        /** @hidden */
        protected _isDirty: boolean;
        /** @hidden */
        protected _wasDirty: boolean;
        /** @hidden */
        _tempParentMeasure: Measure;
        /** @hidden */
        _prevCurrentMeasureTransformedIntoGlobalSpace: Measure;
        /** @hidden */
        protected _cachedParentMeasure: Measure;
        private _paddingLeft;
        private _paddingRight;
        private _paddingTop;
        private _paddingBottom;
        /** @hidden */
        _left: ValueAndUnit;
        /** @hidden */
        _top: ValueAndUnit;
        private _scaleX;
        private _scaleY;
        private _rotation;
        private _transformCenterX;
        private _transformCenterY;
        /** @hidden */
        _transformMatrix: Matrix2D;
        /** @hidden */
        protected _invertTransformMatrix: Matrix2D;
        /** @hidden */
        protected _transformedPosition: Vector2;
        private _isMatrixDirty;
        private _cachedOffsetX;
        private _cachedOffsetY;
        private _isVisible;
        private _isHighlighted;
        /** @hidden */
        _linkedMesh: Nullable<AbstractMesh>;
        private _fontSet;
        private _dummyVector2;
        private _downCount;
        private _enterCount;
        private _doNotRender;
        private _downPointerIds;
        protected _isEnabled: boolean;
        protected _disabledColor: string;
        /** @hidden */
        protected _rebuildLayout: boolean;
        /** @hidden */
        _isClipped: boolean;
        /** @hidden */
        _tag: any;
        /**
         * Gets or sets the unique id of the node. Please note that this number will be updated when the control is added to a container
         */
        uniqueId: number;
        /**
         * Gets or sets an object used to store user defined information for the node
         */
        metadata: any;
        /** Gets or sets a boolean indicating if the control can be hit with pointer events */
        isHitTestVisible: boolean;
        /** Gets or sets a boolean indicating if the control can block pointer events */
        isPointerBlocker: boolean;
        /** Gets or sets a boolean indicating if the control can be focusable */
        isFocusInvisible: boolean;
        /**
         * Gets or sets a boolean indicating if the children are clipped to the current control bounds.
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        clipChildren: boolean;
        /**
         * Gets or sets a boolean indicating that control content must be clipped
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        clipContent: boolean;
        /**
         * Gets or sets a boolean indicating that the current control should cache its rendering (useful when the control does not change often)
         */
        useBitmapCache: boolean;
        private _cacheData;
        private _shadowOffsetX;
        /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
        shadowOffsetX: number;
        private _shadowOffsetY;
        /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
        shadowOffsetY: number;
        private _shadowBlur;
        /** Gets or sets a value indicating the amount of blur to use to render the shadow */
        shadowBlur: number;
        private _shadowColor;
        /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
        shadowColor: string;
        /** Gets or sets the cursor to use when the control is hovered */
        hoverCursor: string;
        /** @hidden */
        protected _linkOffsetX: ValueAndUnit;
        /** @hidden */
        protected _linkOffsetY: ValueAndUnit;
        /** Gets the control type name */
        readonly typeName: string;
        /**
         * Get the current class name of the control.
         * @returns current class name
         */
        getClassName(): string;
        /**
        * An event triggered when the pointer move over the control.
        */
        onPointerMoveObservable: Observable<Vector2>;
        /**
        * An event triggered when the pointer move out of the control.
        */
        onPointerOutObservable: Observable<Control>;
        /**
        * An event triggered when the pointer taps the control
        */
        onPointerDownObservable: Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer up
        */
        onPointerUpObservable: Observable<Vector2WithInfo>;
        /**
        * An event triggered when a control is clicked on
        */
        onPointerClickObservable: Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer enters the control
        */
        onPointerEnterObservable: Observable<Control>;
        /**
        * An event triggered when the control is marked as dirty
        */
        onDirtyObservable: Observable<Control>;
        /**
         * An event triggered before drawing the control
         */
        onBeforeDrawObservable: Observable<Control>;
        /**
         * An event triggered after the control was drawn
         */
        onAfterDrawObservable: Observable<Control>;
        /**
         * Get the hosting AdvancedDynamicTexture
         */
        readonly host: AdvancedDynamicTexture;
        /** Gets or set information about font offsets (used to render and align text) */
        fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
        alpha: number;
        /**
         * Gets or sets a boolean indicating that we want to highlight the control (mostly for debugging purpose)
         */
        isHighlighted: boolean;
        /** Gets or sets a value indicating the scale factor on X axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        scaleX: number;
        /** Gets or sets a value indicating the scale factor on Y axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        scaleY: number;
        /** Gets or sets the rotation angle (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        rotation: number;
        /** Gets or sets the transformation center on Y axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        transformCenterY: number;
        /** Gets or sets the transformation center on X axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        transformCenterX: number;
        /**
         * Gets or sets the horizontal alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
         */
        horizontalAlignment: number;
        /**
         * Gets or sets the vertical alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
         */
        verticalAlignment: number;
        /**
         * Gets or sets control width
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        width: string | number;
        /**
         * Gets or sets the control width in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        widthInPixels: number;
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        height: string | number;
        /**
         * Gets or sets control height in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        heightInPixels: number;
        /** Gets or set font family */
        fontFamily: string;
        /** Gets or sets font style */
        fontStyle: string;
        /** Gets or sets font weight */
        fontWeight: string;
        /**
         * Gets or sets style
         * @see http://doc.babylonjs.com/how_to/gui#styles
         */
        style: Nullable<Style>;
        /** @hidden */
        readonly _isFontSizeInPercentage: boolean;
        /** Gets or sets font size in pixels */
        fontSizeInPixels: number;
        /** Gets or sets font size */
        fontSize: string | number;
        /** Gets or sets foreground color */
        color: string;
        /** Gets or sets z index which is used to reorder controls on the z axis */
        zIndex: number;
        /** Gets or sets a boolean indicating if the control can be rendered */
        notRenderable: boolean;
        /** Gets or sets a boolean indicating if the control is visible */
        isVisible: boolean;
        /** Gets a boolean indicating that the control needs to update its rendering */
        readonly isDirty: boolean;
        /**
         * Gets the current linked mesh (or null if none)
         */
        readonly linkedMesh: Nullable<AbstractMesh>;
        /**
         * Gets or sets a value indicating the padding to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingLeft: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingLeftInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingRight: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingRightInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingTop: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingTopInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingBottom: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingBottomInPixels: number;
        /**
         * Gets or sets a value indicating the left coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        left: string | number;
        /**
         * Gets or sets a value indicating the left coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        leftInPixels: number;
        /**
         * Gets or sets a value indicating the top coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        top: string | number;
        /**
         * Gets or sets a value indicating the top coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        topInPixels: number;
        /**
         * Gets or sets a value indicating the offset on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetX: string | number;
        /**
         * Gets or sets a value indicating the offset in pixels on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetXInPixels: number;
        /**
         * Gets or sets a value indicating the offset on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetY: string | number;
        /**
         * Gets or sets a value indicating the offset in pixels on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetYInPixels: number;
        /** Gets the center coordinate on X axis */
        readonly centerX: number;
        /** Gets the center coordinate on Y axis */
        readonly centerY: number;
        /** Gets or sets if control is Enabled*/
        isEnabled: boolean;
        /** Gets or sets background color of control if it's disabled*/
        disabledColor: string;
        /**
         * Creates a new control
         * @param name defines the name of the control
         */
        constructor(
        /** defines the name of the control */
        name?: string | undefined);
        /** @hidden */
        protected _getTypeName(): string;
        /**
         * Gets the first ascendant in the hierarchy of the given type
         * @param className defines the required type
         * @returns the ascendant or null if not found
         */
        getAscendantOfClass(className: string): Nullable<Control>;
        /** @hidden */
        _resetFontCache(): void;
        /**
         * Determines if a container is an ascendant of the current control
         * @param container defines the container to look for
         * @returns true if the container is one of the ascendant of the control
         */
        isAscendant(container: Control): boolean;
        /**
         * Gets coordinates in local control space
         * @param globalCoordinates defines the coordinates to transform
         * @returns the new coordinates in local space
         */
        getLocalCoordinates(globalCoordinates: Vector2): Vector2;
        /**
         * Gets coordinates in local control space
         * @param globalCoordinates defines the coordinates to transform
         * @param result defines the target vector2 where to store the result
         * @returns the current control
         */
        getLocalCoordinatesToRef(globalCoordinates: Vector2, result: Vector2): Control;
        /**
         * Gets coordinates in parent local control space
         * @param globalCoordinates defines the coordinates to transform
         * @returns the new coordinates in parent local space
         */
        getParentLocalCoordinates(globalCoordinates: Vector2): Vector2;
        /**
         * Move the current control to a vector3 position projected onto the screen.
         * @param position defines the target position
         * @param scene defines the hosting scene
         */
        moveToVector3(position: Vector3, scene: Scene): void;
        /** @hidden */
        _getDescendants(results: Control[], directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): void;
        /**
         * Will return all controls that have this control as ascendant
         * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
         * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
         * @return all child controls
         */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[];
        /**
         * Link current control with a target mesh
         * @param mesh defines the mesh to link with
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkWithMesh(mesh: Nullable<AbstractMesh>): void;
        /** @hidden */
        _moveToProjectedPosition(projectedPosition: Vector3): void;
        /** @hidden */
        _offsetLeft(offset: number): void;
        /** @hidden */
        _offsetTop(offset: number): void;
        /** @hidden */
        _markMatrixAsDirty(): void;
        /** @hidden */
        _flagDescendantsAsMatrixDirty(): void;
        /** @hidden */
        _intersectsRect(rect: Measure): boolean;
        /** @hidden */
        protected invalidateRect(): void;
        /** @hidden */
        _markAsDirty(force?: boolean): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        protected _transform(context?: CanvasRenderingContext2D): void;
        /** @hidden */
        _renderHighlight(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _applyStates(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        /** @hidden */
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _evaluateClippingState(parentMeasure: Measure): void;
        /** @hidden */
        _measure(): void;
        /** @hidden */
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        private static _ClipMeasure;
        private _tmpMeasureA;
        private _clip;
        /** @hidden */
        _render(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): boolean;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void;
        /**
         * Tests if a given coordinates belong to the current control
         * @param x defines x coordinate to test
         * @param y defines y coordinate to test
         * @returns true if the coordinates are inside the control
         */
        contains(x: number, y: number): boolean;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void;
        /** @hidden */
        _onPointerEnter(target: Control): boolean;
        /** @hidden */
        _onPointerOut(target: Control, force?: boolean): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /** @hidden */
        _forcePointerUp(pointerId?: Nullable<number>): void;
        /** @hidden */
        _processObservables(type: number, x: number, y: number, pointerId: number, buttonIndex: number): boolean;
        private _prepareFont;
        /** Releases associated resources */
        dispose(): void;
        private static _HORIZONTAL_ALIGNMENT_LEFT;
        private static _HORIZONTAL_ALIGNMENT_RIGHT;
        private static _HORIZONTAL_ALIGNMENT_CENTER;
        private static _VERTICAL_ALIGNMENT_TOP;
        private static _VERTICAL_ALIGNMENT_BOTTOM;
        private static _VERTICAL_ALIGNMENT_CENTER;
        /** HORIZONTAL_ALIGNMENT_LEFT */
        static readonly HORIZONTAL_ALIGNMENT_LEFT: number;
        /** HORIZONTAL_ALIGNMENT_RIGHT */
        static readonly HORIZONTAL_ALIGNMENT_RIGHT: number;
        /** HORIZONTAL_ALIGNMENT_CENTER */
        static readonly HORIZONTAL_ALIGNMENT_CENTER: number;
        /** VERTICAL_ALIGNMENT_TOP */
        static readonly VERTICAL_ALIGNMENT_TOP: number;
        /** VERTICAL_ALIGNMENT_BOTTOM */
        static readonly VERTICAL_ALIGNMENT_BOTTOM: number;
        /** VERTICAL_ALIGNMENT_CENTER */
        static readonly VERTICAL_ALIGNMENT_CENTER: number;
        private static _FontHeightSizes;
        /** @hidden */
        static _GetFontOffset(font: string): {
            ascent: number;
            height: number;
            descent: number;
        };
        /**
         * Creates a stack panel that can be used to render headers
         * @param control defines the control to associate with the header
         * @param text defines the text of the header
         * @param size defines the size of the header
         * @param options defines options used to configure the header
         * @returns a new StackPanel
         * @ignore
         * @hidden
         */
        static AddHeader: (control: Control, text: string, size: string | number, options: {
            isHorizontal: boolean;
            controlFirst: boolean;
        }) => any;
        /** @hidden */
        protected static drawEllipse(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D): void;
    }
}
declare module "babylonjs-gui/2D/controls/container" {
    import { Nullable } from "babylonjs/types";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Measure } from "babylonjs-gui/2D/measure";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /**
     * Root class for 2D containers
     * @see http://doc.babylonjs.com/how_to/gui#containers
     */
    export class Container extends Control {
        name?: string | undefined;
        /** @hidden */
        protected _children: Control[];
        /** @hidden */
        protected _measureForChildren: Measure;
        /** @hidden */
        protected _background: string;
        /** @hidden */
        protected _adaptWidthToChildren: boolean;
        /** @hidden */
        protected _adaptHeightToChildren: boolean;
        /** Gets or sets a boolean indicating if the container should try to adapt to its children height */
        adaptHeightToChildren: boolean;
        /** Gets or sets a boolean indicating if the container should try to adapt to its children width */
        adaptWidthToChildren: boolean;
        /** Gets or sets background color */
        background: string;
        /** Gets the list of children */
        readonly children: Control[];
        /**
         * Creates a new Container
         * @param name defines the name of the container
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _flagDescendantsAsMatrixDirty(): void;
        /**
         * Gets a child using its name
         * @param name defines the child name to look for
         * @returns the child control if found
         */
        getChildByName(name: string): Nullable<Control>;
        /**
         * Gets a child using its type and its name
         * @param name defines the child name to look for
         * @param type defines the child type to look for
         * @returns the child control if found
         */
        getChildByType(name: string, type: string): Nullable<Control>;
        /**
         * Search for a specific control in children
         * @param control defines the control to look for
         * @returns true if the control is in child list
         */
        containsControl(control: Control): boolean;
        /**
         * Adds a new control to the current container
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: Nullable<Control>): Container;
        /**
         * Removes all controls from the current container
         * @returns the current container
         */
        clearControls(): Container;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /** @hidden */
        _reOrderControl(control: Control): void;
        /** @hidden */
        _offsetLeft(offset: number): void;
        /** @hidden */
        _offsetTop(offset: number): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        protected _localDraw(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        protected _beforeLayout(): void;
        /** @hidden */
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        protected _postMeasure(): void;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Measure): void;
        /** @hidden */
        _getDescendants(results: Control[], directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): void;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/rectangle" {
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { Measure } from "babylonjs-gui/2D/measure";
    /** Class used to create rectangle container */
    export class Rectangle extends Container {
        name?: string | undefined;
        private _thickness;
        private _cornerRadius;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets the corner radius angle */
        cornerRadius: number;
        /**
         * Creates a new Rectangle
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawRoundedRect;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}
declare module "babylonjs-gui/2D/controls/textBlock" {
    import { Observable } from "babylonjs/Misc/observable";
    import { Measure } from "babylonjs-gui/2D/measure";
    import { Control } from "babylonjs-gui/2D/controls/control";
    /**
     * Enum that determines the text-wrapping mode to use.
     */
    export enum TextWrapping {
        /**
         * Clip the text when it's larger than Control.width; this is the default mode.
         */
        Clip = 0,
        /**
         * Wrap the text word-wise, i.e. try to add line-breaks at word boundary to fit within Control.width.
         */
        WordWrap = 1,
        /**
         * Ellipsize the text, i.e. shrink with trailing … when text is larger than Control.width.
         */
        Ellipsis = 2
    }
    /**
     * Class used to create text block control
     */
    export class TextBlock extends Control {
        /**
         * Defines the name of the control
         */
        name?: string | undefined;
        private _text;
        private _textWrapping;
        private _textHorizontalAlignment;
        private _textVerticalAlignment;
        private _lines;
        private _resizeToFit;
        private _lineSpacing;
        private _outlineWidth;
        private _outlineColor;
        /**
        * An event triggered after the text is changed
        */
        onTextChangedObservable: Observable<TextBlock>;
        /**
        * An event triggered after the text was broken up into lines
        */
        onLinesReadyObservable: Observable<TextBlock>;
        /**
         * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
         */
        readonly lines: any[];
        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */
        /**
        * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
        */
        resizeToFit: boolean;
        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */
        /**
        * Gets or sets a boolean indicating if text must be wrapped
        */
        textWrapping: TextWrapping | boolean;
        /**
         * Gets or sets text to display
         */
        /**
        * Gets or sets text to display
        */
        text: string;
        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */
        /**
        * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
        */
        textHorizontalAlignment: number;
        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */
        /**
        * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
        */
        textVerticalAlignment: number;
        /**
         * Gets or sets line spacing value
         */
        /**
        * Gets or sets line spacing value
        */
        lineSpacing: string | number;
        /**
         * Gets or sets outlineWidth of the text to display
         */
        /**
        * Gets or sets outlineWidth of the text to display
        */
        outlineWidth: number;
        /**
         * Gets or sets outlineColor of the text to display
         */
        /**
        * Gets or sets outlineColor of the text to display
        */
        outlineColor: string;
        /**
         * Creates a new TextBlock object
         * @param name defines the name of the control
         * @param text defines the text to display (emptry string by default)
         */
        constructor(
        /**
         * Defines the name of the control
         */
        name?: string | undefined, text?: string);
        protected _getTypeName(): string;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawText;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        protected _applyStates(context: CanvasRenderingContext2D): void;
        protected _breakLines(refWidth: number, context: CanvasRenderingContext2D): object[];
        protected _parseLine(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _parseLineEllipsis(line: string | undefined, width: number, context: CanvasRenderingContext2D): object;
        protected _parseLineWordWrap(line: string | undefined, width: number, context: CanvasRenderingContext2D): object[];
        protected _renderLines(context: CanvasRenderingContext2D): void;
        /**
         * Given a width constraint applied on the text block, find the expected height
         * @returns expected height
         */
        computeExpectedHeight(): number;
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/image" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Measure } from "babylonjs-gui/2D/measure";
    /**
     * Class used to create 2D images
     */
    export class Image extends Control {
        name?: string | undefined;
        private static _WorkingCanvas;
        private _domImage;
        private _imageWidth;
        private _imageHeight;
        private _loaded;
        private _stretch;
        private _source;
        private _autoScale;
        private _sourceLeft;
        private _sourceTop;
        private _sourceWidth;
        private _sourceHeight;
        private _cellWidth;
        private _cellHeight;
        private _cellId;
        private _populateNinePatchSlicesFromImage;
        private _sliceLeft;
        private _sliceRight;
        private _sliceTop;
        private _sliceBottom;
        private _detectPointerOnOpaqueOnly;
        /**
         * Observable notified when the content is loaded
         */
        onImageLoadedObservable: Observable<Image>;
        /**
         * Gets a boolean indicating that the content is loaded
         */
        readonly isLoaded: boolean;
        /**
         * Gets or sets a boolean indicating if nine patch slices (left, top, right, bottom) should be read from image data
         */
        populateNinePatchSlicesFromImage: boolean;
        /**
         * Gets or sets a boolean indicating if pointers should only be validated on pixels with alpha > 0.
         * Beware using this as this will comsume more memory as the image has to be stored twice
         */
        detectPointerOnOpaqueOnly: boolean;
        /**
         * Gets or sets the left value for slicing (9-patch)
         */
        sliceLeft: number;
        /**
         * Gets or sets the right value for slicing (9-patch)
         */
        sliceRight: number;
        /**
         * Gets or sets the top value for slicing (9-patch)
         */
        sliceTop: number;
        /**
         * Gets or sets the bottom value for slicing (9-patch)
         */
        sliceBottom: number;
        /**
         * Gets or sets the left coordinate in the source image
         */
        sourceLeft: number;
        /**
         * Gets or sets the top coordinate in the source image
         */
        sourceTop: number;
        /**
         * Gets or sets the width to capture in the source image
         */
        sourceWidth: number;
        /**
         * Gets or sets the height to capture in the source image
         */
        sourceHeight: number;
        /**
         * Gets or sets a boolean indicating if the image can force its container to adapt its size
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        autoScale: boolean;
        /** Gets or sets the streching mode used by the image */
        stretch: number;
        /**
         * Gets or sets the internal DOM image used to render the control
         */
        domImage: HTMLImageElement;
        private _onImageLoaded;
        private _extractNinePatchSliceDataFromImage;
        /**
         * Gets or sets image source url
         */
        source: Nullable<string>;
        /**
         * Gets or sets the cell width to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellWidth: number;
        /**
         * Gets or sets the cell height to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellHeight: number;
        /**
         * Gets or sets the cell id to use (this will turn on the animation sheet mode)
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellId: number;
        /**
         * Creates a new Image
         * @param name defines the control name
         * @param url defines the image url
         */
        constructor(name?: string | undefined, url?: Nullable<string>);
        /**
         * Tests if a given coordinates belong to the current control
         * @param x defines x coordinate to test
         * @param y defines y coordinate to test
         * @returns true if the coordinates are inside the control
         */
        contains(x: number, y: number): boolean;
        protected _getTypeName(): string;
        /** Force the control to synchronize with its content */
        synchronizeSizeWithContent(): void;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _prepareWorkingCanvasForOpaqueDetection;
        private _drawImage;
        _draw(context: CanvasRenderingContext2D): void;
        private _renderCornerPatch;
        private _renderNinePatch;
        dispose(): void;
        /** STRETCH_NONE */
        static readonly STRETCH_NONE: number;
        /** STRETCH_FILL */
        static readonly STRETCH_FILL: number;
        /** STRETCH_UNIFORM */
        static readonly STRETCH_UNIFORM: number;
        /** STRETCH_EXTEND */
        static readonly STRETCH_EXTEND: number;
        /** NINE_PATCH */
        static readonly STRETCH_NINE_PATCH: number;
    }
}
declare module "babylonjs-gui/2D/controls/button" {
    import { Nullable } from "babylonjs/types";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
    import { Image } from "babylonjs-gui/2D/controls/image";
    /**
     * Class used to create 2D buttons
     */
    export class Button extends Rectangle {
        name?: string | undefined;
        /**
         * Function called to generate a pointer enter animation
         */
        pointerEnterAnimation: () => void;
        /**
         * Function called to generate a pointer out animation
         */
        pointerOutAnimation: () => void;
        /**
         * Function called to generate a pointer down animation
         */
        pointerDownAnimation: () => void;
        /**
         * Function called to generate a pointer up animation
         */
        pointerUpAnimation: () => void;
        private _image;
        /**
         * Returns the image part of the button (if any)
         */
        readonly image: Nullable<Image>;
        private _textBlock;
        /**
         * Returns the image part of the button (if any)
         */
        readonly textBlock: Nullable<TextBlock>;
        /**
         * Creates a new Button
         * @param name defines the name of the button
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerEnter(target: Control): boolean;
        /** @hidden */
        _onPointerOut(target: Control, force?: boolean): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /**
         * Creates a new button made with an image and a text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageButton(name: string, text: string, imageUrl: string): Button;
        /**
         * Creates a new button made with an image
         * @param name defines the name of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageOnlyButton(name: string, imageUrl: string): Button;
        /**
         * Creates a new button made with a text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @returns a new Button
         */
        static CreateSimpleButton(name: string, text: string): Button;
        /**
         * Creates a new button made with an image and a centered text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageWithCenterTextButton(name: string, text: string, imageUrl: string): Button;
    }
}
declare module "babylonjs-gui/2D/controls/stackPanel" {
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { Measure } from "babylonjs-gui/2D/measure";
    /**
     * Class used to create a 2D stack panel container
     */
    export class StackPanel extends Container {
        name?: string | undefined;
        private _isVertical;
        private _manualWidth;
        private _manualHeight;
        private _doNotTrackManualChanges;
        /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
        isVertical: boolean;
        /**
         * Gets or sets panel width.
         * This value should not be set when in horizontal mode as it will be computed automatically
         */
        width: string | number;
        /**
         * Gets or sets panel height.
         * This value should not be set when in vertical mode as it will be computed automatically
         */
        height: string | number;
        /**
         * Creates a new StackPanel
         * @param name defines control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
    }
}
declare module "babylonjs-gui/2D/controls/checkbox" {
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    /**
     * Class used to represent a 2D checkbox
     */
    export class Checkbox extends Control {
        name?: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        /** Gets or sets border thickness  */
        thickness: number;
        /**
         * Observable raised when isChecked property changes
         */
        onIsCheckedChangedObservable: Observable<boolean>;
        /** Gets or sets a value indicating the ratio between overall size and check size */
        checkSizeRatio: number;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        isChecked: boolean;
        /**
         * Creates a new CheckBox
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        /**
         * Utility function to easily create a checkbox with a header
         * @param title defines the label to use for the header
         * @param onValueChanged defines the callback to call when value changes
         * @returns a StackPanel containing the checkbox and a textBlock
         */
        static AddCheckBoxWithHeader(title: string, onValueChanged: (value: boolean) => void): StackPanel;
    }
}
declare module "babylonjs-gui/2D/controls/virtualKeyboard" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    /**
     * Class used to store key control properties
     */
    export class KeyPropertySet {
        /** Width */
        width?: string;
        /** Height */
        height?: string;
        /** Left padding */
        paddingLeft?: string;
        /** Right padding */
        paddingRight?: string;
        /** Top padding */
        paddingTop?: string;
        /** Bottom padding */
        paddingBottom?: string;
        /** Foreground color */
        color?: string;
        /** Background color */
        background?: string;
    }
    /**
     * Class used to create virtual keyboard
     */
    export class VirtualKeyboard extends StackPanel {
        /** Observable raised when a key is pressed */
        onKeyPressObservable: Observable<string>;
        /** Gets or sets default key button width */
        defaultButtonWidth: string;
        /** Gets or sets default key button height */
        defaultButtonHeight: string;
        /** Gets or sets default key button left padding */
        defaultButtonPaddingLeft: string;
        /** Gets or sets default key button right padding */
        defaultButtonPaddingRight: string;
        /** Gets or sets default key button top padding */
        defaultButtonPaddingTop: string;
        /** Gets or sets default key button bottom padding */
        defaultButtonPaddingBottom: string;
        /** Gets or sets default key button foreground color */
        defaultButtonColor: string;
        /** Gets or sets default key button background color */
        defaultButtonBackground: string;
        /** Gets or sets shift button foreground color */
        shiftButtonColor: string;
        /** Gets or sets shift button thickness*/
        selectedShiftThickness: number;
        /** Gets shift key state */
        shiftState: number;
        protected _getTypeName(): string;
        private _createKey;
        /**
         * Adds a new row of keys
         * @param keys defines the list of keys to add
         * @param propertySets defines the associated property sets
         */
        addKeysRow(keys: Array<string>, propertySets?: Array<KeyPropertySet>): void;
        /**
         * Set the shift key to a specific state
         * @param shiftState defines the new shift state
         */
        applyShiftState(shiftState: number): void;
        private _currentlyConnectedInputText;
        private _connectedInputTexts;
        private _onKeyPressObserver;
        /** Gets the input text control currently attached to the keyboard */
        readonly connectedInputText: Nullable<InputText>;
        /**
         * Connects the keyboard with an input text control
         *
         * @param input defines the target control
         */
        connect(input: InputText): void;
        /**
         * Disconnects the keyboard from connected InputText controls
         *
         * @param input optionally defines a target control, otherwise all are disconnected
         */
        disconnect(input?: InputText): void;
        private _removeConnectedInputObservables;
        /**
         * Release all resources
         */
        dispose(): void;
        /**
         * Creates a new keyboard using a default layout
         *
         * @param name defines control name
         * @returns a new VirtualKeyboard
         */
        static CreateDefaultLayout(name?: string): VirtualKeyboard;
    }
}
declare module "babylonjs-gui/2D/controls/inputText" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { IFocusableControl } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { VirtualKeyboard } from "babylonjs-gui/2D/controls/virtualKeyboard";
    /**
     * Class used to create input text control
     */
    export class InputText extends Control implements IFocusableControl {
        name?: string | undefined;
        private _text;
        private _placeholderText;
        private _background;
        private _focusedBackground;
        private _focusedColor;
        private _placeholderColor;
        private _thickness;
        private _margin;
        private _autoStretchWidth;
        private _maxWidth;
        private _isFocused;
        private _blinkTimeout;
        private _blinkIsEven;
        private _cursorOffset;
        private _scrollLeft;
        private _textWidth;
        private _clickedCoordinate;
        private _deadKey;
        private _addKey;
        private _currentKey;
        private _isTextHighlightOn;
        private _textHighlightColor;
        private _highligherOpacity;
        private _highlightedText;
        private _startHighlightIndex;
        private _endHighlightIndex;
        private _cursorIndex;
        private _onFocusSelectAll;
        private _isPointerDown;
        private _onClipboardObserver;
        private _onPointerDblTapObserver;
        /** @hidden */
        _connectedVirtualKeyboard: Nullable<VirtualKeyboard>;
        /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
        promptMessage: string;
        /** Observable raised when the text changes */
        onTextChangedObservable: Observable<InputText>;
        /** Observable raised just before an entered character is to be added */
        onBeforeKeyAddObservable: Observable<InputText>;
        /** Observable raised when the control gets the focus */
        onFocusObservable: Observable<InputText>;
        /** Observable raised when the control loses the focus */
        onBlurObservable: Observable<InputText>;
        /**Observable raised when the text is highlighted */
        onTextHighlightObservable: Observable<InputText>;
        /**Observable raised when copy event is triggered */
        onTextCopyObservable: Observable<InputText>;
        /** Observable raised when cut event is triggered */
        onTextCutObservable: Observable<InputText>;
        /** Observable raised when paste event is triggered */
        onTextPasteObservable: Observable<InputText>;
        /** Observable raised when a key event was processed */
        onKeyboardEventProcessedObservable: Observable<KeyboardEvent>;
        /** Gets or sets the maximum width allowed by the control */
        maxWidth: string | number;
        /** Gets the maximum width allowed by the control in pixels */
        readonly maxWidthInPixels: number;
        /** Gets or sets the text highlighter transparency; default: 0.4 */
        highligherOpacity: number;
        /** Gets or sets a boolean indicating whether to select complete text by default on input focus */
        onFocusSelectAll: boolean;
        /** Gets or sets the text hightlight color */
        textHighlightColor: string;
        /** Gets or sets control margin */
        margin: string;
        /** Gets control margin in pixels */
        readonly marginInPixels: number;
        /** Gets or sets a boolean indicating if the control can auto stretch its width to adapt to the text */
        autoStretchWidth: boolean;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets the background color when focused */
        focusedBackground: string;
        /** Gets or sets the background color when focused */
        focusedColor: string;
        /** Gets or sets the background color */
        background: string;
        /** Gets or sets the placeholder color */
        placeholderColor: string;
        /** Gets or sets the text displayed when the control is empty */
        placeholderText: string;
        /** Gets or sets the dead key flag */
        deadKey: boolean;
        /** Gets or sets the highlight text */
        highlightedText: string;
        /** Gets or sets if the current key should be added */
        addKey: boolean;
        /** Gets or sets the value of the current key being entered */
        currentKey: string;
        /** Gets or sets the text displayed in the control */
        text: string;
        /** Gets or sets control width */
        width: string | number;
        /**
         * Creates a new InputText
         * @param name defines the control name
         * @param text defines the text of the control
         */
        constructor(name?: string | undefined, text?: string);
        /** @hidden */
        onBlur(): void;
        /** @hidden */
        onFocus(): void;
        protected _getTypeName(): string;
        /**
         * Function called to get the list of controls that should not steal the focus from this control
         * @returns an array of controls
         */
        keepsFocusWith(): Nullable<Control[]>;
        /** @hidden */
        processKey(keyCode: number, key?: string, evt?: KeyboardEvent): void;
        /** @hidden */
        private _updateValueFromCursorIndex;
        /** @hidden */
        private _processDblClick;
        /** @hidden */
        private _selectAllText;
        /**
         * Handles the keyboard event
         * @param evt Defines the KeyboardEvent
         */
        processKeyboard(evt: KeyboardEvent): void;
        /** @hidden */
        private _onCopyText;
        /** @hidden */
        private _onCutText;
        /** @hidden */
        private _onPasteText;
        _draw(context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        protected _beforeRenderText(text: string): string;
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/grid" {
    import { Nullable } from "babylonjs/types";
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Measure } from "babylonjs-gui/2D/measure";
    /**
     * Class used to create a 2D grid container
     */
    export class Grid extends Container {
        name?: string | undefined;
        private _rowDefinitions;
        private _columnDefinitions;
        private _cells;
        private _childControls;
        /**
         * Gets the number of columns
         */
        readonly columnCount: number;
        /**
         * Gets the number of rows
         */
        readonly rowCount: number;
        /** Gets the list of children */
        readonly children: Control[];
        /** Gets the list of cells (e.g. the containers) */
        readonly cells: {
            [key: string]: Container;
        };
        /**
         * Gets the definition of a specific row
         * @param index defines the index of the row
         * @returns the row definition
         */
        getRowDefinition(index: number): Nullable<ValueAndUnit>;
        /**
         * Gets the definition of a specific column
         * @param index defines the index of the column
         * @returns the column definition
         */
        getColumnDefinition(index: number): Nullable<ValueAndUnit>;
        /**
         * Adds a new row to the grid
         * @param height defines the height of the row (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the height is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        addRowDefinition(height: number, isPixel?: boolean): Grid;
        /**
         * Adds a new column to the grid
         * @param width defines the width of the column (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the width is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        addColumnDefinition(width: number, isPixel?: boolean): Grid;
        /**
         * Update a row definition
         * @param index defines the index of the row to update
         * @param height defines the height of the row (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the weight is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        setRowDefinition(index: number, height: number, isPixel?: boolean): Grid;
        /**
         * Update a column definition
         * @param index defines the index of the column to update
         * @param width defines the width of the column (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the width is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        setColumnDefinition(index: number, width: number, isPixel?: boolean): Grid;
        /**
         * Gets the list of children stored in a specific cell
         * @param row defines the row to check
         * @param column defines the column to check
         * @returns the list of controls
         */
        getChildrenAt(row: number, column: number): Nullable<Array<Control>>;
        /**
         * Gets a string representing the child cell info (row x column)
         * @param child defines the control to get info from
         * @returns a string containing the child cell info (row x column)
         */
        getChildCellInfo(child: Control): string;
        private _removeCell;
        private _offsetCell;
        /**
         * Remove a column definition at specified index
         * @param index defines the index of the column to remove
         * @returns the current grid
         */
        removeColumnDefinition(index: number): Grid;
        /**
         * Remove a row definition at specified index
         * @param index defines the index of the row to remove
         * @returns the current grid
         */
        removeRowDefinition(index: number): Grid;
        /**
         * Adds a new control to the current grid
         * @param control defines the control to add
         * @param row defines the row where to add the control (0 by default)
         * @param column defines the column where to add the control (0 by default)
         * @returns the current grid
         */
        addControl(control: Control, row?: number, column?: number): Grid;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /**
         * Creates a new Grid
         * @param name defines control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getGridDefinitions(definitionCallback: (lefts: number[], tops: number[], widths: number[], heights: number[]) => void): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _flagDescendantsAsMatrixDirty(): void;
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/colorpicker" {
    import { Observable } from "babylonjs/Misc/observable";
    import { Color3, Vector2 } from "babylonjs/Maths/math";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Measure } from "babylonjs-gui/2D/measure";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /** Class used to create color pickers */
    export class ColorPicker extends Control {
        name?: string | undefined;
        private static _Epsilon;
        private _colorWheelCanvas;
        private _value;
        private _tmpColor;
        private _pointerStartedOnSquare;
        private _pointerStartedOnWheel;
        private _squareLeft;
        private _squareTop;
        private _squareSize;
        private _h;
        private _s;
        private _v;
        private _lastPointerDownID;
        /**
         * Observable raised when the value changes
         */
        onValueChangedObservable: Observable<Color3>;
        /** Gets or sets the color of the color picker */
        value: Color3;
        /**
         * Gets or sets control width
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        width: string | number;
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        /** Gets or sets control height */
        height: string | number;
        /** Gets or sets control size */
        size: string | number;
        /**
         * Creates a new ColorPicker
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _updateSquareProps;
        private _drawGradientSquare;
        private _drawCircle;
        private _createColorWheelCanvas;
        private _RGBtoHSV;
        private _HSVtoRGB;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer;
        private _isPointOnSquare;
        private _isPointOnWheel;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /**
         * This function expands the color picker by creating a color picker dialog with manual
         * color value input and the ability to save colors into an array to be used later in
         * subsequent launches of the dialogue.
         * @param advancedTexture defines the AdvancedDynamicTexture the dialog is assigned to
         * @param options defines size for dialog and options for saved colors. Also accepts last color picked as hex string and saved colors array as hex strings.
         * @returns picked color as a hex string and the saved colors array as hex strings.
         */
        static ShowPickerDialogAsync(advancedTexture: AdvancedDynamicTexture, options: {
            pickerWidth?: string;
            pickerHeight?: string;
            headerHeight?: string;
            lastColor?: string;
            swatchLimit?: number;
            numSwatchesPerLine?: number;
            savedColors?: Array<string>;
        }): Promise<{
            savedColors?: string[];
            pickedColor: string;
        }>;
    }
}
declare module "babylonjs-gui/2D/controls/ellipse" {
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { Measure } from "babylonjs-gui/2D/measure";
    /** Class used to create 2D ellipse containers */
    export class Ellipse extends Container {
        name?: string | undefined;
        private _thickness;
        /** Gets or sets border thickness */
        thickness: number;
        /**
         * Creates a new Ellipse
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}
declare module "babylonjs-gui/2D/controls/inputPassword" {
    import { InputText } from "babylonjs-gui/2D/controls/inputText";
    /**
     * Class used to create a password control
     */
    export class InputPassword extends InputText {
        protected _beforeRenderText(text: string): string;
    }
}
declare module "babylonjs-gui/2D/controls/line" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { Scene } from "babylonjs/scene";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Measure } from "babylonjs-gui/2D/measure";
    /** Class used to render 2D lines */
    export class Line extends Control {
        name?: string | undefined;
        private _lineWidth;
        private _x1;
        private _y1;
        private _x2;
        private _y2;
        private _dash;
        private _connectedControl;
        private _connectedControlDirtyObserver;
        /** Gets or sets the dash pattern */
        dash: Array<number>;
        /** Gets or sets the control connected with the line end */
        connectedControl: Control;
        /** Gets or sets start coordinates on X axis */
        x1: string | number;
        /** Gets or sets start coordinates on Y axis */
        y1: string | number;
        /** Gets or sets end coordinates on X axis */
        x2: string | number;
        /** Gets or sets end coordinates on Y axis */
        y2: string | number;
        /** Gets or sets line width */
        lineWidth: number;
        /** Gets or sets horizontal alignment */
        horizontalAlignment: number;
        /** Gets or sets vertical alignment */
        verticalAlignment: number;
        private readonly _effectiveX2;
        private readonly _effectiveY2;
        /**
         * Creates a new Line
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /**
         * Move one end of the line given 3D cartesian coordinates.
         * @param position Targeted world position
         * @param scene Scene
         * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
         */
        moveToVector3(position: Vector3, scene: Scene, end?: boolean): void;
        /**
         * Move one end of the line to a position in screen absolute space.
         * @param projectedPosition Position in screen absolute space (X, Y)
         * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
         */
        _moveToProjectedPosition(projectedPosition: Vector3, end?: boolean): void;
    }
}
declare module "babylonjs-gui/2D/multiLinePoint" {
    import { Nullable } from "babylonjs/types";
    import { Vector2 } from "babylonjs/Maths/math";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { MultiLine } from "babylonjs-gui/2D/controls/multiLine";
    import { Control } from "babylonjs-gui/2D/controls/control";
    /**
     * Class used to store a point for a MultiLine object.
     * The point can be pure 2D coordinates, a mesh or a control
     */
    export class MultiLinePoint {
        private _multiLine;
        private _x;
        private _y;
        private _control;
        private _mesh;
        private _controlObserver;
        private _meshObserver;
        /** @hidden */
        _point: Vector2;
        /**
         * Creates a new MultiLinePoint
         * @param multiLine defines the source MultiLine object
         */
        constructor(multiLine: MultiLine);
        /** Gets or sets x coordinate */
        x: string | number;
        /** Gets or sets y coordinate */
        y: string | number;
        /** Gets or sets the control associated with this point */
        control: Nullable<Control>;
        /** Gets or sets the mesh associated with this point */
        mesh: Nullable<AbstractMesh>;
        /** Resets links */
        resetLinks(): void;
        /**
         * Gets a translation vector
         * @returns the translation vector
         */
        translate(): Vector2;
        private _translatePoint;
        /** Release associated resources */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/multiLine" {
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { MultiLinePoint } from "babylonjs-gui/2D/multiLinePoint";
    import { Measure } from "babylonjs-gui/2D/measure";
    /**
     * Class used to create multi line control
     */
    export class MultiLine extends Control {
        name?: string | undefined;
        private _lineWidth;
        private _dash;
        private _points;
        private _minX;
        private _minY;
        private _maxX;
        private _maxY;
        /**
         * Creates a new MultiLine
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        /** Gets or sets dash pattern */
        dash: Array<number>;
        /**
         * Gets point stored at specified index
         * @param index defines the index to look for
         * @returns the requested point if found
         */
        getAt(index: number): MultiLinePoint;
        /** Function called when a point is updated */
        onPointUpdate: () => void;
        /**
         * Adds new points to the point collection
         * @param items defines the list of items (mesh, control or 2d coordiantes) to add
         * @returns the list of created MultiLinePoint
         */
        add(...items: (AbstractMesh | Control | {
            x: string | number;
            y: string | number;
        })[]): MultiLinePoint[];
        /**
         * Adds a new point to the point collection
         * @param item defines the item (mesh, control or 2d coordiantes) to add
         * @returns the created MultiLinePoint
         */
        push(item?: (AbstractMesh | Control | {
            x: string | number;
            y: string | number;
        })): MultiLinePoint;
        /**
         * Remove a specific value or point from the active point collection
         * @param value defines the value or point to remove
         */
        remove(value: number | MultiLinePoint): void;
        /**
         * Resets this object to initial state (no point)
         */
        reset(): void;
        /**
         * Resets all links
         */
        resetLinks(): void;
        /** Gets or sets line width */
        lineWidth: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/radioButton" {
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    /**
     * Class used to create radio button controls
     */
    export class RadioButton extends Control {
        name?: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets group name */
        group: string;
        /** Observable raised when isChecked is changed */
        onIsCheckedChangedObservable: Observable<boolean>;
        /** Gets or sets a value indicating the ratio between overall size and check size */
        checkSizeRatio: number;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        isChecked: boolean;
        /**
         * Creates a new RadioButton
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        /**
         * Utility function to easily create a radio button with a header
         * @param title defines the label to use for the header
         * @param group defines the group to use for the radio button
         * @param isChecked defines the initial state of the radio button
         * @param onValueChanged defines the callback to call when value changes
         * @returns a StackPanel containing the radio button and a textBlock
         */
        static AddRadioButtonWithHeader(title: string, group: string, isChecked: boolean, onValueChanged: (button: RadioButton, value: boolean) => void): StackPanel;
    }
}
declare module "babylonjs-gui/2D/controls/sliders/baseSlider" {
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector2 } from "babylonjs/Maths/math";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";
    /**
     * Class used to create slider controls
     */
    export class BaseSlider extends Control {
        name?: string | undefined;
        protected _thumbWidth: ValueAndUnit;
        private _minimum;
        private _maximum;
        private _value;
        private _isVertical;
        protected _barOffset: ValueAndUnit;
        private _isThumbClamped;
        protected _displayThumb: boolean;
        private _step;
        private _lastPointerDownID;
        protected _effectiveBarOffset: number;
        protected _renderLeft: number;
        protected _renderTop: number;
        protected _renderWidth: number;
        protected _renderHeight: number;
        protected _backgroundBoxLength: number;
        protected _backgroundBoxThickness: number;
        protected _effectiveThumbThickness: number;
        /** Observable raised when the sldier value changes */
        onValueChangedObservable: Observable<number>;
        /** Gets or sets a boolean indicating if the thumb must be rendered */
        displayThumb: boolean;
        /** Gets or sets a step to apply to values (0 by default) */
        step: number;
        /** Gets or sets main bar offset (ie. the margin applied to the value bar) */
        barOffset: string | number;
        /** Gets main bar offset in pixels*/
        readonly barOffsetInPixels: number;
        /** Gets or sets thumb width */
        thumbWidth: string | number;
        /** Gets thumb width in pixels */
        readonly thumbWidthInPixels: number;
        /** Gets or sets minimum value */
        minimum: number;
        /** Gets or sets maximum value */
        maximum: number;
        /** Gets or sets current value */
        value: number;
        /**Gets or sets a boolean indicating if the slider should be vertical or horizontal */
        isVertical: boolean;
        /** Gets or sets a value indicating if the thumb can go over main bar extends */
        isThumbClamped: boolean;
        /**
         * Creates a new BaseSlider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getThumbPosition(): number;
        protected _getThumbThickness(type: string): number;
        protected _prepareRenderingData(type: string): void;
        private _pointerIsDown;
        /** @hidden */
        protected _updateValueFromPointer(x: number, y: number): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
    }
}
declare module "babylonjs-gui/2D/controls/sliders/slider" {
    import { BaseSlider } from "babylonjs-gui/2D/controls/sliders/baseSlider";
    /**
     * Class used to create slider controls
     */
    export class Slider extends BaseSlider {
        name?: string | undefined;
        private _background;
        private _borderColor;
        private _isThumbCircle;
        protected _displayValueBar: boolean;
        /** Gets or sets a boolean indicating if the value bar must be rendered */
        displayValueBar: boolean;
        /** Gets or sets border color */
        borderColor: string;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the thumb should be round or square */
        isThumbCircle: boolean;
        /**
         * Creates a new Slider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
    }
}
declare module "babylonjs-gui/2D/controls/selector" {
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
    /** Class used to create a RadioGroup
     * which contains groups of radio buttons
    */
    export class SelectorGroup {
        /** name of SelectorGroup */
        name: string;
        private _groupPanel;
        private _selectors;
        private _groupHeader;
        /**
         * Creates a new SelectorGroup
         * @param name of group, used as a group heading
         */
        constructor(
        /** name of SelectorGroup */
        name: string);
        /** Gets the groupPanel of the SelectorGroup  */
        readonly groupPanel: StackPanel;
        /** Gets the selectors array */
        readonly selectors: StackPanel[];
        /** Gets and sets the group header */
        header: string;
        /** @hidden */
        private _addGroupHeader;
        /** @hidden*/
        _getSelector(selectorNb: number): StackPanel | undefined;
        /** Removes the selector at the given position
        * @param selectorNb the position of the selector within the group
       */
        removeSelector(selectorNb: number): void;
    }
    /** Class used to create a CheckboxGroup
     * which contains groups of checkbox buttons
    */
    export class CheckboxGroup extends SelectorGroup {
        /** Adds a checkbox as a control
         * @param text is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addCheckbox(text: string, func?: (s: boolean) => void, checked?: boolean): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to create a RadioGroup
     * which contains groups of radio buttons
    */
    export class RadioGroup extends SelectorGroup {
        private _selectNb;
        /** Adds a radio button as a control
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addRadio(label: string, func?: (n: number) => void, checked?: boolean): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to create a SliderGroup
     * which contains groups of slider buttons
    */
    export class SliderGroup extends SelectorGroup {
        /**
         * Adds a slider to the SelectorGroup
         * @param label is the label for the SliderBar
         * @param func is the function called when the Slider moves
         * @param unit is a string describing the units used, eg degrees or metres
         * @param min is the minimum value for the Slider
         * @param max is the maximum value for the Slider
         * @param value is the start value for the Slider between min and max
         * @param onValueChange is the function used to format the value displayed, eg radians to degrees
         */
        addSlider(label: string, func?: (v: number) => void, unit?: string, min?: number, max?: number, value?: number, onValueChange?: (v: number) => number): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to hold the controls for the checkboxes, radio buttons and sliders
     * @see http://doc.babylonjs.com/how_to/selector
    */
    export class SelectionPanel extends Rectangle {
        /** name of SelectionPanel */
        name: string;
        /** an array of SelectionGroups */
        groups: SelectorGroup[];
        private _panel;
        private _buttonColor;
        private _buttonBackground;
        private _headerColor;
        private _barColor;
        private _barHeight;
        private _spacerHeight;
        private _labelColor;
        private _groups;
        private _bars;
        /**
        * Creates a new SelectionPanel
        * @param name of SelectionPanel
        * @param groups is an array of SelectionGroups
        */
        constructor(
        /** name of SelectionPanel */
        name: string, 
        /** an array of SelectionGroups */
        groups?: SelectorGroup[]);
        protected _getTypeName(): string;
        /** Gets or sets the headerColor */
        headerColor: string;
        private _setHeaderColor;
        /** Gets or sets the button color */
        buttonColor: string;
        private _setbuttonColor;
        /** Gets or sets the label color */
        labelColor: string;
        private _setLabelColor;
        /** Gets or sets the button background */
        buttonBackground: string;
        private _setButtonBackground;
        /** Gets or sets the color of separator bar */
        barColor: string;
        private _setBarColor;
        /** Gets or sets the height of separator bar */
        barHeight: string;
        private _setBarHeight;
        /** Gets or sets the height of spacers*/
        spacerHeight: string;
        private _setSpacerHeight;
        /** Adds a bar between groups */
        private _addSpacer;
        /** Add a group to the selection panel
         * @param group is the selector group to add
         */
        addGroup(group: SelectorGroup): void;
        /** Remove the group from the given position
         * @param groupNb is the position of the group in the list
         */
        removeGroup(groupNb: number): void;
        /** Change a group header label
         * @param label is the new group header label
         * @param groupNb is the number of the group to relabel
         * */
        setHeaderName(label: string, groupNb: number): void;
        /** Change selector label to the one given
         * @param label is the new selector label
         * @param groupNb is the number of the groupcontaining the selector
         * @param selectorNb is the number of the selector within a group to relabel
         * */
        relabel(label: string, groupNb: number, selectorNb: number): void;
        /** For a given group position remove the selector at the given position
         * @param groupNb is the number of the group to remove the selector from
         * @param selectorNb is the number of the selector within the group
         */
        removeFromGroupSelector(groupNb: number, selectorNb: number): void;
        /** For a given group position of correct type add a checkbox button
         * @param groupNb is the number of the group to remove the selector from
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addToGroupCheckbox(groupNb: number, label: string, func?: () => void, checked?: boolean): void;
        /** For a given group position of correct type add a radio button
         * @param groupNb is the number of the group to remove the selector from
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addToGroupRadio(groupNb: number, label: string, func?: () => void, checked?: boolean): void;
        /**
         * For a given slider group add a slider
         * @param groupNb is the number of the group to add the slider to
         * @param label is the label for the Slider
         * @param func is the function called when the Slider moves
         * @param unit is a string describing the units used, eg degrees or metres
         * @param min is the minimum value for the Slider
         * @param max is the maximum value for the Slider
         * @param value is the start value for the Slider between min and max
         * @param onVal is the function used to format the value displayed, eg radians to degrees
         */
        addToGroupSlider(groupNb: number, label: string, func?: () => void, unit?: string, min?: number, max?: number, value?: number, onVal?: (v: number) => number): void;
    }
}
declare module "babylonjs-gui/2D/controls/scrollViewers/scrollViewerWindow" {
    import { Measure } from "babylonjs-gui/2D/measure";
    import { Container } from "babylonjs-gui/2D/controls/container";
    /**
     * Class used to hold a the container for ScrollViewer
     * @hidden
    */
    export class _ScrollViewerWindow extends Container {
        parentClientWidth: number;
        parentClientHeight: number;
        /**
        * Creates a new ScrollViewerWindow
        * @param name of ScrollViewerWindow
        */
        constructor(name?: string);
        protected _getTypeName(): string;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
    }
}
declare module "babylonjs-gui/2D/controls/sliders/scrollBar" {
    import { Vector2 } from "babylonjs/Maths/math";
    import { BaseSlider } from "babylonjs-gui/2D/controls/sliders/baseSlider";
    import { Control } from "babylonjs-gui/2D/controls/control";
    /**
     * Class used to create slider controls
     */
    export class ScrollBar extends BaseSlider {
        name?: string | undefined;
        private _background;
        private _borderColor;
        private _thumbMeasure;
        /** Gets or sets border color */
        borderColor: string;
        /** Gets or sets background color */
        background: string;
        /**
         * Creates a new Slider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getThumbThickness(): number;
        _draw(context: CanvasRenderingContext2D): void;
        private _first;
        private _originX;
        private _originY;
        /** @hidden */
        protected _updateValueFromPointer(x: number, y: number): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
    }
}
declare module "babylonjs-gui/2D/controls/scrollViewers/scrollViewer" {
    import { Nullable } from "babylonjs/types";
    import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
    import { Control } from "babylonjs-gui/2D/controls/control";
    import { Container } from "babylonjs-gui/2D/controls/container";
    import { Measure } from "babylonjs-gui/2D/measure";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { ScrollBar } from "babylonjs-gui/2D/controls/sliders/scrollBar";
    /**
     * Class used to hold a viewer window and sliders in a grid
    */
    export class ScrollViewer extends Rectangle {
        private _grid;
        private _horizontalBarSpace;
        private _verticalBarSpace;
        private _dragSpace;
        private _horizontalBar;
        private _verticalBar;
        private _barColor;
        private _barBackground;
        private _barSize;
        private _endLeft;
        private _endTop;
        private _window;
        private _pointerIsOver;
        private _wheelPrecision;
        private _onPointerObserver;
        private _clientWidth;
        private _clientHeight;
        /**
         * Gets the horizontal scrollbar
         */
        readonly horizontalBar: ScrollBar;
        /**
         * Gets the vertical scrollbar
         */
        readonly verticalBar: ScrollBar;
        /**
         * Adds a new control to the current container
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: Nullable<Control>): Container;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /** Gets the list of children */
        readonly children: Control[];
        _flagDescendantsAsMatrixDirty(): void;
        /**
        * Creates a new ScrollViewer
        * @param name of ScrollViewer
        */
        constructor(name?: string);
        /** Reset the scroll viewer window to initial size */
        resetWindow(): void;
        protected _getTypeName(): string;
        private _buildClientSizes;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
        /**
         * Gets or sets the mouse wheel precision
         * from 0 to 1 with a default value of 0.05
         * */
        wheelPrecision: number;
        /** Gets or sets the bar color */
        barColor: string;
        /** Gets or sets the size of the bar */
        barSize: number;
        /** Gets or sets the bar background */
        barBackground: string;
        /** @hidden */
        private _updateScroller;
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        private _attachWheel;
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/controls/displayGrid" {
    import { Control } from "babylonjs-gui/2D/controls/control";
    /** Class used to render a grid  */
    export class DisplayGrid extends Control {
        name?: string | undefined;
        private _cellWidth;
        private _cellHeight;
        private _minorLineTickness;
        private _minorLineColor;
        private _majorLineTickness;
        private _majorLineColor;
        private _majorLineFrequency;
        private _background;
        private _displayMajorLines;
        private _displayMinorLines;
        /** Gets or sets a boolean indicating if minor lines must be rendered (true by default)) */
        displayMinorLines: boolean;
        /** Gets or sets a boolean indicating if major lines must be rendered (true by default)) */
        displayMajorLines: boolean;
        /** Gets or sets background color (Black by default) */
        background: string;
        /** Gets or sets the width of each cell (20 by default) */
        cellWidth: number;
        /** Gets or sets the height of each cell (20 by default) */
        cellHeight: number;
        /** Gets or sets the tickness of minor lines (1 by default) */
        minorLineTickness: number;
        /** Gets or sets the color of minor lines (DarkGray by default) */
        minorLineColor: string;
        /** Gets or sets the tickness of major lines (2 by default) */
        majorLineTickness: number;
        /** Gets or sets the color of major lines (White by default) */
        majorLineColor: string;
        /** Gets or sets the frequency of major lines (default is 1 every 5 minor lines)*/
        majorLineFrequency: number;
        /**
         * Creates a new GridDisplayRectangle
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        _draw(context: CanvasRenderingContext2D): void;
        protected _getTypeName(): string;
    }
}
declare module "babylonjs-gui/2D/controls/sliders/imageBasedSlider" {
    import { BaseSlider } from "babylonjs-gui/2D/controls/sliders/baseSlider";
    import { Image } from "babylonjs-gui/2D/controls/image";
    /**
     * Class used to create slider controls based on images
     */
    export class ImageBasedSlider extends BaseSlider {
        name?: string | undefined;
        private _backgroundImage;
        private _thumbImage;
        private _valueBarImage;
        private _tempMeasure;
        displayThumb: boolean;
        /**
         * Gets or sets the image used to render the background
         */
        backgroundImage: Image;
        /**
         * Gets or sets the image used to render the value bar
         */
        valueBarImage: Image;
        /**
         * Gets or sets the image used to render the thumb
         */
        thumbImage: Image;
        /**
         * Creates a new ImageBasedSlider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
    }
}
declare module "babylonjs-gui/2D/controls/statics" {
    /**
     * Forcing an export so that this code will execute
     * @hidden
     */
    const name = "Statics";
    export { name };
}
declare module "babylonjs-gui/2D/controls/index" {
    export * from "babylonjs-gui/2D/controls/button";
    export * from "babylonjs-gui/2D/controls/checkbox";
    export * from "babylonjs-gui/2D/controls/colorpicker";
    export * from "babylonjs-gui/2D/controls/container";
    export * from "babylonjs-gui/2D/controls/control";
    export * from "babylonjs-gui/2D/controls/ellipse";
    export * from "babylonjs-gui/2D/controls/grid";
    export * from "babylonjs-gui/2D/controls/image";
    export * from "babylonjs-gui/2D/controls/inputText";
    export * from "babylonjs-gui/2D/controls/inputPassword";
    export * from "babylonjs-gui/2D/controls/line";
    export * from "babylonjs-gui/2D/controls/multiLine";
    export * from "babylonjs-gui/2D/controls/radioButton";
    export * from "babylonjs-gui/2D/controls/stackPanel";
    export * from "babylonjs-gui/2D/controls/selector";
    export * from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
    export * from "babylonjs-gui/2D/controls/textBlock";
    export * from "babylonjs-gui/2D/controls/virtualKeyboard";
    export * from "babylonjs-gui/2D/controls/rectangle";
    export * from "babylonjs-gui/2D/controls/displayGrid";
    export * from "babylonjs-gui/2D/controls/sliders/baseSlider";
    export * from "babylonjs-gui/2D/controls/sliders/slider";
    export * from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
    export * from "babylonjs-gui/2D/controls/sliders/scrollBar";
    export * from "babylonjs-gui/2D/controls/statics";
}
declare module "babylonjs-gui/2D/adtInstrumentation" {
    import { PerfCounter } from "babylonjs/Misc/tools";
    import { IDisposable } from "babylonjs/scene";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /**
     * This class can be used to get instrumentation data from a AdvancedDynamicTexture object
     */
    export class AdvancedDynamicTextureInstrumentation implements IDisposable {
        /**
         * Define the instrumented AdvancedDynamicTexture.
         */
        texture: AdvancedDynamicTexture;
        private _captureRenderTime;
        private _renderTime;
        private _captureLayoutTime;
        private _layoutTime;
        private _onBeginRenderObserver;
        private _onEndRenderObserver;
        private _onBeginLayoutObserver;
        private _onEndLayoutObserver;
        /**
         * Gets the perf counter used to capture render time
         */
        readonly renderTimeCounter: PerfCounter;
        /**
         * Gets the perf counter used to capture layout time
         */
        readonly layoutTimeCounter: PerfCounter;
        /**
         * Enable or disable the render time capture
         */
        captureRenderTime: boolean;
        /**
         * Enable or disable the layout time capture
         */
        captureLayoutTime: boolean;
        /**
         * Instantiates a new advanced dynamic texture instrumentation.
         * This class can be used to get instrumentation data from an AdvancedDynamicTexture object
         * @param texture Defines the AdvancedDynamicTexture to instrument
         */
        constructor(
        /**
         * Define the instrumented AdvancedDynamicTexture.
         */
        texture: AdvancedDynamicTexture);
        /**
         * Dispose and release associated resources.
         */
        dispose(): void;
    }
}
declare module "babylonjs-gui/2D/index" {
    export * from "babylonjs-gui/2D/controls/index";
    export * from "babylonjs-gui/2D/advancedDynamicTexture";
    export * from "babylonjs-gui/2D/adtInstrumentation";
    export * from "babylonjs-gui/2D/math2D";
    export * from "babylonjs-gui/2D/measure";
    export * from "babylonjs-gui/2D/multiLinePoint";
    export * from "babylonjs-gui/2D/style";
    export * from "babylonjs-gui/2D/valueAndUnit";
}
declare module "babylonjs-gui/3D/controls/container3D" {
    import { Nullable } from "babylonjs/types";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { Scene } from "babylonjs/scene";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used to create containers for controls
     */
    export class Container3D extends Control3D {
        private _blockLayout;
        /**
         * Gets the list of child controls
         */
        protected _children: Control3D[];
        /**
         * Gets the list of child controls
         */
        readonly children: Array<Control3D>;
        /**
         * Gets or sets a boolean indicating if the layout must be blocked (default is false).
         * This is helpful to optimize layout operation when adding multiple children in a row
         */
        blockLayout: boolean;
        /**
         * Creates a new container
         * @param name defines the container name
         */
        constructor(name?: string);
        /**
         * Force the container to update the layout. Please note that it will not take blockLayout property in account
         * @returns the current container
         */
        updateLayout(): Container3D;
        /**
         * Gets a boolean indicating if the given control is in the children of this control
         * @param control defines the control to check
         * @returns true if the control is in the child list
         */
        containsControl(control: Control3D): boolean;
        /**
         * Adds a control to the children of this control
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: Control3D): Container3D;
        /**
         * This function will be called everytime a new control is added
         */
        protected _arrangeChildren(): void;
        protected _createNode(scene: Scene): Nullable<TransformNode>;
        /**
         * Removes a control from the children of this control
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control3D): Container3D;
        protected _getTypeName(): string;
        /**
         * Releases all associated resources
         */
        dispose(): void;
        /** Control rotation will remain unchanged  */
        static readonly UNSET_ORIENTATION: number;
        /** Control will rotate to make it look at sphere central axis */
        static readonly FACEORIGIN_ORIENTATION: number;
        /** Control will rotate to make it look back at sphere central axis */
        static readonly FACEORIGINREVERSED_ORIENTATION: number;
        /** Control will rotate to look at z axis (0, 0, 1) */
        static readonly FACEFORWARD_ORIENTATION: number;
        /** Control will rotate to look at negative z axis (0, 0, -1) */
        static readonly FACEFORWARDREVERSED_ORIENTATION: number;
    }
}
declare module "babylonjs-gui/3D/gui3DManager" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector3 } from "babylonjs/Maths/math";
    import { Material } from "babylonjs/Materials/material";
    import { UtilityLayerRenderer } from "babylonjs/Rendering/utilityLayerRenderer";
    import { IDisposable, Scene } from "babylonjs/scene";
    import { Container3D } from "babylonjs-gui/3D/controls/container3D";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used to manage 3D user interface
     * @see http://doc.babylonjs.com/how_to/gui3d
     */
    export class GUI3DManager implements IDisposable {
        private _scene;
        private _sceneDisposeObserver;
        private _utilityLayer;
        private _rootContainer;
        private _pointerObserver;
        private _pointerOutObserver;
        /** @hidden */
        _lastPickedControl: Control3D;
        /** @hidden */
        _lastControlOver: {
            [pointerId: number]: Control3D;
        };
        /** @hidden */
        _lastControlDown: {
            [pointerId: number]: Control3D;
        };
        /**
         * Observable raised when the point picked by the pointer events changed
         */
        onPickedPointChangedObservable: Observable<Nullable<Vector3>>;
        /** @hidden */
        _sharedMaterials: {
            [key: string]: Material;
        };
        /** Gets the hosting scene */
        readonly scene: Scene;
        /** Gets associated utility layer */
        readonly utilityLayer: Nullable<UtilityLayerRenderer>;
        /**
         * Creates a new GUI3DManager
         * @param scene
         */
        constructor(scene?: Scene);
        private _handlePointerOut;
        private _doPicking;
        /**
         * Gets the root container
         */
        readonly rootContainer: Container3D;
        /**
         * Gets a boolean indicating if the given control is in the root child list
         * @param control defines the control to check
         * @returns true if the control is in the root child list
         */
        containsControl(control: Control3D): boolean;
        /**
         * Adds a control to the root child list
         * @param control defines the control to add
         * @returns the current manager
         */
        addControl(control: Control3D): GUI3DManager;
        /**
         * Removes a control from the root child list
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control3D): GUI3DManager;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module "babylonjs-gui/3D/vector3WithInfo" {
    import { Vector3 } from "babylonjs/Maths/math";
    /**
     * Class used to transport Vector3 information for pointer events
     */
    export class Vector3WithInfo extends Vector3 {
        /** defines the current mouse button index */
        buttonIndex: number;
        /**
         * Creates a new Vector3WithInfo
         * @param source defines the vector3 data to transport
         * @param buttonIndex defines the current mouse button index
         */
        constructor(source: Vector3, 
        /** defines the current mouse button index */
        buttonIndex?: number);
    }
}
declare module "babylonjs-gui/3D/controls/control3D" {
    import { Nullable } from "babylonjs/types";
    import { Observable } from "babylonjs/Misc/observable";
    import { Vector3 } from "babylonjs/Maths/math";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { IBehaviorAware, Behavior } from "babylonjs/Behaviors/behavior";
    import { IDisposable, Scene } from "babylonjs/scene";
    import { GUI3DManager } from "babylonjs-gui/3D/gui3DManager";
    import { Vector3WithInfo } from "babylonjs-gui/3D/vector3WithInfo";
    import { Container3D } from "babylonjs-gui/3D/controls/container3D";
    /**
     * Class used as base class for controls
     */
    export class Control3D implements IDisposable, IBehaviorAware<Control3D> {
        /** Defines the control name */
        name?: string | undefined;
        /** @hidden */
        _host: GUI3DManager;
        private _node;
        private _downCount;
        private _enterCount;
        private _downPointerIds;
        private _isVisible;
        /** Gets or sets the control position  in world space */
        position: Vector3;
        /** Gets or sets the control scaling  in world space */
        scaling: Vector3;
        /** Callback used to start pointer enter animation */
        pointerEnterAnimation: () => void;
        /** Callback used to start pointer out animation */
        pointerOutAnimation: () => void;
        /** Callback used to start pointer down animation */
        pointerDownAnimation: () => void;
        /** Callback used to start pointer up animation */
        pointerUpAnimation: () => void;
        /**
        * An event triggered when the pointer move over the control
        */
        onPointerMoveObservable: Observable<Vector3>;
        /**
         * An event triggered when the pointer move out of the control
         */
        onPointerOutObservable: Observable<Control3D>;
        /**
         * An event triggered when the pointer taps the control
         */
        onPointerDownObservable: Observable<Vector3WithInfo>;
        /**
         * An event triggered when pointer is up
         */
        onPointerUpObservable: Observable<Vector3WithInfo>;
        /**
         * An event triggered when a control is clicked on (with a mouse)
         */
        onPointerClickObservable: Observable<Vector3WithInfo>;
        /**
         * An event triggered when pointer enters the control
         */
        onPointerEnterObservable: Observable<Control3D>;
        /**
         * Gets or sets the parent container
         */
        parent: Nullable<Container3D>;
        private _behaviors;
        /**
         * Gets the list of attached behaviors
         * @see http://doc.babylonjs.com/features/behaviour
         */
        readonly behaviors: Behavior<Control3D>[];
        /**
         * Attach a behavior to the control
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        addBehavior(behavior: Behavior<Control3D>): Control3D;
        /**
         * Remove an attached behavior
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        removeBehavior(behavior: Behavior<Control3D>): Control3D;
        /**
         * Gets an attached behavior by name
         * @param name defines the name of the behavior to look for
         * @see http://doc.babylonjs.com/features/behaviour
         * @returns null if behavior was not found else the requested behavior
         */
        getBehaviorByName(name: string): Nullable<Behavior<Control3D>>;
        /** Gets or sets a boolean indicating if the control is visible */
        isVisible: boolean;
        /**
         * Creates a new control
         * @param name defines the control name
         */
        constructor(
        /** Defines the control name */
        name?: string | undefined);
        /**
         * Gets a string representing the class name
         */
        readonly typeName: string;
        /**
         * Get the current class name of the control.
         * @returns current class name
         */
        getClassName(): string;
        protected _getTypeName(): string;
        /**
         * Gets the transform node used by this control
         */
        readonly node: Nullable<TransformNode>;
        /**
         * Gets the mesh used to render this control
         */
        readonly mesh: Nullable<AbstractMesh>;
        /**
         * Link the control as child of the given node
         * @param node defines the node to link to. Use null to unlink the control
         * @returns the current control
         */
        linkToTransformNode(node: Nullable<TransformNode>): Control3D;
        /** @hidden **/
        _prepareNode(scene: Scene): void;
        /**
         * Node creation.
         * Can be overriden by children
         * @param scene defines the scene where the node must be attached
         * @returns the attached node or null if none. Must return a Mesh or AbstractMesh if there is an atttached visible object
         */
        protected _createNode(scene: Scene): Nullable<TransformNode>;
        /**
         * Affect a material to the given mesh
         * @param mesh defines the mesh which will represent the control
         */
        protected _affectMaterial(mesh: AbstractMesh): void;
        /** @hidden */
        _onPointerMove(target: Control3D, coordinates: Vector3): void;
        /** @hidden */
        _onPointerEnter(target: Control3D): boolean;
        /** @hidden */
        _onPointerOut(target: Control3D): void;
        /** @hidden */
        _onPointerDown(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /** @hidden */
        forcePointerUp(pointerId?: Nullable<number>): void;
        /** @hidden */
        _processObservables(type: number, pickedPoint: Vector3, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _disposeNode(): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module "babylonjs-gui/3D/controls/abstractButton3D" {
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { Scene } from "babylonjs/scene";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used as a root to all buttons
     */
    export class AbstractButton3D extends Control3D {
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _createNode(scene: Scene): TransformNode;
    }
}
declare module "babylonjs-gui/3D/controls/button3D" {
    import { int } from "babylonjs/types";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { Material } from "babylonjs/Materials/material";
    import { Scene } from "babylonjs/scene";
    import { AbstractButton3D } from "babylonjs-gui/3D/controls/abstractButton3D";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    import { Control } from "babylonjs-gui/2D/controls/control";
    /**
     * Class used to create a button in 3D
     */
    export class Button3D extends AbstractButton3D {
        /** @hidden */
        protected _currentMaterial: Material;
        private _facadeTexture;
        private _content;
        private _contentResolution;
        private _contentScaleRatio;
        /**
         * Gets or sets the texture resolution used to render content (512 by default)
         */
        contentResolution: int;
        /**
         * Gets or sets the texture scale ratio used to render content (2 by default)
         */
        contentScaleRatio: number;
        protected _disposeFacadeTexture(): void;
        protected _resetContent(): void;
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string);
        /**
         * Gets or sets the GUI 2D content used to display the button's facade
         */
        content: Control;
        /**
         * Apply the facade texture (created from the content property).
         * This function can be overloaded by child classes
         * @param facadeTexture defines the AdvancedDynamicTexture to use
         */
        protected _applyFacade(facadeTexture: AdvancedDynamicTexture): void;
        protected _getTypeName(): string;
        protected _createNode(scene: Scene): TransformNode;
        protected _affectMaterial(mesh: AbstractMesh): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module "babylonjs-gui/3D/controls/volumeBasedPanel" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { int } from "babylonjs/types";
    import { Container3D } from "babylonjs-gui/3D/controls/container3D";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Abstract class used to create a container panel deployed on the surface of a volume
     */
    export abstract class VolumeBasedPanel extends Container3D {
        private _columns;
        private _rows;
        private _rowThenColum;
        private _orientation;
        protected _cellWidth: number;
        protected _cellHeight: number;
        /**
         * Gets or sets the distance between elements
         */
        margin: number;
        /**
         * Gets or sets the orientation to apply to all controls (BABYLON.Container3D.FaceOriginReversedOrientation by default)
        * | Value | Type                                | Description |
        * | ----- | ----------------------------------- | ----------- |
        * | 0     | UNSET_ORIENTATION                   |  Control rotation will remain unchanged |
        * | 1     | FACEORIGIN_ORIENTATION              |  Control will rotate to make it look at sphere central axis |
        * | 2     | FACEORIGINREVERSED_ORIENTATION      |  Control will rotate to make it look back at sphere central axis |
        * | 3     | FACEFORWARD_ORIENTATION             |  Control will rotate to look at z axis (0, 0, 1) |
        * | 4     | FACEFORWARDREVERSED_ORIENTATION     |  Control will rotate to look at negative z axis (0, 0, -1) |
         */
        orientation: number;
        /**
         * Gets or sets the number of columns requested (10 by default).
         * The panel will automatically compute the number of rows based on number of child controls.
         */
        columns: int;
        /**
         * Gets or sets a the number of rows requested.
         * The panel will automatically compute the number of columns based on number of child controls.
         */
        rows: int;
        /**
         * Creates new VolumeBasedPanel
         */
        constructor();
        protected _arrangeChildren(): void;
        /** Child classes must implement this function to provide correct control positioning */
        protected abstract _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        /** Child classes can implement this function to provide additional processing */
        protected _finalProcessing(): void;
    }
}
declare module "babylonjs-gui/3D/controls/cylinderPanel" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { float } from "babylonjs/types";
    import { VolumeBasedPanel } from "babylonjs-gui/3D/controls/volumeBasedPanel";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used to create a container panel deployed on the surface of a cylinder
     */
    export class CylinderPanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the cylinder where to project controls (5 by default)
         */
        radius: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _cylindricalMapping;
    }
}
declare module "babylonjs-gui/3D/materials/shaders/fluent.vertex" {
    /** @hidden */
    export var fluentVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-gui/3D/materials/shaders/fluent.fragment" {
    /** @hidden */
    export var fluentPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-gui/3D/materials/fluentMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Vector3, Color4, Matrix } from "babylonjs/Maths/math";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { MaterialDefines } from "babylonjs/Materials/materialDefines";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-gui/3D/materials/shaders/fluent.vertex";
    import "babylonjs-gui/3D/materials/shaders/fluent.fragment";
    /** @hidden */
    export class FluentMaterialDefines extends MaterialDefines {
        INNERGLOW: boolean;
        BORDER: boolean;
        HOVERLIGHT: boolean;
        TEXTURE: boolean;
        constructor();
    }
    /**
     * Class used to render controls with fluent desgin
     */
    export class FluentMaterial extends PushMaterial {
        /**
         * Gets or sets inner glow intensity. A value of 0 means no glow (default is 0.5)
         */
        innerGlowColorIntensity: number;
        /**
         * Gets or sets the inner glow color (white by default)
         */
        innerGlowColor: Color3;
        /**
         * Gets or sets alpha value (default is 1.0)
         */
        alpha: number;
        /**
         * Gets or sets the albedo color (Default is Color3(0.3, 0.35, 0.4))
         */
        albedoColor: Color3;
        /**
         * Gets or sets a boolean indicating if borders must be rendered (default is false)
         */
        renderBorders: boolean;
        /**
         * Gets or sets border width (default is 0.5)
         */
        borderWidth: number;
        /**
         * Gets or sets a value indicating the smoothing value applied to border edges (0.02 by default)
         */
        edgeSmoothingValue: number;
        /**
         * Gets or sets the minimum value that can be applied to border width (default is 0.1)
         */
        borderMinValue: number;
        /**
         * Gets or sets a boolean indicating if hover light must be rendered (default is false)
         */
        renderHoverLight: boolean;
        /**
         * Gets or sets the radius used to render the hover light (default is 1.0)
         */
        hoverRadius: number;
        /**
         * Gets or sets the color used to render the hover light (default is Color4(0.3, 0.3, 0.3, 1.0))
         */
        hoverColor: Color4;
        /**
         * Gets or sets the hover light position in world space (default is Vector3.Zero())
         */
        hoverPosition: Vector3;
        private _albedoTexture;
        /** Gets or sets the texture to use for albedo color */
        albedoTexture: Nullable<BaseTexture>;
        /**
         * Creates a new Fluent material
         * @param name defines the name of the material
         * @param scene defines the hosting scene
         */
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FluentMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): FluentMaterial;
    }
}
declare module "babylonjs-gui/3D/controls/holographicButton" {
    import { Button3D } from "babylonjs-gui/3D/controls/button3D";
    import { Nullable } from "babylonjs/types";
    import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import { FluentMaterial } from "babylonjs-gui/3D/materials/fluentMaterial";
    import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _backPlate;
        private _textPlate;
        private _frontPlate;
        private _text;
        private _imageUrl;
        private _shareMaterials;
        private _frontMaterial;
        private _backMaterial;
        private _plateMaterial;
        private _pickedPointObserver;
        private _tooltipFade;
        private _tooltipTextBlock;
        private _tooltipTexture;
        private _tooltipMesh;
        private _tooltipHoverObserver;
        private _tooltipOutObserver;
        private _disposeTooltip;
        /**
         * Text to be displayed on the tooltip shown when hovering on the button. When set to null tooltip is disabled. (Default: null)
         */
        tooltipText: Nullable<string>;
        /**
         * Gets or sets text for the button
         */
        text: string;
        /**
         * Gets or sets the image url for the button
         */
        imageUrl: string;
        /**
         * Gets the back material used by this button
         */
        readonly backMaterial: FluentMaterial;
        /**
         * Gets the front material used by this button
         */
        readonly frontMaterial: FluentMaterial;
        /**
         * Gets the plate material used by this button
         */
        readonly plateMaterial: StandardMaterial;
        /**
         * Gets a boolean indicating if this button shares its material with other HolographicButtons
         */
        readonly shareMaterials: boolean;
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string, shareMaterials?: boolean);
        protected _getTypeName(): string;
        private _rebuildContent;
        protected _createNode(scene: Scene): TransformNode;
        protected _applyFacade(facadeTexture: AdvancedDynamicTexture): void;
        private _createBackMaterial;
        private _createFrontMaterial;
        private _createPlateMaterial;
        protected _affectMaterial(mesh: Mesh): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module "babylonjs-gui/3D/controls/meshButton3D" {
    import { TransformNode } from "babylonjs/Meshes/transformNode";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import { Button3D } from "babylonjs-gui/3D/controls/button3D";
    /**
     * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
     */
    export class MeshButton3D extends Button3D {
        /** @hidden */
        protected _currentMesh: Mesh;
        /**
         * Creates a new 3D button based on a mesh
         * @param mesh mesh to become a 3D button
         * @param name defines the control name
         */
        constructor(mesh: Mesh, name?: string);
        protected _getTypeName(): string;
        protected _createNode(scene: Scene): TransformNode;
        protected _affectMaterial(mesh: AbstractMesh): void;
    }
}
declare module "babylonjs-gui/3D/controls/planePanel" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    import { VolumeBasedPanel } from "babylonjs-gui/3D/controls/volumeBasedPanel";
    /**
     * Class used to create a container panel deployed on the surface of a plane
     */
    export class PlanePanel extends VolumeBasedPanel {
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
    }
}
declare module "babylonjs-gui/3D/controls/scatterPanel" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { float } from "babylonjs/types";
    import { VolumeBasedPanel } from "babylonjs-gui/3D/controls/volumeBasedPanel";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used to create a container panel where items get randomized planar mapping
     */
    export class ScatterPanel extends VolumeBasedPanel {
        private _iteration;
        /**
         * Gets or sets the number of iteration to use to scatter the controls (100 by default)
         */
        iteration: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _scatterMapping;
        protected _finalProcessing(): void;
    }
}
declare module "babylonjs-gui/3D/controls/spherePanel" {
    import { Vector3 } from "babylonjs/Maths/math";
    import { float } from "babylonjs/types";
    import { VolumeBasedPanel } from "babylonjs-gui/3D/controls/volumeBasedPanel";
    import { Control3D } from "babylonjs-gui/3D/controls/control3D";
    /**
     * Class used to create a container panel deployed on the surface of a sphere
     */
    export class SpherePanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the sphere where to project controls (5 by default)
         */
        radius: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _sphericalMapping;
    }
}
declare module "babylonjs-gui/3D/controls/stackPanel3D" {
    import { Container3D } from "babylonjs-gui/3D/controls/container3D";
    /**
     * Class used to create a stack panel in 3D on XY plane
     */
    export class StackPanel3D extends Container3D {
        private _isVertical;
        /**
         * Gets or sets a boolean indicating if the stack panel is vertical or horizontal (horizontal by default)
         */
        isVertical: boolean;
        /**
         * Gets or sets the distance between elements
         */
        margin: number;
        /**
         * Creates new StackPanel
         * @param isVertical
         */
        constructor(isVertical?: boolean);
        protected _arrangeChildren(): void;
    }
}
declare module "babylonjs-gui/3D/controls/index" {
    export * from "babylonjs-gui/3D/controls/abstractButton3D";
    export * from "babylonjs-gui/3D/controls/button3D";
    export * from "babylonjs-gui/3D/controls/container3D";
    export * from "babylonjs-gui/3D/controls/control3D";
    export * from "babylonjs-gui/3D/controls/cylinderPanel";
    export * from "babylonjs-gui/3D/controls/holographicButton";
    export * from "babylonjs-gui/3D/controls/meshButton3D";
    export * from "babylonjs-gui/3D/controls/planePanel";
    export * from "babylonjs-gui/3D/controls/scatterPanel";
    export * from "babylonjs-gui/3D/controls/spherePanel";
    export * from "babylonjs-gui/3D/controls/stackPanel3D";
    export * from "babylonjs-gui/3D/controls/volumeBasedPanel";
}
declare module "babylonjs-gui/3D/materials/index" {
    export * from "babylonjs-gui/3D/materials/fluentMaterial";
}
declare module "babylonjs-gui/3D/index" {
    export * from "babylonjs-gui/3D/controls/index";
    export * from "babylonjs-gui/3D/materials/index";
    export * from "babylonjs-gui/3D/gui3DManager";
    export * from "babylonjs-gui/3D/vector3WithInfo";
}
declare module "babylonjs-gui/index" {
    export * from "babylonjs-gui/2D/index";
    export * from "babylonjs-gui/3D/index";
}
declare module "babylonjs-gui/legacy/legacy" {
    export * from "babylonjs-gui/index";
}
declare module "babylonjs-gui" {
    export * from "babylonjs-gui/legacy/legacy";
}
declare module BABYLON.GUI {
    /**
     * Class used to specific a value and its associated unit
     */
    export class ValueAndUnit {
        /** defines the unit to store */
        unit: number;
        /** defines a boolean indicating if the value can be negative */
        negativeValueAllowed: boolean;
        private _value;
        private _originalUnit;
        /**
         * Gets or sets a value indicating that this value will not scale accordingly with adaptive scaling property
         * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
         */
        ignoreAdaptiveScaling: boolean;
        /**
         * Creates a new ValueAndUnit
         * @param value defines the value to store
         * @param unit defines the unit to store
         * @param negativeValueAllowed defines a boolean indicating if the value can be negative
         */
        constructor(value: number, 
        /** defines the unit to store */
        unit?: number, 
        /** defines a boolean indicating if the value can be negative */
        negativeValueAllowed?: boolean);
        /** Gets a boolean indicating if the value is a percentage */
        readonly isPercentage: boolean;
        /** Gets a boolean indicating if the value is store as pixel */
        readonly isPixel: boolean;
        /** Gets direct internal value */
        readonly internalValue: number;
        /**
         * Gets value as pixel
         * @param host defines the root host
         * @param refValue defines the reference value for percentages
         * @returns the value as pixel
         */
        getValueInPixel(host: AdvancedDynamicTexture, refValue: number): number;
        /**
         * Update the current value and unit. This should be done cautiously as the GUi won't be marked as dirty with this function.
         * @param value defines the value to store
         * @param unit defines the unit to store
         * @returns the current ValueAndUnit
         */
        updateInPlace(value: number, unit?: number): ValueAndUnit;
        /**
         * Gets the value accordingly to its unit
         * @param host  defines the root host
         * @returns the value
         */
        getValue(host: AdvancedDynamicTexture): number;
        /**
         * Gets a string representation of the value
         * @param host defines the root host
         * @param decimals defines an optional number of decimals to display
         * @returns a string
         */
        toString(host: AdvancedDynamicTexture, decimals?: number): string;
        /**
         * Store a value parsed from a string
         * @param source defines the source string
         * @returns true if the value was successfully parsed
         */
        fromString(source: string | number): boolean;
        private static _Regex;
        private static _UNITMODE_PERCENTAGE;
        private static _UNITMODE_PIXEL;
        /** UNITMODE_PERCENTAGE */
        static readonly UNITMODE_PERCENTAGE: number;
        /** UNITMODE_PIXEL */
        static readonly UNITMODE_PIXEL: number;
    }
}
declare module BABYLON.GUI {
    /**
     * Define a style used by control to automatically setup properties based on a template.
     * Only support font related properties so far
     */
    export class Style implements BABYLON.IDisposable {
        private _fontFamily;
        private _fontStyle;
        private _fontWeight;
        /** @hidden */
        _host: AdvancedDynamicTexture;
        /** @hidden */
        _fontSize: ValueAndUnit;
        /**
         * BABYLON.Observable raised when the style values are changed
         */
        onChangedObservable: BABYLON.Observable<Style>;
        /**
         * Creates a new style object
         * @param host defines the AdvancedDynamicTexture which hosts this style
         */
        constructor(host: AdvancedDynamicTexture);
        /**
         * Gets or sets the font size
         */
        fontSize: string | number;
        /**
         * Gets or sets the font family
         */
        fontFamily: string;
        /**
         * Gets or sets the font style
         */
        fontStyle: string;
        /** Gets or sets font weight */
        fontWeight: string;
        /** Dispose all associated resources */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to transport BABYLON.Vector2 information for pointer events
     */
    export class Vector2WithInfo extends BABYLON.Vector2 {
        /** defines the current mouse button index */
        buttonIndex: number;
        /**
         * Creates a new Vector2WithInfo
         * @param source defines the vector2 data to transport
         * @param buttonIndex defines the current mouse button index
         */
        constructor(source: BABYLON.Vector2, 
        /** defines the current mouse button index */
        buttonIndex?: number);
    }
    /** Class used to provide 2D matrix features */
    export class Matrix2D {
        /** Gets the internal array of 6 floats used to store matrix data */
        m: Float32Array;
        /**
         * Creates a new matrix
         * @param m00 defines value for (0, 0)
         * @param m01 defines value for (0, 1)
         * @param m10 defines value for (1, 0)
         * @param m11 defines value for (1, 1)
         * @param m20 defines value for (2, 0)
         * @param m21 defines value for (2, 1)
         */
        constructor(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number);
        /**
         * Fills the matrix from direct values
         * @param m00 defines value for (0, 0)
         * @param m01 defines value for (0, 1)
         * @param m10 defines value for (1, 0)
         * @param m11 defines value for (1, 1)
         * @param m20 defines value for (2, 0)
         * @param m21 defines value for (2, 1)
         * @returns the current modified matrix
         */
        fromValues(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number): Matrix2D;
        /**
         * Gets matrix determinant
         * @returns the determinant
         */
        determinant(): number;
        /**
         * Inverses the matrix and stores it in a target matrix
         * @param result defines the target matrix
         * @returns the current matrix
         */
        invertToRef(result: Matrix2D): Matrix2D;
        /**
         * Multiplies the current matrix with another one
         * @param other defines the second operand
         * @param result defines the target matrix
         * @returns the current matrix
         */
        multiplyToRef(other: Matrix2D, result: Matrix2D): Matrix2D;
        /**
         * Applies the current matrix to a set of 2 floats and stores the result in a vector2
         * @param x defines the x coordinate to transform
         * @param y defines the x coordinate to transform
         * @param result defines the target vector2
         * @returns the current matrix
         */
        transformCoordinates(x: number, y: number, result: BABYLON.Vector2): Matrix2D;
        /**
         * Creates an identity matrix
         * @returns a new matrix
         */
        static Identity(): Matrix2D;
        /**
         * Creates a translation matrix and stores it in a target matrix
         * @param x defines the x coordinate of the translation
         * @param y defines the y coordinate of the translation
         * @param result defines the target matrix
         */
        static TranslationToRef(x: number, y: number, result: Matrix2D): void;
        /**
         * Creates a scaling matrix and stores it in a target matrix
         * @param x defines the x coordinate of the scaling
         * @param y defines the y coordinate of the scaling
         * @param result defines the target matrix
         */
        static ScalingToRef(x: number, y: number, result: Matrix2D): void;
        /**
         * Creates a rotation matrix and stores it in a target matrix
         * @param angle defines the rotation angle
         * @param result defines the target matrix
         */
        static RotationToRef(angle: number, result: Matrix2D): void;
        private static _TempPreTranslationMatrix;
        private static _TempPostTranslationMatrix;
        private static _TempRotationMatrix;
        private static _TempScalingMatrix;
        private static _TempCompose0;
        private static _TempCompose1;
        private static _TempCompose2;
        /**
         * Composes a matrix from translation, rotation, scaling and parent matrix and stores it in a target matrix
         * @param tx defines the x coordinate of the translation
         * @param ty defines the y coordinate of the translation
         * @param angle defines the rotation angle
         * @param scaleX defines the x coordinate of the scaling
         * @param scaleY defines the y coordinate of the scaling
         * @param parentMatrix defines the parent matrix to multiply by (can be null)
         * @param result defines the target matrix
         */
        static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: BABYLON.Nullable<Matrix2D>, result: Matrix2D): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to store 2D control sizes
     */
    export class Measure {
        /** defines left coordinate */
        left: number;
        /** defines top coordinate  */
        top: number;
        /** defines width dimension  */
        width: number;
        /** defines height dimension */
        height: number;
        /**
         * Creates a new measure
         * @param left defines left coordinate
         * @param top defines top coordinate
         * @param width defines width dimension
         * @param height defines height dimension
         */
        constructor(
        /** defines left coordinate */
        left: number, 
        /** defines top coordinate  */
        top: number, 
        /** defines width dimension  */
        width: number, 
        /** defines height dimension */
        height: number);
        /**
         * Copy from another measure
         * @param other defines the other measure to copy from
         */
        copyFrom(other: Measure): void;
        /**
         * Copy from a group of 4 floats
         * @param left defines left coordinate
         * @param top defines top coordinate
         * @param width defines width dimension
         * @param height defines height dimension
         */
        copyFromFloats(left: number, top: number, width: number, height: number): void;
        /**
         * Computes the axis aligned bounding box measure for two given measures
         * @param a Input measure
         * @param b Input measure
         * @param result the resulting bounding measure
         */
        static CombineToRef(a: Measure, b: Measure, result: Measure): void;
        /**
         * Computes the axis aligned bounding box of the measure after it is modified by a given transform
         * @param transform the matrix to transform the measure before computing the AABB
         * @param result the resulting AABB
         */
        transformToRef(transform: Matrix2D, result: Measure): void;
        /**
         * Check equality between this measure and another one
         * @param other defines the other measures
         * @returns true if both measures are equals
         */
        isEqualsTo(other: Measure): boolean;
        /**
         * Creates an empty measure
         * @returns a new measure
         */
        static Empty(): Measure;
    }
}
declare module BABYLON.GUI {
    /**
    * Interface used to define a control that can receive focus
    */
    export interface IFocusableControl {
        /**
         * Function called when the control receives the focus
         */
        onFocus(): void;
        /**
         * Function called when the control loses the focus
         */
        onBlur(): void;
        /**
         * Function called to let the control handle keyboard events
         * @param evt defines the current keyboard event
         */
        processKeyboard(evt: KeyboardEvent): void;
        /**
        * Function called to get the list of controls that should not steal the focus from this control
        * @returns an array of controls
        */
        keepsFocusWith(): BABYLON.Nullable<Control[]>;
    }
    /**
    * Class used to create texture to support 2D GUI elements
    * @see http://doc.babylonjs.com/how_to/gui
    */
    export class AdvancedDynamicTexture extends BABYLON.DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _preKeyboardObserver;
        private _pointerMoveObserver;
        private _pointerObserver;
        private _canvasPointerOutObserver;
        private _background;
        /** @hidden */
        _rootContainer: Container;
        /** @hidden */
        _lastPickedControl: Control;
        /** @hidden */
        _lastControlOver: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _lastControlDown: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _capturingControl: {
            [pointerId: number]: Control;
        };
        /** @hidden */
        _shouldBlockPointer: boolean;
        /** @hidden */
        _layerToDispose: BABYLON.Nullable<BABYLON.Layer>;
        /** @hidden */
        _linkedControls: Control[];
        private _isFullscreen;
        private _fullscreenViewport;
        private _idealWidth;
        private _idealHeight;
        private _useSmallestIdeal;
        private _renderAtIdealSize;
        private _focusedControl;
        private _blockNextFocusCheck;
        private _renderScale;
        private _rootCanvas;
        private _cursorChanged;
        /**
        * Define type to string to ensure compatibility across browsers
        * Safari doesn't support DataTransfer constructor
        */
        private _clipboardData;
        /**
        * BABYLON.Observable event triggered each time an clipboard event is received from the rendering canvas
        */
        onClipboardObservable: BABYLON.Observable<BABYLON.ClipboardInfo>;
        /**
        * BABYLON.Observable event triggered each time a pointer down is intercepted by a control
        */
        onControlPickedObservable: BABYLON.Observable<Control>;
        /**
        * BABYLON.Observable event triggered before layout is evaluated
        */
        onBeginLayoutObservable: BABYLON.Observable<AdvancedDynamicTexture>;
        /**
        * BABYLON.Observable event triggered after the layout was evaluated
        */
        onEndLayoutObservable: BABYLON.Observable<AdvancedDynamicTexture>;
        /**
        * BABYLON.Observable event triggered before the texture is rendered
        */
        onBeginRenderObservable: BABYLON.Observable<AdvancedDynamicTexture>;
        /**
        * BABYLON.Observable event triggered after the texture was rendered
        */
        onEndRenderObservable: BABYLON.Observable<AdvancedDynamicTexture>;
        /**
        * Gets or sets a boolean defining if alpha is stored as premultiplied
        */
        premulAlpha: boolean;
        /**
        * Gets or sets a number used to scale rendering size (2 means that the texture will be twice bigger).
        * Useful when you want more antialiasing
        */
        renderScale: number;
        /** Gets or sets the background color */
        background: string;
        /**
        * Gets or sets the ideal width used to design controls.
        * The GUI will then rescale everything accordingly
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        idealWidth: number;
        /**
        * Gets or sets the ideal height used to design controls.
        * The GUI will then rescale everything accordingly
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        idealHeight: number;
        /**
        * Gets or sets a boolean indicating if the smallest ideal value must be used if idealWidth and idealHeight are both set
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        useSmallestIdeal: boolean;
        /**
        * Gets or sets a boolean indicating if adaptive scaling must be used
        * @see http://doc.babylonjs.com/how_to/gui#adaptive-scaling
        */
        renderAtIdealSize: boolean;
        /**
        * Gets the underlying layer used to render the texture when in fullscreen mode
        */
        readonly layer: BABYLON.Nullable<BABYLON.Layer>;
        /**
        * Gets the root container control
        */
        readonly rootContainer: Container;
        /**
        * Returns an array containing the root container.
        * This is mostly used to let the Inspector introspects the ADT
        * @returns an array containing the rootContainer
        */
        getChildren(): Array<Container>;
        /**
        * Will return all controls that are inside this texture
        * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
        * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
        * @return all child controls
        */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[];
        /**
        * Gets or sets the current focused control
        */
        focusedControl: BABYLON.Nullable<IFocusableControl>;
        /**
        * Gets or sets a boolean indicating if the texture must be rendered in background or foreground when in fullscreen mode
        */
        isForeground: boolean;
        /**
        * Gets or set information about clipboardData
        */
        clipboardData: string;
        /**
       * Creates a new AdvancedDynamicTexture
       * @param name defines the name of the texture
       * @param width defines the width of the texture
       * @param height defines the height of the texture
       * @param scene defines the hosting scene
       * @param generateMipMaps defines a boolean indicating if mipmaps must be generated (false by default)
       * @param samplingMode defines the texture sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
       */
        constructor(name: string, width: number | undefined, height: number | undefined, scene: BABYLON.Nullable<BABYLON.Scene>, generateMipMaps?: boolean, samplingMode?: number);
        /**
        * Get the current class name of the texture useful for serialization or dynamic coding.
        * @returns "AdvancedDynamicTexture"
        */
        getClassName(): string;
        /**
        * Function used to execute a function on all controls
        * @param func defines the function to execute
        * @param container defines the container where controls belong. If null the root container will be used
        */
        executeOnAllControls(func: (control: Control) => void, container?: Container): void;
        private _useInvalidateRectOptimization;
        /**
         * Gets or sets a boolean indicating if the InvalidateRect optimization should be turned on
         */
        useInvalidateRectOptimization: boolean;
        private _invalidatedRectangle;
        /**
         * Invalidates a rectangle area on the gui texture
         * @param invalidMinX left most position of the rectangle to invalidate in the texture
         * @param invalidMinY top most position of the rectangle to invalidate in the texture
         * @param invalidMaxX right most position of the rectangle to invalidate in the texture
         * @param invalidMaxY bottom most position of the rectangle to invalidate in the texture
         */
        invalidateRect(invalidMinX: number, invalidMinY: number, invalidMaxX: number, invalidMaxY: number): void;
        /**
        * Marks the texture as dirty forcing a complete update
        */
        markAsDirty(): void;
        /**
        * Helper function used to create a new style
        * @returns a new style
        * @see http://doc.babylonjs.com/how_to/gui#styles
        */
        createStyle(): Style;
        /**
        * Adds a new control to the root container
        * @param control defines the control to add
        * @returns the current texture
        */
        addControl(control: Control): AdvancedDynamicTexture;
        /**
        * Removes a control from the root container
        * @param control defines the control to remove
        * @returns the current texture
        */
        removeControl(control: Control): AdvancedDynamicTexture;
        /**
        * Release all resources
        */
        dispose(): void;
        private _onResize;
        /** @hidden */
        _getGlobalViewport(scene: BABYLON.Scene): BABYLON.Viewport;
        /**
        * Get screen coordinates for a vector3
        * @param position defines the position to project
        * @param worldMatrix defines the world matrix to use
        * @returns the projected position
        */
        getProjectedPosition(position: BABYLON.Vector3, worldMatrix: BABYLON.Matrix): BABYLON.Vector2;
        private _checkUpdate;
        private _clearMeasure;
        private _render;
        /** @hidden */
        _changeCursor(cursor: string): void;
        /** @hidden */
        _registerLastControlDown(control: Control, pointerId: number): void;
        private _doPicking;
        /** @hidden */
        _cleanControlAfterRemovalFromList(list: {
            [pointerId: number]: Control;
        }, control: Control): void;
        /** @hidden */
        _cleanControlAfterRemoval(control: Control): void;
        /** Attach to all scene events required to support pointer events */
        attach(): void;
        /** @hidden */
        private onClipboardCopy;
        /** @hidden */
        private onClipboardCut;
        /** @hidden */
        private onClipboardPaste;
        /**
        * Register the clipboard Events onto the canvas
        */
        registerClipboardEvents(): void;
        /**
         * Unregister the clipboard Events from the canvas
         */
        unRegisterClipboardEvents(): void;
        /**
        * Connect the texture to a hosting mesh to enable interactions
        * @param mesh defines the mesh to attach to
        * @param supportPointerMove defines a boolean indicating if pointer move events must be catched as well
        */
        attachToMesh(mesh: BABYLON.AbstractMesh, supportPointerMove?: boolean): void;
        /**
        * Move the focus to a specific control
        * @param control defines the control which will receive the focus
        */
        moveFocusToControl(control: IFocusableControl): void;
        private _manageFocus;
        private _attachToOnPointerOut;
        /**
         * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh)
         * @param mesh defines the mesh which will receive the texture
         * @param width defines the texture width (1024 by default)
         * @param height defines the texture height (1024 by default)
         * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
         * @param onlyAlphaTesting defines a boolean indicating that alpha blending will not be used (only alpha testing) (false by default)
         * @returns a new AdvancedDynamicTexture
         */
        static CreateForMesh(mesh: BABYLON.AbstractMesh, width?: number, height?: number, supportPointerMove?: boolean, onlyAlphaTesting?: boolean): AdvancedDynamicTexture;
        /**
        * Creates a new AdvancedDynamicTexture in fullscreen mode.
        * In this mode the texture will rely on a layer for its rendering.
        * This allows it to be treated like any other layer.
        * As such, if you have a multi camera setup, you can set the layerMask on the GUI as well.
        * LayerMask is set through advancedTexture.layer.layerMask
        * @param name defines name for the texture
        * @param foreground defines a boolean indicating if the texture must be rendered in foreground (default is true)
        * @param scene defines the hsoting scene
        * @param sampling defines the texture sampling mode (Texture.BILINEAR_SAMPLINGMODE by default)
        * @returns a new AdvancedDynamicTexture
        */
        static CreateFullscreenUI(name: string, foreground?: boolean, scene?: BABYLON.Nullable<BABYLON.Scene>, sampling?: number): AdvancedDynamicTexture;
    }
}
declare module BABYLON.GUI {
    /**
     * Root class used for all 2D controls
     * @see http://doc.babylonjs.com/how_to/gui#controls
     */
    export class Control {
        /** defines the name of the control */
        name?: string | undefined;
        /**
         * Gets or sets a boolean indicating if alpha must be an inherited value (false by default)
         */
        static AllowAlphaInheritance: boolean;
        private _alpha;
        private _alphaSet;
        private _zIndex;
        /** @hidden */
        _host: AdvancedDynamicTexture;
        /** Gets or sets the control parent */
        parent: BABYLON.Nullable<Container>;
        /** @hidden */
        _currentMeasure: Measure;
        private _fontFamily;
        private _fontStyle;
        private _fontWeight;
        private _fontSize;
        private _font;
        /** @hidden */
        _width: ValueAndUnit;
        /** @hidden */
        _height: ValueAndUnit;
        /** @hidden */
        protected _fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        private _color;
        private _style;
        private _styleObserver;
        /** @hidden */
        protected _horizontalAlignment: number;
        /** @hidden */
        protected _verticalAlignment: number;
        /** @hidden */
        protected _isDirty: boolean;
        /** @hidden */
        protected _wasDirty: boolean;
        /** @hidden */
        _tempParentMeasure: Measure;
        /** @hidden */
        _prevCurrentMeasureTransformedIntoGlobalSpace: Measure;
        /** @hidden */
        protected _cachedParentMeasure: Measure;
        private _paddingLeft;
        private _paddingRight;
        private _paddingTop;
        private _paddingBottom;
        /** @hidden */
        _left: ValueAndUnit;
        /** @hidden */
        _top: ValueAndUnit;
        private _scaleX;
        private _scaleY;
        private _rotation;
        private _transformCenterX;
        private _transformCenterY;
        /** @hidden */
        _transformMatrix: Matrix2D;
        /** @hidden */
        protected _invertTransformMatrix: Matrix2D;
        /** @hidden */
        protected _transformedPosition: BABYLON.Vector2;
        private _isMatrixDirty;
        private _cachedOffsetX;
        private _cachedOffsetY;
        private _isVisible;
        private _isHighlighted;
        /** @hidden */
        _linkedMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
        private _fontSet;
        private _dummyVector2;
        private _downCount;
        private _enterCount;
        private _doNotRender;
        private _downPointerIds;
        protected _isEnabled: boolean;
        protected _disabledColor: string;
        /** @hidden */
        protected _rebuildLayout: boolean;
        /** @hidden */
        _isClipped: boolean;
        /** @hidden */
        _tag: any;
        /**
         * Gets or sets the unique id of the node. Please note that this number will be updated when the control is added to a container
         */
        uniqueId: number;
        /**
         * Gets or sets an object used to store user defined information for the node
         */
        metadata: any;
        /** Gets or sets a boolean indicating if the control can be hit with pointer events */
        isHitTestVisible: boolean;
        /** Gets or sets a boolean indicating if the control can block pointer events */
        isPointerBlocker: boolean;
        /** Gets or sets a boolean indicating if the control can be focusable */
        isFocusInvisible: boolean;
        /**
         * Gets or sets a boolean indicating if the children are clipped to the current control bounds.
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        clipChildren: boolean;
        /**
         * Gets or sets a boolean indicating that control content must be clipped
         * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
         */
        clipContent: boolean;
        /**
         * Gets or sets a boolean indicating that the current control should cache its rendering (useful when the control does not change often)
         */
        useBitmapCache: boolean;
        private _cacheData;
        private _shadowOffsetX;
        /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
        shadowOffsetX: number;
        private _shadowOffsetY;
        /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
        shadowOffsetY: number;
        private _shadowBlur;
        /** Gets or sets a value indicating the amount of blur to use to render the shadow */
        shadowBlur: number;
        private _shadowColor;
        /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
        shadowColor: string;
        /** Gets or sets the cursor to use when the control is hovered */
        hoverCursor: string;
        /** @hidden */
        protected _linkOffsetX: ValueAndUnit;
        /** @hidden */
        protected _linkOffsetY: ValueAndUnit;
        /** Gets the control type name */
        readonly typeName: string;
        /**
         * Get the current class name of the control.
         * @returns current class name
         */
        getClassName(): string;
        /**
        * An event triggered when the pointer move over the control.
        */
        onPointerMoveObservable: BABYLON.Observable<BABYLON.Vector2>;
        /**
        * An event triggered when the pointer move out of the control.
        */
        onPointerOutObservable: BABYLON.Observable<Control>;
        /**
        * An event triggered when the pointer taps the control
        */
        onPointerDownObservable: BABYLON.Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer up
        */
        onPointerUpObservable: BABYLON.Observable<Vector2WithInfo>;
        /**
        * An event triggered when a control is clicked on
        */
        onPointerClickObservable: BABYLON.Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer enters the control
        */
        onPointerEnterObservable: BABYLON.Observable<Control>;
        /**
        * An event triggered when the control is marked as dirty
        */
        onDirtyObservable: BABYLON.Observable<Control>;
        /**
         * An event triggered before drawing the control
         */
        onBeforeDrawObservable: BABYLON.Observable<Control>;
        /**
         * An event triggered after the control was drawn
         */
        onAfterDrawObservable: BABYLON.Observable<Control>;
        /**
         * Get the hosting AdvancedDynamicTexture
         */
        readonly host: AdvancedDynamicTexture;
        /** Gets or set information about font offsets (used to render and align text) */
        fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
        alpha: number;
        /**
         * Gets or sets a boolean indicating that we want to highlight the control (mostly for debugging purpose)
         */
        isHighlighted: boolean;
        /** Gets or sets a value indicating the scale factor on X axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        scaleX: number;
        /** Gets or sets a value indicating the scale factor on Y axis (1 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        scaleY: number;
        /** Gets or sets the rotation angle (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        rotation: number;
        /** Gets or sets the transformation center on Y axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        transformCenterY: number;
        /** Gets or sets the transformation center on X axis (0 by default)
         * @see http://doc.babylonjs.com/how_to/gui#rotation-and-scaling
        */
        transformCenterX: number;
        /**
         * Gets or sets the horizontal alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
         */
        horizontalAlignment: number;
        /**
         * Gets or sets the vertical alignment
         * @see http://doc.babylonjs.com/how_to/gui#alignments
         */
        verticalAlignment: number;
        /**
         * Gets or sets control width
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        width: string | number;
        /**
         * Gets or sets the control width in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        widthInPixels: number;
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        height: string | number;
        /**
         * Gets or sets control height in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        heightInPixels: number;
        /** Gets or set font family */
        fontFamily: string;
        /** Gets or sets font style */
        fontStyle: string;
        /** Gets or sets font weight */
        fontWeight: string;
        /**
         * Gets or sets style
         * @see http://doc.babylonjs.com/how_to/gui#styles
         */
        style: BABYLON.Nullable<Style>;
        /** @hidden */
        readonly _isFontSizeInPercentage: boolean;
        /** Gets or sets font size in pixels */
        fontSizeInPixels: number;
        /** Gets or sets font size */
        fontSize: string | number;
        /** Gets or sets foreground color */
        color: string;
        /** Gets or sets z index which is used to reorder controls on the z axis */
        zIndex: number;
        /** Gets or sets a boolean indicating if the control can be rendered */
        notRenderable: boolean;
        /** Gets or sets a boolean indicating if the control is visible */
        isVisible: boolean;
        /** Gets a boolean indicating that the control needs to update its rendering */
        readonly isDirty: boolean;
        /**
         * Gets the current linked mesh (or null if none)
         */
        readonly linkedMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
        /**
         * Gets or sets a value indicating the padding to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingLeft: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingLeftInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingRight: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingRightInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingTop: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingTopInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingBottom: string | number;
        /**
         * Gets or sets a value indicating the padding in pixels to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingBottomInPixels: number;
        /**
         * Gets or sets a value indicating the left coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        left: string | number;
        /**
         * Gets or sets a value indicating the left coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        leftInPixels: number;
        /**
         * Gets or sets a value indicating the top coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        top: string | number;
        /**
         * Gets or sets a value indicating the top coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        topInPixels: number;
        /**
         * Gets or sets a value indicating the offset on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetX: string | number;
        /**
         * Gets or sets a value indicating the offset in pixels on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetXInPixels: number;
        /**
         * Gets or sets a value indicating the offset on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetY: string | number;
        /**
         * Gets or sets a value indicating the offset in pixels on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetYInPixels: number;
        /** Gets the center coordinate on X axis */
        readonly centerX: number;
        /** Gets the center coordinate on Y axis */
        readonly centerY: number;
        /** Gets or sets if control is Enabled*/
        isEnabled: boolean;
        /** Gets or sets background color of control if it's disabled*/
        disabledColor: string;
        /**
         * Creates a new control
         * @param name defines the name of the control
         */
        constructor(
        /** defines the name of the control */
        name?: string | undefined);
        /** @hidden */
        protected _getTypeName(): string;
        /**
         * Gets the first ascendant in the hierarchy of the given type
         * @param className defines the required type
         * @returns the ascendant or null if not found
         */
        getAscendantOfClass(className: string): BABYLON.Nullable<Control>;
        /** @hidden */
        _resetFontCache(): void;
        /**
         * Determines if a container is an ascendant of the current control
         * @param container defines the container to look for
         * @returns true if the container is one of the ascendant of the control
         */
        isAscendant(container: Control): boolean;
        /**
         * Gets coordinates in local control space
         * @param globalCoordinates defines the coordinates to transform
         * @returns the new coordinates in local space
         */
        getLocalCoordinates(globalCoordinates: BABYLON.Vector2): BABYLON.Vector2;
        /**
         * Gets coordinates in local control space
         * @param globalCoordinates defines the coordinates to transform
         * @param result defines the target vector2 where to store the result
         * @returns the current control
         */
        getLocalCoordinatesToRef(globalCoordinates: BABYLON.Vector2, result: BABYLON.Vector2): Control;
        /**
         * Gets coordinates in parent local control space
         * @param globalCoordinates defines the coordinates to transform
         * @returns the new coordinates in parent local space
         */
        getParentLocalCoordinates(globalCoordinates: BABYLON.Vector2): BABYLON.Vector2;
        /**
         * Move the current control to a vector3 position projected onto the screen.
         * @param position defines the target position
         * @param scene defines the hosting scene
         */
        moveToVector3(position: BABYLON.Vector3, scene: BABYLON.Scene): void;
        /** @hidden */
        _getDescendants(results: Control[], directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): void;
        /**
         * Will return all controls that have this control as ascendant
         * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
         * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
         * @return all child controls
         */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[];
        /**
         * Link current control with a target mesh
         * @param mesh defines the mesh to link with
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkWithMesh(mesh: BABYLON.Nullable<BABYLON.AbstractMesh>): void;
        /** @hidden */
        _moveToProjectedPosition(projectedPosition: BABYLON.Vector3): void;
        /** @hidden */
        _offsetLeft(offset: number): void;
        /** @hidden */
        _offsetTop(offset: number): void;
        /** @hidden */
        _markMatrixAsDirty(): void;
        /** @hidden */
        _flagDescendantsAsMatrixDirty(): void;
        /** @hidden */
        _intersectsRect(rect: Measure): boolean;
        /** @hidden */
        protected invalidateRect(): void;
        /** @hidden */
        _markAsDirty(force?: boolean): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        protected _transform(context?: CanvasRenderingContext2D): void;
        /** @hidden */
        _renderHighlight(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _applyStates(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        /** @hidden */
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _evaluateClippingState(parentMeasure: Measure): void;
        /** @hidden */
        _measure(): void;
        /** @hidden */
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        private static _ClipMeasure;
        private _tmpMeasureA;
        private _clip;
        /** @hidden */
        _render(context: CanvasRenderingContext2D, invalidatedRectangle?: BABYLON.Nullable<Measure>): boolean;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: BABYLON.Nullable<Measure>): void;
        /**
         * Tests if a given coordinates belong to the current control
         * @param x defines x coordinate to test
         * @param y defines y coordinate to test
         * @returns true if the coordinates are inside the control
         */
        contains(x: number, y: number): boolean;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerMove(target: Control, coordinates: BABYLON.Vector2, pointerId: number): void;
        /** @hidden */
        _onPointerEnter(target: Control): boolean;
        /** @hidden */
        _onPointerOut(target: Control, force?: boolean): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /** @hidden */
        _forcePointerUp(pointerId?: BABYLON.Nullable<number>): void;
        /** @hidden */
        _processObservables(type: number, x: number, y: number, pointerId: number, buttonIndex: number): boolean;
        private _prepareFont;
        /** Releases associated resources */
        dispose(): void;
        private static _HORIZONTAL_ALIGNMENT_LEFT;
        private static _HORIZONTAL_ALIGNMENT_RIGHT;
        private static _HORIZONTAL_ALIGNMENT_CENTER;
        private static _VERTICAL_ALIGNMENT_TOP;
        private static _VERTICAL_ALIGNMENT_BOTTOM;
        private static _VERTICAL_ALIGNMENT_CENTER;
        /** HORIZONTAL_ALIGNMENT_LEFT */
        static readonly HORIZONTAL_ALIGNMENT_LEFT: number;
        /** HORIZONTAL_ALIGNMENT_RIGHT */
        static readonly HORIZONTAL_ALIGNMENT_RIGHT: number;
        /** HORIZONTAL_ALIGNMENT_CENTER */
        static readonly HORIZONTAL_ALIGNMENT_CENTER: number;
        /** VERTICAL_ALIGNMENT_TOP */
        static readonly VERTICAL_ALIGNMENT_TOP: number;
        /** VERTICAL_ALIGNMENT_BOTTOM */
        static readonly VERTICAL_ALIGNMENT_BOTTOM: number;
        /** VERTICAL_ALIGNMENT_CENTER */
        static readonly VERTICAL_ALIGNMENT_CENTER: number;
        private static _FontHeightSizes;
        /** @hidden */
        static _GetFontOffset(font: string): {
            ascent: number;
            height: number;
            descent: number;
        };
        /**
         * Creates a stack panel that can be used to render headers
         * @param control defines the control to associate with the header
         * @param text defines the text of the header
         * @param size defines the size of the header
         * @param options defines options used to configure the header
         * @returns a new StackPanel
         * @ignore
         * @hidden
         */
        static AddHeader: (control: Control, text: string, size: string | number, options: {
            isHorizontal: boolean;
            controlFirst: boolean;
        }) => any;
        /** @hidden */
        protected static drawEllipse(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Root class for 2D containers
     * @see http://doc.babylonjs.com/how_to/gui#containers
     */
    export class Container extends Control {
        name?: string | undefined;
        /** @hidden */
        protected _children: Control[];
        /** @hidden */
        protected _measureForChildren: Measure;
        /** @hidden */
        protected _background: string;
        /** @hidden */
        protected _adaptWidthToChildren: boolean;
        /** @hidden */
        protected _adaptHeightToChildren: boolean;
        /** Gets or sets a boolean indicating if the container should try to adapt to its children height */
        adaptHeightToChildren: boolean;
        /** Gets or sets a boolean indicating if the container should try to adapt to its children width */
        adaptWidthToChildren: boolean;
        /** Gets or sets background color */
        background: string;
        /** Gets the list of children */
        readonly children: Control[];
        /**
         * Creates a new Container
         * @param name defines the name of the container
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _flagDescendantsAsMatrixDirty(): void;
        /**
         * Gets a child using its name
         * @param name defines the child name to look for
         * @returns the child control if found
         */
        getChildByName(name: string): BABYLON.Nullable<Control>;
        /**
         * Gets a child using its type and its name
         * @param name defines the child name to look for
         * @param type defines the child type to look for
         * @returns the child control if found
         */
        getChildByType(name: string, type: string): BABYLON.Nullable<Control>;
        /**
         * Search for a specific control in children
         * @param control defines the control to look for
         * @returns true if the control is in child list
         */
        containsControl(control: Control): boolean;
        /**
         * Adds a new control to the current container
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: BABYLON.Nullable<Control>): Container;
        /**
         * Removes all controls from the current container
         * @returns the current container
         */
        clearControls(): Container;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /** @hidden */
        _reOrderControl(control: Control): void;
        /** @hidden */
        _offsetLeft(offset: number): void;
        /** @hidden */
        _offsetTop(offset: number): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        protected _localDraw(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        protected _beforeLayout(): void;
        /** @hidden */
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        protected _postMeasure(): void;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Measure): void;
        /** @hidden */
        _getDescendants(results: Control[], directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): void;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /** Class used to create rectangle container */
    export class Rectangle extends Container {
        name?: string | undefined;
        private _thickness;
        private _cornerRadius;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets the corner radius angle */
        cornerRadius: number;
        /**
         * Creates a new Rectangle
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawRoundedRect;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Enum that determines the text-wrapping mode to use.
     */
    export enum TextWrapping {
        /**
         * Clip the text when it's larger than Control.width; this is the default mode.
         */
        Clip = 0,
        /**
         * Wrap the text word-wise, i.e. try to add line-breaks at word boundary to fit within Control.width.
         */
        WordWrap = 1,
        /**
         * Ellipsize the text, i.e. shrink with trailing … when text is larger than Control.width.
         */
        Ellipsis = 2
    }
    /**
     * Class used to create text block control
     */
    export class TextBlock extends Control {
        /**
         * Defines the name of the control
         */
        name?: string | undefined;
        private _text;
        private _textWrapping;
        private _textHorizontalAlignment;
        private _textVerticalAlignment;
        private _lines;
        private _resizeToFit;
        private _lineSpacing;
        private _outlineWidth;
        private _outlineColor;
        /**
        * An event triggered after the text is changed
        */
        onTextChangedObservable: BABYLON.Observable<TextBlock>;
        /**
        * An event triggered after the text was broken up into lines
        */
        onLinesReadyObservable: BABYLON.Observable<TextBlock>;
        /**
         * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
         */
        readonly lines: any[];
        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */
        /**
        * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
        */
        resizeToFit: boolean;
        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */
        /**
        * Gets or sets a boolean indicating if text must be wrapped
        */
        textWrapping: TextWrapping | boolean;
        /**
         * Gets or sets text to display
         */
        /**
        * Gets or sets text to display
        */
        text: string;
        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */
        /**
        * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
        */
        textHorizontalAlignment: number;
        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */
        /**
        * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
        */
        textVerticalAlignment: number;
        /**
         * Gets or sets line spacing value
         */
        /**
        * Gets or sets line spacing value
        */
        lineSpacing: string | number;
        /**
         * Gets or sets outlineWidth of the text to display
         */
        /**
        * Gets or sets outlineWidth of the text to display
        */
        outlineWidth: number;
        /**
         * Gets or sets outlineColor of the text to display
         */
        /**
        * Gets or sets outlineColor of the text to display
        */
        outlineColor: string;
        /**
         * Creates a new TextBlock object
         * @param name defines the name of the control
         * @param text defines the text to display (emptry string by default)
         */
        constructor(
        /**
         * Defines the name of the control
         */
        name?: string | undefined, text?: string);
        protected _getTypeName(): string;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawText;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        protected _applyStates(context: CanvasRenderingContext2D): void;
        protected _breakLines(refWidth: number, context: CanvasRenderingContext2D): object[];
        protected _parseLine(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _parseLineEllipsis(line: string | undefined, width: number, context: CanvasRenderingContext2D): object;
        protected _parseLineWordWrap(line: string | undefined, width: number, context: CanvasRenderingContext2D): object[];
        protected _renderLines(context: CanvasRenderingContext2D): void;
        /**
         * Given a width constraint applied on the text block, find the expected height
         * @returns expected height
         */
        computeExpectedHeight(): number;
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create 2D images
     */
    export class Image extends Control {
        name?: string | undefined;
        private static _WorkingCanvas;
        private _domImage;
        private _imageWidth;
        private _imageHeight;
        private _loaded;
        private _stretch;
        private _source;
        private _autoScale;
        private _sourceLeft;
        private _sourceTop;
        private _sourceWidth;
        private _sourceHeight;
        private _cellWidth;
        private _cellHeight;
        private _cellId;
        private _populateNinePatchSlicesFromImage;
        private _sliceLeft;
        private _sliceRight;
        private _sliceTop;
        private _sliceBottom;
        private _detectPointerOnOpaqueOnly;
        /**
         * BABYLON.Observable notified when the content is loaded
         */
        onImageLoadedObservable: BABYLON.Observable<Image>;
        /**
         * Gets a boolean indicating that the content is loaded
         */
        readonly isLoaded: boolean;
        /**
         * Gets or sets a boolean indicating if nine patch slices (left, top, right, bottom) should be read from image data
         */
        populateNinePatchSlicesFromImage: boolean;
        /**
         * Gets or sets a boolean indicating if pointers should only be validated on pixels with alpha > 0.
         * Beware using this as this will comsume more memory as the image has to be stored twice
         */
        detectPointerOnOpaqueOnly: boolean;
        /**
         * Gets or sets the left value for slicing (9-patch)
         */
        sliceLeft: number;
        /**
         * Gets or sets the right value for slicing (9-patch)
         */
        sliceRight: number;
        /**
         * Gets or sets the top value for slicing (9-patch)
         */
        sliceTop: number;
        /**
         * Gets or sets the bottom value for slicing (9-patch)
         */
        sliceBottom: number;
        /**
         * Gets or sets the left coordinate in the source image
         */
        sourceLeft: number;
        /**
         * Gets or sets the top coordinate in the source image
         */
        sourceTop: number;
        /**
         * Gets or sets the width to capture in the source image
         */
        sourceWidth: number;
        /**
         * Gets or sets the height to capture in the source image
         */
        sourceHeight: number;
        /**
         * Gets or sets a boolean indicating if the image can force its container to adapt its size
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        autoScale: boolean;
        /** Gets or sets the streching mode used by the image */
        stretch: number;
        /**
         * Gets or sets the internal DOM image used to render the control
         */
        domImage: HTMLImageElement;
        private _onImageLoaded;
        private _extractNinePatchSliceDataFromImage;
        /**
         * Gets or sets image source url
         */
        source: BABYLON.Nullable<string>;
        /**
         * Gets or sets the cell width to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellWidth: number;
        /**
         * Gets or sets the cell height to use when animation sheet is enabled
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellHeight: number;
        /**
         * Gets or sets the cell id to use (this will turn on the animation sheet mode)
         * @see http://doc.babylonjs.com/how_to/gui#image
         */
        cellId: number;
        /**
         * Creates a new Image
         * @param name defines the control name
         * @param url defines the image url
         */
        constructor(name?: string | undefined, url?: BABYLON.Nullable<string>);
        /**
         * Tests if a given coordinates belong to the current control
         * @param x defines x coordinate to test
         * @param y defines y coordinate to test
         * @returns true if the coordinates are inside the control
         */
        contains(x: number, y: number): boolean;
        protected _getTypeName(): string;
        /** Force the control to synchronize with its content */
        synchronizeSizeWithContent(): void;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _prepareWorkingCanvasForOpaqueDetection;
        private _drawImage;
        _draw(context: CanvasRenderingContext2D): void;
        private _renderCornerPatch;
        private _renderNinePatch;
        dispose(): void;
        /** STRETCH_NONE */
        static readonly STRETCH_NONE: number;
        /** STRETCH_FILL */
        static readonly STRETCH_FILL: number;
        /** STRETCH_UNIFORM */
        static readonly STRETCH_UNIFORM: number;
        /** STRETCH_EXTEND */
        static readonly STRETCH_EXTEND: number;
        /** NINE_PATCH */
        static readonly STRETCH_NINE_PATCH: number;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create 2D buttons
     */
    export class Button extends Rectangle {
        name?: string | undefined;
        /**
         * Function called to generate a pointer enter animation
         */
        pointerEnterAnimation: () => void;
        /**
         * Function called to generate a pointer out animation
         */
        pointerOutAnimation: () => void;
        /**
         * Function called to generate a pointer down animation
         */
        pointerDownAnimation: () => void;
        /**
         * Function called to generate a pointer up animation
         */
        pointerUpAnimation: () => void;
        private _image;
        /**
         * Returns the image part of the button (if any)
         */
        readonly image: BABYLON.Nullable<Image>;
        private _textBlock;
        /**
         * Returns the image part of the button (if any)
         */
        readonly textBlock: BABYLON.Nullable<TextBlock>;
        /**
         * Creates a new Button
         * @param name defines the name of the button
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerEnter(target: Control): boolean;
        /** @hidden */
        _onPointerOut(target: Control, force?: boolean): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /**
         * Creates a new button made with an image and a text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageButton(name: string, text: string, imageUrl: string): Button;
        /**
         * Creates a new button made with an image
         * @param name defines the name of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageOnlyButton(name: string, imageUrl: string): Button;
        /**
         * Creates a new button made with a text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @returns a new Button
         */
        static CreateSimpleButton(name: string, text: string): Button;
        /**
         * Creates a new button made with an image and a centered text
         * @param name defines the name of the button
         * @param text defines the text of the button
         * @param imageUrl defines the url of the image
         * @returns a new Button
         */
        static CreateImageWithCenterTextButton(name: string, text: string, imageUrl: string): Button;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a 2D stack panel container
     */
    export class StackPanel extends Container {
        name?: string | undefined;
        private _isVertical;
        private _manualWidth;
        private _manualHeight;
        private _doNotTrackManualChanges;
        /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
        isVertical: boolean;
        /**
         * Gets or sets panel width.
         * This value should not be set when in horizontal mode as it will be computed automatically
         */
        width: string | number;
        /**
         * Gets or sets panel height.
         * This value should not be set when in vertical mode as it will be computed automatically
         */
        height: string | number;
        /**
         * Creates a new StackPanel
         * @param name defines control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to represent a 2D checkbox
     */
    export class Checkbox extends Control {
        name?: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        /** Gets or sets border thickness  */
        thickness: number;
        /**
         * BABYLON.Observable raised when isChecked property changes
         */
        onIsCheckedChangedObservable: BABYLON.Observable<boolean>;
        /** Gets or sets a value indicating the ratio between overall size and check size */
        checkSizeRatio: number;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        isChecked: boolean;
        /**
         * Creates a new CheckBox
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        /**
         * Utility function to easily create a checkbox with a header
         * @param title defines the label to use for the header
         * @param onValueChanged defines the callback to call when value changes
         * @returns a StackPanel containing the checkbox and a textBlock
         */
        static AddCheckBoxWithHeader(title: string, onValueChanged: (value: boolean) => void): StackPanel;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to store key control properties
     */
    export class KeyPropertySet {
        /** Width */
        width?: string;
        /** Height */
        height?: string;
        /** Left padding */
        paddingLeft?: string;
        /** Right padding */
        paddingRight?: string;
        /** Top padding */
        paddingTop?: string;
        /** Bottom padding */
        paddingBottom?: string;
        /** Foreground color */
        color?: string;
        /** Background color */
        background?: string;
    }
    /**
     * Class used to create virtual keyboard
     */
    export class VirtualKeyboard extends StackPanel {
        /** BABYLON.Observable raised when a key is pressed */
        onKeyPressObservable: BABYLON.Observable<string>;
        /** Gets or sets default key button width */
        defaultButtonWidth: string;
        /** Gets or sets default key button height */
        defaultButtonHeight: string;
        /** Gets or sets default key button left padding */
        defaultButtonPaddingLeft: string;
        /** Gets or sets default key button right padding */
        defaultButtonPaddingRight: string;
        /** Gets or sets default key button top padding */
        defaultButtonPaddingTop: string;
        /** Gets or sets default key button bottom padding */
        defaultButtonPaddingBottom: string;
        /** Gets or sets default key button foreground color */
        defaultButtonColor: string;
        /** Gets or sets default key button background color */
        defaultButtonBackground: string;
        /** Gets or sets shift button foreground color */
        shiftButtonColor: string;
        /** Gets or sets shift button thickness*/
        selectedShiftThickness: number;
        /** Gets shift key state */
        shiftState: number;
        protected _getTypeName(): string;
        private _createKey;
        /**
         * Adds a new row of keys
         * @param keys defines the list of keys to add
         * @param propertySets defines the associated property sets
         */
        addKeysRow(keys: Array<string>, propertySets?: Array<KeyPropertySet>): void;
        /**
         * Set the shift key to a specific state
         * @param shiftState defines the new shift state
         */
        applyShiftState(shiftState: number): void;
        private _currentlyConnectedInputText;
        private _connectedInputTexts;
        private _onKeyPressObserver;
        /** Gets the input text control currently attached to the keyboard */
        readonly connectedInputText: BABYLON.Nullable<InputText>;
        /**
         * Connects the keyboard with an input text control
         *
         * @param input defines the target control
         */
        connect(input: InputText): void;
        /**
         * Disconnects the keyboard from connected InputText controls
         *
         * @param input optionally defines a target control, otherwise all are disconnected
         */
        disconnect(input?: InputText): void;
        private _removeConnectedInputObservables;
        /**
         * Release all resources
         */
        dispose(): void;
        /**
         * Creates a new keyboard using a default layout
         *
         * @param name defines control name
         * @returns a new VirtualKeyboard
         */
        static CreateDefaultLayout(name?: string): VirtualKeyboard;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create input text control
     */
    export class InputText extends Control implements IFocusableControl {
        name?: string | undefined;
        private _text;
        private _placeholderText;
        private _background;
        private _focusedBackground;
        private _focusedColor;
        private _placeholderColor;
        private _thickness;
        private _margin;
        private _autoStretchWidth;
        private _maxWidth;
        private _isFocused;
        private _blinkTimeout;
        private _blinkIsEven;
        private _cursorOffset;
        private _scrollLeft;
        private _textWidth;
        private _clickedCoordinate;
        private _deadKey;
        private _addKey;
        private _currentKey;
        private _isTextHighlightOn;
        private _textHighlightColor;
        private _highligherOpacity;
        private _highlightedText;
        private _startHighlightIndex;
        private _endHighlightIndex;
        private _cursorIndex;
        private _onFocusSelectAll;
        private _isPointerDown;
        private _onClipboardObserver;
        private _onPointerDblTapObserver;
        /** @hidden */
        _connectedVirtualKeyboard: BABYLON.Nullable<VirtualKeyboard>;
        /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
        promptMessage: string;
        /** BABYLON.Observable raised when the text changes */
        onTextChangedObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised just before an entered character is to be added */
        onBeforeKeyAddObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised when the control gets the focus */
        onFocusObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised when the control loses the focus */
        onBlurObservable: BABYLON.Observable<InputText>;
        /**Observable raised when the text is highlighted */
        onTextHighlightObservable: BABYLON.Observable<InputText>;
        /**Observable raised when copy event is triggered */
        onTextCopyObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised when cut event is triggered */
        onTextCutObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised when paste event is triggered */
        onTextPasteObservable: BABYLON.Observable<InputText>;
        /** BABYLON.Observable raised when a key event was processed */
        onKeyboardEventProcessedObservable: BABYLON.Observable<KeyboardEvent>;
        /** Gets or sets the maximum width allowed by the control */
        maxWidth: string | number;
        /** Gets the maximum width allowed by the control in pixels */
        readonly maxWidthInPixels: number;
        /** Gets or sets the text highlighter transparency; default: 0.4 */
        highligherOpacity: number;
        /** Gets or sets a boolean indicating whether to select complete text by default on input focus */
        onFocusSelectAll: boolean;
        /** Gets or sets the text hightlight color */
        textHighlightColor: string;
        /** Gets or sets control margin */
        margin: string;
        /** Gets control margin in pixels */
        readonly marginInPixels: number;
        /** Gets or sets a boolean indicating if the control can auto stretch its width to adapt to the text */
        autoStretchWidth: boolean;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets the background color when focused */
        focusedBackground: string;
        /** Gets or sets the background color when focused */
        focusedColor: string;
        /** Gets or sets the background color */
        background: string;
        /** Gets or sets the placeholder color */
        placeholderColor: string;
        /** Gets or sets the text displayed when the control is empty */
        placeholderText: string;
        /** Gets or sets the dead key flag */
        deadKey: boolean;
        /** Gets or sets the highlight text */
        highlightedText: string;
        /** Gets or sets if the current key should be added */
        addKey: boolean;
        /** Gets or sets the value of the current key being entered */
        currentKey: string;
        /** Gets or sets the text displayed in the control */
        text: string;
        /** Gets or sets control width */
        width: string | number;
        /**
         * Creates a new InputText
         * @param name defines the control name
         * @param text defines the text of the control
         */
        constructor(name?: string | undefined, text?: string);
        /** @hidden */
        onBlur(): void;
        /** @hidden */
        onFocus(): void;
        protected _getTypeName(): string;
        /**
         * Function called to get the list of controls that should not steal the focus from this control
         * @returns an array of controls
         */
        keepsFocusWith(): BABYLON.Nullable<Control[]>;
        /** @hidden */
        processKey(keyCode: number, key?: string, evt?: KeyboardEvent): void;
        /** @hidden */
        private _updateValueFromCursorIndex;
        /** @hidden */
        private _processDblClick;
        /** @hidden */
        private _selectAllText;
        /**
         * Handles the keyboard event
         * @param evt Defines the KeyboardEvent
         */
        processKeyboard(evt: KeyboardEvent): void;
        /** @hidden */
        private _onCopyText;
        /** @hidden */
        private _onCutText;
        /** @hidden */
        private _onPasteText;
        _draw(context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: BABYLON.Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        protected _beforeRenderText(text: string): string;
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a 2D grid container
     */
    export class Grid extends Container {
        name?: string | undefined;
        private _rowDefinitions;
        private _columnDefinitions;
        private _cells;
        private _childControls;
        /**
         * Gets the number of columns
         */
        readonly columnCount: number;
        /**
         * Gets the number of rows
         */
        readonly rowCount: number;
        /** Gets the list of children */
        readonly children: Control[];
        /** Gets the list of cells (e.g. the containers) */
        readonly cells: {
            [key: string]: Container;
        };
        /**
         * Gets the definition of a specific row
         * @param index defines the index of the row
         * @returns the row definition
         */
        getRowDefinition(index: number): BABYLON.Nullable<ValueAndUnit>;
        /**
         * Gets the definition of a specific column
         * @param index defines the index of the column
         * @returns the column definition
         */
        getColumnDefinition(index: number): BABYLON.Nullable<ValueAndUnit>;
        /**
         * Adds a new row to the grid
         * @param height defines the height of the row (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the height is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        addRowDefinition(height: number, isPixel?: boolean): Grid;
        /**
         * Adds a new column to the grid
         * @param width defines the width of the column (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the width is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        addColumnDefinition(width: number, isPixel?: boolean): Grid;
        /**
         * Update a row definition
         * @param index defines the index of the row to update
         * @param height defines the height of the row (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the weight is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        setRowDefinition(index: number, height: number, isPixel?: boolean): Grid;
        /**
         * Update a column definition
         * @param index defines the index of the column to update
         * @param width defines the width of the column (either in pixel or a value between 0 and 1)
         * @param isPixel defines if the width is expressed in pixel (or in percentage)
         * @returns the current grid
         */
        setColumnDefinition(index: number, width: number, isPixel?: boolean): Grid;
        /**
         * Gets the list of children stored in a specific cell
         * @param row defines the row to check
         * @param column defines the column to check
         * @returns the list of controls
         */
        getChildrenAt(row: number, column: number): BABYLON.Nullable<Array<Control>>;
        /**
         * Gets a string representing the child cell info (row x column)
         * @param child defines the control to get info from
         * @returns a string containing the child cell info (row x column)
         */
        getChildCellInfo(child: Control): string;
        private _removeCell;
        private _offsetCell;
        /**
         * Remove a column definition at specified index
         * @param index defines the index of the column to remove
         * @returns the current grid
         */
        removeColumnDefinition(index: number): Grid;
        /**
         * Remove a row definition at specified index
         * @param index defines the index of the row to remove
         * @returns the current grid
         */
        removeRowDefinition(index: number): Grid;
        /**
         * Adds a new control to the current grid
         * @param control defines the control to add
         * @param row defines the row where to add the control (0 by default)
         * @param column defines the column where to add the control (0 by default)
         * @returns the current grid
         */
        addControl(control: Control, row?: number, column?: number): Grid;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /**
         * Creates a new Grid
         * @param name defines control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getGridDefinitions(definitionCallback: (lefts: number[], tops: number[], widths: number[], heights: number[]) => void): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _flagDescendantsAsMatrixDirty(): void;
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /** Class used to create color pickers */
    export class ColorPicker extends Control {
        name?: string | undefined;
        private static _Epsilon;
        private _colorWheelCanvas;
        private _value;
        private _tmpColor;
        private _pointerStartedOnSquare;
        private _pointerStartedOnWheel;
        private _squareLeft;
        private _squareTop;
        private _squareSize;
        private _h;
        private _s;
        private _v;
        private _lastPointerDownID;
        /**
         * BABYLON.Observable raised when the value changes
         */
        onValueChangedObservable: BABYLON.Observable<BABYLON.Color3>;
        /** Gets or sets the color of the color picker */
        value: BABYLON.Color3;
        /**
         * Gets or sets control width
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        width: string | number;
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        /** Gets or sets control height */
        height: string | number;
        /** Gets or sets control size */
        size: string | number;
        /**
         * Creates a new ColorPicker
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _updateSquareProps;
        private _drawGradientSquare;
        private _drawCircle;
        private _createColorWheelCanvas;
        private _RGBtoHSV;
        private _HSVtoRGB;
        /** @hidden */
        _draw(context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer;
        private _isPointOnSquare;
        private _isPointOnWheel;
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: BABYLON.Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /**
         * This function expands the color picker by creating a color picker dialog with manual
         * color value input and the ability to save colors into an array to be used later in
         * subsequent launches of the dialogue.
         * @param advancedTexture defines the AdvancedDynamicTexture the dialog is assigned to
         * @param options defines size for dialog and options for saved colors. Also accepts last color picked as hex string and saved colors array as hex strings.
         * @returns picked color as a hex string and the saved colors array as hex strings.
         */
        static ShowPickerDialogAsync(advancedTexture: AdvancedDynamicTexture, options: {
            pickerWidth?: string;
            pickerHeight?: string;
            headerHeight?: string;
            lastColor?: string;
            swatchLimit?: number;
            numSwatchesPerLine?: number;
            savedColors?: Array<string>;
        }): Promise<{
            savedColors?: string[];
            pickedColor: string;
        }>;
    }
}
declare module BABYLON.GUI {
    /** Class used to create 2D ellipse containers */
    export class Ellipse extends Container {
        name?: string | undefined;
        private _thickness;
        /** Gets or sets border thickness */
        thickness: number;
        /**
         * Creates a new Ellipse
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a password control
     */
    export class InputPassword extends InputText {
        protected _beforeRenderText(text: string): string;
    }
}
declare module BABYLON.GUI {
    /** Class used to render 2D lines */
    export class Line extends Control {
        name?: string | undefined;
        private _lineWidth;
        private _x1;
        private _y1;
        private _x2;
        private _y2;
        private _dash;
        private _connectedControl;
        private _connectedControlDirtyObserver;
        /** Gets or sets the dash pattern */
        dash: Array<number>;
        /** Gets or sets the control connected with the line end */
        connectedControl: Control;
        /** Gets or sets start coordinates on X axis */
        x1: string | number;
        /** Gets or sets start coordinates on Y axis */
        y1: string | number;
        /** Gets or sets end coordinates on X axis */
        x2: string | number;
        /** Gets or sets end coordinates on Y axis */
        y2: string | number;
        /** Gets or sets line width */
        lineWidth: number;
        /** Gets or sets horizontal alignment */
        horizontalAlignment: number;
        /** Gets or sets vertical alignment */
        verticalAlignment: number;
        private readonly _effectiveX2;
        private readonly _effectiveY2;
        /**
         * Creates a new Line
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /**
         * Move one end of the line given 3D cartesian coordinates.
         * @param position Targeted world position
         * @param scene BABYLON.Scene
         * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
         */
        moveToVector3(position: BABYLON.Vector3, scene: BABYLON.Scene, end?: boolean): void;
        /**
         * Move one end of the line to a position in screen absolute space.
         * @param projectedPosition Position in screen absolute space (X, Y)
         * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
         */
        _moveToProjectedPosition(projectedPosition: BABYLON.Vector3, end?: boolean): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to store a point for a MultiLine object.
     * The point can be pure 2D coordinates, a mesh or a control
     */
    export class MultiLinePoint {
        private _multiLine;
        private _x;
        private _y;
        private _control;
        private _mesh;
        private _controlObserver;
        private _meshObserver;
        /** @hidden */
        _point: BABYLON.Vector2;
        /**
         * Creates a new MultiLinePoint
         * @param multiLine defines the source MultiLine object
         */
        constructor(multiLine: MultiLine);
        /** Gets or sets x coordinate */
        x: string | number;
        /** Gets or sets y coordinate */
        y: string | number;
        /** Gets or sets the control associated with this point */
        control: BABYLON.Nullable<Control>;
        /** Gets or sets the mesh associated with this point */
        mesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
        /** Resets links */
        resetLinks(): void;
        /**
         * Gets a translation vector
         * @returns the translation vector
         */
        translate(): BABYLON.Vector2;
        private _translatePoint;
        /** Release associated resources */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create multi line control
     */
    export class MultiLine extends Control {
        name?: string | undefined;
        private _lineWidth;
        private _dash;
        private _points;
        private _minX;
        private _minY;
        private _maxX;
        private _maxY;
        /**
         * Creates a new MultiLine
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        /** Gets or sets dash pattern */
        dash: Array<number>;
        /**
         * Gets point stored at specified index
         * @param index defines the index to look for
         * @returns the requested point if found
         */
        getAt(index: number): MultiLinePoint;
        /** Function called when a point is updated */
        onPointUpdate: () => void;
        /**
         * Adds new points to the point collection
         * @param items defines the list of items (mesh, control or 2d coordiantes) to add
         * @returns the list of created MultiLinePoint
         */
        add(...items: (AbstractMesh | Control | {
            x: string | number;
            y: string | number;
        })[]): MultiLinePoint[];
        /**
         * Adds a new point to the point collection
         * @param item defines the item (mesh, control or 2d coordiantes) to add
         * @returns the created MultiLinePoint
         */
        push(item?: (AbstractMesh | Control | {
            x: string | number;
            y: string | number;
        })): MultiLinePoint;
        /**
         * Remove a specific value or point from the active point collection
         * @param value defines the value or point to remove
         */
        remove(value: number | MultiLinePoint): void;
        /**
         * Resets this object to initial state (no point)
         */
        reset(): void;
        /**
         * Resets all links
         */
        resetLinks(): void;
        /** Gets or sets line width */
        lineWidth: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create radio button controls
     */
    export class RadioButton extends Control {
        name?: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        /** Gets or sets border thickness */
        thickness: number;
        /** Gets or sets group name */
        group: string;
        /** BABYLON.Observable raised when isChecked is changed */
        onIsCheckedChangedObservable: BABYLON.Observable<boolean>;
        /** Gets or sets a value indicating the ratio between overall size and check size */
        checkSizeRatio: number;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the checkbox is checked or not */
        isChecked: boolean;
        /**
         * Creates a new RadioButton
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        /**
         * Utility function to easily create a radio button with a header
         * @param title defines the label to use for the header
         * @param group defines the group to use for the radio button
         * @param isChecked defines the initial state of the radio button
         * @param onValueChanged defines the callback to call when value changes
         * @returns a StackPanel containing the radio button and a textBlock
         */
        static AddRadioButtonWithHeader(title: string, group: string, isChecked: boolean, onValueChanged: (button: RadioButton, value: boolean) => void): StackPanel;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create slider controls
     */
    export class BaseSlider extends Control {
        name?: string | undefined;
        protected _thumbWidth: ValueAndUnit;
        private _minimum;
        private _maximum;
        private _value;
        private _isVertical;
        protected _barOffset: ValueAndUnit;
        private _isThumbClamped;
        protected _displayThumb: boolean;
        private _step;
        private _lastPointerDownID;
        protected _effectiveBarOffset: number;
        protected _renderLeft: number;
        protected _renderTop: number;
        protected _renderWidth: number;
        protected _renderHeight: number;
        protected _backgroundBoxLength: number;
        protected _backgroundBoxThickness: number;
        protected _effectiveThumbThickness: number;
        /** BABYLON.Observable raised when the sldier value changes */
        onValueChangedObservable: BABYLON.Observable<number>;
        /** Gets or sets a boolean indicating if the thumb must be rendered */
        displayThumb: boolean;
        /** Gets or sets a step to apply to values (0 by default) */
        step: number;
        /** Gets or sets main bar offset (ie. the margin applied to the value bar) */
        barOffset: string | number;
        /** Gets main bar offset in pixels*/
        readonly barOffsetInPixels: number;
        /** Gets or sets thumb width */
        thumbWidth: string | number;
        /** Gets thumb width in pixels */
        readonly thumbWidthInPixels: number;
        /** Gets or sets minimum value */
        minimum: number;
        /** Gets or sets maximum value */
        maximum: number;
        /** Gets or sets current value */
        value: number;
        /**Gets or sets a boolean indicating if the slider should be vertical or horizontal */
        isVertical: boolean;
        /** Gets or sets a value indicating if the thumb can go over main bar extends */
        isThumbClamped: boolean;
        /**
         * Creates a new BaseSlider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getThumbPosition(): number;
        protected _getThumbThickness(type: string): number;
        protected _prepareRenderingData(type: string): void;
        private _pointerIsDown;
        /** @hidden */
        protected _updateValueFromPointer(x: number, y: number): void;
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: BABYLON.Vector2, pointerId: number): void;
        _onPointerUp(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create slider controls
     */
    export class Slider extends BaseSlider {
        name?: string | undefined;
        private _background;
        private _borderColor;
        private _isThumbCircle;
        protected _displayValueBar: boolean;
        /** Gets or sets a boolean indicating if the value bar must be rendered */
        displayValueBar: boolean;
        /** Gets or sets border color */
        borderColor: string;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets a boolean indicating if the thumb should be round or square */
        isThumbCircle: boolean;
        /**
         * Creates a new Slider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
    }
}
declare module BABYLON.GUI {
    /** Class used to create a RadioGroup
     * which contains groups of radio buttons
    */
    export class SelectorGroup {
        /** name of SelectorGroup */
        name: string;
        private _groupPanel;
        private _selectors;
        private _groupHeader;
        /**
         * Creates a new SelectorGroup
         * @param name of group, used as a group heading
         */
        constructor(
        /** name of SelectorGroup */
        name: string);
        /** Gets the groupPanel of the SelectorGroup  */
        readonly groupPanel: StackPanel;
        /** Gets the selectors array */
        readonly selectors: StackPanel[];
        /** Gets and sets the group header */
        header: string;
        /** @hidden */
        private _addGroupHeader;
        /** @hidden*/
        _getSelector(selectorNb: number): StackPanel | undefined;
        /** Removes the selector at the given position
        * @param selectorNb the position of the selector within the group
       */
        removeSelector(selectorNb: number): void;
    }
    /** Class used to create a CheckboxGroup
     * which contains groups of checkbox buttons
    */
    export class CheckboxGroup extends SelectorGroup {
        /** Adds a checkbox as a control
         * @param text is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addCheckbox(text: string, func?: (s: boolean) => void, checked?: boolean): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to create a RadioGroup
     * which contains groups of radio buttons
    */
    export class RadioGroup extends SelectorGroup {
        private _selectNb;
        /** Adds a radio button as a control
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addRadio(label: string, func?: (n: number) => void, checked?: boolean): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to create a SliderGroup
     * which contains groups of slider buttons
    */
    export class SliderGroup extends SelectorGroup {
        /**
         * Adds a slider to the SelectorGroup
         * @param label is the label for the SliderBar
         * @param func is the function called when the Slider moves
         * @param unit is a string describing the units used, eg degrees or metres
         * @param min is the minimum value for the Slider
         * @param max is the maximum value for the Slider
         * @param value is the start value for the Slider between min and max
         * @param onValueChange is the function used to format the value displayed, eg radians to degrees
         */
        addSlider(label: string, func?: (v: number) => void, unit?: string, min?: number, max?: number, value?: number, onValueChange?: (v: number) => number): void;
        /** @hidden */
        _setSelectorLabel(selectorNb: number, label: string): void;
        /** @hidden */
        _setSelectorLabelColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonColor(selectorNb: number, color: string): void;
        /** @hidden */
        _setSelectorButtonBackground(selectorNb: number, color: string): void;
    }
    /** Class used to hold the controls for the checkboxes, radio buttons and sliders
     * @see http://doc.babylonjs.com/how_to/selector
    */
    export class SelectionPanel extends Rectangle {
        /** name of SelectionPanel */
        name: string;
        /** an array of SelectionGroups */
        groups: SelectorGroup[];
        private _panel;
        private _buttonColor;
        private _buttonBackground;
        private _headerColor;
        private _barColor;
        private _barHeight;
        private _spacerHeight;
        private _labelColor;
        private _groups;
        private _bars;
        /**
        * Creates a new SelectionPanel
        * @param name of SelectionPanel
        * @param groups is an array of SelectionGroups
        */
        constructor(
        /** name of SelectionPanel */
        name: string, 
        /** an array of SelectionGroups */
        groups?: SelectorGroup[]);
        protected _getTypeName(): string;
        /** Gets or sets the headerColor */
        headerColor: string;
        private _setHeaderColor;
        /** Gets or sets the button color */
        buttonColor: string;
        private _setbuttonColor;
        /** Gets or sets the label color */
        labelColor: string;
        private _setLabelColor;
        /** Gets or sets the button background */
        buttonBackground: string;
        private _setButtonBackground;
        /** Gets or sets the color of separator bar */
        barColor: string;
        private _setBarColor;
        /** Gets or sets the height of separator bar */
        barHeight: string;
        private _setBarHeight;
        /** Gets or sets the height of spacers*/
        spacerHeight: string;
        private _setSpacerHeight;
        /** Adds a bar between groups */
        private _addSpacer;
        /** Add a group to the selection panel
         * @param group is the selector group to add
         */
        addGroup(group: SelectorGroup): void;
        /** Remove the group from the given position
         * @param groupNb is the position of the group in the list
         */
        removeGroup(groupNb: number): void;
        /** Change a group header label
         * @param label is the new group header label
         * @param groupNb is the number of the group to relabel
         * */
        setHeaderName(label: string, groupNb: number): void;
        /** Change selector label to the one given
         * @param label is the new selector label
         * @param groupNb is the number of the groupcontaining the selector
         * @param selectorNb is the number of the selector within a group to relabel
         * */
        relabel(label: string, groupNb: number, selectorNb: number): void;
        /** For a given group position remove the selector at the given position
         * @param groupNb is the number of the group to remove the selector from
         * @param selectorNb is the number of the selector within the group
         */
        removeFromGroupSelector(groupNb: number, selectorNb: number): void;
        /** For a given group position of correct type add a checkbox button
         * @param groupNb is the number of the group to remove the selector from
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addToGroupCheckbox(groupNb: number, label: string, func?: () => void, checked?: boolean): void;
        /** For a given group position of correct type add a radio button
         * @param groupNb is the number of the group to remove the selector from
         * @param label is the label for the selector
         * @param func is the function called when the Selector is checked
         * @param checked is true when Selector is checked
         */
        addToGroupRadio(groupNb: number, label: string, func?: () => void, checked?: boolean): void;
        /**
         * For a given slider group add a slider
         * @param groupNb is the number of the group to add the slider to
         * @param label is the label for the Slider
         * @param func is the function called when the Slider moves
         * @param unit is a string describing the units used, eg degrees or metres
         * @param min is the minimum value for the Slider
         * @param max is the maximum value for the Slider
         * @param value is the start value for the Slider between min and max
         * @param onVal is the function used to format the value displayed, eg radians to degrees
         */
        addToGroupSlider(groupNb: number, label: string, func?: () => void, unit?: string, min?: number, max?: number, value?: number, onVal?: (v: number) => number): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to hold a the container for ScrollViewer
     * @hidden
    */
    export class _ScrollViewerWindow extends Container {
        parentClientWidth: number;
        parentClientHeight: number;
        /**
        * Creates a new ScrollViewerWindow
        * @param name of ScrollViewerWindow
        */
        constructor(name?: string);
        protected _getTypeName(): string;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create slider controls
     */
    export class ScrollBar extends BaseSlider {
        name?: string | undefined;
        private _background;
        private _borderColor;
        private _thumbMeasure;
        /** Gets or sets border color */
        borderColor: string;
        /** Gets or sets background color */
        background: string;
        /**
         * Creates a new Slider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _getThumbThickness(): number;
        _draw(context: CanvasRenderingContext2D): void;
        private _first;
        private _originX;
        private _originY;
        /** @hidden */
        protected _updateValueFromPointer(x: number, y: number): void;
        _onPointerDown(target: Control, coordinates: BABYLON.Vector2, pointerId: number, buttonIndex: number): boolean;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to hold a viewer window and sliders in a grid
    */
    export class ScrollViewer extends Rectangle {
        private _grid;
        private _horizontalBarSpace;
        private _verticalBarSpace;
        private _dragSpace;
        private _horizontalBar;
        private _verticalBar;
        private _barColor;
        private _barBackground;
        private _barSize;
        private _endLeft;
        private _endTop;
        private _window;
        private _pointerIsOver;
        private _wheelPrecision;
        private _onPointerObserver;
        private _clientWidth;
        private _clientHeight;
        /**
         * Gets the horizontal scrollbar
         */
        readonly horizontalBar: ScrollBar;
        /**
         * Gets the vertical scrollbar
         */
        readonly verticalBar: ScrollBar;
        /**
         * Adds a new control to the current container
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: BABYLON.Nullable<Control>): Container;
        /**
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /** Gets the list of children */
        readonly children: Control[];
        _flagDescendantsAsMatrixDirty(): void;
        /**
        * Creates a new ScrollViewer
        * @param name of ScrollViewer
        */
        constructor(name?: string);
        /** Reset the scroll viewer window to initial size */
        resetWindow(): void;
        protected _getTypeName(): string;
        private _buildClientSizes;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _postMeasure(): void;
        /**
         * Gets or sets the mouse wheel precision
         * from 0 to 1 with a default value of 0.05
         * */
        wheelPrecision: number;
        /** Gets or sets the bar color */
        barColor: string;
        /** Gets or sets the size of the bar */
        barSize: number;
        /** Gets or sets the bar background */
        barBackground: string;
        /** @hidden */
        private _updateScroller;
        _link(host: AdvancedDynamicTexture): void;
        /** @hidden */
        private _attachWheel;
        _renderHighlightSpecific(context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /** Class used to render a grid  */
    export class DisplayGrid extends Control {
        name?: string | undefined;
        private _cellWidth;
        private _cellHeight;
        private _minorLineTickness;
        private _minorLineColor;
        private _majorLineTickness;
        private _majorLineColor;
        private _majorLineFrequency;
        private _background;
        private _displayMajorLines;
        private _displayMinorLines;
        /** Gets or sets a boolean indicating if minor lines must be rendered (true by default)) */
        displayMinorLines: boolean;
        /** Gets or sets a boolean indicating if major lines must be rendered (true by default)) */
        displayMajorLines: boolean;
        /** Gets or sets background color (Black by default) */
        background: string;
        /** Gets or sets the width of each cell (20 by default) */
        cellWidth: number;
        /** Gets or sets the height of each cell (20 by default) */
        cellHeight: number;
        /** Gets or sets the tickness of minor lines (1 by default) */
        minorLineTickness: number;
        /** Gets or sets the color of minor lines (DarkGray by default) */
        minorLineColor: string;
        /** Gets or sets the tickness of major lines (2 by default) */
        majorLineTickness: number;
        /** Gets or sets the color of major lines (White by default) */
        majorLineColor: string;
        /** Gets or sets the frequency of major lines (default is 1 every 5 minor lines)*/
        majorLineFrequency: number;
        /**
         * Creates a new GridDisplayRectangle
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        _draw(context: CanvasRenderingContext2D): void;
        protected _getTypeName(): string;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create slider controls based on images
     */
    export class ImageBasedSlider extends BaseSlider {
        name?: string | undefined;
        private _backgroundImage;
        private _thumbImage;
        private _valueBarImage;
        private _tempMeasure;
        displayThumb: boolean;
        /**
         * Gets or sets the image used to render the background
         */
        backgroundImage: Image;
        /**
         * Gets or sets the image used to render the value bar
         */
        valueBarImage: Image;
        /**
         * Gets or sets the image used to render the thumb
         */
        thumbImage: Image;
        /**
         * Creates a new ImageBasedSlider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(context: CanvasRenderingContext2D): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Forcing an export so that this code will execute
     * @hidden
     */
    const name = "Statics";
}
declare module BABYLON.GUI {
    /**
     * This class can be used to get instrumentation data from a AdvancedDynamicTexture object
     */
    export class AdvancedDynamicTextureInstrumentation implements BABYLON.IDisposable {
        /**
         * Define the instrumented AdvancedDynamicTexture.
         */
        texture: AdvancedDynamicTexture;
        private _captureRenderTime;
        private _renderTime;
        private _captureLayoutTime;
        private _layoutTime;
        private _onBeginRenderObserver;
        private _onEndRenderObserver;
        private _onBeginLayoutObserver;
        private _onEndLayoutObserver;
        /**
         * Gets the perf counter used to capture render time
         */
        readonly renderTimeCounter: BABYLON.PerfCounter;
        /**
         * Gets the perf counter used to capture layout time
         */
        readonly layoutTimeCounter: BABYLON.PerfCounter;
        /**
         * Enable or disable the render time capture
         */
        captureRenderTime: boolean;
        /**
         * Enable or disable the layout time capture
         */
        captureLayoutTime: boolean;
        /**
         * Instantiates a new advanced dynamic texture instrumentation.
         * This class can be used to get instrumentation data from an AdvancedDynamicTexture object
         * @param texture Defines the AdvancedDynamicTexture to instrument
         */
        constructor(
        /**
         * Define the instrumented AdvancedDynamicTexture.
         */
        texture: AdvancedDynamicTexture);
        /**
         * Dispose and release associated resources.
         */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create containers for controls
     */
    export class Container3D extends Control3D {
        private _blockLayout;
        /**
         * Gets the list of child controls
         */
        protected _children: Control3D[];
        /**
         * Gets the list of child controls
         */
        readonly children: Array<Control3D>;
        /**
         * Gets or sets a boolean indicating if the layout must be blocked (default is false).
         * This is helpful to optimize layout operation when adding multiple children in a row
         */
        blockLayout: boolean;
        /**
         * Creates a new container
         * @param name defines the container name
         */
        constructor(name?: string);
        /**
         * Force the container to update the layout. Please note that it will not take blockLayout property in account
         * @returns the current container
         */
        updateLayout(): Container3D;
        /**
         * Gets a boolean indicating if the given control is in the children of this control
         * @param control defines the control to check
         * @returns true if the control is in the child list
         */
        containsControl(control: Control3D): boolean;
        /**
         * Adds a control to the children of this control
         * @param control defines the control to add
         * @returns the current container
         */
        addControl(control: Control3D): Container3D;
        /**
         * This function will be called everytime a new control is added
         */
        protected _arrangeChildren(): void;
        protected _createNode(scene: BABYLON.Scene): BABYLON.Nullable<BABYLON.TransformNode>;
        /**
         * Removes a control from the children of this control
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control3D): Container3D;
        protected _getTypeName(): string;
        /**
         * Releases all associated resources
         */
        dispose(): void;
        /** Control rotation will remain unchanged  */
        static readonly UNSET_ORIENTATION: number;
        /** Control will rotate to make it look at sphere central axis */
        static readonly FACEORIGIN_ORIENTATION: number;
        /** Control will rotate to make it look back at sphere central axis */
        static readonly FACEORIGINREVERSED_ORIENTATION: number;
        /** Control will rotate to look at z axis (0, 0, 1) */
        static readonly FACEFORWARD_ORIENTATION: number;
        /** Control will rotate to look at negative z axis (0, 0, -1) */
        static readonly FACEFORWARDREVERSED_ORIENTATION: number;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to manage 3D user interface
     * @see http://doc.babylonjs.com/how_to/gui3d
     */
    export class GUI3DManager implements BABYLON.IDisposable {
        private _scene;
        private _sceneDisposeObserver;
        private _utilityLayer;
        private _rootContainer;
        private _pointerObserver;
        private _pointerOutObserver;
        /** @hidden */
        _lastPickedControl: Control3D;
        /** @hidden */
        _lastControlOver: {
            [pointerId: number]: Control3D;
        };
        /** @hidden */
        _lastControlDown: {
            [pointerId: number]: Control3D;
        };
        /**
         * BABYLON.Observable raised when the point picked by the pointer events changed
         */
        onPickedPointChangedObservable: BABYLON.Observable<BABYLON.Nullable<BABYLON.Vector3>>;
        /** @hidden */
        _sharedMaterials: {
            [key: string]: BABYLON.Material;
        };
        /** Gets the hosting scene */
        readonly scene: BABYLON.Scene;
        /** Gets associated utility layer */
        readonly utilityLayer: BABYLON.Nullable<BABYLON.UtilityLayerRenderer>;
        /**
         * Creates a new GUI3DManager
         * @param scene
         */
        constructor(scene?: BABYLON.Scene);
        private _handlePointerOut;
        private _doPicking;
        /**
         * Gets the root container
         */
        readonly rootContainer: Container3D;
        /**
         * Gets a boolean indicating if the given control is in the root child list
         * @param control defines the control to check
         * @returns true if the control is in the root child list
         */
        containsControl(control: Control3D): boolean;
        /**
         * Adds a control to the root child list
         * @param control defines the control to add
         * @returns the current manager
         */
        addControl(control: Control3D): GUI3DManager;
        /**
         * Removes a control from the root child list
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control3D): GUI3DManager;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to transport BABYLON.Vector3 information for pointer events
     */
    export class Vector3WithInfo extends BABYLON.Vector3 {
        /** defines the current mouse button index */
        buttonIndex: number;
        /**
         * Creates a new Vector3WithInfo
         * @param source defines the vector3 data to transport
         * @param buttonIndex defines the current mouse button index
         */
        constructor(source: BABYLON.Vector3, 
        /** defines the current mouse button index */
        buttonIndex?: number);
    }
}
declare module BABYLON.GUI {
    /**
     * Class used as base class for controls
     */
    export class Control3D implements BABYLON.IDisposable, BABYLON.IBehaviorAware<Control3D> {
        /** Defines the control name */
        name?: string | undefined;
        /** @hidden */
        _host: GUI3DManager;
        private _node;
        private _downCount;
        private _enterCount;
        private _downPointerIds;
        private _isVisible;
        /** Gets or sets the control position  in world space */
        position: BABYLON.Vector3;
        /** Gets or sets the control scaling  in world space */
        scaling: BABYLON.Vector3;
        /** Callback used to start pointer enter animation */
        pointerEnterAnimation: () => void;
        /** Callback used to start pointer out animation */
        pointerOutAnimation: () => void;
        /** Callback used to start pointer down animation */
        pointerDownAnimation: () => void;
        /** Callback used to start pointer up animation */
        pointerUpAnimation: () => void;
        /**
        * An event triggered when the pointer move over the control
        */
        onPointerMoveObservable: BABYLON.Observable<BABYLON.Vector3>;
        /**
         * An event triggered when the pointer move out of the control
         */
        onPointerOutObservable: BABYLON.Observable<Control3D>;
        /**
         * An event triggered when the pointer taps the control
         */
        onPointerDownObservable: BABYLON.Observable<Vector3WithInfo>;
        /**
         * An event triggered when pointer is up
         */
        onPointerUpObservable: BABYLON.Observable<Vector3WithInfo>;
        /**
         * An event triggered when a control is clicked on (with a mouse)
         */
        onPointerClickObservable: BABYLON.Observable<Vector3WithInfo>;
        /**
         * An event triggered when pointer enters the control
         */
        onPointerEnterObservable: BABYLON.Observable<Control3D>;
        /**
         * Gets or sets the parent container
         */
        parent: BABYLON.Nullable<Container3D>;
        private _behaviors;
        /**
         * Gets the list of attached behaviors
         * @see http://doc.babylonjs.com/features/behaviour
         */
        readonly behaviors: BABYLON.Behavior<Control3D>[];
        /**
         * Attach a behavior to the control
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        addBehavior(behavior: BABYLON.Behavior<Control3D>): Control3D;
        /**
         * Remove an attached behavior
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current control
         */
        removeBehavior(behavior: BABYLON.Behavior<Control3D>): Control3D;
        /**
         * Gets an attached behavior by name
         * @param name defines the name of the behavior to look for
         * @see http://doc.babylonjs.com/features/behaviour
         * @returns null if behavior was not found else the requested behavior
         */
        getBehaviorByName(name: string): BABYLON.Nullable<BABYLON.Behavior<Control3D>>;
        /** Gets or sets a boolean indicating if the control is visible */
        isVisible: boolean;
        /**
         * Creates a new control
         * @param name defines the control name
         */
        constructor(
        /** Defines the control name */
        name?: string | undefined);
        /**
         * Gets a string representing the class name
         */
        readonly typeName: string;
        /**
         * Get the current class name of the control.
         * @returns current class name
         */
        getClassName(): string;
        protected _getTypeName(): string;
        /**
         * Gets the transform node used by this control
         */
        readonly node: BABYLON.Nullable<BABYLON.TransformNode>;
        /**
         * Gets the mesh used to render this control
         */
        readonly mesh: BABYLON.Nullable<BABYLON.AbstractMesh>;
        /**
         * Link the control as child of the given node
         * @param node defines the node to link to. Use null to unlink the control
         * @returns the current control
         */
        linkToTransformNode(node: BABYLON.Nullable<BABYLON.TransformNode>): Control3D;
        /** @hidden **/
        _prepareNode(scene: BABYLON.Scene): void;
        /**
         * Node creation.
         * Can be overriden by children
         * @param scene defines the scene where the node must be attached
         * @returns the attached node or null if none. Must return a BABYLON.Mesh or BABYLON.AbstractMesh if there is an atttached visible object
         */
        protected _createNode(scene: BABYLON.Scene): BABYLON.Nullable<BABYLON.TransformNode>;
        /**
         * Affect a material to the given mesh
         * @param mesh defines the mesh which will represent the control
         */
        protected _affectMaterial(mesh: BABYLON.AbstractMesh): void;
        /** @hidden */
        _onPointerMove(target: Control3D, coordinates: BABYLON.Vector3): void;
        /** @hidden */
        _onPointerEnter(target: Control3D): boolean;
        /** @hidden */
        _onPointerOut(target: Control3D): void;
        /** @hidden */
        _onPointerDown(target: Control3D, coordinates: BABYLON.Vector3, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control3D, coordinates: BABYLON.Vector3, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /** @hidden */
        forcePointerUp(pointerId?: BABYLON.Nullable<number>): void;
        /** @hidden */
        _processObservables(type: number, pickedPoint: BABYLON.Vector3, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _disposeNode(): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used as a root to all buttons
     */
    export class AbstractButton3D extends Control3D {
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _createNode(scene: BABYLON.Scene): BABYLON.TransformNode;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a button in 3D
     */
    export class Button3D extends AbstractButton3D {
        /** @hidden */
        protected _currentMaterial: BABYLON.Material;
        private _facadeTexture;
        private _content;
        private _contentResolution;
        private _contentScaleRatio;
        /**
         * Gets or sets the texture resolution used to render content (512 by default)
         */
        contentResolution: BABYLON.int;
        /**
         * Gets or sets the texture scale ratio used to render content (2 by default)
         */
        contentScaleRatio: number;
        protected _disposeFacadeTexture(): void;
        protected _resetContent(): void;
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string);
        /**
         * Gets or sets the GUI 2D content used to display the button's facade
         */
        content: Control;
        /**
         * Apply the facade texture (created from the content property).
         * This function can be overloaded by child classes
         * @param facadeTexture defines the AdvancedDynamicTexture to use
         */
        protected _applyFacade(facadeTexture: AdvancedDynamicTexture): void;
        protected _getTypeName(): string;
        protected _createNode(scene: BABYLON.Scene): BABYLON.TransformNode;
        protected _affectMaterial(mesh: BABYLON.AbstractMesh): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Abstract class used to create a container panel deployed on the surface of a volume
     */
    export abstract class VolumeBasedPanel extends Container3D {
        private _columns;
        private _rows;
        private _rowThenColum;
        private _orientation;
        protected _cellWidth: number;
        protected _cellHeight: number;
        /**
         * Gets or sets the distance between elements
         */
        margin: number;
        /**
         * Gets or sets the orientation to apply to all controls (BABYLON.Container3D.FaceOriginReversedOrientation by default)
        * | Value | Type                                | Description |
        * | ----- | ----------------------------------- | ----------- |
        * | 0     | UNSET_ORIENTATION                   |  Control rotation will remain unchanged |
        * | 1     | FACEORIGIN_ORIENTATION              |  Control will rotate to make it look at sphere central axis |
        * | 2     | FACEORIGINREVERSED_ORIENTATION      |  Control will rotate to make it look back at sphere central axis |
        * | 3     | FACEFORWARD_ORIENTATION             |  Control will rotate to look at z axis (0, 0, 1) |
        * | 4     | FACEFORWARDREVERSED_ORIENTATION     |  Control will rotate to look at negative z axis (0, 0, -1) |
         */
        orientation: number;
        /**
         * Gets or sets the number of columns requested (10 by default).
         * The panel will automatically compute the number of rows based on number of child controls.
         */
        columns: BABYLON.int;
        /**
         * Gets or sets a the number of rows requested.
         * The panel will automatically compute the number of columns based on number of child controls.
         */
        rows: BABYLON.int;
        /**
         * Creates new VolumeBasedPanel
         */
        constructor();
        protected _arrangeChildren(): void;
        /** Child classes must implement this function to provide correct control positioning */
        protected abstract _mapGridNode(control: Control3D, nodePosition: BABYLON.Vector3): void;
        /** Child classes can implement this function to provide additional processing */
        protected _finalProcessing(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a cylinder
     */
    export class CylinderPanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the cylinder where to project controls (5 by default)
         */
        radius: BABYLON.float;
        protected _mapGridNode(control: Control3D, nodePosition: BABYLON.Vector3): void;
        private _cylindricalMapping;
    }
}
declare module BABYLON.GUI {
    /** @hidden */
    export var fluentVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON.GUI {
    /** @hidden */
    export var fluentPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON.GUI {
    /** @hidden */
    export class FluentMaterialDefines extends BABYLON.MaterialDefines {
        INNERGLOW: boolean;
        BORDER: boolean;
        HOVERLIGHT: boolean;
        TEXTURE: boolean;
        constructor();
    }
    /**
     * Class used to render controls with fluent desgin
     */
    export class FluentMaterial extends BABYLON.PushMaterial {
        /**
         * Gets or sets inner glow intensity. A value of 0 means no glow (default is 0.5)
         */
        innerGlowColorIntensity: number;
        /**
         * Gets or sets the inner glow color (white by default)
         */
        innerGlowColor: BABYLON.Color3;
        /**
         * Gets or sets alpha value (default is 1.0)
         */
        alpha: number;
        /**
         * Gets or sets the albedo color (Default is BABYLON.Color3(0.3, 0.35, 0.4))
         */
        albedoColor: BABYLON.Color3;
        /**
         * Gets or sets a boolean indicating if borders must be rendered (default is false)
         */
        renderBorders: boolean;
        /**
         * Gets or sets border width (default is 0.5)
         */
        borderWidth: number;
        /**
         * Gets or sets a value indicating the smoothing value applied to border edges (0.02 by default)
         */
        edgeSmoothingValue: number;
        /**
         * Gets or sets the minimum value that can be applied to border width (default is 0.1)
         */
        borderMinValue: number;
        /**
         * Gets or sets a boolean indicating if hover light must be rendered (default is false)
         */
        renderHoverLight: boolean;
        /**
         * Gets or sets the radius used to render the hover light (default is 1.0)
         */
        hoverRadius: number;
        /**
         * Gets or sets the color used to render the hover light (default is BABYLON.Color4(0.3, 0.3, 0.3, 1.0))
         */
        hoverColor: BABYLON.Color4;
        /**
         * Gets or sets the hover light position in world space (default is BABYLON.Vector3.Zero())
         */
        hoverPosition: BABYLON.Vector3;
        private _albedoTexture;
        /** Gets or sets the texture to use for albedo color */
        albedoTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        /**
         * Creates a new Fluent material
         * @param name defines the name of the material
         * @param scene defines the hosting scene
         */
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FluentMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): FluentMaterial;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _backPlate;
        private _textPlate;
        private _frontPlate;
        private _text;
        private _imageUrl;
        private _shareMaterials;
        private _frontMaterial;
        private _backMaterial;
        private _plateMaterial;
        private _pickedPointObserver;
        private _tooltipFade;
        private _tooltipTextBlock;
        private _tooltipTexture;
        private _tooltipMesh;
        private _tooltipHoverObserver;
        private _tooltipOutObserver;
        private _disposeTooltip;
        /**
         * Text to be displayed on the tooltip shown when hovering on the button. When set to null tooltip is disabled. (Default: null)
         */
        tooltipText: BABYLON.Nullable<string>;
        /**
         * Gets or sets text for the button
         */
        text: string;
        /**
         * Gets or sets the image url for the button
         */
        imageUrl: string;
        /**
         * Gets the back material used by this button
         */
        readonly backMaterial: FluentMaterial;
        /**
         * Gets the front material used by this button
         */
        readonly frontMaterial: FluentMaterial;
        /**
         * Gets the plate material used by this button
         */
        readonly plateMaterial: BABYLON.StandardMaterial;
        /**
         * Gets a boolean indicating if this button shares its material with other HolographicButtons
         */
        readonly shareMaterials: boolean;
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string, shareMaterials?: boolean);
        protected _getTypeName(): string;
        private _rebuildContent;
        protected _createNode(scene: BABYLON.Scene): BABYLON.TransformNode;
        protected _applyFacade(facadeTexture: AdvancedDynamicTexture): void;
        private _createBackMaterial;
        private _createFrontMaterial;
        private _createPlateMaterial;
        protected _affectMaterial(mesh: BABYLON.Mesh): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create an interactable object. It's a 3D button using a mesh coming from the current scene
     */
    export class MeshButton3D extends Button3D {
        /** @hidden */
        protected _currentMesh: BABYLON.Mesh;
        /**
         * Creates a new 3D button based on a mesh
         * @param mesh mesh to become a 3D button
         * @param name defines the control name
         */
        constructor(mesh: BABYLON.Mesh, name?: string);
        protected _getTypeName(): string;
        protected _createNode(scene: BABYLON.Scene): BABYLON.TransformNode;
        protected _affectMaterial(mesh: BABYLON.AbstractMesh): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a plane
     */
    export class PlanePanel extends VolumeBasedPanel {
        protected _mapGridNode(control: Control3D, nodePosition: BABYLON.Vector3): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a container panel where items get randomized planar mapping
     */
    export class ScatterPanel extends VolumeBasedPanel {
        private _iteration;
        /**
         * Gets or sets the number of iteration to use to scatter the controls (100 by default)
         */
        iteration: BABYLON.float;
        protected _mapGridNode(control: Control3D, nodePosition: BABYLON.Vector3): void;
        private _scatterMapping;
        protected _finalProcessing(): void;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a sphere
     */
    export class SpherePanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the sphere where to project controls (5 by default)
         */
        radius: BABYLON.float;
        protected _mapGridNode(control: Control3D, nodePosition: BABYLON.Vector3): void;
        private _sphericalMapping;
    }
}
declare module BABYLON.GUI {
    /**
     * Class used to create a stack panel in 3D on XY plane
     */
    export class StackPanel3D extends Container3D {
        private _isVertical;
        /**
         * Gets or sets a boolean indicating if the stack panel is vertical or horizontal (horizontal by default)
         */
        isVertical: boolean;
        /**
         * Gets or sets the distance between elements
         */
        margin: number;
        /**
         * Creates new StackPanel
         * @param isVertical
         */
        constructor(isVertical?: boolean);
        protected _arrangeChildren(): void;
    }
}