/// <reference path="../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _pointerMoveObserver;
        private _pointerObserver;
        private _background;
        _rootContainer: Container;
        _lastControlOver: Control;
        _lastControlDown: Control;
        _shouldBlockPointer: boolean;
        _layerToDispose: Layer;
        _linkedControls: Control[];
        private _isFullscreen;
        background: string;
        constructor(name: string, width: number, height: number, scene: Scene, generateMipMaps?: boolean, samplingMode?: number);
        markAsDirty(): void;
        addControl(control: Control): AdvancedDynamicTexture;
        removeControl(control: Control): AdvancedDynamicTexture;
        dispose(): void;
        private _onResize();
        private _checkUpdate(camera);
        private _render();
        private _doPicking(x, y, type);
        attach(): void;
        attachToMesh(mesh: AbstractMesh): void;
        static CreateForMesh(mesh: AbstractMesh, width?: number, height?: number): AdvancedDynamicTexture;
        static CreateFullscreenUI(name: string, foreground: boolean, scene: Scene): AdvancedDynamicTexture;
    }
}

/// <reference path="../../dist/preview release/babylon.d.ts" />
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

/// <reference path="../../dist/preview release/babylon.d.ts" />
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

/// <reference path="../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class ValueAndUnit {
        value: number;
        unit: number;
        negativeValueAllowed: boolean;
        constructor(value?: number, unit?: number, negativeValueAllowed?: boolean);
        readonly isPercentage: boolean;
        readonly isPixel: boolean;
        toString(): string;
        fromString(source: string): boolean;
        private static _Regex;
        private static _UNITMODE_PERCENTAGE;
        private static _UNITMODE_PIXEL;
        static readonly UNITMODE_PERCENTAGE: number;
        static readonly UNITMODE_PIXEL: number;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Control {
        name: string;
        private _alpha;
        private _zIndex;
        _root: Container;
        _host: AdvancedDynamicTexture;
        _currentMeasure: Measure;
        private _fontFamily;
        private _fontSize;
        private _font;
        private _width;
        private _height;
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
        private _marginLeft;
        private _marginRight;
        private _marginTop;
        private _marginBottom;
        private _left;
        private _top;
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
        _linkedMesh: AbstractMesh;
        isHitTestVisible: boolean;
        isPointerBlocker: boolean;
        linkOffsetX: number;
        linkOffsetY: number;
        /**
        * An event triggered when the pointer move over the control.
        * @type {BABYLON.Observable}
        */
        onPointerMoveObservable: Observable<Control>;
        /**
        * An event triggered when the pointer move out of the control.
        * @type {BABYLON.Observable}
        */
        onPointerOutObservable: Observable<Control>;
        /**
        * An event triggered when the pointer taps the control
        * @type {BABYLON.Observable}
        */
        onPointerDownObservable: Observable<Control>;
        /**
        * An event triggered when pointer up
        * @type {BABYLON.Observable}
        */
        onPointerUpObservable: Observable<Control>;
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
        width: string;
        height: string;
        fontFamily: string;
        fontSize: number;
        color: string;
        zIndex: number;
        readonly isDirty: boolean;
        marginLeft: string;
        marginRight: string;
        marginTop: string;
        marginBottom: string;
        left: string;
        top: string;
        readonly centerX: number;
        readonly centerY: number;
        constructor(name: string);
        linkWithMesh(mesh: AbstractMesh): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
        _markMatrixAsDirty(): void;
        protected _markAsDirty(): void;
        _link(root: Container, host: AdvancedDynamicTexture): void;
        protected _transform(context: CanvasRenderingContext2D): void;
        protected _applyStates(context: CanvasRenderingContext2D): void;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clip(context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        contains(x: number, y: number): boolean;
        _processPicking(x: number, y: number, type: number): boolean;
        protected _onPointerMove(): void;
        protected _onPointerEnter(): void;
        protected _onPointerOut(): void;
        protected _onPointerDown(): void;
        protected _onPointerUp(): void;
        protected _processObservables(type: number): boolean;
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
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Container extends Control {
        name: string;
        protected _children: Control[];
        protected _measureForChildren: Measure;
        protected _background: string;
        background: string;
        constructor(name: string);
        containsControl(control: Control): boolean;
        addControl(control: Control): Container;
        removeControl(control: Control): Container;
        _reOrderControl(control: Control): void;
        _markMatrixAsDirty(): void;
        protected _localDraw(context: CanvasRenderingContext2D): void;
        _link(root: Container, host: AdvancedDynamicTexture): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _processPicking(x: number, y: number, type: number): boolean;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class StackPanel extends Container {
        name: string;
        private _isVertical;
        isVertical: boolean;
        constructor(name: string);
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Rectangle extends Container {
        name: string;
        private _thickness;
        private _cornerRadius;
        thickness: number;
        cornerRadius: number;
        background: string;
        constructor(name: string);
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawRoundedRect(context, offset?);
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Ellipse extends Container {
        name: string;
        private _thickness;
        thickness: number;
        constructor(name: string);
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _clipForChildren(context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
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
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        lineWidth: number;
        horizontalAlignment: number;
        verticalAlignment: number;
        constructor(name: string);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _measure(): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _moveToProjectedPosition(projectedPosition: Vector3): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
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
        constructor(name: string, text: string);
        private _drawText(text, textWidth, y, context);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _renderLines(context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare var DOMImage: new (width?: number, height?: number) => HTMLImageElement;
declare module BABYLON.GUI {
    class Image extends Control {
        name: string;
        private _domImage;
        private _imageWidth;
        private _imageHeight;
        private _loaded;
        private _stretch;
        stretch: number;
        constructor(name: string, url: string);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private static _STRETCH_NONE;
        private static _STRETCH_FILL;
        private static _STRETCH_UNIFORM;
        static readonly STRETCH_NONE: number;
        static readonly STRETCH_FILL: number;
        static readonly STRETCH_UNIFORM: number;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Button extends Rectangle {
        name: string;
        pointerEnterAnimation: () => void;
        pointerOutAnimation: () => void;
        pointerDownAnimation: () => void;
        pointerUpAnimation: () => void;
        constructor(name: string);
        _processPicking(x: number, y: number, type: number): boolean;
        protected _onPointerEnter(): void;
        protected _onPointerOut(): void;
        protected _onPointerDown(): void;
        protected _onPointerUp(): void;
        static CreateImageButton(name: string, text: string, imageUrl: string): Button;
        static CreateSimpleButton(name: string, text: string): Button;
    }
}
