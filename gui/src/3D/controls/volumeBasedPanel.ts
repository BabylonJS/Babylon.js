import { Tools } from "babylonjs/Misc/tools";
import { Matrix, Vector3, TmpVectors } from "babylonjs/Maths/math.vector";
import { int } from "babylonjs/types";

import { Container3D } from "./container3D";
import { Control3D } from "./control3D";

/**
 * Abstract class used to create a container panel deployed on the surface of a volume
 */
export abstract class VolumeBasedPanel extends Container3D {
    private _columns = 10;
    private _rows = 0;
    private _rowThenColum = true;

    private _orientation = Container3D.FACEORIGIN_ORIENTATION;

    protected _cellWidth: number;
    protected _cellHeight: number;

    /**
     * Gets or sets the distance between elements
     */
    public margin = 0;

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
    public get orientation(): number {
        return this._orientation;
    }

    public set orientation(value: number) {
        if (this._orientation === value) {
            return;
        }

        this._orientation = value;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    /**
     * Gets or sets the number of columns requested (10 by default).
     * The panel will automatically compute the number of rows based on number of child controls.
     */
    public get columns(): int {
        return this._columns;
    }

    public set columns(value: int) {
        if (this._columns === value) {
            return;
        }

        this._columns = value;
        this._rowThenColum = true;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    /**
     * Gets or sets a the number of rows requested.
     * The panel will automatically compute the number of columns based on number of child controls.
     */
    public get rows(): int {
        return this._rows;
    }

    public set rows(value: int) {
        if (this._rows === value) {
            return;
        }

        this._rows = value;
        this._rowThenColum = false;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    /**
     * Creates new VolumeBasedPanel
     */
    public constructor() {
        super();
    }

    protected _arrangeChildren() {
        this._cellWidth = 0;
        this._cellHeight = 0;
        let rows = 0;
        let columns = 0;
        let controlCount = 0;

        let currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

        // Measure
        for (var child of this._children) {
            if (!child.mesh) {
                continue;
            }

            controlCount++;
            child.mesh.computeWorldMatrix(true);
            //   child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, Tmp.Matrix[0]);

            let boundingBox = child.mesh.getHierarchyBoundingVectors();
            let extendSize = TmpVectors.Vector3[0];
            let diff = TmpVectors.Vector3[1];

            boundingBox.max.subtractToRef(boundingBox.min, diff);

            diff.scaleInPlace(0.5);

            Vector3.TransformNormalToRef(diff, currentInverseWorld, extendSize);

            this._cellWidth = Math.max(this._cellWidth, extendSize.x * 2);
            this._cellHeight = Math.max(this._cellHeight, extendSize.y * 2);
        }

        this._cellWidth += this.margin * 2;
        this._cellHeight += this.margin * 2;

        // Arrange
        if (this._rowThenColum) {
            columns = this._columns;
            rows = Math.ceil(controlCount / this._columns);
        } else {
            rows = this._rows;
            columns = Math.ceil(controlCount / this._rows);
        }

        let startOffsetX = (columns * 0.5) * this._cellWidth;
        let startOffsetY = (rows * 0.5) * this._cellHeight;
        let nodeGrid = [];
        let cellCounter = 0;

        if (this._rowThenColum) {
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < columns; c++) {
                    nodeGrid.push(new Vector3((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
                    cellCounter++;
                    if (cellCounter > controlCount) {
                        break;
                    }
                }
            }
        } else {
            for (var c = 0; c < columns; c++) {
                for (var r = 0; r < rows; r++) {
                    nodeGrid.push(new Vector3((c * this._cellWidth) - startOffsetX + this._cellWidth / 2, (r * this._cellHeight) - startOffsetY + this._cellHeight / 2, 0));
                    cellCounter++;
                    if (cellCounter > controlCount) {
                        break;
                    }
                }
            }
        }

        cellCounter = 0;
        for (var child of this._children) {
            if (!child.mesh) {
                continue;
            }

            this._mapGridNode(child, nodeGrid[cellCounter]);

            cellCounter++;
        }

        this._finalProcessing();
    }

    /** Child classes must implement this function to provide correct control positioning */
    protected abstract _mapGridNode(control: Control3D, nodePosition: Vector3): void;

    /** Child classes can implement this function to provide additional processing */
    protected _finalProcessing() {

    }
}
