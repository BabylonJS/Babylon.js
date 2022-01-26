import { Control } from "babylonjs-gui/2D/controls/control";
import { Matrix2D } from "babylonjs-gui/2D/math2D";
import { Axis } from "babylonjs/Maths/math.axis";
import { Plane } from "babylonjs/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Image } from "babylonjs-gui/2D/controls/image";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { Grid } from "babylonjs-gui/2D/controls/grid";

require("./workbenchCanvas.scss");
const gizmoPivotIcon: string = require("../../public/imgs/gizmoPivotIcon.svg");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}

// which side of the bounding box are we on?
enum ScalePointPosition {
    Top = -1,
    Left = -1,
    Center = 0,
    Right = 1,
    Bottom = 1,
}

// a single gizmo scale point on the bounding box
interface IScalePoint {
    position: Vector2;
    horizontalPosition: ScalePointPosition;
    verticalPosition: ScalePointPosition;
    rotation: number;
    isPivot: boolean;
}

class Rect {
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

interface IGuiGizmoState {
    canvasBounds: Rect;
    scalePoints: IScalePoint[];
    scalePointDragging: number;
    isRotating: boolean;
}

const roundFactor = 100;
const round = (value: number) => Math.round(value * roundFactor) / roundFactor;

// this defines the lines that link the corners, making up the bounding box
const lines = [
    [0, 2],
    [0, 6],
    [2, 8],
    [6, 8],
];

// load in custom cursor icons
const cursorScaleDiagonaLeft: string = `url("${require("../../public/imgs/cursor_scaleDiagonalLeft.svg")}") 12 12, nwse-resize`;
const cursorScaleDiagonalRight: string = `url("${require("../../public/imgs/cursor_scaleDiagonalRight.svg")}") 12 12, nesw-resize`;
const cursorScaleHorizontal: string = `url("${require("../../public/imgs/cursor_scaleHorizontal.svg")}") 12 12, pointer`;
const cursorScaleVertical: string = `url("${require("../../public/imgs/cursor_scaleVertical.svg")}") 12 12, ns-resize`;
const scalePointCursors = [cursorScaleVertical, cursorScaleDiagonalRight, cursorScaleHorizontal, cursorScaleDiagonaLeft, cursorScaleVertical, cursorScaleDiagonalRight, cursorScaleHorizontal, cursorScaleDiagonaLeft];
const rotateCursors : string[] = [];
for(let idx = 0; idx < 8; idx++) {
    rotateCursors.push(`url("${require(`../../public/imgs/cursor_rotate${idx}.svg`)}") 12 12, pointer`);
}
// used to calculate which cursor icon we should display for the scalepoints
const defaultScalePointRotations = [
    315, 0, 45,
    270, 0, 90,
    225, 180, 135,
]

export class GuiGizmoComponent extends React.Component<IGuiGizmoProps, IGuiGizmoState> {
    private _matrixCache: Matrix2D[];
    private _responsive: boolean;

    // used for scaling computations
    private _initH = 0;
    private _initW = 0;
    private _initX = 0;
    private _initY = 0;
    private _localBounds: Rect;

    private _rotation: {
        pivot: Vector2
        initialAngleToPivot: number,
        nodeRotations: number[]
    }

    constructor(props: IGuiGizmoProps) {
        super(props);
        this.props.globalState.guiGizmo = this;
        this._responsive = DataStorage.ReadBoolean("Responsive", true);
        this._matrixCache = [Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity(), Matrix2D.Identity()];

        const scalePoints: IScalePoint[] = [];
        for (let vertical = ScalePointPosition.Top; vertical <= ScalePointPosition.Bottom; vertical++) {
            for (let horizontal = ScalePointPosition.Left; horizontal <= ScalePointPosition.Right; horizontal++) {
                const isPivot = horizontal === ScalePointPosition.Center && vertical === ScalePointPosition.Center;
                scalePoints.push({ position: new Vector2(), horizontalPosition: horizontal, verticalPosition: vertical, rotation: 0, isPivot });
            }
        }

        this._localBounds = new Rect(0, 0, 0, 0);

        this.state = {
            canvasBounds: new Rect(0, 0, 0, 0),
            scalePoints,
            scalePointDragging: -1,
            isRotating: false
        };

        props.globalState.onSelectionChangedObservable.add((selection) => {
            this.updateGizmo(true);
        });

        this.props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo(true);
        });

        this.updateGizmo(true);
    }

    componentDidMount() {}

    /**
     * Update the gizmo's positions
     * @param force should the update be forced. otherwise it will be updated only when the pointer is down
     */
    updateGizmo(force?: boolean) {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (selectedGuiNodes.length > 0 && (force || this.state.scalePointDragging !== -1)) {
            // Calculating the offsets for each scale point.
            const half = 1 / 2;
            const canvasBounds = new Rect(Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);
            selectedGuiNodes.forEach((node) => {
                const localBounds = this._computeLocalBounds(node);
                this.state.scalePoints.forEach((scalePoint) => {
                    let nodeSpace = new Vector2();
                    switch (scalePoint.horizontalPosition) {
                        case ScalePointPosition.Left:
                            nodeSpace.x = localBounds.left;
                            break;
                        case ScalePointPosition.Center:
                            nodeSpace.x = localBounds.center.x;
                            break;
                        case ScalePointPosition.Right:
                            nodeSpace.x = localBounds.right;
                            break;
                    }
                    switch (scalePoint.verticalPosition) {
                        case ScalePointPosition.Top:
                            nodeSpace.y = localBounds.top;
                            break;
                        case ScalePointPosition.Center:
                            nodeSpace.y = localBounds.center.y;
                            break;
                        case ScalePointPosition.Bottom:
                            nodeSpace.y = localBounds.bottom;
                            break;
                    }
                    if (scalePoint.isPivot) {
                        // Calculate the pivot point
                        const pivotX = (node.transformCenterX - 0.5) * 2;
                        const pivotY = (node.transformCenterY - 0.5) * 2;
                        nodeSpace.x = node.widthInPixels * half * pivotX;
                        nodeSpace.y = node.heightInPixels * half * pivotY;
                    }
                    const rtt = this._nodeToRTTSpace(node, nodeSpace.x, nodeSpace.y, undefined, false);
                    const canvas = this._rttToCanvasSpace(rtt.x, rtt.y);
                    if (canvas.x < canvasBounds.left) {
                        canvasBounds.left = canvas.x;
                    }
                    if (canvas.x > canvasBounds.right) {
                        canvasBounds.right = canvas.x;
                    }
                    if (canvas.y < canvasBounds.top) {
                        canvasBounds.top = canvas.y;
                    }
                    if (canvas.y > canvasBounds.bottom) {
                        canvasBounds.bottom = canvas.y;
                    }
                    // if we have a single control selected, put scale points at its edges, and rotate based on the rotation of the control
                    if (selectedGuiNodes.length === 1) {
                        scalePoint.position.x = canvas.x;
                        scalePoint.position.y = canvas.y;
                        scalePoint.rotation = this.getRotation(node) * (180 / Math.PI);
                    }
                });
            });
            // if we are in multiselect mode, use the bounds to determine the scale point locations, and set rotation = 0
            if (selectedGuiNodes.length > 1) {
                this.state.scalePoints.forEach((scalePoint) => {
                    switch (scalePoint.verticalPosition) {
                        case ScalePointPosition.Top:
                            scalePoint.position.y = canvasBounds.top;
                            break;
                        case ScalePointPosition.Center:
                            scalePoint.position.y = canvasBounds.center.y;
                            break;
                        case ScalePointPosition.Bottom:
                            scalePoint.position.y = canvasBounds.bottom;
                            break;
                    }
                    switch (scalePoint.horizontalPosition) {
                        case ScalePointPosition.Left:
                            scalePoint.position.x = canvasBounds.left;
                            break;
                        case ScalePointPosition.Center:
                            scalePoint.position.x = canvasBounds.center.x;
                            break;
                        case ScalePointPosition.Right:
                            scalePoint.position.x = canvasBounds.right;
                            break;
                    }
                    scalePoint.rotation = 0;
                });
            }
            this.setState({
                canvasBounds,
                scalePoints: [...this.state.scalePoints],
            });
        }
        else {
            this.forceUpdate();
        }
    }

    private _resetMatrixArray() {
        this._matrixCache.forEach((matrix) => {
            Matrix2D.IdentityToRef(matrix);
        });
    }

    /**
     * This function calculates a local matrix for a node, including it's full transformation and pivot point
     *
     * @param node the node to calculate the matrix for
     * @param useStoredValues should the stored (cached) values be used to calculate the matrix
     * @returns a new matrix for the control
     */
    private _getNodeMatrix(node: Control, useStoredValues?: boolean): Matrix2D {
        const size = this.props.globalState.guiTexture.getSize();
        // parent should always be defined, but stay safe
        const parentWidth = node.parent ? node.parent._currentMeasure.width : size.width;
        const parentHeight = node.parent ? node.parent._currentMeasure.height : size.height;
        let x = 0;
        let y = 0;

        const width = useStoredValues ? this._initW : node.widthInPixels;
        const height = useStoredValues ? this._initH : node.heightInPixels;
        const left = useStoredValues ? this._initX : node.leftInPixels;
        const top = useStoredValues ? this._initY : node.topInPixels;

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
        this._resetMatrixArray();

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
    private _nodeToRTTWorldMatrix(node: Control, useStoredValuesIfPossible?: boolean): Matrix2D {
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
        this._resetMatrixArray();
        const matrices = listOfNodes.map((node, index) => this._getNodeMatrix(node, index === 0 && this.state.scalePointDragging !== -1 && useStoredValuesIfPossible));
        return matrices.reduce((acc, cur) => {
            acc.multiplyToRef(cur, acc);
            return acc;
        }, this._matrixCache[2]);
    }

    private _nodeToRTTSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        worldMatrix.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
        return reference;
    }

    private _rttToLocalNodeSpace(node: Control, x: number, y: number, reference: Vector2 = new Vector2(), useStoredValuesIfPossible?: boolean) {
        const worldMatrix = this._nodeToRTTWorldMatrix(node, useStoredValuesIfPossible);
        const inv = this._matrixCache[3];
        worldMatrix.invertToRef(inv);
        inv.transformCoordinates(x, y, reference);
        // round
        reference.x = round(reference.x);
        reference.y = round(reference.y);
        return reference;
    }

    private _rttToCanvasSpace(x: number, y: number) {
        const tmpVec = new Vector3(x, 0, -y);

        // Get the final projection in view space
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const engine = scene.getEngine();
        // TODO - to ref
        const projected = Vector3.Project(tmpVec, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
        // round to 1 decimal points
        projected.x = round(projected.x);
        projected.y = round(projected.y);
        return projected;
    }

    private _plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);
    private _mousePointerToRTTSpace(node: Control, x?: number, y?: number) {
        const camera = this.props.globalState.workbench._camera;
        const scene = this.props.globalState.workbench._scene;
        const newPosition = this.props.globalState.workbench.getPosition(scene, camera, this._plane, x ?? scene.pointerX, y || scene.pointerY);
        newPosition.z *= -1;
        return new Vector2(round(newPosition.x), round(newPosition.z));
    }

    /**
     * Get the scaling of a specific GUI control
     * @param node the node for which we are getting the scaling
     * @param relative should we return only the relative scaling (relative to the parent)
     * @returns an X,Y vector of the scaling
     */
    getScale(node: Control, relative?: boolean): Vector2 {
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

    getRotation(node: Control, relative?: boolean): number {
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

    public onUp(evt?: React.PointerEvent) {
        this._onUp(evt);
    }

    private _onUp = (evt?: React.PointerEvent | PointerEvent) => {
        // cleanup on pointer up
        this.setState({ scalePointDragging: -1, isRotating: false });
    };

    public onMove(evt: React.PointerEvent) {
        this._onMove();
    }
    private _onMove = () => {
        const scene = this.props.globalState.workbench._scene;
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        if (this.state.scalePointDragging !== -1) {
            if (selectedGuiNodes.length === 1) {
                const node = selectedGuiNodes[0];
                const inRTT = this._mousePointerToRTTSpace(node, scene.pointerX, scene.pointerY);
                const inNodeSpace = this._rttToLocalNodeSpace(node, inRTT.x, inRTT.y, undefined, true);
                this._dragLocalBounds(inNodeSpace);
                this._updateNodeFromLocalBounds(node, this.state.scalePointDragging);
                //convert to percentage
                if (this._responsive) {
                    this.props.globalState.workbench.convertToPercentage(node, false);
                }
                this.props.globalState.workbench._liveGuiTextureRerender = false;
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
        if (this.state.isRotating) {
            selectedGuiNodes.forEach((node, index) => {
                const nodeRotationData = this._rotation.nodeRotations[index];
                const angle = Math.atan2(scene.pointerY - this._rotation.pivot.y, scene.pointerX - this._rotation.pivot.x);
                node.rotation = nodeRotationData + (angle - this._rotation.initialAngleToPivot);
            })
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        }
    };

    private _rotate(x: number, y: number, centerX: number, centerY: number, angle: number) {
        return {
            x: (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle) + centerX,
            y: (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle) + centerY,
        };
    }

    private _computeLocalBounds(node: Control) {
        return new Rect(-node.widthInPixels * 0.5, -node.heightInPixels * 0.5, node.widthInPixels * 0.5, node.heightInPixels * 0.5);
    }

    private _dragLocalBounds(toPosition: Vector2) {
        const scalePoint = this.state.scalePoints[this.state.scalePointDragging];
        if (scalePoint.horizontalPosition === ScalePointPosition.Left) {
            this._localBounds.left = toPosition.x;
        }
        if (scalePoint.horizontalPosition === ScalePointPosition.Right) {
            this._localBounds.right = toPosition.x;
        }
        if (scalePoint.verticalPosition === ScalePointPosition.Left) {
            this._localBounds.top = toPosition.y;
        }
        if (scalePoint.verticalPosition === ScalePointPosition.Bottom) {
            this._localBounds.bottom = toPosition.y;
        }
    }

    private _updateNodeFromLocalBounds(node: Control, scalePointIndex: number) {
        const width = this._localBounds.right - this._localBounds.left;
        const height = this._localBounds.bottom - this._localBounds.top;
        const scalePoint = this.state.scalePoints[scalePointIndex];
        const left = scalePoint.horizontalPosition === ScalePointPosition.Left && scalePoint.verticalPosition !== ScalePointPosition.Center;
        const top = scalePoint.verticalPosition === ScalePointPosition.Top && scalePoint.horizontalPosition !== ScalePointPosition.Center;
        // calculate the center point
        const localRotation = this.getRotation(node, true);
        const localScaling = this.getScale(node, true);
        const absoluteCenter = this._localBounds.center;
        const center = absoluteCenter.clone();
        // move to pivot
        center.multiplyInPlace(localScaling);
        const cosRotation = Math.cos(localRotation);
        const sinRotation = Math.sin(localRotation);
        const cosRotation180 = Math.cos(localRotation + Math.PI);
        const sinRotation180 = Math.sin(localRotation + Math.PI);
        const widthDelta = (this._initW - width) * 0.5;
        const heightDelta = (this._initH - height) * 0.5;
        // alignment compensation
        switch (node.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                center.x += (left ? widthDelta : -absoluteCenter.x) * cosRotation;
                center.y += (left ? -widthDelta : absoluteCenter.x) * sinRotation;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                center.x += (left ? -widthDelta : absoluteCenter.x) * cosRotation;
                center.y += (left ? widthDelta : -absoluteCenter.x) * sinRotation;
                break;
        }

        switch (node.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                center.y += (top ? -heightDelta : absoluteCenter.y) * cosRotation180;
                center.x += (top ? -heightDelta : absoluteCenter.y) * sinRotation180;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                center.y += (top ? heightDelta : -absoluteCenter.y) * cosRotation180;
                center.x += (top ? heightDelta : -absoluteCenter.y) * sinRotation180;
                break;
        }

        // rotate the center around 0,0
        const rotatedCenter = this._rotate(center.x, center.y, 0, 0, localRotation);
        // round the values and set them
        node.leftInPixels = round(this._initX + rotatedCenter.x);
        node.topInPixels = round(this._initY + rotatedCenter.y);
        node.widthInPixels = round(Math.max(10, width));
        node.heightInPixels = round(Math.max(10, height));

        if (node.typeName === "Image") {
            (node as Image).autoScale = false;
        } else if (node.typeName === "TextBlock") {
            (node as TextBlock).resizeToFit = false;
        }

        if (this._responsive) {
            this.props.globalState.workbench.convertToPercentage(node, true);
        }
    }

    private _beginDraggingScalePoint = (scalePointIndex: number) => {
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        this.setState({ scalePointDragging: scalePointIndex });
        if (selectedGuiNodes.length > 0) {
            const node = selectedGuiNodes[0];
            this._localBounds = this._computeLocalBounds(node);
            this._initW = node.widthInPixels;
            this._initH = node.heightInPixels;
            this._initY = node.topInPixels;
            this._initX = node.leftInPixels;
        }
    };

    private _beginRotate = () => {
        const scene = this.props.globalState.workbench._scene;
        const selectedGuiNodes = this.props.globalState.workbench.selectedGuiNodes;
        let pivot: Vector2;
        if (selectedGuiNodes.length === 1) {
            const node = selectedGuiNodes[0];
            const nodeSpace = new Vector2(node.transformCenterX, node.transformCenterY);
            const rtt = this._nodeToRTTSpace(node, nodeSpace.x, nodeSpace.y, undefined, false);
            const canvas = this._rttToCanvasSpace(rtt.x, rtt.y);
            pivot = new Vector2(canvas.x, canvas.y);
        } else {
            pivot = this.state.canvasBounds.center;
        }
        const initialAngleToPivot = Math.atan2(scene.pointerY - pivot.y, scene.pointerX - pivot.x);
        const nodeRotations : number[] = [];
        selectedGuiNodes.forEach(node => {
            nodeRotations.push(node.rotation)
        })
        this._rotation = {
            pivot,
            initialAngleToPivot,
            nodeRotations
        }
        this.setState({isRotating: true});
    }

    render() {
        // don't render if we don't have anything selected, or if we're currently dragging
        if (this.props.globalState.workbench.selectedGuiNodes.length === 0 || this.state.scalePointDragging !== -1) return null;
        return (
            <div className="gizmo">
                {lines.map((line, index) => {
                    const start = this.state.scalePoints[line[0]];
                    const end = this.state.scalePoints[line[1]];
                    // the vector between start and end
                    const delta = end.position.subtract(start.position);
                    const angle = Math.atan2(delta.y, delta.x);
                    const length = delta.length();
                    return (
                        <div
                            className="bounding-box-line"
                            key={index}
                            style={{
                                left: `${start.position.x + delta.x / 2}px`,
                                top: `${start.position.y + delta.y / 2}px`,
                                width: `${length}px`,
                                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                            }}
                        ></div>
                    );
                })}
                {this.state.scalePoints.map((scalePoint, index) => {
                    const style: React.CSSProperties = {
                        left: `${scalePoint.position.x}px`,
                        top: `${scalePoint.position.y}px`,
                        transform: "translate(-50%, -50%) rotate(" + scalePoint.rotation + "deg)",
                        pointerEvents: this.state.scalePointDragging === -1 && !scalePoint.isPivot && !this.state.isRotating ? "auto" : "none",
                    };
                    if (scalePoint.isPivot) {
                        if (this.props.globalState.workbench.selectedGuiNodes.length > 1) {
                            return null;
                        }
                        return <img className="pivot-point" src={gizmoPivotIcon} style={style} key={index} />;
                    }
                    // compute which cursor icon to use on hover
                    const angleOfCursor = (defaultScalePointRotations[index]  + scalePoint.rotation);
                    let angleAdjusted = angleOfCursor % (360);
                    if (angleAdjusted < 0) angleAdjusted += 360;
                    const increment = 45;
                    let cursorIndex = Math.round(angleAdjusted / increment) % 8;
                    const cursor = scalePointCursors[cursorIndex];
                    const scalePointContainerSize = 30; // .scale-point-container width/height in px
                    const rotateClickAreaSize = 20; // .rotate-click-area width/height
                    const rotateClickAreaOffset = 7; // how much to offset the invisible rotate click area from the center
                    const rotateClickAreaStyle = {
                        top: (scalePointContainerSize - rotateClickAreaSize) / 2 + rotateClickAreaOffset * scalePoint.verticalPosition,
                        left: (scalePointContainerSize - rotateClickAreaSize) / 2 + rotateClickAreaOffset * scalePoint.horizontalPosition,
                        cursor: rotateCursors[cursorIndex]
                    }
                    const scaleClickAreaSize = 20; // .scale-click-area width/height
                    const scaleClickAreaOffset = 5; // how much to offset the invisible scale click area from the center
                    const scaleClickAreaStyle = {
                        top: (scalePointContainerSize - scaleClickAreaSize) / 2 - scaleClickAreaOffset * scalePoint.verticalPosition,
                        left: (scalePointContainerSize - scaleClickAreaSize) / 2 - scaleClickAreaOffset * scalePoint.horizontalPosition,
                        cursor
                    }
                    return (
                        <div key={index} style={style} className="scale-point-container">
                            <div
                                className="rotate-click-area"
                                onPointerDown={() => this._beginRotate()}
                                style={rotateClickAreaStyle}
                            >
                            </div>
                            <div
                            className="scale-click-area"
                            draggable={true}
                            onDragStart={(evt) => evt.preventDefault()}
                            onPointerDown={() => {
                                this._beginDraggingScalePoint(index);
                            }}
                            onPointerUp={this._onUp}
                            style={scaleClickAreaStyle}
                            >
                            </div>
                            <div
                                className="scale-point"
                                draggable={true}
                                onDragStart={(evt) => evt.preventDefault()}
                                onPointerDown={() => {
                                    this._beginDraggingScalePoint(index);
                                }}
                                onPointerUp={this._onUp}
                                style={{cursor}}
                            >
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}
