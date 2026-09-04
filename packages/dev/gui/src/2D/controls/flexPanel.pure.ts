import { Container } from "./container.pure";
import { type Control } from "./control.pure";
import { Measure } from "../measure";
import { ValueAndUnit } from "../valueAndUnit";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";

/**
 * Main-axis direction and ordering of a FlexPanel.
 */
export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
/**
 * Whether overflowing items form additional lines, and their cross-axis order.
 */
export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
/**
 * Distribution of spare space along the main axis.
 */
export type FlexJustification = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
/**
 * Alignment of items within each line. Stretch fills the line's cross-axis size.
 */
export type FlexAlignment = "flex-start" | "flex-end" | "center" | "stretch";
/**
 * Distribution of lines along the cross axis.
 */
export type FlexContentAlignment = FlexJustification | "stretch";

type FlexItem = { control: Control; basis: number; cross: number; size: number };
type FlexLine = { start: number; end: number; basis: number; cross: number };

/**
 * Arranges controls in flexible rows or columns using their declared width/height as the basis.
 * Supports wrapping, gaps, alignment and Control.flexGrow/flexShrink without rewriting child properties.
 * The panel uses its declared size; intrinsic CSS sizing and baseline alignment are not supported.
 */
export class FlexPanel extends Container {
    private _items: FlexItem[] = [];
    private _lines: FlexLine[] = [];
    private _boxes = new WeakMap<Control, Measure>();
    private _gap = new ValueAndUnit(0, ValueAndUnit.UNITMODE_PIXEL, false);

    private _flexDirection: FlexDirection = "row";
    /**
     * Gets or sets the main axis and item direction. Defaults to row.
     */
    @serialize()
    public get flexDirection(): FlexDirection {
        return this._flexDirection;
    }
    public set flexDirection(value: FlexDirection) {
        if (this._flexDirection !== value) {
            this._flexDirection = value;
            this._markAsDirty();
        }
    }

    private _flexWrap: FlexWrap = "nowrap";
    /**
     * Gets or sets line wrapping. Defaults to nowrap.
     */
    @serialize()
    public get flexWrap(): FlexWrap {
        return this._flexWrap;
    }
    public set flexWrap(value: FlexWrap) {
        if (this._flexWrap !== value) {
            this._flexWrap = value;
            this._markAsDirty();
        }
    }

    private _justifyContent: FlexJustification = "flex-start";
    /**
     * Gets or sets the distribution of remaining main-axis space after flexing.
     */
    @serialize()
    public get justifyContent(): FlexJustification {
        return this._justifyContent;
    }
    public set justifyContent(value: FlexJustification) {
        if (this._justifyContent !== value) {
            this._justifyContent = value;
            this._markAsDirty();
        }
    }

    private _alignItems: FlexAlignment = "flex-start";
    /**
     * Gets or sets cross-axis alignment within each line. Stretch fills the line.
     */
    @serialize()
    public get alignItems(): FlexAlignment {
        return this._alignItems;
    }
    public set alignItems(value: FlexAlignment) {
        if (this._alignItems !== value) {
            this._alignItems = value;
            this._markAsDirty();
        }
    }

    private _alignContent: FlexContentAlignment = "stretch";
    /**
     * Gets or sets cross-axis line distribution when wrapping is enabled.
     */
    @serialize()
    public get alignContent(): FlexContentAlignment {
        return this._alignContent;
    }
    public set alignContent(value: FlexContentAlignment) {
        if (this._alignContent !== value) {
            this._alignContent = value;
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets the gap between items and lines in px, em, rem, or percent of the main-axis size.
     */
    @serialize()
    public get gap(): string | number {
        return this._gap.toString(this._host);
    }
    public set gap(value: string | number) {
        if (this._gap.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Creates a flex layout container.
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);
    }

    protected override _getTypeName(): string {
        return "FlexPanel";
    }

    /** @internal */
    public override _getLayoutMeasureForChild(child: Control): Measure | null {
        return this._boxes.get(child) ?? null;
    }

    private _spacing(alignment: FlexContentAlignment, free: number, count: number): number {
        if (free <= 0) {
            return 0;
        }
        switch (alignment) {
            case "space-between":
                return count > 1 ? free / (count - 1) : 0;
            case "space-around":
                return count > 0 ? free / count : 0;
            case "space-evenly":
                return free / (count + 1);
            default:
                return 0;
        }
    }

    private _offset(alignment: FlexContentAlignment, free: number, spacing: number): number {
        switch (alignment) {
            case "flex-end":
                return free;
            case "center":
                return free / 2;
            case "space-around":
                return spacing / 2;
            case "space-evenly":
                return spacing;
            default:
                return 0;
        }
    }

    protected override _beforeChildLayout(): void {
        const row = this._flexDirection === "row" || this._flexDirection === "row-reverse";
        const reverse = this._flexDirection === "row-reverse" || this._flexDirection === "column-reverse";
        const reverseLines = this._flexWrap === "wrap-reverse";
        const width = Math.max(0, this._measureForChildren.width - (this.descendantsOnlyPadding ? this.paddingLeftInPixels + this.paddingRightInPixels : 0));
        const height = Math.max(0, this._measureForChildren.height - (this.descendantsOnlyPadding ? this.paddingTopInPixels + this.paddingBottomInPixels : 0));
        const main = row ? width : height;
        const cross = row ? height : width;
        const gap = this._getValueInPixel(this._gap, main);
        let count = 0;
        let lineCount = 0;
        let line: FlexLine | undefined;
        for (const child of this._children) {
            if (!child.isVisible || child.notRenderable) {
                continue;
            }
            child._tempParentMeasure.copyFrom(this._measureForChildren);
            const basis = Math.max(0, child._getValueInPixel(child.getDimension(row ? "width" : "height"), main));
            const crossSize = Math.max(0, child._getValueInPixel(child.getDimension(row ? "height" : "width"), cross));
            if (!line || (this._flexWrap !== "nowrap" && count > line.start && line.basis + gap + basis > main)) {
                line = this._lines[lineCount] ?? (this._lines[lineCount] = { start: 0, end: 0, basis: 0, cross: 0 });
                line.start = count;
                line.end = count;
                line.basis = 0;
                line.cross = 0;
                lineCount++;
            }
            line.basis += basis + (count > line.start ? gap : 0);
            line.cross = Math.max(line.cross, crossSize);
            line.end++;
            const entry = this._items[count];
            if (!entry) {
                this._items[count] = { control: child, basis, cross: crossSize, size: basis };
            } else {
                entry.control = child;
                entry.basis = entry.size = basis;
                entry.cross = crossSize;
            }
            count++;
        }
        this._items.length = count;
        this._lines.length = lineCount;
        let crossUsed = Math.max(0, lineCount - 1) * gap;
        for (const current of this._lines) {
            if (this._flexWrap === "nowrap") {
                current.cross = cross;
            }
            crossUsed += current.cross;
        }
        const crossFree = cross - crossUsed;
        const lineSpacing = this._spacing(this._alignContent, crossFree, lineCount);
        const stretch = this._alignContent === "stretch" && crossFree > 0 && lineCount ? crossFree / lineCount : 0;
        let crossPosition = this._flexWrap === "nowrap" ? 0 : this._offset(this._alignContent, crossFree, lineSpacing);
        for (const current of this._lines) {
            current.cross += stretch;
            const free = main - current.basis;
            let weight = 0;
            let factorSum = 0;
            for (let i = current.start; i < current.end; i++) {
                const entry = this._items[i];
                const factor = free >= 0 ? entry.control.flexGrow : entry.control.flexShrink;
                weight += free >= 0 ? factor : factor * entry.basis;
                factorSum += factor;
            }
            const distributable = free * Math.min(1, factorSum);
            let used = Math.max(0, current.end - current.start - 1) * gap;
            for (let i = current.start; i < current.end; i++) {
                const entry = this._items[i];
                const share = free >= 0 ? entry.control.flexGrow : entry.control.flexShrink * entry.basis;
                entry.size = Math.max(0, entry.basis + (weight ? (distributable * share) / weight : 0));
                used += entry.size;
            }
            const remaining = main - used;
            const spacing = this._spacing(this._justifyContent, remaining, current.end - current.start);
            let position = this._offset(this._justifyContent, remaining, spacing);
            for (let i = current.start; i < current.end; i++) {
                const entry = this._items[i];
                const child = entry.control;
                const childCross = this._alignItems === "stretch" ? current.cross : entry.cross;
                const extra = current.cross - childCross;
                let childCrossPosition = crossPosition + (this._alignItems === "center" ? extra / 2 : this._alignItems === "flex-end" ? extra : 0);
                if (reverseLines) {
                    childCrossPosition = cross - childCrossPosition - childCross;
                }
                const childMainPosition = reverse ? main - position - entry.size : position;
                const left = row ? childMainPosition : childCrossPosition;
                const top = row ? childCrossPosition : childMainPosition;
                const childWidth = row ? entry.size : childCross;
                const childHeight = row ? childCross : entry.size;
                let box = this._boxes.get(child);
                if (!box) {
                    box = new Measure(left, top, childWidth, childHeight);
                    this._boxes.set(child, box);
                    child._markAsDirty();
                } else if (box.left !== left || box.top !== top || box.width !== childWidth || box.height !== childHeight) {
                    box.copyFromFloats(left, top, childWidth, childHeight);
                    child._markAsDirty();
                }
                position += entry.size + gap + spacing;
            }
            crossPosition += current.cross + gap + lineSpacing;
        }
    }
}

let _Registered = false;
/**
 * Registers FlexPanel for serialization. Safe to call repeatedly.
 */
export function RegisterFlexPanel(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;
    RegisterClass("BABYLON.GUI.FlexPanel", FlexPanel);
}
