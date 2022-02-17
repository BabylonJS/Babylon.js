import { Control } from "babylonjs-gui/2D/controls/control";
import { Vector2 } from "babylonjs/Maths/math.vector";
import * as React from "react";
import { GlobalState } from "../globalState";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Image } from "babylonjs-gui/2D/controls/image";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { CoordinateHelper, DimensionProperties, Rect } from './coordinateHelper';
import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";

require("./workbenchCanvas.scss");
const gizmoPivotIcon: string = require("../../public/imgs/gizmoPivotIcon.svg");

export interface IGuiGizmoProps {
    globalState: GlobalState;
    control: Control;
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
    private _responsive: boolean;

    // used for scaling computations
    private _storedValues: Rect;
    private _localBounds: Rect;

    private _rotation: {
        pivot: Vector2
        initialAngleToPivot: number,
    }

    private _responsiveChangedObserver: Nullable<Observer<boolean>>;
    private _gizmoUpdateObserver: Nullable<Observer<void>>;
    private _pointerUpObserver: Nullable<Observer<Nullable<React.PointerEvent<HTMLCanvasElement> | PointerEvent>>>;
    private _pointerMoveObserver: Nullable<Observer<React.PointerEvent<HTMLCanvasElement>>>;

    constructor(props: IGuiGizmoProps) {
        super(props);
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

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

        this._responsiveChangedObserver = this.props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this._gizmoUpdateObserver = this.props.globalState.onGizmoUpdateRequireObservable.add(() => {
            this.updateGizmo(true);
        });

        this._pointerUpObserver = this.props.globalState.onPointerUpObservable.add(evt => this._onUp(evt));
        this._pointerMoveObserver = this.props.globalState.onPointerMoveObservable.add(evt => this._onMove());

        this.updateGizmo(true);
    }

    componentWillUnmount() {
        this.props.globalState.onResponsiveChangeObservable.remove(this._responsiveChangedObserver);
        this.props.globalState.onGizmoUpdateRequireObservable.remove(this._gizmoUpdateObserver);
        this.props.globalState.onPointerUpObservable.remove(this._pointerUpObserver);
        this.props.globalState.onPointerMoveObservable.remove(this._pointerMoveObserver);
    }

    /**
     * Update the gizmo's positions
     * @param force should the update be forced. otherwise it will be updated only when the pointer is down
     */
    updateGizmo(force?: boolean) {
        const node = this.props.control;
        // Calculating the offsets for each scale point.
        const half = 1 / 2;
        const canvasBounds = new Rect(Number.MAX_VALUE, Number.MAX_VALUE, 0, 0);
        const localBounds = CoordinateHelper.computeLocalBounds(node);
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
            const rtt = CoordinateHelper.nodeToRTTSpace(node, nodeSpace.x, nodeSpace.y, undefined);
            const canvas = CoordinateHelper.rttToCanvasSpace(rtt.x, rtt.y);
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
            // edges, and rotate based on the rotation of the control
            scalePoint.position.x = canvas.x;
            scalePoint.position.y = canvas.y;
            scalePoint.rotation = CoordinateHelper.getRotation(node) * (180 / Math.PI);
        });
        this.setState({
            canvasBounds,
            scalePoints: [...this.state.scalePoints],
        });
    }

    private _onUp = (evt?: React.PointerEvent | PointerEvent | null) => {
        // if left is still pressed, don't release
        if (evt && (evt.buttons & 1)) {
            return;
        }
        // cleanup on pointer up
        this.setState({ scalePointDragging: -1, isRotating: false });
    };

    private _onMove = () => {
        const scene = this.props.globalState.workbench._scene;
        if (this.state.scalePointDragging !== -1) {
            const node = this.props.control;
            const inRTT = CoordinateHelper.mousePointerToRTTSpace(node, scene.pointerX, scene.pointerY);
            const inNodeSpace = CoordinateHelper.rttToLocalNodeSpace(node, inRTT.x, inRTT.y, undefined, this._storedValues);
            this._dragLocalBounds(inNodeSpace);
            this._updateNodeFromLocalBounds();
            this.props.globalState.workbench._liveGuiTextureRerender = false;
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        }
        if (this.state.isRotating) {
            const angle = Math.atan2(scene.pointerY - this._rotation.pivot.y, scene.pointerX - this._rotation.pivot.x);
            for(const control of this.props.globalState.workbench.selectedGuiNodes) {
                control.rotation += (angle - this._rotation.initialAngleToPivot);
            }
            this._rotation.initialAngleToPivot = angle;
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        }
    };

    private _rotate(x: number, y: number, centerX: number, centerY: number, angle: number) {
        return {
            x: (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle) + centerX,
            y: (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle) + centerY,
        };
    }

    private _modulo(dividend: number, divisor: number) {
        return ((dividend % divisor) + divisor) % divisor;
    }

    private _dragLocalBounds(toPosition: Vector2) {
        const scalePoint = this.state.scalePoints[this.state.scalePointDragging];
        const newBounds = this._localBounds.clone();
        if (scalePoint.horizontalPosition === ScalePointPosition.Left) {
            newBounds.left = Math.min(this._localBounds.right - 1, toPosition.x);
        }
        if (scalePoint.verticalPosition === ScalePointPosition.Left) {
            newBounds.top = Math.min(this._localBounds.bottom - 1, toPosition.y);
        }
        if (scalePoint.horizontalPosition === ScalePointPosition.Right) {
            newBounds.right = Math.max(this._localBounds.left + 1, toPosition.x);
        }
        if (scalePoint.verticalPosition === ScalePointPosition.Bottom) {
            newBounds.bottom = Math.max(this._localBounds.top + 1, toPosition.y);
        }
        // apply bounds changes to all controls 
        const edges: ["left", "top", "right", "bottom"] = ["left", "top", "right", "bottom"];
        for (const node of this.props.globalState.workbench.selectedGuiNodes) {
            const initialBounds = (node.metadata.localBounds as Rect);
            const nb = initialBounds.clone();
            // account for rotation: if other control is rotated 90 degrees
            // relative to primary control, we should modify top instead of left
            const rotationModifier = this._modulo((this.props.control.rotation - node.rotation), Math.PI * 2) / Math.PI * 2;
            edges.forEach((edge, index) => {
                const modifiedIndex = Math.round(index + rotationModifier) % 4;
                const flipSign = ((index < 2) === (modifiedIndex < 2)) ? 1 : -1;
                nb[edges[modifiedIndex]] += (newBounds[edge] - this._localBounds[edge]) * flipSign;
            });
            nb.left = Math.min(initialBounds.right - 1, nb.left);
            nb.top = Math.min(initialBounds.bottom - 1, nb.top);
            nb.right = Math.max(initialBounds.left + 1, nb.right);
            nb.bottom = Math.max(initialBounds.top + 1, nb.bottom);
            node.metadata.localBounds = nb;
        }
        this._localBounds = newBounds;
    }

    private _updateNodeFromLocalBounds() {
        const scalePoint = this.state.scalePoints[this.state.scalePointDragging];
        const left = scalePoint.horizontalPosition === ScalePointPosition.Left && scalePoint.verticalPosition !== ScalePointPosition.Center;
        const top = scalePoint.verticalPosition === ScalePointPosition.Top && scalePoint.horizontalPosition !== ScalePointPosition.Center;
        for(const selectedControl of this.props.globalState.workbench.selectedGuiNodes) {
            const width = selectedControl.metadata.localBounds.right - selectedControl.metadata.localBounds.left;
            const height = selectedControl.metadata.localBounds.bottom - selectedControl.metadata.localBounds.top;
            // calculate the center point
            const localRotation = CoordinateHelper.getRotation(selectedControl, true);
            const localScaling = CoordinateHelper.getScale(selectedControl, true);
            const absoluteCenter = (selectedControl.metadata.localBounds as Rect).center;
            const center = absoluteCenter.clone();
            // move to pivot
            center.multiplyInPlace(localScaling);
            const cosRotation = Math.cos(localRotation);
            const sinRotation = Math.sin(localRotation);
            const cosRotation180 = Math.cos(localRotation + Math.PI);
            const sinRotation180 = Math.sin(localRotation + Math.PI);
            
            const widthDelta = (selectedControl.metadata.storedValues.width - width) * 0.5;
            const heightDelta = (selectedControl.metadata.storedValues.height - height) * 0.5;
            // alignment compensation
            switch (selectedControl.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    center.x += (left ? widthDelta : -absoluteCenter.x) * cosRotation;
                    center.y += (left ? -widthDelta : absoluteCenter.x) * sinRotation;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    center.x += (left ? -widthDelta : absoluteCenter.x) * cosRotation;
                    center.y += (left ? widthDelta : -absoluteCenter.x) * sinRotation;
                    break;
            }

            switch (selectedControl.verticalAlignment) {
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
            const properties: (DimensionProperties)[] = ["left", "top", "width", "height"];
            for(const property of properties) {
                let newPixels = 0;
                switch(property) {
                    case "left":
                        newPixels = round(selectedControl.metadata.storedValues.left + rotatedCenter.x);
                        break;
                    case "top":
                        newPixels = round(selectedControl.metadata.storedValues.top + rotatedCenter.y);
                        break;
                    case "width":
                        newPixels = round(width);
                        break;
                    case "height":
                        newPixels = round(height);
                        break;
                }
                // compute real change in property
                const initialUnit = (selectedControl as any)[`_${property}`].unit;
                (selectedControl as any)[`${property}InPixels`] = newPixels;
                if (initialUnit === ValueAndUnit.UNITMODE_PERCENTAGE) {
                    CoordinateHelper.convertToPercentage(selectedControl, [property]);
                }
            }

            if (selectedControl.typeName === "Image") {
                (selectedControl as Image).autoScale = false;
            } else if (selectedControl.typeName === "TextBlock") {
                (selectedControl as TextBlock).resizeToFit = false;
            }
        }
    }

    private _beginDraggingScalePoint = (scalePointIndex: number) => {
        this.setState({ scalePointDragging: scalePointIndex });
        const node = this.props.control;
        this._localBounds = CoordinateHelper.computeLocalBounds(node);
        this._storedValues = new Rect(node.leftInPixels, node.topInPixels, node.leftInPixels + node.widthInPixels, node.topInPixels + node.heightInPixels);
        for (const node of this.props.globalState.workbench.selectedGuiNodes) {
            node.metadata.localBounds = CoordinateHelper.computeLocalBounds(node);
            node.metadata.storedValues = new Rect(node.leftInPixels, node.topInPixels, node.leftInPixels + node.widthInPixels, node.topInPixels + node.heightInPixels);
        }
    };

    private _beginRotate = () => {
        const scene = this.props.globalState.workbench._scene;
        let pivot: Vector2;
        const node = this.props.control;
        const nodeSpace = new Vector2(node.transformCenterX, node.transformCenterY);
        const rtt = CoordinateHelper.nodeToRTTSpace(node, nodeSpace.x, nodeSpace.y, undefined);
        const canvas = CoordinateHelper.rttToCanvasSpace(rtt.x, rtt.y);
        pivot = new Vector2(canvas.x, canvas.y);
        const initialAngleToPivot = Math.atan2(scene.pointerY - pivot.y, scene.pointerX - pivot.x);
        this._rotation = {
            pivot,
            initialAngleToPivot,
        }
        this.setState({isRotating: true});
    }

    render() {
        // don't render if we don't have anything selected, or if we're currently dragging
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
                        return <img className="pivot-point" src={gizmoPivotIcon} style={style} key={index} />;
                    }
                    // compute which cursor icon to use on hover
                    const angleOfCursor = (defaultScalePointRotations[index] + scalePoint.rotation);
                    const angleAdjusted = this._modulo(angleOfCursor, 360);
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
                            onPointerDown={(event) => {
                                // if left mouse button down
                                if (event.buttons & 1) {
                                    this._beginDraggingScalePoint(index);
                                }
                            }}
                            onPointerUp={this._onUp}
                            style={scaleClickAreaStyle}
                            >
                            </div>
                            <div
                                className="scale-point"
                                draggable={true}
                                onDragStart={(evt) => evt.preventDefault()}
                                onPointerDown={(event) => {
                                    if (event.buttons & 1) {
                                        this._beginDraggingScalePoint(index);
                                    }
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
