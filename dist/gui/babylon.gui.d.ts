
declare module BABYLON.GUI {
    class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _pointerMoveObserver;
        private _pointerObserver;
        private _canvasBlurObserver;
        private _background;
        _rootContainer: Container;
        _lastControlOver: Control;
        _lastControlDown: Control;
        _capturingControl: Control;
        _shouldBlockPointer: boolean;
        _layerToDispose: Layer;
        _linkedControls: Control[];
        private _isFullscreen;
        private _fullscreenViewport;
        private _idealWidth;
        private _idealHeight;
        private _renderAtIdealSize;
        background: string;
        idealWidth: number;
        idealHeight: number;
        renderAtIdealSize: boolean;
        readonly layer: Layer;
        constructor(name: string, width: number, height: number, scene: Scene, generateMipMaps?: boolean, samplingMode?: number);
        executeOnAllControls(func: (control: Control) => void, container?: Container): void;
        markAsDirty(): void;
        addControl(control: Control): AdvancedDynamicTexture;
        removeControl(control: Control): AdvancedDynamicTexture;
        dispose(): void;
        private _onResize();
        _getGlobalViewport(scene: Scene): Viewport;
        private _checkUpdate(camera);
        private _render();
        private _doPicking(x, y, type);
        attach(): void;
        attachToMesh(mesh: AbstractMesh): void;
        private _attachToOnBlur(scene);
        static CreateForMesh(mesh: AbstractMesh, width?: number, height?: number): AdvancedDynamicTexture;
        static CreateFullscreenUI(name: string, foreground?: boolean, scene?: Scene): AdvancedDynamicTexture;
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
        static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: Matrix2D, result: Matrix2D): void;
    }
}


declare module BABYLON.GUI {
    class ValueAndUnit {
        unit: number;
        negativeValueAllowed: boolean;
        private _value;
        ignoreAdaptiveScaling: boolean;
        constructor(value: any, unit?: number, negativeValueAllowed?: boolean);
        readonly isPercentage: boolean;
        readonly isPixel: boolean;
        readonly internalValue: number;
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
        name: string;
        private _alpha;
        private _alphaSet;
        private _zIndex;
        _root: Container;
        _host: AdvancedDynamicTexture;
        _currentMeasure: Measure;
        private _fontFamily;
        private _fontSize;
        private _font;
        _width: ValueAndUnit;
        _height: ValueAndUnit;
        private _lastMeasuredFont;
        protected _fontOffset: {
            ascent: number;
            height: number;
            descent: number;
        };
        private _color;
        protected _horizontalAlignment: number;
        protected _verticalAlignment: number;
        private _isDirty;
        private _cachedParentMeasure;
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
        _linkedMesh: AbstractMesh;
        private _fontSet;
        private _dummyVector2;
        private _downCount;
        private _enterCount;
        isHitTestVisible: boolean;
        isPointerBlocker: boolean;
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
        onPointerDownObservable: Observable<Vector2>;
        /**
        * An event triggered when pointer up
        * @type {BABYLON.Observable}
        */
        onPointerUpObservable: Observable<Vector2>;
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
        alpha: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        transformCenterY: number;
        transformCenterX: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        width: string | number;
        height: string | number;
        fontFamily: string;
        fontSize: string | number;
        color: string;
        zIndex: number;
        isVisible: boolean;
        readonly isDirty: boolean;
        paddingLeft: string | number;
        paddingRight: string | number;
        paddingTop: string | number;
        paddingBottom: string | number;
        left: string | number;
        top: string | number;
        linkOffsetX: string | number;
        linkOffsetY: string | number;
        readonly centerX: number;
        readonly centerY: number;
        constructor(name?: string);
        protected _getTypeName(): string;
        getLocalCoordinates(globalCoordinates: Vector2): Vector2;
        getLocalCoordinatesToRef(globalCoordinates: Vector2, result: Vector2): Control;
        moveToVector3(position: Vector3, scene: Scene): void;
        linkWithMesh(mesh: AbstractMesh): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
        _markMatrixAsDirty(): void;
        _markAsDirty(): void;
        _markAllAsDirty(): void;
        _link(root: Container, host: AdvancedDynamicTexture): void;
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
        _processPicking(x: number, y: number, type: number): boolean;
        protected _onPointerMove(coordinates: Vector2): void;
        protected _onPointerEnter(): boolean;
        protected _onPointerOut(): void;
        protected _onPointerDown(coordinates: Vector2): boolean;
        protected _onPointerUp(coordinates: Vector2): void;
        forcePointerUp(): void;
        _processObservables(type: number, x: number, y: number): boolean;
        private _prepareFont();
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
        name: string;
        protected _children: Control[];
        protected _measureForChildren: Measure;
        protected _background: string;
        background: string;
        readonly children: Control[];
        constructor(name?: string);
        protected _getTypeName(): string;
        getChildByName(name: string): Control;
        getChildByType(name: string, type: string): Control;
        containsControl(control: Control): boolean;
        addControl(control: Control): Container;
        removeControl(control: Control): Container;
        _reOrderControl(control: Control): void;
        _markMatrixAsDirty(): void;
        _markAllAsDirty(): void;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        _link(root: Container, host: AdvancedDynamicTexture): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _processPicking(x: number, y: number, type: number): boolean;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class StackPanel extends Container {
        name: string;
        private _isVertical;
        private _manualWidth;
        private _manualHeight;
        private _tempMeasureStore;
        isVertical: boolean;
        manualWidth: boolean;
        manualHeight: boolean;
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class Rectangle extends Container {
        name: string;
        private _thickness;
        private _cornerRadius;
        thickness: number;
        cornerRadius: number;
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawRoundedRect(context, offset?);
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}


declare module BABYLON.GUI {
    class Ellipse extends Container {
        name: string;
        private _thickness;
        thickness: number;
        constructor(name?: string);
        protected _getTypeName(): string;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class Line extends Control {
        name: string;
        private _lineWidth;
        private _background;
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
        constructor(name?: string);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class Slider extends Control {
        name: string;
        private _thumbWidth;
        private _minimum;
        private _maximum;
        private _value;
        private _background;
        private _borderColor;
        private _barOffset;
        onValueChangedObservable: Observable<number>;
        borderColor: string;
        background: string;
        barOffset: string | number;
        thumbWidth: string | number;
        minimum: number;
        maximum: number;
        value: number;
        constructor(name?: string);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _pointerIsDown;
        private _updateValueFromPointer(x);
        protected _onPointerDown(coordinates: Vector2): boolean;
        protected _onPointerMove(coordinates: Vector2): void;
        protected _onPointerUp(coordinates: Vector2): void;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class Checkbox extends Control {
        name: string;
        private _isChecked;
        private _background;
        private _checkSizeRatio;
        private _thickness;
        thickness: number;
        onIsCheckedChangedObservable: Observable<boolean>;
        checkSizeRatio: number;
        background: string;
        isChecked: boolean;
        constructor(name?: string);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _onPointerDown(coordinates: Vector2): boolean;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class RadioButton extends Control {
        name: string;
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
        constructor(name?: string);
        protected _getTypeName(): string;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _onPointerDown(coordinates: Vector2): boolean;
    }
}


declare module BABYLON.GUI {
    class TextBlock extends Control {
        name: string;
        private _text;
        private _textY;
        private _textWrapping;
        private _textHorizontalAlignment;
        private _textVerticalAlignment;
        private _lines;
        private _totalHeight;
        textWrapping: boolean;
        text: string;
        textHorizontalAlignment: number;
        textVerticalAlignment: number;
        constructor(name?: string, text?: string);
        protected _getTypeName(): string;
        private _drawText(text, textWidth, y, context);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _parseLine(line: string, context: CanvasRenderingContext2D): object;
        protected _parseLineWithTextWrapping(line: string, context: CanvasRenderingContext2D): object;
        protected _renderLines(context: CanvasRenderingContext2D): void;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class Image extends Control {
        name: string;
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
        sourceLeft: number;
        sourceTop: number;
        sourceWidth: number;
        sourceHeight: number;
        autoScale: boolean;
        stretch: number;
        domImage: HTMLImageElement;
        private _onImageLoaded();
        source: string;
        constructor(name?: string, url?: string);
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
        name: string;
        pointerEnterAnimation: () => void;
        pointerOutAnimation: () => void;
        pointerDownAnimation: () => void;
        pointerUpAnimation: () => void;
        constructor(name?: string);
        protected _getTypeName(): string;
        _processPicking(x: number, y: number, type: number): boolean;
        protected _onPointerEnter(): boolean;
        protected _onPointerOut(): void;
        protected _onPointerDown(coordinates: Vector2): boolean;
        protected _onPointerUp(coordinates: Vector2): void;
        static CreateImageButton(name: string, text: string, imageUrl: string): Button;
        static CreateImageOnlyButton(name: string, imageUrl: string): Button;
        static CreateSimpleButton(name: string, text: string): Button;
    }
}


declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class ColorPicker extends Control {
        name: string;
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
        constructor(name?: string);
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
        protected _onPointerDown(coordinates: Vector2): boolean;
        protected _onPointerMove(coordinates: Vector2): void;
        protected _onPointerUp(coordinates: Vector2): void;
    }
}
