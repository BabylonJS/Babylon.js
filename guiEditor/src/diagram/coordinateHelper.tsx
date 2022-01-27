import { Control } from "babylonjs-gui/2D/controls/control";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Axis } from "babylonjs/Maths/math.axis";
import { Plane } from "babylonjs/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { GlobalState } from '../globalState';

export class Rect {
    public top: number;
    public left: number;
    public right: number;
    public bottom: number;
    constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    public get center() {
        const topLeft = new Vector2(this.left, this.top);
        return topLeft.addInPlace(new Vector2(this.right, this.bottom).subtractInPlace(topLeft).multiplyByFloats(0.5, 0.5));
    }

    public get width() {
        return this.right - this.left;
    }

    public get height() {
        return this.bottom - this.top;
    }
}

const roundFactor = 100;
const round = (value: number) => Math.round(value * roundFactor) / roundFactor;

export class CoordinateHelper {
    private static _matrixCache: Matrix2D[] = [Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity()];
    public static globalState: GlobalState;

    /**
     * Get the scaling of a specific GUI control
     * @param node the node for which we are getting the scaling
     * @param relative should we return only the relative scaling (relative to the parent)
     * @returns an X,Y vector of the scaling
     */
    public static getScale(node: Control, relative?: boolean): Vector2 {
        let x = node.scaleX;
        let y = node.scaleY;
        if (relative) {
            return new Vector2(x, y);
        }
        let parent = node.parent;
        while (parent) {
            x *= parent.scaleX;
            y *= parent.scaleY;
            parent = parent.parent;
        }
        return new Vector2(x, y);
    }

    public static getRotation(node: Control, relative?: boolean): number {
        // Gets rotate of a control account for all of it's parents rotations
        let rotation = node.rotation;
        if (relative) {
            return rotation;
        }
        let parent = node.parent;
        while (parent) {
            rotation += parent.rotation;
            parent = parent.parent;
        }
        return rotation;
    }

    /**
     * This function calculates a local matrix for a node, including it's full transformation and pivot point
     *
     * @param node the node to calculate the matrix for
     * @param useStoredValues should the stored (cached) values be used to calculate the matrix
     * @returns a new matrix for the control
     */
     public static getNodeMatrix(node: Control, storedValues?: Rect): Matrix2D {
        const size = this.globalState.guiTexture.getSize();
        // parent should always be defined, but stay safe
        const parentWidth = node.parent ? node.parent._currentMeasure.width : size.width;
        const parentHeight = node.parent ? node.parent._currentMeasure.height : size.height;
        let x = 0;
        let y = 0;

        const width = storedValues ? storedValues.width : node.widthInPixels;
        const height = storedValues ? storedValues.height : node.heightInPixels;
        const left = storedValues ? storedValues.left : node.leftInPixels;
        const top = storedValues ? storedValues.top : node.topInPixels;

        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = -(parentWidth - width) / 2;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = (parentWidth - width) / 2;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = 0;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                y = -(parentHeight - height) / 2;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                y = (parentHeight - height) / 2;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                y = 0;
                break;
        }
        this.resetMatrixArray();

        const m2d = this._matrixCache[0];
        const translateTo = this._matrixCache[1];
        // as this is used later it needs to persist
        const resultMatrix = Matrix2D.Identity();

        // the pivot point around which the object transforms
        let offsetX = width * node.transformCenterX - width / 2;
        let offsetY = height * node.transformCenterY - height / 2;
        // pivot changes this point's position! but only in legacy pivot mode
        if (!(node as any).descendantsOnlyPadding) {
            // TODO - padding needs to also take scaling into account?
            offsetX -= ((node.paddingRightInPixels - node.paddingLeftInPixels) * 1) / 2;
            offsetY -= ((node.paddingBottomInPixels - node.paddingTopInPixels) * 1) / 2;
        }

        // Set the translation
        Matrix2D.TranslationToRef(x + left, y + top, translateTo);
        // without parents scaling and rotation, calculate world matrix for each
        const rotation = this.getRotation(node, true);
        const scaling = this.getScale(node, true);
        // COmpose doesn't actually translate, but creates a form of pivot in a specific position
        Matrix2D.ComposeToRef(-offsetX, -offsetY, rotation, scaling.x, scaling.y, null, m2d);
        // actually compose the matrix
        resultMatrix.multiplyToRef(m2d, resultMatrix);
        resultMatrix.multiplyToRef(translateTo, resultMatrix);
        return resultMatrix;
    }

    /**
     * Using the node's tree, calculate its world matrix and return it
     * @param node the node to calculate the matrix for
     * @param useStoredValuesIfPossible used stored valued (cached when pointer down is clicked)
     * @returns the world matrix for this node
     */
     public static nodeToRTTWorldMatrix(node: Control, storedValues?: Rect): Matrix2D {
        const listOfNodes = [node];
        let parent = node.parent;
        let child = node;
        while (parent) {
            if (parent.typeName === "Grid") {
                const cellInfo = (parent as Grid).getChildCellInfo(child);
                const cell = (parent as Grid).cells[cellInfo];
                listOfNodes.push(cell);
            }
            listOfNodes.push(parent);
            child = parent;
            parent = parent.parent;
        }
        this.resetMatrixArray();
        const matrices = listOfNodes.map((node, index) => this.getNodeMatrix(node, index === 0 ? storedValues : undefined));
        return matrices.reduce((acc, cur) => {
            acc.multiplyToRef(cur, acc);
            return acc;
        }, this._matrixCache[2]);
    }

    public static nodeToRTTSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), storedValues?: Rect) {
        const worldMatrix = this.nodeToRTTWorldMatrix(node, storedValues);
        worldMatrix.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
        return reference;
    }

    public static rttToLocalNodeSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), storedValues?: Rect) {
        const worldMatrix = this.nodeToRTTWorldMatrix(node, storedValues);
        const inv = this._matrixCache[3];
        worldMatrix.invertToRef(inv);
        inv.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
        return reference;
    }

    public static rttToCanvasSpace(x: number, y: number) {
        const camera = this.globalState.workbench._camera;
        const scene = this.globalState.workbench._scene;
        const tmpVec = new Vector3(x, 0, -y);

        // Get the final projection in view space
        const engine = scene.getEngine();
        // TODO - to ref
        const projected = Vector3.Project(tmpVec, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
        // round to 1 decimal points
        projected.x = round(projected.x);
        projected.y = round(projected.y);
        return projected;
    }

    private static resetMatrixArray() {
        this._matrixCache.forEach((matrix) => {
            Matrix2D.IdentityToRef(matrix);
        });
    }

    public static computeLocalBounds(node: Control) {
        return new Rect(-node.widthInPixels * 0.5, -node.heightInPixels * 0.5, node.widthInPixels * 0.5, node.heightInPixels * 0.5);
    }

    private static _plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);

    public static mousePointerToRTTSpace(node: Control, x?: number, y?: number) {
        const camera = this.globalState.workbench._camera;
        const scene = this.globalState.workbench._scene;
        const newPosition = this.globalState.workbench.getPosition(scene, camera, this._plane, x ?? scene.pointerX, y || scene.pointerY);
        newPosition.z *= -1;
        return new Vector2(round(newPosition.x), round(newPosition.z));
    }
} 