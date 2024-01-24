import type { Nullable } from "core/types";

import { Container } from "./container";
import { ValueAndUnit } from "../valueAndUnit";
import { Control } from "./control";
import type { Measure } from "../measure";
import { Tools } from "core/Misc/tools";
import { RegisterClass } from "core/Misc/typeStore";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { Observer } from "core/Misc/observable";
import { serialize } from "core/Misc/decorators";

/**
 * Class used to create a 2D grid container
 */
export class Grid extends Container {
    private _rowDefinitions = new Array<ValueAndUnit>();
    private _rowDefinitionObservers: Observer<void>[] = [];
    private _columnDefinitions = new Array<ValueAndUnit>();
    private _columnDefinitionObservers: Observer<void>[] = [];
    private _cells: { [key: string]: Container } = {};
    private _childControls = new Array<Control>();

    /**
     * Sets/Gets a boolean indicating that control content must be clipped
     * Please note that not clipping content may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public set clipContent(value: boolean) {
        this._clipContent = value;

        // This value has to be replicated on all of the container cells
        for (const key in this._cells) {
            this._cells[key].clipContent = value;
        }
    }

    @serialize()
    public get clipContent(): boolean {
        return this._clipContent;
    }

    /**
     * Sets/Gets a boolean indicating if the children are clipped to the current control bounds.
     * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public set clipChildren(value: boolean) {
        this._clipChildren = value;

        // This value has to be replicated on all of the container cells
        for (const key in this._cells) {
            this._cells[key].clipChildren = value;
        }
    }

    public get clipChildren(): boolean {
        return this._clipChildren;
    }

    /**
     * Gets the number of columns
     */
    public get columnCount(): number {
        return this._columnDefinitions.length;
    }

    /**
     * Gets the number of rows
     */
    public get rowCount(): number {
        return this._rowDefinitions.length;
    }

    /** Gets the list of children */
    public get children(): Control[] {
        return this._childControls;
    }

    /** Gets the list of cells (e.g. the containers) */
    public get cells(): { [key: string]: Container } {
        return this._cells;
    }

    /**
     * Gets the definition of a specific row
     * @param index defines the index of the row
     * @returns the row definition
     */
    public getRowDefinition(index: number): Nullable<ValueAndUnit> {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return null;
        }

        return this._rowDefinitions[index];
    }

    /**
     * Gets the definition of a specific column
     * @param index defines the index of the column
     * @returns the column definition
     */
    public getColumnDefinition(index: number): Nullable<ValueAndUnit> {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return null;
        }

        return this._columnDefinitions[index];
    }

    /**
     * Adds a new row to the grid
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the height is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public addRowDefinition(height: number, isPixel = false): Grid {
        this._rowDefinitions.push(new ValueAndUnit(height, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));
        this._rowDefinitionObservers.push(this._rowDefinitions[this.rowCount - 1].onChangedObservable.add(() => this._markAsDirty())!);
        this._markAsDirty();

        return this;
    }

    /**
     * Adds a new column to the grid
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public addColumnDefinition(width: number, isPixel = false): Grid {
        this._columnDefinitions.push(new ValueAndUnit(width, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE));
        this._columnDefinitionObservers.push(this._columnDefinitions[this.columnCount - 1].onChangedObservable.add(() => this._markAsDirty())!);
        this._markAsDirty();

        return this;
    }

    /**
     * Update a row definition
     * @param index defines the index of the row to update
     * @param height defines the height of the row (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the weight is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public setRowDefinition(index: number, height: number, isPixel = false): Grid {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }

        const current = this._rowDefinitions[index];
        if (current && current.isPixel === isPixel && current.value === height) {
            return this;
        }

        this._rowDefinitions[index].onChangedObservable.remove(this._rowDefinitionObservers[index]);
        this._rowDefinitions[index] = new ValueAndUnit(height, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE);
        this._rowDefinitionObservers[index] = this._rowDefinitions[index].onChangedObservable.add(() => this._markAsDirty())!;

        this._markAsDirty();

        return this;
    }

    /**
     * Update a column definition
     * @param index defines the index of the column to update
     * @param width defines the width of the column (either in pixel or a value between 0 and 1)
     * @param isPixel defines if the width is expressed in pixel (or in percentage)
     * @returns the current grid
     */
    public setColumnDefinition(index: number, width: number, isPixel = false): Grid {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }

        const current = this._columnDefinitions[index];
        if (current && current.isPixel === isPixel && current.value === width) {
            return this;
        }

        this._columnDefinitions[index].onChangedObservable.remove(this._columnDefinitionObservers[index]);
        this._columnDefinitions[index] = new ValueAndUnit(width, isPixel ? ValueAndUnit.UNITMODE_PIXEL : ValueAndUnit.UNITMODE_PERCENTAGE);
        this._columnDefinitionObservers[index] = this._columnDefinitions[index].onChangedObservable.add(() => this._markAsDirty())!;

        this._markAsDirty();

        return this;
    }

    /**
     * Gets the list of children stored in a specific cell
     * @param row defines the row to check
     * @param column defines the column to check
     * @returns the list of controls
     */
    public getChildrenAt(row: number, column: number): Nullable<Array<Control>> {
        const cell = this._cells[`${row}:${column}`];

        if (!cell) {
            return null;
        }

        return cell.children;
    }

    /**
     * Gets a string representing the child cell info (row x column)
     * @param child defines the control to get info from
     * @returns a string containing the child cell info (row x column)
     */
    public getChildCellInfo(child: Control): string {
        return child._tag;
    }

    private _removeCell(cell: Container, key: string) {
        if (!cell) {
            return;
        }

        super.removeControl(cell);

        for (const control of cell.children) {
            const childIndex = this._childControls.indexOf(control);

            if (childIndex !== -1) {
                this._childControls.splice(childIndex, 1);
            }
        }

        delete this._cells[key];
    }

    private _offsetCell(previousKey: string, key: string) {
        if (!this._cells[key]) {
            return;
        }

        this._cells[previousKey] = this._cells[key];

        for (const control of this._cells[previousKey].children) {
            control._tag = previousKey;
        }

        delete this._cells[key];
    }

    /**
     * Remove a column definition at specified index
     * @param index defines the index of the column to remove
     * @returns the current grid
     */
    public removeColumnDefinition(index: number): Grid {
        if (index < 0 || index >= this._columnDefinitions.length) {
            return this;
        }

        for (let x = 0; x < this._rowDefinitions.length; x++) {
            const key = `${x}:${index}`;
            const cell = this._cells[key];

            this._removeCell(cell, key);
        }

        for (let x = 0; x < this._rowDefinitions.length; x++) {
            for (let y = index + 1; y < this._columnDefinitions.length; y++) {
                const previousKey = `${x}:${y - 1}`;
                const key = `${x}:${y}`;

                this._offsetCell(previousKey, key);
            }
        }

        this._columnDefinitions[index].onChangedObservable.remove(this._columnDefinitionObservers[index]);
        this._columnDefinitions.splice(index, 1);
        this._columnDefinitionObservers.splice(index, 1);

        this._markAsDirty();

        return this;
    }

    /**
     * Remove a row definition at specified index
     * @param index defines the index of the row to remove
     * @returns the current grid
     */
    public removeRowDefinition(index: number): Grid {
        if (index < 0 || index >= this._rowDefinitions.length) {
            return this;
        }

        for (let y = 0; y < this._columnDefinitions.length; y++) {
            const key = `${index}:${y}`;
            const cell = this._cells[key];

            this._removeCell(cell, key);
        }

        for (let y = 0; y < this._columnDefinitions.length; y++) {
            for (let x = index + 1; x < this._rowDefinitions.length; x++) {
                const previousKey = `${x - 1}:${y}`;
                const key = `${x}:${y}`;

                this._offsetCell(previousKey, key);
            }
        }

        this._rowDefinitions[index].onChangedObservable.remove(this._rowDefinitionObservers[index]);
        this._rowDefinitions.splice(index, 1);
        this._rowDefinitionObservers.splice(index, 1);

        this._markAsDirty();

        return this;
    }

    /**
     * Adds a new control to the current grid
     * @param control defines the control to add
     * @param row defines the row where to add the control (0 by default)
     * @param column defines the column where to add the control (0 by default)
     * @returns the current grid
     */
    public addControl(control: Control, row: number = 0, column: number = 0): Grid {
        if (this._rowDefinitions.length === 0) {
            // Add default row definition
            this.addRowDefinition(1, false);
        }

        if (this._columnDefinitions.length === 0) {
            // Add default column definition
            this.addColumnDefinition(1, false);
        }

        if (this._childControls.indexOf(control) !== -1) {
            Tools.Warn(`Control (Name:${control.name}, UniqueId:${control.uniqueId}) is already associated with this grid. You must remove it before reattaching it`);
            return this;
        }

        const x = Math.min(row, this._rowDefinitions.length - 1);
        const y = Math.min(column, this._columnDefinitions.length - 1);
        const key = `${x}:${y}`;
        let goodContainer = this._cells[key];

        if (!goodContainer) {
            goodContainer = new Container(key);
            this._cells[key] = goodContainer;
            goodContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            goodContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            goodContainer.clipContent = this.clipContent;
            goodContainer.clipChildren = this.clipChildren;
            super.addControl(goodContainer);
        }

        goodContainer.addControl(control);
        this._childControls.push(control);
        control._tag = key;
        control.parent = this;

        this._markAsDirty();

        return this;
    }

    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control): Container {
        const index = this._childControls.indexOf(control);

        if (index !== -1) {
            this._childControls.splice(index, 1);
        }

        const cell = this._cells[control._tag];

        if (cell) {
            cell.removeControl(control);
            control._tag = null;
        }

        this._markAsDirty();
        return this;
    }

    /**
     * Creates a new Grid
     * @param name defines control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Grid";
    }

    protected _getGridDefinitions(definitionCallback: (lefts: number[], tops: number[], widths: number[], heights: number[]) => void) {
        const widths = [];
        const heights = [];
        const lefts = [];
        const tops = [];

        let availableWidth = this._currentMeasure.width;
        let globalWidthPercentage = 0;
        let availableHeight = this._currentMeasure.height;
        let globalHeightPercentage = 0;

        // Heights
        let index = 0;
        for (const rowDefinition of this._rowDefinitions) {
            if (rowDefinition.isPixel) {
                const height = rowDefinition.getValue(this._host);
                availableHeight -= height;
                heights[index] = height;
            } else {
                globalHeightPercentage += rowDefinition.value;
            }
            index++;
        }

        let top = 0;
        index = 0;
        for (const rowDefinition of this._rowDefinitions) {
            tops.push(top);

            if (!rowDefinition.isPixel) {
                const height = Math.round((rowDefinition.value / globalHeightPercentage) * availableHeight);
                top += height;
                heights[index] = height;
            } else {
                top += rowDefinition.getValue(this._host);
            }
            index++;
        }

        // Widths
        index = 0;
        for (const columnDefinition of this._columnDefinitions) {
            if (columnDefinition.isPixel) {
                const width = columnDefinition.getValue(this._host);
                availableWidth -= width;
                widths[index] = width;
            } else {
                globalWidthPercentage += columnDefinition.value;
            }
            index++;
        }

        let left = 0;
        index = 0;
        for (const columnDefinition of this._columnDefinitions) {
            lefts.push(left);
            if (!columnDefinition.isPixel) {
                const width = Math.round((columnDefinition.value / globalWidthPercentage) * availableWidth);
                left += width;
                widths[index] = width;
            } else {
                left += columnDefinition.getValue(this._host);
            }
            index++;
        }

        definitionCallback(lefts, tops, widths, heights);
    }

    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        this._getGridDefinitions((lefts: number[], tops: number[], widths: number[], heights: number[]) => {
            // Setting child sizes
            for (const key in this._cells) {
                if (!Object.prototype.hasOwnProperty.call(this._cells, key)) {
                    continue;
                }
                const split = key.split(":");
                const x = parseInt(split[0]);
                const y = parseInt(split[1]);
                const cell = this._cells[key];

                cell.leftInPixels = lefts[y];
                cell.topInPixels = tops[x];
                cell.widthInPixels = widths[y];
                cell.heightInPixels = heights[x];
                cell._left.ignoreAdaptiveScaling = true;
                cell._top.ignoreAdaptiveScaling = true;
                cell._width.ignoreAdaptiveScaling = true;
                cell._height.ignoreAdaptiveScaling = true;
            }
        });

        super._additionalProcessing(parentMeasure, context);
    }

    public _flagDescendantsAsMatrixDirty(): void {
        for (const key in this._cells) {
            if (!Object.prototype.hasOwnProperty.call(this._cells, key)) {
                continue;
            }

            const child = this._cells[key];
            child._markMatrixAsDirty();
        }
    }

    public _renderHighlightSpecific(context: ICanvasRenderingContext): void {
        super._renderHighlightSpecific(context);

        this._getGridDefinitions((lefts: number[], tops: number[], widths: number[], heights: number[]) => {
            // Columns
            for (let index = 0; index < lefts.length; index++) {
                const left = this._currentMeasure.left + lefts[index] + widths[index];
                context.beginPath();
                context.moveTo(left, this._currentMeasure.top);
                context.lineTo(left, this._currentMeasure.top + this._currentMeasure.height);
                context.stroke();
            }

            // Rows
            for (let index = 0; index < tops.length; index++) {
                const top = this._currentMeasure.top + tops[index] + heights[index];
                context.beginPath();
                context.moveTo(this._currentMeasure.left, top);
                context.lineTo(this._currentMeasure.left + this._currentMeasure.width, top);
                context.stroke();
            }
        });

        context.restore();
    }

    /** Releases associated resources */
    public dispose() {
        super.dispose();

        for (const control of this._childControls) {
            control.dispose();
        }
        for (let index = 0; index < this._rowDefinitions.length; index++) {
            this._rowDefinitions[index].onChangedObservable.remove(this._rowDefinitionObservers[index]);
        }
        for (let index = 0; index < this._columnDefinitions.length; index++) {
            this._columnDefinitions[index].onChangedObservable.remove(this._columnDefinitionObservers[index]);
        }
        this._rowDefinitionObservers.length = 0;
        this._rowDefinitions.length = 0;
        this._columnDefinitionObservers.length = 0;
        this._columnDefinitions.length = 0;
        this._cells = {};
        this._childControls.length = 0;
    }

    /**
     * Serializes the current control
     * @param serializationObject defined the JSON serialized object
     * @param force force serialization even if isSerializable === false
     */
    public serialize(serializationObject: any, force: boolean) {
        super.serialize(serializationObject, force);
        if (!this.isSerializable && !force) {
            return;
        }
        serializationObject.columnCount = this.columnCount;
        serializationObject.rowCount = this.rowCount;
        serializationObject.columns = [];
        serializationObject.rows = [];
        serializationObject.tags = [];
        for (let i = 0; i < this.columnCount; ++i) {
            const cd = this.getColumnDefinition(i);
            const childSerializationObject = { value: cd?.getValue(this.host), unit: cd?.unit };
            serializationObject.columns.push(childSerializationObject);
        }
        for (let i = 0; i < this.rowCount; ++i) {
            const rd = this.getRowDefinition(i);
            const childSerializationObject = { value: rd?.getValue(this.host), unit: rd?.unit };
            serializationObject.rows.push(childSerializationObject);
        }
        this.children.forEach((child) => {
            serializationObject.tags.push(child._tag);
        });
    }

    /**
     * @internal
     */
    public _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializedObject, host);
        const children: Control[] = [];
        this.children.forEach((child) => {
            children.push(child);
        });
        this.removeRowDefinition(0);
        this.removeColumnDefinition(0);
        for (let i = 0; i < serializedObject.columnCount; ++i) {
            const columnValue = serializedObject.columns[i].value;
            const unit = serializedObject.columns[i].unit;
            this.addColumnDefinition(columnValue, unit === 1 ? true : false);
        }
        for (let i = 0; i < serializedObject.rowCount; ++i) {
            const rowValue = serializedObject.rows[i].value;
            const unit = serializedObject.rows[i].unit;
            this.addRowDefinition(rowValue, unit === 1 ? true : false);
        }

        for (let i = 0; i < children.length; ++i) {
            const cellInfo = serializedObject.tags[i];
            let rowNumber = parseInt(cellInfo.substring(0, cellInfo.search(":")));
            if (isNaN(rowNumber)) {
                rowNumber = 0;
            }
            let columnNumber = parseInt(cellInfo.substring(cellInfo.search(":") + 1));
            if (isNaN(columnNumber)) {
                columnNumber = 0;
            }
            this.addControl(children[i], rowNumber, columnNumber);
        }
    }
}
RegisterClass("BABYLON.GUI.Grid", Grid);
