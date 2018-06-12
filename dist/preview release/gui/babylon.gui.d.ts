
declare module BABYLON.GUI {
    /**
     * Define a style used by control to automatically setup properties based on a template.
     * Only support font related properties so far
     */
    class Style implements BABYLON.IDisposable {
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


declare module BABYLON.GUI {
    /**
     * Class used to specific a value and its associated unit
     */
    class ValueAndUnit {
        /** defines the unit to store */
        unit: number;
        /** defines a boolean indicating if the value can be negative */
        negativeValueAllowed: boolean;
        private _value;
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
         * Gets the value accordingly to its unit
         * @param host  defines the root host
         * @returns the value
         */
        getValue(host: AdvancedDynamicTexture): number;
        /**
         * Gets a string representation of the value
         * @param host defines the root host
         * @returns a string
         */
        toString(host: AdvancedDynamicTexture): string;
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


/**
 * This module hosts all controls for 2D and 3D GUIs
 * @see http://doc.babylonjs.com/how_to/gui
 */
declare module BABYLON.GUI {
    /**
     * Interface used to define a control that can receive focus
     */
    interface IFocusableControl {
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
    }
    /**
     * Class used to create texture to support 2D GUI elements
     * @see http://doc.babylonjs.com/how_to/gui
     */
    class AdvancedDynamicTexture extends DynamicTexture {
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
         * Gets or sets the current focused control
         */
        focusedControl: Nullable<IFocusableControl>;
        /**
         * Gets or sets a boolean indicating if the texture must be rendered in background or foreground when in fullscreen mode
         */
        isForeground: boolean;
        /**
         * Creates a new AdvancedDynamicTexture
         * @param name defines the name of the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param scene defines the hosting scene
         * @param generateMipMaps defines a boolean indicating if mipmaps must be generated (false by default)
         * @param samplingMode defines the texture sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
         */
        constructor(name: string, width: number | undefined, height: number | undefined, scene: Nullable<Scene>, generateMipMaps?: boolean, samplingMode?: number);
        /**
         * Function used to execute a function on all controls
         * @param func defines the function to execute
         * @param container defines the container where controls belong. If null the root container will be used
         */
        executeOnAllControls(func: (control: Control) => void, container?: Container): void;
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
        private _onResize();
        /** @hidden */
        _getGlobalViewport(scene: Scene): Viewport;
        /**
         * Get screen coordinates for a vector3
         * @param position defines the position to project
         * @param worldMatrix defines the world matrix to use
         * @returns the projected position
         */
        getProjectedPosition(position: Vector3, worldMatrix: Matrix): Vector2;
        private _checkUpdate(camera);
        private _render();
        private _doPicking(x, y, type, pointerId, buttonIndex);
        /** @hidden */
        _cleanControlAfterRemovalFromList(list: {
            [pointerId: number]: Control;
        }, control: Control): void;
        /** @hidden */
        _cleanControlAfterRemoval(control: Control): void;
        /** Attach to all scene events required to support pointer events */
        attach(): void;
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
        private _manageFocus();
        private _attachToOnPointerOut(scene);
        /**
         * Creates a new AdvancedDynamicTexture in projected mode (ie. attached to a mesh)
         * @param mesh defines the mesh which will receive the texture
         * @param width defines the texture width (1024 by default)
         * @param height defines the texture height (1024 by default)
         * @param supportPointerMove defines a boolean indicating if the texture must capture move events (true by default)
         * @returns a new AdvancedDynamicTexture
         */
        static CreateForMesh(mesh: AbstractMesh, width?: number, height?: number, supportPointerMove?: boolean): AdvancedDynamicTexture;
        /**
         * Creates a new AdvancedDynamicTexture in fullscreen mode.
         * In this mode the texture will rely on a layer for its rendering.
         * This allows it to be treated like any other layer.
         * As such, if you have a multi camera setup, you can set the layerMask on the GUI as well.
         * LayerMask is set through advancedTexture.layer.layerMask
         * @param name defines name for the texture
         * @param foreground defines a boolean indicating if the texture must be rendered in foreground (default is true)
         * @param scene defines the hsoting scene
         * @param sampling defines the texture sampling mode (BABYLON.Texture.BILINEAR_SAMPLINGMODE by default)
         * @returns a new AdvancedDynamicTexture
         */
        static CreateFullscreenUI(name: string, foreground?: boolean, scene?: Nullable<Scene>, sampling?: number): AdvancedDynamicTexture;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to store 2D control sizes
     */
    class Measure {
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
     * Class used to transport Vector2 information for pointer events
     */
    class Vector2WithInfo extends Vector2 {
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
    class Matrix2D {
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


declare module BABYLON.GUI {
    /**
     * Class used to store a point for a MultiLine object.
     * The point can be pure 2D coordinates, a mesh or a control
     */
    class MultiLinePoint {
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
        /**
         * Gets a translation vector
         * @returns the translation vector
         */
        translate(): Vector2;
        private _translatePoint();
        /** Release associated resources */
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Root class used for all 2D controls
     * @see http://doc.babylonjs.com/how_to/gui#controls
     */
    class Control {
        /** defines the name of the control */
        name: string | undefined;
        private _alpha;
        private _alphaSet;
        private _zIndex;
        /** @hidden */
        _root: Nullable<Container>;
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
        private _isDirty;
        /** @hidden */
        _tempParentMeasure: Measure;
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
        private _transformMatrix;
        /** @hidden */
        protected _invertTransformMatrix: Matrix2D;
        /** @hidden */
        protected _transformedPosition: Vector2;
        private _onlyMeasureMode;
        private _isMatrixDirty;
        private _cachedOffsetX;
        private _cachedOffsetY;
        private _isVisible;
        /** @hidden */
        _linkedMesh: Nullable<AbstractMesh>;
        private _fontSet;
        private _dummyVector2;
        private _downCount;
        private _enterCount;
        private _doNotRender;
        private _downPointerIds;
        /** @hidden */
        _tag: any;
        /** Gets or sets a boolean indicating if the control can be hit with pointer events */
        isHitTestVisible: boolean;
        /** Gets or sets a boolean indicating if the control can block pointer events */
        isPointerBlocker: boolean;
        /** Gets or sets a boolean indicating if the control can be focusable */
        isFocusInvisible: boolean;
        /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
        shadowOffsetX: number;
        /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
        shadowOffsetY: number;
        /** Gets or sets a value indicating the amount of blur to use to render the shadow */
        shadowBlur: number;
        /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
        shadowColor: string;
        /** @hidden */
        protected _linkOffsetX: ValueAndUnit;
        /** @hidden */
        protected _linkOffsetY: ValueAndUnit;
        /** Gets the control type name */
        readonly typeName: string;
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
       * An event triggered after the control is drawn
       */
        onAfterDrawObservable: Observable<Control>;
        /** Gets or set information about font offsets (used to render and align text) */
        fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
        alpha: number;
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
         * Gets control width in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly widthInPixels: number;
        /**
         * Gets or sets control height
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        height: string | number;
        /**
         * Gets control height in pixel
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly heightInPixels: number;
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
        /** Gets font size in pixels */
        readonly fontSizeInPixels: number;
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
         * Gets or sets a value indicating the padding to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingLeft: string | number;
        /**
         * Gets a value indicating the padding in pixels to use on the left of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly paddingLeftInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingRight: string | number;
        /**
         * Gets a value indicating the padding in pixels to use on the right of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly paddingRightInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingTop: string | number;
        /**
         * Gets a value indicating the padding in pixels to use on the top of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly paddingTopInPixels: number;
        /**
         * Gets or sets a value indicating the padding to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        paddingBottom: string | number;
        /**
         * Gets a value indicating the padding in pixels to use on the bottom of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly paddingBottomInPixels: number;
        /**
         * Gets or sets a value indicating the left coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        left: string | number;
        /**
         * Gets a value indicating the left coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly leftInPixels: number;
        /**
         * Gets or sets a value indicating the top coordinate of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        top: string | number;
        /**
         * Gets a value indicating the top coordinate in pixels of the control
         * @see http://doc.babylonjs.com/how_to/gui#position-and-size
         */
        readonly topInPixels: number;
        /**
         * Gets or sets a value indicating the offset on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetX: string | number;
        /**
         * Gets a value indicating the offset in pixels on X axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        readonly linkOffsetXInPixels: number;
        /**
         * Gets or sets a value indicating the offset on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkOffsetY: string | number;
        /**
         * Gets a value indicating the offset in pixels on Y axis to the linked mesh
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        readonly linkOffsetYInPixels: number;
        /** Gets the center coordinate on X axis */
        readonly centerX: number;
        /** Gets the center coordinate on Y axis */
        readonly centerY: number;
        /**
         * Creates a new control
         * @param name defines the name of the control
         */
        constructor(
            /** defines the name of the control */
            name?: string | undefined);
        /** @hidden */
        protected _getTypeName(): string;
        /** @hidden */
        _resetFontCache(): void;
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
        /**
         * Link current control with a target mesh
         * @param mesh defines the mesh to link with
         * @see http://doc.babylonjs.com/how_to/gui#tracking-positions
         */
        linkWithMesh(mesh: Nullable<AbstractMesh>): void;
        /** @hidden */
        _moveToProjectedPosition(projectedPosition: Vector3): void;
        /** @hidden */
        _markMatrixAsDirty(): void;
        /** @hidden */
        _markAsDirty(): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void;
        /** @hidden */
        protected _transform(context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _applyStates(context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        /** @hidden */
        protected _clip(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _measure(): void;
        /** @hidden */
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
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
        _onPointerMove(target: Control, coordinates: Vector2): void;
        /** @hidden */
        _onPointerEnter(target: Control): boolean;
        /** @hidden */
        _onPointerOut(target: Control): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        /** @hidden */
        _forcePointerUp(pointerId?: Nullable<number>): void;
        /** @hidden */
        _processObservables(type: number, x: number, y: number, pointerId: number, buttonIndex: number): boolean;
        private _prepareFont();
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
         */
        static AddHeader(control: Control, text: string, size: string | number, options: {
            isHorizontal: boolean;
            controlFirst: boolean;
        }): StackPanel;
        /** @hidden */
        protected static drawEllipse(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Root class for 2D containers
     * @see http://doc.babylonjs.com/how_to/gui#containers
     */
    class Container extends Control {
        name: string | undefined;
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
         * Removes a control from the current container
         * @param control defines the control to remove
         * @returns the current container
         */
        removeControl(control: Control): Container;
        /** @hidden */
        _reOrderControl(control: Control): void;
        /** @hidden */
        _markMatrixAsDirty(): void;
        /** @hidden */
        _markAllAsDirty(): void;
        /** @hidden */
        protected _localDraw(context: CanvasRenderingContext2D): void;
        /** @hidden */
        _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void;
        /** @hidden */
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean;
        /** @hidden */
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        /** @hidden */
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a 2D stack panel container
     */
    class StackPanel extends Container {
        name: string | undefined;
        private _isVertical;
        private _manualWidth;
        private _manualHeight;
        private _doNotTrackManualChanges;
        private _tempMeasureStore;
        /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
        isVertical: boolean;
        /** Gets or sets panel width */
        width: string | number;
        /** Gets or sets panel height */
        height: string | number;
        /**
         * Creates a new StackPanel
         * @param name defines control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    /** Class used to create rectangle container */
    class Rectangle extends Container {
        name: string | undefined;
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
        private _drawRoundedRect(context, offset?);
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    /** Class used to create 2D ellipse containers */
    class Ellipse extends Container {
        name: string | undefined;
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
    /** Class used to render 2D lines */
    class Line extends Control {
        name: string | undefined;
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
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
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


declare module BABYLON.GUI {
    /**
     * Class used to create slider controls
     */
    class Slider extends Control {
        name: string | undefined;
        private _thumbWidth;
        private _minimum;
        private _maximum;
        private _value;
        private _background;
        private _borderColor;
        private _barOffset;
        private _isThumbCircle;
        private _isThumbClamped;
        /** Observable raised when the sldier value changes */
        onValueChangedObservable: Observable<number>;
        /** Gets or sets border color */
        borderColor: string;
        /** Gets or sets background color */
        background: string;
        /** Gets or sets main bar offset */
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
        /** Gets or sets a boolean indicating if the thumb should be round or square */
        isThumbCircle: boolean;
        /** Gets or sets a value indicating if the thumb can go over main bar extends */
        isThumbClamped: boolean;
        /**
         * Creates a new Slider
         * @param name defines the control name
         */
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer(x, y);
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2): void;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to represent a 2D checkbox
     */
    class Checkbox extends Control {
        name: string | undefined;
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
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** @hidden */
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create radio button controls
     */
    class RadioButton extends Control {
        name: string | undefined;
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
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create text block control
     */
    class TextBlock extends Control {
        /**
         * Defines the name of the control
         */
        name: string | undefined;
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
        textWrapping: boolean;
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
        private _drawText(text, textWidth, y, context);
        /** @hidden */
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _applyStates(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _parseLine(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _parseLineWithTextWrapping(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _renderLines(context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}


declare var DOMImage: new (width?: number | undefined, height?: number | undefined) => HTMLImageElement;
declare module BABYLON.GUI {
    /**
     * Class used to create 2D images
     */
    class Image extends Control {
        name: string | undefined;
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
        private _onImageLoaded();
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
        protected _getTypeName(): string;
        /** Force the control to synchronize with its content */
        synchronizeSizeWithContent(): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private static _STRETCH_NONE;
        private static _STRETCH_FILL;
        private static _STRETCH_UNIFORM;
        private static _STRETCH_EXTEND;
        /** STRETCH_NONE */
        static readonly STRETCH_NONE: number;
        /** STRETCH_FILL */
        static readonly STRETCH_FILL: number;
        /** STRETCH_UNIFORM */
        static readonly STRETCH_UNIFORM: number;
        /** STRETCH_EXTEND */
        static readonly STRETCH_EXTEND: number;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create 2D buttons
     */
    class Button extends Rectangle {
        name: string | undefined;
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
        _onPointerOut(target: Control): void;
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


declare module BABYLON.GUI {
    /** Class used to create color pickers */
    class ColorPicker extends Control {
        name: string | undefined;
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
        /**
         * Observable raised when the value changes
         */
        onValueChangedObservable: Observable<Color3>;
        /** Gets or sets the color of the color picker */
        value: Color3;
        /** Gets or sets control width */
        width: string | number;
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
        private _updateSquareProps();
        private _drawGradientSquare(hueValue, left, top, width, height, context);
        private _drawCircle(centerX, centerY, radius, context);
        private _createColorWheelCanvas(radius, thickness);
        private _RGBtoHSV(color, result);
        private _HSVtoRGB(hue, saturation, value, result);
        /** @hidden */
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer(x, y);
        private _isPointOnSquare(coordinates);
        private _isPointOnWheel(coordinates);
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2): void;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create input text control
     */
    class InputText extends Control implements IFocusableControl {
        name: string | undefined;
        private _text;
        private _placeholderText;
        private _background;
        private _focusedBackground;
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
        /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
        promptMessage: string;
        /** Observable raised when the text changes */
        onTextChangedObservable: Observable<InputText>;
        /** Observable raised when the control gets the focus */
        onFocusObservable: Observable<InputText>;
        /** Observable raised when the control loses the focus */
        onBlurObservable: Observable<InputText>;
        /** Gets or sets the maximum width allowed by the control */
        maxWidth: string | number;
        /** Gets the maximum width allowed by the control in pixels */
        readonly maxWidthInPixels: number;
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
        /** Gets or sets the background color */
        background: string;
        /** Gets or sets the placeholder color */
        placeholderColor: string;
        /** Gets or sets the text displayed when the control is empty */
        placeholderText: string;
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
        /** @hidden */
        processKey(keyCode: number, key?: string): void;
        /** @hidden */
        processKeyboard(evt: KeyboardEvent): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean;
        _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void;
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to store key control properties
     */
    class KeyPropertySet {
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
    class VirtualKeyboard extends StackPanel {
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
        private _createKey(key, propertySet);
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
        private _connectedInputText;
        private _onFocusObserver;
        private _onBlurObserver;
        private _onKeyPressObserver;
        /** Gets the input text control attached with the keyboard */
        readonly connectedInputText: Nullable<InputText>;
        /**
         * Connects the keyboard with an input text control
         * @param input defines the target control
         */
        connect(input: InputText): void;
        /**
         * Disconnects the keyboard from an input text control
         */
        disconnect(): void;
        /**
         * Creates a new keyboard using a default layout
         * @returns a new VirtualKeyboard
         */
        static CreateDefaultLayout(): VirtualKeyboard;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create multi line control
     */
    class MultiLine extends Control {
        name: string | undefined;
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
        /** Gets or sets line width */
        lineWidth: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a 2D grid container
     */
    class Grid extends Container {
        name: string | undefined;
        private _rowDefinitions;
        private _columnDefinitions;
        private _cells;
        private _childControls;
        /** Gets the list of children */
        readonly children: Control[];
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
        private _removeCell(cell, key);
        private _offsetCell(previousKey, key);
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
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        /** Releases associated resources */
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to manage 3D user interface
     * @see http://doc.babylonjs.com/how_to/gui3d
     */
    class GUI3DManager implements BABYLON.IDisposable {
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
        private _handlePointerOut(pointerId, isPointerUp);
        private _doPicking(pi);
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
    /** @hidden */
    class FluentMaterialDefines extends MaterialDefines {
        INNERGLOW: boolean;
        BORDER: boolean;
        HOVERLIGHT: boolean;
        constructor();
    }
    /**
     * Class used to render controls with fluent desgin
     */
    class FluentMaterial extends PushMaterial {
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
         * Gets or sets the radius used to render the hover light (default is 0.15)
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


declare module BABYLON.GUI {
    /**
     * Class used to transport Vector3 information for pointer events
     */
    class Vector3WithInfo extends Vector3 {
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


declare module BABYLON.GUI {
    /**
     * Class used as base class for controls
     */
    class Control3D implements IDisposable, IBehaviorAware<Control3D> {
        /** Defines the control name */
        name: string | undefined;
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


declare module BABYLON.GUI {
    /**
     * Class used to create containers for controls
     */
    class Container3D extends Control3D {
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


declare module BABYLON.GUI {
    /**
     * Class used as a root to all buttons
     */
    class AbstractButton3D extends Control3D {
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _createNode(scene: Scene): TransformNode;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a button in 3D
     */
    class Button3D extends AbstractButton3D {
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


declare module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    class HolographicButton extends Button3D {
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
        private _rebuildContent();
        protected _createNode(scene: Scene): TransformNode;
        protected _applyFacade(facadeTexture: AdvancedDynamicTexture): void;
        private _createBackMaterial(mesh);
        private _createFrontMaterial(mesh);
        private _createPlateMaterial(mesh);
        protected _affectMaterial(mesh: Mesh): void;
        /**
         * Releases all associated resources
         */
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a stack panel in 3D on XY plane
     */
    class StackPanel3D extends Container3D {
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


declare module BABYLON.GUI {
    /**
     * Abstract class used to create a container panel deployed on the surface of a volume
     */
    abstract class VolumeBasedPanel extends Container3D {
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
         * Creates new SpherePanel
         */
        constructor();
        protected _arrangeChildren(): void;
        /** Child classes must implement this function to provide correct control positioning */
        protected abstract _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        /** Child classes can implement this function to provide additional processing */
        protected _finalProcessing(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a sphere
     */
    class SpherePanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the sphere where to project controls (5 by default)
         */
        radius: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _sphericalMapping(source);
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a plane
     */
    class PlanePanel extends VolumeBasedPanel {
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a container panel where items get randomized planar mapping
     */
    class ScatterPanel extends VolumeBasedPanel {
        private _iteration;
        /**
         * Gets or sets the number of iteration to use to scatter the controls (100 by default)
         */
        iteration: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _scatterMapping(source);
        protected _finalProcessing(): void;
    }
}


declare module BABYLON.GUI {
    /**
     * Class used to create a container panel deployed on the surface of a cylinder
     */
    class CylinderPanel extends VolumeBasedPanel {
        private _radius;
        /**
         * Gets or sets the radius of the cylinder where to project controls (5 by default)
         */
        radius: float;
        protected _mapGridNode(control: Control3D, nodePosition: Vector3): void;
        private _cylindricalMapping(source);
    }
}
