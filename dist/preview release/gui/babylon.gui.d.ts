
declare module BABYLON.GUI {
    interface IFocusableControl {
        onFocus(): void;
        onBlur(): void;
        processKeyboard(evt: KeyboardEvent): void;
    }
    class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _preKeyboardObserver;
        private _pointerMoveObserver;
        private _pointerObserver;
        private _canvasPointerOutObserver;
        private _background;
        _rootContainer: Container;
        _lastPickedControl: Control;
        _lastControlOver: Nullable<Control>;
        _lastControlDown: Nullable<Control>;
        _capturingControl: Nullable<Control>;
        _shouldBlockPointer: boolean;
        _layerToDispose: Nullable<Layer>;
        _linkedControls: Control[];
        private _isFullscreen;
        private _fullscreenViewport;
        private _idealWidth;
        private _idealHeight;
        private _renderAtIdealSize;
        private _focusedControl;
        private _blockNextFocusCheck;
        private _renderScale;
        renderScale: number;
        background: string;
        idealWidth: number;
        idealHeight: number;
        renderAtIdealSize: boolean;
        readonly layer: Nullable<Layer>;
        readonly rootContainer: Container;
        focusedControl: Nullable<IFocusableControl>;
        isForeground: boolean;
        constructor(name: string, width: number | undefined, height: number | undefined, scene: Nullable<Scene>, generateMipMaps?: boolean, samplingMode?: number);
        executeOnAllControls(func: (control: Control) => void, container?: Container): void;
        markAsDirty(): void;
        addControl(control: Control): AdvancedDynamicTexture;
        removeControl(control: Control): AdvancedDynamicTexture;
        dispose(): void;
        private _onResize();
        _getGlobalViewport(scene: Scene): Viewport;
        private _checkUpdate(camera);
        private _render();
        private _doPicking(x, y, type, buttonIndex);
        attach(): void;
        attachToMesh(mesh: AbstractMesh, supportPointerMove?: boolean): void;
        moveFocusToControl(control: IFocusableControl): void;
        private _manageFocus();
        private _attachToOnPointerOut(scene);
        static CreateForMesh(mesh: AbstractMesh, width?: number, height?: number, supportPointerMove?: boolean): AdvancedDynamicTexture;
        static CreateFullscreenUI(name: string, foreground?: boolean, scene?: Nullable<Scene>, sampling?: number): AdvancedDynamicTexture;
    }
}


declare module BABYLON.GUI {
    class Measure {
        left: number;
        top: number;
        width: number;
        height: number;
        constructor(left: number, top: number, width: number, height: number);
        copyFrom(other: Measure): void;
        isEqualsTo(other: Measure): boolean;
        static Empty(): Measure;
    }
}


declare module BABYLON.GUI {
    class Vector2WithInfo extends Vector2 {
        buttonIndex: number;
        constructor(source: Vector2, buttonIndex?: number);
    }
    class Matrix2D {
        m: Float32Array;
        constructor(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number);
        fromValues(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number): Matrix2D;
        determinant(): number;
        invertToRef(result: Matrix2D): Matrix2D;
        multiplyToRef(other: Matrix2D, result: Matrix2D): Matrix2D;
        transformCoordinates(x: number, y: number, result: Vector2): Matrix2D;
        static Identity(): Matrix2D;
        static TranslationToRef(x: number, y: number, result: Matrix2D): void;
        static ScalingToRef(x: number, y: number, result: Matrix2D): void;
        static RotationToRef(angle: number, result: Matrix2D): void;
        private static _TempPreTranslationMatrix;
        private static _TempPostTranslationMatrix;
        private static _TempRotationMatrix;
        private static _TempScalingMatrix;
        private static _TempCompose0;
        private static _TempCompose1;
        private static _TempCompose2;
        static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: Nullable<Matrix2D>, result: Matrix2D): void;
    }
}


declare module BABYLON.GUI {
    class ValueAndUnit {
        unit: number;
        negativeValueAllowed: boolean;
        private _value;
        ignoreAdaptiveScaling: boolean;
        constructor(value: number, unit?: number, negativeValueAllowed?: boolean);
        readonly isPercentage: boolean;
        readonly isPixel: boolean;
        readonly internalValue: number;
        getValueInPixel(host: AdvancedDynamicTexture, refValue: number): number;
        getValue(host: AdvancedDynamicTexture): number;
        toString(host: AdvancedDynamicTexture): string;
        fromString(source: string | number): boolean;
        private static _Regex;
        private static _UNITMODE_PERCENTAGE;
        private static _UNITMODE_PIXEL;
        static readonly UNITMODE_PERCENTAGE: number;
        static readonly UNITMODE_PIXEL: number;
    }
}


declare module BABYLON.GUI {
    class Control {
        name: string | undefined;
        private _alpha;
        private _alphaSet;
        private _zIndex;
        _root: Nullable<Container>;
        _host: AdvancedDynamicTexture;
        parent: Nullable<Container>;
        _currentMeasure: Measure;
        private _fontFamily;
        private _fontStyle;
        private _fontSize;
        private _font;
        _width: ValueAndUnit;
        _height: ValueAndUnit;
        protected _fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        private _color;
        protected _horizontalAlignment: number;
        protected _verticalAlignment: number;
        private _isDirty;
        protected _cachedParentMeasure: Measure;
        private _paddingLeft;
        private _paddingRight;
        private _paddingTop;
        private _paddingBottom;
        _left: ValueAndUnit;
        _top: ValueAndUnit;
        private _scaleX;
        private _scaleY;
        private _rotation;
        private _transformCenterX;
        private _transformCenterY;
        private _transformMatrix;
        private _invertTransformMatrix;
        private _transformedPosition;
        private _isMatrixDirty;
        private _cachedOffsetX;
        private _cachedOffsetY;
        private _isVisible;
        _linkedMesh: Nullable<AbstractMesh>;
        private _fontSet;
        private _dummyVector2;
        private _downCount;
        private _enterCount;
        private _doNotRender;
        isHitTestVisible: boolean;
        isPointerBlocker: boolean;
        isFocusInvisible: boolean;
        shadowOffsetX: number;
        shadowOffsetY: number;
        shadowBlur: number;
        shadowColor: string;
        protected _linkOffsetX: ValueAndUnit;
        protected _linkOffsetY: ValueAndUnit;
        readonly typeName: string;
        /**
        * An event triggered when the pointer move over the control.
        * @type {BABYLON.Observable}
        */
        onPointerMoveObservable: Observable<Vector2>;
        /**
        * An event triggered when the pointer move out of the control.
        * @type {BABYLON.Observable}
        */
        onPointerOutObservable: Observable<Control>;
        /**
        * An event triggered when the pointer taps the control
        * @type {BABYLON.Observable}
        */
        onPointerDownObservable: Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer up
        * @type {BABYLON.Observable}
        */
        onPointerUpObservable: Observable<Vector2WithInfo>;
        /**
        * An event triggered when pointer enters the control
        * @type {BABYLON.Observable}
        */
        onPointerEnterObservable: Observable<Control>;
        /**
        * An event triggered when the control is marked as dirty
        * @type {BABYLON.Observable}
        */
        onDirtyObservable: Observable<Control>;
        /**
       * An event triggered after the control is drawn
       * @type {BABYLON.Observable}
       */
        onAfterDrawObservable: Observable<Control>;
        alpha: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        transformCenterY: number;
        transformCenterX: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        width: string | number;
        readonly widthInPixels: number;
        height: string | number;
        readonly heightInPixels: number;
        fontFamily: string;
        fontStyle: string;
        readonly fontSizeInPixels: number;
        fontSize: string | number;
        color: string;
        zIndex: number;
        notRenderable: boolean;
        isVisible: boolean;
        readonly isDirty: boolean;
        paddingLeft: string | number;
        readonly paddingLeftInPixels: number;
        paddingRight: string | number;
        readonly paddingRightInPixels: number;
        paddingTop: string | number;
        readonly paddingTopInPixels: number;
        paddingBottom: string | number;
        readonly paddingBottomInPixels: number;
        left: string | number;
        readonly leftInPixels: number;
        top: string | number;
        readonly topInPixels: number;
        linkOffsetX: string | number;
        readonly linkOffsetXInPixels: number;
        linkOffsetY: string | number;
        readonly linkOffsetYInPixels: number;
        readonly centerX: number;
        readonly centerY: number;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        getLocalCoordinates(globalCoordinates: Vector2): Vector2;
        getLocalCoordinatesToRef(globalCoordinates: Vector2, result: Vector2): Control;
        getParentLocalCoordinates(globalCoordinates: Vector2): Vector2;
        moveToVector3(position: Vector3, scene: Scene): void;
        linkWithMesh(mesh: Nullable<AbstractMesh>): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
        _markMatrixAsDirty(): void;
        _markAsDirty(): void;
        _markAllAsDirty(): void;
        _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void;
        protected _transform(context: CanvasRenderingContext2D): void;
        protected _applyStates(context: CanvasRenderingContext2D): void;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean;
        protected _clip(context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        contains(x: number, y: number): boolean;
        _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2): void;
        _onPointerEnter(target: Control): boolean;
        _onPointerOut(target: Control): void;
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
        _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void;
        forcePointerUp(): void;
        _processObservables(type: number, x: number, y: number, buttonIndex: number): boolean;
        private _prepareFont();
        dispose(): void;
        private static _HORIZONTAL_ALIGNMENT_LEFT;
        private static _HORIZONTAL_ALIGNMENT_RIGHT;
        private static _HORIZONTAL_ALIGNMENT_CENTER;
        private static _VERTICAL_ALIGNMENT_TOP;
        private static _VERTICAL_ALIGNMENT_BOTTOM;
        private static _VERTICAL_ALIGNMENT_CENTER;
        static readonly HORIZONTAL_ALIGNMENT_LEFT: number;
        static readonly HORIZONTAL_ALIGNMENT_RIGHT: number;
        static readonly HORIZONTAL_ALIGNMENT_CENTER: number;
        static readonly VERTICAL_ALIGNMENT_TOP: number;
        static readonly VERTICAL_ALIGNMENT_BOTTOM: number;
        static readonly VERTICAL_ALIGNMENT_CENTER: number;
        private static _FontHeightSizes;
        static _GetFontOffset(font: string): {
            ascent: number;
            height: number;
            descent: number;
        };
        static AddHeader(control: Control, text: string, size: string | number, options: {
            isHorizontal: boolean;
            controlFirst: boolean;
        }): StackPanel;
        protected static drawEllipse(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class Container extends Control {
        name: string | undefined;
        protected _children: Control[];
        protected _measureForChildren: Measure;
        protected _background: string;
        background: string;
        readonly children: Control[];
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        getChildByName(name: string): Nullable<Control>;
        getChildByType(name: string, type: string): Nullable<Control>;
        containsControl(control: Control): boolean;
        addControl(control: Control): Container;
        removeControl(control: Control): Container;
        _reOrderControl(control: Control): void;
        _markMatrixAsDirty(): void;
        _markAllAsDirty(): void;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    class StackPanel extends Container {
        name: string | undefined;
        private _isVertical;
        private _manualWidth;
        private _manualHeight;
        private _doNotTrackManualChanges;
        private _tempMeasureStore;
        isVertical: boolean;
        width: string | number;
        height: string | number;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class Rectangle extends Container {
        name: string | undefined;
        private _thickness;
        private _cornerRadius;
        thickness: number;
        cornerRadius: number;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawRoundedRect(context, offset?);
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class Ellipse extends Container {
        name: string | undefined;
        private _thickness;
        thickness: number;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
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
        dash: Array<number>;
        connectedControl: Control;
        x1: string | number;
        y1: string | number;
        x2: string | number;
        y2: string | number;
        lineWidth: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        private readonly _effectiveX2;
        private readonly _effectiveY2;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
    }
}


declare module BABYLON.GUI {
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
        onValueChangedObservable: Observable<number>;
        borderColor: string;
        background: string;
        barOffset: string | number;
        readonly barOffsetInPixels: number;
        thumbWidth: string | number;
        readonly thumbWidthInPixels: number;
        minimum: number;
        maximum: number;
        value: number;
        isThumbCircle: boolean;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer(x);
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2): void;
        _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void;
    }
}


declare module BABYLON.GUI {
    class Checkbox extends Control {
        name: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        thickness: number;
        onIsCheckedChangedObservable: Observable<boolean>;
        checkSizeRatio: number;
        background: string;
        isChecked: boolean;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
    }
}


declare module BABYLON.GUI {
    class RadioButton extends Control {
        name: string | undefined;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        thickness: number;
        group: string;
        onIsCheckedChangedObservable: Observable<boolean>;
        checkSizeRatio: number;
        background: string;
        isChecked: boolean;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
    }
}


declare module BABYLON.GUI {
    class TextBlock extends Control {
        name: string | undefined;
        private _text;
        private _textWrapping;
        private _textHorizontalAlignment;
        private _textVerticalAlignment;
        private _lines;
        private _resizeToFit;
        /**
        * An event triggered after the text is changed
        * @type {BABYLON.Observable}
        */
        onTextChangedObservable: Observable<TextBlock>;
        resizeToFit: boolean;
        textWrapping: boolean;
        text: string;
        textHorizontalAlignment: number;
        textVerticalAlignment: number;
        constructor(name?: string | undefined, text?: string);
        protected _getTypeName(): string;
        private _drawText(text, textWidth, y, context);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _parseLine(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _parseLineWithTextWrapping(line: string | undefined, context: CanvasRenderingContext2D): object;
        protected _renderLines(context: CanvasRenderingContext2D): void;
        dispose(): void;
    }
}


declare var DOMImage: new (width?: number | undefined, height?: number | undefined) => HTMLImageElement;
declare module BABYLON.GUI {
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
        sourceLeft: number;
        sourceTop: number;
        sourceWidth: number;
        sourceHeight: number;
        autoScale: boolean;
        stretch: number;
        domImage: HTMLImageElement;
        private _onImageLoaded();
        source: Nullable<string>;
        cellWidth: number;
        cellHeight: number;
        cellId: number;
        constructor(name?: string | undefined, url?: Nullable<string>);
        protected _getTypeName(): string;
        synchronizeSizeWithContent(): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private static _STRETCH_NONE;
        private static _STRETCH_FILL;
        private static _STRETCH_UNIFORM;
        private static _STRETCH_EXTEND;
        static readonly STRETCH_NONE: number;
        static readonly STRETCH_FILL: number;
        static readonly STRETCH_UNIFORM: number;
        static readonly STRETCH_EXTEND: number;
    }
}


declare module BABYLON.GUI {
    class Button extends Rectangle {
        name: string | undefined;
        pointerEnterAnimation: () => void;
        pointerOutAnimation: () => void;
        pointerDownAnimation: () => void;
        pointerUpAnimation: () => void;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean;
        _onPointerEnter(target: Control): boolean;
        _onPointerOut(target: Control): void;
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
        _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void;
        static CreateImageButton(name: string, text: string, imageUrl: string): Button;
        static CreateImageOnlyButton(name: string, imageUrl: string): Button;
        static CreateSimpleButton(name: string, text: string): Button;
        static CreateImageWithCenterTextButton(name: string, text: string, imageUrl: string): Button;
    }
}


declare module BABYLON.GUI {
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
        onValueChangedObservable: Observable<Color3>;
        value: Color3;
        width: string | number;
        height: string | number;
        size: string | number;
        constructor(name?: string | undefined);
        protected _getTypeName(): string;
        private _updateSquareProps();
        private _drawGradientSquare(hueValue, left, top, width, height, context);
        private _drawCircle(centerX, centerY, radius, context);
        private _createColorWheelCanvas(radius, thickness);
        private _RGBtoHSV(color, result);
        private _HSVtoRGB(hue, saturation, value, result);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer(x, y);
        private _isPointOnSquare(coordinates);
        private _isPointOnWheel(coordinates);
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
        _onPointerMove(target: Control, coordinates: Vector2): void;
        _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void;
    }
}


declare module BABYLON.GUI {
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
        promptMessage: string;
        onTextChangedObservable: Observable<InputText>;
        onFocusObservable: Observable<InputText>;
        onBlurObservable: Observable<InputText>;
        maxWidth: string | number;
        readonly maxWidthInPixels: number;
        margin: string;
        readonly marginInPixels: number;
        autoStretchWidth: boolean;
        thickness: number;
        focusedBackground: string;
        background: string;
        placeholderColor: string;
        placeholderText: string;
        text: string;
        constructor(name?: string | undefined, text?: string);
        onBlur(): void;
        onFocus(): void;
        protected _getTypeName(): string;
        processKey(keyCode: number, key?: string): void;
        processKeyboard(evt: KeyboardEvent): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean;
        _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void;
        dispose(): void;
    }
}


declare module BABYLON.GUI {
    class KeyPropertySet {
        width?: string;
        height?: string;
        paddingLeft?: string;
        paddingRight?: string;
        paddingTop?: string;
        paddingBottom?: string;
        color?: string;
        background?: string;
    }
    class VirtualKeyboard extends StackPanel {
        onKeyPressObservable: Observable<string>;
        defaultButtonWidth: string;
        defaultButtonHeight: string;
        defaultButtonPaddingLeft: string;
        defaultButtonPaddingRight: string;
        defaultButtonPaddingTop: string;
        defaultButtonPaddingBottom: string;
        defaultButtonColor: string;
        defaultButtonBackground: string;
        protected _getTypeName(): string;
        private _createKey(key, propertySet);
        addKeysRow(keys: Array<string>, propertySets?: Array<KeyPropertySet>): void;
        private _connectedInputText;
        private _onFocusObserver;
        private _onBlurObserver;
        private _onKeyPressObserver;
        readonly connectedInputText: Nullable<InputText>;
        connect(input: InputText): void;
        disconnect(): void;
        static CreateDefaultLayout(): VirtualKeyboard;
    }
}
