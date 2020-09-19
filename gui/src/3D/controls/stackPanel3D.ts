import { Tools } from "babylonjs/Misc/tools";
import { Matrix, TmpVectors, Vector3 } from "babylonjs/Maths/math.vector";

import { Container3D } from "./container3D";

/**
 * Class used to create a stack panel in 3D on XY plane
 */
export class StackPanel3D extends Container3D {
    private _isVertical = false;

    /**
     * Gets or sets a boolean indicating if the stack panel is vertical or horizontal (horizontal by default)
     */
    public get isVertical(): boolean {
        return this._isVertical;
    }

    public set isVertical(value: boolean) {
        if (this._isVertical === value) {
            return;
        }

        this._isVertical = value;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    /**
     * Gets or sets the distance between elements
     */
    public margin = 0.1;

    /**
     * Creates new StackPanel
     * @param isVertical
     */
    public constructor(isVertical = false) {
        super();

        this._isVertical = isVertical;
    }

    protected _arrangeChildren() {
        let width = 0;
        let height = 0;
        let controlCount = 0;
        let extendSizes = [];

        let currentInverseWorld = Matrix.Invert(this.node!.computeWorldMatrix(true));

        // Measure
        for (var child of this._children) {
            if (!child.mesh) {
                continue;
            }

            controlCount++;
            child.mesh.computeWorldMatrix(true);
            child.mesh.getWorldMatrix().multiplyToRef(currentInverseWorld, TmpVectors.Matrix[0]);

            let boundingBox = child.mesh.getBoundingInfo().boundingBox;
            let extendSize = Vector3.TransformNormal(boundingBox.extendSize, TmpVectors.Matrix[0]);
            extendSizes.push(extendSize);

            if (this._isVertical) {
                height += extendSize.y;
            } else {
                width += extendSize.x;
            }
        }

        if (this._isVertical) {
            height += (controlCount - 1) * this.margin / 2;
        } else {
            width += (controlCount - 1) * this.margin / 2;
        }

        // Arrange
        let offset: number;
        if (this._isVertical) {
            offset = -height;
        } else {
            offset = -width;
        }

        let index = 0;
        for (var child of this._children) {
            if (!child.mesh) {
                continue;
            }
            controlCount--;
            let extendSize = extendSizes[index++];

            if (this._isVertical) {
                child.position.y = offset + extendSize.y;
                child.position.x = 0;
                offset += extendSize.y * 2;
            } else {
                child.position.x = offset + extendSize.x;
                child.position.y = 0;
                offset += extendSize.x * 2;
            }

            offset += (controlCount > 0 ? this.margin : 0);
        }
    }
}
