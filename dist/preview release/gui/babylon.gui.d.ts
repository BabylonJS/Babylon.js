/// <reference path="../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty;
        private _renderObserver;
        private _resizeObserver;
        private _background;
        private _rootContainer;
        background: string;
        constructor(name: string, size: number, scene: Scene);
        markAsDirty(): void;
        addControl(control: Control): AdvancedDynamicTexture;
        removeControl(control: Control): AdvancedDynamicTexture;
        dispose(): void;
        private _onResize();
        private _checkUpdate();
        private _render();
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
        private _horizontalAlignment;
        private _verticalAlignment;
        private _isDirty;
        private _cachedParentMeasure;
        private _marginLeft;
        private _marginRight;
        private _marginTop;
        private _marginBottom;
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
        constructor(name: string);
        protected _markAsDirty(): void;
        _link(root: Container, host: AdvancedDynamicTexture): void;
        protected applyStates(context: CanvasRenderingContext2D): void;
        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _measure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
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
    class ContentControl extends Control {
        name: string;
        private _child;
        protected _measureForChild: Measure;
        child: Control;
        constructor(name: string);
        protected _localDraw(context: CanvasRenderingContext2D): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Container extends Control {
        name: string;
        private _children;
        constructor(name: string);
        addControl(control: Control): Container;
        removeControl(control: Control): Container;
        _reOrderControl(control: Control): void;
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GUI {
    class Rectangle extends ContentControl {
        name: string;
        private _thickness;
        private _background;
        thickness: number;
        background: string;
        constructor(name: string);
        protected _localDraw(context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
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
        protected _measure(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        private _drawText(text, textWidth, y, context);
        _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void;
        protected _renderLines(context: CanvasRenderingContext2D): void;
    }
}
